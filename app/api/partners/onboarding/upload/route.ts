import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const maxDuration = 30

/**
 * Upload logo or banner during partner onboarding.
 * Accepts FormData with: file, type ('logo' | 'banner'), sessionId
 * Stores in Supabase Storage under partner-assets/<sessionId>/<type>/
 * Returns the public URL.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'logo'
    const sessionId = (formData.get('sessionId') as string) || 'unknown'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Read file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Determine file extension
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const timestamp = Date.now()
    const storagePath = `onboarding/${sessionId}/${type}/${timestamp}.${ext}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('partner-assets')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('partner-assets')
      .getPublicUrl(storagePath)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('Upload endpoint error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
