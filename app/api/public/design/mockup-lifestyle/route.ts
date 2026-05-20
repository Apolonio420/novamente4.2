// Mockup LIFESTYLE — usa Gemini Nano Banana 2 para generar una foto realista
// de una persona usando la prenda con el diseño impreso. Reemplaza el
// compositor canvas estático que tenía problemas de transparencia.
import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { uploadFile } from "@/lib/cloudflare-r2"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { resolveAbsoluteUrl } from "@/lib/absolute-url"
import { getCatalogProduct, getCatalogProductColor } from "@/lib/catalog/products"

export const runtime = "nodejs"
export const maxDuration = 60

const limiter = rateLimit({ limit: 5, windowSeconds: 60, prefix: "mockup-lifestyle" })

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview"

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

// Descripción natural por tipo de prenda — Gemini la usa para entender qué dibujar
function getGarmentDescription(garmentKey: string): string {
  const p = getCatalogProduct(garmentKey)
  if (!p) return "oversized t-shirt"
  // Mapeo amistoso para Gemini
  if (p.garmentType === "hoodie") return "premium oversized pullover hoodie (no zipper, NO drawstrings on the hood)"
  if (p.garmentType === "tank") return "tank top / sleeveless musculosa"
  if (p.fit === "crop") return "cropped fitted t-shirt for women"
  if (p.fit === "oversize") return "oversized boxy unisex t-shirt"
  return "classic fit unisex t-shirt"
}

const COLOR_NATURAL: Record<string, string> = {
  black: "deep matte black",
  white: "clean off-white",
  "stone-wash": "washed stone gray with subtle texture",
  gray: "heather gray melange",
  chocolate: "rich chocolate brown",
  yellow: "warm mustard yellow",
  cream: "soft cream off-white",
  marron: "warm chestnut brown",
  caramel: "caramel tan",
}

// Escenarios lifestyle por defecto — variados para no aburrir
const SCENARIOS = [
  "standing in a sunlit Palermo Buenos Aires street with cafés and trees in the background, golden hour, cinematic candid photography",
  "on a rooftop terrace overlooking Buenos Aires skyline at sunset, magic hour warm tones, editorial lifestyle photography",
  "sitting at an outdoor café in San Telmo with a coffee on the table, mid-afternoon natural daylight, candid editorial",
  "in the colorful Caminito La Boca neighborhood, late afternoon warm light, atmospheric street style",
  "in a minimalist studio with soft natural window light, editorial fashion catalog style, neutral background",
]

export async function POST(req: NextRequest) {
  const { success, resetAt } = limiter.check(req)
  if (!success) return rateLimitResponse(resetAt)

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return ok({ error: "Missing GEMINI_API_KEY" }, 500)

    const body = (await req.json()) as {
      designImageUrl: string
      garmentType: string
      garmentColor: string
      side?: "front" | "back"
      scenario?: number
    }

    if (!body.designImageUrl || !body.garmentType || !body.garmentColor) {
      return ok({ error: "designImageUrl, garmentType y garmentColor son requeridos" }, 400)
    }

    // Descargar el diseño
    const resolved = resolveAbsoluteUrl(body.designImageUrl, req)
    const imgRes = await fetch(resolved)
    if (!imgRes.ok) return ok({ error: `No se pudo descargar el diseño (${imgRes.status})` }, 400)
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
    const mimeType = imgRes.headers.get("content-type") || "image/png"
    const base64 = imgBuffer.toString("base64")

    // Construir prompt natural
    const garmentDesc = getGarmentDescription(body.garmentType)
    const colorName = getCatalogProductColor(body.garmentType, body.garmentColor)?.name || body.garmentColor
    const colorNatural = COLOR_NATURAL[body.garmentColor] || colorName.toLowerCase()
    const side = body.side ?? "front"
    const sideText = side === "front" ? "front chest area" : "back of the garment"
    const scenarioIdx =
      typeof body.scenario === "number" ? body.scenario % SCENARIOS.length : Math.floor(Math.random() * SCENARIOS.length)
    const scenario = SCENARIOS[scenarioIdx]

    const prompt = [
      `Generate a photorealistic lifestyle photo of a young Argentinian person (20-30 years old, friendly natural expression, diverse looks) wearing a ${colorNatural} ${garmentDesc}.`,
      `The garment shows the EXACT design from the input image printed on the ${sideText}, with realistic DTG print quality (slight fabric texture, natural ink absorption, no shiny edges).`,
      `Setting: ${scenario}.`,
      "Composition: medium shot showing the upper body and the printed design clearly. Hyperrealistic, 4K, cinematic depth of field, natural skin tones.",
      "CRITICAL: the design on the garment must match the input image exactly — same colors, same typography, same composition. Do not redesign, do not stylize.",
      "Do not add logos, watermarks, or extra text. Do not show a flat mockup, hanger or studio backdrop.",
      "Respond ONLY with the image (inlineData). No text.",
    ].join(" ")

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: IMAGE_MODEL })

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType as "image/png" | "image/jpeg" | "image/webp",
          data: base64,
        },
      },
      prompt,
    ])

    let imageBase64: string | null = null
    for (const cand of result.response?.candidates ?? []) {
      for (const part of cand?.content?.parts ?? []) {
        const inline = (part as { inlineData?: { mimeType?: string; data?: string } })?.inlineData
        if (inline?.mimeType?.startsWith?.("image/") && typeof inline?.data === "string") {
          imageBase64 = inline.data
          break
        }
      }
      if (imageBase64) break
    }

    if (!imageBase64) return ok({ error: "Gemini no devolvió imagen del lifestyle" }, 502)

    const outBuffer = Buffer.from(imageBase64, "base64")
    const key = `v1/mockup-lifestyle/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.png`
    const { url } = await uploadFile(outBuffer, key, "image/png")

    return ok({ success: true, publicUrl: url, mockupUrl: url, scenario: scenarioIdx })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[mockup-lifestyle] error:", msg)
    return ok({ error: msg }, 500)
  }
}
