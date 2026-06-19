'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, Sparkles, Trash2, Plus, Factory, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/partners/auth-fetch'

// --- Types ---

interface CatalogProduct {
  id: string
  name: string
  images?: string[]
  metadata?: Record<string, unknown>
}

type Doble = 'Si' | 'No' | 'Chica'

interface EditableItem {
  name: string            // nombre canónico de la prenda (del parser / editable)
  color: string
  talle: string
  quantity: number
  doble_estampa: Doble
  unit_price: number      // PVP unitario (lo que cobra el partner)
  partner_price: number   // precio partner unitario (lo que nos transfiere)
  comments?: string
  store_product_id?: string // diseño elegido del catálogo (para matchear la estampa)
  mockup_url?: string
  print_url?: string        // arte print-ready exacto del producto elegido
  print_side?: 'frente' | 'dorso' | 'ambos'
}

interface ParsedItem {
  producto: string
  color: string
  talle: string
  cantidad: number
  doble_estampa: Doble
  comments?: string
}

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

function productImage(p: CatalogProduct): string | undefined {
  if (Array.isArray(p.images) && p.images[0]) return p.images[0]
  const meta = p.metadata as { colors?: Array<{ images?: { front?: string } }> } | undefined
  return meta?.colors?.[0]?.images?.front
}

function productPrintReady(p: CatalogProduct): { url?: string; side?: 'frente' | 'dorso' | 'ambos' } {
  const meta = p.metadata as { print_ready_url?: string; print_side?: 'frente' | 'dorso' | 'ambos' } | undefined
  return { url: meta?.print_ready_url, side: meta?.print_side }
}

function emptyItem(): EditableItem {
  return { name: '', color: '', talle: '', quantity: 1, doble_estampa: 'No', unit_price: 0, partner_price: 0 }
}

const ARS = (n: number) => `$${(n || 0).toLocaleString('es-AR')}`

