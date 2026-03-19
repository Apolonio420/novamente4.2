# Phase 14: Onboarding Call Scheduling — Gaps & Completion
**Priority:** LOW — Pro-only, mostly implemented
**Depends on:** Migration applied (partner_onboarding_calls table EXISTS)
**Status of existing code:** REAL — booking, cancellation, ICS, UI all implemented

## Current State

Onboarding call system is **fully coded**:
- `lib/partners/onboarding-call.ts` — createBooking(), getBooking(), cancelBooking()
- `app/api/partners/onboarding-call/route.ts` — GET/POST/DELETE
- `app/api/partners/onboarding-call/ics/route.ts` — iCalendar file generation
- `app/workspace/onboarding-call/page.tsx` — Full booking UI (Pro gated)

**What's MISSING:**
1. No admin notification when a call is booked (admin doesn't know to join)
2. No confirmation email to partner after booking
3. No integration with Google Calendar / Calendly (manual scheduling only)
4. No reminder notification before the call (24h, 1h)
5. Time slots don't account for already-booked slots (double booking possible)

---

## What Must Be TRUE When Done

1. When partner books a call → admin gets email + Telegram with date/time/topic
2. Partner receives confirmation email with ICS attachment
3. Already-booked time slots are disabled in the picker
4. Admin can see all upcoming calls in `/admin/onboarding-calls`
5. (Optional) 24h reminder notification via email

---

## Task 14-1: Admin Notification on Booking

**File:** `lib/partners/onboarding-call.ts` or new `lib/partners/call-notifications.ts`

After `createBooking()` succeeds:
1. Send Telegram notification (reuse existing helper):
   - "Nueva llamada de onboarding agendada"
   - Partner: {tenantName} / Fecha: {date} {time} / Tema: {topic} / Tel: {phone}
2. Send email to `SUPPORT_ADMIN_EMAILS`:
   - Subject: "[Novamente] Llamada de onboarding: {tenantName} — {date}"
   - Body: booking details + ICS attachment

---

## Task 14-2: Confirmation Email to Partner

After booking:
- Send email to tenant's email
- Subject: "Tu llamada de onboarding está confirmada"
- Body: date, time, topic, ICS download link
- Attach ICS file inline (or link to `/api/partners/onboarding-call/ics?bookingId={id}`)

---

## Task 14-3: Prevent Double Booking

**File:** `app/api/partners/onboarding-call/route.ts` (POST handler)

Before creating booking:
1. Query existing bookings for the same date+time slot (across ALL tenants)
2. If slot taken → return 409 Conflict: "Este horario ya está reservado"

**File:** `app/workspace/onboarding-call/page.tsx`

- Fetch booked slots for selected date: GET `/api/partners/onboarding-call/slots?date={date}`
- Disable already-booked time buttons in the UI

**New API:** `app/api/partners/onboarding-call/slots/route.ts`
- GET `?date=2026-03-20` → returns array of booked times: `["10:00", "14:30"]`
- Public (no auth) — only returns times, not who booked

---

## Task 14-4: Admin Onboarding Calls Dashboard

**New file:** `app/admin/onboarding-calls/page.tsx`

- List all upcoming calls (ordered by date)
- Columns: Partner name, date, time, topic, phone, status
- Quick action: mark as confirmed / completed / cancelled
- Filter: upcoming / past / cancelled

**New API:** `app/api/admin/onboarding-calls/route.ts`
- GET: all calls with tenant info (join with tenants)
- PATCH `/{id}`: update status

---

## Verification Checklist
- [ ] Partner books call → admin gets Telegram notification
- [ ] Partner books call → admin gets email with ICS
- [ ] Partner receives confirmation email
- [ ] Double booking prevented (same slot returns 409)
- [ ] Booked slots disabled in time picker UI
- [ ] `/admin/onboarding-calls` shows upcoming calls
- [ ] Admin can mark calls as completed
- [ ] Non-Pro partners can't access booking page
- [ ] `npx next build` passes
