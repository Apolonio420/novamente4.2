/**
 * Garment template + print-area helpers compartidos por el editor (DesignCanvas)
 * y la vista de ambos lados (DoubleSidePreview).
 *
 * Refleja los mapas calibrados de DesignCanvas.tsx (canvas 600×600, templates 1:1).
 * Si cambia una caja de impresión o un template, actualizar ambos lugares.
 */

export type PrintBox = { x: number; y: number; w: number; h: number }

// Canvas/coordenada base: todos los templates de prenda son 1:1 (600×600).
export const CANVAS_W = 600
export const CANVAS_H = 600

// Áreas de impresión REALES por prenda+lado (en coordenadas del canvas 600×600).
export const PRINT_AREAS: Record<string, { front: PrintBox; back?: PrintBox }> = {
  tshirt: { front: { x: 185, y: 170, w: 230, h: 270 }, back: { x: 180, y: 150, w: 240, h: 290 } },
  hoodie: { front: { x: 160, y: 140, w: 280, h: 215 }, back: { x: 165, y: 245, w: 270, h: 215 } },
  // Estas tres tenían las fotos de dorso en public/garments desde siempre, pero
  // sin `back` acá hasBackTemplate() daba false y el doble estampado quedaba
  // deshabilitado. Las cajas de dorso salen de la misma relación que ya tenía
  // la remera (front {185,170,230,270} → back {180,150,240,290}): la espalda
  // arranca un poco más arriba y es algo más ancha, porque no tiene el escote.
  //
  // Verificado que existe el dorso para TODOS los colores de cada una.
  crew: {
    front: { x: 195, y: 195, w: 210, h: 240 },
    back: { x: 190, y: 175, w: 220, h: 260 },
  },
  clasica: {
    front: { x: 195, y: 195, w: 210, h: 230 },
    back: { x: 190, y: 175, w: 220, h: 250 },
  },
  crop: {
    front: { x: 195, y: 185, w: 210, h: 200 },
    back: { x: 190, y: 165, w: 220, h: 220 },
  },
  // musculosa: el "falta el dorso en negro" que la tenía deshabilitada era un
  // bloqueo fantasma — la Bali se vende SOLO en blanca y gris (ver
  // lib/catalog/products.ts) y esos dos dorsos existen, con sus entradas
  // mapeadas a mano en garment-mappings.json. La caja del dorso sale de
  // aplicarle a la caja afinada del frente el mismo delta frente→dorso de ese
  // mapping (el dorso es más angosto entre los breteles), verificada
  // visualmente sobre las dos fotos.
  musculosa: {
    front: { x: 220, y: 230, w: 160, h: 210 },
    back: { x: 238, y: 236, w: 124, h: 198 },
  },
  // Bahía (totebag): caja centrada en el panel de tela, debajo de las asas —
  // misma fracción que canonical-print-zones de platform ([0.30, 0.45, 0.70,
  // 0.78] sobre 600px). El dorso usa la MISMA caja: las fotos de frente y dorso
  // (totebag-crudo-{front,back}.jpeg) tienen idéntico encuadre, igual que sus
  // entradas en lib/garment-mappings.json (coordenadas idénticas por lado).
  totebag: {
    front: { x: 180, y: 270, w: 240, h: 198 },
    back: { x: 180, y: 270, w: 240, h: 198 },
  },
}

export function garmentKind(garmentType: string): keyof typeof PRINT_AREAS {
  const g = garmentType.toLowerCase()
  if (g.includes("hoodie")) return "hoodie"
  if (g.includes("cuello-redondo") || g.includes("crew")) return "crew"
  if (g.includes("crop")) return "crop"
  if (g.includes("musculosa") || g.includes("bali")) return "musculosa"
  if (g.includes("tote") || g.includes("bahia")) return "totebag"
  if (g.includes("clasica-mujer")) return "clasica"
  return "tshirt"
}

/** Área de impresión para la prenda+lado actual (fallback al frente). */
export function getPrintArea(garmentType: string, side: "front" | "back"): PrintBox {
  const areas = PRINT_AREAS[garmentKind(garmentType)]
  return (side === "back" ? areas.back : areas.front) ?? areas.front
}

/** Prendas que tienen template de espalda disponible (habilitan doble estampado). */
export function hasBackTemplate(garmentType: string): boolean {
  return PRINT_AREAS[garmentKind(garmentType)].back != null
}

const COLOR_MAP: Record<string, string> = {
  negro: "black",
  blanco: "white",
  stone_wash: "stone-wash",
  gris: "gray",
  crema: "cream",
  caramel: "caramel",
  marron: "marron",
}

/** Lista de URLs candidatas (en orden de prioridad) del template de la prenda. */
export function resolveGarmentTemplate(garmentType: string, color: string, side: "front" | "back"): string[] {
  const mappedColor = COLOR_MAP[color.toLowerCase()] ?? color
  const c = mappedColor.toLowerCase().replace(/\s+/g, "-")
  const s = side

  const candidates: string[] = []
  switch (garmentType) {
    case "aldea-classic-tshirt":
      candidates.push(`/garments/tshirt-${c}-classic-${s}.jpeg`, `/garments/tshirt-${c}-classic-${s}.png`)
      break
    case "aura-oversize-tshirt":
      candidates.push(`/garments/tshirt-${c}-oversize-${s}.jpeg`, `/garments/tshirt-${c}-oversize-${s}.png`)
      break
    case "remera-clasica-mujer":
      candidates.push(`/garments/remera-clasica-mujer-${c}-${s}.png`)
      break
    case "remera-crop-mujer":
      candidates.push(`/garments/remera-crop-mujer-${c}-${s}.png`)
      break
    case "musculosa-bali":
      candidates.push(`/garments/musculosa-bali-${c}-${s}.png`)
      break
    case "buzo-cuello-redondo":
      candidates.push(`/garments/buzo-cuello-redondo-${c}-${s}.png`)
      break
    case "totebag":
      // Bahía: hay foto real de frente Y dorso (mismo encuadre, 1500×1500).
      candidates.push(`/garments/totebag-${c}-${s}.jpeg`)
      break
    case "buzo-hoodie-unisex":
      candidates.push(`/garments/buzo-hoodie-unisex-${c}-${s}.png`, `/garments/buzo-hoodie-unisex-${c}-${s}.jpeg`)
      break
    default:
      if (garmentType.includes("hoodie")) candidates.push(`/garments/buzo-hoodie-unisex-${c}-${s}.png`)
      else if (garmentType.includes("buzo")) candidates.push(`/garments/buzo-cuello-redondo-${c}-${s}.png`)
      else if (garmentType.includes("crop")) candidates.push(`/garments/remera-crop-mujer-${c}-${s}.png`)
      else if (garmentType.includes("musculosa")) candidates.push(`/garments/musculosa-bali-${c}-${s}.png`)
      else if (garmentType.includes("tote")) candidates.push(`/garments/totebag-${c}-${s}.jpeg`)
      else candidates.push(`/garments/tshirt-${c}-classic-${s}.jpeg`)
  }
  return candidates
}

/** Porcentajes (0–1) del print-area dentro del canvas — para overlay CSS. */
export function printAreaPct(garmentType: string, side: "front" | "back") {
  const a = getPrintArea(garmentType, side)
  return {
    left: a.x / CANVAS_W,
    top: a.y / CANVAS_H,
    width: a.w / CANVAS_W,
    height: a.h / CANVAS_H,
  }
}
