// Stub server route — el background removal lo hace el browser con
// @imgly/background-removal (cliente). Este endpoint solo recibe el
// PNG ya procesado por el browser y lo sube a R2 para que pueda usarse
// downstream (mockup, lifestyle, try-on).
import { NextRequest, NextResponse } from "next/server"
import { uploadFile } from "@/lib/cloudflare-r2"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"

export const runtime = "nodejs"

const limiter = rateLimit({ limit: 20, windowSeconds: 60, prefix: "remove-bg-store" })

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function ok(data: unknown, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  })
}

export async function OPTIONS() {
  return ok({ ok: true })
}

export async function POST(req: NextRequest) {
  const { success, resetAt } = limiter.check(req)
  if (!success) return rateLimitResponse(resetAt)

  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) return ok({ error: "No file provided" }, 400)

    const buffer = Buffer.from(await file.arrayBuffer())
    const key = `v1/no-bg/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.png`
    const { url } = await uploadFile(buffer, key, "image/png")

    return ok({ success: true, images: [{ url }], method: "imgly-browser" })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return ok({ error: msg }, 500)
  }
}
