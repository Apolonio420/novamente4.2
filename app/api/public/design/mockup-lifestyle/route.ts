// Mockup LIFESTYLE — usa Gemini Nano Banana 2 para generar una foto realista
// de una persona usando la prenda con el diseño impreso. Reemplaza el
// compositor canvas estático que tenía problemas de transparencia.
import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { uploadFile } from "@/lib/cloudflare-r2"
import { resolveAbsoluteUrl } from "@/lib/absolute-url"
import { getCatalogProduct, getCatalogProductColor } from "@/lib/catalog/products"
import { corsHeaders, preflightResponse } from "@/lib/security/cors"
import { guardPublicImageGen } from "@/lib/security/public-image-guard"
import { meterPublicImageGen } from "@/lib/security/meter-usage"

export const runtime = "nodejs"
export const maxDuration = 60

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image"

export async function OPTIONS(req: NextRequest) {
  return preflightResponse(req)
}

// Descripción natural por tipo de prenda — Gemini la usa para entender qué dibujar.
// IMPORTANTE: cada combinación garmentType+fit del catalog debe estar mapeada
// para que el mockup respete la prenda seleccionada. Faltaba sweatshirt (buzo
// cuello redondo) y classic-women — ambos caían al default 't-shirt' y Gemini
// generaba remera aunque el user eligiera buzo.
function getGarmentDescription(garmentKey: string): string {
  const p = getCatalogProduct(garmentKey)
  if (!p) return "oversized t-shirt"

  // hoodie con capucha (Boston Hoodie)
  if (p.garmentType === "hoodie") {
    return "premium oversized PULLOVER HOODIE (with hood up at the back, NO zipper, NO drawstrings on the hood, dropped shoulders)"
  }

  // sweatshirt = buzo cuello redondo (CREWNECK, NO HOOD)
  if (p.garmentType === "sweatshirt") {
    return "oversize crewneck pullover sweatshirt (ribbed crew neckline, NO HOOD, NO zipper, dropped shoulders, long sleeves with ribbed cuffs) — buzo cuello redondo argentino"
  }

  // tank = musculosa sin mangas
  if (p.garmentType === "tank") {
    return "sleeveless tank top (musculosa) with wide armholes, ribbed scoop neckline"
  }

  // tshirt variants
  if (p.fit === "crop") return "cropped fitted women's t-shirt (short length, exposes midriff slightly, fitted silhouette)"
  if (p.fit === "classic-women") return "fitted classic t-shirt for women (feminine cut, slightly tailored at the waist)"
  if (p.fit === "oversize") return "oversized boxy unisex t-shirt (dropped shoulders, wider fit, longer hem)"

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
  function ok(data: unknown, status = 200) {
    return new NextResponse(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders(req) },
    })
  }

  const guard = await guardPublicImageGen(req, "mockup-lifestyle")
  if (guard.allowed === false) return ok({ error: guard.message }, guard.status)

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return ok({ error: "Missing GEMINI_API_KEY" }, 500)

    const body = (await req.json()) as {
      designImageUrl: string
      garmentType: string
      garmentColor: string
      side?: "front" | "back"
      scenario?: number
      printArea?: "R1" | "R2" | "R3"
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
    const printArea = body.printArea ?? "R2"
    // Descripción del tamaño + ubicación del print area para Gemini
    const printAreaDesc =
      printArea === "R1"
        ? side === "front"
          ? "small print (10×10 cm) on the left chest area"
          : "small print (10×10 cm) at the upper back, between the shoulder blades"
        : printArea === "R3"
          ? side === "front"
            ? "large full-front print (35×40 cm), covering most of the chest area from collar down"
            : "large full-back print (35×40 cm), covering most of the back from shoulders to waist"
          : side === "front"
            ? "medium centered chest print (20×20 cm), positioned on the upper-mid chest"
            : "medium centered back print (20×20 cm), positioned on the upper-mid back"
    const sideText = printAreaDesc
    const scenarioIdx =
      typeof body.scenario === "number" ? body.scenario % SCENARIOS.length : Math.floor(Math.random() * SCENARIOS.length)
    const scenario = SCENARIOS[scenarioIdx]

    const prompt = [
      `Generate a photorealistic lifestyle photo of a young Argentinian person (20-30 years old, friendly natural expression, diverse looks) wearing a ${colorNatural} ${garmentDesc}.`,
      `The garment shows the EXACT design from the input image printed on the ${sideText}, with realistic DTG print quality (slight fabric texture, natural ink absorption, no shiny edges).`,
      `Setting: ${scenario}.`,
      "Composition: medium shot showing the upper body and the printed design clearly. Hyperrealistic, 4K, cinematic depth of field, natural skin tones.",
      "CRITICAL: reproduce the FULL input image EXACTLY as the print — same colors, same composition, same content. If the input is a photo, print the WHOLE photo. Do NOT extract a single element from it, do NOT simplify it into a logo, icon or emblem, do NOT replace it with a generic mark. Do not redesign, do not stylize, do not crop.",
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

    await meterPublicImageGen({ endpoint: "public/design/mockup-lifestyle", model: IMAGE_MODEL })

    return ok({ success: true, publicUrl: url, mockupUrl: url, scenario: scenarioIdx })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[mockup-lifestyle] error:", msg)
    return ok({ error: msg }, 500)
  }
}
