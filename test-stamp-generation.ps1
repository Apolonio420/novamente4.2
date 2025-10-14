# Script para probar la generación de estampados
Write-Host "🎨 Probando generación de estampados..." -ForegroundColor Cyan

# 1. Generar una imagen primero
Write-Host "`n1️⃣ Generando imagen de prueba..." -ForegroundColor Yellow
$generateResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/generate-image" -Method POST -ContentType "application/json" -Body '{
  "prompt": "Un león majestuoso con corona dorada",
  "includeBase64": true
}'

if ($generateResponse.images -and $generateResponse.images.Count -gt 0) {
    $imageUrl = $generateResponse.images[0].url
    Write-Host "✅ Imagen generada: $imageUrl" -ForegroundColor Green
} else {
    Write-Host "❌ Error generando imagen" -ForegroundColor Red
    exit 1
}

# 2. Procesar la imagen para remover fondo
Write-Host "`n2️⃣ Removiendo fondo de la imagen..." -ForegroundColor Yellow
$processResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/process-design" -Method POST -ContentType "application/json" -Body @{
    imageUrl = $imageUrl
    prompt = "Un león majestuoso con corona dorada"
} | ConvertTo-Json

$processData = $processResponse | ConvertFrom-Json
if ($processData.success -and $processData.publicUrl) {
    $processedImageUrl = $processData.publicUrl
    Write-Host "✅ Fondo removido: $processedImageUrl" -ForegroundColor Green
} else {
    Write-Host "❌ Error removiendo fondo" -ForegroundColor Red
    Write-Host "Response: $processResponse" -ForegroundColor Red
    exit 1
}

# 3. Generar estampado con diferentes tamaños
Write-Host "`n3️⃣ Generando estampados..." -ForegroundColor Yellow

$stampSizes = @("R1", "R2", "R3")
foreach ($size in $stampSizes) {
    Write-Host "`n🎨 Generando estampado $size..." -ForegroundColor Cyan
    
    $stampBody = @{
        designImageUrl = $processedImageUrl
        garmentType = "hoodie"
        garmentVariant = "oversize"
        garmentColor = "black"
        side = "front"
        stampSize = $size
        stampPosition = if ($size -eq "R1") { "center" } else { $null }
        prompt = "Estampado de león $size"
    } | ConvertTo-Json

    try {
        $stampResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/generate-stamp" -Method POST -ContentType "application/json" -Body $stampBody
        if ($stampResponse.success -and $stampResponse.publicUrl) {
            Write-Host "✅ Estampado $size generado: $($stampResponse.publicUrl)" -ForegroundColor Green
        } else {
            Write-Host "❌ Error generando estampado $size" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error en estampado $size : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 4. Probar con t-shirt
Write-Host "`n4️⃣ Probando con T-Shirt..." -ForegroundColor Yellow

$tshirtStampBody = @{
    designImageUrl = $processedImageUrl
    garmentType = "tshirt"
    garmentVariant = "classic"
    garmentColor = "white"
    side = "front"
    stampSize = "R2"
    prompt = "Estampado de león en t-shirt"
} | ConvertTo-Json

try {
    $tshirtResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/generate-stamp" -Method POST -ContentType "application/json" -Body $tshirtStampBody
    if ($tshirtResponse.success -and $tshirtResponse.publicUrl) {
        Write-Host "✅ Estampado T-Shirt generado: $($tshirtResponse.publicUrl)" -ForegroundColor Green
    } else {
        Write-Host "❌ Error generando estampado T-Shirt" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error en estampado T-Shirt: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Prueba de estampados completada!" -ForegroundColor Green

