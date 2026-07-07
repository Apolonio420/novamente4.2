'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Search, Sparkles, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MerchEntry {
  slug: string
  name: string
  slogan: string | null
  description: string | null
  logo: string | null
  cardImage: string | null
  featured: boolean
  productCount: number
  category: string | null
}

interface MerchFilterProps {
  entries: MerchEntry[]
  categories: string[]
}

export default function MerchFilter({ entries, categories }: MerchFilterProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let result = entries

    if (selectedCategory) {
      result = result.filter((e) => e.category === selectedCategory)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.slogan?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q)
      )
    }

    return result
  }, [entries, search, selectedCategory])

  return (
    <>
      {/* Search & Category Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-zinc-700 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-all',
              !selectedCategory
                ? 'bg-white text-black shadow-md'
                : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
            )}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-all',
                selectedCategory === cat
                  ? 'bg-white text-black shadow-md'
                  : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="mb-6 text-sm text-zinc-500">
        {filtered.length} {filtered.length === 1 ? 'marca' : 'marcas'}
        {selectedCategory ? ` en ${selectedCategory}` : ''}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-zinc-400 text-lg mb-2">No se encontraron marcas</p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory(null) }}
            className="text-purple-400 hover:underline text-sm"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((brand) => (
            <Link
              key={brand.slug}
              href={`/p/${brand.slug}`}
              className="group relative"
            >
              <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition-all duration-300 hover:border-zinc-600 hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1">
                {/* Card Image */}
                <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800">
                  {(brand.cardImage || brand.logo) && !failedImages.has(brand.slug) ? (
                    <>
                      {/* Radial glow behind logo — works for both dark and light logos */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[70%] h-[70%] rounded-full bg-gradient-to-br from-purple-500/10 via-white/5 to-pink-500/10 blur-2xl" />
                      </div>
                      <Image
                        src={brand.cardImage || brand.logo || ''}
                        alt={`${brand.name}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain p-8 transition-transform duration-500 group-hover:scale-110 [filter:drop-shadow(0_0_12px_rgba(168,85,247,0.15))_drop-shadow(0_0_4px_rgba(255,255,255,0.08))]"
                        onError={() => setFailedImages((prev) => new Set(prev).add(brand.slug))}
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-pink-900/40">
                      <span className="text-7xl font-black text-white/20">
                        {brand.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Featured badge */}
                  {brand.featured && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-yellow-500/90 text-black border-0 gap-1 font-semibold text-xs">
                        <Star className="h-3 w-3 fill-current" />
                        Destacado
                      </Badge>
                    </div>
                  )}

                  {/* Category badge */}
                  {brand.category && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="outline" className="border-white/20 bg-black/40 text-white/80 backdrop-blur-sm text-xs">
                        {brand.category}
                      </Badge>
                    </div>
                  )}

                  {/* Brand name overlay on image */}
                  <div className="absolute bottom-0 inset-x-0 p-5">
                    <h2 className="text-2xl font-bold text-white tracking-wide drop-shadow-lg">
                      {brand.name}
                    </h2>
                    {brand.slogan && (
                      <p className="text-sm text-white/70 mt-1 line-clamp-1">{brand.slogan}</p>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {brand.productCount > 0 && (
                      <span className="text-xs text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full">
                        {brand.productCount} productos
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
                    Ver tienda
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
