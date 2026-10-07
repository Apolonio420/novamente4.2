import { describe, it, expect } from 'vitest';
import { normalizeAlertText, hashAlertKey, deriveErrorAlertKey } from './dedupe-key';

describe('normalizeAlertText', () => {
  it('quita HTML, emojis, dígitos y comillas, dejando solo la forma del mensaje', () => {
    const a = normalizeAlertText('🚨 <b>Timeout</b> de Gemini tras 3 intentos a las 14:32 — id "abc-123"');
    const b = normalizeAlertText('Timeout de Gemini tras 7 intentos a las 09:01 — id "zzz-999"');
    expect(a).toBe(b);
    expect(a).not.toMatch(/\d/);
  });

  it('quita uuids', () => {
    const n = normalizeAlertText('falló para order 123e4567-e89b-12d3-a456-426614174000');
    expect(n).not.toContain('e89b');
  });

  it('distingue mensajes de forma distinta', () => {
    expect(normalizeAlertText('Timeout de Gemini')).not.toBe(normalizeAlertText('Quota excedida de Gemini'));
  });
});

describe('hashAlertKey', () => {
  it('es estable para las mismas partes', () => {
    expect(hashAlertKey(['a', 'b', 'c'])).toBe(hashAlertKey(['a', 'b', 'c']));
  });

  it('ignora partes vacías/undefined', () => {
    expect(hashAlertKey(['a', undefined, 'b'])).toBe(hashAlertKey(['a', 'b']));
  });

  it('distingue combinaciones distintas', () => {
    expect(hashAlertKey(['a', 'b'])).not.toBe(hashAlertKey(['a', 'c']));
  });
});

describe('deriveErrorAlertKey', () => {
  it('misma área+endpoint+mensaje normalizado → misma clave aunque cambien montos/ids', () => {
    const k1 = deriveErrorAlertKey({
      area: 'Generación de diseño',
      endpoint: 'POST /api/generate-stamp',
      message: 'Gemini devolvió 429 tras 3 intentos',
    });
    const k2 = deriveErrorAlertKey({
      area: 'Generación de diseño',
      endpoint: 'POST /api/generate-stamp',
      message: 'Gemini devolvió 429 tras 7 intentos',
    });
    expect(k1).toBe(k2);
  });

  it('endpoints distintos → claves distintas', () => {
    const k1 = deriveErrorAlertKey({ endpoint: 'POST /api/generate-stamp', message: 'Gemini 429' });
    const k2 = deriveErrorAlertKey({ endpoint: 'POST /api/checkout', message: 'Gemini 429' });
    expect(k1).not.toBe(k2);
  });

  it('mensajes de forma distinta (misma ruta) → claves distintas', () => {
    const k1 = deriveErrorAlertKey({ endpoint: 'POST /api/generate-stamp', message: 'Timeout de Gemini' });
    const k2 = deriveErrorAlertKey({ endpoint: 'POST /api/generate-stamp', message: 'Quota excedida de Gemini' });
    expect(k1).not.toBe(k2);
  });
});
