# Phase 3: Support System
**Priority:** HIGH — table stakes for any paid plan
**Depends on:** None (independent)
**Tier gating:** Growth = email tickets, Pro = WhatsApp priority + email

## What Must Be TRUE When Done

1. Growth partners can create support tickets from workspace
2. Tickets have statuses: open → in_progress → resolved → closed
3. Email notifications fire on ticket creation and status updates (nodemailer)
4. Pro partners see a WhatsApp priority support link in workspace header
5. Admin view exists for the Novamente team to manage and respond to tickets
6. Response times are tracked — Pro tickets flagged as priority

---

## Task 3-1: Create Support Tables
**Migration SQL:**
```sql
CREATE TABLE IF NOT EXISTS partner_support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
  priority TEXT NOT NULL DEFAULT 'normal', -- normal, priority (auto-set for Pro)
  category TEXT DEFAULT 'general', -- general, billing, technical, feature_request
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS partner_support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES partner_support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'partner' or 'admin'
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]', -- [{url, name, type}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_tenant ON partner_support_tickets(tenant_id);
CREATE INDEX idx_tickets_status ON partner_support_tickets(status);
CREATE INDEX idx_tickets_priority ON partner_support_tickets(priority, created_at);
CREATE INDEX idx_messages_ticket ON partner_support_messages(ticket_id, created_at);
```

## Task 3-2: Create Support Service Layer
**New file:** `lib/partners/support.ts`
**Functions:**
```typescript
// createTicket(tenantId, subject, description, category?) → ticket
//   Auto-sets priority based on plan (Pro → 'priority')
// getTickets(tenantId, status?) → ticket[]
// getTicketById(ticketId, tenantId) → ticket with messages[]
// addMessage(ticketId, senderType, senderName, message, attachments?) → message
// updateTicketStatus(ticketId, status) → ticket
//   If status === 'resolved', set resolved_at
// getAdminTickets(status?, priority?) → ticket[] with tenant info
// getTicketStats(tenantId?) → { open: number, in_progress: number, resolved: number, avg_response_hours: number }
```

## Task 3-3: Create Email Notification Service
**New file:** `lib/partners/support-email.ts`
**Implementation:**
- Uses nodemailer with SMTP config from env vars (already configured for leads system)
- Templates:
  - `ticket_created` — sent to partner confirming receipt + to admin team
  - `ticket_reply` — sent when admin replies to ticket
  - `ticket_resolved` — sent when ticket is marked resolved
  - `ticket_status_changed` — sent on any status change
- HTML email templates with Novamente branding (inline styles)
- From: `soporte@novamente.ar`

## Task 3-4: Create Support API Routes
**New file:** `app/api/partners/support/route.ts`
- GET: list partner's tickets (with optional status filter)
- POST: create new ticket (subject, description, category)

**New file:** `app/api/partners/support/[ticketId]/route.ts`
- GET: get ticket with messages
- POST: add message to ticket (partner reply)
- PATCH: update status (admin only via internal check)

**New file:** `app/api/partners/support/[ticketId]/messages/route.ts`
- GET: get messages for ticket
- POST: add new message

## Task 3-5: Create Support Dashboard Page (Partner View)
**New file:** `app/workspace/support/page.tsx`
**Layout:**
- **Header:** "Soporte" title + "Nuevo ticket" button
- **Stats bar:** Open tickets count, avg response time, resolved this month
- **Ticket list:** Cards with subject, status badge (color-coded), category, last updated, priority flag
- **Filters:** Status dropdown (all, open, in_progress, resolved, closed)
- **Click ticket:** Opens detail view

**New file:** `app/workspace/support/[ticketId]/page.tsx`
**Layout:**
- Ticket header: subject, status badge, priority badge, created date
- Message thread: chronological, partner messages right-aligned (bubble), admin messages left-aligned
- Reply textarea + send button at bottom
- Status shown at top, partner can close ticket with "Marcar como resuelto"

**Starter gate:** Show "El soporte está disponible en planes Growth y Pro" with upgrade CTA
**Tier check:** Use `features.supportLevel` — 'none' = blocked, 'email' = full access, 'whatsapp' = full access + WhatsApp badge

## Task 3-6: WhatsApp Priority Support (Pro)
**File:** `app/workspace/layout.tsx` or workspace header component
**Change:** For Pro partners, show a floating WhatsApp badge in workspace header:
- Green WhatsApp icon + "Soporte Prioritario"
- Links to `https://wa.me/message/DRWR3O2HZY2JG1` (or dedicated support number)
- Small "SLA: respuesta en < 4 horas" text
- Badge only visible when `features.supportLevel === 'whatsapp'`

**File:** `app/workspace/support/page.tsx`
**Change:** Pro partners see a prominent WhatsApp card at top of support page:
- "Soporte WhatsApp Prioritario" with direct link
- "Tiempo de respuesta promedio: < 4 horas"
- Still have access to ticket system for async issues

## Task 3-7: Admin Support View
**New file:** `app/workspace/admin/support/page.tsx` (or integrate into existing admin area)
**Note:** This may need to be at a different route depending on admin architecture
**Layout:**
- All tickets from all partners, sorted by priority then date
- Priority tickets highlighted (orange/red background)
- Quick actions: change status, assign, reply inline
- Filter by: status, priority, partner, category
- Stats: total open, avg response time, SLA compliance

---

## Verification Checklist
- [ ] Growth partner can create a support ticket
- [ ] Ticket appears in list with correct status
- [ ] Partner can reply to ticket, messages appear in thread
- [ ] Email sent on ticket creation (check with test email)
- [ ] Status changes trigger email notifications
- [ ] Pro partner sees WhatsApp priority badge in workspace header
- [ ] Pro partner's tickets auto-tagged as priority
- [ ] Starter partner sees upgrade prompt instead of support
- [ ] Admin can view all tickets, reply, change status
- [ ] Mobile responsive (ticket list + detail view)
- [ ] `npx next build` passes
