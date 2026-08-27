// Mockup LIFESTYLE — usa Gemini Nano Banana 2 para generar una foto realista
// de una persona usando la prenda con el diseño impreso. Reemplaza el
// compositor canvas estático que tenía problemas de transparencia.
import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { uploadFile } from "@/lib/cloudflare-r2"
import { resolveAbsoluteUrl } from "@/lib/absolute-url"
import { getCatalogProduct, getCatalogProductColor } from "@/lib/catalog/products"
import { headers } from "next/headers"
import { getGarmentMapping } from "@/lib/garment-mappings"
import { pegarEstampaPlana } from "@/lib/mockup/perfect-stamp"
import { corsHeaders, preflightResponse } from "@/lib/security/cors"
import { guardPublicImageGen } from "@/lib/security/public-image-guard"
import { meterPublicImageGen } from "@/lib/security/meter-usage"

export const runtime = "nodejs"
export const maxDuration = 60

// Mockup lifestyle compone un diseño/estampa sobre foto de persona — NO es
// generación desde cero, así que usa la cadena STAMP_MODEL (barata) igual que
// su gemelo interno lib/partners/lifestyle-mockup.ts. GEMINI_IMAGE_MODEL queda
// como fallback intermedio pero en Vercel está seteada a pro a propósito para
// generate-image (diseño desde cero) — este endpoint no debería tocarla salvo
// que no exista GEMINI_STAMP_MODEL.
const IMAGE_MODEL = process.env.GEMINI_STAMP_MODEL || process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image"

/** cm de ancho de la estampa según el tamaño elegido en /crear. */
const ANCHO_CM: Record<string, number> = { R1: 10, R2: 20, R3: 35 }

/** Las posiciones de /crear, traducidas a las del motor de mockups. */
const POSICION: Record<string, string> = {
  "left-chest": "left-chest",
  center: "center-high",
  "right-chest": "right-chest",
}

/**
 * Arma la prenda plana con la estampa ya en su medida exacta, para pasársela a
 * Gemini como REFERENCIA.
 *
 * Por qué: describir la medida con palabras no alcanza. Medido sobre el mismo
 * diseño y el mismo escenario, "medium chest print (20×20 cm)" y "large
 * full-front print (35×40 cm)" devolvían estampas del mismo tamaño — el
 * cliente elegía mediano o grande y veía lo mismo. Con la referencia la
 * proporción viaja en los píxeles.
 *
 * No cuesta ninguna llamada extra al modelo: el pegado es todo sharp.
 * Si algo falla se devuelve null y el mockup sigue por el camino de siempre.
 */
