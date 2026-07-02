import { NextResponse } from "next/server"
import { cleanupExpiredImages } from "@/lib/db"

export const maxDuration = 120

/**
 * Cron diario: limpia imágenes expiradas (DB).
 * La limpieza de SELFIES de try-on en R2 vive aparte, en
 * app/api/cron/cleanup-tryon-selfies (protegido con CRON_SECRET y ventana
 * de 24h) — se separó de acá porque este endpoint no tenía auth de cron.
 */
export async function GET() {
  try {
    const summary = await cleanupExpiredImages()
    return NextResponse.json(summary)
  } catch (error) {
    console.error("❌ Error in cleanup route:", error)
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
  }
}
