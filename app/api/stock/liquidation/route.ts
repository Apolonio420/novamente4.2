// Stock por talle de prendas de LIQUIDACION (proveedor viejo, ver lib/stock/liquidation.ts).
// Publico y sin auth (se consulta desde /crear y las paginas de producto).
// Fail-open: si falla la lectura, la tienda vende como siempre (rows vacio,
// nunca romper la pagina por esto).
import { NextResponse } from "next/server"
import { getLiquidationStock } from "@/lib/stock/liquidation"

export const runtime = "nodejs"

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
}

export async function GET() {
  try {
    const rows = await getLiquidationStock()
    return NextResponse.json({ rows }, { headers: CACHE_HEADERS })
  } catch (e) {
    console.error("[stock/liquidation] failed:", (e as Error).message)
    return NextResponse.json({ rows: [] }, { headers: CACHE_HEADERS })
  }
}
