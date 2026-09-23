/**
 * Backfill de partner_assets con los archivos del Studio que ya están en R2.
 *
 * Hasta la migración 20260923_partner_assets_design_types.sql, saveDesignAsset()
 * fallaba SIEMPRE (status 'active' no permitido por el CHECK) y el error se
 * tragaba: los mockups/diseños se subían a R2 pero la fila nunca existió.
 * Este script reconstruye esas filas a partir de ListObjects:
 *
 *   partners/{slug}/mockups/*            → type 'mockup'  (Studio partner)
 *   partners/{slug}/storefront-mockups/* → type 'mockup'  (Studio público)
 *   partners/{slug}/designs/*            → type 'design'  (Studio partner)
 *   partners/{slug}/storefront-designs/* → type 'design'  (Studio público)
 *   partners/{slug}/uploads/*            → type 'design'  (design/upload, metadata.source='upload')
 *
 * Lo que NO se puede recuperar: la metadata original (prenda, color, lado,
 * placement, prompt). Las filas quedan con metadata.backfilled=true y
 * created_at = LastModified del objeto en R2.
 *
 * Idempotente: saltea todo storage_key que ya tenga fila. Saltea slugs sin
 * tenant (tiendas borradas). REQUIERE la migración aplicada antes (si no, el
 * insert falla por el mismo CHECK).
 *
 * Uso:
 *   npx tsx scripts/backfill-partner-assets-r2.ts            # dry-run (default)
 *   npx tsx scripts/backfill-partner-assets-r2.ts --apply    # escribe de verdad
 */
import { createClient } from "@supabase/supabase-js"
import { config as loadEnv } from "dotenv"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"

loadEnv({ path: ".env.local" })

const APPLY = process.argv.includes("--apply")
const BATCH = 200

const KIND_TO_TYPE: Record<string, { type: "mockup" | "design"; origin: string }> = {
  mockups: { type: "mockup", origin: "partner-studio" },
  "storefront-mockups": { type: "mockup", origin: "storefront-studio" },
  designs: { type: "design", origin: "partner-studio" },
  "storefront-designs": { type: "design", origin: "storefront-studio" },
  uploads: { type: "design", origin: "upload" },
}

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml" }

async function main() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
  // Import dinámico: lib/r2 lee las env de dominio público, tienen que estar cargadas antes.
  const { toPublicR2Url } = await import("../lib/r2")

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const rawEndpoint = (process.env.CLOUDFLARE_R2_ENDPOINT || "").trim()
  const s3 = new S3Client({
    region: "auto",
    endpoint: new URL(rawEndpoint).origin,
    credentials: {
      accessKeyId: (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "").trim(),
      secretAccessKey: (process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "").trim(),
    },
  })
  const Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || "novamente"

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`)

  // 1. Objetos en R2
  const objects: { key: string; slug: string; kind: string; lastModified: Date; size: number }[] = []
  let token: string | undefined
  do {
    const r = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: "partners/", ContinuationToken: token }))
    for (const o of r.Contents || []) {
      const [, slug, kind] = (o.Key || "").split("/")
      if (o.Key && slug && KIND_TO_TYPE[kind]) {
        objects.push({ key: o.Key, slug, kind, lastModified: o.LastModified!, size: o.Size ?? 0 })
      }
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined
  } while (token)

  // 2. Tenants por slug
  const slugs = [...new Set(objects.map((o) => o.slug))]
  const { data: tenants, error: tErr } = await admin.from("tenants").select("id, slug").in("slug", slugs)
  if (tErr) throw tErr
  const tenantBySlug = new Map((tenants || []).map((t: { id: string; slug: string }) => [t.slug, t.id]))

  // 3. storage_keys ya registrados (paginado: PostgREST corta en 1000)
  const existing = new Set<string>()
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from("partner_assets").select("storage_key").like("storage_key", "partners/%").range(from, from + 999)
    if (error) throw error
    for (const r of data || []) existing.add(r.storage_key)
    if (!data || data.length < 1000) break
  }

  // 4. Filas a insertar
  const rows = []
  const skippedNoTenant = new Map<string, number>()
  let skippedExisting = 0
  for (const o of objects) {
    if (existing.has(o.key)) { skippedExisting++; continue }
    const tenantId = tenantBySlug.get(o.slug)
    if (!tenantId) { skippedNoTenant.set(o.slug, (skippedNoTenant.get(o.slug) || 0) + 1); continue }
    const { type, origin } = KIND_TO_TYPE[o.kind]
    const ext = o.key.split(".").pop()?.toLowerCase() || ""
    rows.push({
      tenant_id: tenantId,
      type,
      status: "active",
      storage_key: o.key,
      public_url: toPublicR2Url(o.key) || `https://${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${o.key}`,
      mime_type: MIME[ext] ?? null,
      size_bytes: o.size,
      created_at: o.lastModified.toISOString(),
      metadata: { backfilled: true, backfilled_at: new Date().toISOString(), origin, ...(origin === "upload" ? { source: "upload" } : {}) },
    })
  }

  const byType = rows.reduce<Record<string, number>>((acc, r) => ((acc[r.type] = (acc[r.type] || 0) + 1), acc), {})
  console.log(`Objetos R2 del Studio: ${objects.length}`)
  console.log(`Ya registrados:        ${skippedExisting}`)
  console.log(`Sin tenant (slug borrado): ${[...skippedNoTenant.values()].reduce((a, b) => a + b, 0)} ${JSON.stringify(Object.fromEntries(skippedNoTenant))}`)
  console.log(`A insertar:            ${rows.length} ${JSON.stringify(byType)}`)
  console.log("Ejemplo:", JSON.stringify(rows[0], null, 2))

  if (!APPLY) { console.log("\nDRY-RUN: no se escribió nada. Correr con --apply."); return }

  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await admin.from("partner_assets").insert(rows.slice(i, i + BATCH))
    if (error) throw new Error(`insert batch ${i}: ${error.code} ${error.message} (insertadas hasta acá: ${inserted})`)
    inserted += Math.min(BATCH, rows.length - i)
  }
  console.log(`\nInsertadas: ${inserted}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
