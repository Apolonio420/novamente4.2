# Script para probar la integración con Cloudflare R2
Write-Host "Probando integración con Cloudflare R2..." -ForegroundColor Green

# Verificar que las variables de entorno estén configuradas
$requiredVars = @(
    "CLOUDFLARE_R2_ENDPOINT",
    "CLOUDFLARE_R2_ACCESS_KEY_ID", 
    "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
    "CLOUDFLARE_R2_BUCKET_NAME",
    "CLOUDFLARE_R2_PUBLIC_DOMAIN"
)

Write-Host "Verificando variables de entorno..." -ForegroundColor Yellow
foreach ($var in $requiredVars) {
    if (-not (Get-Item "env:$var" -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Variable $var no está configurada" -ForegroundColor Red
        Write-Host "Por favor, configura las variables de Cloudflare R2 en tu archivo .env.local" -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "✅ $var configurada" -ForegroundColor Green
    }
}

Write-Host "`nProbando flujo completo con Cloudflare R2..." -ForegroundColor Green

# 1. Generar imagen
Write-Host "1. Generando imagen con Gemini..." -ForegroundColor Yellow
$generateResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/generate-image" -Method POST -ContentType "application/json" -Body '{"prompt": "Un oso bravo con gafas de sol", "includeBase64": true}'

if ($generateResponse.success) {
    Write-Host "✅ Imagen generada exitosamente" -ForegroundColor Green
    Write-Host "Prompt usado: $($generateResponse.promptUsed)" -ForegroundColor Cyan
    Write-Host "URL de imagen: $($generateResponse.images[0].url)" -ForegroundColor Cyan
    Write-Host "R2 Key: $($generateResponse.images[0].r2Key)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error generando imagen: $($generateResponse.error)" -ForegroundColor Red
    exit 1
}

# 2. Procesar imagen para remover fondo
Write-Host "`n2. Procesando imagen para remover fondo..." -ForegroundColor Yellow
$processResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/process-design" -Method POST -ContentType "application/json" -Body (@{
    imageUrl = $generateResponse.images[0].url
    prompt = "Un oso bravo con gafas de sol"
    userId = $null
} | ConvertTo-Json)

if ($processResponse.success) {
    Write-Host "✅ Imagen procesada exitosamente" -ForegroundColor Green
    Write-Host "URL final: $($processResponse.publicUrl)" -ForegroundColor Cyan
    Write-Host "Image ID: $($processResponse.imageId)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error procesando imagen: $($processResponse.error)" -ForegroundColor Red
    exit 1
}

# 3. Verificar acceso a la imagen procesada
Write-Host "`n3. Verificando acceso a la imagen procesada..." -ForegroundColor Yellow
try {
    $imageResponse = Invoke-WebRequest -Uri $processResponse.publicUrl -Method GET
    if ($imageResponse.StatusCode -eq 200) {
        Write-Host "✅ Imagen procesada accesible" -ForegroundColor Green
        Write-Host "Content-Type: $($imageResponse.Headers.'Content-Type')" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Error accediendo a imagen procesada: $($imageResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error accediendo a imagen procesada: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Generar mockup
Write-Host "`n4. Generando mockup estampado..." -ForegroundColor Yellow
$mockupResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/generate-mockup" -Method POST -ContentType "application/json" -Body (@{
    designImageUrl = $processResponse.publicUrl
    garmentType = "buzo-hoodie-unisex"
    garmentColor = "black"
    side = "front"
    size = "R3"
    prompt = "Un oso bravo con gafas de sol"
} | ConvertTo-Json)

if ($mockupResponse.success) {
    Write-Host "✅ Mockup generado exitosamente" -ForegroundColor Green
    Write-Host "URL del mockup: $($mockupResponse.publicUrl)" -ForegroundColor Cyan
    Write-Host "R2 Key: $($mockupResponse.r2Key)" -ForegroundColor Cyan
    Write-Host "Mapeo usado: $($mockupResponse.mapping.garmentType)-$($mockupResponse.mapping.garmentColor)-$($mockupResponse.mapping.side)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error generando mockup: $($mockupResponse.error)" -ForegroundColor Red
}

# 5. Verificar acceso al mockup
Write-Host "`n5. Verificando acceso al mockup..." -ForegroundColor Yellow
try {
    $mockupImageResponse = Invoke-WebRequest -Uri $mockupResponse.publicUrl -Method GET
    if ($mockupImageResponse.StatusCode -eq 200) {
        Write-Host "✅ Mockup accesible" -ForegroundColor Green
        Write-Host "Content-Type: $($mockupImageResponse.Headers.'Content-Type')" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Error accediendo al mockup: $($mockupImageResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error accediendo al mockup: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Prueba del flujo completo con Cloudflare R2 completada" -ForegroundColor Green
Write-Host "`nResumen del flujo implementado:" -ForegroundColor Yellow
Write-Host "1. Generación de imagen con Gemini → Cloudflare R2" -ForegroundColor White
Write-Host "2. Procesamiento para remover fondo → Cloudflare R2" -ForegroundColor White
Write-Host "3. Generación de mockup estampado → Cloudflare R2" -ForegroundColor White
Write-Host "4. Sistema de nomenclatura: [descripcion]_[tipo]_[talla]" -ForegroundColor White
Write-Host "5. URLs públicas accesibles desde Cloudflare R2" -ForegroundColor White



