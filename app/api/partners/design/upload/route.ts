/**
 * POST /api/partners/design/upload
 *
 * Permite al partner subir un archivo de imagen (logo propio, foto de un
 * disenio que ya tenia, etc.) y lo guarda como asset tipo "design" para
 * que pueda ser usado como estampa en mockups, igual que los disenos
 * generados con IA.
 *
 * Body: multipart/form-data con campo `file`
 * Response: { url, assetId, storageKey }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { saveDesignAsset } from '@/lib/partners/design-engine'
import { uploadFile } from '@/lib/cloudflare-r2'
import { v4 as uuidv4 } from 'uuid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
])

export async function POST(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const { tenant } = result

    const formData = await request.formData().catch(() => null)
    if (!formData) {
      return NextResponse.json({ error: 'Falta multipart/form-data' }, { status: 400 })
    }
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Falta el campo "file"' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Archivo demasiado grande (max ${MAX_BYTES / 1024 / 1024} MB)` },
        { status: 413 },
      )
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Formato no permitido. Aceptados: PNG, JPG, WEBP, SVG, GIF` },
        { status: 415 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.type === 'image/svg+xml' ? 'svg' : (file.name.split('.').pop() || 'png').toLowerCase()
    const assetId = uuidv4()
    const storageKey = `partners/${tenant.slug}/uploads/${assetId}.${ext}`

    const uploadResult = await uploadFile(buffer, storageKey, file.type)

    // Persistir como design asset (no es generado por IA pero el flow downstream lo trata igual)
    const asset = await saveDesignAsset(
      tenant.id,
      uploadResult.url,
      storageKey,
      'design',
      {
        source: 'upload',
        originalFileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      },
    )

    return NextResponse.json({
      url: uploadResult.url,
      assetId: asset?.id || assetId,
      storageKey,
    })
  } catch (error: any) {
    console.error('POST /api/partners/design/upload error:', error)
    return NextResponse.json({ error: error.message || 'Error subiendo archivo' }, { status: 500 })
  }
}
