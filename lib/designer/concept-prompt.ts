/**
 * Concepto del diseño + las ediciones que le fue pidiendo el cliente en /crear.
 * Lo usan "Probar otra variante", el detector de concepto nuevo y "Generar de
 * cero" cuando una edición sale igual. Antes, tras editar, quedaba solo la
 * última edición ("haceme el delfín más chico") y se perdía de qué era el diseño.
 *
 * Tope de largo: se conserva SIEMPRE el concepto (lo primero) y se descartan
 * las ediciones más viejas.
 */
export const CONCEPT_MAX = 800
const SEP = " · "

export function appendEditToConcept(current: string, edit: string): string {
  const [concept, ...edits] = current.split(SEP)
  const all = [...edits, edit.trim()]
  while (all.length > 1 && [concept, ...all].join(SEP).length > CONCEPT_MAX) all.shift()
  return [concept, ...all].join(SEP).slice(0, CONCEPT_MAX)
}
