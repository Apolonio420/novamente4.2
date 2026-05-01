"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type Props = {
    variant?: "hero" | "banner"
}

export default function InlineLeadForm({ variant = "hero" }: Props) {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [done, setDone] = useState(false)
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [instagramHandle, setInstagramHandle] = useState("")

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!fullName.trim() || !email.trim()) {
            toast.error("Completá nombre y email para arrancar")
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch("/api/partners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName,
                    email,
                    instagramHandle,
                    message: "Lead desde /merchs (form inline)",
                }),
            })
            if (!res.ok) throw new Error("submit_failed")
            setDone(true)
            toast.success("¡Listo! Te respondemos en el día.")
            setTimeout(() => router.push("/partners/join?welcome=1"), 800)
        } catch {
            toast.error("No pudimos enviar tu solicitud", {
                description: "Probá de nuevo o escribinos por WhatsApp.",
            })
        } finally {
            setSubmitting(false)
        }
    }

    const isHero = variant === "hero"

    if (done) {
        return (
            <div
                className={`rounded-2xl border p-6 text-center ${
                    isHero
                        ? "border-violet-200 bg-white shadow-xl"
                        : "border-white/30 bg-white/10 backdrop-blur"
                }`}
            >
                <CheckCircle2
                    className={`h-10 w-10 mx-auto mb-3 ${isHero ? "text-violet-600" : "text-white"}`}
                />
                <p className={`font-semibold text-lg ${isHero ? "text-gray-900" : "text-white"}`}>
                    ¡Recibido! Te llevamos a completar tu marca…
                </p>
            </div>
        )
    }

    return (
        <form
            onSubmit={onSubmit}
            className={`rounded-2xl p-5 md:p-6 ${
                isHero
                    ? "border border-violet-200 bg-white shadow-xl"
                    : "border border-white/30 bg-white/10 backdrop-blur"
            }`}
        >
            <div className={`mb-4 ${isHero ? "" : "text-white"}`}>
                <p className={`text-sm font-semibold ${isHero ? "text-violet-700" : "text-white/90"}`}>
                    Activá tu cuenta gratis
                </p>
                <p className={`text-xs ${isHero ? "text-gray-500" : "text-white/70"}`}>
                    Sin tarjeta · sin contrato · respuesta en el día
                </p>
            </div>

            <div className="space-y-3">
                <Input
                    placeholder="Tu nombre"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`h-11 ${isHero ? "" : "bg-white text-gray-900 border-white"}`}
                    required
                />
                <Input
                    type="email"
                    placeholder="Tu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`h-11 ${isHero ? "" : "bg-white text-gray-900 border-white"}`}
                    required
                />
                <Input
                    placeholder="Tu Instagram (opcional)"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    className={`h-11 ${isHero ? "" : "bg-white text-gray-900 border-white"}`}
                />
            </div>

            <Button
                type="submit"
                disabled={submitting}
                size="lg"
                className={`w-full h-12 mt-4 text-base font-semibold ${
                    isHero
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/20"
                        : "bg-white text-violet-700 hover:bg-gray-100"
                }`}
            >
                {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <>
                        Crear mi marca gratis
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                )}
            </Button>

            <p className={`text-[11px] mt-3 text-center ${isHero ? "text-gray-500" : "text-white/70"}`}>
                Tomá 30 segundos. Después podés completar el resto.
            </p>
        </form>
    )
}
