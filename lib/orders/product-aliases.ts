/**
 * Resuelve nombres libres de producto (lo que el usuario tipea en el form)
 * a los nombres canónicos del catálogo de la pestaña SKU del Google Sheet.
 *
 * Catálogo canónico (fuente de verdad):
 *   Remera clásica man, Remera clásica woman, Remera Oversize unisex,
 *   Remera infantil, Remera Crop, Hoodie unisex, Buzo cuello redondo,
 *   Musculosa mujer morley
 *
 * Si el input no matchea ningún alias, se devuelve tal cual (Apps Script
 * reportará el error de catálogo — mejor que alias silencioso equivocado).
 */

export const CANONICAL_PRODUCTS = [
  "Remera clásica man",
  "Remera clásica woman",
  "Remera Oversize unisex",
  "Remera infantil",
  "Remera Crop",
  "Hoodie unisex",
  "Buzo cuello redondo",
  "Musculosa mujer morley",
] as const;

function normalizeKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Cada clave es el input normalizado (lower, sin tildes). Valor = nombre canónico del catálogo.
const ALIASES: Record<string, string> = {
  // ── Remera Oversize unisex ─────────────────────────────────────────────
  "remera oversize": "Remera Oversize unisex",
  "remera oversize unisex": "Remera Oversize unisex",
  "oversize": "Remera Oversize unisex",
  "remera os": "Remera Oversize unisex",
  "remera oversized": "Remera Oversize unisex",
  // nombre comercial Novamente ("Remera Aura" = la oversize)
  "aura": "Remera Oversize unisex",
  "remera aura": "Remera Oversize unisex",
  "aura oversize": "Remera Oversize unisex",
  "aura oversize t shirt": "Remera Oversize unisex",

  // ── Remera clásica man ────────────────────────────────────────────────
  // nombre comercial Novamente ("Aldea" = la classic fit; man salvo que diga mujer)
  "aldea": "Remera clásica man",
  "remera aldea": "Remera clásica man",
  "aldea classic fit": "Remera clásica man",
  "aldea classic fit t shirt": "Remera clásica man",
  "remera clasica": "Remera clásica man",
  "remera classic": "Remera clásica man",
  "remera basica": "Remera clásica man",
  "remera basica man": "Remera clásica man",
  "remera basica hombre": "Remera clásica man",
  "remera clasica man": "Remera clásica man",
  "remera clasica hombre": "Remera clásica man",
  "remera hombre": "Remera clásica man",
  "remera man": "Remera clásica man",
  "remera classic man": "Remera clásica man",

  // ── Remera clásica woman ──────────────────────────────────────────────
  // nombre comercial Novamente ("Buenos Aires" = la clásica mujer)
  "buenos aires": "Remera clásica woman",
  "remera buenos aires": "Remera clásica woman",
  "remera clasica woman": "Remera clásica woman",
  "remera clasica mujer": "Remera clásica woman",
  "remera basica woman": "Remera clásica woman",
  "remera basica mujer": "Remera clásica woman",
  "remera mujer": "Remera clásica woman",
  "remera woman": "Remera clásica woman",
  "remera classic woman": "Remera clásica woman",
  "remera dama": "Remera clásica woman",
  "remera clasica dama": "Remera clásica woman",
  "aldea mujer": "Remera clásica woman",
  "aldea woman": "Remera clásica woman",

  // ── Remera infantil ───────────────────────────────────────────────────
  // nombre comercial Novamente ("Bambino" = la infantil)
  "bambino": "Remera infantil",
  "remera bambino": "Remera infantil",
  "remera infantil": "Remera infantil",
  "remera nino": "Remera infantil",
  "remera nina": "Remera infantil",
  "remera nena": "Remera infantil",
  "remera nene": "Remera infantil",
  "remera kids": "Remera infantil",
  "infantil": "Remera infantil",

  // ── Remera Crop ───────────────────────────────────────────────────────
  // nombre comercial Novamente ("Bahamas" = la crop)
  "bahamas": "Remera Crop",
  "remera bahamas": "Remera Crop",
  "remera crop": "Remera Crop",
  "crop": "Remera Crop",
  "cropped": "Remera Crop",
  "remera cropped": "Remera Crop",
  "remera crop mujer": "Remera Crop",

  // ── Hoodie unisex ─────────────────────────────────────────────────────
  "hoodie": "Hoodie unisex",
  "hoodie unisex": "Hoodie unisex",
  "buzo hoodie": "Hoodie unisex",
  "canguro": "Hoodie unisex",
  "buzo canguro": "Hoodie unisex",
  // nombres comerciales Novamente: "Boston" y "Astra" (oversize hoodie)
  "boston": "Hoodie unisex",
  "buzo boston": "Hoodie unisex",
  "hoodie boston": "Hoodie unisex",
  "astra": "Hoodie unisex",
  "buzo astra": "Hoodie unisex",
  "astra hoodie": "Hoodie unisex",
  "astra oversize hoodie": "Hoodie unisex",
  "astra oversize": "Hoodie unisex",

  // ── Buzo cuello redondo ───────────────────────────────────────────────
  "buzo": "Buzo cuello redondo",
  "buzo redondo": "Buzo cuello redondo",
  "buzo cuello redondo": "Buzo cuello redondo",
  "buzo cuellito": "Buzo cuello redondo",
  "crewneck": "Buzo cuello redondo",
  "buzo basico": "Buzo cuello redondo",
  // nombre comercial Novamente ("Buzo Berlin")
  "berlin": "Buzo cuello redondo",
  "buzo berlin": "Buzo cuello redondo",

  // ── Musculosa mujer morley ────────────────────────────────────────────
  // nombre comercial Novamente ("Bali" = la musculosa)
  "bali": "Musculosa mujer morley",
  "musculosa bali": "Musculosa mujer morley",
  "musculosa": "Musculosa mujer morley",
  "musculosa mujer": "Musculosa mujer morley",
  "musculosa morley": "Musculosa mujer morley",
  "musculosa mujer morley": "Musculosa mujer morley",
};

