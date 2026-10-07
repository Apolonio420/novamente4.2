import { describe, it, expect, vi, beforeEach } from 'vitest';

const { selectRow, maybeSingleMock, upsertMock, fromMock } = vi.hoisted(() => {
  const selectRow: { value: { value: unknown } | null; error: { message: string } | null } = {
    value: null,
    error: null,
  };
  const maybeSingleMock = vi.fn(async () => ({ data: selectRow.value, error: selectRow.error }));
  const upsertMock = vi.fn(async (_row: unknown) => ({ data: null, error: null }));
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.maybeSingle = maybeSingleMock;
  builder.upsert = upsertMock;
  const fromMock = vi.fn(() => builder);
  return { selectRow, maybeSingleMock, upsertMock, fromMock };
});

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: { from: fromMock } }));

import { checkAlertCooldown, formatRepeatedSuffix, DEFAULT_ALERT_COOLDOWN_MS } from './alert-cooldown';

beforeEach(() => {
  vi.clearAllMocks();
  selectRow.value = null;
  selectRow.error = null;
  maybeSingleMock.mockImplementation(async () => ({ data: selectRow.value, error: selectRow.error }));
  upsertMock.mockResolvedValue({ data: null, error: null });
});

describe('checkAlertCooldown', () => {
  it('primera vez (sin fila previa) → se manda, repeatedCount=0, y guarda el estado', async () => {
    const decision = await checkAlertCooldown('k1');
    expect(decision).toEqual({ send: true, repeatedCount: 0 });
    expect(fromMock).toHaveBeenCalledWith('app_settings');
    expect(upsertMock).toHaveBeenCalledWith(
      { key: 'alert_cooldown:k1', value: expect.objectContaining({ suppressedCount: 0 }) },
      { onConflict: 'key' },
    );
  });

  it('dentro de la ventana → se suprime y cuenta', async () => {
    selectRow.value = { value: { lastSentAt: new Date().toISOString(), suppressedCount: 0 } };
    const decision = await checkAlertCooldown('k1');
    expect(decision).toEqual({ send: false, repeatedCount: 0 });
    expect(upsertMock).toHaveBeenCalledWith(
      { key: 'alert_cooldown:k1', value: expect.objectContaining({ suppressedCount: 1 }) },
      { onConflict: 'key' },
    );
  });

  it('supresiones repetidas incrementan el contador cada vez', async () => {
    selectRow.value = { value: { lastSentAt: new Date().toISOString(), suppressedCount: 3 } };
    await checkAlertCooldown('k1');
    expect(upsertMock).toHaveBeenCalledWith(
      { key: 'alert_cooldown:k1', value: expect.objectContaining({ suppressedCount: 4 }) },
      { onConflict: 'key' },
    );
  });

  it('ventana ya cerrada (lastSentAt viejo) → se manda de nuevo, repeatedCount = lo acumulado', async () => {
    const old = new Date(Date.now() - DEFAULT_ALERT_COOLDOWN_MS - 1000).toISOString();
    selectRow.value = { value: { lastSentAt: old, suppressedCount: 7 } };
    const decision = await checkAlertCooldown('k1');
    expect(decision).toEqual({ send: true, repeatedCount: 7 });
    // se resetea el contador tras mandar
    expect(upsertMock).toHaveBeenCalledWith(
      { key: 'alert_cooldown:k1', value: expect.objectContaining({ suppressedCount: 0 }) },
      { onConflict: 'key' },
    );
  });

  it('cooldownMs explícito se respeta (ventana corta ya vencida)', async () => {
    const old = new Date(Date.now() - 5000).toISOString();
    selectRow.value = { value: { lastSentAt: old, suppressedCount: 2 } };
    const decision = await checkAlertCooldown('k1', 1000);
    expect(decision).toEqual({ send: true, repeatedCount: 2 });
  });

  it('fail-open: error de Supabase en la lectura → se manda igual', async () => {
    selectRow.error = { message: 'boom' };
    const decision = await checkAlertCooldown('k1');
    expect(decision).toEqual({ send: true, repeatedCount: 0 });
  });

  it('fail-open: excepción en la lectura → se manda igual', async () => {
    maybeSingleMock.mockRejectedValueOnce(new Error('conexión caída'));
    const decision = await checkAlertCooldown('k1');
    expect(decision).toEqual({ send: true, repeatedCount: 0 });
  });

  it('fail-open: si el upsert del estado falla, igual respeta la decisión de envío', async () => {
    upsertMock.mockRejectedValueOnce(new Error('upsert boom'));
    const decision = await checkAlertCooldown('k1');
    expect(decision.send).toBe(true);
  });

  it('claves distintas no se pisan entre sí', async () => {
    selectRow.value = { value: { lastSentAt: new Date().toISOString(), suppressedCount: 0 } };
    const decisionA = await checkAlertCooldown('a');
    expect(fromMock).toHaveBeenCalledWith('app_settings');
    expect(decisionA.send).toBe(false);
    // la key efectiva usada en la query está namespaced con el prefijo
    const eqCalls = (fromMock.mock.results[0].value as any).eq.mock.calls;
    expect(eqCalls.some((c: unknown[]) => c[1] === 'alert_cooldown:a')).toBe(true);
  });
});

describe('formatRepeatedSuffix', () => {
  it('repeatedCount=0 → string vacío', () => {
    expect(formatRepeatedSuffix(0)).toBe('');
  });

  it('repeatedCount>0 → menciona el conteo y la ventana', () => {
    expect(formatRepeatedSuffix(5)).toContain('5 veces');
    expect(formatRepeatedSuffix(5)).toContain('30 min');
  });

  it('acepta una ventana personalizada', () => {
    expect(formatRepeatedSuffix(2, '24 h')).toContain('24 h');
  });
});
