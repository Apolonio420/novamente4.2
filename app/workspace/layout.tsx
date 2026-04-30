'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Palette,
  Package,
  Users,
  ShoppingBag,
  Sparkles,
  MessageSquare,
  Settings,
  Menu,
  X,
  User,
  ExternalLink,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  LifeBuoy,
  Globe,
  Megaphone,
  Rss,
  Phone,
  CreditCard,
  Lock,
  ChevronsUpDown,
  Check,
  Shield,
  Video,
} from 'lucide-react'
import { AssistantProvider } from '@/lib/assistant/assistant-context'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/partners/auth-fetch'
import { supabase } from '@/lib/supabase'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  requiredPlan?: 'growth' | 'pro'
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Tu Marca',
    items: [
      { label: 'Dashboard', href: '/workspace', icon: LayoutDashboard },
      { label: 'Branding', href: '/workspace/branding', icon: Palette },
      { label: 'Catalogo', href: '/workspace/catalog', icon: Package },
      { label: 'Studio', href: '/workspace/design-engine', icon: Sparkles },
    ],
  },
  {
    title: 'Ventas',
    items: [
      { label: 'Leads', href: '/workspace/leads', icon: Users },
      { label: 'Pedidos', href: '/workspace/orders', icon: ShoppingBag },
      { label: 'Analytics', href: '/workspace/analytics', icon: BarChart3, requiredPlan: 'growth' },
    ],
  },
  {
    title: 'Comunicacion',
    items: [
      { label: 'Chatbot', href: '/workspace/chatbot', icon: MessageSquare, requiredPlan: 'growth' },
      { label: 'Soporte', href: '/workspace/support', icon: LifeBuoy, requiredPlan: 'growth' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Meta Business', href: '/workspace/meta-business', icon: Globe, requiredPlan: 'pro' },
      { label: 'Meta Ads', href: '/workspace/meta-ads', icon: Megaphone, requiredPlan: 'pro' },
      { label: 'Feeds', href: '/workspace/feeds', icon: Rss, requiredPlan: 'pro' },
      { label: 'TikTok', href: '/workspace/integrations/tiktok', icon: Video },
    ],
  },
  {
    title: 'Cuenta',
    items: [
      { label: 'Billing', href: '/workspace/billing', icon: CreditCard },
      { label: 'Configuracion', href: '/workspace/settings', icon: Settings },
      { label: 'Onboarding Call', href: '/workspace/onboarding-call', icon: Phone, requiredPlan: 'pro' },
    ],
  },
]

// Flat list for page titles
const allNavItems = navSections.flatMap((s) => s.items)

const pageTitles: Record<string, string> = {
  '/workspace': 'Dashboard',
  '/workspace/analytics': 'Analytics',
  '/workspace/branding': 'Branding',
  '/workspace/catalog': 'Catalogo',
  '/workspace/leads': 'Leads',
  '/workspace/orders': 'Pedidos',
  '/workspace/design-engine': 'Design Engine',
  '/workspace/chatbot': 'Chatbot',
  '/workspace/support': 'Soporte',
  '/workspace/meta-business': 'Meta Business',
  '/workspace/meta-ads': 'Meta Ads',
  '/workspace/feeds': 'Feeds',
  '/workspace/onboarding-call': 'Onboarding Call',
  '/workspace/billing': 'Billing',
  '/workspace/settings': 'Configuracion',
  '/workspace/integrations/tiktok': 'TikTok',
}

interface TenantInfo {
  id?: string
  name: string
  slug: string
  logo_url: string | null
  email: string
  plan: string
  status?: string
}

interface TenantOption {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: string
  status: string
  email: string
}

