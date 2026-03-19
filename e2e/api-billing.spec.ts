import { test, expect } from '@playwright/test'

test.describe('Billing API', () => {
  test('GET /api/partners/billing returns 401 without auth', async ({ request }) => {
    const res = await request.get('/api/partners/billing')
    expect(res.status()).toBe(401)
  })

  test('POST /api/partners/billing returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/partners/billing', {
      data: { action: 'downgrade', plan: 'starter' },
    })
    expect(res.status()).toBe(401)
  })
})

test.describe('Subscribe API', () => {
  test('POST /api/partners/subscribe rejects invalid plan', async ({ request }) => {
    const res = await request.post('/api/partners/subscribe', {
      data: { tenantId: 'fake', plan: 'invalid' },
    })
    expect(res.status()).toBe(400)
    const json = await res.json()
    expect(json.error).toBeTruthy()
  })

  test('POST /api/partners/subscribe rejects missing fields', async ({ request }) => {
    const res = await request.post('/api/partners/subscribe', {
      data: {},
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/partners/subscribe rejects invalid billing cycle', async ({ request }) => {
    const res = await request.post('/api/partners/subscribe', {
      data: { tenantId: 'fake', plan: 'growth', billingCycle: 'weekly' },
    })
    expect(res.status()).toBe(400)
  })
})

test.describe('Admin Partners API', () => {
  test('GET /api/admin/partners returns 401 without auth', async ({ request }) => {
    const res = await request.get('/api/admin/partners')
    expect(res.status()).toBe(401)
  })

  test('PATCH /api/admin/partners returns 401 without auth', async ({ request }) => {
    const res = await request.patch('/api/admin/partners', {
      data: { tenantId: 'fake', updates: { plan: 'growth' } },
    })
    expect(res.status()).toBe(401)
  })
})

test.describe('Cron Subscription Check', () => {
  test('GET /api/cron/partners/check-subscriptions returns 401 without secret', async ({ request }) => {
    const res = await request.get('/api/cron/partners/check-subscriptions')
    expect(res.status()).toBe(401)
  })
})

test.describe('Support API', () => {
  test('POST /api/partners/support returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/partners/support', {
      data: { subject: 'test', message: 'test' },
    })
    expect(res.status()).toBe(401)
  })
})

test.describe('Webhook', () => {
  test('GET /api/partners/webhook/mercadopago returns active message', async ({ request }) => {
    const res = await request.get('/api/partners/webhook/mercadopago')
    expect(res.ok()).toBe(true)
    const json = await res.json()
    expect(json.message).toContain('active')
  })

  test('POST /api/partners/webhook/mercadopago with empty body returns received', async ({ request }) => {
    const res = await request.post('/api/partners/webhook/mercadopago', {
      data: {},
    })
    expect(res.ok()).toBe(true)
    const json = await res.json()
    expect(json.received).toBe(true)
  })
})
