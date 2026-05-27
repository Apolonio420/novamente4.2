import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getDesignUploadLimit } from '@/lib/partners/plan-limits'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const DESIGN_UPLOAD_TYPES = ['image/png', 'image/svg+xml']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const DESIGN_MAX_SIZE = 10 * 1024 * 1024 // 10MB for design uploads
const BUCKET = 'partner-assets'

export async function POST(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'other'
    // source='uploaded' signals a partner-uploaded design (vs 'ai_generated')
    const source = (formData.get('source') as string) === 'uploaded' ? 'uploaded' : 'ai_generated'

    if (!file) {
      return NextResponse.json({ error: 'Se requiere un archivo' }, { status: 400 })
    }

    // For design uploads: enforce PNG/SVG only and 10MB limit
    if (source === 'uploaded' && type === 'design') {
      if (!DESIGN_UPLOAD_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Solo PNG o SVG. Otros formatos no están permitidos para diseños.' },
          { status: 400 }
        )
      }
      if (file.size > DESIGN_MAX_SIZE) {
        const mb = (file.size / 1024 / 1024).toFixed(1)
        return NextResponse.json(
          { error: `Tu archivo pesa ${mb} MB, el máximo es 10 MB.` },
          { status: 400 }
        )
      }

      // Check plan-based upload limit
      const db = supabaseAdmin as any
      const { count } = await db
        .from('partner_assets')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', result.tenant.id)
        .eq('type', 'design')
        .eq('source', 'uploaded')

      const limit = getDesignUploadLimit(result.tenant.plan)
      if (limit !== Infinity && (count ?? 0) >= limit) {
        const planLabel = result.tenant.plan.charAt(0).toUpperCase() + result.tenant.plan.slice(1)
        return NextResponse.json(
          {
            error: `Llegaste al límite de tu plan (${limit} diseños en ${planLabel}). Eliminá uno o subí a Growth para hasta 100.`,
            limitReached: true,
          },
          { status: 403 }
        )
      }
    } else {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o SVG' },
          { status: 400 }
        )
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: 'El archivo es demasiado grande. Máximo 5MB' },
          { status: 400 }
        )
      }
    }

    const ext = file.name.split('.').pop() || 'png'
    const filename = `${result.tenant.id}/${type}/${Date.now()}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Error al subir el archivo' },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filename)

    // Save asset record — design uploads use status='active' so they appear in design-library
    const db2 = supabaseAdmin as any
    await db2.from('partner_assets').insert({
      tenant_id: result.tenant.id,
      type,
      status: source === 'uploaded' && type === 'design' ? 'active' : 'uploaded',
      source,
      storage_key: filename,
      public_url: urlData.publicUrl,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    })

    return NextResponse.json({
      url: urlData.publicUrl,
      key: filename,
    })
  } catch (error) {
    console.error('POST /api/partners/upload error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
