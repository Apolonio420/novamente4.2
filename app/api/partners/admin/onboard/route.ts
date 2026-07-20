import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/partners/auth'
import { getTenantById, addTenantUser } from '@/lib/partners/tenant'
import { sendEmail } from '@/lib/email'
import { buildPartnerWelcomeEmail } from '@/lib/partners/partner-welcome-email'

const db = () => supabaseAdmin as any

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
function tempPassword(): string {
  const pick = (n: number) => {
    const bytes = randomBytes(n)
    let out = ''
    for (let i = 0; i < n; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
    return out
  }
  return `Nova-${pick(4)}-${pick(4)}`
}

async function findUserByEmail(email: string) {
  const target = email.toLowerCase()
  let page = 1
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const found = data.users.find((u: any) => (u.email || '').toLowerCase() === target)
    if (found) return found
    if (data.users.length < 200) return null
    page++
  }
}

/**
 * POST /api/partners/admin/onboard
 * Admin-only. Da acceso de login a un tenant YA creado (por INSERT directo o
 * cualquier vía) creando el auth user + el link tenant_users(role=owner).
 *
 * Body: { tenant_id: string, email: string, reset_password?: boolean }
 * Resp: { tenant, email, password|null, existing_user, login_url }
 *
 * - Usuario nuevo  → crea con password temporal y lo devuelve.
 * - Usuario existe → reusa; password null salvo reset_password=true.
 * - Idempotente en el link (no duplica; activa accepted_at si faltaba).
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const tenantId: string = body?.tenant_id
  const email: string = (body?.email || '').trim()
  const resetPassword: boolean = body?.reset_password === true

  if (!tenantId || !email) {
    return NextResponse.json({ error: 'tenant_id and email are required' }, { status: 400 })
  }

  const tenant = await getTenantById(tenantId)
  if (!tenant) {
    return NextResponse.json({ error: `Tenant ${tenantId} not found` }, { status: 404 })
  }

  // 1. Resolver / crear auth user
  let user: any
  let password: string | null = null
  let existingUser = false

  try {
    user = await findUserByEmail(email)
  } catch (e: any) {
    return NextResponse.json({ error: `listUsers failed: ${e?.message}` }, { status: 500 })
  }

  if (!user) {
    password = tempPassword()
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (cErr || !created?.user) {
      return NextResponse.json({ error: `createUser failed: ${cErr?.message}` }, { status: 500 })
    }
    user = created.user
  } else {
    existingUser = true
    if (resetPassword) {
      password = tempPassword()
      const { error: uErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password })
      if (uErr) {
        return NextResponse.json({ error: `password reset failed: ${uErr.message}` }, { status: 500 })
      }
    }
  }

  // 2. Garantizar link tenant_users con accepted_at (requerido por getTenantByUserId)
  const { data: existingLink } = await db()
    .from('tenant_users')
    .select('id, accepted_at')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existingLink) {
    const link = await addTenantUser(tenant.id, user.id, 'owner')
    if (!link) {
      return NextResponse.json({ error: 'Failed to link user to tenant' }, { status: 500 })
    }
  } else if (!existingLink.accepted_at) {
    await db()
      .from('tenant_users')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', existingLink.id)
  }

  const origin = new URL(request.url).origin
  const loginUrl = `${origin}/partners/login`

  // Email de bienvenida — solo en el alta real de una cuenta nueva (nunca en un
  // reset_password sobre un usuario que ya existía, eso no es "dar de alta").
  // Best-effort: la password ya vuelve una única vez en la respuesta al admin,
  // este mail NUNCA la incluye, solo linkea al login.
  if (!existingUser) {
    try {
      const { subject, html } = buildPartnerWelcomeEmail({ tenantName: tenant.name, email, loginUrl })
      await sendEmail({ to: email, subject, html })
    } catch (e) {
      console.error('[admin/onboard] welcome email failed', e)
    }
  }

  return NextResponse.json({
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
    email,
    password,
    existing_user: existingUser,
    login_url: loginUrl,
  })
}
