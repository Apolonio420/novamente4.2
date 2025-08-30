import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

type GarmentItem = {
  path: string // relativo a /public/garments
  url: string // /garments/<path>
  type: string // hoodie | tshirt | other (heurística)
  side: "front" | "back" | "unknown"
  color?: string // heurística a partir del nombre
}

function inferMeta(file: string): Omit<GarmentItem, "path" | "url"> {
  const lower = file.toLowerCase()
  const type = lower.includes("hoodie")
    ? "hoodie"
    : lower.includes("tshirt") || lower.includes("tee")
      ? "tshirt"
      : "other"

  const side = lower.includes("front") ? "front" : lower.includes("back") ? "back" : "unknown"

  // intenta extraer color principal
  const colors = ["black", "white", "gray", "caramel", "cream"]
  const color = colors.find((c) => lower.includes(c))

  return { type, side, color }
}

export async function GET() {
  try {
    const dir = path.join(process.cwd(), "public", "garments")
    const entries = await fs.readdir(dir, { withFileTypes: true })

    const allowed = new Set([".png", ".jpg", ".jpeg", ".webp"])
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => allowed.has(path.extname(name).toLowerCase()))

    const items: GarmentItem[] = files.map((name) => {
      const meta = inferMeta(name)
      return {
        path: name,
        url: `/garments/${name}`,
        ...meta,
      }
    })

    // Orden: primero hoodie, luego tshirt; dentro, front antes que back
    items.sort(
      (a, b) =>
        (a.type === b.type ? 0 : a.type === "hoodie" ? -1 : 1) ||
        (a.side === b.side ? 0 : a.side === "front" ? -1 : 1) ||
        a.path.localeCompare(b.path),
    )

    return ok({ success: true, items })
  } catch (e: any) {
    console.error("GARMENTS LIST ERROR", e)
    return ok({ success: false, error: e?.message || "No se pudo listar garments" }, 500)
  }
}
