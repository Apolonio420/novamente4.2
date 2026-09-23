'use client'

/**
 * Fase 3 pieza C — ruta SOLO DEV para poder ver/testear el panel "Nuevo
 * producto" sin loguearse como partner (el panel real vive dentro de
 * /workspace/catalog, que exige sesión). `notFound()` en producción.
 *
 * Usada por:
 *  - e2e/partner-new-product.spec.ts (mockea los endpoints con page.route)
 *  - las capturas manuales pedidas en la revisión de Fase 3 (1280/390,
 *    npx next start -p 3014)
 */
import { notFound } from 'next/navigation'
import { useState } from 'react'
import { NewProductPanel } from '@/components/partners/new-product-panel'

const FAKE_GARMENT_PRICING = {
  'aldea-classic-tshirt': {
    key: 'aldea-classic-tshirt',
    name: 'Remera Aldea Classic Fit',
    on_demand: 25800,
    b2b_starter: 25800,
    b2b_pro: 24000,
    b2b_drop: 23000,
    b2b_bulk: 21000,
    b2c_suggested: 28600,
    myPrice: 25800,
    growthPrice: null,
  },
} as any

export default function NewProductPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }
  return <NewProductPreviewInner />
}

function NewProductPreviewInner() {
  const [open, setOpen] = useState(true)
  const [lastCreated, setLastCreated] = useState<any>(null)

  return (
    <div className="min-h-screen bg-zinc-950 p-6" data-testid="dev-new-product-preview">
      <p className="text-zinc-400 text-sm mb-4">
        Preview SOLO DEV del panel &quot;Nuevo producto&quot; (Fase 3 pieza C) — no requiere login de partner.
      </p>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md bg-violet-600 text-white px-4 py-2 text-sm"
        >
          Abrir panel
        </button>
      )}
      {lastCreated && (
        <pre data-testid="dev-last-created" className="mt-4 text-xs text-emerald-400 whitespace-pre-wrap">
          {JSON.stringify(lastCreated, null, 2)}
        </pre>
      )}
      <NewProductPanel
        open={open}
        onClose={() => setOpen(false)}
        garmentPricing={FAKE_GARMENT_PRICING}
        onCreated={(product) => {
          setLastCreated(product)
          setOpen(false)
        }}
      />
    </div>
  )
}
