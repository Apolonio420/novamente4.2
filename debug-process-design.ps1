# Script de debug para el endpoint de procesamiento de diseño

Write-Host "Debugging process-design endpoint..." -ForegroundColor Green

$imageUrl = "https://fvsjvvyohaarivametxq.supabase.co/storage/v1/object/public/images/generated/18b0aa79-a90e-492e-b64c-fc5cbd5250df.png"

Write-Host "1. Verificando que la imagen existe..." -ForegroundColor Yellow
try {
    $imageTest = Invoke-WebRequest -Uri $imageUrl -Method HEAD
    Write-Host "Imagen accesible: $($imageTest.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Error accediendo a la imagen: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "2. Probando endpoint con logging..." -ForegroundColor Yellow
$body = @{
    imageUrl = $imageUrl
    prompt = "Test prompt"
    userId = "test-user"
} | ConvertTo-Json

Write-Host "Body: $body" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/process-design" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Respuesta exitosa: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "Error en endpoint: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}

Write-Host "Debug completado" -ForegroundColor Green