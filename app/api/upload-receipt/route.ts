import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-admin'
import { uploadToR2 } from '@/lib/cloudflare-r2'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const orderId = formData.get('orderId') as string
    const customerEmail = formData.get('customerEmail') as string

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    if (!orderId || !customerEmail) {
      return NextResponse.json({ error: 'Faltan datos del pedido' }, { status: 400 })
    }

    // Validar tipo de archivo
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'application/pdf'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WebP) y PDFs' 
      }, { status: 400 })
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'El archivo es demasiado grande. Máximo 10MB' 
      }, { status: 400 })
    }

    console.log('📄 Subiendo comprobante:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      orderId,
      customerEmail
    })

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `receipts/${orderId}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    // Subir archivo a R2
    const fileBuffer = await file.arrayBuffer()
    const uploadResult = await uploadToR2(
      uniqueFileName,
      Buffer.from(fileBuffer),
      file.type
    )

    if (!uploadResult.success) {
      console.error('❌ Error subiendo archivo a R2:', uploadResult.error)
      return NextResponse.json({ 
        error: 'Error subiendo archivo' 
      }, { status: 500 })
    }

    console.log('✅ Archivo subido a R2:', uploadResult.url)

    // Guardar información en la base de datos
    const supabase = createClient()
    const { data, error } = await supabase
      .from('receipts')
      .insert({
        order_id: orderId,
        customer_email: customerEmail,
        file_name: file.name,
        file_url: uploadResult.url,
        file_type: file.type,
        file_size: file.size,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error guardando en BD:', error)
      return NextResponse.json({ 
        error: 'Error guardando comprobante' 
      }, { status: 500 })
    }

    console.log('✅ Comprobante guardado en BD:', data.id)

    return NextResponse.json({
      success: true,
      receiptId: data.id,
      message: 'Comprobante subido exitosamente'
    })

  } catch (error) {
    console.error('❌ Error en upload-receipt:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
