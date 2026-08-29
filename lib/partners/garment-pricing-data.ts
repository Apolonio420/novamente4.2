/**
 * Catalogo crudo de pricing de prendas para partners — INCLUYE `cost` (costo
 * real de produccion). Este modulo es de datos puros (sin `server-only`) pero
 * NO debe importarse jamas desde un componente 'use client' ni desde ningun
 * modulo que pueda terminar en un bundle cliente: `cost` es el costo real que
 * paga Novamente al proveedor y es INNEGOCIABLE que no viaje al navegador
 * (revela el margen exacto de Novamente sobre cada precio de plan).
 *
 * Unico importador permitido: `./garment-pricing.server` (que agrega el guard
 * `server-only` y expone las vistas derivadas sin costo). Ver
 * garment-pricing.server.test.ts para el test que verifica el aislamiento.
 *
 * Synced from whatsapp-sales-bot/lib/payments/payment-link.ts CATALOG.
 */

export interface GarmentPricing {
  key: string
  name: string
  /**
   * Costo real de produccion (peor color por familia, Cost_2_Print del Excel 2.6.26 dreamful).
   * Base para calcular precio Growth/Pro = cost + GROWTH_TIER_DELTA_ARS[tier].
   * Precio unico por familia para respetar regla comercial "mismo precio todos los colores".
   * INNEGOCIABLE: nunca renderizar este valor en UI/API del lado del cliente.
   */
  cost: number
  /** B2B Partner price (1u, retail B2B publicado en /b2b-precios-2026). */
  on_demand: number
  /** B2B Starter price (5-9 units/month, volume-based) */
  b2b_starter: number
  /** B2B Pro price (10-20 units/month, volume-based) */
  b2b_pro: number
  /** B2B Drop price (30-99 units/month, volume-based) */
  b2b_drop: number
  /** B2B Bulk price (100+ units/month, volume-based) */
  b2b_bulk: number
  /** Suggested retail price (B2C web). What Starter plan partners pay. */
  b2c_suggested: number
  /**
   * Override de la tabla Growth/Pro cuando `cost + delta` NO aplica. Único caso
   * hoy: la totebag, cuyo costo real varía por cantidad (16.000 / 12.000 /
   * 9.000) mientras `cost` acá es un escalar — la fórmula daba precios de un
   * costo irreal. El override respeta la regla del 8% (growth = tier B2B −8%).
   */
  growth_override?: Record<'partner' | 'starter' | 'pro' | 'drop' | 'bulk', number>
}

// ---------------------------------------------------------------------------
// Plan-based pricing (Re-arquitectura 2026-05 · costos Dreamful 2026-06)
// ---------------------------------------------------------------------------
//
// Tres niveles de precio que paga un partner segun su plan:
//   Starter (gratis): tier B2B por volumen publicado en /b2b-precios-2026
//                     (on_demand / b2b_starter / ...). Es el "precio amigo" base.
//   Growth (USD$50): precio cercano al costo. Beneficio de la suscripcion.
//   Pro (USD$100):   mismo precio que Growth + servicios extra.
// b2c_suggested es solo el precio web sugerido que el partner usa en su
// storefront para vender a clientes finales; NO es el precio que el partner paga.
//
// Ver docs/seo/REARQUITECTURA-2026-05.md para la decision completa.

/**
 * Delta (en ARS) que se suma al costo base para obtener el precio Growth/Pro,
 * segun el tier de volumen. El descuento por volumen es leve a proposito: el
 * precio ya esta a costo y no hay margen para descontar mas en niveles altos.
 *   precio_growth = cost + GROWTH_TIER_DELTA_ARS[tier]
 * Como depende solo del costo, los precios Growth se recalculan solos cuando
 * cambian los costos (no hay tabla separada que mantener).
 */
export const GROWTH_TIER_DELTA_ARS = {
  partner: 1000,
  starter: 800,
  pro: 600,
  drop: 400,
  bulk: 200,
} as const

// REGLA DEL 8% (mantener al cambiar costos/precios): pasarse a Growth debe ahorrar
// al menos 8% en el tier de entrada (Partner 1u). Es decir:
//   on_demand (Partner normal) >= getGrowthPrice(key,'partner') / 0.92  (redondeado hacia arriba a la centena)
// Al actualizar costos: recalcular Growth (cost + delta) y, si algun on_demand no
// cumple, subirlo al minimo que la satisface. Fuente: Excel 'Plan_Precios_Futuro'.

export type GrowthTier = keyof typeof GROWTH_TIER_DELTA_ARS

/** Campo de precio por volumen (plan starter) asociado a cada GrowthTier. */
export const VOLUME_FIELD_BY_TIER: Record<GrowthTier, keyof GarmentPricing> = {
  partner: 'on_demand',
  starter: 'b2b_starter',
  pro: 'b2b_pro',
  drop: 'b2b_drop',
  bulk: 'b2b_bulk',
}

