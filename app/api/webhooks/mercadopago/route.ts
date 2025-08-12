import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase" // Assuming Supabase client is imported here

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("🔔 MercadoPago webhook received:", {
      type: body.type,
      action: body.action,
      data: body.data,
    })

    // Handle payment notifications
    if (body.type === "payment") {
      const paymentId = body.data?.id

      if (paymentId) {
        console.log("💳 Payment notification for ID:", paymentId)

        // Here you would typically:
        // 1. Fetch payment details from MercadoPago API
        // 2. Update order status in your database
        // 3. Send confirmation email to customer
        // 4. Update inventory

        // For now, we'll just log the information
        console.log("📋 Payment data to process:", {
          paymentId,
          timestamp: new Date().toISOString(),
          externalReference: body.data?.external_reference,
        })

        // TODO: Implement order processing logic here
        // Example structure for saving to Supabase:
        const orderData = {
          payment_id: paymentId,
          external_reference: body.data?.external_reference,
          status: "pending", // will be updated when we fetch full payment details
          created_at: new Date().toISOString(),
          webhook_data: body,
        }

        // Save to Supabase orders table
        await supabase.from("orders").insert([orderData])
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Error processing MercadoPago webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "MercadoPago webhook endpoint is active" })
}
