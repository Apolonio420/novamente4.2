# Configuración de Cloudflare R2

Este documento explica cómo configurar Cloudflare R2 para el almacenamiento de imágenes en Novamente.

## 1. Crear cuenta en Cloudflare

1. Ve a [cloudflare.com](https://cloudflare.com) y crea una cuenta
2. Verifica tu email y completa el proceso de registro

## 2. Configurar R2 Object Storage

1. En el dashboard de Cloudflare, ve a **R2 Object Storage**
2. Haz clic en **Create bucket**
3. Nombra tu bucket: `novamente-images`
4. Selecciona la ubicación más cercana a tus usuarios
5. Haz clic en **Create bucket**

## 3. Obtener credenciales de API

1. Ve a **Manage R2 API tokens**
2. Haz clic en **Create API token**
3. Configura el token:
   - **Token name**: `novamente-r2-token`
   - **Permissions**: `Object:Edit` para el bucket `novamente-images`
   - **Bucket**: Selecciona `novamente-images`
4. Haz clic en **Create API token**
5. **IMPORTANTE**: Copia y guarda el **Access Key ID** y **Secret Access Key**

## 4. Configurar dominio personalizado (opcional pero recomendado)

1. En tu bucket de R2, ve a **Settings**
2. En **Custom Domains**, haz clic en **Connect Domain**
3. Agrega un subdominio como `images.tudominio.com`
4. Configura los registros DNS según las instrucciones de Cloudflare

## 5. Configurar variables de entorno

Crea o actualiza tu archivo `.env.local` con las siguientes variables:

```env
# Cloudflare R2
CLOUDFLARE_R2_ENDPOINT=https://tu-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=tu-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=tu-secret-access-key
CLOUDFLARE_R2_BUCKET_NAME=novamente-images
CLOUDFLARE_R2_PUBLIC_DOMAIN=images.tudominio.com
```

### Cómo encontrar tu Account ID:

1. En el dashboard de Cloudflare, ve a la barra lateral derecha
2. Tu **Account ID** aparece en la sección **API**

## 6. Sistema de nomenclatura

El sistema genera nombres de archivo descriptivos basados en el prompt:

- **Imagen original**: `oso_bravo.png`
- **Sin fondo**: `oso_bravo_sinfondo.png`
- **Estampado**: `oso_bravo_estampado_astra_oversize_hoodie_black_R3.png`

### Estructura de carpetas en R2:

```
novamente-images/
├── generated/
│   └── [uuid]/
│       └── [descripcion].png
├── processed/
│   └── [uuid]/
│       └── [descripcion]_sinfondo.png
└── mockups/
    └── [uuid]/
        └── [descripcion]_estampado_[prenda]_[color]_[talla].png
```

## 7. Probar la configuración

Ejecuta el script de prueba:

```powershell
.\test-cloudflare-r2.ps1
```

Este script verificará:
- ✅ Variables de entorno configuradas
- ✅ Generación de imagen → R2
- ✅ Procesamiento sin fondo → R2
- ✅ Generación de mockup → R2
- ✅ URLs públicas accesibles

## 8. Ventajas de Cloudflare R2

- **Costo**: Más económico que AWS S3
- **Velocidad**: CDN global de Cloudflare
- **Simplicidad**: API compatible con S3
- **Escalabilidad**: Sin límites de almacenamiento
- **Seguridad**: Encriptación en tránsito y reposo

## 9. Monitoreo y mantenimiento

- Revisa el uso de almacenamiento en el dashboard de R2
- Configura alertas de uso si es necesario
- Considera políticas de retención para imágenes temporales
- Monitorea los costos en la sección **Billing**

## 10. Troubleshooting

### Error: "Bucket not found"
- Verifica que `CLOUDFLARE_R2_BUCKET_NAME` coincida exactamente con el nombre del bucket
- Asegúrate de que el bucket existe en tu cuenta de Cloudflare

### Error: "Access denied"
- Verifica que las credenciales de API sean correctas
- Asegúrate de que el token tenga permisos `Object:Edit`

### Error: "Invalid endpoint"
- Verifica que `CLOUDFLARE_R2_ENDPOINT` use el formato correcto
- Debe ser: `https://[account-id].r2.cloudflarestorage.com`

### URLs no accesibles
- Verifica que `CLOUDFLARE_R2_PUBLIC_DOMAIN` esté configurado correctamente
- Si usas dominio personalizado, verifica la configuración DNS



