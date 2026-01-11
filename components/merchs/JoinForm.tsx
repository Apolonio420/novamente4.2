"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, Loader2, Rocket, Sparkles } from "lucide-react"
import Link from "next/link"

const formSchema = z.object({
    fullName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    email: z.string().email("Email inválido"),
    phone: z.string().optional(),
    brandName: z.string().optional(),
    instagramHandle: z.string().optional(),
    websiteUrl: z.string().url("URL inválida").optional().or(z.literal("")),
    message: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export default function JoinForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    })

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true)
        try {
            const response = await fetch("/api/partners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                throw new Error("Error al enviar el formulario")
            }

            setIsSuccess(true)
            toast.success("¡Solicitud enviada con éxito!", {
                description: "Nuestro equipo se pondrá en contacto con vos pronto.",
            })
        } catch (error) {
            console.error(error)
            toast.error("Hubo un problema al enviar tu solicitud", {
                description: "Por favor intentá de nuevo más tarde o escribinos a contact@novamente.ar",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8 bg-white rounded-2xl border border-violet-100 shadow-xl max-w-lg mx-auto"
            >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                    ¡Gracias por tu interés!
                </h2>
                <p className="text-gray-600 text-lg mb-8">
                    Tu solicitud fue recibida correctamente. Nuestro equipo la revisará y te vamos a estar contactando a la brevedad para ver cómo se prosigue.
                </p>
                <Link href="/merchs">
                    <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500">
                        Volver a Partners
                    </Button>
                </Link>
            </motion.div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <Link href="/merchs" className="text-violet-600 hover:text-violet-700 flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                </Link>
                <h1 className="text-4xl font-bold mb-2 text-gray-900">Formulario de Aplicación</h1>
                <p className="text-gray-600 text-lg">
                    Completá tus datos para empezar a crear tu línea oficial con Novamente.
                </p>
            </div>

            <motion.form
                onSubmit={handleSubmit(onSubmit)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 bg-white/50 backdrop-blur-sm p-8 rounded-2xl border border-violet-100 shadow-xl"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-gray-700 font-medium">Nombre Completo *</Label>
                        <Input
                            id="fullName"
                            placeholder="Juan Pérez"
                            className={`border-gray-200 focus:border-violet-500 focus:ring-violet-500 rounded-xl ${errors.fullName ? "border-red-500" : ""}`}
                            {...register("fullName")}
                        />
                        {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700 font-medium">Email de contacto *</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="juan@ejemplo.com"
                            className={`border-gray-200 focus:border-violet-500 focus:ring-violet-500 rounded-xl ${errors.email ? "border-red-500" : ""}`}
                            {...register("email")}
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700 font-medium">WhatsApp / Teléfono</Label>
                        <Input
                            id="phone"
                            placeholder="+54 9 11 ..."
                            className="border-gray-200 focus:border-violet-500 focus:ring-violet-500 rounded-xl"
                            {...register("phone")}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="brandName" className="text-gray-700 font-medium">Nombre de tu Marca / Proyecto</Label>
                        <Input
                            id="brandName"
                            placeholder="Mi Marca Increíble"
                            className="border-gray-200 focus:border-violet-500 focus:ring-violet-500 rounded-xl"
                            {...register("brandName")}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="instagramHandle" className="text-gray-700 font-medium">Usuario de Instagram (@...)</Label>
                        <Input
                            id="instagramHandle"
                            placeholder="@marca.id"
                            className="border-gray-200 focus:border-violet-500 focus:ring-violet-500 rounded-xl"
                            {...register("instagramHandle")}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="websiteUrl" className="text-gray-700 font-medium">Sitio Web (Opcional)</Label>
                        <Input
                            id="websiteUrl"
                            placeholder="https://..."
                            className={`border-gray-200 focus:border-violet-500 focus:ring-violet-500 rounded-xl ${errors.websiteUrl ? "border-red-500" : ""}`}
                            {...register("websiteUrl")}
                        />
                        {errors.websiteUrl && <p className="text-red-500 text-sm mt-1">{errors.websiteUrl.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="message" className="text-gray-700 font-medium">Contanos un poco más sobre tu proyecto</Label>
                    <Textarea
                        id="message"
                        placeholder="¿Qué tipo de productos te gustaría lanzar? ¿Qué buscas en un partner?"
                        className="border-gray-200 focus:border-violet-500 focus:ring-violet-500 rounded-xl min-h-[120px]"
                        {...register("message")}
                    />
                </div>

                <div className="pt-4">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 h-12 text-lg font-bold rounded-xl shadow-lg hover:shadow-violet-200/50 transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Enviando solicitud...
                            </>
                        ) : (
                            <>
                                <Rocket className="w-5 h-5" />
                                Postularme como Partner
                            </>
                        )}
                    </Button>
                    <p className="text-center text-gray-500 text-sm mt-4">
                        <Sparkles className="w-4 h-4 inline-block mr-1 text-violet-400" />
                        Sin inversión inicial. Sin riesgos. Calidad premium garantizada.
                    </p>
                </div>
            </motion.form>
        </div>
    )
}
