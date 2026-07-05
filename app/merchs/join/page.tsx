import { Metadata } from "next"
import JoinForm from "@/components/merchs/JoinForm"

export const metadata: Metadata = {
    title: "Sumate como Partner",
    description: "Completá el formulario para sumarte al programa de partners de Novamente y lanzar tu línea de merchandising oficial.",
    openGraph: {
        title: "Sumate como Partner — Novamente",
        description: "Lanzá tu línea de merchandising oficial con Novamente.",
        url: "https://www.novamente.ar/merchs/join",
    },
    twitter: {
        card: "summary_large_image",
        title: "Sumate como Partner — Novamente",
        description: "Lanzá tu línea de merchandising oficial con Novamente.",
    },
    alternates: { canonical: "https://www.novamente.ar/merchs/join" },
}

export default function JoinPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 md:py-20 px-4">
            <div className="container mx-auto">
                <JoinForm />
            </div>
        </div>
    )
}
