/**
 * Envío por distancia desde Villa Martelli (CP 1603), según los rangos que
 * fijó Juan el 27/08/2026:
 *
 *   CABA y AMBA .......... entre 8.500 y 12.000
 *   Más lejos ............ de 13.500 para arriba, más cuanto más lejos
 *   Tope ................. nunca más de 16.000
 *
 * Antes el checkout mostraba $7.000/$9.000 y cobraba $10.000/$15.000.
 */
import { describe, it, expect } from 'vitest'
import { envioPorDistancia, normalizarCP, ENVIO_DISTANCIA, SHIPPING } from '@/lib/shipping-config'

const SUB = 50000 // por debajo del envío gratis

describe('envío por distancia', () => {
  it('respeta las tres cifras que pidió Juan', () => {
    expect(ENVIO_DISTANCIA.AMBA_MIN).toBe(8500)
    expect(ENVIO_DISTANCIA.AMBA_MAX).toBe(12000)
    expect(ENVIO_DISTANCIA.INTERIOR_MIN).toBe(13500)
    expect(ENVIO_DISTANCIA.TOPE).toBe(16000)
  })

  it('CABA y AMBA caen entre 8.500 y 12.000', () => {
    for (const cp of ['1603', '1414', '1650', '1878', '1900', '1708']) {
      const e = envioPorDistancia(SUB, cp)
      expect(e.zona, cp).toBe('AMBA')
      expect(e.costo, cp).toBeGreaterThanOrEqual(8500)
      expect(e.costo, cp).toBeLessThanOrEqual(12000)
    }
  })

  it('más cerca del depósito, más barato', () => {
    const vicenteLopez = envioPorDistancia(SUB, '1603').costo   // 10 km
    const laPlata = envioPorDistancia(SUB, '1900').costo        // 60 km
    expect(vicenteLopez).toBeLessThan(laPlata)
  })

  it('el interior arranca en 13.500 y nunca pasa de 16.000', () => {
    for (const cp of ['2000', '5000', '5500', '4400', '8300', '9410']) {
      const e = envioPorDistancia(SUB, cp)
      expect(e.zona, cp).toBe('INTERIOR')
      expect(e.costo, cp).toBeGreaterThanOrEqual(13500)
      expect(e.costo, cp).toBeLessThanOrEqual(16000)
    }
  })

  it('cuanto más lejos, más caro', () => {
    const rosario = envioPorDistancia(SUB, '2000').costo    // 300 km
    const mendoza = envioPorDistancia(SUB, '5500').costo    // 1050 km
    const ushuaia = envioPorDistancia(SUB, '9410').costo    // 3000 km
    expect(rosario).toBeLessThan(mendoza)
    expect(mendoza).toBeLessThan(ushuaia)
    expect(ushuaia).toBe(16000)   // el extremo del país toca el tope
  })

  it('el envío gratis por monto sigue mandando', () => {
    expect(envioPorDistancia(SHIPPING.FREE_THRESHOLD, '9410').costo).toBe(0)
    expect(envioPorDistancia(SHIPPING.FREE_THRESHOLD, '1603').costo).toBe(0)
  })

  it('lee el CP en formato CPA (B1603ABC)', () => {
    expect(normalizarCP('B1603ABC')).toBe(1603)
    expect(normalizarCP('  1414 ')).toBe(1414)
    expect(normalizarCP('X5000XAA')).toBe(5000)
  })

  it('sin CP legible no se queda sin precio: cae a la zona gruesa', () => {
    const a = envioPorDistancia(SUB, null)
    expect(a.estimado).toBe(true)
    expect(a.costo).toBe(SHIPPING.BA)
    const b = envioPorDistancia(SUB, 'no-es-un-cp', 'RESTO')
    expect(b.estimado).toBe(true)
    expect(b.costo).toBe(SHIPPING.RESTO)
  })

  it('ningún CP del país se pasa del tope', () => {
    for (let cp = 1000; cp <= 9999; cp += 7) {
      const e = envioPorDistancia(SUB, String(cp))
      expect(e.costo, String(cp)).toBeLessThanOrEqual(16000)
    }
  })
})
