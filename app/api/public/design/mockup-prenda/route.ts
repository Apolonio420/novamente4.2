/**
 * Mockup PLANO: la prenda sola con la estampa, sin persona ni escenario.
 *
 * Complementa a mockup-lifestyle. La foto lifestyle sirve para enamorarse del
 * diseño, pero no deja ver bien dónde queda la estampa ni de qué tamaño: para
 * eso está esta, que muestra la prenda derecha y con la medida respetada.
 *
 * Se genera SÓLO cuando el cliente lo pide (botón aparte). Cada llamada cuesta,
 * así que no se dispara junto con la lifestyle.
 */
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { uploadFile } from "@/lib/cloudflare-r2"
import { corsHeaders, preflightResponse } from "@/lib/security/cors"
import { guardPublicImageGen } from "@/lib/security/public-image-guard"
import { meterPublicImageGen } from "@/lib/security/meter-usage"
import { resolveAbsoluteUrl } from "@/lib/absolute-url"
import { getGarmentMapping } from "@/lib/garment-mappings"
import { generatePerfectStamp } from "@/lib/mockup/perfect-stamp"

export const maxDuration = 120

/** cm de ancho de la estampa según el tamaño elegido en /crear. */
const ANCHO_CM: Record<string, number> = { R1: 10, R2: 20, R3: 35 }

/** Las posiciones de /crear, traducidas a las del motor de mockups. */
const POSICION: Record<string, string> = {
  "left-chest": "left-chest",
  center: "center-high",
  "right-chest": "right-chest",
}

export async function OPTIONS(req: NextRequest) {
  return preflightResponse(req)
}

export async function POST(req: NextRequest) {
  const ch = corsHeaders(req)
  const ok = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: ch })

  // Mismo guard que el resto de los endpoints públicos de imagen: sin esto
  // sería una llamada a Gemini que cualquiera puede disparar sin tope.
  const guard = await guardPublicImageGen(req, "mockup-prenda")
  if (!guard.allowed) return ok({ error: guard.message }, guard.status)

  try {
    const body = (await req.json()) as {
      designImageUrl?: string
      garmentType?: string
      garmentColor?: string
      side?: "front" | "back"
      printArea?: "R1" | "R2" | "R3"
      placement?: "left-chest" | "center" | "right-chest"
    }

    if (!body.designImageUrl || !body.garmentType) {
      return ok({ error: "Faltan datos del diseño" }, 400)
    }

    const side = body.side === "back" ? "back" : "front"
    const color = body.garmentColor || "black"
    const mapping = getGarmentMapping(body.garmentType, color, side)
    if (!mapping || mapping.garmentPath === "fallback") {
      return ok(
        {
          error:
            side === "back"
              ? "Todavía no tenemos el dorso de esta prenda para mostrar. Probá con el frente 🙌"
              : "Todavía no tenemos esta combinación de prenda y color para mostrar.",
        },
        422,
      )
    }

    // Diseño
    let designBuffer: Buffer
    if (body.designImageUrl.startsWith("data:")) {
      designBuffer = Buffer.from(body.designImageUrl.replace(/^data:image\/[^;]+;base64,/, ""), "base64")
    } else {
      // El diseño llega como URL RELATIVA (/api/proxy-image?key=...): el upload
      // devuelve rutas relativas para no exponer las keys de R2. Un fetch sobre
      // eso desde el servidor tira, y era la causa del 500 al pedir la prenda
      // sola. El helper ya existía; había que usarlo.
      const r = await fetch(resolveAbsoluteUrl(body.designImageUrl, req))
      if (!r.ok) return ok({ error: "No se pudo leer el diseño" }, 400)
      designBuffer = Buffer.from(await r.arrayBuffer())
    }

    // Prenda base: se baja por HTTP, NO se lee del disco.
    //
    // Leerla con fs.readFileSync(process.cwd()/public/...) hace que el tracer de
    // Vercel meta TODO el directorio public/ en el bundle de la función: la
    // primera versión de esta ruta pesaba 884 MB contra un límite de 250 y el
    // deploy fallaba antes de compilar. Es el mismo patrón que usan las otras
    // rutas de mockup.
    const h = await headers()
    const host = h.get("host")
    const proto = h.get("x-forwarded-proto") || "https"
    const origin =
      (host ? `${proto}://${host}` : null) ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000"

    const garmentUrl = `${origin}/${mapping.garmentPath.replace(/^\//, "")}`
    const gResp = await fetch(garmentUrl)
    if (!gResp.ok) return ok({ error: "No se pudo cargar la prenda base" }, 500)
    const baseBuffer = Buffer.from(await gResp.arrayBuffer())

    const stats = { geminiCalls: 0 }
    const png = await generatePerfectStamp({
      designBuffer,
      baseGarmentBuffer: baseBuffer,
      imprint: mapping.coordinates,
      side,
      stampSize: body.printArea ?? "R2",
      placement: POSICION[body.placement ?? "left-chest"],
      // La medida importa: por el cuadro rojo el modelo la interpreta y un
      // diseño denso pedido chico salía al doble.
      stampWidthCm: ANCHO_CM[body.printArea ?? "R2"],
      stats,
    })

    const key = `crear/mockups-prenda/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`
    const subida = await uploadFile(png, key, "image/png")

    await meterPublicImageGen({
      endpoint: "public/design/mockup-prenda",
      model: process.env.GEMINI_STAMP_MODEL ?? process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image",
      units: stats.geminiCalls,
    })

    // Absoluta: el <Image> del chat no puede optimizar una ruta relativa
    // (/_next/image?url=%2Fapi%2Fproxy-image... da 404) y la foto salía rota.
    const urlAbsoluta = resolveAbsoluteUrl(subida.url, req)
    return ok({ publicUrl: urlAbsoluta, mockupUrl: urlAbsoluta })
  } catch (e: any) {
    console.error("[public/design/mockup-prenda]", e?.message || e)
    return ok({ error: "No se pudo generar la foto de la prenda" }, 500)
  }
}
