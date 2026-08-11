import { type NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { notifyStorefrontHealthIssues } from '@/lib/notifications'
import {
  classifyTenants,
  checkStorefrontHttp,
  mapWithConcurrency,
  shouldNotify as shouldNotifyStorefrontHealth,
  type TenantHealthInput,
} from '@/lib/partners/storefront-health'

/**
 * Healthcheck diario de storefronts partner.
 *
 * Caso Orlando (08/2026): su /p/<slug> estuvo devolviendo el 404 lógico un
 * mes entero y nos enteramos porque se quejó por WhatsApp. La causa raíz
 * (publicar un producto nunca publicaba la tienda) ya se arregló en
 * lib/partners/auto-publish.ts. Este cron es la red de seguridad para que la
 * PRÓXIMA vez lo sepamos nosotros primero, sin depender de que el partner
 * se queje. Barre las ~100 tiendas partner y busca:
 *
 *   1. "Dead silent": tenant con >=1 producto published pero
 *      storefront_published=false (exactamente el caso Orlando).
 *   2. "Broken live": tenant publicado+activo cuyo /p/<slug> responde el
 *      marcador de not-found (ver lib/partners/storefront-health.ts —
 *      CRÍTICO: esa ruta siempre devuelve HTTP 200, incluso mostrando el
 *      404 lógico, así que el chequeo real es sobre el <title>, no el status).
 *   3. "Empty storefront": publicado+activo con 0 productos published. No es
 *      un bug — es señal comercial (partner que se registró y no cargó
 *      catálogo) — se reporta como conteo aparte, nunca dispara el aviso solo.
 *
 * IMPORTANTE — un cron que no está en vercel.json NUNCA CORRE y nadie se
 * entera: le pasó exactamente a check-subscriptions (ver el comentario en
 * ese archivo, agregado recién el 2026-07-18 después de meses corriendo en
 * el vacío). Este archivo está registrado en vercel.json con schedule
 * "30 12 * * *" (UTC) = 09:30 ART (Argentina es UTC-3 todo el año, sin
 * horario de verano) — verificar que siga ahí si se toca este cron o
 * vercel.json en el futuro.
 *
 * Auth y runtime siguen el mismo patrón que
 * app/api/cron/partners/check-subscriptions/route.ts: acepta el header
 * nativo de Vercel cron (x-vercel-cron) O Bearer CRON_SECRET — solo-Bearer
 * dejaría el cron en 401 silencioso si CRON_SECRET no está seteado en el
 * proyecto de Vercel.
 */

export const runtime = 'nodejs'
export const maxDuration = 300

const db = () => supabaseAdmin as any

const STOREFRONT_BASE_URL = 'https://www.novamente.ar'
// ~100 tiendas: no las pegamos todas a la vez contra nuestro propio dominio.
const HTTP_CHECK_CONCURRENCY = 8
const HTTP_CHECK_TIMEOUT_MS = 15_000

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const isVercelCron = !!request.headers.get('x-vercel-cron')
  const cronSecret = process.env.CRON_SECRET
  const bearerOk = !!cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isVercelCron && !bearerOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const errors: string[] = []

  try {
    const { data: tenantsData, error: tenantsError } = await db()
      .from('tenants')
      .select('id, slug, name, status, storefront_published, metadata')

    if (tenantsError) {
      return NextResponse.json(
        { error: 'Query tenants failed', details: tenantsError.message },
        { status: 500 },
      )
    }

    const tenants = (tenantsData || []) as TenantHealthInput[]

    // Una sola query a partner_products (no una por tenant) — agregamos en JS.
    const { data: publishedProducts, error: productsError } = await db()
      .from('partner_products')
      .select('tenant_id')
      .eq('status', 'published')

    if (productsError) {
      errors.push(`Query partner_products: ${productsError.message}`)
    }

    const publishedCounts = new Map<string, number>()
    for (const p of publishedProducts || []) {
      publishedCounts.set(p.tenant_id, (publishedCounts.get(p.tenant_id) || 0) + 1)
    }

    const { deadSilent, emptyStorefront, liveCheckCandidates } = classifyTenants(tenants, publishedCounts)

    // Chequeo HTTP real de cada tienda publicada+activa. Un fetch que falla
    // (timeout, DNS, lo que sea) se captura acá adentro y se reporta como
    // "caída" — nunca tumba la corrida completa del cron.
    const httpChecks = await mapWithConcurrency(liveCheckCandidates, HTTP_CHECK_CONCURRENCY, async (candidate) => {
      try {
        const result = await checkStorefrontHttp(STOREFRONT_BASE_URL, candidate.slug, HTTP_CHECK_TIMEOUT_MS)
        return { candidate, result }
      } catch (e: any) {
        return {
          candidate,
          result: { up: false, reason: 'fetch_error' as const, detail: e?.message || String(e) },
        }
      }
    })

    const brokenLive = httpChecks
      .filter((c) => !c.result.up)
      .map((c) => ({
        slug: c.candidate.slug,
        name: c.candidate.name,
        excluded: c.candidate.excluded,
        reason: c.result.reason || 'fetch_error',
        detail: c.result.detail || '',
      }))

    const actionableDeadSilent = deadSilent.filter((d) => !d.excluded)
    const actionableBrokenLive = brokenLive.filter((b) => !b.excluded)
    const actionableEmptyStorefront = emptyStorefront.filter((e) => !e.excluded)

    const summary = {
      tenantsTotal: tenants.length,
      liveCheckCandidates: liveCheckCandidates.length,
      liveCheckOk: httpChecks.filter((c) => c.result.up).length,
      deadSilent: {
        total: deadSilent.length,
        excluded: deadSilent.length - actionableDeadSilent.length,
        actionable: actionableDeadSilent.length,
      },
      brokenLive: {
        total: brokenLive.length,
        excluded: brokenLive.length - actionableBrokenLive.length,
        actionable: actionableBrokenLive.length,
      },
      emptyStorefront: {
        total: emptyStorefront.length,
        excluded: emptyStorefront.length - actionableEmptyStorefront.length,
        actionable: actionableEmptyStorefront.length,
      },
    }

    // Silencio cuando todo está bien: SOLO mandamos a Telegram si hay algo
    // accionable (muertas o caídas). "Vidriera vacía" nunca dispara el envío
    // por sí sola — viaja como línea de contexto adentro del mensaje cuando
    // ya se está mandando por otro motivo (ver notifyStorefrontHealthIssues).
    const doNotify = shouldNotifyStorefrontHealth({
      deadSilentActionable: actionableDeadSilent.length,
      brokenLiveActionable: actionableBrokenLive.length,
    })

    const telegram: { attempted: boolean; sent: boolean; error?: string } = {
      attempted: false,
      sent: false,
    }

    if (doNotify) {
      telegram.attempted = true
      try {
        const sendResult = await notifyStorefrontHealthIssues({
          deadSilent: actionableDeadSilent.map((d) => ({
            slug: d.slug,
            name: d.name,
            publishedProducts: d.publishedProducts,
          })),
          brokenLive: actionableBrokenLive.map((b) => ({
            slug: b.slug,
            name: b.name,
            reason: b.reason,
            detail: b.detail,
          })),
          emptyStorefrontCount: summary.emptyStorefront.actionable,
        })

        // sendToTelegram (lib/notifications.ts) devuelve null tanto si falta
        // config como si Telegram respondió ok:false — un 200 del cron NO
        // prueba que el mensaje llegó, así que lo reflejamos acá.
        telegram.sent = !!sendResult
        if (!sendResult) {
          telegram.error = 'Telegram no confirmó el envío (config faltante o la API respondió error — ver logs)'
          errors.push('Telegram: alerta de storefront-health no se pudo confirmar como entregada')
        }
      } catch (e: any) {
        telegram.sent = false
        telegram.error = e?.message || String(e)
        errors.push(`Telegram: ${telegram.error}`)
      }
    }

    console.log('storefront-health check completed:', { summary, telegram })

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      summary,
      findings: {
        deadSilent,
        brokenLive,
        emptyStorefront,
      },
      telegram,
      errors,
    })
  } catch (error: any) {
    console.error('storefront-health cron error:', error)
    return NextResponse.json({ error: 'Internal error', details: error.message }, { status: 500 })
  }
}
