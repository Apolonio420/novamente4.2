/**
 * POST /api/admin/assets
 *
 * Accepts a multipart/form-data upload and saves the file to
 * public/partners/<partnerId>/<assetType>/<filename>
 *
 * Form fields:
 *   file        — the binary file
 *   partnerId   — partner slug, e.g. "falco"
 *   assetType   — "root" | "products"
 *   filename    — desired filename, e.g. "logo.png" or "buzo-hoodie-unisex-negro-front.png"
 *
 * Returns: { success: true, url: "/partners/<partnerId>/<assetType>/<filename>" }
 */

import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const partnerId = formData.get("partnerId") as string | null
    const assetType = formData.get("assetType") as string | null   // "root" | "products"
    const filename = formData.get("filename") as string | null

    if (!file || !partnerId || !assetType || !filename) {
      return NextResponse.json(
        { error: "file, partnerId, assetType and filename are required" },
        { status: 400 }
      )
    }

    // Sanitize inputs to prevent path traversal
    const safePartnerId = partnerId.replace(/[^a-z0-9-]/g, "")
    const safeFilename = path.basename(filename).replace(/[^a-z0-9._-]/gi, "")

    const subdir = assetType === "products" ? "products" : ""
    const dirPath = subdir
      ? path.join(process.cwd(), "public", "partners", safePartnerId, subdir)
      : path.join(process.cwd(), "public", "partners", safePartnerId)

    fs.mkdirSync(dirPath, { recursive: true })

    const filePath = path.join(dirPath, safeFilename)
    const bytes = await file.arrayBuffer()
    fs.writeFileSync(filePath, Buffer.from(bytes))

    const url = subdir
      ? `/partners/${safePartnerId}/${subdir}/${safeFilename}`
      : `/partners/${safePartnerId}/${safeFilename}`

    return NextResponse.json({ success: true, url })
  } catch (err) {
    console.error("[admin/assets] POST error", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
