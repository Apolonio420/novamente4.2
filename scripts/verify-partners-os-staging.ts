/**
 * Partners OS 4.2 staging acceptance harness.
 *
 * This script is intentionally opt-in and never reads .env/.env.local or any
 * application environment names. It creates disposable users and tenants only
 * after the staging-only environment guard has passed.
 *
 * Run explicitly with:
 *   PARTNERS_STAGING_CONFIRM=RUN_PARTNERS_OS_ACCEPTANCE npx tsx scripts/verify-partners-os-staging.ts
 */
import { randomUUID } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const REQUIRED_ENVIRONMENT_KEYS = [
  'PARTNERS_STAGING_SUPABASE_URL',
  'PARTNERS_STAGING_SERVICE_ROLE_KEY',
  'PARTNERS_STAGING_ANON_KEY',
  'PARTNERS_STAGING_BASE_URL',
] as const

type RequiredEnvironmentKey = typeof REQUIRED_ENVIRONMENT_KEYS[number]

export interface StagingAcceptanceConfig {
  supabaseUrl: string
  serviceRoleKey: string
  anonKey: string
  baseUrl: string
}

export type StagingEnvironmentValidation =
  | { ok: true; config: StagingAcceptanceConfig }
  | { ok: false; errors: string[] }

/**
 * URLs must plainly identify a non-production target. This is deliberately a
 * conservative guard: a vaguely named host is safer to reject than to run
 * fixture-creating acceptance checks against by mistake.
 */
export function isClearlyStagingUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return false
    const target = `${url.hostname}${url.pathname}`.toLowerCase()
    return /(?:^|[.\-_/])(staging|preview|dev)(?:$|[.\-_/])/.test(target)
      || url.hostname.toLowerCase() === 'localhost'
  } catch {
    return false
  }
}

/**
 * Pure guard kept exportable so validation can be tested with no network
 * connection. Do not add fallbacks here: this harness must only consume the
 * four PARTNERS_STAGING_* credentials plus its explicit confirmation value.
 */
export function validateStagingEnvironment(
  env: Record<string, string | undefined>,
): StagingEnvironmentValidation {
  const missing = REQUIRED_ENVIRONMENT_KEYS.filter((key) => !env[key]?.trim())
  const errors: string[] = missing.map((key) => `Falta ${key}`)

  if (env.PARTNERS_STAGING_CONFIRM !== 'RUN_PARTNERS_OS_ACCEPTANCE') {
    errors.push('Falta PARTNERS_STAGING_CONFIRM=RUN_PARTNERS_OS_ACCEPTANCE')
  }

  const supabaseUrl = env.PARTNERS_STAGING_SUPABASE_URL?.trim() || ''
  const baseUrl = env.PARTNERS_STAGING_BASE_URL?.trim() || ''
  if (supabaseUrl && !isClearlyStagingUrl(supabaseUrl)) {
    errors.push('PARTNERS_STAGING_SUPABASE_URL debe contener staging, preview, dev o localhost')
  }
  if (baseUrl && !isClearlyStagingUrl(baseUrl)) {
    errors.push('PARTNERS_STAGING_BASE_URL debe contener staging, preview, dev o localhost')
  }

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    config: {
      supabaseUrl,
      serviceRoleKey: env.PARTNERS_STAGING_SERVICE_ROLE_KEY!.trim(),
      anonKey: env.PARTNERS_STAGING_ANON_KEY!.trim(),
      baseUrl: baseUrl.replace(/\/$/, ''),
    },
  }
}

interface FixtureRecord {
  prefix: string
  tenantIds: string[]
  userIds: string[]
  productIds: string[]
}

interface AuthenticatedFixtureUser {
  id: string
  email: string
  password: string
  client: SupabaseClient
  token: string
}

