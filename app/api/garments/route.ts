import { NextResponse } from "next/server"

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
  type: string // hoodie | tshirt | other
  side: "front" | "back" | "unknown"
  color?: string
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

const GARMENT_FILES = [
  "hoodie-black-front.jpeg",
  "hoodie-black-back.jpeg",
  "hoodie-gray-front.jpeg",
  "hoodie-gray-back.jpeg",
  "tshirt-black-front.jpeg",
  "tshirt-black-back.jpeg",
  "tshirt-gray-front.jpeg",
  "tshirt-gray-back.jpeg",
]

export async function GET() {
  try {
    const items: GarmentItem[] = GARMENT_FILES.map((name) => {
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
