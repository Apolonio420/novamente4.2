/**
 * buildEditPrompt
 *
 * Prompt para EDITAR una imagen que ya existe (/api/public/design/edit).
 *
 * Antes la edición reusaba buildPrintReadyPrompt, que es el stack de GENERAR:
 * la instrucción quedaba enterrada al principio de ~6 bloques de reglas, con
 * "preserving the overall composition" pegado al lado, y al final (donde más
 * pesa) FRAMING_RULE ("nada puede tocar ni salirse del borde"). Resultado en
 * prod (05/11, playa + delfín + combi):
 * - "ajustá los tamaños para que sean más proporcionales" → misma imagen
 *   (preservar la composición le ganó al pedido);
 * - "que del lado izquierdo se vea apareciendo la trompa de la camioneta" →
 *   la camioneta quedó AFUERA del cuadro (FRAMING_RULE contra el pedido);
 * - "que la camioneta no tape tanto el mar" → la puso más de costado y tapaba
 *   más (nadie le explicó qué significa "darle protagonismo" en píxeles).
 *
 * Ahora: la instrucción va primero y se repite al final, "cambiá exactamente
 * esto y dejá igual lo que no se menciona", reglas explícitas de tamaño,
 * posición y proporción, y solo las reglas de impresión mínimas.
 */
import { normalizeGarmentColor } from "./print-ready-prompt"

export type EditPromptOptions = {
  /** 'photo' = foto subida por el cliente; 'illustration' = diseño del Studio */
  mode?: "photo" | "illustration"
  garmentColor?: string
  /** 1 = primer intento; 2 = reintento porque el primero devolvió la misma imagen */
  attempt?: number
}

const SPATIAL_RULES = [
  "HOW TO READ SIZE, POSITION AND PROPORTION REQUESTS:",
  "- 'smaller' / 'más chico' / 'achicá' = the element must occupy clearly less area (about 30–50% smaller); 'bigger' / 'más grande' / 'agrandá' = clearly more area. The change must be obvious at a glance.",
  "- 'more realistic proportions' / 'proporciones más reales' = rescale elements to their real-world relative sizes (e.g. a dolphin is much smaller than a van; a person is about as tall as a door). Resize the elements that are out of scale, even if that changes the layout.",
  "- Left / right always mean the viewer's left / right. 'Move X' = X changes position by a visible amount in that direction, and the space it leaves is filled with the background that would naturally be there.",
  "- 'Give more prominence / space to Y' or 'that X doesn't cover Y' = Y must end up occupying MORE of the image and being LESS covered than before. Do this by making the other elements smaller and/or moving them toward an edge, never by rotating or enlarging them so they cover Y even more.",
  "- 'Lower' / 'más abajo' = toward the bottom of the image; 'farther away' / 'más lejos' = smaller and closer to the horizon.",
  "- If the instruction asks for something to appear partially (e.g. 'only the front of the van, coming in from the left'), show that part inside the artwork, cut by the artwork's own border, never outside it.",
].join("\n")

function printRules(garmentColor: string | undefined): string {
  const garment = normalizeGarmentColor(garmentColor)
  const contrast =
    garment === "black" || garment === "dark"
      ? "It will be printed on a dark garment: dark elements need light outlines or rim light so they stay visible."
      : garment === "white" || garment === "cream" || garment === "light"
        ? "It will be printed on a light garment: light elements need dark outlines so they stay visible."
        : ""
  return [
    "PRINT RULES: keep the result an isolated print-ready artwork on a plain SOLID PURE WHITE background (#FFFFFF), never a checkerboard.",
    "Do NOT show a t-shirt, hoodie, model, mockup or garment. ONE single artwork, no panels, no before/after.",
    "Keep any existing text exactly as it is. Do NOT add new words unless the instruction explicitly asks to write them (a word like 'ESPALDA' or 'FRENTE' alone refers to the garment side, not text to draw).",
    contrast,
  ]
    .filter(Boolean)
    .join(" ")
}

export function buildEditPrompt(instruction: string, options: EditPromptOptions = {}): string {
  const userInstruction = instruction.trim().replace(/\s+/g, " ")
  const mode = options.mode ?? "illustration"
  const attempt = options.attempt ?? 1

  const blocks: string[] = []

  if (attempt > 1) {
    blocks.push(
      "IMPORTANT: a previous attempt returned this image practically UNCHANGED, ignoring the request. That is a failure. This time the requested change MUST be clearly visible when comparing before and after.",
    )
  }

  blocks.push(
    `EDIT THIS IMAGE. The user's request (in Spanish, Argentina) is: "${userInstruction}"`,
  )

  blocks.push(
    mode === "photo"
      ? "Apply exactly the requested change. Keep everything the request does not mention as it is: the same people, faces, pets and objects with their identity. Do NOT replace the subjects with something else. If the user asks to remove the background ('sin fondo'), keep only the main subject on solid white."
      : "Apply exactly the requested change, even if it means changing the layout, sizes or positions. Keep everything the request does not mention: same subject, same illustration style, same colors, same text. Never return the image unchanged.",
  )

  blocks.push(SPATIAL_RULES)

  if (mode === "illustration") blocks.push(printRules(options.garmentColor))

  blocks.push(`Now apply the request: "${userInstruction}". Respond ONLY with the edited image (inlineData). No text.`)

  return blocks.join("\n\n")
}
