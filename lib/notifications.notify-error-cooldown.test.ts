import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
  process.env.TELEGRAM_CHAT_ID_ERRORS = 'test-chat-id-errors';
});

const checkAlertCooldownMock = vi.fn();
vi.mock('./alerts/alert-cooldown', () => ({
  checkAlertCooldown: (...args: unknown[]) => checkAlertCooldownMock(...args),
  formatRepeatedSuffix: (n: number) => (n > 0 ? `\n\n(se repitió ${n} veces en los últimos 30 min)` : ''),
}));

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: {} }));
// Estos casos prueban el envío directo: el resumen diario "no se pudo guardar" (ver notifications.routing.test.ts).
vi.mock('./alerts/ops-digest', () => ({ enqueueOpsDigest: vi.fn(async () => false) }));
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn(async () => ({ ok: true })) }));

import { notifyError } from './notifications';

beforeEach(() => {
  checkAlertCooldownMock.mockReset();
  checkAlertCooldownMock.mockResolvedValue({ send: true, repeatedCount: 0 });
  global.fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({ ok: true, result: {} }),
  })) as any;
});

describe('notifyError — cooldown central (auditoría 07/10/2026, cambio #4)', () => {
  it('cuando el cooldown dice send=true, manda el mensaje por Telegram', async () => {
    const result = await notifyError({ endpoint: 'POST /api/generate-stamp', message: 'Gemini 429', area: 'IA' });
    expect(result).not.toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body.text).toContain('Gemini 429');
    expect(body.text).not.toContain('se repitió');
  });

  it('cuando el cooldown dice send=false (suprimida), NO llama a Telegram', async () => {
    checkAlertCooldownMock.mockResolvedValue({ send: false, repeatedCount: 0 });
    const result = await notifyError({ endpoint: 'POST /api/generate-stamp', message: 'Gemini 429' });
    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('cuando vuelve a mandarse tras la ventana, agrega "(se repitió N veces...)" al mensaje', async () => {
    checkAlertCooldownMock.mockResolvedValue({ send: true, repeatedCount: 12 });
    await notifyError({ endpoint: 'POST /api/generate-stamp', message: 'Gemini 429' });
    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body.text).toContain('se repitió 12 veces en los últimos 30 min');
  });

  it('usa dedupeKey explícito si se pasa, en vez de derivarlo', async () => {
    await notifyError({ endpoint: 'POST /x', message: 'algo', dedupeKey: 'mi-clave-explicita' });
    expect(checkAlertCooldownMock).toHaveBeenCalledWith('mi-clave-explicita');
  });

  it('deriva la clave de área+endpoint+mensaje cuando no hay dedupeKey', async () => {
    await notifyError({ endpoint: 'POST /x', message: 'algo', area: 'Checkout' });
    const keyArg = checkAlertCooldownMock.mock.calls[0][0];
    expect(typeof keyArg).toBe('string');
    expect(keyArg.length).toBeGreaterThan(0);
    expect(keyArg).not.toBe('mi-clave-explicita');
  });
});
