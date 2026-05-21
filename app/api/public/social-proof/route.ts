// Social proof counter — cuenta actividad real de Novamente para mostrar
// en /crear como trust signal. Cacheado 5 min para no martillar R2/Supabase.
import { NextResponse } from "next/server"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
// Cache 5 min — la pagina puede ser visitada muchas veces seguidas
export const revalidate = 300

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
}

function ok(data: unknown) {
  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS },
  })
}

export async function GET() {
  try {
    // 1) Contar diseños generados en las últimas 24h (R2 objects con
    //    timestamp en el key, formato `v1/raw-designs/{Date.now()}-{rand}.png`)
    let designsLast24h = 0
    let totalDesigns = 0
    try {
      const accountId = process.env.R2_ACCOUNT_ID
      const accessKeyId = process.env.R2_ACCESS_KEY_ID
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
      const bucket = process.env.R2_BUCKET_NAME || "novamente"
      if (accountId && accessKeyId && secretAccessKey) {
        const client = new S3Client({
          region: "auto",
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: { accessKeyId, secretAccessKey },
        })
        const since24h = Date.now() - 24 * 60 * 60 * 1000
        for (const prefix of ["v1/raw-designs/", "v1/edited-designs/", "v1/no-bg/"]) {
          const r = await client.send(
            new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: 1000 }),
          )
          const objects = r.Contents || []
          totalDesigns += objects.length
          designsLast24h += objects.filter((o) => {
            const m = o.Key?.match(/(\d{13})/)
            return m ? parseInt(m[1]) > since24h : false
          }).length
        }
      }
    } catch (e) {
      console.warn("[social-proof] R2 count failed:", (e as Error).message)
    }

    // 2) Contar orders pagadas histórico (signal mas fuerte)
    let totalOrders = 0
    try {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
      const { count } = await sb
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "approved")
      totalOrders = count ?? 0
    } catch (e) {
      console.warn("[social-proof] Supabase count failed:", (e as Error).message)
    }

    return ok({
      designsLast24h,
      totalDesigns,
      totalOrders,
      generatedAt: new Date().toISOString(),
    })
  } catch (e) {
    return ok({
      designsLast24h: 0,
      totalDesigns: 0,
      totalOrders: 0,
      error: (e as Error).message,
    })
  }
}
