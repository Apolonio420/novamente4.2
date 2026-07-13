"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Partner } from "@/src/data/partners"

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/admin/partners")
    const data = await res.json()
    setPartners(data.partners ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm(`¿Eliminar partner "${id}"? Esta acción no se puede deshacer.`)) return
    setDeletingId(id)
    await fetch(`/api/admin/partners/${id}`, { method: "DELETE" })
    await load()
    setDeletingId(null)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Partners</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Gestión interna de partners — local only
            </p>
          </div>
          <Link
            href="/admin/partners/new"
            className="bg-white text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-zinc-200 transition-colors text-sm"
          >
            + Nuevo partner
          </Link>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-zinc-500 text-sm py-20 text-center">Cargando...</div>
        ) : partners.length === 0 ? (
          <div className="text-zinc-500 text-sm py-20 text-center">
            No hay partners. <Link href="/admin/partners/new" className="underline text-white">Crear el primero</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {partners.map((p) => (
              <div
                key={p.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-5"
              >
                {/* Logo preview */}
                <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {p.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.logo} alt={p.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-zinc-600 text-xs">No logo</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{p.name}</span>
                    {p.featured && (
                      <span className="bg-yellow-400 text-black text-xs font-semibold px-2 py-0.5 rounded-full">
                        Destacado
                      </span>
                    )}
                  </div>
                  <div className="text-zinc-400 text-xs mt-0.5 font-mono">{p.id}</div>
                  <div className="text-zinc-500 text-sm mt-1 truncate">{p.slogan}</div>
                  <div className="text-zinc-600 text-xs mt-1">
                    {p.products.length} producto{p.products.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link
                    href={`/p/${p.id}`}
                    target="_blank"
                    className="text-zinc-500 hover:text-white text-sm transition-colors"
                    title="Ver en el sitio"
                  >
                    Ver →
                  </Link>
                  <Link
                    href={`/admin/partners/${p.id}`}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    className="text-red-500 hover:text-red-400 text-sm transition-colors disabled:opacity-50"
                  >
                    {deletingId === p.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-10 pt-6 border-t border-zinc-800 text-zinc-600 text-xs">
          <Link href="/merch" className="hover:text-zinc-400 transition-colors">← Ver /merch público</Link>
        </div>
      </div>
    </div>
  )
}
