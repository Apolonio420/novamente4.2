# Phase 10: Support System — Email & WhatsApp Notifications
**Priority:** MEDIUM — feature is coded, needs notification layer
**Depends on:** Migration applied (partner_support_tickets, partner_support_messages tables EXIST)
**Status of existing code:** REAL — full CRUD, UI, plan gating implemented

## Current State

The support ticket system is **fully coded**:
- `lib/partners/support.ts` — createTicket(), getTickets(), getTicketById(), addMessage(), updateTicketStatus()
- `app/api/partners/support/route.ts` — GET/POST with plan gating (Growth+)
- `app/api/partners/support/[ticketId]/route.ts` — ticket detail + messages
- `app/workspace/support/page.tsx` — Full UI with create form, filter tabs, ticket list

**What's MISSING:**
1. No email notification when a ticket is created (admin doesn't know)
2. No email notification when admin replies (partner doesn't know)
3. No WhatsApp notification for Pro partners
4. No admin-side ticket management UI (admin can't reply from dashboard)
5. Ticket detail page doesn't exist in workspace (can create but can't view conversation)

---

## What Must Be TRUE When Done

1. When partner creates ticket → admin gets email + Telegram notification
2. When admin replies → partner gets email (Growth) or WhatsApp (Pro) notification
3. Partners can view ticket detail with full conversation thread
4. Admin can view and reply to tickets from `/admin/support`
5. Pro partners see WhatsApp priority link (already in UI, needs real number)

---

## Task 10-1: Ticket Detail Page for Partners

**New file:** `app/workspace/support/[ticketId]/page.tsx`

- Fetches ticket with messages from `/api/partners/support/{ticketId}`
- Shows conversation thread (partner messages left, admin messages right)
- Reply form at bottom (POST message to ticket)
- Status badge (open/in_progress/resolved/closed)
- Back link to ticket list

---

## Task 10-2: Email Notifications on Ticket Events

**New file:** `lib/partners/support-notifications.ts`

Functions:
```typescript
// Send email to admin when partner creates ticket
async function notifyAdminNewTicket(ticket: SupportTicket, tenantName: string): Promise<void>
// Uses: Resend or nodemailer (check what's available)
// Recipients: admin emails from env var SUPPORT_ADMIN_EMAILS (comma-separated)
// Subject: "[Novamente Support] Nuevo ticket: {subject} — {tenantName}"
// Body: HTML with ticket details, category, priority badge

// Send email to partner when admin replies
async function notifyPartnerReply(ticket: SupportTicket, message: SupportMessage, partnerEmail: string): Promise<void>
// Subject: "Respuesta a tu ticket: {subject}"
// Body: HTML with admin message + link to view ticket in workspace

// Send Telegram notification (reuse existing TELEGRAM_ env vars)
async function notifyTelegramNewTicket(ticket: SupportTicket, tenantName: string): Promise<void>
```

**Integration points:**
- `createTicket()` in `lib/partners/support.ts` → call `notifyAdminNewTicket()` (fire-and-forget)
- Admin reply endpoint → call `notifyPartnerReply()` (fire-and-forget)

---

## Task 10-3: WhatsApp Notification for Pro Partners

**In `lib/partners/support-notifications.ts`:**

```typescript
async function notifyPartnerWhatsApp(phone: string, ticketSubject: string, adminMessage: string): Promise<void>
// Uses Meta WhatsApp Business API (check if WHATSAPP_TOKEN env var exists)
// Template message or free-form if within 24h window
// Fallback: if no WhatsApp API configured, send email instead
```

**Note:** This may need a WhatsApp Business API template approved by Meta. If not available, fall back to email + show WhatsApp number for manual contact (already implemented in UI).

---

## Task 10-4: Admin Support Dashboard

**New file:** `app/admin/support/page.tsx`

- Lists all tickets across all tenants (uses `getAdminTickets()`)
- Filter by status, priority
- Click to view ticket detail + reply
- Reply form posts message as `sender_type: 'admin'`
- Quick actions: change status (open → in_progress → resolved → closed)

**New API:** `app/api/admin/support/[ticketId]/route.ts`
- GET: ticket detail with messages (admin auth required)
- POST: add admin reply message
- PATCH: update ticket status

---

## Task 10-5: Configure Real WhatsApp Support Number

**File:** `app/workspace/support/page.tsx`

The UI already shows a WhatsApp link for Pro partners. Verify it points to a real number:
- Check if `SUPPORT_WHATSAPP_NUMBER` env var exists
- If not, add it and reference in the UI
- Format: `https://wa.me/{number}?text=Hola, necesito ayuda con mi storefront {tenantName}`

---

## Verification Checklist
- [ ] Partner creates ticket → admin gets email
- [ ] Partner creates ticket → Telegram notification sent
- [ ] Admin replies → partner gets email
- [ ] Pro partner → WhatsApp notification or fallback
- [ ] `/workspace/support/{ticketId}` shows conversation thread
- [ ] Partner can reply in thread
- [ ] `/admin/support` lists all tickets
- [ ] Admin can reply and change status
- [ ] Growth partner sees email support UI
- [ ] Pro partner sees WhatsApp priority link
- [ ] Starter partner sees upgrade overlay
- [ ] `npx next build` passes
