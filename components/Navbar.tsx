// @ts-nocheck
"use client"

import Link from "next/link"
import { CartBadge } from "./CartBadge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { AuthModal } from "@/components/AuthModal"
import { useEffect } from "react"
import { getClientSupabase } from "@/lib/auth-client"
import { User, LogOut, Menu } from "lucide-react"
import { Logo } from "./Logo"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { scrollToGenerator } from "@/lib/scrollToGenerator"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

export function Navbar() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin")
  const [user, setUser] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const supabase = getClientSupabase()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) return
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    checkUser()

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null)
      })

      return () => {
        authListener.subscription.unsubscribe()
      }
    }
  }, [supabase])

  const handleSignOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    // Clear auth cookie server-side
    await fetch('/api/auth/set-session', { method: 'DELETE' }).catch(() => {})
    window.location.reload()
  }

  const closeSheet = () => setIsSheetOpen(false)

  const navItems = [
    {
      label: "COMPRÁ",
      href: "/products",
      isDropdown: true,
      subItems: [
        { label: "CATÁLOGO COMPLETO", href: "/products" },
        { label: "REMERAS PERSONALIZADAS", href: "/remeras-personalizadas" },
        { label: "HOODIES", href: "/hoodie-personalizado" },
        { label: "BUZOS", href: "/buzos-personalizados" },
        { label: "REMERAS CUMPLEAÑOS", href: "/remeras-cumpleanos" },
        { label: "BUZOS EGRESADOS", href: "/buzos-egresados" },
        { label: "DESPEDIDAS", href: "/despedidas-personalizadas" },
        { label: "REGALOS PERSONALIZADOS", href: "/regalos-personalizados" },
        { label: "REGALOS EMPRESARIALES", href: "/regalos-empresariales" },
        { label: "COMPRA POR MAYOR", href: "/remeras-por-mayor" },
      ]
    },
    {
      label: "DISEÑÁ",
      href: "/design",
      isDropdown: true,
      subItems: [
        { label: "GENERADOR CON IA", href: "/design" },
        { label: "DISEÑÁ TU REMERA", href: "/disena-tu-remera" },
        { label: "ESTILOS ARTÍSTICOS", href: "/styles" },
        { label: "COMPARAR PRENDAS", href: "/comparar" },
        { label: "GUÍA DE ESTAMPADO", href: "/guia-estampado" },
      ]
    },
    {
      label: "STUDIO",
      href: "/partners",
      isDropdown: true,
      subItems: [
        { label: "LANZÁ TU MARCA", href: "/lanza-tu-marca" },
        { label: "NOVAMENTE STUDIO", href: "/partners" },
        { label: "COTIZAR PRODUCCIÓN", href: "/cotizador" },
        { label: "MI WORKSPACE", href: "/partners/login" },
      ]
    },
    { label: "MARCAS", href: "/merchs" },
    { label: "FAQ", href: "/faq" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Logo />
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            if ((item as any).isButton) {
              return (
                <button
                  key={item.href}
                  onClick={scrollToGenerator}
                  className="text-sm tracking-widest font-medium uppercase transition-colors hover:text-primary"
                  data-cta="header-design"
                >
                  {item.label}
                </button>
              )
            }
            if ((item as any).isDropdown) {
              // Render as plain link on server, upgrade to dropdown after hydration
              if (!mounted) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-1 text-sm tracking-widest font-medium uppercase transition-colors hover:text-primary"
                  >
                    {item.label}
                    <ChevronDown className="h-4 w-4" />
                  </Link>
                )
              }
              return (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger className="flex items-center gap-1 text-sm tracking-widest font-medium uppercase transition-colors hover:text-primary outline-none">
                    {item.label}
                    <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-background border-border/40">
                    {(item as any).subItems.map((sub: any) => (
                      <DropdownMenuItem key={sub.href} asChild>
                        <Link
                          href={sub.href}
                          className="w-full cursor-pointer text-xs tracking-widest font-medium uppercase py-2"
                        >
                          {sub.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm tracking-widest font-medium uppercase transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm hidden md:inline-block">
                {user.email ? user.email.split("@")[0] : "Usuario"}
              </span>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Cerrar sesión">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 rounded-full bg-transparent"
              onClick={() => {
                setAuthTab("signup")
                setShowAuthModal(true)
              }}
            >
              <User className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Iniciar sesión o registrarse</span>
              <span className="sm:hidden">Cuenta</span>
            </Button>
          )}

          <CartBadge />

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <VisuallyHidden.Root>
                <SheetTitle>Menú de navegación</SheetTitle>
              </VisuallyHidden.Root>
              <div className="flex flex-col gap-6 mt-8">
                <div className="flex items-center justify-center mb-4">
                  <Logo />
                </div>
                {navItems.map((item) => {
                  if ((item as any).isButton) {
                    return (
                      <button
                        key={item.href}
                        onClick={() => {
                          closeSheet()
                          setTimeout(scrollToGenerator, 300)
                        }}
                        className="text-lg tracking-widest font-medium uppercase transition-colors hover:text-primary text-center"
                        data-cta="header-design-mobile"
                      >
                        {item.label}
                      </button>
                    )
                  }
                  if ((item as any).isDropdown) {
                    return (
                      <div key={item.label} className="flex flex-col gap-3">
                        <span className="text-lg tracking-widest font-medium uppercase text-muted-foreground text-center">
                          {item.label}
                        </span>
                        {(item as any).subItems.map((sub: any) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className="text-sm tracking-widest font-normal uppercase transition-colors hover:text-primary text-center text-zinc-500 dark:text-zinc-400"
                            onClick={closeSheet}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-lg tracking-widest font-medium uppercase transition-colors hover:text-primary text-center"
                      onClick={closeSheet}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} defaultTab={authTab} />
    </header>
  )
}
