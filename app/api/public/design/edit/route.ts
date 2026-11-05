import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { uploadFile } from "@/lib/cloudflare-r2"
import { corsHeaders, preflightResponse } from "@/lib/security/cors"
import { guardPublicImageGen } from "@/lib/security/public-image-guard"
import { meterPublicImageGen } from "@/lib/security/meter-usage"

export const runtime = "nodejs"
// Puede hacer 2 generaciones en serie (reintento si salió igual) + descarga,
// comparación, limpieza de fondo y upload. Sin esto, el caso que se arregla
// terminaba en 504.
export const maxDuration = 120

// Editar tiene su PROPIA variable, antes que la de generar: el A/B ciego de
// 17/07 dio pro ganador para edicion (6-3-10) mientras que para generar habia
// empatado (6-5-9). O sea que mover /crear a flash NO implica mover edicion:
// sin GEMINI_PUBLIC_EDIT_MODEL esta ruta sigue la cadena de siempre.
const IMAGE_MODEL =
  process.env.GEMINI_PUBLIC_EDIT_MODEL ||
  process.env.GEMINI_PUBLIC_DESIGN_MODEL ||
  process.env.GEMINI_IMAGE_MODEL ||
  "gemini-2.5-flash-image"

// Reintento cuando la primera edición devuelve la misma imagen. Prueba real
// 05/11 (playa + delfín + combi, input de prod): gemini-2.5-flash-image dio la
// MISMA imagen con el prompt viejo, con el nuevo y con 3 reformulaciones
// (0,5–1,8 % de cambio); gemini-3.1-flash-image (flash, NO pro) aplicó bien
// tamaño, proporción y posición al primer intento. Cuesta US$0,067 contra
// 0,039, pero solo corre en el ~10 % de ediciones que salen iguales.
// gemini-3-pro-image NO va acá sin OK de Juan (tope Gemini US$75/mes).
const RETRY_IMAGE_MODEL =
  process.env.GEMINI_PUBLIC_EDIT_RETRY_MODEL || "gemini-3.1-flash-image"

export async function OPTIONS(req: NextRequest) {
  return preflightResponse(req)
}

