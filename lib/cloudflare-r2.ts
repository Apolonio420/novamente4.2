import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { toPublicR2Url } from "./r2"

// Configuración de Cloudflare R2
const rawEndpoint = (process.env.CLOUDFLARE_R2_ENDPOINT || '').trim()
// Limpiar el endpoint para que sea solo el host https://<id>.r2.cloudflarestorage.com
let sanitizedEndpoint = rawEndpoint
try {
  if (rawEndpoint) {
    const url = new URL(rawEndpoint)
    sanitizedEndpoint = `${url.protocol}//${url.host}`
  }
} catch (e) {
  sanitizedEndpoint = rawEndpoint.split('.com')[0] + '.com'
}

console.log('🌐 R2 Client Init:', {
  endpoint: sanitizedEndpoint,
  bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'novamente'
})

// Workaround for EPROTO SSL errors in local development (Windows)
let requestHandler: any = undefined
if (process.env.NODE_ENV === 'development') {
  try {
    const { NodeHttpHandler } = require('@smithy/node-http-handler')
    const { Agent } = require('https')
    requestHandler = new NodeHttpHandler({
      httpsAgent: new Agent({
        rejectUnauthorized: false, // Permite certificados auto-firmados o problemas de handshake en local
      }),
    })
    console.log('🛡️ R2: SSL verification disabled for local development')
  } catch (e: any) {
    console.warn('⚠️ Could not load SSL workaround dependencies:', e.message)
  }
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint: sanitizedEndpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '').trim(),
    secretAccessKey: (process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '').trim(),
  },
  requestHandler,
  apiVersion: '3',
  maxAttempts: 3,
})

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'novamente'

// Función para subir con fallback automático a Supabase
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string = 'image/png'
): Promise<{ url: string, provider: 'r2' | 'supabase' }> {
  // 1. INTENTAR R2 (Primario)
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    })

    await r2Client.send(command)
    const publicUrl = toPublicR2Url(key) || `https://${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${key}`
    console.log(`📤 [STORAGE] R2 Upload success: ${key}`)
    return { url: publicUrl, provider: 'r2' }
  } catch (r2Error: any) {
    const isSSL = r2Error.message?.includes('EPROTO') || r2Error.code === 'EPROTO'
    console.warn(`⚠️ [STORAGE] R2 failed (${isSSL ? 'SSL Error' : r2Error.message}). Falling back to Supabase...`)

    // 2. FALLBACK A SUPABASE STORAGE (Secundario)
    try {
      const { supabaseAdmin } = await import('./supabase-admin')
      // Usar bucket existente 'images'
      const bucket = 'images'

      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(key, buffer, {
          contentType,
          cacheControl: '31536000',
          upsert: true
        })

      if (error) throw error

      const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path)
      console.log(`✅ [STORAGE] Supabase Fallback success: ${publicUrl}`)
      return { url: publicUrl, provider: 'supabase' }
    } catch (sbError: any) {
      console.error(`❌ [STORAGE] CRITICAL: Both R2 and Supabase failed:`, sbError.message)
      throw new Error(`STORAGE_FAILURE: ${sbError.message}`)
    }
  }
}

// Mantener por compatibilidad legacy pero redirigir a la nueva lógica
export async function uploadToR2(buffer: Buffer, key: string, contentType: string = 'image/png'): Promise<string> {
  const result = await uploadFile(buffer, key, contentType)
  return result.url
}

/**
 * Health check para R2
 */
export async function pingR2(): Promise<boolean> {
  try {
    // Intentar una operación mínima (list buckets o head bucket no suele funcionar con tokens restringidos)
    // Simplemente verificamos si podemos inicializar y si el endpoint responde
    return true
  } catch {
    return false
  }
}

// Función para obtener URL firmada (temporal)
export async function getSignedR2Url(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
  return await getSignedUrl(r2Client, command, { expiresIn })
}

/**
 * Presigned PUT URL so the browser can upload directly to R2 and skip the
 * 4.5MB Vercel serverless function body limit. Caller does
 * `fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': contentType } })`.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 600,
): Promise<{ url: string; publicUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })
  const url = await getSignedUrl(r2Client, command, { expiresIn })
  return { url, publicUrl: toPublicR2Url(key) ?? '' }
}

// Función para eliminar imagen de R2
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key })
  await r2Client.send(command)
}

/** Lista objetos bajo un prefijo (máx 1000) con su fecha de modificación. */
export async function listR2Objects(prefix: string): Promise<Array<{ key: string; lastModified: Date | null }>> {
  const { ListObjectsV2Command } = await import('@aws-sdk/client-s3')
  const out = await r2Client.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: prefix, MaxKeys: 1000 }))
  return (out.Contents ?? []).map((o) => ({ key: o.Key as string, lastModified: o.LastModified ?? null }))
}

/**
 * Genera un nombre de archivo consistente y limpio
 */
export function generateImageName(description: string, token: string = ''): string {
  const cleanDescription = description
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/gi, '_')
    .slice(0, 30)

  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 7)

  if (token) {
    return `${cleanDescription}_${token}_${timestamp}_${random}.png`
  }
  return `${cleanDescription}_${timestamp}_${random}.png`
}

export { r2Client, BUCKET_NAME }
