import { NextRequest, NextResponse } from "next/server"
import { whatsAppClient } from "@/lib/whatsapp/client"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { verifyMetaWebhookSignature } from "@/lib/whatsapp/verify-signature"

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get("hub.mode")
    const token = searchParams.get("hub.verify_token")
    const challenge = searchParams.get("hub.challenge")

    if (mode && token) {
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("✅ WEBHOOK_VERIFIED")
            return new NextResponse(challenge, { status: 200 })
        } else {
            return new NextResponse("Forbidden", { status: 403 })
        }
    }

    return new NextResponse("Bad Request", { status: 400 })
}

export async function POST(request: NextRequest) {
    try {
        // El HMAC de Meta va sobre el body CRUDO — hay que leerlo como texto
        // ANTES de parsearlo, si no la firma nunca matchea.
        const rawBody = await request.text()

        const signatureHeader = request.headers.get("x-hub-signature-256")
        const verification = verifyMetaWebhookSignature(rawBody, signatureHeader, process.env.META_APP_SECRET)
        if (!verification.ok) {
            console.error("❌ WhatsApp webhook: firma inválida o ausente:", verification.reason)
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = JSON.parse(rawBody)

        // Log basic entry
        const messageEntry = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
        if (!messageEntry) return new NextResponse("No Message", { status: 200 })

        console.log("📨 Msg:", JSON.stringify(messageEntry, null, 2))

        const from = messageEntry.from
        const msgBody = messageEntry.text?.body || ""
        const msgType = messageEntry.type

        // 1. Log User Message to DB
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin as any).from('whatsapp_chats').insert({
            role: 'user',
            content: msgBody || `[${msgType}]`,
            media_type: msgType,
            intent: 'pending',
            // lead_id: resolved later in real implementation
        })

        // 2. Identify Intent
        // Import dynamically to avoid top-level await issues or massive bundles if not needed
        const { classifyIntent } = await import("@/lib/ai/router")
        const { intent, urgency } = await classifyIntent(msgBody, msgType === 'image')

        console.log("🧠 Brain Decision:", { intent, urgency })

        // 3. Route Logic
        let responseText = ""

        if (intent === 'sales_conversation' || intent === 'order_finalization') {
            const { generateSalesResponse } = await import("@/lib/ai/agents")
            // TODO: Fetch real history from DB
            const history = "User just started conversation."
            responseText = await generateSalesResponse(msgBody, history)
        }
        else if (intent === 'mockup_request') {
            responseText = "¡Buenísimo! Te preparo el mockup. 🎨 (Lógica de mockup pendiente de integración completa)"
            // TODO: Trigger Mockup Agent -> generateMockup()
        }
        else if (intent === 'human_handoff') {
            responseText = "Entendido. Un especialista humano va a revisar tu caso y te escribe en breve. 👨‍💻"
            // TODO: Notify admin
        }
        else {
            // Ignore or default
            return new NextResponse("Ignored", { status: 200 })
        }

        // 4. Send Response
        if (responseText) {
            await whatsAppClient.sendText(from, responseText)

            // Log Assistant Response
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabaseAdmin as any).from('whatsapp_chats').insert({
                role: 'assistant',
                content: responseText,
                intent: intent
            })
        }

        return new NextResponse("EVENT_RECEIVED", { status: 200 })
    } catch (error) {
        console.error("❌ Webhook Error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
