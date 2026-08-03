/**
 * Fuente unica de verdad para las estadisticas que se repiten en landings,
 * llms.txt/llms-full.txt y JSON-LD.
 *
 * Antes de este archivo, distintas paginas hardcodeaban numeros distintos e
 * inconsistentes (ej: "1.500+ disenos" y "4.9/5" en remeras-personalizadas
 * vs "1.200+" y "4.8/5" en disena-tu-remera y en llms-full.txt). Se eligieron
 * los numeros mas conservadores (los que ya estaban en llms-full.txt) como
 * verdad unica.
 *
 * Si el negocio actualiza estos numeros, cambiar SOLO aca y (si aplica)
 * en public/llms.txt / public/llms-full.txt / public/novamente-entity.json.
 */

export const SITE_STATS = {
  designsCreated: "1.200+",
  designsCreatedLabel: "Disenos creados",
  happyCustomers: "95+",
  happyCustomersLabel: "Clientes satisfechos",
  artisticStyles: "37",
  artisticStylesLabel: "Estilos artisticos",
  averageRating: "4.8/5",
  averageRatingLabel: "Rating promedio",
} as const

export type SiteStats = typeof SITE_STATS