export const GARMENT_PRICING: Record<string, GarmentPricing> = {
  'aldea-classic-tshirt': {
    key: 'aldea-classic-tshirt',
    name: 'Aldea Classic Fit T-Shirt',
    cost: 22670,
    on_demand: 25800,
    b2b_starter: 25100,
    b2b_pro: 24400,
    b2b_drop: 23800,
    b2b_bulk: 23600,
    b2c_suggested: 28600,
  },
  'aura-oversize-tshirt': {
    key: 'aura-oversize-tshirt',
    name: 'Aura Oversize T-Shirt',
    cost: 23470,
    on_demand: 26600,
    b2b_starter: 25900,
    b2b_pro: 25100,
    b2b_drop: 24300,
    b2b_bulk: 23600,
    b2c_suggested: 31000,
  },
  // Lienzo (Canvas) discontinuado del catalogo partner el 2026-05-18.
  // Si vuelve a ofrecerse, reagregar entrada con campo cost del Excel.
}

// Additional garments not in design engine but available for partners.
export const EXTRA_GARMENT_PRICING: Record<string, GarmentPricing> = {
  'remera-clasica-mujer': {
    key: 'remera-clasica-mujer',
    name: 'Remera Clásica Mujer',
    cost: 22670,
    on_demand: 25800,
    b2b_starter: 25100,
    b2b_pro: 24400,
    b2b_drop: 23800,
    b2b_bulk: 23600,
    b2c_suggested: 28600,
  },
  'remera-crop-mujer': {
    key: 'remera-crop-mujer',
    name: 'Remera Crop Mujer',
    cost: 18100,
    on_demand: 20800,
    b2b_starter: 20300,
    b2b_pro: 19800,
    b2b_drop: 19300,
    b2b_bulk: 18900,
    b2c_suggested: 23500,
  },
  'remera-infantil': {
    key: 'remera-infantil',
    name: 'Bambino Remera Infantil',
    cost: 18100,
    on_demand: 20800,
    b2b_starter: 20300,
    b2b_pro: 19800,
    b2b_drop: 19300,
    b2b_bulk: 18900,
    b2c_suggested: 23500,
  },
  'buzo-cuello-redondo': {
    key: 'buzo-cuello-redondo',
    name: 'Buzo Cuello Redondo',
    cost: 28170,
    on_demand: 32200,
    b2b_starter: 31200,
    b2b_pro: 30200,
    b2b_drop: 29200,
    b2b_bulk: 28200,
    b2c_suggested: 43000,
  },
  'buzo-hoodie-unisex': {
    key: 'buzo-hoodie-unisex',
    name: 'Buzo Hoodie Oversize',
    cost: 30170,
    on_demand: 38700,
    b2b_starter: 36600,
    b2b_pro: 34500,
    b2b_drop: 32400,
    b2b_bulk: 30300,
    b2c_suggested: 55000,
  },
  'musculosa-bali': {
    key: 'musculosa-bali',
    name: 'Musculosa Bali',
    cost: 18100,
    on_demand: 20800,
    b2b_starter: 20700,
    b2b_pro: 20500,
    b2b_drop: 20300,
    b2b_bulk: 20100,
    b2c_suggested: 21800,
  },
  // Bahía totebag (alta 2026-07-13). La entrada nació en garment-pricing.ts
  // pre-extracción; movida acá al resolver el merge con el fix del hallazgo [1]
  // (el catálogo con `cost` vive solo en este módulo server-only).
  // 29/08: escalera de 3 escalones reales del proveedor de totes (1-9u / 10-99u /
  // 100u+) — on_demand=starter y pro=drop A PROPÓSITO (el costo no baja entre esos
  // tiers: 16.000 / 12.000 / 9.000 con una estampa). `cost` = minorista 1-9u.
  // Doble cara en tote: +$5.000 SIEMPRE (todos los planes) — es pass-through del costo.
  'totebag': {
    key: 'totebag',
    name: 'Bahía Totebag',
    cost: 16000,
    on_demand: 19900,
    b2b_starter: 19900,
    b2b_pro: 16900,
    b2b_drop: 16900,
    b2b_bulk: 14500,
    b2c_suggested: 20900,
    growth_override: { partner: 18300, starter: 18300, pro: 15500, drop: 15500, bulk: 13300 },
  },
}

/** All garments combined (design engine + extras). Contiene `cost` en cada entry. */
export const ALL_GARMENT_PRICING: Record<string, GarmentPricing> = {
  ...GARMENT_PRICING,
  ...EXTRA_GARMENT_PRICING,
}
