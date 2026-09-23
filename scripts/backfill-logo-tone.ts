/**
 * Backfill de tenants.metadata.logo_tone / logo_aspect para los tenants que
 * ya tienen logo_url cargado (de antes de que branding route lo calculara
 * al subir/cambiar el logo — ver lib/partners/logo-tone.ts).
 *
 * Recorre EN SERIE (1s de espera entre requests, no golpear el storage de
 * golpe), resuelve URLs relativas contra https://www.novamente.ar, calcula
 * tono (dark/light) y aspect ratio con sharp, y en --apply escribe
 * metadata.logo_tone/logo_aspect sin pisar el resto de metadata.
 *
 * Por default es DRY-RUN: solo imprime slug, tono, aspecto y el update que
 * haría. Solo escribe con --apply.
 *
 * Uso:
 *   npx tsx scripts/backfill-logo-tone.ts              # dry-run (default)
 *   npx tsx scripts/backfill-logo-tone.ts --dry-run
 *   npx tsx scripts/backfill-logo-tone.ts --apply       # escribe de verdad
 */
import { createClient } from "@supabase/supabase-js"
import { config as loadEnv } from "dotenv"
import { computeLogoToneFromUrl } from "../lib/partners/logo-tone"

loadEnv({ path: ".env.local" })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE_URL = "https://www.novamente.ar"
const APPLY = process.argv.includes("--apply")
const SLEEP_MS = 1000

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`)

  const { data: tenants, error } = await admin
    .from("tenants")
    .select("id, slug, logo_url, metadata")
    .not("logo_url", "is", null)
    .order("slug", { ascending: true })

  if (error) {
    console.error("❌", error.message)
    process.exit(1)
  }

  const rows = (tenants ?? []).filter((t) => typeof t.logo_url === "string" && t.logo_url.trim() !== "")
  console.log(`${rows.length} tenants con logo_url\n`)

  let darkCount = 0
  let lightCount = 0
  let errorCount = 0
  const darkSlugs: string[] = []

  for (const t of rows) {
    const result = await computeLogoToneFromUrl(t.logo_url as string, BASE_URL)

    if (!result) {
      errorCount++
      console.log(`  ❌ ${t.slug}: no se pudo calcular (descarga o formato de imagen)`)
      await sleep(SLEEP_MS)
      continue
    }

    const { tone, aspect } = result
    if (tone === "dark") {
      darkCount++
      darkSlugs.push(t.slug as string)
    } else {
      lightCount++
    }

    const currentMetadata = (t.metadata as Record<string, unknown>) || {}
    const nextMetadata = { ...currentMetadata, logo_tone: tone, logo_aspect: aspect }
    console.log(
      `  ${tone === "dark" ? "🌑" : "☀️"} ${t.slug}: tone=${tone} aspect=${aspect.toFixed(2)}` +
        (APPLY ? "" : ` — update que haría: metadata.logo_tone=${tone}, metadata.logo_aspect=${aspect.toFixed(2)}`),
    )

    if (APPLY) {
      const { error: updateError } = await admin
        .from("tenants")
        .update({ metadata: nextMetadata })
        .eq("id", t.id)
      if (updateError) {
        console.error(`    ❌ error al guardar ${t.slug}: ${updateError.message}`)
      }
    }

    await sleep(SLEEP_MS)
  }

  console.log(`\n=== Resumen ===`)
  console.log(`dark: ${darkCount} · light: ${lightCount} · errores: ${errorCount}`)
  console.log(`slugs dark: ${darkSlugs.length ? darkSlugs.join(", ") : "(ninguno)"}`)

  if (!APPLY) {
    console.log(`\n--dry-run (default): no se escribió nada. Corré con --apply para aplicar.`)
  }
}

main()
