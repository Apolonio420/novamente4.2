import { NextResponse } from "next/server"
// supabaseAdmin y no el cliente anónimo: esta ruta corre en el servidor y la
// tabla guarda datos de contacto de quien se postula. Mientras usara el cliente
// anon, `anon` necesitaba permiso sobre partner_applications — y con eso
// cualquiera podía leer las postulaciones enteras desde el navegador.
import { supabaseAdmin } from "@/lib/supabase-admin"
import { notifyPartnerApplication } from "@/lib/notifications"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { fullName, email, phone, brandName, instagramHandle, websiteUrl, message } = body

        if (!fullName || !email) {
            return NextResponse.json({ error: "Nombre y email son obligatorios" }, { status: 400 })
        }

        // 1. Insert into Supabase
        const { data, error } = await (supabaseAdmin.from("partner_applications") as any)
            .insert([
                {
                    full_name: fullName,
                    email,
                    phone,
                    brand_name: brandName,
                    instagram_handle: instagramHandle,
                    website_url: websiteUrl,
                    message,
                },
            ])
            .select()

        if (error) {
            console.error("Error inserting into Supabase:", error)
            return NextResponse.json({ error: "Error al guardar la solicitud" }, { status: 500 })
        }

        // 2. Notify via Telegram
        try {
            await notifyPartnerApplication({
                fullName,
                email,
                phone,
                brandName,
                instagramHandle,
                websiteUrl,
                message,
            })
        } catch (notifError) {
            console.error("Error sending Telegram notification:", notifError)
            // We don't return error here because the data was already saved
        }

        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error("Unhandled error in partners API:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}
