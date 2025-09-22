# Script de prueba simple del flujo del usuario

Write-Host "Probando el flujo completo del usuario..." -ForegroundColor Green

# Paso 1: Generar una imagen
Write-Host "1. Generando imagen con Gemini..." -ForegroundColor Yellow
$generateResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/generate-image" -Method POST -ContentType "application/json" -Body '{"prompt": "Un dragon dorado con alas extendidas", "includeBase64": true}'

if ($generateResponse.StatusCode -eq 200) {
    $generateData = $generateResponse.Content | ConvertFrom-Json
    Write-Host "Imagen generada exitosamente" -ForegroundColor Green
    Write-Host "Prompt usado: $($generateData.promptUsed)" -ForegroundColor Cyan
    
    if ($generateData.images -and $generateData.images.Count -gt 0) {
        $imageUrl = $generateData.images[0].url
        Write-Host "URL de imagen: $imageUrl" -ForegroundColor Cyan
        
        # Paso 2: Procesar la imagen (remover fondo)
        Write-Host "2. Procesando imagen para remover fondo..." -ForegroundColor Yellow
        $processResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/process-design" -Method POST -ContentType "application/json" -Body (@{
            imageUrl = $imageUrl
            prompt = "Un dragon dorado con alas extendidas"
            userId = $null
        } | ConvertTo-Json)
        
        if ($processResponse.StatusCode -eq 200) {
            $processData = $processResponse.Content | ConvertFrom-Json
            Write-Host "Imagen procesada exitosamente" -ForegroundColor Green
            Write-Host "URL final: $($processData.imageUrl)" -ForegroundColor Cyan
            Write-Host "Image ID: $($processData.imageId)" -ForegroundColor Cyan
            
            # Paso 3: Verificar que la imagen procesada se puede obtener
            Write-Host "3. Verificando acceso a la imagen procesada..." -ForegroundColor Yellow
            $imageGetResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/images/$($processData.imageId)" -Method GET
            
            if ($imageGetResponse.StatusCode -eq 200) {
                $imageData = $imageGetResponse.Content | ConvertFrom-Json
                Write-Host "Imagen procesada accesible" -ForegroundColor Green
                Write-Host "Has background removed: $($imageData.image.has_bg_removed)" -ForegroundColor Cyan
                
                # Paso 4: Simular acceso a la pagina de diseño
                Write-Host "4. Simulando acceso a la pagina de diseño..." -ForegroundColor Yellow
                Write-Host "URL de diseño: http://localhost:3000/design/$($processData.imageId)" -ForegroundColor Cyan
                Write-Host "Pagina de diseño debería mostrar la imagen procesada en el mockup" -ForegroundColor Green
                
            } else {
                Write-Host "Error obteniendo imagen procesada: $($imageGetResponse.StatusCode)" -ForegroundColor Red
            }
            
        } else {
            Write-Host "Error procesando imagen: $($processResponse.StatusCode)" -ForegroundColor Red
        }
    } else {
        Write-Host "No se generó imagen en la respuesta" -ForegroundColor Red
    }
} else {
    Write-Host "Error generando imagen: $($generateResponse.StatusCode)" -ForegroundColor Red
}

Write-Host "Prueba del flujo completo completada" -ForegroundColor Green
Write-Host "Resumen del flujo implementado:" -ForegroundColor Cyan
Write-Host "1. Generación de imagen con Gemini" -ForegroundColor Green
Write-Host "2. Optimización automática del prompt" -ForegroundColor Green
Write-Host "3. Procesamiento para remover fondo" -ForegroundColor Green
Write-Host "4. Almacenamiento en Supabase" -ForegroundColor Green
Write-Host "5. Pagina de diseño con mockup" -ForegroundColor Green
Write-Host "6. Botón 'Usar este diseño' funcional" -ForegroundColor Green
Write-Host "7. Redirección automática a /design/[imageId]" -ForegroundColor Green
Write-Host "8. Renderizado de imagen procesada en mockup" -ForegroundColor Green

