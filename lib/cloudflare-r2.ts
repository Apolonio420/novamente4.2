import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Configuración de Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'novamente-images'

// Función para generar nombres de archivo descriptivos
export function generateImageName(description: string, type: 'original' | 'sinfondo' | 'estampado', garment?: string, size?: string): string {
  // Limpiar y normalizar la descripción
  const cleanDescription = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
    .replace(/\s+/g, ' ') // Múltiples espacios a uno
    .trim()
    .split(' ')
    .slice(0, 2) // Solo las primeras 2 palabras
    .join('_')

  const baseName = cleanDescription || 'imagen'
  
  switch (type) {
    case 'original':
      return `${baseName}.png`
    case 'sinfondo':
      return `${baseName}_sinfondo.png`
    case 'estampado':
      const garmentName = garment ? `_${garment.replace(/\s+/g, '_').toLowerCase()}` : ''
      const sizeName = size ? `_${size}` : ''
      return `${baseName}_estampado${garmentName}${sizeName}.png`
    default:
      return `${baseName}.png`
  }
}

// Función para subir imagen a R2
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string = 'image/png'
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 año de cache
    })

    await r2Client.send(command)
    
    // Generar URL pública o firmada
    const publicUrl = await getPublicR2UrlAsync(key)
    console.log(`📤 Uploaded to R2: ${key} -> ${publicUrl}`)
    return publicUrl
  } catch (error) {
    console.error('Error uploading to R2:', error)
    throw new Error('Error subiendo imagen a Cloudflare R2')
  }
}

// Función para obtener URL firmada (temporal)
export async function getSignedR2Url(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    return await getSignedUrl(r2Client, command, { expiresIn })
  } catch (error) {
    console.error('Error getting signed URL:', error)
    throw new Error('Error obteniendo URL de imagen')
  }
}

// Función para eliminar imagen de R2
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await r2Client.send(command)
  } catch (error) {
    console.error('Error deleting from R2:', error)
    throw new Error('Error eliminando imagen de Cloudflare R2')
  }
}

// Función para obtener URL pública directa
export function getPublicR2Url(key: string): string {
  const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN
  if (publicDomain) {
    return `https://${publicDomain}/${key}`
  } else {
    // Usar endpoint directo de R2 (puede no funcionar si no está configurado para público)
    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT
    const accountId = endpoint?.match(/https:\/\/([^.]+)\.r2\.cloudflarestorage\.com/)?.[1]
    return `https://pub-${accountId}.r2.dev/${key}`
  }
}

// Función para obtener URL firmada (temporal pero funcional)
export async function getPublicR2UrlAsync(key: string): Promise<string> {
  try {
    // Intentar URL pública primero
    const publicUrl = getPublicR2Url(key)
    
    // Verificar si la URL pública funciona
    const testResponse = await fetch(publicUrl, { method: 'HEAD' })
    if (testResponse.ok) {
      return publicUrl
    }
    
    // Si no funciona, usar URL firmada
    console.log('⚠️ Public URL not accessible, using signed URL')
    return await getSignedR2Url(key, 86400) // 24 horas
  } catch (error) {
    console.log('⚠️ Error checking public URL, using signed URL')
    return await getSignedR2Url(key, 86400) // 24 horas
  }
}

export { r2Client, BUCKET_NAME }
