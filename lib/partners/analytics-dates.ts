/**
 * Día ART (Argentina, UTC-3, sin horario de verano) para los gráficos por
 * día del dashboard/analytics de partners (dashboard-kpis.ts, analytics.ts,
 * analytics-queries.ts).
 *
 * Bug real (10/10/2026): esos archivos armaban las claves de día con
 * `created_at.slice(0, 10)` / `d.toISOString().slice(0, 10)`, es decir en
 * UTC. Una venta o visita entre las 21:00 y las 23:59 ART (00:00–02:59 UTC
 * del día siguiente) quedaba contada en el día siguiente en vez del día real.
 *
 * ÚNICA fuente de la fecha ART: reusa `argDay` de lib/alerts/ops-digest.ts
 * (mismo offset, ya probado ahí) para que "hoy" y el bucketing de eventos
 * usen EXACTAMENTE el mismo cálculo — si solo se cambia un lado, el bucket
 * de "hoy" queda vacío aunque haya datos.
 */
import { argDay } from '@/lib/alerts/ops-digest'

const MS_DAY = 24 * 60 * 60 * 1000

/** YYYY-MM-DD del día ART para un instante dado (Date o ISO string). "Hoy" si no se pasa nada. */
export function artDayKey(d: Date | string = new Date()): string {
  return argDay(typeof d === 'string' ? new Date(d) : d)
}

/**
 * Lista ascendente de los últimos `days` días ART, incluyendo "hoy" como
 * último elemento. Pensada para inicializar los buckets de un gráfico por
 * día — usar SIEMPRE junto con `artDayKey` para clasificar cada evento, así
 * ambos lados comparten la misma noción de día.
 */
export function lastNArtDayKeys(days: number, now: Date = new Date()): string[] {
  const keys: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    keys.push(artDayKey(new Date(now.getTime() - i * MS_DAY)))
  }
  return keys
}

/**
 * Instante UTC (ISO) del comienzo del día ART más viejo de la ventana de
 * `days` días — para usar como cutoff (`.gte('created_at', ...)`) de una
 * query cuyos resultados después se bucketean por día ART. Evita que la
 * ventana de la query corte el día más viejo del gráfico.
 */
export function artWindowStartIso(days: number, now: Date = new Date()): string {
  const oldestDayKey = lastNArtDayKeys(days, now)[0]
  // Medianoche ART = 03:00 UTC (ART = UTC-3, sin DST).
  return `${oldestDayKey}T03:00:00.000Z`
}
