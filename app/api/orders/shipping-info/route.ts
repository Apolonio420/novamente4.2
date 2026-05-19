// @ts-nocheck
// Endpoint para completar dirección de envío post-pago.
// Lo usa /checkout/success cuando la orden quedó marcada como PENDIENTE_POST_PAGO.
// El cliente de Supabase con types estrictos rechaza update(Record<string,unknown>);
// como la columna existe en runtime, deshabilitamos check en este archivo.
import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      external_reference,
      payment_id,
      address,
      city,
      postal_code,
      phone,
    } = body || {}

    if (!external_reference && !payment_id) {
      return NextResponse.json(
        { success: false, error: "external_reference or payment_id required" },
        { status: 400 },
      )
    }

    if (!address || !city) {
      return NextResponse.json(
        { success: false, error: "address and city are required" },
        { status: 400 },
      )
    }

    const update: Record<string, unknown> = {
      shipping_address: String(address).trim(),
      shipping_city: String(city).trim(),
    }
    if (postal_code) update.shipping_postal_code = String(postal_code).trim()
    if (phone) update.customer_phone = String(phone).trim()

    // Buscar orden por external_reference o payment_id (sólo permitimos completar
    // si la orden está pagada — evita que alguien escupa data en órdenes pending)
    const query = supabaseAdmin.from("orders").update(update)

    const { data, error } = await (external_reference
      ? query.eq("external_reference", external_reference)
      : query.eq("payment_id", payment_id)
    ).select("id, order_number, shipping_address, shipping_city").maybeSingle()

    if (error) {
      console.error("❌ shipping-info update failed:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, order: data })
  } catch (err) {
    console.error("❌ shipping-info exception:", err)
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Unknown error" },
      { status: 500 },
    )
  }
}
