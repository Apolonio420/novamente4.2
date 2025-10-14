import { type NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    // Verificar que el token de MercadoPago esté configurado
    console.log("🔑 MP_ACCESS_TOKEN configured:", !!process.env.MP_ACCESS_TOKEN)
    
    if (!process.env.MP_ACCESS_TOKEN) {
      console.error("❌ MP_ACCESS_TOKEN not configured - using mock response")
      // Para testing, devolver una respuesta simulada
      return NextResponse.json({
        success: true,
        id: "mock-preference-id",
        init_point: "/checkout/success?mock=true",
        message: "Mock payment created for testing"
      })
    }

    const { items, customer, total } = await request.json()

    console.log("🛒 Checkout API received:", {
      itemsCount: items?.length || 0,
      customer: customer?.email || 'No customer data',
      totalReceived: total,
      items: items?.map((item: any) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })) || [],
    })

    // Validar que tenemos los datos necesarios
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "No items provided" }, { status: 400 })
    }

    if (!customer || !customer.email) {
      return NextResponse.json({ success: false, error: "Customer information required" }, { status: 400 })
    }

    if (!total || total <= 0) {
      return NextResponse.json({ success: false, error: "Invalid total amount" }, { status: 400 })
    }

    // Validar que el total calculado coincida con la suma de items
    const calculatedTotal = items.reduce((sum: number, item: any) => sum + item.unit_price * item.quantity, 0)

    console.log("💰 Price validation:", {
      receivedTotal: total,
      calculatedTotal,
      matches: Math.abs(total - calculatedTotal) < 1, // Permitir diferencia mínima por redondeo
    })

    if (Math.abs(total - calculatedTotal) > 1) {
      console.error("❌ Price mismatch:", { receivedTotal: total, calculatedTotal })
      return NextResponse.json({ success: false, error: "Price validation failed" }, { status: 400 })
    }

    // Crear preferencia de MercadoPago con precios exactos
    const preference = new Preference(client)

    const preferenceData = {
      items: items.map((item: any) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: "ARS",
        description: item.description,
      })),
      payer: {
        email: customer.email,
        name: customer.firstName,
        surname: customer.lastName,
        phone: {
          number: customer.phone,
        },
        address: {
          street_name: customer.address,
          city_name: customer.city,
          zip_code: customer.postalCode,
        },
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/cancel`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/pending`,
      },
      // auto_return: "approved", // Comentado para evitar problemas con localhost
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhooks/mercadopago`,
      statement_descriptor: "NOVAMENTE",
      external_reference: `order_${Date.now()}`,
    }

    console.log("🚀 Creating MercadoPago preference:", {
      itemsCount: preferenceData.items.length,
      totalAmount: calculatedTotal,
      customerEmail: preferenceData.payer.email,
      backUrls: preferenceData.back_urls,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    })
    
    console.log("📋 Full preference data:", JSON.stringify(preferenceData, null, 2))

    const result = await preference.create({ body: preferenceData })

    console.log("✅ MercadoPago preference created:", {
      id: result.id,
      init_point: result.init_point,
    })

    return NextResponse.json({
      success: true,
      id: result.id,
      init_point: result.init_point,
    })
  } catch (error: any) {
    console.error("❌ Checkout API error:", error)
    console.error("❌ Error details:", {
      message: error?.message || 'Unknown error',
      status: error?.status,
      error: error?.error,
      cause: error?.cause,
      stack: error?.stack,
    })
    
    // Si es un error de MercadoPago, devolver más detalles
    if (error?.status === 400) {
      return NextResponse.json({ 
        success: false, 
        error: "MercadoPago validation error",
        details: error.message,
        mercadopagoError: error.error
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: false, 
      error: "Error creating payment preference",
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}
