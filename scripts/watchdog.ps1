# Novamente Watchdog — Event-driven error detection + Claude Code auto-fix
# =========================================================================
# Monitors for significant events and sends them to Claude Code for analysis.
# Daily summary at 17:00 via Telegram.
#
# Events monitored:
# - Git push/deploy failures (post-push hook)
# - TypeScript errors on file save (tsc --noEmit, debounced)
# - Build failures (next build)
# - Test failures (vitest)
# - Pending bug reports from partner assistant (polls DB)
# - Pending super action requests (polls DB)
#
# Usage: .\scripts\watchdog.ps1
# Auto-start: copy watchdog-startup.vbs to Windows Startup folder

param(
    [string]$ProjectDir = "C:\Users\vwnrv\OneDrive\Documentos\chatbot\novamente4.2",
    [string]$TelegramToken = "",  # Set via env: $env:TELEGRAM_BOT_TOKEN_OPS
    [string]$TelegramChatId = "", # Set via env: $env:TELEGRAM_CHAT_ID_OPS
    [int]$PollIntervalSeconds = 300,  # Check for pending requests every 5 min
    [int]$DailySummaryHour = 17        # Send daily summary at 5 PM
)

# --- Config ---
$TOKEN = if ($TelegramToken) { $TelegramToken } else { $env:TELEGRAM_BOT_TOKEN_OPS }
$CHAT_ID = if ($TelegramChatId) { $TelegramChatId } else { $env:TELEGRAM_CHAT_ID_OPS }
$LOG_FILE = "$ProjectDir\scripts\.watchdog-log.txt"
$SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
$SUPABASE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY
$DAILY_SENT = $false
$ERROR_COUNT = 0
$FIX_COUNT = 0
$SKIP_COUNT = 0

# --- Helpers ---

function Log {
    param([string]$Message, [string]$Color = "White")
    $ts = Get-Date -Format "HH:mm:ss"
    Write-Host "[$ts] $Message" -ForegroundColor $Color
    Add-Content -Path $LOG_FILE -Value "[$ts] $Message" -ErrorAction SilentlyContinue
}

function Send-Telegram {
    param([string]$Message)
    if (-not $TOKEN -or -not $CHAT_ID) { return }
    $uri = "https://api.telegram.org/bot$TOKEN/sendMessage"
    $body = @{ chat_id = $CHAT_ID; text = $Message; parse_mode = "Markdown" }
    try {
        Invoke-RestMethod -Uri $uri -Method Post -Body $body -ErrorAction SilentlyContinue | Out-Null
    } catch {
        Log "Telegram send failed: $_" "Red"
    }
}

function Invoke-ClaudeCode {
    param([string]$Prompt, [string]$Label = "task")
    Log "Sending to Claude Code: $Label" "Yellow"

    $result = $Prompt | claude --print --dangerously-skip-permissions 2>&1 | Out-String

    if ($LASTEXITCODE -eq 0) {
        Log "Claude Code completed: $Label" "Green"
        $script:FIX_COUNT++
        return @{ success = $true; output = $result }
    } else {
        Log "Claude Code failed: $Label" "Red"
        return @{ success = $false; output = $result }
    }
}

function Run-TypeCheck {
    Log "Running tsc --noEmit..." "Gray"
    Set-Location $ProjectDir
    $output = & npx tsc --noEmit 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        return @{ hasErrors = $true; output = $output; type = "TypeScript" }
    }
    return @{ hasErrors = $false; output = ""; type = "TypeScript" }
}

function Run-Build {
    Log "Running build check..." "Gray"
    Set-Location $ProjectDir
    $output = & npx next build 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        $lines = $output -split "`n" | Select-Object -Last 60
        return @{ hasErrors = $true; output = ($lines -join "`n"); type = "Build" }
    }
    return @{ hasErrors = $false; output = ""; type = "Build" }
}

function Run-Tests {
    Log "Running tests..." "Gray"
    Set-Location $ProjectDir
    $output = & npx vitest run 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        $lines = $output -split "`n" | Select-Object -Last 40
        return @{ hasErrors = $true; output = ($lines -join "`n"); type = "Tests" }
    }
    return @{ hasErrors = $false; output = ""; type = "Tests" }
}

function Check-PendingRequests {
    if (-not $SUPABASE_URL -or -not $SUPABASE_KEY) { return @() }

    $headers = @{
        "apikey" = $SUPABASE_KEY
        "Authorization" = "Bearer $SUPABASE_KEY"
        "Content-Type" = "application/json"
    }

    $pending = @()

    # Check bug reports
    try {
        $bugUrl = "$SUPABASE_URL/rest/v1/bug_reports?status=eq.new&select=*&limit=5"
        $bugs = Invoke-RestMethod -Uri $bugUrl -Headers $headers -Method Get -ErrorAction SilentlyContinue
        if ($bugs) {
            foreach ($bug in $bugs) {
                $pending += @{
                    type = "bug_report"
                    id = $bug.id
                    description = $bug.description
                    errorMessage = $bug.error_message
                    errorStack = $bug.error_stack
                    sourceUrl = $bug.source_url
                    screenshotUrl = $bug.screenshot_url
                }
            }
        }
    } catch {
        Log "Failed to check bug reports: $_" "Red"
    }

    # Check super action requests
    try {
        $actionUrl = "$SUPABASE_URL/rest/v1/super_action_requests?status=eq.pending&select=*&limit=5"
        $actions = Invoke-RestMethod -Uri $actionUrl -Headers $headers -Method Get -ErrorAction SilentlyContinue
        if ($actions) {
            foreach ($action in $actions) {
                $pending += @{
                    type = "super_action"
                    id = $action.id
                    actionType = $action.action_type
                    description = $action.description
                    imageUrls = $action.image_urls
                    tenantId = $action.tenant_id
                }
            }
        }
    } catch {
        Log "Failed to check super actions: $_" "Red"
    }

    return $pending
}