async function referenciaConMedida(
  designBuffer: Buffer,
  garmentType: string,
  garmentColor: string,
  side: "front" | "back",
  printArea: "R1" | "R2" | "R3",
  placement: string,
  origin: string,
): Promise<Buffer | null> {
  try {
    const mapping = getGarmentMapping(garmentType, garmentColor, side)
    if (!mapping || mapping.garmentPath === "fallback") return null

    // La prenda base se baja por HTTP, NO se lee del disco: leerla con
    // fs.readFileSync(process.cwd()/public/...) mete TODO public/ en el bundle
    // de la función (884 MB contra un límite de 250) y el deploy falla antes
    // de compilar.
    const gResp = await fetch(`${origin}/${mapping.garmentPath.replace(/^\//, "")}`)
    if (!gResp.ok) return null
    const base = Buffer.from(await gResp.arrayBuffer())

    return await pegarEstampaPlana(
      designBuffer,
      base,
      mapping.coordinates,
      ANCHO_CM[printArea] ?? 20,
      printArea,
      side,
      POSICION[placement] ?? "left-chest",
    )
  } catch (e) {
    console.warn("[mockup-lifestyle] sin referencia con medida:", (e as Error)?.message)
    return null
  }
}

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
  if (!guard.allowed) return ok({ error: guard.message }, guard.status)

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
      /** Dónde va el logo chico. Sólo aplica a R1. */
      placement?: "left-chest" | "center" | "right-chest"
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
    // Dónde va el logo chico. Antes estaba fijo en "left chest": el cliente
    // elegía tamaño chico y sólo podía estamparlo sobre el corazón, sin opción
    // de centrarlo.
    const placement = body.placement ?? "left-chest"
    const chico =
      "a SMALL logo-sized print about 10 cm wide — roughly ONE EIGHTH of the garment's width, about the size of the wearer's palm. It must read as a discreet logo, NOT as a graphic"
    const logoChicoFrente =
      placement === "center"
        ? `${chico}, centred high on the chest at sternum height`
        : placement === "right-chest"
          ? `${chico}, on the wearer's right chest (viewer's left)`
          : `${chico}, on the left chest area`
    const logoChicoDorso =
      placement === "center"
        ? `${chico}, centred at the upper back just below the collar`
        : `${chico}, at the upper back between the shoulder blades`

    const printAreaDesc =
      printArea === "R1"
        ? side === "front"
          ? logoChicoFrente
          : logoChicoDorso
        : printArea === "R3"
          ? side === "front"
            ? "an OVERSIZED full-front graphic about 35 cm wide — as wide as the wearer's whole chest, from armpit seam to armpit seam, running from just below the collar down past the ribs. It must DOMINATE the garment, with only a narrow margin of plain fabric at each side. This is a big statement print, NOT a medium chest print"
            : "an OVERSIZED full-back graphic about 35 cm wide — as wide as the wearer's whole back, from shoulder to shoulder and down past the waist. It must DOMINATE the garment"
          : side === "front"
            ? "a MEDIUM centred chest print about 20 cm wide — roughly HALF the width of the garment's front, clearly smaller than a full-front graphic, leaving a wide band of plain fabric visible on BOTH sides of the print"
            : "a MEDIUM centred back print about 20 cm wide — roughly HALF the width of the garment's back, leaving plain fabric visible on both sides"
    const sideText = printAreaDesc
    const scenarioIdx =
      typeof body.scenario === "number" ? body.scenario % SCENARIOS.length : Math.floor(Math.random() * SCENARIOS.length)
    const scenario = SCENARIOS[scenarioIdx]

    // Referencia con la medida ya resuelta (0 llamadas al modelo). Si sale,
    // Gemini copia la proporción de ahí en vez de interpretarla del texto.
    const h = await headers()
    const host = h.get("host")
    const proto = h.get("x-forwarded-proto") || "https"
    const origin =
      (host ? `${proto}://${host}` : null) ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000"
    const referencia = await referenciaConMedida(
      imgBuffer,
      body.garmentType,
      body.garmentColor,
      side,
      printArea,
      placement,
      origin,
    )

    const prompt = referencia
      ? [
          "The input image is a flat product photo of the garment with the print ALREADY applied at its EXACT final size and position.",
          `Generate a photorealistic lifestyle photo of a young Argentinian person (20-30 years old, friendly natural expression, diverse looks) WEARING THAT EXACT ${colorNatural} ${garmentDesc}.`,
          "CRITICAL: the print must keep the SAME SIZE RELATIVE TO THE GARMENT and the SAME POSITION as in the reference. Measure it against the shirt: if it covers a small part of the chest in the reference, it must cover a small part of the chest on the person; if it spans nearly the whole chest, it must span nearly the whole chest. Do NOT resize, re-center or re-scale the print.",
          "Reproduce the artwork EXACTLY — same colors, same composition, same content. Do NOT extract a single element from it, do NOT simplify it into a logo or emblem, do not redesign, do not stylize, do not crop.",
          "Render it as a real DTG print: it follows the fabric's folds and shadows, slightly absorbed into the cotton, not glossy, no sticker edge.",
          `Setting: ${scenario}.`,
          "Composition: medium shot showing the upper body and the printed design clearly. Hyperrealistic, 4K, cinematic depth of field, natural skin tones.",
          "Do not add logos, watermarks, or extra text. Do not show a flat mockup, hanger or studio backdrop.",
          "Respond ONLY with the image (inlineData). No text.",
        ].join(" ")
      : [
          // Sin referencia (prenda sin base, o falló el pegado) se vuelve al
          // camino de siempre: la medida va descrita en palabras.
          `Generate a photorealistic lifestyle photo of a young Argentinian person (20-30 years old, friendly natural expression, diverse looks) wearing a ${colorNatural} ${garmentDesc}.`,
          `The garment shows the EXACT design from the input image printed on the ${sideText}, with realistic DTG print quality (slight fabric texture, natural ink absorption, no shiny edges).`,
          "The SIZE of the print relative to the garment is a CRITICAL requirement: match the described proportion exactly. Do not default to a medium chest print.",
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
        inlineData: referencia
          ? { mimeType: "image/png" as const, data: referencia.toString("base64") }
          : {
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
