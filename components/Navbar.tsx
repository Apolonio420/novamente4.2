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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Navbar() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin")
  const [user, setUser] = useState<any>(null)
  const supabase = getClientSupabase()

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
    window.location.reload()
  }

  const navItems = [
    { label: "PRODUCTOS", href: "/products" },
    { label: "ESTILOS", href: "/styles" },
    { label: "MERCH", href: "/merch" },
    { label: "DISEÑA", href: "/design" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Logo />
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm tracking-widest font-medium uppercase transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
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

          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 mt-8">
                <div className="flex items-center justify-center mb-4">
                  <Logo />
                </div>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-lg tracking-widest font-medium uppercase transition-colors hover:text-primary text-center"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} defaultTab={authTab} />
    </header>
  )
}
