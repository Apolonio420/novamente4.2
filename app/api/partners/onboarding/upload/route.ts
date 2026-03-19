import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const BUCKET = 'partner-assets'

// Public upload endpoint for onboarding wizard (no auth required)
// Rate limited by the global rate limiter
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'onboarding' // logo, banner, onboarding
    const sessionId = (formData.get('sessionId') as string) || 'unknown'

    if (!file) {
      return NextResponse.json({ error: 'Se requiere un archivo' }, { status: 400 })
    }

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

    const ext = file.name.split('.').pop() || 'png'
    const filename = `onboarding/${sessionId}/${type}/${Date.now()}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Onboarding upload error:', uploadError)
      return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filename)

    return NextResponse.json({
      url: urlData.publicUrl,
      key: filename,
    })
  } catch (error) {
    console.error('POST /api/partners/onboarding/upload error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
