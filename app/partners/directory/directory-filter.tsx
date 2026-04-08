'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface TenantCard {
  slug: string
  name: string
  tagline: string | null
  industry: string | null
  logo_url: string | null
  primary_color: string
}

interface DirectoryFilterProps {
  tenants: TenantCard[]
  industries: string[]
}

export default function DirectoryFilter({ tenants, industries }: DirectoryFilterProps) {
  const [search, setSearch] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let result = tenants

    if (selectedIndustry) {
      result = result.filter((t) => t.industry === selectedIndustry)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.tagline?.toLowerCase().includes(q) ||
          t.industry?.toLowerCase().includes(q)
      )
    }

    return result
  }, [tenants, search, selectedIndustry])

  return (
    <>
      {/* Search & filters */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Input
          placeholder="Buscar marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedIndustry(null)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              !selectedIndustry
                ? 'bg-white text-black'
                : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
            }`}
          >
            Todas
          </button>
          {industries.map((ind) => (
            <button
              key={ind}
              onClick={() =>
                setSelectedIndustry(selectedIndustry === ind ? null : ind)
              }
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                selectedIndustry === ind
                  ? 'bg-white text-black'
                  : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-zinc-500">
          No se encontraron marcas con esos filtros.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tenant) => (
            <Link
              key={tenant.slug}
              href={`/p/${tenant.slug}`}
              className="group flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              {/* Logo */}
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-800">
                {tenant.logo_url && !failedLogos.has(tenant.slug) ? (
                  <Image
                    src={tenant.logo_url}
                    alt={`${tenant.name} logo`}
                    fill
                    sizes="80px"
                    className="object-contain p-2"
                    onError={() => setFailedLogos((prev) => new Set(prev).add(tenant.slug))}
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-2xl font-bold text-white"
                    style={{ backgroundColor: tenant.primary_color }}
                  >
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <h3 className="text-lg font-semibold text-white group-hover:text-zinc-100">
                {tenant.name}
              </h3>

              {/* Tagline */}
              {tenant.tagline && (
                <p className="text-sm text-zinc-400 line-clamp-2">
                  {tenant.tagline}
                </p>
              )}

              {/* Industry badge */}
              {tenant.industry && (
                <Badge
                  variant="outline"
                  className="border-zinc-700 text-zinc-400"
                >
                  {tenant.industry}
                </Badge>
              )}

              <span className="mt-auto inline-flex items-center text-sm font-medium text-purple-400 transition group-hover:underline">
                Ver storefront &rarr;
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
