import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
  process.env.TELEGRAM_CHAT_ID_ERRORS = 'test-chat-id-errors';
});

vi.mock('./alerts/alert-cooldown', () => ({
  checkAlertCooldown: vi.fn(async () => ({ send: true, repeatedCount: 0 })),
  formatRepeatedSuffix: () => '',
}));
const enqueueOpsDigestMock = vi.fn();
vi.mock('./alerts/ops-digest', () => ({ enqueueOpsDigest: (...a: unknown[]) => enqueueOpsDigestMock(...a) }));
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: {} }));
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn(async () => ({ ok: true })) }));

import { notifyError, notifyUrgent } from './notifications';

const chatOf = (i: number) => JSON.parse((global.fetch as any).mock.calls[i][1].body).chat_id;

beforeEach(() => {
  enqueueOpsDigestMock.mockReset();
  enqueueOpsDigestMock.mockResolvedValue(true);
  global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, result: {} }) })) as any;
});

describe('notifyError — ruteo por grupo (Juan 08/10/2026)', () => {
  it('por defecto va al resumen diario y NO suena en Telegram', async () => {
    const r = await notifyError({ endpoint: 'POST /api/generate-image', message: 'Gemini 500', area: 'IA', debugId: 'd1' });
    expect(r).toEqual({ digest: true });
    expect(enqueueOpsDigestMock).toHaveBeenCalledWith('tienda', 'IA · POST /api/generate-image: Gemini 500 (debug d1)');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('si el resumen no se pudo guardar, sale como antes a Contenido', async () => {
    enqueueOpsDigestMock.mockResolvedValue(false);
    await notifyError({ endpoint: 'POST /x', message: 'algo' });
    expect(chatOf(0)).toBe('test-chat-id-errors');
  });

  it('urgent → grupo Urgente, sin pasar por el resumen', async () => {
    await notifyError({ endpoint: 'processPaymentById', message: 'monto distinto', area: 'Pagos', urgent: true });
    expect(enqueueOpsDigestMock).not.toHaveBeenCalled();
    expect(chatOf(0)).toBe('-5494888775');
  });
});

describe('notifyUrgent', () => {
  it('si Telegram rechaza el envío a Urgente, cae a Contenido', async () => {
    let n = 0;
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => (++n === 1 ? { ok: false, description: 'chat not found' } : { ok: true, result: {} }),
    })) as any;
    const r = await notifyUrgent('🚨 /crear health-check FAIL');
    expect(r).not.toBeNull();
    expect(chatOf(0)).toBe('-5494888775');
    expect(chatOf(1)).toBe('test-chat-id-errors');
  });
});
