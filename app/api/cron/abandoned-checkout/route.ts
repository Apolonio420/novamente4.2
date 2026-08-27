/**
 * Recupero de checkouts abandonados.
 *
 * Un "carrito abandonado" acá = una orden 'pending' de MercadoPago creada hace
 * 2-26h cuyo pago nunca se acreditó (el cliente llegó al checkout, dejó email
 * y se fue sin pagar). Le mandamos UN email con un link de pago nuevo.
 *
 * El link usa el MISMO external_reference de la orden original → si paga, el
 * webhook de MP existente la confirma sola (cero código extra).
 *
 * Corre por Vercel cron (vercel.json). Auth: Bearer CRON_SECRET o header
 * Bearer CRON_SECRET (Vercel lo manda solo). ?dry=1 para previsualizar.
 */
import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { findApprovedPaymentByReference, processPaymentById } from '@/lib/payments/process-payment'

export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_PER_RUN = 20
const BASE = 'https://www.novamente.ar'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

function recoveryHtml(opts: {
  firstName: string
  orderNumber: string
  items: Array<{ name: string; qty: number }>
  total: number
  payUrl: string
  brandName?: string | null
  /** true si la orden se creó por el checkout de TRANSFERENCIA → recordarle esa vía */
  transferencia?: boolean
}): string {
  const store = opts.brandName || 'Novamente'
  const itemsHtml = opts.items
    .map((i) => `<tr><td style="padding:6px 0;color:#444;font-size:14px">${i.qty} × ${i.name}</td></tr>`)
    .join('')
  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden">
      <tr><td style="background:#111;padding:20px 28px;color:#fff;font-size:18px;font-weight:bold">${store}</td></tr>
      <tr><td style="padding:28px">
        <p style="font-size:17px;color:#111;margin:0 0 6px"><b>¡Hola ${opts.firstName}!</b></p>
        <p style="font-size:14px;color:#555;line-height:1.5;margin:0 0 18px">
          Vimos que empezaste tu pedido <b>${opts.orderNumber}</b> y quedó a un paso.
          Te lo guardamos tal cual lo armaste — apenas pagues, entra a producción y sale en 24-48h.
        </p>
        <table width="100%" style="border-top:1px solid #eee;border-bottom:1px solid #eee;margin:0 0 14px">${itemsHtml}</table>
        <p style="font-size:15px;color:#111;margin:0 0 22px"><b>Total: ${fmt(opts.total)}</b></p>
        <a href="${opts.payUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 30px;border-radius:8px">
          Completar mi compra →
        </a>
        ${opts.transferencia ? `<p style="font-size:13px;color:#555;line-height:1.5;margin:16px 0 0">
          Si preferís seguir con la <b>transferencia</b> que habías elegido: ${fmt(opts.total)} al alias
          <b>novamente</b> (Mercado Pago, titular Valentin Nuñez). Respondé este mail con el comprobante y listo.
        </p>` : ''}
        <p style="font-size:12px;color:#999;margin:22px 0 0;line-height:1.5">
          ¿Tuviste algún problema con el pago? Respondé este mail o escribinos por
          <a href="https://wa.me/5492235169720" style="color:#666">WhatsApp</a> y te ayudamos.
        </p>
      </td></tr>
      <tr><td style="background:#fafafa;padding:14px 28px;font-size:11px;color:#aaa">
        Prendas premium estampadas on-demand en Argentina · novamente.ar
      </td></tr>
    </table>
  </td></tr></table></body></html>`
}

export async function GET(request: NextRequest) {
  // Auth: cron nativo de Vercel o Bearer CRON_SECRET
  const secret = process.env.CRON_SECRET
  const bearerOk = !!secret && request.headers.get('authorization') === `Bearer ${secret}`
  // El header x-vercel-cron lo puede mandar CUALQUIERA con un curl: no es una
  // credencial, es una etiqueta. Mientras CRON_SECRET no existiera, aceptarlo
  // era la única forma de que el cron corriera — pero también dejaba que
  // cualquiera lo disparara (uno de estos suspende partners y les manda mail).
  // CRON_SECRET ya está seteado en producción y Vercel lo manda solo en el
  // header Authorization, así que ahora se exige de verdad.
  if (!bearerOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const dry = request.nextUrl.searchParams.get('dry') === '1'

  const sb = supabaseAdmin as any
  const now = Date.now()
  const from = new Date(now - 26 * 3600_000).toISOString()
  const to = new Date(now - 2 * 3600_000).toISOString()

  const { data: orders, error } = await sb
    .from('orders')
    .select('*')
    .eq('status', 'pending')
    // 25/08 (caso Marcelo NOV-20260813-7038): el checkout de TRANSFERENCIA
    // también se abandona (elige transferir y nunca manda el comprobante) y
    // quedaba invisible para este recupero. El mail que le mandamos sirve
    // igual: link de MP nuevo + la opción de transferir que ya había elegido.
    .in('payment_method', ['mercadopago', 'transferencia'])
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const candidates = (orders || []).filter(
    (o: any) =>
      o.customer_email &&
      Number(o.total) > 0 &&
      !o.metadata?.recovery_sent_at &&
      !o.payment_id,
  ).slice(0, MAX_PER_RUN)

  const results: Array<{ order: string; status: string }> = []
  const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' })

  for (const o of candidates) {
    try {
      // Anti doble-cobro: si MP ya tiene un pago APROBADO para esta referencia
      // (webhook y confirm fallback pudieron fallar), confirmamos la orden en
      // vez de mandarle a un cliente que YA PAGÓ un link de pago nuevo.
      if (o.external_reference) {
        const approvedPaymentId = await findApprovedPaymentByReference(o.external_reference)
        if (approvedPaymentId) {
          if (!dry) await processPaymentById(approvedPaymentId)
          results.push({ order: o.order_number, status: `⚠️ ya estaba pagada en MP (${approvedPaymentId}) — confirmada, sin email` })
          continue
        }
      }

      const { data: items } = await sb
        .from('order_items')
        .select('item_name, quantity, unit_price')
        .eq('order_id', o.id)
      const lineItems = (items || []).map((it: any) => ({
        id: String(o.id),
        title: it.item_name?.slice(0, 120) || 'Producto Novamente',
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price) || 0,
        currency_id: 'ARS',
      }))
      const shipping = Number(o.shipping_cost) || 0
      if (shipping > 0) {
        lineItems.push({ id: 'shipping', title: 'Envío', quantity: 1, unit_price: shipping, currency_id: 'ARS' })
      }
      if (!lineItems.length) { results.push({ order: o.order_number, status: 'sin items' }); continue }

      if (dry) { results.push({ order: o.order_number, status: `DRY → ${o.customer_email} · ${fmt(Number(o.total))}` }); continue }

      // Preferencia nueva con el MISMO external_reference → el webhook confirma la orden original
      const pref = await new Preference(mp).create({
        body: {
          items: lineItems,
          payer: { email: o.customer_email },
          external_reference: o.external_reference,
          back_urls: {
            success: `${BASE}/checkout/success`,
            failure: `${BASE}/checkout`,
            pending: `${BASE}/checkout/success`,
          },
          auto_return: 'approved',
          notification_url: `${BASE}/api/webhooks/mercadopago`,
        },
      })
      const payUrl = pref.init_point
      if (!payUrl) { results.push({ order: o.order_number, status: 'sin init_point' }); continue }

      const sent = await sendEmail({
        to: o.customer_email,
        subject: `${o.customer_first_name ? o.customer_first_name + ', tu' : 'Tu'} pedido te está esperando 👕`,
        html: recoveryHtml({
          firstName: o.customer_first_name || 'Hola',
          orderNumber: o.order_number,
          items: (items || []).map((it: any) => ({ name: it.item_name, qty: Number(it.quantity) || 1 })),
          total: Number(o.total) || 0,
          payUrl,
          brandName: null,
          transferencia: o.payment_method === 'transferencia',
        }),
      })
      if (!sent.ok) { results.push({ order: o.order_number, status: `email error: ${sent.error}` }); continue }

      await sb
        .from('orders')
        .update({ metadata: { ...(o.metadata || {}), recovery_sent_at: new Date().toISOString(), recovery_pref_id: pref.id } })
        .eq('id', o.id)
      results.push({ order: o.order_number, status: `✅ enviado a ${o.customer_email}` })
    } catch (e: any) {
      results.push({ order: o.order_number, status: `error: ${e?.message?.slice(0, 120)}` })
    }
  }

  console.log('[abandoned-checkout]', JSON.stringify(results))
  return NextResponse.json({ dry, candidates: candidates.length, results })
}