interface TenantFixture {
  id: string
  slug: string
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function createAdmin(config: StagingAcceptanceConfig) {
  return createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function createUserClient(config: StagingAcceptanceConfig) {
  return createClient(config.supabaseUrl, config.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function createFixtureUser(
  admin: SupabaseClient,
  fixtures: FixtureRecord,
  prefix: string,
  label: string,
): Promise<{ id: string; email: string; password: string }> {
  const email = `${prefix}-${label}@example.test`
  const password = `P!${randomUUID()}a9`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  assert(!error && data.user, `No se pudo crear el usuario fixture ${label}`)
  fixtures.userIds.push(data.user.id)
  return { id: data.user.id, email, password }
}

async function signInFixtureUser(
  config: StagingAcceptanceConfig,
  user: { id: string; email: string; password: string },
): Promise<AuthenticatedFixtureUser> {
  const client = createUserClient(config)
  const { data, error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })
  assert(!error && data.session, `No se pudo iniciar sesión para fixture ${user.id}`)
  return { ...user, client, token: data.session.access_token }
}

async function createTenant(
  admin: SupabaseClient,
  fixtures: FixtureRecord,
  prefix: string,
  suffix: 'a' | 'b',
  ownerEmail: string,
): Promise<TenantFixture> {
  const slug = `${prefix}-${suffix}`.slice(0, 70)
  const { data, error } = await admin
    .from('tenants')
    .insert({
      slug,
      name: `Partners OS acceptance ${suffix.toUpperCase()}`,
      email: ownerEmail,
      plan: 'pro',
      status: 'active',
      max_products: 999,
      max_leads_per_month: 999,
    })
    .select('id, slug')
    .single()
  assert(!error && data?.id, `No se pudo crear el tenant fixture ${suffix}`)
  fixtures.tenantIds.push(data.id)
  return data as TenantFixture
}

async function addMemberships(
  admin: SupabaseClient,
  memberships: Array<{ tenant_id: string; user_id: string; role: 'owner' | 'operator' | 'viewer' }>,
) {
  const { error } = await admin.from('tenant_users').insert(
    memberships.map((membership) => ({ ...membership, accepted_at: new Date().toISOString() })),
  )
  assert(!error, 'No se pudieron crear los memberships fixture')
}

async function apiRequest(
  config: StagingAcceptanceConfig,
  user: AuthenticatedFixtureUser,
  tenantId: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${user.token}`)
  headers.set('x-tenant-id', tenantId)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(new URL(path, `${config.baseUrl}/`).toString(), { ...init, headers })
}

async function expectStatus(label: string, response: Response, expected: number) {
  assert(response.status === expected, `${label}: esperado HTTP ${expected}, recibido ${response.status}`)
}

async function createFixtureProduct(
  admin: SupabaseClient,
  fixtures: FixtureRecord,
  tenantId: string,
  slug: string,
) {
  const { data, error } = await admin
    .from('partner_products')
    .insert({
      tenant_id: tenantId,
      slug,
      name: 'Producto aislado de aceptación',
      category: 'remera',
      price: 35000,
      status: 'draft',
    })
    .select('id')
    .single()
  assert(!error && data?.id, 'No se pudo crear el producto fixture')
  fixtures.productIds.push(data.id)
  return data.id as string
}

async function seedWithdrawableBalance(admin: SupabaseClient, tenantId: string, prefix: string) {
  const { error } = await admin.from('partner_ledger_entries').insert({
    tenant_id: tenantId,
    source: 'staging_acceptance',
    type: 'credit',
    amount: 20000,
    concept: `Saldo fixture ${prefix}`,
    status: 'confirmed',
  })
  assert(!error, 'No se pudo acreditar saldo fixture para probar retiros')
}

async function verifySameKeyPayoutIdempotency(
  admin: SupabaseClient,
  config: StagingAcceptanceConfig,
  tenantId: string,
  prefix: string,
) {
  const idempotencyKey = `${prefix}-payout-idempotency`
  const args = {
    p_tenant_id: tenantId,
    p_amount: 20000,
    p_method: 'acceptance-alias',
    p_idempotency_key: idempotencyKey,
  }

  // Two independent RPC calls deliberately race with the same withdrawal intent.
  const secondAdmin = createAdmin(config)
  const [first, second] = await Promise.all([
    admin.rpc('partner_request_payout', args),
    secondAdmin.rpc('partner_request_payout', args),
  ])
  assert(!first.error && !second.error, 'La RPC de retiro no respondió correctamente')

  const firstResult = first.data as { ok?: boolean; payout_id?: string; idempotent?: boolean } | null
  const secondResult = second.data as { ok?: boolean; payout_id?: string; idempotent?: boolean } | null
  assert(firstResult?.ok && secondResult?.ok, 'La RPC de retiro no confirmó ambas llamadas')
  assert(firstResult.payout_id && firstResult.payout_id === secondResult.payout_id,
    'La misma Idempotency-Key creó más de un payout')
  assert(firstResult.idempotent || secondResult.idempotent,
    'Una repetición con la misma Idempotency-Key no fue marcada idempotente')
}

async function cleanupFixtures(admin: SupabaseClient, fixtures: FixtureRecord): Promise<string[]> {
  const failures: string[] = []
  const tryCleanup = async (label: string, action: () => Promise<unknown>) => {
    try {
      await action()
    } catch {
      failures.push(label)
    }
  }
  const deleteForTenants = async (table: string) => {
    if (fixtures.tenantIds.length === 0) return
    const { error } = await admin.from(table).delete().in('tenant_id', fixtures.tenantIds)
    if (error) throw error
  }

  // Delete financial rows first, then operational rows, before tenant/user removal.
  for (const table of [
    'partner_ledger_entries',
    'partner_payouts',
    'partner_campaigns',
    'partner_lead_activities',
    'partner_order_events',
    'partner_orders',
    'partner_leads',
    'partner_products',
  ]) {
    await tryCleanup(table, () => deleteForTenants(table))
  }

  if (fixtures.tenantIds.length > 0) {
    await tryCleanup('tenants', async () => {
      const { error } = await admin.from('tenants').delete().in('id', fixtures.tenantIds)
      if (error) throw error
    })
  }
  for (const userId of fixtures.userIds) {
    await tryCleanup(`auth.users:${userId}`, async () => {
      const { error } = await admin.auth.admin.deleteUser(userId)
      if (error) throw error
    })
  }
  return failures
}

function cleanupReference(fixtures: FixtureRecord) {
  return {
    prefix: fixtures.prefix,
    tenantIds: fixtures.tenantIds,
    userIds: fixtures.userIds,
    productIds: fixtures.productIds,
  }
}

export async function runPartnersOsStagingAcceptance(config: StagingAcceptanceConfig) {
  const admin = createAdmin(config)
  const prefix = `pos42-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`
  const fixtures: FixtureRecord = { prefix, tenantIds: [], userIds: [], productIds: [] }
  let cleanupFailures: string[] = []

  try {
    const ownerASeed = await createFixtureUser(admin, fixtures, prefix, 'owner-a')
    const ownerBSeed = await createFixtureUser(admin, fixtures, prefix, 'owner-b')
    const operatorSeed = await createFixtureUser(admin, fixtures, prefix, 'operator-a')
    const viewerSeed = await createFixtureUser(admin, fixtures, prefix, 'viewer-a')

    const tenantA = await createTenant(admin, fixtures, prefix, 'a', ownerASeed.email)
    const tenantB = await createTenant(admin, fixtures, prefix, 'b', ownerBSeed.email)
    await addMemberships(admin, [
      { tenant_id: tenantA.id, user_id: ownerASeed.id, role: 'owner' },
      { tenant_id: tenantA.id, user_id: operatorSeed.id, role: 'operator' },
      { tenant_id: tenantA.id, user_id: viewerSeed.id, role: 'viewer' },
      { tenant_id: tenantB.id, user_id: ownerBSeed.id, role: 'owner' },
    ])

    const [ownerA, operatorA, viewerA] = await Promise.all([
      signInFixtureUser(config, ownerASeed),
      signInFixtureUser(config, operatorSeed),
      signInFixtureUser(config, viewerSeed),
    ])
    const productBId = await createFixtureProduct(admin, fixtures, tenantB.id, `${prefix}-product-b`)

    // Authenticated PostgREST clients prove RLS: A cannot see B, and viewers
    // cannot bypass the API role matrix with a direct write.
    const { data: hiddenProducts, error: hiddenProductsError } = await operatorA.client
      .from('partner_products')
      .select('id')
      .eq('tenant_id', tenantB.id)
    assert(!hiddenProductsError && (hiddenProducts || []).length === 0,
      'RLS expuso productos del tenant B al operator del tenant A')

    const catalogResponse = await apiRequest(config, operatorA, tenantA.id, '/api/partners/catalog')
    await expectStatus('operator lee catálogo propio', catalogResponse, 200)

    const createOrderResponse = await apiRequest(config, operatorA, tenantA.id, '/api/partners/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: 'Cliente Acceptance',
        customer_email: `${prefix}@example.test`,
        items: [{ name: 'Remera acceptance', quantity: 1, unit_price: 35000 }],
        total: 35000,
      }),
    })
    await expectStatus('operator crea pedido operativo', createOrderResponse, 201)
    const createdOrder = await createOrderResponse.json() as { order?: { id?: string } }
    const orderAId = createdOrder.order?.id
    assert(orderAId, 'La API no devolvió el pedido fixture')

    const crossTenantProductResponse = await apiRequest(config, operatorA, tenantA.id, `/api/partners/catalog/${productBId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'No debe editarse' }),
    })
    await expectStatus('recurso ajeno devuelve 404', crossTenantProductResponse, 404)