export default function LoadOrderModal({ open, onClose, onCreated }: Props) {
  const [text, setText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [items, setItems] = useState<EditableItem[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [produce, setProduce] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Reset on open / load catalog
  useEffect(() => {
    if (!open) return
    setText(''); setParseError(null); setWarnings([]); setItems([])
    setCustomerName(''); setCustomerPhone(''); setShippingAddress(''); setNotes('')
    setProduce(true); setSaveError(null)
    authFetch('/api/partners/catalog')
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => setProducts(Array.isArray(d.products) ? d.products : []))
      .catch(() => setProducts([]))
  }, [open])

  const handleParse = useCallback(async () => {
    if (text.trim().length < 3) return
    setParsing(true); setParseError(null)
    try {
      const res = await authFetch('/api/partners/orders/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setParseError(data.error || 'No se pudo interpretar el texto. Cargá los items a mano.')
        if (items.length === 0) setItems([emptyItem()])
        return
      }
      const parsed: EditableItem[] = (data.items as ParsedItem[]).map((it) => ({
        name: it.producto || '',
        color: it.color || '',
        talle: it.talle || '',
        quantity: it.cantidad || 1,
        doble_estampa: it.doble_estampa || 'No',
        comments: it.comments,
        unit_price: 0,
        partner_price: 0,
      }))
      setItems(parsed.length ? parsed : [emptyItem()])
      setWarnings(Array.isArray(data.warnings) ? data.warnings : [])
      if (data.cliente && !customerName) setCustomerName(String(data.cliente))
    } catch {
      setParseError('Error de conexión al parsear.')
    } finally {
      setParsing(false)
    }
  }, [text, items.length, customerName])

  const updateItem = (idx: number, patch: Partial<EditableItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx))
  const addItem = () => setItems((prev) => [...prev, emptyItem()])

  const onPickProduct = (idx: number, productId: string) => {
    const p = products.find((x) => x.id === productId)
    const pr = p ? productPrintReady(p) : {}
    updateItem(idx, {
      store_product_id: productId || undefined,
      mockup_url: p ? productImage(p) : undefined,
      print_url: pr.url,
      print_side: pr.side,
    })
  }

  const pvpTotal = items.reduce((s, it) => s + (it.unit_price || 0) * it.quantity, 0)
  const partnerTotal = items.reduce((s, it) => s + (it.partner_price || 0) * it.quantity, 0)
  const canSave = items.length > 0 && items.every((it) => it.name.trim() && it.quantity > 0)

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true); setSaveError(null)
    try {
      const body = {
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        shipping_address: shippingAddress || undefined,
        notes: notes || undefined,
        produce,
        items: items.map((it) => ({
          product_id: it.store_product_id,
          name: it.name.trim(),
          producto_canonical: it.name.trim(),
          color: it.color || '',
          talle: it.talle || '',
          quantity: it.quantity,
          doble_estampa: it.doble_estampa,
          unit_price: it.unit_price || 0,
          partner_price: it.partner_price || 0,
          mockup_url: it.mockup_url,
          print_url: it.print_url,
          comments: [it.comments, it.print_side ? `Estampa: ${it.print_side}` : '']
            .filter(Boolean)
            .join(' · ') || undefined,
        })),
      }
      const res = await authFetch('/api/partners/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        onCreated()
      } else {
        const d = await res.json().catch(() => ({}))
        setSaveError(d.error || 'No se pudo guardar el pedido')
      }
    } catch {
      setSaveError('Error de conexión al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const inputCls =
    'w-full bg-zinc-900/60 border border-zinc-700 rounded-md px-2.5 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50'

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-3xl max-h-[92vh] md:max-h-[88vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-t-2xl md:rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 py-4 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Cargar venta</h2>
            <p className="text-xs text-zinc-500">Pegá el texto del pedido y la IA lo interpreta. Revisá y guardá.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Paste + parse */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Texto del pedido</label>
            <textarea
              data-testid="load-order-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Ej: Hola, quiero 2 remeras oversize negras talle L con estampa adelante y atrás, y 1 hoodie blanco M. Es para Juan Pérez."
              className={cn(inputCls, 'resize-none')}
            />
            <div className="flex items-center gap-3">
              <button
                data-testid="load-order-parse"
                onClick={handleParse}
                disabled={parsing || text.trim().length < 3}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
              >
                {parsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Parsear con IA
              </button>
              <button onClick={addItem} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Agregar item a mano
              </button>
            </div>
            {parseError && <p className="text-xs text-amber-400">{parseError}</p>}
            {warnings.length > 0 && (
              <ul className="text-xs text-amber-400/90 list-disc pl-4 space-y-0.5">
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-zinc-400">Items ({items.length})</label>
              {items.map((it, idx) => (
                <div key={idx} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Item {idx + 1}</span>
                    <button onClick={() => removeItem(idx)} className="p-1 rounded text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase tracking-wide text-zinc-600">Prenda</label>
                      <input className={inputCls} value={it.name} onChange={(e) => updateItem(idx, { name: e.target.value })} placeholder="Remera Oversize unisex" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-zinc-600">Color</label>
                      <input className={inputCls} value={it.color} onChange={(e) => updateItem(idx, { color: e.target.value })} placeholder="NEGRO" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-zinc-600">Talle</label>
                      <input className={inputCls} value={it.talle} onChange={(e) => updateItem(idx, { talle: e.target.value })} placeholder="L" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-zinc-600">Cantidad</label>
                      <input type="number" min={1} className={inputCls} value={it.quantity || ''} onChange={(e) => updateItem(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })} />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-zinc-600">Estampa</label>
                      <select className={inputCls} value={it.doble_estampa} onChange={(e) => updateItem(idx, { doble_estampa: e.target.value as Doble })}>
                        <option value="No">Simple</option>
                        <option value="Si">Doble (frente+dorso)</option>
                        <option value="Chica">Chica</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-zinc-600">PVP (al cliente)</label>
                      <input type="number" min={0} className={inputCls} value={it.unit_price || ''} onChange={(e) => updateItem(idx, { unit_price: Math.max(0, Number(e.target.value) || 0) })} placeholder="$ unit." />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-zinc-600">Tu precio Novamente</label>
                      <input type="number" min={0} className={inputCls} value={it.partner_price || ''} onChange={(e) => updateItem(idx, { partner_price: Math.max(0, Number(e.target.value) || 0) })} placeholder="$ unit." />
                    </div>
                    <div className="col-span-2 md:col-span-4">
                      <label className="text-[10px] uppercase tracking-wide text-zinc-600">Diseño de tu tienda (para la estampa)</label>
                      <select className={inputCls} value={it.store_product_id || ''} onChange={(e) => onPickProduct(idx, e.target.value)}>
                        <option value="">— Elegí el producto/diseño —</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      {it.store_product_id && (
                        it.print_url ? (
                          <p className="mt-1 text-[11px] text-emerald-400">
                            ✓ Arte print-ready cargada ({it.print_side === 'dorso' ? 'dorso' : it.print_side === 'ambos' ? 'frente y dorso' : 'frente'}) — se manda a producción.
                          </p>
                        ) : (
                          <p className="mt-1 text-[11px] text-amber-400">
                            ⚠ Este producto no tiene arte print-ready cargada. Subila en Catálogo → editar producto, o el equipo la confirma manualmente.
                          </p>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Customer + options */}
          {items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-zinc-600">Cliente</label>
                <input className={inputCls} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nombre del cliente" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-zinc-600">Teléfono</label>
                <input className={inputCls} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-wide text-zinc-600">Dirección de envío</label>
                <input className={inputCls} value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-wide text-zinc-600">Notas</label>
                <textarea rows={2} className={cn(inputCls, 'resize-none')} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
              </div>
            </div>
          )}

          {/* Produce toggle */}
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setProduce((v) => !v)}
              className={cn(
                'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors',
                produce ? 'bg-violet-600/10 border-violet-500/40' : 'bg-zinc-900/40 border-zinc-800',
              )}
            >
              <div className={cn('mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0', produce ? 'bg-violet-500/20' : 'bg-zinc-800')}>
                {produce ? <Factory className="w-4 h-4 text-violet-300" /> : <ClipboardList className="w-4 h-4 text-zinc-400" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-100">{produce ? 'Producir con Novamente' : 'Solo registrar'}</p>
                <p className="text-xs text-zinc-500">
                  {produce
                    ? 'Manda el pedido a producción con Novamente además de registrarlo.'
                    : 'Solo lo registra en tu panel (lo produciste/cumpliste por fuera).'}
                </p>
              </div>
              <div className={cn('ml-auto mt-1 w-9 h-5 rounded-full p-0.5 transition-colors shrink-0', produce ? 'bg-violet-600' : 'bg-zinc-700')}>
                <div className={cn('w-4 h-4 rounded-full bg-white transition-transform', produce ? 'translate-x-4' : 'translate-x-0')} />
              </div>
            </button>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="sticky bottom-0 flex items-center justify-between gap-4 px-5 py-3.5 bg-zinc-950/95 backdrop-blur border-t border-zinc-800">
            <div className="text-xs text-zinc-400">
              <span className="text-zinc-500">PVP:</span> <span className="text-zinc-200 font-medium">{ARS(pvpTotal)}</span>
              <span className="mx-2 text-zinc-700">·</span>
              <span className="text-zinc-500">Tu precio:</span> <span className="text-zinc-200 font-medium">{ARS(partnerTotal)}</span>
            </div>
            <div className="flex items-center gap-2">
              {saveError && <span className="text-xs text-red-400">{saveError}</span>}
              <button onClick={onClose} className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                Cancelar
              </button>
              <button
                data-testid="load-order-submit"
                onClick={handleSave}
                disabled={!canSave || saving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Guardar pedido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
