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

const GARMENT_FILES = [
  "hoodie-black-front.png",
  "hoodie-black-back.png",
  "hoodie-white-front.png",
  "hoodie-white-back.png",
  "hoodie-gray-front.png",
  "hoodie-gray-back.png",
  "hoodie-caramel-front.png",
  "hoodie-caramel-back.png",
  "tshirt-black-front.png",
  "tshirt-black-back.png",
  "tshirt-white-front.png",
  "tshirt-white-back.png",
  "tshirt-gray-front.png",
  "tshirt-gray-back.png",
  "tshirt-caramel-front.png",
  "tshirt-caramel-back.png",
  "tshirt-cream-front.png",
  "tshirt-cream-back.png",
]

export async function GET() {
  try {
    console.log("[v0] GARMENTS API: Using static file list for v0 runtime")

    const items: GarmentItem[] = GARMENT_FILES.map((name) => {
      const meta = inferMeta(name)
      return {
        path: name,
        url: `/garments/${name}`,
        ...meta,
      }
    })

    console.log("[v0] GARMENTS API: Processed", items.length, "items")

    // Orden: primero hoodie, luego tshirt; dentro, front antes que back
    items.sort(
      (a, b) =>
        (a.type === b.type ? 0 : a.type === "hoodie" ? -1 : 1) ||
        (a.side === b.side ? 0 : a.side === "front" ? -1 : 1) ||
        a.path.localeCompare(b.path),
    )

    console.log("[v0] GARMENTS API: Returning", items.length, "sorted items")
    return ok({ success: true, items })
  } catch (e: any) {
    console.error("[v0] GARMENTS API ERROR:", e)
    console.error("[v0] GARMENTS API ERROR stack:", e.stack)
    return ok({ success: false, error: e?.message || "No se pudo listar garments" }, 500)
  }
}
