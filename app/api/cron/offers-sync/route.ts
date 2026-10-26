import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { OFFERS } from "@/lib/offers"
import { decidePriceSync, parseOfferTarget } from "@/lib/offers-sync"

/**
 * Sincroniza partner_products.price / compare_at_price con lib/offers.ts.
 * Idempotente. Corre cada hora (vercel.json). Auth: Bearer CRON_SECRET.
 * ?dry=1 informa sin escribir.
 */
export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const dry = request.nextUrl.searchParams.get("dry") === "1"
  const now = new Date()
  const results: Array<Record<string, unknown>> = []

  for (const offer of OFFERS) {
    const target = parseOfferTarget(offer.url)
    if (!target) continue
    // Ofertas que no empezaron no hacen nada.
    if (now.getTime() < new Date(offer.startsAt).getTime()) continue

    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", target.tenantSlug)
      .maybeSingle()
    if (!tenant) {
      results.push({ offer: offer.slug, result: "tenant_not_found" })
      continue
    }
    const { data: row } = await supabaseAdmin
      .from("partner_products")
      .select("id, price, compare_at_price")
      .eq("tenant_id", (tenant as { id: string }).id)
      .eq("slug", target.productSlug)
      .maybeSingle()
    if (!row) {
      results.push({ offer: offer.slug, result: "product_not_found" })
      continue
    }
    const r = row as { id: string; price: number; compare_at_price: number | null }
    const decision = decidePriceSync(
      offer,
      { price: Number(r.price), compare_at_price: r.compare_at_price == null ? null : Number(r.compare_at_price) },
      now,
    )
    if (decision.action === "none") {
      results.push({ offer: offer.slug, result: decision.reason })
      continue
    }
    if (!dry) {
      const { error } = await supabaseAdmin
        .from("partner_products")
        .update({ price: decision.price, compare_at_price: decision.compare_at_price } as never)
        .eq("id", r.id)
      if (error) {
        results.push({ offer: offer.slug, result: "error", error: error.message })
        continue
      }
    }
    results.push({ offer: offer.slug, result: dry ? `would_${decision.reason}` : decision.reason })
  }

  return NextResponse.json({ ok: true, dry, now: now.toISOString(), results })
}
