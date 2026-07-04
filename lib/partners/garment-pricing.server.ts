import 'server-only'

/**
 * Punto de acceso server-only al pricing crudo de prendas (incluye `cost`, el
 * costo real de producción — nunca debe llegar a un bundle cliente).
 *
 * Código server (APIs, ledger, variants) debe importar `ALL_GARMENT_PRICING`,
 * `getPartnerPlanPrice`, etc. DESDE ACÁ y no directamente de `./garment-pricing`.
 * El paquete `server-only` hace fallar el build de Next si este módulo termina
 * importado (directa o transitivamente) desde un componente 'use client'.
 */
export {
  ALL_GARMENT_PRICING,
  GARMENT_PRICING,
  EXTRA_GARMENT_PRICING,
  getGrowthPrice,
  getPartnerPlanPrice,
  getPlanMargin,
} from './garment-pricing'
