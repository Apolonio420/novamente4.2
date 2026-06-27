import { NextRequest, NextResponse } from "next/server"
import { getPresignedUploadUrl } from "@/lib/cloudflare-r2"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"

export const runtime = "nodejs"

const limiter = rateLimit({ limit: 7, windowSeconds: 60, prefix: "presign-selfie" })

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
    const body = (await req.json()) as { key: string; contentType: string }

    if (!body.key || !body.contentType) {
      return ok({ error: "key and contentType are required" }, 400)
    }

    // Only allow selfie keys
    if (!body.key.startsWith("v1/selfies/")) {
      return ok({ error: "Invalid key prefix" }, 403)
    }

    if (!["image/jpeg", "image/png"].includes(body.contentType)) {
      return ok({ error: "Only image/jpeg and image/png are allowed" }, 400)
    }

    const { url: uploadUrl, publicUrl } = await getPresignedUploadUrl(
      body.key,
      body.contentType,
      300 // 5 min expiry
    )

    return ok({ uploadUrl, publicUrl })
  } catch (e: any) {
    return ok({ error: e?.message ?? "Failed to generate presigned URL" }, 500)
  }
}
