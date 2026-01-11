import { type NextRequest, NextResponse } from "next/server"
import { getOrderByExternalReference, updateOrder } from "@/lib/db"
import { MercadoPagoConfig, Payment } from "mercadopago"

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

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
      const externalReference = body.data?.external_reference

      if (paymentId && externalReference) {
        console.log("💳 Payment notification for ID:", paymentId, "External Ref:", externalReference)

        // Buscar el pedido por external_reference
        const order = await getOrderByExternalReference(externalReference)

        if (!order) {
          console.error("❌ Order not found for external_reference:", externalReference)
          return NextResponse.json({
            error: "Order not found",
            received: true
          }, { status: 404 })
        }

        console.log("✅ Found order:", order.id, "Number:", order.order_number)

        // Obtener detalles completos del pago desde MercadoPago
        try {
          const payment = new Payment(client)
          const paymentDetails = await payment.get({ id: paymentId })

          console.log("📋 Payment details:", {
            id: paymentDetails.id,
            status: paymentDetails.status,
            status_detail: paymentDetails.status_detail,
            transaction_amount: paymentDetails.transaction_amount,
          })

          // Mapear estados de MercadoPago a nuestros estados
          let paymentStatus = 'pending'
          let orderStatus = 'pending'

          switch (paymentDetails.status) {
            case 'approved':
              paymentStatus = 'approved'
              orderStatus = 'confirmed'
              break
            case 'rejected':
              paymentStatus = 'rejected'
              orderStatus = 'cancelled'
              break
            case 'cancelled':
              paymentStatus = 'cancelled'
              orderStatus = 'cancelled'
              break
            case 'refunded':
              paymentStatus = 'refunded'
              orderStatus = 'cancelled'
              break
            case 'pending':
            case 'in_process':
            case 'in_meditation':
              paymentStatus = 'pending'
              orderStatus = 'pending'
              break
            default:
              paymentStatus = 'pending'
              orderStatus = 'pending'
          }

          // Actualizar el pedido con la información del pago
          const updated = await updateOrder(order.id!, {
            payment_id: String(paymentId),
            payment_status: paymentStatus,
            status: orderStatus,
            metadata: {
              webhook_data: body,
              payment_details: {
                status: paymentDetails.status,
                status_detail: paymentDetails.status_detail,
                transaction_amount: paymentDetails.transaction_amount,
                currency_id: paymentDetails.currency_id,
                date_approved: paymentDetails.date_approved,
                date_created: paymentDetails.date_created,
                payment_method_id: paymentDetails.payment_method_id,
                payment_type_id: paymentDetails.payment_type_id,
              }
            }
          })

          if (updated) {
            console.log("✅ Order updated successfully:", order.id)

            // Aquí podrías:
            // 1. Enviar email de confirmación al cliente
            // 2. Actualizar inventario
            // 3. Notificar al equipo de logística
            // 4. Etc.

            if (paymentStatus === 'approved' && orderStatus === 'confirmed') {
              console.log("🎉 Payment approved! Order confirmed:", order.order_number)

              // 🔔 Notificar por Telegram
              try {
                const { notifySale } = await import("@/lib/notifications")
                await notifySale({
                  orderNumber: order.order_number || order.id || 'N/A',
                  total: order.total || 0,
                  email: order.customer_email || 'N/A',
                  items: (order.items || []).map((item: any) => ({
                    name: item.item_name || 'Producto',
                    quantity: item.quantity || 1,
                    size: item.product_size || 'N/A',
                    color: item.product_color || 'N/A',
                    price: item.unit_price || 0,
                    imageUrl: item.image_url || item.mockup_url || null
                  }))
                })
              } catch (notifErr: any) {
                console.error("❌ Error sending sale notification:", notifErr.message)
              }
            }
          } else {
            console.error("❌ Failed to update order:", order.id)
          }
        } catch (paymentError: any) {
          console.error("❌ Error fetching payment details from MercadoPago:", paymentError)

          // Aun así, actualizar el pedido con la información básica del webhook
          await updateOrder(order.id!, {
            payment_id: String(paymentId),
            metadata: {
              webhook_data: body,
              payment_fetch_error: paymentError.message,
            }
          })
        }
      } else {
        console.warn("⚠️ Payment ID or external reference missing in webhook")
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