const planColors: Record<string, string> = {
  starter: 'bg-zinc-700 text-zinc-300',
  growth: 'bg-violet-600/20 text-violet-400',
  pro: 'bg-amber-500/20 text-amber-400',
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [allTenants, setAllTenants] = useState<TenantOption[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showTenantPicker, setShowTenantPicker] = useState(false)
  const [tenantSearch, setTenantSearch] = useState('')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    async function fetchTenant() {
      try {
        const res = await authFetch('/api/partners/me')
        if (res.ok) {
          const json = await res.json()
          setTenant(json.tenant)
        }
      } catch {
        // Silently fail
      }
    }
    fetchTenant()
  }, [])

  // Fetch all tenants for admin switcher
  useEffect(() => {
    async function fetchAdminTenants() {
      try {
        const res = await authFetch('/api/partners/tenants')
        if (res.ok) {
          const json = await res.json()
          if (json.tenants?.length > 0) {
            setAllTenants(json.tenants)
            setIsAdmin(true)
          }
        }
      } catch {}
    }
    fetchAdminTenants()
  }, [])

  const switchTenant = (tenantOption: TenantOption) => {
    localStorage.setItem('admin_tenant_id', tenantOption.id)
    setTenant({
      id: tenantOption.id,
      name: tenantOption.name,
      slug: tenantOption.slug,
      logo_url: tenantOption.logo_url,
      email: tenantOption.email,
      plan: tenantOption.plan,
      status: tenantOption.status,
    })
    setShowTenantPicker(false)
    setTenantSearch('')
    // Reload current page to refetch data with new tenant
    window.location.reload()
  }

  const clearTenantOverride = () => {
    localStorage.removeItem('admin_tenant_id')
    setShowTenantPicker(false)
    setTenantSearch('')
    window.location.reload()
  }

  const filteredTenants = tenantSearch
    ? allTenants.filter(t =>
        t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
        t.slug.toLowerCase().includes(tenantSearch.toLowerCase()) ||
        t.email.toLowerCase().includes(tenantSearch.toLowerCase())
      )
    : allTenants

  // Close menus on outside click
  useEffect(() => {
    if (!showUserMenu && !showTenantPicker) return
    const close = () => {
      setShowUserMenu(false)
      setShowTenantPicker(false)
      setTenantSearch('')
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showUserMenu, showTenantPicker])

  const isActive = (href: string) => {
    if (href === '/workspace') return pathname === '/workspace'
    return pathname.startsWith(href)
  }

  const displayName = tenant?.name ?? 'Mi Workspace'
  const displayInitial = displayName.charAt(0).toUpperCase()
  const displayEmail = tenant?.email ?? ''
  const currentPage = pageTitles[pathname] || 'Workspace'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const sidebar = (
    <nav className="flex flex-col h-full">
      {/* Tenant header */}
      <div className="relative border-b border-zinc-800">
        <button
          onClick={isAdmin ? (e) => { e.stopPropagation(); setShowTenantPicker(!showTenantPicker) } : undefined}
          className={cn(
            'flex items-center gap-3 w-full transition-all',
            sidebarCollapsed ? 'px-3 py-4 justify-center' : 'px-5 py-5',
            isAdmin && 'hover:bg-zinc-800/60 cursor-pointer'
          )}
        >
          {tenant?.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={displayName}
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {displayInitial}
            </div>
          )}
          {!sidebarCollapsed && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <span className="text-sm font-semibold text-zinc-100 truncate block">
                  {displayName}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {tenant?.plan && (
                    <span className={cn(
                      'inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                      planColors[tenant.plan] || planColors.starter
                    )}>
                      {tenant.plan}
                    </span>
                  )}
                  {isAdmin && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                      <Shield className="w-2.5 h-2.5" />
                      Admin
                    </span>
                  )}
                </div>
              </div>
              {isAdmin && <ChevronsUpDown className="w-4 h-4 text-zinc-500 shrink-0" />}
            </>
          )}
        </button>

        {/* Tenant picker dropdown */}
        {showTenantPicker && isAdmin && (
          <div className="absolute left-0 top-full z-50 w-72 max-h-96 rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
            <div className="p-2 border-b border-zinc-800">
              <input
                type="text"
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
                placeholder="Buscar partner..."
                autoFocus
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div className="overflow-y-auto max-h-72">
              {/* Clear override option */}
              {localStorage.getItem('admin_tenant_id') && (
                <button
                  onClick={clearTenantOverride}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800"
                >
                  <div className="w-7 h-7 rounded-md bg-zinc-700 flex items-center justify-center shrink-0">
                    <X className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-300">Volver a mi cuenta</p>
                    <p className="text-[11px] text-zinc-500">Quitar override</p>
                  </div>
                </button>
              )}
              {filteredTenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => switchTenant(t)}
                  className={cn(
                    'flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-zinc-800 transition-colors',
                    tenant?.id === t.id && 'bg-violet-600/10'
                  )}
                >
                  {t.logo_url ? (
                    <img src={t.logo_url} alt={t.name} className="w-7 h-7 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-md bg-zinc-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-200 truncate">{t.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        'rounded-full px-1.5 py-0 text-[10px] font-medium uppercase',
                        planColors[t.plan] || planColors.starter
                      )}>
                        {t.plan}
                      </span>
                      <span className={cn(
                        'text-[10px]',
                        t.status === 'active' ? 'text-emerald-400' : 'text-zinc-500'
                      )}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                  {tenant?.id === t.id && <Check className="w-4 h-4 text-violet-400 shrink-0" />}
                </button>
              ))}
              {filteredTenants.length === 0 && (
                <p className="px-3 py-4 text-sm text-zinc-500 text-center">Sin resultados</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Nav links grouped by section */}
      <div className="flex-1 py-2 px-3 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="mb-1">
            {!sidebarCollapsed && (
              <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                {section.title}
              </p>
            )}
            {sidebarCollapsed && <div className="h-3" />}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                const planOrder = { starter: 0, growth: 1, pro: 2 }
                const tenantPlanLevel = planOrder[(tenant?.plan as keyof typeof planOrder) || 'starter'] ?? 0
                const requiredLevel = item.requiredPlan ? planOrder[item.requiredPlan] : 0
                const isLocked = requiredLevel > tenantPlanLevel
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg text-sm font-medium transition-all',
                      sidebarCollapsed ? 'px-2.5 py-2 justify-center' : 'px-3 py-2',
                      active
                        ? 'bg-violet-600/20 text-violet-400'
                        : isLocked
                          ? 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/40'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                    )}
                  >
                    <Icon className={cn('w-[18px] h-[18px] shrink-0', isLocked && !active && 'opacity-50')} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {isLocked && <Lock className="w-3 h-3 text-zinc-600 shrink-0" />}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Storefront link */}
      {tenant?.slug && !sidebarCollapsed && (
        <div className="px-3 pb-2">
          <Link
            href={`/merch/${tenant.slug}`}
            target="_blank"
            className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver mi storefront
          </Link>
        </div>
      )}

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:block border-t border-zinc-800">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center justify-center py-3 text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Bottom user section */}
      <div className={cn(
        'border-t border-zinc-800 px-4 py-4',
        sidebarCollapsed && 'px-2'
      )}>
        <div className={cn(
          'flex items-center',
          sidebarCollapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-zinc-300" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-200 truncate">
                {displayEmail.split('@')[0] || displayName}
              </p>
              {displayEmail && (
                <p className="text-xs text-zinc-500 truncate">{displayEmail}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )

  return (
    <AssistantProvider>
    <div className="flex h-dvh bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex lg:flex-col shrink-0 border-r border-zinc-800 bg-zinc-950 transition-all duration-300',
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      )}>
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[260px] border-r border-zinc-800 bg-zinc-950 transition-transform duration-300 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-md text-zinc-400 hover:text-zinc-100"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebar}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-4 px-4 lg:px-6 h-14 border-b border-zinc-800 bg-zinc-950 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb-style title */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Link href="/workspace" className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0">
              {displayName}
            </Link>
            {pathname !== '/workspace' && (
              <>
                <span className="text-zinc-700">/</span>
                <span className="font-medium text-zinc-100 truncate">{currentPage}</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* User avatar with menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowUserMenu(!showUserMenu)
                }}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-800"
              >
                {tenant?.logo_url ? (
                  <img
                    src={tenant.logo_url}
                    alt={displayName}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-zinc-300" />
                  </div>
                )}
                <span className="hidden sm:block text-xs text-zinc-400">
                  {displayEmail.split('@')[0]}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <p className="text-sm font-medium text-zinc-200 truncate">{displayName}</p>
                    <p className="text-xs text-zinc-500 truncate">{displayEmail}</p>
                  </div>
                  <Link
                    href="/workspace/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Configuracion
                  </Link>
                  {tenant?.slug && (
                    <Link
                      href={`/merch/${tenant.slug}`}
                      target="_blank"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver storefront
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

    </div>
    </AssistantProvider>
  )
}