export async function POST(req: NextRequest) {
  function ok(data: unknown, status = 200) {
    return new NextResponse(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders(req) },
    })
  }

  // Peek del prompt (instruction) para estadisticas del guard — clone() no
  // consume el body real, que se vuelve a leer mas abajo con req.json().
  let promptForGuard: string | undefined
  try {
    const peek = await req.clone().json()
    if (typeof peek?.instruction === "string") promptForGuard = peek.instruction
  } catch {
    // body invalido o no-JSON — se maneja mas abajo al parsear de verdad
  }

  const guard = await guardPublicImageGen(req, "design-edit", { prompt: promptForGuard })
  if (!guard.allowed) return ok({ error: guard.message }, guard.status)

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return ok({ error: "Missing GEMINI_API_KEY" }, 500)

    const body = await req.json() as {
      previousImageUrl: string
      instruction: string
      mode?: "photo" | "illustration"
      raw?: boolean
      garmentColor?: string
    }
    const { previousImageUrl, instruction } = body
    // 'photo' = user-uploaded photo (preserva personas/fondo real)
    // 'illustration' = iterar sobre un design generado
    // raw=true → diseño para estampa: limpia el fondo blanco/damero al subir
    const mode = body.mode ?? "illustration"
    const rawMode = body.raw === true || mode === "photo"

    if (!previousImageUrl || !instruction?.trim()) {
      return ok({ error: "Se requieren previousImageUrl e instruction" }, 400)
    }

    // Download previous image from R2/URL. El upload endpoint devuelve URLs
    // relativas (/api/proxy-image?key=...) — las resolvemos a absolutas.
    const { resolveAbsoluteUrl } = await import("@/lib/absolute-url")
    const resolvedImageUrl = resolveAbsoluteUrl(previousImageUrl, req)
    const imgRes = await fetch(resolvedImageUrl)
    if (!imgRes.ok) {
      return ok({ error: `No se pudo descargar la imagen anterior (${imgRes.status})` }, 400)
    }
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
    const contentType = imgRes.headers.get("content-type") || "image/png"
    const base64Data = imgBuffer.toString("base64")

    // Prompt de EDICIÓN propio (ver lib/designer/edit-prompt.ts): antes se
    // reusaba el stack de generar, que enterraba la instrucción y le pedía
    // "preservar la composición" — Gemini devolvía la misma imagen o hacía lo
    // contrario con tamaños/posiciones (caso real 05/11, delfín + combi).
    const { buildEditPrompt } = await import("@/lib/designer/edit-prompt")
    const { measureImageChange, isUnchanged } = await import("@/lib/designer/image-change")

    const genAI = new GoogleGenerativeAI(apiKey)

    async function runEdit(attempt: number, modelName: string) {
      const prompt = buildEditPrompt(instruction, { mode, garmentColor: body.garmentColor, attempt })
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: contentType as "image/png" | "image/jpeg" | "image/webp",
            data: base64Data,
          },
        },
        prompt,
      ])
      // Cada llamada a Gemini se factura — se mide TODAS, también el reintento.
      // usageMetadata real: este modelo puede facturar "thinking" tokens aparte
      // del precio plano por imagen (ver lib/security/meter-usage.ts).
      await meterPublicImageGen({
        endpoint: "public/design/edit",
        model: modelName,
        usageMetadata: (result.response as any)?.usageMetadata,
        metadata: { attempt },
      })
      let imageBase64: string | null = null
      for (const cand of result.response?.candidates ?? []) {
        for (const part of cand?.content?.parts ?? []) {
          // @ts-ignore
          const inline = part?.inlineData
          // @ts-ignore
          if (inline?.mimeType?.startsWith("image/") && typeof inline?.data === "string") {
            // @ts-ignore
            imageBase64 = inline.data
            break
          }
        }
        if (imageBase64) break
      }
      return { prompt, imageBase64 }
    }

    // Gemini a veces devuelve la MISMA imagen re-codificada en vez de aplicar
    // el pedido (9 de 91 ediciones, 07/10–05/11). Se compara contra la de
    // entrada y, si casi no cambió, se reintenta UNA vez con un prompt más
    // fuerte y con RETRY_IMAGE_MODEL, dentro del mismo request (no descuenta
    // otro diseño del cupo).
    // Si sigue igual, se avisa (unchanged) en vez de mostrarla como nueva.
    let attempt = 1
    let { prompt: editInstruction, imageBase64 } = await runEdit(attempt, IMAGE_MODEL)
    let changePct: number | null = null
    if (imageBase64) {
      changePct = await measureImageChange(imgBuffer, Buffer.from(imageBase64, "base64")).catch(() => null)
      if (changePct !== null && isUnchanged(changePct)) {
        console.log(`EDIT unchanged on attempt 1 (${changePct.toFixed(2)}% changed) — retrying`)
        attempt = 2
        // Si el reintento falla (500/503 de Gemini) no se tira abajo el
        // request: cae al aviso de "salió igual" de abajo.
        const retry = await runEdit(attempt, RETRY_IMAGE_MODEL).catch((e) => {
          console.warn("EDIT retry failed:", (e as Error)?.message)
          return { prompt: editInstruction, imageBase64: null as string | null }
        })
        if (retry.imageBase64) {
          const retryPct = await measureImageChange(imgBuffer, Buffer.from(retry.imageBase64, "base64")).catch(() => null)
          // Falla la medición → se toma igual el reintento (no hay cómo saber
          // que salió peor, y el primero ya sabemos que salió igual).
          if (retryPct === null || retryPct > changePct) {
            imageBase64 = retry.imageBase64
            editInstruction = retry.prompt
            changePct = retryPct
          }
        }
      }
    }

    if (!imageBase64) {
      return ok(
        { error: "Gemini no devolvió imagen. Intentá un prompt más específico." },
        502,
      )
    }

    if (changePct !== null && isUnchanged(changePct)) {
      console.log(`EDIT still unchanged after retry (${changePct.toFixed(2)}% changed)`)
      return ok({
        success: false,
        unchanged: true,
        attempts: attempt,
        changePct: Number(changePct.toFixed(2)),
        error: "No logré aplicar ese cambio: la imagen salió prácticamente igual.",
      })
    }

    // Upload to R2
    let buffer = Buffer.from(imageBase64, "base64")

    // Limpieza de fondo ANTES de subir. Este endpoint no limpiaba nada, y su
    // propio prompt le pide a Gemini "output a transparent PNG" cuando el
    // usuario dice "sin fondo" — que es exactamente lo que Gemini no puede
    // hacer: pinta el damero de transparencia como píxeles opacos y acá se
    // subía tal cual (caso real 15/08: león de un cliente de partner llegó al
    // mockup con el damero impreso). Gate: modo raw (diseño para estampa,
    // siempre se quiere el sujeto aislado) o instrucción que hable del fondo.
    // NO corre en ediciones de foto comunes ("más brillo") para no comerle el
    // fondo real a una foto.
    const wantsIsolation = rawMode || /fondo|background|transparen|png/i.test(instruction)
    if (wantsIsolation) {
      try {
        const { removeWhiteBackground } = await import("@/lib/designer/remove-white-bg")
        const white = await removeWhiteBackground(buffer)
        if (white.removed) buffer = white.buffer as typeof buffer
        // El pase de damero corre SIEMPRE después del blanco: las celdas
        // claras del damero superan el umbral blanco y el primer pase puede
        // morder solo el anillo del borde y reportar "removió" dejando el
        // resto del damero. Sobre un fondo ya limpio es no-op por guardrails.
        const { removeCheckerboardBackground } = await import("@/lib/designer/remove-checkerboard-bg")
        const chk = await removeCheckerboardBackground(buffer)
        if (chk.removed) buffer = chk.buffer as typeof buffer
        console.log(`EDIT bg cleanup: white=${white.removed ? "OK" : "skipped"}, checkerboard=${chk.removed ? `OK (${(chk.frac * 100).toFixed(0)}%)` : `skipped (${chk.reason})`}`)
      } catch (e) {
        console.warn("EDIT bg cleanup failed:", (e as Error).message)
      }
    }

    const key = `v1/edited-designs/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.png`
    const { url } = await uploadFile(buffer, key, "image/png")

    return ok({
      success: true,
      images: [{ url }],
      prompt: editInstruction,
      attempts: attempt,
      changePct: changePct === null ? null : Number(changePct.toFixed(2)),
    })
  } catch (e: any) {
    return ok({ error: e?.message ?? "Error editando imagen" }, 500)
  }
}
