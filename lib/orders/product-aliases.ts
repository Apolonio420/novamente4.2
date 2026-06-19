/**
 * Resuelve nombres libres de producto (lo que el partner tipea/pega) a los
 * nombres canónicos del catálogo de producción (pestaña SKU del Google Sheet).
 *
 * Portado desde novamente-platform-master/lib/orders/product-aliases.ts — la
 * fuente de verdad del catálogo es el Apps Script de producción. Si el input no
 * matchea ningún alias, se devuelve tal cual (mejor que un alias equivocado).
 *
 * Catálogo canónico:
 *   Remera clásica man, Remera clásica woman, Remera Oversize unisex,
 *   Remera infantil, Remera Crop, Hoodie unisex, Buzo cuello redondo,
 *   Musculosa mujer morley
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
    .replace(/[̀-ͯ]/g, "") // quitar tildes
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

  // ── Remera clásica man ────────────────────────────────────────────────
  "remera clasica man": "Remera clásica man",
  "remera clasica hombre": "Remera clásica man",
  "remera hombre": "Remera clásica man",
  "remera man": "Remera clásica man",
  "remera classic man": "Remera clásica man",

  // ── Remera clásica woman ──────────────────────────────────────────────
  "remera clasica woman": "Remera clásica woman",
  "remera clasica mujer": "Remera clásica woman",
  "remera mujer": "Remera clásica woman",
  "remera woman": "Remera clásica woman",
  "remera classic woman": "Remera clásica woman",

  // ── Remera infantil ───────────────────────────────────────────────────
  "remera infantil": "Remera infantil",
  "remera nino": "Remera infantil",
  "remera nina": "Remera infantil",
  "remera nena": "Remera infantil",
  "remera nene": "Remera infantil",
  "remera kids": "Remera infantil",
  "infantil": "Remera infantil",

  // ── Remera Crop ───────────────────────────────────────────────────────
  "remera crop": "Remera Crop",
  "crop": "Remera Crop",
  "cropped": "Remera Crop",
  "remera cropped": "Remera Crop",

  // ── Hoodie unisex ─────────────────────────────────────────────────────
  "hoodie": "Hoodie unisex",
  "hoodie unisex": "Hoodie unisex",
  "buzo hoodie": "Hoodie unisex",
  "canguro": "Hoodie unisex",
  "buzo canguro": "Hoodie unisex",

  // ── Buzo cuello redondo ───────────────────────────────────────────────
  "buzo": "Buzo cuello redondo",
  "buzo redondo": "Buzo cuello redondo",
  "buzo cuello redondo": "Buzo cuello redondo",
  "buzo cuellito": "Buzo cuello redondo",
  "crewneck": "Buzo cuello redondo",
  "buzo basico": "Buzo cuello redondo",

  // ── Musculosa mujer morley ────────────────────────────────────────────
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
  return ALIASES[key] ?? input;
}
