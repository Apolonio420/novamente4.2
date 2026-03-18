"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import AssetUploader from "./AssetUploader"
import ProductEditor from "./ProductEditor"
import type { Partner, Product } from "@/src/data/partners"

interface Props {
  initial?: Partner        // undefined = new partner
  mode: "create" | "edit"
}

const empty: Partner = {
  id: "",
  name: "",
  slogan: "",
  description: "",
  values: "",
  mission: "",
  logo: "",
  cardImage: "",
  banner: "",
  instagramUrl: "",
  featured: false,
  products: [],
}

export default function PartnerForm({ initial, mode }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<Partner>(initial ?? empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function set<K extends keyof Partner>(key: K, value: Partner[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const url = mode === "create"
        ? "/api/admin/partners"
        : `/api/admin/partners/${initial!.id}`
      const method = mode === "create" ? "POST" : "PUT"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al guardar")
      setSuccess(true)
      setTimeout(() => {
        router.push("/admin/partners")
        router.refresh()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setSaving(false)
    }
  }

  const partnerId = form.id || (initial?.id ?? "")

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* ── IDENTIDAD ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2">Identidad</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Slug (ID)"
            hint="URL-friendly, sin espacios ni mayúsculas. Ej: mi-brand"
            required
            disabled={mode === "edit"}
          >
            <input
              type="text"
              value={form.id}
              onChange={(e) => set("id", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="mi-brand"
              className={inputCls}
              required
              disabled={mode === "edit"}
            />
          </Field>
          <Field label="Nombre visible" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="MI BRAND"
              className={inputCls}
              required
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Slogan" hint="Una línea corta. Aparece en la card del partner.">
            <input
              type="text"
              value={form.slogan}
              onChange={(e) => set("slogan", e.target.value)}
              placeholder="Libertad. Identidad. Futuro."
              className={inputCls}
            />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Instagram URL">
            <input
              type="url"
              value={form.instagramUrl ?? ""}
              onChange={(e) => set("instagramUrl", e.target.value)}
              placeholder="https://instagram.com/mi-brand"
              className={inputCls}
            />
          </Field>
          <Field label="" hint="">
            <label className="flex items-center gap-2 mt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured ?? false}
                onChange={(e) => set("featured", e.target.checked)}
                className="w-4 h-4 rounded accent-yellow-400"
              />
              <span className="text-sm text-zinc-300">Destacado (badge amarillo)</span>
            </label>
          </Field>
        </div>
      </section>

      {/* ── TEXTOS DE MARCA ───────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2">Historia / Branding</h2>
        <div className="space-y-4">
          <Field label="Descripción (párrafo 1)">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Historia del brand, origen..."
              className={inputCls}
            />
          </Field>
          <Field label="Valores (párrafo 2)">
            <textarea
              value={form.values}
              onChange={(e) => set("values", e.target.value)}
              rows={3}
              placeholder="Los valores que representan..."
              className={inputCls}
            />
          </Field>
          <Field label="Misión (párrafo 3, en bold en el sitio)">
            <textarea
              value={form.mission}
              onChange={(e) => set("mission", e.target.value)}
              rows={2}
              placeholder="La declaración central del brand."
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* ── ASSETS DEL PARTNER ────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2">Assets del partner</h2>
        {!partnerId && (
          <p className="text-yellow-500 text-xs mb-4">
            Ingresá el slug antes de subir assets — define la carpeta de destino.
          </p>
        )}
        <div className="grid grid-cols-3 gap-4">
          <AssetUploader
            label="Logo"
            hint="Ej: halcón negro sobre fondo transparente"
            partnerId={partnerId}
            assetType="root"
            suggestedFilename="logo.png"
            currentUrl={form.logo || undefined}
            onUploaded={(url) => set("logo", url)}
          />
          <AssetUploader
            label="Banner / Watermark"
            hint="Imagen de fondo en la página del partner"
            partnerId={partnerId}
            assetType="root"
            suggestedFilename="banner.png"
            currentUrl={form.banner || undefined}
            onUploaded={(url) => set("banner", url)}
          />
          <AssetUploader
            label="Card Image"
            hint="Imagen en la card de /merch (opcional, sino usa logo)"
            partnerId={partnerId}
            assetType="root"
            suggestedFilename="card.png"
            currentUrl={form.cardImage || undefined}
            onUploaded={(url) => set("cardImage", url)}
          />
        </div>

        {/* Manual path overrides */}
        <div className="grid grid-cols-3 gap-4 mt-3">
          {(["logo", "banner", "cardImage"] as const).map((field) => (
            <div key={field}>
              <label className="text-xs text-zinc-600">Path manual ({field})</label>
              <input
                type="text"
                value={(form[field] as string) ?? ""}
                onChange={(e) => set(field, e.target.value)}
                placeholder={`/partners/${partnerId || "slug"}/${field === "cardImage" ? "card" : field}.png`}
                className={`${inputCls} text-xs mt-1`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCTOS ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2">
          Productos
          <span className="ml-2 text-sm font-normal text-zinc-500">
            ({form.products.length} producto{form.products.length !== 1 ? "s" : ""})
          </span>
        </h2>
        <ProductEditor
          partnerId={partnerId}
          products={form.products}
          onChange={(products) => set("products", products)}
        />
      </section>

      {/* ── SUBMIT ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
        <button
          type="submit"
          disabled={saving || success}
          className="bg-white text-black font-semibold px-6 py-3 rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-all text-sm"
        >
          {saving ? "Guardando..." : success ? "✓ Guardado" : mode === "create" ? "Crear partner" : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/partners")}
          className="text-zinc-500 hover:text-white text-sm transition-colors"
        >
          Cancelar
        </button>
        {error && (
          <p className="text-red-400 text-sm ml-auto">{error}</p>
        )}
      </div>
    </form>
  )
}

// ─── helpers ────────────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"

function Field({
  label,
  hint,
  required,
  children,
  disabled,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <div className={disabled ? "opacity-50" : ""}>
      {label && (
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      {hint && <p className="text-xs text-zinc-600 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}