    const foreignTenantSelection = await apiRequest(config, operatorA, tenantB.id, '/api/partners/catalog')
    await expectStatus('selector de tenant ajeno devuelve 404', foreignTenantSelection, 404)

    const viewerMutation = await apiRequest(config, viewerA, tenantA.id, '/api/partners/orders', {
      method: 'POST',
      body: JSON.stringify({ items: [{ name: 'No autorizado', quantity: 1, unit_price: 1 }], total: 1 }),
    })
    await expectStatus('viewer no muta pedidos', viewerMutation, 403)

    const { error: directViewerWriteError } = await viewerA.client
      .from('partner_orders')
      .update({ notes: 'No autorizado' })
      .eq('id', orderAId)
    assert(directViewerWriteError, 'viewer pudo escribir partner_orders directo por PostgREST')

    const operatorFinance = await apiRequest(config, operatorA, tenantA.id, '/api/partners/finanzas')
    await expectStatus('operator no accede a finanzas', operatorFinance, 403)

    // The candidate deployment must start with daily-ops flags disabled. These
    // endpoint checks make an accidentally enabled rollout a hard failure.
    await expectStatus('CRM apagado', await apiRequest(config, ownerA, tenantA.id, '/api/partners/leads/list'), 404)
    await expectStatus('cockpit apagado', await apiRequest(config, ownerA, tenantA.id, '/api/partners/dashboard/attention'), 404)
    await expectStatus('fulfillment apagado', await apiRequest(config, operatorA, tenantA.id, `/api/partners/orders/${orderAId}`, {
      method: 'PUT',
      body: JSON.stringify({ fulfillment_status: 'queued_for_production' }),
    }), 404)

