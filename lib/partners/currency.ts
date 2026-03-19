// Dynamic USD → ARS conversion via Bluelytics API (dolar blue)
// Cached in memory with 24h TTL, fallback to last known rate

interface BluelyticsResponse {
  blue: { value_sell: number; value_buy: number }
  oficial: { value_sell: number; value_buy: number }
}

let cachedRate: number | null = null
let cachedAt: number = 0
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const FALLBACK_RATE = 1350 // Last known approximate rate (2026-03)

export async function getUsdToArs(): Promise<number> {
  const now = Date.now()

  // Return cached value if fresh
  if (cachedRate && now - cachedAt < CACHE_TTL_MS) {
    return cachedRate
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch('https://api.bluelytics.com.ar/v2/latest', {
      signal: controller.signal,
      next: { revalidate: 86400 }, // ISR: 24h
    })
    clearTimeout(timeout)

    if (!res.ok) throw new Error(`Bluelytics API returned ${res.status}`)

    const data: BluelyticsResponse = await res.json()
    const rate = data.blue.value_sell

    if (!rate || rate < 100) throw new Error(`Invalid rate: ${rate}`)

    cachedRate = rate
    cachedAt = now
    return rate
  } catch (error) {
    console.warn('Failed to fetch USD/ARS rate from Bluelytics:', error)
    // Return cached rate if available, else fallback
    return cachedRate ?? FALLBACK_RATE
  }
}

export async function convertUsdToArs(usd: number): Promise<number> {
  const rate = await getUsdToArs()
  return Math.round(usd * rate)
}

export function formatArsPrice(ars: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(ars)
}
