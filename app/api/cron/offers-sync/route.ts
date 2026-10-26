import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { OFFERS } from "@/lib/offers"
import { decidePriceSync, parseOfferTarget, STALE_AFTER_MS } from "@/lib/offers-sync"

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
  let failed = false

  for (const offer of OFFERS) {
    const target = parseOfferTarget(offer.url)
    if (!target) continue
    // Ofertas que no empezaron no hacen nada.
    if (now.getTime() < new Date(offer.startsAt).getTime()) continue
    // Ofertas viejas (>48h desde endsAt) no se tocan nunca mas.
    if (now.getTime() > new Date(offer.endsAt).getTime() + STALE_AFTER_MS) continue

    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", target.tenantSlug)
      .maybeSingle()
    if (tenantErr) {
      console.error("[offers-sync] tenant select failed", offer.slug, tenantErr)
      failed = true
      results.push({ offer: offer.slug, result: "error", error: tenantErr.message })
      continue
    }
    if (!tenant) {
      results.push({ offer: offer.slug, result: "tenant_not_found" })
      continue
    }
    const { data: row, error: rowErr } = await supabaseAdmin
      .from("partner_products")
      .select("id, price, compare_at_price")
      .eq("tenant_id", (tenant as { id: string }).id)
      .eq("slug", target.productSlug)
      .maybeSingle()
    if (rowErr) {
      console.error("[offers-sync] product select failed", offer.slug, rowErr)
      failed = true
      results.push({ offer: offer.slug, result: "error", error: rowErr.message })
      continue
    }
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
        console.error("[offers-sync] update failed", offer.slug, error)
        failed = true
        results.push({ offer: offer.slug, result: "error", error: error.message })
        continue
      }
    }
    results.push({ offer: offer.slug, result: dry ? `would_${decision.reason}` : decision.reason })
  }

  return NextResponse.json(
    { ok: !failed, dry, now: now.toISOString(), results },
    { status: failed ? 500 : 200 },
  )
}
