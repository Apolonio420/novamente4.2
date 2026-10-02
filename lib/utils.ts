import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Pesos argentinos sin decimales: 35750 → "$35.750" (mismo formato que el
 * resto del sitio, lib/catalog.ts). Antes era en-US ("$35,750.00") y en el
 * checkout se mezclaban los dos formatos (QA 01/10/2026).
 */
export function formatCurrency(amount: number) {
  const n = Math.round(Number(amount) || 0)
  const abs = Math.abs(n).toLocaleString("es-AR")
  return n < 0 ? `-$${abs}` : `$${abs}`
}

export async function serverLog(tag: string, payload: unknown) {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag, payload, ts: new Date().toISOString() }),
    })
  } catch (e) {
    // no-op
    console.warn('serverLog failed', e)
  }
}