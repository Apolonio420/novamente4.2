import { NextRequest, NextResponse } from "next/server"
import { deleteFromR2 } from "@/lib/cloudflare-r2"

export const runtime = "nodejs"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "DELETE, OPTIONS",
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

export async function DELETE(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key")
  if (!key) return ok({ error: "key query param required" }, 400)

  // Only allow deleting selfie keys — prevent arbitrary R2 deletion
  if (!key.startsWith("v1/selfies/")) {
    return ok({ error: "Invalid key prefix" }, 403)
  }

  try {
    await deleteFromR2(key)
    return ok({ deleted: true, key })
  } catch (e: any) {
    return ok({ error: e?.message ?? "Failed to delete" }, 500)
  }
}