/**
 * Devuelve el nombre canónico si hay match; si no, el input original.
 */
export function resolveProduct(input: string): string {
  const key = normalizeKey(input);
  if (ALIASES[key]) return ALIASES[key];
  // Heurística por keywords: los nombres del storefront no matchean el mapa
  // exacto (ej. "Buzo Hoodie Oversize Custom — Novamente" de una venta web
  // precargada desde la ficha). Orden importa: hoodie antes que oversize.
  if (
    key.includes("hoodie") ||
    key.includes("canguro") ||
    key.includes("boston") ||
    key.includes("astra") ||
    (key.includes("buzo") && key.includes("capucha"))
  ) {
    return "Hoodie unisex";
  }
  if (
    key.includes("crewneck") ||
    key.includes("berlin") ||
    (key.includes("buzo") && (key.includes("cuello") || key.includes("redondo")))
  ) {
    return "Buzo cuello redondo";
  }
  if (key.includes("crop") || key.includes("bahamas")) return "Remera Crop";
  if (key.includes("musculosa") || key.includes("tank") || key.includes("bali")) return "Musculosa mujer morley";
  if (key.includes("infantil") || key.includes("kids") || key.includes("bambino") || key.includes("nene") || key.includes("nena")) {
    return "Remera infantil";
  }
  // nombres comerciales web: "Remera Aura Oversize Custom — Novamente" = oversize,
  // "Remera Aldea Classic Fit Custom — Novamente" o "Remera Clasica Mujer Custom — Novamente" = clásica (caso NOV-20260823-7495).
  if (key.includes("aura")) return "Remera Oversize unisex";
  if (
    key.includes("aldea") ||
    key.includes("classic fit") ||
    key.includes("clasica") ||
    key.includes("clasico") ||
    key.includes("classic") ||
    key.includes("basica") ||
    key.includes("basico") ||
    key.includes("basic") ||
    key.includes("buenos aires")
  ) {
    return key.includes("mujer") || key.includes("woman") || key.includes("dama") || key.includes("fem") || key.includes("buenos aires")
      ? "Remera clásica woman"
      : "Remera clásica man";
  }
  if (key.includes("remera") && (key.includes("mujer") || key.includes("woman") || key.includes("dama") || key.includes("fem"))) {
    return "Remera clásica woman";
  }
  if (key.includes("remera") && (key.includes("hombre") || key.includes("man") || key.includes("masculin"))) {
    return "Remera clásica man";
  }
  if (key.includes("remera") && key.includes("oversize")) return "Remera Oversize unisex";
  if (key === "remera" || key === "tshirt" || key === "t shirt") return "Remera clásica man";
  return input;
}