    await seedWithdrawableBalance(admin, tenantA.id, prefix)
    await verifySameKeyPayoutIdempotency(admin, config, tenantA.id, prefix)

    const ownerFinance = await apiRequest(config, ownerA, tenantA.id, '/api/partners/finanzas')
    await expectStatus('owner accede a finanzas', ownerFinance, 200)

    console.log('Partners OS 4.2 staging acceptance: PASS')
  } finally {
    cleanupFailures = await cleanupFixtures(admin, fixtures)
    if (cleanupFailures.length > 0) {
      console.error('La limpieza automática falló en:', cleanupFailures.join(', '))
      console.error('IDs para limpieza manual (sin secretos):', JSON.stringify(cleanupReference(fixtures)))
    }
  }

  assert(cleanupFailures.length === 0, 'La aceptación pasó pero quedaron fixtures para limpiar')
}

async function main() {
  const validation = validateStagingEnvironment(process.env)
  if ('errors' in validation) {
    // Deliberately names only missing/unsafe variables, never their values.
    console.error('Staging acceptance bloqueada:', validation.errors.join('; '))
    process.exitCode = 2
    return
  }

  try {
    await runPartnersOsStagingAcceptance(validation.config)
  } catch (error) {
    // Errors are intentionally summarized: never print environment/config data.
    console.error('Partners OS staging acceptance: FAIL', error instanceof Error ? error.message : 'error desconocido')
    process.exitCode = 1
  }
}

if (process.argv[1] && /verify-partners-os-staging\.(?:ts|js)$/.test(process.argv[1])) {
  void main()
}
