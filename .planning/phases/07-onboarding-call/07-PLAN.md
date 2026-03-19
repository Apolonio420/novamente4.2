# Phase 7: Onboarding Call Scheduling (Pro)
**Priority:** LOW — Pro differentiator, nice-to-have
**Depends on:** None (independent)
**Tier gating:** Pro only

## What Must Be TRUE When Done

1. Pro partners can book a 1:1 onboarding call from their workspace
2. Calendar shows available time slots
3. Booking triggers email confirmation + calendar invite (.ics)
4. Novamente team gets notified of new bookings
5. Non-Pro partners see this feature as locked

---

## Task 7-1: Choose Scheduling Approach
**Decision:** Cal.com embed vs. custom lightweight scheduler

**Approach: Cal.com Embed (recommended)**
- Cal.com has a free tier (1 event type, 1 calendar)
- Embed widget drops into a Next.js page
- Handles timezone, conflicts, Google Calendar sync
- Zero maintenance

**Fallback: Custom Scheduler**
- If Cal.com is not viable, build simple form → Google Calendar API
- Available slots: M-F, 10:00-18:00 ART
- Block 30-min slots, show calendar grid

**Selected:** Cal.com embed with custom fallback form

## Task 7-2: Create Onboarding Call Page
**New file:** `app/workspace/onboarding-call/page.tsx`
**Layout:**

**Option A: Cal.com Embed**
```tsx
// Cal.com embed snippet (from cal.com/embed docs)
// Configure: event type = "Onboarding Novamente Partners"
// Duration: 30 min
// Pre-fill: name from tenant, email from auth
```
- Full-width card with Cal.com widget embedded
- Title: "Agendá tu onboarding call"
- Subtitle: "30 minutos con un asesor de Novamente para configurar tu cuenta y resolver dudas"

**Option B: Fallback Form**
- If Cal.com not configured (no NEXT_PUBLIC_CAL_LINK env var):
- Show a form:
  - Preferred date (date picker, min = tomorrow, max = +30 days)
  - Preferred time slot (dropdown: 10:00, 10:30, 11:00, ... 17:30)
  - Topic/agenda (textarea, optional)
  - Phone/WhatsApp (pre-filled from tenant)
  - "Solicitar llamada" button
- On submit → sends email to admin + WhatsApp notification
- Shows confirmation: "Te contactaremos para confirmar el horario"

## Task 7-3: Create Booking API
**New file:** `app/api/partners/onboarding-call/route.ts`
- POST: `{ preferredDate, preferredTime, topic?, phone? }`
- Gate: Pro only
- Creates booking record in DB
- Sends confirmation email to partner
- Sends notification to admin (email + Telegram)
- Generates .ics calendar invite attachment in email

**Migration SQL:**
```sql
CREATE TABLE IF NOT EXISTS partner_onboarding_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  topic TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Task 7-4: Generate .ics Calendar Invite
**New file:** `lib/partners/calendar-invite.ts`
```typescript
// generateICS(booking: { date, time, partnerName, topic? }) → string
// Standard iCalendar format:
// BEGIN:VCALENDAR
// VERSION:2.0
// BEGIN:VEVENT
// DTSTART:20260320T130000Z
// DTEND:20260320T133000Z
// SUMMARY:Onboarding Call — {partnerName}
// DESCRIPTION:Onboarding call con Novamente Partners
// END:VEVENT
// END:VCALENDAR
```

## Task 7-5: Post-Booking Confirmation UI
**File:** `app/workspace/onboarding-call/page.tsx`
**Change:** After booking, show confirmation card:
- "Llamada agendada" with check icon
- Date and time shown
- "Agregar a calendario" button (downloads .ics)
- "Reagendar" and "Cancelar" options
- Status: Pending → Confirmed (after admin confirms)

## Task 7-6: Workspace Navigation Link
- Add "Onboarding Call" link with Phone/Video icon
- Pro: accessible (shows "Agendar" badge if not yet booked)
- Growth/Starter: locked with Pro badge
- After booking: shows "Agendado" badge

---

## Verification Checklist
- [ ] Pro partner can access `/workspace/onboarding-call`
- [ ] Cal.com embed loads OR fallback form displays
- [ ] Booking creates record in DB
- [ ] Confirmation email sent to partner
- [ ] Admin notification (email + Telegram)
- [ ] .ics calendar invite downloadable
- [ ] Post-booking UI shows correct status
- [ ] Non-Pro partners see upgrade prompt
- [ ] `npx next build` passes
