import { NextResponse } from "next/server"
import { cleanupExpiredImages } from "@/lib/db"
import { listR2Objects, deleteFromR2 } from "@/lib/cloudflare-r2"

export const maxDuration = 120

/**
 * Cron diario: limpia imágenes expiradas (DB) + SELFIES de try-on en R2
 * con más de 48h (privacidad Ley 25.326: prometemos no retenerlas).
 */
export async function GET() {
  try {
    const summary = await cleanupExpiredImages()

    // Selfies de try-on >48h — best effort, no rompe el cleanup principal
    let selfiesDeleted = 0
    try {
      const cutoff = Date.now() - 48 * 3600_000
      const objects = await listR2Objects("v1/selfies/")
      for (const o of objects) {
        // el key lleva timestamp: v1/selfies/{ts}-{random}.ext — fallback a lastModified
        const tsMatch = /v1\/selfies\/(\d{10,13})-/.exec(o.key)
        const ts = tsMatch ? Number(tsMatch[1]) : o.lastModified?.getTime() ?? 0
        const ms = ts < 1e12 ? ts * 1000 : ts
        if (ms > 0 && ms < cutoff) {
          await deleteFromR2(o.key)
          selfiesDeleted++
        }
      }
    } catch (e: any) {
      console.error("⚠️ selfie cleanup error:", e?.message)
    }

    return NextResponse.json({ ...summary, selfiesDeleted })
  } catch (error) {
    console.error("❌ Error in cleanup route:", error)
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
  }
}