function Update-RequestStatus {
    param([string]$Table, [string]$Id, [string]$Status, [string]$ResultSummary = "")
    if (-not $SUPABASE_URL -or -not $SUPABASE_KEY) { return }

    $headers = @{
        "apikey" = $SUPABASE_KEY
        "Authorization" = "Bearer $SUPABASE_KEY"
        "Content-Type" = "application/json"
        "Prefer" = "return=minimal"
    }

    $body = @{ status = $Status; updated_at = (Get-Date -Format "o") }
    if ($ResultSummary) { $body["result_summary"] = $ResultSummary }

    try {
        $url = "$SUPABASE_URL/rest/v1/$Table`?id=eq.$Id"
        Invoke-RestMethod -Uri $url -Headers $headers -Method Patch -Body ($body | ConvertTo-Json) -ErrorAction SilentlyContinue | Out-Null
    } catch {
        Log "Failed to update $Table/$Id status: $_" "Red"
    }
}

function Process-BugReport {
    param($Bug)
    Log "Processing bug report: $($Bug.id)" "Cyan"
    $script:ERROR_COUNT++

    Update-RequestStatus -Table "bug_reports" -Id $Bug.id -Status "analyzing"

    $prompt = @"
[WATCHDOG - BUG REPORT] id=$($Bug.id)
Proyecto: novamente4.2
Path: $ProjectDir

Un partner reporto este problema:
Descripcion: $($Bug.description)
Error: $($Bug.errorMessage)
Stack: $($Bug.errorStack)
URL: $($Bug.sourceUrl)
Screenshot: $($Bug.screenshotUrl)

INSTRUCCIONES:
1. Analiza si el error es REAL revisando el codigo en el proyecto
2. Si NO es un bug real (error del usuario, feature no implementada, etc), responde "NOT_A_BUG: [razon]"
3. Si ES un bug real, corregilo con cambios minimos
4. Despues de corregir, corre npx tsc --noEmit para verificar que no rompiste nada
5. Si el fix es exitoso, corre npx next build para verificar build
6. NO hagas cambios innecesarios, NO refactorices, NO agregues features
7. Si el fix requiere cambios en la DB o env vars, responde "NEEDS_MANUAL: [que se necesita]"
"@

    $result = Invoke-ClaudeCode -Prompt $prompt -Label "bug-$($Bug.id)"

    if ($result.success) {
        if ($result.output -match "NOT_A_BUG") {
            Update-RequestStatus -Table "bug_reports" -Id $Bug.id -Status "not_a_bug" -ResultSummary $result.output.Substring(0, [Math]::Min(500, $result.output.Length))
            Send-Telegram "Bug #$($Bug.id.Substring(0,8)): No es un bug. $($result.output.Substring(0, [Math]::Min(200, $result.output.Length)))"
        } elseif ($result.output -match "NEEDS_MANUAL") {
            Update-RequestStatus -Table "bug_reports" -Id $Bug.id -Status "wont_fix" -ResultSummary $result.output.Substring(0, [Math]::Min(500, $result.output.Length))
            Send-Telegram "Bug #$($Bug.id.Substring(0,8)): Requiere intervencion manual."
        } else {
            Update-RequestStatus -Table "bug_reports" -Id $Bug.id -Status "fixed" -ResultSummary "Auto-fixed by watchdog"
            Send-Telegram "Bug #$($Bug.id.Substring(0,8)): Corregido automaticamente."
        }
    } else {
        Update-RequestStatus -Table "bug_reports" -Id $Bug.id -Status "wont_fix" -ResultSummary "Claude Code failed to process"
        Send-Telegram "Bug #$($Bug.id.Substring(0,8)): Claude Code no pudo procesar. Revisar manualmente."
    }
}

