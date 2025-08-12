"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getClientSupabase } from "@/lib/auth-client"
import { Loader, Mail, Lock, ChromeIcon as Google, ArrowRight } from "lucide-react"

interface AuthModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: "signin" | "signup"
  message?: string
}

export function AuthModal({ isOpen, onOpenChange, defaultTab = "signin", message }: AuthModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab)
  const { toast } = useToast()
  const supabase = getClientSupabase()

  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  const handleEmailAuth = async (type: "signin" | "signup") => {
    if (!email || !password) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, completa todos los campos",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (!supabase) throw new Error("Supabase client not initialized")

      let result
      if (type === "signup") {
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        })
      }

      if (result.error) throw result.error

      if (type === "signup" && result.data.user?.identities?.length === 0) {
        toast({
          title: "Email ya registrado",
          description: "Este email ya está registrado. Por favor, inicia sesión.",
          variant: "destructive",
        })
        setActiveTab("signin")
      } else {
        toast({
          title: type === "signin" ? "Sesión iniciada" : "Cuenta creada",
          description:
            type === "signin"
              ? "Has iniciado sesión correctamente"
              : "Se ha enviado un email de confirmación a tu correo",
        })
        onOpenChange(false)
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      console.error("Auth error:", error)
      toast({
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "Ha ocurrido un error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)

    try {
      if (!supabase) throw new Error("Supabase client not initialized")

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        // Verificar si es el error específico de proveedor no habilitado
        if (error.message.includes("provider is not enabled") || error.message.includes("Unsupported provider")) {
          toast({
            title: "Proveedor no habilitado",
            description:
              "El proveedor de Google no está habilitado en Supabase. Por favor, usa otro método de autenticación o contacta al administrador.",
            variant: "destructive",
          })
        } else {
          throw error
        }
      }
    } catch (error) {
      console.error("Google auth error:", error)
      toast({
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "Ha ocurrido un error con Google",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTab = () => {
    setActiveTab(activeTab === "signin" ? "signup" : "signin")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{activeTab === "signin" ? "Accede a tu cuenta" : "Crea una cuenta"}</DialogTitle>
          <DialogDescription>
            {message || "Inicia sesión o crea una cuenta para continuar generando diseños."}
          </DialogDescription>
        </DialogHeader>

        {/* Banner para destacar la creación de cuenta */}
        {activeTab === "signin" && (
          <div className="bg-violet-100 dark:bg-violet-900/30 p-3 rounded-md mb-4">
            <p className="text-sm text-violet-800 dark:text-violet-300 mb-2">
              ¿No tienes una cuenta? Crea una para generar diseños ilimitados.
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={toggleTab}>
              Crear cuenta <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Iniciar sesión</TabsTrigger>
            <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-signin">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email-signin"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-signin">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password-signin"
                    type="password"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => handleEmailAuth("signin")}
                disabled={isLoading || !email || !password}
              >
                {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                Iniciar sesión
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleAuth} disabled={isLoading}>
              <Google className="mr-2 h-4 w-4" />
              Google
            </Button>

            <p className="text-xs text-muted-foreground mt-2 text-center">
              Si el inicio de sesión con Google no funciona, por favor usa el método de email y contraseña.
            </p>

            <p className="text-center text-sm text-muted-foreground mt-4">
              ¿No tienes una cuenta?{" "}
              <button type="button" className="text-violet-600 hover:underline font-medium" onClick={toggleTab}>
                Regístrate aquí
              </button>
            </p>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-signup">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-signup">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password-signup"
                    type="password"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => handleEmailAuth("signup")}
                disabled={isLoading || !email || !password}
              >
                {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                Crear cuenta
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O regístrate con</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleAuth} disabled={isLoading}>
              <Google className="mr-2 h-4 w-4" />
              Google
            </Button>

            <p className="text-xs text-muted-foreground mt-2 text-center">
              Si el inicio de sesión con Google no funciona, por favor usa el método de email y contraseña.
            </p>

            <p className="text-center text-sm text-muted-foreground mt-4">
              ¿Ya tienes una cuenta?{" "}
              <button type="button" className="text-violet-600 hover:underline font-medium" onClick={toggleTab}>
                Inicia sesión aquí
              </button>
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
