import { NextRequest, NextResponse } from "next/server"
import { uploadFile } from "@/lib/cloudflare-r2"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"

export const runtime = "nodejs"

const limiter = rateLimit({ limit: 22, windowSeconds: 60, prefix: "design-upload" })

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
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return ok({ error: "No file provided" }, 400)
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return ok({ error: "Solo se permiten imágenes JPG, PNG o WebP" }, 400)
    }

    const maxSize = 8 * 1024 * 1024 // 8 MB
    if (file.size > maxSize) {
      return ok({ error: "El archivo supera el límite de 8 MB" }, 400)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
    const key = `v1/user-references/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`

    const { url } = await uploadFile(buffer, key, file.type)

    return ok({ url })
  } catch (e: any) {
    return ok({ error: e?.message ?? "Error subiendo imagen" }, 500)
  }
}
