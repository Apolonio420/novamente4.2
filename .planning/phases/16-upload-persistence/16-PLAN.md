# Phase 16: Fix File Upload Persistence in Onboarding Wizard
**Priority:** HIGH — data loss bug affecting all new partners
**Depends on:** None
**Status:** Bug — uploads lost on page refresh or step navigation

## Current State

**File:** `app/partners/join/page.tsx`

The onboarding wizard saves form state to localStorage for persistence across refreshes. However, file uploads have a critical bug:

### The Bug

1. User uploads logo in Step 2 (Brand Identity)
2. `handleLogoSelect()` stores `logoPreview` as `URL.createObjectURL(file)` (blob URL)
3. Upload starts to R2 via `/api/partners/onboarding/upload` → returns persistent URL
4. On success, `logoPreview` is updated to the R2 URL
5. **BUT** if user refreshes BETWEEN steps 2-3, or upload fails:
   - localStorage has the blob URL (dead after refresh)
   - The `File` object (`logoFile`) is NOT serializable → excluded from localStorage
   - On restore: `logoPreview` is a dead `blob:` URL → broken image

### Same issue for:
- `bannerPreview` / `bannerFile`
- `heroPreview` / `heroFile`
- Product images in Step 5

### Secondary issue: Orphaned R2 files
- Files uploaded to `onboarding/${sessionId}/${type}/${timestamp}.ext`
- Session ID stored in sessionStorage (cleared on browser close)
- No cleanup mechanism → orphaned files accumulate in R2

---

## What Must Be TRUE When Done

1. Upload preview shows immediately (local blob URL for instant feedback)
2. R2 URL replaces blob URL as soon as upload completes
3. On page refresh, persisted URL is always the R2 URL (never a blob URL)
4. If upload fails, user sees error and can retry
5. Orphaned R2 files cleaned up when tenant is created
6. Product images in Step 5 have the same persistence fix

---

## Task 16-1: Fix Upload State Persistence

**File:** `app/partners/join/page.tsx`

### Fix `handleLogoSelect` (and banner, hero equivalents):

```typescript
const handleLogoSelect = async (file: File, preview: string) => {
  // Show local preview immediately for instant feedback
  update({ logoPreview: preview })
  setUploadingLogo(true)

  try {
    const url = await uploadOnboardingFile(file, 'logo')
    if (url) {
      // Replace blob URL with persistent R2 URL
      update({ logoPreview: url })
    } else {
      // Upload failed — show error, keep local preview for retry
      setLogoError('Error al subir la imagen. Intentá de nuevo.')
    }
  } catch {
    setLogoError('Error al subir la imagen. Intentá de nuevo.')
  } finally {
    setUploadingLogo(false)
  }
}
```

### Fix localStorage serialization:

In the `useEffect` that saves to localStorage, filter out blob URLs:

```typescript
const stateToSave = { ...wizardData }
// Never persist blob URLs — they die on refresh
if (stateToSave.logoPreview?.startsWith('blob:')) {
  stateToSave.logoPreview = ''
}
if (stateToSave.bannerPreview?.startsWith('blob:')) {
  stateToSave.bannerPreview = ''
}
if (stateToSave.heroPreview?.startsWith('blob:')) {
  stateToSave.heroPreview = ''
}
localStorage.setItem('onboarding_wizard', JSON.stringify(stateToSave))
```

### Fix state restoration:

On mount, when loading from localStorage:
```typescript
const saved = localStorage.getItem('onboarding_wizard')
if (saved) {
  const parsed = JSON.parse(saved)
  // Only use previews that are real URLs (not blob:)
  if (parsed.logoPreview?.startsWith('blob:')) parsed.logoPreview = ''
  if (parsed.bannerPreview?.startsWith('blob:')) parsed.bannerPreview = ''
  if (parsed.heroPreview?.startsWith('blob:')) parsed.heroPreview = ''
  setWizardData(parsed)
}
```

---

## Task 16-2: Add Upload Error State & Retry

**File:** `app/partners/join/page.tsx`

For each upload field (logo, banner, hero):
1. Add error state: `const [logoError, setLogoError] = useState<string>('')`
2. Show error message below the upload area
3. Add "Reintentar" button that triggers the upload again
4. Clear error when user selects a new file

---

## Task 16-3: Fix Product Image Persistence (Step 5)

**File:** `app/partners/join/page.tsx` — Step 5 (Catalog)

Same issue: product images may be blob URLs. Apply same fix:
- Upload immediately to R2
- Store R2 URL in product data
- Filter blob URLs before localStorage save
- On restore, only use real URLs

---

## Task 16-4: R2 Cleanup on Tenant Creation

**File:** `app/api/partners/onboarding/route.ts` (Step 1 — create tenant)

After tenant is created successfully:
1. Move uploaded files from `onboarding/${sessionId}/` to `partners/${tenantSlug}/`
2. Update tenant record with the new URLs (logo_url, banner_url, hero_url)

**Alternative (simpler):** Don't move files. Keep them in `onboarding/` path. Add a cleanup cron that deletes `onboarding/` files older than 7 days where no tenant was created.

**File:** `app/api/cron/cleanup-onboarding/route.ts` (new)
- Runs daily via cron
- Lists files in `onboarding/` bucket prefix
- Deletes files older than 7 days
- Protected by `CRON_SECRET`

---

## Task 16-5: Upload Progress Indicator

**File:** `app/partners/join/page.tsx`

Replace simple "Subiendo..." text with:
- Spinner animation during upload
- Success checkmark when R2 URL is received
- Error icon + retry when upload fails
- Don't allow advancing to next step while uploads are in progress

Add disable logic:
```typescript
const canAdvanceFromStep2 = !uploadingLogo && !uploadingBanner && !uploadingHero
```

---

## Verification Checklist
- [ ] Upload logo → refresh page → logo still visible (R2 URL)
- [ ] Upload logo → close browser → reopen → logo still visible
- [ ] Upload fails → error message shown → retry works
- [ ] Blob URLs never saved to localStorage
- [ ] Product images in Step 5 persist across refresh
- [ ] Can't advance step while uploads in progress
- [ ] Orphaned files cleaned up after 7 days (cron)
- [ ] Full onboarding flow works end-to-end without data loss
- [ ] `npx next build` passes
