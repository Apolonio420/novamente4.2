"use client"

import { useState } from "react"
import AssetUploader from "./AssetUploader"
import type { Product, ProductColor } from "@/src/data/partners"

interface Props {
  partnerId: string
  products: Product[]
  onChange: (products: Product[]) => void
}

const emptyProduct = (): Product => ({
  id: "",
  name: "",
  price: 0,
  priceLabel: "",
  colors: [],
  sizes: ["S", "M", "L", "XL"],
  category: "",
  lifestyleImages: [],
  description: "",
  detailedDescription: "",
  features: [],
  sizing: {},
  brand: "",
  brandValues: "",
  featured: false,
  cardDescription: "",
})

const emptyColor = (): ProductColor => ({
  name: "",
  value: "",
  hex: "#000000",
  images: { front: "", back: "" },
})

const inputCls =
  "w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"

export default function ProductEditor({ partnerId, products, onChange }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  function addProduct() {
    const updated = [...products, emptyProduct()]
    onChange(updated)
    setExpandedIdx(updated.length - 1)
  }

  function removeProduct(idx: number) {
    if (!confirm("¿Eliminar este producto?")) return
    onChange(products.filter((_, i) => i !== idx))
    setExpandedIdx(null)
  }

  function updateProduct(idx: number, patch: Partial<Product>) {
    const updated = [...products]
    updated[idx] = { ...updated[idx], ...patch }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {products.map((product, idx) => (
        <ProductCard
          key={idx}
          idx={idx}
          product={product}
          partnerId={partnerId}
          expanded={expandedIdx === idx}
          onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
          onUpdate={(patch) => updateProduct(idx, patch)}
          onRemove={() => removeProduct(idx)}
        />
      ))}

      <button
        type="button"
        onClick={addProduct}
        className="w-full border-2 border-dashed border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-zinc-300 rounded-xl py-4 text-sm transition-colors"
      >
        + Agregar producto
      </button>
    </div>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  idx,
  product,
  partnerId,
  expanded,
  onToggle,
  onUpdate,
  onRemove,
}: {
  idx: number
  product: Product
  partnerId: string
  expanded: boolean
  onToggle: () => void
  onUpdate: (patch: Partial<Product>) => void
  onRemove: () => void
}) {
  function set<K extends keyof Product>(key: K, value: Product[K]) {
    onUpdate({ [key]: value } as Partial<Product>)
  }

  // Auto-format priceLabel from price — single patch to avoid state overwrite
  function handlePriceChange(val: string) {
    const digits = val.replace(/\D/g, "")
    const num = digits === "" ? 0 : parseInt(digits, 10)
    onUpdate({
      price: num,
      priceLabel: num > 0 ? `$${num.toLocaleString("es-AR")}` : "",
    })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={onToggle}
      >
        <span className="text-zinc-600 font-mono text-xs w-5 text-center">{idx + 1}</span>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm">
            {product.name || <span className="text-zinc-600 italic">Sin nombre</span>}
          </span>
          <span className="text-zinc-500 text-xs ml-2 font-mono">{product.id}</span>
          {product.priceLabel && (
            <span className="text-zinc-400 text-xs ml-2">{product.priceLabel}</span>
          )}
          {product.colors.length > 0 && (
            <span className="ml-2 flex gap-1 inline-flex items-center">
              {product.colors.map((c) => (
                <span
                  key={c.value}
                  className="w-3 h-3 rounded-full border border-zinc-600 inline-block"
                  style={{ background: c.hex }}
                  title={c.name}
                />
              ))}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="text-red-600 hover:text-red-400 text-xs mr-2 transition-colors"
        >
          Eliminar
        </button>
        <span className="text-zinc-500 text-sm">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="p-5 border-t border-zinc-800 space-y-6">
          {/* Basic info */}
          {/* Required fields notice */}
          <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-2.5 text-xs text-zinc-400">
            <span className="text-red-400 font-semibold">*</span> Campos obligatorios: <strong className="text-zinc-300">ID</strong> y <strong className="text-zinc-300">Nombre visible</strong>. El resto es opcional pero recomendado.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">
                ID del producto <span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-zinc-600 mb-1">Solo letras minúsculas y guiones. Ej: <span className="font-mono">hoodie-negro</span></p>
              <input
                value={product.id}
                onChange={(e) => set("id", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="hoodie-tres-anclas"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">
                Nombre visible <span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-zinc-600 mb-1">Nombre que se muestra en la tienda</p>
              <input
                value={product.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder='Hoodie "Tres Anclas" Oversized'
                className={inputCls}
              />
            </div>

            {/* Price — single editable field, label auto-generated */}
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Precio (ARS) — opcional</label>
              <p className="text-xs text-zinc-600 mb-1">Escribí solo el número. Ej: <span className="font-mono">65000</span></p>
              <input
                type="text"
                inputMode="numeric"
                value={product.price === 0 ? "" : String(product.price)}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="65000"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Label precio — se genera solo</label>
              <p className="text-xs text-zinc-600 mb-1">Se completa automático al escribir el precio</p>
              <input
                value={product.priceLabel}
                onChange={(e) => set("priceLabel", e.target.value)}
                placeholder="$65.000"
                className={inputCls}
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Categoría — opcional</label>
              <p className="text-xs text-zinc-600 mb-1">Ej: Hoodies, Remeras, Accesorios</p>
              <input
                value={product.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Hoodies"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Brand display — opcional</label>
              <p className="text-xs text-zinc-600 mb-1">Nombre del brand tal como aparece en la página del producto</p>
              <input
                value={product.brand}
                onChange={(e) => set("brand", e.target.value)}
                placeholder="FALCO"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Brand values / slogan del producto</label>
            <input
              value={product.brandValues}
              onChange={(e) => set("brandValues", e.target.value)}
              placeholder="Libertad. Identidad. Argentina que avanza."
              className={inputCls}
            />
          </div>

          {/* Tallas */}
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Tallas disponibles — opcional</label>
            <p className="text-xs text-zinc-600 mb-1">Separadas por coma. Vienen cargadas por defecto: S, M, L, XL. Podés editar o dejar vacío si no aplica (ej: gorras).</p>
            <input
              value={product.sizes.join(", ")}
              onChange={(e) =>
                set("sizes", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
              }
              placeholder="S, M, L, XL"
              className={inputCls}
            />
          </div>

          {/* Descripciones */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Descripción corta (card)</label>
              <textarea
                value={product.cardDescription}
                onChange={(e) => set("cardDescription", e.target.value)}
                rows={2}
                placeholder="Una línea para la grilla de productos."
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Descripción</label>
              <textarea
                value={product.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Descripción detallada</label>
              <textarea
                value={product.detailedDescription}
                onChange={(e) => set("detailedDescription", e.target.value)}
                rows={3}
                className={inputCls}
              />
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">
              Features / Características (una por línea)
            </label>
            <textarea
              value={product.features.join("\n")}
              onChange={(e) =>
                set("features", e.target.value.split("\n").filter(Boolean))
              }
              rows={4}
              placeholder={"Algodón 100% premium de 320gsm\nCorte oversized unisex\n..."}
              className={inputCls}
            />
          </div>

          {/* Sizing */}
          <SizingEditor
            sizing={product.sizing}
            sizes={product.sizes}
            onChange={(sizing) => set("sizing", sizing)}
          />

          {/* Colors */}
          <ColorEditor
            partnerId={partnerId}
            productId={product.id}
            colors={product.colors}
            onChange={(colors) => set("colors", colors)}
          />

          {/* Lifestyle images */}
          <LifestyleEditor
            partnerId={partnerId}
            productId={product.id}
            images={product.lifestyleImages}
            closeUp={product.closeUp}
            onImagesChange={(imgs) => set("lifestyleImages", imgs)}
            onCloseUpChange={(url) => set("closeUp", url)}
          />
        </div>
      )}
    </div>
  )
}

// ─── Sizing Editor ────────────────────────────────────────────────────────────

function SizingEditor({
  sizing,
  sizes,
  onChange,
}: {
  sizing: Record<string, string>
  sizes: string[]
  onChange: (s: Record<string, string>) => void
}) {
  return (
    <div>
      <label className="text-xs text-zinc-400 mb-1 block">
        Tabla de medidas — opcional
      </label>
      <p className="text-xs text-zinc-600 mb-2">
        Una línea por talla. Formato libre. Ej: <span className="font-mono">Largo: 73cm | Ancho: 68cm | Manga: 55cm</span>.
        Si no tenés las medidas, dejá vacío — se puede completar después.
        Las tallas aparecen según lo que pusiste arriba en "Tallas disponibles".
      </p>
      {sizes.length === 0 ? (
        <p className="text-zinc-600 text-xs italic">Agregá tallas arriba para ver los campos de medidas.</p>
      ) : (
        <div className="space-y-2">
          {sizes.map((size) => (
            <div key={size} className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-mono w-8 text-right flex-shrink-0">{size}</span>
              <input
                value={sizing[size] ?? ""}
                onChange={(e) => onChange({ ...sizing, [size]: e.target.value })}
                placeholder="Largo: 73cm | Ancho: 68cm | Manga: 55cm"
                className={inputCls}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Color Editor ─────────────────────────────────────────────────────────────

function ColorEditor({
  partnerId,
  productId,
  colors,
  onChange,
}: {
  partnerId: string
  productId: string
  colors: ProductColor[]
  onChange: (c: ProductColor[]) => void
}) {
  function add() {
    onChange([...colors, emptyColor()])
  }

  function remove(idx: number) {
    onChange(colors.filter((_, i) => i !== idx))
  }

  function update(idx: number, patch: Partial<ProductColor>) {
    const updated = [...colors]
    updated[idx] = { ...updated[idx], ...patch }
    // auto-generate value from name
    if (patch.name && !patch.value) {
      updated[idx].value = patch.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")
    }
    onChange(updated)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-zinc-400">Variantes de color</label>
        <button
          type="button"
          onClick={add}
          className="text-xs text-zinc-400 hover:text-white transition-colors"
        >
          + Agregar color
        </button>
      </div>

      <div className="space-y-4">
        {colors.map((color, idx) => {
          const frontFilename = productId
            ? `${productId}-${color.value || "color"}-front.png`
            : "front.png"
          const backFilename = productId
            ? `${productId}-${color.value || "color"}-back.png`
            : "back.png"

          return (
            <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color.hex}
                  onChange={(e) => update(idx, { hex: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <input
                  value={color.name}
                  onChange={(e) => update(idx, { name: e.target.value })}
                  placeholder="Negro"
                  className={`${inputCls} flex-1`}
                />
                <input
                  value={color.value}
                  onChange={(e) => update(idx, { value: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  placeholder="negro"
                  className={`${inputCls} w-32 font-mono text-xs`}
                />
                <span
                  className="w-5 h-5 rounded-full border border-zinc-600 flex-shrink-0"
                  style={{ background: color.hex }}
                />
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-red-600 hover:text-red-400 text-xs transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Front & Back assets */}
              <div className="grid grid-cols-2 gap-3">
                <AssetUploader
                  label="Mockup Frente"
                  partnerId={partnerId}
                  assetType="products"
                  suggestedFilename={frontFilename}
                  currentUrl={color.images.front || undefined}
                  onUploaded={(url) => update(idx, { images: { ...color.images, front: url } })}
                />
                <AssetUploader
                  label="Mockup Dorso"
                  partnerId={partnerId}
                  assetType="products"
                  suggestedFilename={backFilename}
                  currentUrl={color.images.back || undefined}
                  onUploaded={(url) => update(idx, { images: { ...color.images, back: url } })}
                />
              </div>

              {/* Manual path override */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-600">Path frente (manual)</label>
                  <input
                    value={color.images.front}
                    onChange={(e) => update(idx, { images: { ...color.images, front: e.target.value } })}
                    placeholder={`/partners/${partnerId}/products/${frontFilename}`}
                    className={`${inputCls} text-xs mt-1`}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-600">Path dorso (manual)</label>
                  <input
                    value={color.images.back}
                    onChange={(e) => update(idx, { images: { ...color.images, back: e.target.value } })}
                    placeholder={`/partners/${partnerId}/products/${backFilename}`}
                    className={`${inputCls} text-xs mt-1`}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Lifestyle / Close-up ─────────────────────────────────────────────────────

function LifestyleEditor({
  partnerId,
  productId,
  images,
  closeUp,
  onImagesChange,
  onCloseUpChange,
}: {
  partnerId: string
  productId: string
  images: string[]
  closeUp?: string
  onImagesChange: (imgs: string[]) => void
  onCloseUpChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)

  async function uploadLifestyle(file: File, index: number) {
    if (!partnerId) return
    setUploading(true)
    const filename = productId
      ? `${productId}-lifestyle-${index + 1}${file.name.substring(file.name.lastIndexOf("."))}`
      : file.name
    const fd = new FormData()
    fd.append("file", file)
    fd.append("partnerId", partnerId)
    fd.append("assetType", "products")
    fd.append("filename", filename)
    const res = await fetch("/api/admin/assets", { method: "POST", body: fd })
    const data = await res.json()
    setUploading(false)
    if (data.url) {
      const updated = [...images]
      updated[index] = data.url
      onImagesChange(updated)
    }
  }

  return (
    <div className="space-y-3">
      {/* Lifestyle images */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-zinc-400">Imágenes lifestyle</label>
          <button
            type="button"
            onClick={() => onImagesChange([...images, ""])}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            + Agregar
          </button>
        </div>
        <div className="space-y-2">
          {images.map((img, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-zinc-600 text-xs w-4">{idx + 1}</span>
              {/* Upload button */}
              <label className="flex-shrink-0 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 px-3 py-1.5 rounded cursor-pointer transition-colors">
                {uploading ? "..." : "Subir"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) uploadLifestyle(f, idx)
                  }}
                />
              </label>
              <input
                value={img}
                onChange={(e) => {
                  const updated = [...images]
                  updated[idx] = e.target.value
                  onImagesChange(updated)
                }}
                placeholder={`/partners/${partnerId}/products/${productId}-lifestyle-${idx + 1}.jpeg`}
                className={`${inputCls} flex-1 text-xs font-mono`}
              />
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" className="w-8 h-8 object-cover rounded" onError={() => {}} />
              )}
              <button
                type="button"
                onClick={() => onImagesChange(images.filter((_, i) => i !== idx))}
                className="text-red-600 hover:text-red-400 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Close-up */}
      <AssetUploader
        label="Close-up (opcional)"
        hint="Foto detalle del estampado / bordado"
        partnerId={partnerId}
        assetType="products"
        suggestedFilename={productId ? `${productId}-closeup.png` : "closeup.png"}
        currentUrl={closeUp}
        onUploaded={onCloseUpChange}
      />

      {/* Medidas image */}
      <AssetUploader
        label="Imagen de medidas (opcional)"
        hint="Guía de talles visual — se incluye en lifestyleImages"
        partnerId={partnerId}
        assetType="products"
        suggestedFilename={productId ? `${productId}-medidas.png` : "medidas.png"}
        currentUrl={images.find((i) => i.includes("medidas"))}
        onUploaded={(url) => {
          const filtered = images.filter((i) => !i.includes("medidas"))
          onImagesChange([...filtered, url])
        }}
      />
    </div>
  )
}
