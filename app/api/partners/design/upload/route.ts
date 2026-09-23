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
import sharp from 'sharp'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { saveDesignAsset } from '@/lib/partners/design-engine'
import { uploadFile } from '@/lib/cloudflare-r2'
import { knockoutBackground, hasRealAlpha } from '@/lib/mockup/perfect-stamp'
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
    const auth = await requireTenantPermission(request, 'designs:write')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant

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

    // Decodificar con sharp: rechaza archivos corruptos ANTES de subirlos —
    // un PNG/JPG roto pasaba el filtro de content-type pero rompía el
    // compositor recién al momento de generar el mockup (Fase 3 pieza B).
    // SVG no lo decodifica sharp por rasterizacion de icc/metadata igual, pero
    // igual lo intenta — si falla, cae al mismo warning generico via catch.
    let width = 0, height = 0, hasAlpha = false
    if (file.type !== 'image/svg+xml' && file.type !== 'image/gif') {
      try {
        const meta = await sharp(buffer).metadata()
        if (!meta.width || !meta.height) throw new Error('sin dimensiones')
        width = meta.width
        height = meta.height
        hasAlpha = !!meta.hasAlpha
      } catch (e: any) {
        return NextResponse.json(
          { error: `El archivo parece estar corrupto o no se pudo leer como imagen: ${e.message || e}` },
          { status: 422 },
        )
      }
    }

    const warnings: string[] = []
    if (width && height && Math.min(width, height) < 1000) {
      warnings.push('Tu diseño tiene poca resolución: se puede ver pixelado en la prenda.')
    }

    // ¿Ya viene con TRANSPARENCIA REAL (no solo un canal alpha opaco)? Un PNG
    // puede traer canal alpha y aun así estar 100% opaco (alpha=255 en todo
    // el cuadro) — `hasAlpha` de sharp NO alcanza para decidir esto, hace
    // falta `hasRealAlpha` (mismo criterio que perfect-stamp.ts).
    let alreadyTransparent = false
    if (hasAlpha) {
      try { alreadyTransparent = await hasRealAlpha(buffer) } catch { /* best-effort */ }
    }

    // ¿Se le puede sacar el fondo con el knockout determinístico (mismo que
    // usa el compositor, lib/mockup/compose.ts)? Si ya viene con alpha real
    // no hace falta, y si no es "bg removible" tampoco (full-bleed).
    let bgRemovable = alreadyTransparent
    if (!bgRemovable && file.type !== 'image/svg+xml') {
      try {
        const cut = await knockoutBackground(buffer)
        bgRemovable = await hasRealAlpha(cut)
      } catch {
        // best-effort: si falla, se deja bgRemovable en false y se avisa abajo
      }
    }
    if (!alreadyTransparent && !bgRemovable) {
      warnings.push('Tu diseño tiene fondo: subilo en PNG sin fondo para que quede prolijo.')
    }

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
      width,
      height,
      hasAlpha,
      bgRemovable,
      warnings,
    })
  } catch (error: any) {
    console.error('POST /api/partners/design/upload error:', error)
    return NextResponse.json({ error: error.message || 'Error subiendo archivo' }, { status: 500 })
  }
}
