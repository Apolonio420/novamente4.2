import { type NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    const { items, customer, total } = await request.json()

    console.log("🛒 Checkout API received:", {
      itemsCount: items.length,
      customer: customer.email,
      totalReceived: total,
      items: items.map((item: any) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    })

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
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/pending`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
      statement_descriptor: "NOVAMENTE",
    }

    console.log("🚀 Creating MercadoPago preference:", {
      itemsCount: preferenceData.items.length,
      totalAmount: calculatedTotal,
      customerEmail: preferenceData.payer.email,
    })

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
  } catch (error) {
    console.error("❌ Checkout API error:", error)
    return NextResponse.json({ success: false, error: "Error creating payment preference" }, { status: 500 })
  }
}
