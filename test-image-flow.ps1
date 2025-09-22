# Script de prueba para el flujo completo de generación y procesamiento de imágenes

Write-Host "🎨 Probando el flujo completo de generación de imágenes..." -ForegroundColor Green

# Paso 1: Generar una imagen
Write-Host "`n1. Generando imagen con Gemini..." -ForegroundColor Yellow
$generateResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/generate-image" -Method POST -ContentType "application/json" -Body '{"prompt": "Un león majestuoso con corona dorada", "includeBase64": true}'

if ($generateResponse.StatusCode -eq 200) {
    $generateData = $generateResponse.Content | ConvertFrom-Json
    Write-Host "✅ Imagen generada exitosamente" -ForegroundColor Green
    Write-Host "Prompt usado: $($generateData.promptUsed)" -ForegroundColor Cyan
    
    if ($generateData.images -and $generateData.images.Count -gt 0) {
        Write-Host "URL de imagen: $($generateData.images[0].url)" -ForegroundColor Cyan
        
        # Paso 2: Procesar la imagen (remover fondo)
        Write-Host "`n2. Procesando imagen para remover fondo..." -ForegroundColor Yellow
        $processResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/process-design" -Method POST -ContentType "application/json" -Body (@{
            imageUrl = $generateData.images[0].url
        } | ConvertTo-Json)
        
        if ($processResponse.StatusCode -eq 200) {
            $processData = $processResponse.Content | ConvertFrom-Json
            Write-Host "✅ Imagen procesada exitosamente" -ForegroundColor Green
            Write-Host "URL final: $($processData.imageUrl)" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Error procesando imagen: $($processResponse.StatusCode)" -ForegroundColor Red
            Write-Host "Respuesta: $($processResponse.Content)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ No se generó imagen en la respuesta" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Error generando imagen: $($generateResponse.StatusCode)" -ForegroundColor Red
    Write-Host "Respuesta: $($generateResponse.Content)" -ForegroundColor Red
}

Write-Host "`n🏁 Prueba completada" -ForegroundColor Green
