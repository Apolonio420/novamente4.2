import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

// Medición del embudo de transferencia: el cliente llama a este endpoint
// (fire-and-forget) apenas renderiza /checkout/transfer, para poder distinguir
// "creó el pedido" (ya pasa antes, en app/api/checkout/transfer/route.ts) de
// "llegó a ver el alias/CVU". Ver migrations/20260918_orders_transfer_page_viewed_at.sql.
//
// Fail-soft a propósito: si la columna todavía no existe (migración sin
// aplicar) o cualquier otra cosa falla, logueamos y devolvemos 200 igual —
// esto nunca debe afectar al cliente ni a la pantalla de transferencia.
export async function POST(request: NextRequest) {
  try {
    const { order_id } = await request.json()

    if (!order_id || typeof order_id !== "string") {
      return NextResponse.json({ ok: false, reason: "missing order_id" }, { status: 200 })
    }

    // `as any`: transfer_page_viewed_at es una columna nueva (ver migración
    // 20260918) que todavía no está en los tipos generados de Supabase — igual
    // patrón que updateData en lib/db.ts#updateOrder.
    const updateData: any = { transfer_page_viewed_at: new Date().toISOString() }
    const { error } = await (supabaseAdmin.from("orders") as any)
      .update(updateData)
      .eq("id", order_id)
      .is("transfer_page_viewed_at", null)

    if (error) {
      // Esperado si la migración todavía no corrió (columna inexistente) —
      // no es un error que deba ver el cliente.
      console.warn("⚠️ No se pudo registrar transfer_page_viewed_at (fail-soft):", error.message)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.warn("⚠️ Excepción registrando vista de transferencia (fail-soft):", error?.message)
    return NextResponse.json({ ok: true })
  }
}