function Process-SuperAction {
    param($Action)
    Log "Processing super action: $($Action.id) ($($Action.actionType))" "Cyan"

    Update-RequestStatus -Table "super_action_requests" -Id $Action.id -Status "in_progress"

    $imageInfo = if ($Action.imageUrls -and $Action.imageUrls.Count -gt 0) {
        "Imagenes adjuntas: $($Action.imageUrls -join ', ')"
    } else { "Sin imagenes adjuntas" }

    $prompt = @"
[WATCHDOG - SUPER ACTION] id=$($Action.id)
Proyecto: novamente4.2
Path: $ProjectDir
Tipo: $($Action.actionType)
Tenant: $($Action.tenantId)

Descripcion del partner:
$($Action.description)

$imageInfo

INSTRUCCIONES:
1. Ejecuta la accion solicitada con cambios minimos y precisos
2. Si es storefront_edit: modifica solo los archivos del storefront del partner
3. Si es catalog_generation: genera los productos programaticamente
4. Si es custom: analiza que se pide y ejecuta si es razonable
5. Despues de hacer cambios, corre npx tsc --noEmit y npx next build para verificar
6. Si la accion no es posible o es peligrosa, responde "CANNOT_DO: [razon]"
7. NO hagas deploy automatico para super actions — solo haz los cambios
"@

    $result = Invoke-ClaudeCode -Prompt $prompt -Label "action-$($Action.id)"

    if ($result.success -and $result.output -notmatch "CANNOT_DO") {
        Update-RequestStatus -Table "super_action_requests" -Id $Action.id -Status "completed" -ResultSummary "Completed by watchdog"
        Send-Telegram "Super Action #$($Action.id.Substring(0,8)) ($($Action.actionType)): Completada."
    } else {
        $summary = if ($result.output -match "CANNOT_DO") { "Cannot do: " + $result.output.Substring(0, [Math]::Min(300, $result.output.Length)) } else { "Failed" }
        Update-RequestStatus -Table "super_action_requests" -Id $Action.id -Status "failed" -ResultSummary $summary
        Send-Telegram "Super Action #$($Action.id.Substring(0,8)): No se pudo completar. Revisar."
    }
}

function Send-DailySummary {
    $ts = Get-Date -Format "dd/MM/yyyy"
    $msg = @"
*Novamente Watchdog — Resumen Diario*
Fecha: $ts

Errores detectados: $ERROR_COUNT
Fixes aplicados: $FIX_COUNT
Omitidos/manuales: $SKIP_COUNT

Estado: $(if ($ERROR_COUNT -eq 0) { 'Todo limpio' } elseif ($FIX_COUNT -ge $ERROR_COUNT) { 'Todos los errores resueltos' } else { 'Hay items pendientes' })
"@
    Send-Telegram $msg
    Log "Daily summary sent" "Green"

    # Reset counters
    $script:ERROR_COUNT = 0
    $script:FIX_COUNT = 0
    $script:SKIP_COUNT = 0
}

# === MAIN LOOP ===

Log "Watchdog starting for: $ProjectDir" "Cyan"
Log "Poll interval: ${PollIntervalSeconds}s | Daily summary at: ${DailySummaryHour}:00" "Gray"

if (-not $TOKEN -or -not $CHAT_ID) {
    Log "WARNING: Telegram not configured. Set TELEGRAM_BOT_TOKEN_OPS and TELEGRAM_CHAT_ID_OPS" "Yellow"
}

Send-Telegram "Novamente Watchdog iniciado para novamente4.2"

while ($true) {
    $now = Get-Date

    # --- Daily summary at configured hour ---
    if ($now.Hour -eq $DailySummaryHour -and -not $DAILY_SENT) {
        Send-DailySummary
        $DAILY_SENT = $true
    }
    if ($now.Hour -ne $DailySummaryHour) {
        $DAILY_SENT = $false
    }

    # --- Check for pending requests in DB ---
    $pending = Check-PendingRequests

    if ($pending.Count -gt 0) {
        Log "Found $($pending.Count) pending request(s)" "Cyan"

        foreach ($req in $pending) {
            switch ($req.type) {
                "bug_report" { Process-BugReport -Bug $req }
                "super_action" { Process-SuperAction -Action $req }
            }
        }
    }

    # --- Quick health check (TSC only, fast) ---
    $tsc = Run-TypeCheck
    if ($tsc.hasErrors) {
        $script:ERROR_COUNT++
        Log "TypeScript errors detected — sending to Claude Code" "Red"

        $prompt = @"
[WATCHDOG - TSC ERRORS]
Proyecto: novamente4.2
Path: $ProjectDir

Se detectaron errores de TypeScript:

$($tsc.output)

INSTRUCCIONES:
1. Corregí SOLO los errores de TypeScript reportados
2. Cambios minimos, no refactorices
3. Despues de corregir, corre npx tsc --noEmit para verificar
4. Si todos pasan, responde "FIXED: [cantidad] errores corregidos"
5. Si algun error no se puede arreglar sin contexto adicional, responde "NEEDS_MANUAL: [detalle]"
"@

        $result = Invoke-ClaudeCode -Prompt $prompt -Label "tsc-errors"

        if ($result.success -and $result.output -match "FIXED") {
            Send-Telegram "Watchdog: Errores TypeScript corregidos automaticamente."
        } elseif ($result.output -match "NEEDS_MANUAL") {
            $script:SKIP_COUNT++
            Send-Telegram "Watchdog: Errores TypeScript requieren intervencion manual."
        }
    } else {
        Log "TSC: clean" "Green"
    }

    # --- Sleep until next poll ---
    Log "Next check in ${PollIntervalSeconds}s..." "Gray"
    Start-Sleep -Seconds $PollIntervalSeconds
}
