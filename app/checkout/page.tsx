"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from "@/lib/cartStore"
import { cardSurchargeAmount, MP_CARD_SURCHARGE } from "@/lib/payment-config"
import * as fpixel from "@/lib/fpixel"
import { setPixelUser } from "@/lib/pixel-user"
import { trackBeginCheckout } from "@/lib/analytics"
import { formatCurrency } from "@/lib/utils"
import { Loader2, ArrowLeft, CreditCard, Smartphone, Building2, Shield, Truck, Clock, X, Shirt, Image as ImageIcon, Camera, ShoppingBag, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import { DiscountInput } from "@/components/checkout/DiscountInput"
import { SHIPPING, shippingCostFor, envioPorDistancia, ENVIO_DISTANCIA as SHIPPING_RANGO } from "@/lib/shipping-config"
import { StoreBrandBar } from "@/components/checkout/StoreBrandBar"
import { getStoredAttribution } from "@/lib/attribution"
import { camposFaltantes, erroresCampos, mensajeErrores, type CampoObligatorio, type ErroresCampos } from "@/lib/checkout/form-checkout"

interface CustomerData {
  email: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  postalCode: string
}

// ── Embudo de checkout (ver lib/checkout/funnel.ts y migrations/20261001_checkout_events.sql) ──
// Hoy no hay forma de medir cuánta gente entra acá y no llega a pagar. Esto es
// puramente instrumentación: nunca debe frenar ni romper el checkout, por eso
// todo va en try/catch y nunca se awaitea en el click de "Confirmar".
const FUNNEL_SID_KEY = "nm_checkout_sid"

/** Id de sesión por pestaña — uno solo por visita, generado una vez. */
function getOrCreateFunnelSessionId(): string {
  try {
    const existente = sessionStorage.getItem(FUNNEL_SID_KEY)
    if (existente) return existente
    const nuevo =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID().replace(/-/g, "")
        : `${Date.now()}${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(FUNNEL_SID_KEY, nuevo)
    return nuevo
  } catch {
    // Modo privado u otra razón por la que sessionStorage no está disponible —
    // un id efímero igual sirve para no romper el envío del evento.
    return `tmp${Date.now()}${Math.random().toString(36).slice(2)}`
  }
}

/** Dispara un evento del embudo sin bloquear ni poder romper el checkout. */
function sendCheckoutEvent(payload: Record<string, unknown>) {
  try {
    const body = JSON.stringify(payload)
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/checkout/events", new Blob([body], { type: "application/json" }))
    } else {
      fetch("/api/checkout/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // Instrumentación: un fallo acá nunca debe afectar al cliente comprando.
  }
}

const AUTOCOMPLETE: Record<keyof CustomerData, string> = {
  email: "email",
  firstName: "given-name",
  lastName: "family-name",
  phone: "tel",
  address: "street-address",
  city: "address-level2",
  postalCode: "postal-code",
}

export default function CheckoutPage() {
  const { items, getTotalPrice, getTotalItems, clearCart, removeItem } = useCart()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  // Pedido por transferencia ya creado: el carrito se vacía y, mientras
  // navega a /checkout/transfer, no mostramos "Tu carrito está vacío".
  const [pedidoCreado, setPedidoCreado] = useState(false)
  // El carrito vive en localStorage (zustand persist): el server siempre lo ve
  // vacío. Hasta montar en el navegador mostramos un cargando — si no, el HTML
  // del server ("Tu carrito está vacío") no coincide con el del cliente y React
  // tira error de hidratación (QA 01/10/2026).
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'transferencia'>('mercadopago')
  const [shippingZone, setShippingZone] = useState<'BA' | 'RESTO'>('BA')
  // Estado para previsualización
  const [selectedItemIndex, setSelectedItemIndex] = useState(0)
  const selectedItem = items[selectedItemIndex] || items[0]

  // Construir lista de previews con label + icono. Orden: lifestyle/mockup primero,
  // despues mockup clean front/back, despues los diseños puros (sin prenda).
  type PreviewKind = 'lifestyle' | 'mockup-front' | 'mockup-back' | 'design-front' | 'design-back'
  const buildPreviews = (item: typeof selectedItem | undefined) => {
    if (!item) return [] as { url: string; label: string; kind: PreviewKind }[]
    const out: { url: string; label: string; kind: PreviewKind }[] = []
    if (item.mockupUrl) out.push({ url: item.mockupUrl, label: 'Lifestyle', kind: 'lifestyle' })
    if (item.frontMockup && item.frontMockup !== item.mockupUrl) {
      out.push({ url: item.frontMockup, label: 'Frente', kind: 'mockup-front' })
    }
    if (item.backMockup && item.backMockup !== item.mockupUrl) {
      out.push({ url: item.backMockup, label: 'Espalda', kind: 'mockup-back' })
    }
    if (item.frontDesign) {
      out.push({ url: item.frontDesign, label: 'Diseño frente', kind: 'design-front' })
    }
    if (item.backDesign) {
      out.push({ url: item.backDesign, label: 'Diseño espalda', kind: 'design-back' })
    }
    // Fallback: si no hay nada, intentar usar item.image
    if (out.length === 0 && item.image) {
      out.push({ url: item.image, label: 'Producto', kind: 'lifestyle' })
    }
    return out
  }
  const availablePreviews = buildPreviews(selectedItem)
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(availablePreviews[0]?.url || null)
  const [customerInfo, setCustomerInfo] = useState<CustomerData>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  })

  // Calcular totales usando exactamente los precios del carrito
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)
  const shippingThreshold = SHIPPING.FREE_THRESHOLD
  // El envío se calcula por DISTANCIA usando el código postal que el cliente ya
  // carga. Si todavía no lo escribió, cae a la zona gruesa que eligió.
  const envio = envioPorDistancia(subtotal, customerInfo.postalCode, shippingZone)
  const shippingCost = envio.costo
  // Con un CP legible la zona la decide el CP (es lo que se cobra); los botones
  // sólo valen mientras no hay CP. Antes con CP 1414 y "Resto del país" el
  // botón decía "desde $13.500", se cobraba AMBA y la fecha seguía al botón
  // (QA 01/10/2026).
  const zonaPorCP = !envio.estimado
  const zonaEfectiva: 'BA' | 'RESTO' = zonaPorCP ? (envio.zona === 'AMBA' ? 'BA' : 'RESTO') : shippingZone

  // Estimación llegada — días hábiles desde hoy: BA 3-5, Resto 5-7
  // (incluye producción on-demand DTG ~2 días + envío)
  const estimatedDelivery = (() => {
    const now = new Date()
    const min = zonaEfectiva === 'BA' ? 5 : 7
    const max = zonaEfectiva === 'BA' ? 7 : 10
    const addBusinessDays = (start: Date, days: number) => {
      const d = new Date(start)
      let added = 0
      while (added < days) {
        d.setDate(d.getDate() + 1)
        const dow = d.getDay() // 0 = sun, 6 = sat
        if (dow !== 0 && dow !== 6) added++
      }
      return d
    }
    const fmt = (d: Date) => d.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    return `${fmt(addBusinessDays(now, min))} – ${fmt(addBusinessDays(now, max))}`
  })()

  // Discount code aplicado (estado en cliente — se valida via /api/discounts/validate)
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string
    codeId: string
    discountARS: number
    codeLabel: string
  } | null>(null)

  // Si cambia el subtotal (agrega/quita item), invalidar el descuento aplicado
  useEffect(() => {
    if (appliedDiscount && subtotal === 0) {
      setAppliedDiscount(null)
    }
  }, [subtotal, appliedDiscount])

  const discountARS = appliedDiscount?.discountARS ?? 0
  const total = Math.max(0, subtotal + shippingCost - discountARS)
  // Recargo por tarjeta: solo MercadoPago. La transferencia paga el precio de
  // lista — misma regla que el bot (ver lib/payment-config.ts). Al servidor se
  // manda el total BASE; el recargo lo recalcula y aplica el backend.
  const cardSurcharge = paymentMethod === 'mercadopago' ? cardSurchargeAmount(total) : 0
  const totalAPagar = total + cardSurcharge

  console.log("💰 Checkout totals:", {
    subtotal,
    shippingCost,
    total,
    items: items.map((item) => ({ name: item.name, price: item.price, quantity: item.quantity })),
  })

  // Antes esto redirigía a /cart y de paso, mientras tanto, se veía una
  // página en blanco (return null más abajo) — un link de MP viejo/reusado,
  // o volver atrás después de vaciar el carrito, mostraba nada. Ahora
  // /checkout con carrito vacío muestra su propio estado vacío (ver el
  // `return` de más abajo) en vez de redirigir a ciegas.

  // Sincronizar preview cuando cambia el item seleccionado o el carrito
  useEffect(() => {
    const previews = buildPreviews(items[selectedItemIndex])
    setSelectedPreviewUrl(previews[0]?.url || null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedItemIndex])

  // Errores por campo (borde rojo + texto chico). Se llenan al tocar
  // "Confirmar" con datos incompletos y cada uno se limpia apenas ese campo
  // queda bien (pedido de Juan 01/10/2026).
  const [errores, setErrores] = useState<ErroresCampos>({})

  // Embudo de checkout: un solo 'checkout_view' por visita (recién cuando hay
  // carrito — no tiene sentido medir la vista vacía/en-tránsito). Ver nota de
  // "Embudo de checkout" más arriba.
  const sentViewRef = useRef(false)
  useEffect(() => {
    if (sentViewRef.current) return
    if (getTotalItems() === 0) return
    sentViewRef.current = true
    const tenantId = items.find((i) => i.tenantId)?.tenantId ?? null
    sendCheckoutEvent({
      event: "checkout_view",
      session_id: getOrCreateFunnelSessionId(),
      cart_value: subtotal,
      items: getTotalItems(),
      payment_method: paymentMethod,
      tenant_id: tenantId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const handleInputChange = (field: CampoObligatorio, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }))
    setErrores((prev) => {
      if (!prev[field]) return prev
      const nuevo = erroresCampos({ ...customerInfo, [field]: value })[field]
      const next = { ...prev }
      if (nuevo) next[field] = nuevo
      else delete next[field]
      return next
    })
  }

  const renderCampo = (
    id: CampoObligatorio,
    label: string,
    placeholder: string,
    type?: "email" | "tel",
  ) => {
    const error = errores[id]
    return (
      <div>
        <Label htmlFor={id} className={error ? "text-red-500" : undefined}>
          {label}
        </Label>
        <Input
          id={id}
          type={type}
          inputMode={type === "tel" ? "tel" : undefined}
          autoComplete={AUTOCOMPLETE[id]}
          value={customerInfo[id]}
          onChange={(e) => handleInputChange(id, e.target.value)}
          placeholder={placeholder}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={error ? "border-2 border-red-500 focus-visible:ring-red-500" : undefined}
        />
        {error && (
          <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-500">
            {error}
          </p>
        )}
      </div>
    )
  }

  const validateForm = () => {
    // Los datos de envío son OBLIGATORIOS antes de pagar (decisión 03/09/2026,
    // caso Marcelo NOV-20260813-7038: el "express checkout" dejaba pagar sin
    // dirección confiando en que el cliente la cargara después en
    // /checkout/success — si no volvía, el pedido quedaba pago y sin adónde
    // despachar). /checkout/success + shipping-info quedan como backfill de
    // pedidos viejos, no como camino normal.
    return camposFaltantes(customerInfo).length === 0
  }

  const handleCheckout = async () => {
    const erroresActuales = erroresCampos(customerInfo)
    const conError = Object.keys(erroresActuales) as CampoObligatorio[]
    // Embudo de checkout: cada click en "Confirmar" cuenta, sea válido o no —
    // es la única forma de distinguir "nadie toca el botón" de "lo tocan y
    // falla la validación" (ver nota de "Embudo de checkout" más arriba).
    const funnelSessionId = getOrCreateFunnelSessionId()
    sendCheckoutEvent({
      event: "confirm_click",
      session_id: funnelSessionId,
      valid: conError.length === 0,
      missing_fields: conError,
      payment_method: paymentMethod,
      cart_value: subtotal,
    })
    if (conError.length) {
      // El botón ya NO se deshabilita por formulario incompleto (01/10/2026,
      // reporte la-blancq): deshabilitado, tocarlo no hacía nada y parecía que
      // la transferencia estaba rota. Ahora decimos qué falta, marcamos en
      // rojo TODOS los campos con problema y llevamos el foco al primero.
      setErrores(erroresActuales)
      alert(mensajeErrores(erroresActuales))
      if (typeof document !== "undefined") document.getElementById(conError[0])?.focus()
      return
    }
    setErrores({})

    // Persist Advanced Matching data so all subsequent Pixel events (and
    // PageViews on future visits) carry hashed user info → improves Event
    // Match Quality from ~6/10 to 8-9/10.
    setPixelUser({
      em: customerInfo.email,
      ph: customerInfo.phone,
      fn: customerInfo.firstName,
      ln: customerInfo.lastName,
      ct: customerInfo.city,
      zp: customerInfo.postalCode,
      country: 'ar',
    })

    fpixel.event("InitiateCheckout", {
      content_ids: items.map((i) => i.id),
      contents: items.map((i) => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
      num_items: getTotalItems(),
      value: total,
      currency: "ARS",
    })

    setIsProcessing(true)

    try {
      if (paymentMethod === 'mercadopago') {
        // Preparar items para MercadoPago con precios exactos del carrito
        const checkoutItems = items.map((item) => ({
          id: item.id,
          title: item.name,
          quantity: item.quantity,
          unit_price: item.price, // PRECIO EXACTO DEL CARRITO
          currency_id: "ARS",
          description: `${item.garmentType} - ${item.color} - Talle ${item.size}${item.backDesign ? " (con estampado trasero)" : ""}`,
        }))

        // Agregar envío como item separado si aplica
        if (shippingCost > 0) {
          checkoutItems.push({
            id: "shipping",
            title: "Envío",
            quantity: 1,
            unit_price: shippingCost,
            currency_id: "ARS",
            description: "Costo de envío",
          })
        }

        console.log("🚀 Sending to MercadoPago:", {
          items: checkoutItems,
          customer: customerInfo,
          totalCalculated: total,
        })

        // Extraer tenantId del carrito (primer item con tenantId válido)
        const tenantId = items.find((i) => i.tenantId)?.tenantId ?? null

        const requestBody = {
          items: checkoutItems,
          customer: customerInfo,
          total: total, // Total calculado para validación
          cartItems: items, // Enviar items completos del carrito
          subtotal: subtotal,
          shippingCost: shippingCost,
          shippingZone: zonaEfectiva, // 'BA' | 'RESTO' (la del CP si hay)
          tenantId: tenantId,
          discountCode: appliedDiscount?.code ?? null, // el server lo revalida contra partner_discount_codes
          attribution: getStoredAttribution(), // UTMs/fbclid/gclid last-touch — null si no hay nada capturado
          funnelSessionId, // embudo de checkout — ver lib/checkout/funnel.ts
        }

        console.log("📤 Request body:", JSON.stringify(requestBody, null, 2))

        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("❌ API Error:", errorData)
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("✅ API Response:", data)

        if (data.success && data.init_point) {
          trackBeginCheckout(
            items.map((i) => ({
              item_id: i.id,
              item_name: i.name,
              item_category: i.garmentType,
              price: i.price,
              quantity: i.quantity,
            })),
          )
          // Snapshot del cart para que /checkout/success pueda disparar Purchase
          // aunque el cart ya esté vacío (el store de Zustand puede perderse en el redirect).
          // external_reference viene del API y es el mismo que MP devuelve en el callback.
          try {
            if (data.external_reference) {
              sessionStorage.setItem(
                `nm_pending_purchase_${data.external_reference}`,
                JSON.stringify({
                  value: total,
                  items: items.map((i) => ({
                    id: i.id,
                    name: i.name,
                    garmentType: i.garmentType,
                    price: i.price,
                    quantity: i.quantity,
                  })),
                  numItems: getTotalItems(),
                  ts: Date.now(),
                }),
              )
            }
          } catch {
            // sessionStorage puede fallar en modo privado — no es crítico, sigue el flow
          }
          // Redirigir a MercadoPago
          window.location.href = data.init_point
        } else {
          throw new Error(data.error || "Error al procesar el pago")
        }
      } else {
        // Transferencia bancaria - crear pedido primero
        console.log("🔄 Creating transfer order...")
        
        const transferResponse = await fetch("/api/checkout/transfer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: customerInfo,
            items: items,
            subtotal: subtotal,
            shippingCost: shippingCost,
            shippingZone: zonaEfectiva,
            total: total,
            discountCode: appliedDiscount?.code ?? null,
            attribution: getStoredAttribution(),
            funnelSessionId, // embudo de checkout — ver lib/checkout/funnel.ts
          }),
        })

        if (!transferResponse.ok) {
          const errorData = await transferResponse.json()
          console.error("❌ Transfer API Error:", errorData)
          throw new Error(errorData.error || "Error al crear el pedido")
        }

        const transferDataResponse = await transferResponse.json()
        console.log("✅ Transfer order created:", transferDataResponse)

        // Preparar datos de transferencia para mostrar en página
        const transferData = {
          bank: "MercadoPago",
          cvu: "0000003100011214870727",
          alias: "novamente",
          // El alias es de una cuenta a nombre de una persona física — el banco
          // del cliente le va a mostrar este nombre al transferir. Si no se lo
          // anticipamos acá, desconfía y abandona (caso real 17/09: carrito de
          // $111.400 impago).
          titular: "Valentín Nuñez",
          amount: total,
          // Para mostrar el envío real en /checkout/transfer (antes decía "Gratis" siempre).
          shippingCost,
          discountARS,
          customer: customerInfo,
          items: items,
          order_id: transferDataResponse.order_id,
          order_number: transferDataResponse.order_number,
        }
        
        // Guardar datos de transferencia en localStorage para mostrar en página de confirmación
        console.log("🔄 Guardando datos de transferencia:", transferData)
        localStorage.setItem('transferData', JSON.stringify(transferData))
        
        // El pedido ya existe: vaciar el carrito para que volver atrás o
        // tocar "Confirmar" de nuevo no cree un pedido duplicado (QA 01/10).
        // MP lo vacía en /checkout/success; la transferencia no pasa por ahí.
        setPedidoCreado(true)
        clearCart()

        // Redirigir a página de transferencia
        router.push('/checkout/transfer')
      }
    } catch (error) {
      console.error("❌ Checkout error:", error)
      // Mensajes específicos del servidor (stock agotado, precio no coincide,
      // etc.) tienen que llegarle al cliente tal cual — antes acá se pisaban
      // con un genérico y el motivo real del rechazo se perdía.
      const message = error instanceof Error && error.message ? error.message : "Error al procesar el pago. Por favor intenta nuevamente."
      alert(message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Carrito vacío: antes esto devolvía null (página en blanco) mientras el
  // useEffect de arriba redirigía a /cart. Ahora se explica y se da una
  // salida — cubre el link de MP viejo, volver atrás después de vaciar el
  // carrito, o entrar directo a /checkout sin haber agregado nada.
  if (!montado) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center" aria-busy="true">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (getTotalItems() === 0) {
    if (pedidoCreado) {
      return (
        <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center gap-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
          <h1 className="text-xl font-semibold">¡Pedido creado!</h1>
          <p className="text-muted-foreground max-w-sm">Te llevamos a los datos para transferir…</p>
        </div>
      )
    }
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center gap-4">
        <ShoppingBag className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Tu carrito está vacío</h1>
        <p className="text-muted-foreground max-w-sm">
          Todavía no agregaste ningún producto. Volvé a la tienda para seguir eligiendo.
        </p>
        <Button asChild className="mt-2">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la tienda
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-6 text-sm">
        <span className="text-muted-foreground">Carrito</span>
        <span className="text-muted-foreground">—</span>
        <span className="font-semibold text-primary">Checkout</span>
        <span className="text-muted-foreground">—</span>
        <span className="text-muted-foreground">Confirmación</span>
      </div>

      {/* Urgency banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center mb-6">
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <p className="text-sm font-medium text-amber-200">
            Producción sale hoy — completá tu pedido para entrar en esta tanda
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <Link href="/cart">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Carrito
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Checkout</h1>
      </div>

      <StoreBrandBar />

      <div className="grid md:grid-cols-2 gap-8">
        {/* Información del cliente */}
        {/* min-w-0: sin esto, los nombres largos con truncate inflan el min-content
            de la columna y toda la página desborda el viewport en mobile */}
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderCampo("email", "Email *", "tu@email.com", "email")}
              <div className="grid grid-cols-2 gap-4">
                {renderCampo("firstName", "Nombre *", "Juan", undefined)}
                {renderCampo("lastName", "Apellido *", "Pérez", undefined)}
              </div>
              {renderCampo("phone", "Teléfono *", "+54 9 11 1234-5678", "tel")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Envío</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Urgency badge: fecha estimada de llegada */}
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-200 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span>
                  Comprando ahora <strong>te llega entre el {estimatedDelivery}</strong>
                </span>
              </div>

              {/* Selector de zona — tipo botón grande */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShippingZone('BA')}
                  disabled={zonaPorCP}
                  aria-pressed={zonaEfectiva === 'BA'}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    zonaEfectiva === 'BA'
                      ? 'border-primary bg-primary/5'
                      : `border-border ${zonaPorCP ? 'opacity-50' : 'hover:border-muted-foreground'}`
                  }`}
                >
                  <div className="font-medium">Buenos Aires</div>
                  <div className="text-sm text-muted-foreground">
                    {subtotal >= shippingThreshold
                      ? 'Gratis'
                      : zonaEfectiva === 'BA' && zonaPorCP
                        ? `$${envio.costo.toLocaleString('es-AR')}`
                        : `$${SHIPPING_RANGO.AMBA_MIN.toLocaleString('es-AR')} a $${SHIPPING_RANGO.AMBA_MAX.toLocaleString('es-AR')}`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">CABA + GBA · llega en 3-5 días hábiles</div>
                </button>
                <button
                  type="button"
                  onClick={() => setShippingZone('RESTO')}
                  disabled={zonaPorCP}
                  aria-pressed={zonaEfectiva === 'RESTO'}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    zonaEfectiva === 'RESTO'
                      ? 'border-primary bg-primary/5'
                      : `border-border ${zonaPorCP ? 'opacity-50' : 'hover:border-muted-foreground'}`
                  }`}
                >
                  <div className="font-medium">Resto del país</div>
                  <div className="text-sm text-muted-foreground">
                    {subtotal >= shippingThreshold
                      ? 'Gratis'
                      : zonaEfectiva === 'RESTO' && zonaPorCP
                        ? `$${envio.costo.toLocaleString('es-AR')}`
                        : `desde $${SHIPPING_RANGO.INTERIOR_MIN.toLocaleString('es-AR')}`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Interior · llega en 5-7 días hábiles</div>
                </button>
              </div>
              {zonaPorCP && (
                <p className="-mt-2 text-xs text-muted-foreground" data-testid="zona-por-cp">
                  Zona según tu código postal: <strong>{envio.donde}</strong>
                </p>
              )}

              {/* Dirección opcional pre-pago — se completa post-pago si la dejan vacía */}
              {/* Datos de envío OBLIGATORIOS antes de pagar. Antes era un
                  <details> "opcional — te la pedimos después del pago": el pedido
                  quedaba PENDIENTE_POST_PAGO y si el cliente no volvía a la página
                  de éxito no había adónde despachar (caso Marcelo NOV-20260813-7038,
                  pagó por transferencia 20 días después y no hay dirección). */}
              <div className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium mb-1">Datos de envío</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Los necesitamos para despachar tu pedido por Andreani.
                </p>
                <div className="space-y-3">
                  {renderCampo("address", "Dirección (calle y número) *", "Av. Corrientes 1234, piso/depto", undefined)}
                  <div className="grid grid-cols-2 gap-3">
                    {renderCampo("city", "Ciudad *", "Buenos Aires", undefined)}
                    {renderCampo("postalCode", "Código Postal *", "1000", undefined)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Método de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'mercadopago' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => setPaymentMethod('mercadopago')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === 'mercadopago' 
                        ? 'border-primary bg-primary' 
                        : 'border-border'
                    }`}>
                      {paymentMethod === 'mercadopago' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-medium">MercadoPago</h3>
                      <p className="text-sm text-muted-foreground">
                        Tarjetas de crédito, débito, efectivo y más · +10% de recargo
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'transferencia' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => setPaymentMethod('transferencia')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === 'transferencia' 
                        ? 'border-primary bg-primary' 
                        : 'border-border'
                    }`}>
                      {paymentMethod === 'transferencia' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <Building2 className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-medium">Transferencia Bancaria</h3>
                      <p className="text-sm text-muted-foreground">
                        Transferencia directa desde tu banco · sin recargo
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumen del pedido */}
        <div className="space-y-6 min-w-0">
          {/* Imagen grande de las prendas */}
          {items.length > 0 && selectedItem && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>Vista Previa de tu Pedido</span>
                  {availablePreviews.length > 0 && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {availablePreviews.findIndex(p => p.url === selectedPreviewUrl) + 1} / {availablePreviews.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full aspect-square sm:h-96 sm:aspect-auto rounded-xl overflow-hidden bg-muted border border-border">
                  <Image
                    src={selectedPreviewUrl || "/placeholder.svg"}
                    alt={selectedItem.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg"
                    }}
                    unoptimized={(selectedPreviewUrl || "").startsWith('/api/')}
                  />
                  {/* Badge del tipo de preview en esquina */}
                  {(() => {
                    const current = availablePreviews.find(p => p.url === selectedPreviewUrl)
                    if (!current) return null
                    return (
                      <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-white">
                        {current.kind === 'lifestyle' && <Camera className="w-3 h-3" />}
                        {(current.kind === 'mockup-front' || current.kind === 'mockup-back') && <Shirt className="w-3 h-3" />}
                        {(current.kind === 'design-front' || current.kind === 'design-back') && <ImageIcon className="w-3 h-3" />}
                        {current.label}
                      </div>
                    )
                  })()}
                </div>

                <p className="text-base font-medium mt-3 text-center">
                  {selectedItem.name} <span className="text-muted-foreground">·</span> {selectedItem.color} <span className="text-muted-foreground">·</span> Talle {selectedItem.size}
                </p>

                {/* Tabs/thumbnails con label — incluye diseño puro, no solo lifestyle */}
                {availablePreviews.length > 1 && (
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {availablePreviews.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPreviewUrl(p.url)}
                        className={`group relative rounded-lg overflow-hidden border-2 transition-all ${
                          selectedPreviewUrl === p.url
                            ? 'border-primary shadow-md'
                            : 'border-transparent hover:border-primary/40 opacity-75 hover:opacity-100'
                        }`}
                        aria-label={p.label}
                        title={p.label}
                      >
                        <div className="relative aspect-square">
                          <Image
                            src={p.url}
                            alt={p.label}
                            fill
                            sizes="80px"
                            className="object-cover"
                            unoptimized={p.url.startsWith('/api/')}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg"
                            }}
                          />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1 py-1">
                          <span className="block text-[9px] sm:text-[10px] font-medium text-white text-center truncate leading-tight">
                            {p.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`group relative flex gap-3 cursor-pointer rounded-lg p-2.5 transition-all ${
                      idx === selectedItemIndex
                        ? 'bg-primary/5 ring-1 ring-primary/40'
                        : 'hover:bg-muted/30 ring-1 ring-transparent'
                    }`}
                    onClick={() => setSelectedItemIndex(idx)}
                  >
                    <div className="w-16 h-16 relative rounded-md overflow-hidden flex-shrink-0 bg-muted">
                      <Image
                        src={item.mockupUrl || item.frontMockup || item.backMockup || item.frontDesign || item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg"
                        }}
                        unoptimized={(item.mockupUrl || item.frontMockup || item.backMockup || item.frontDesign || item.image || "").startsWith('/api/')}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate pr-7">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {item.color} · Talle {item.size}
                      </p>
                      {item.frontStampSize && (
                        <p className="text-xs text-muted-foreground">
                          Estampa: {item.frontStampSize}{item.frontStampPosition && ` · ${item.frontStampPosition === 'center' ? 'Centro' : 'Izquierda'}`}
                        </p>
                      )}
                      {item.backStampSize && (
                        <p className="text-xs text-muted-foreground">
                          Espalda: {item.backStampSize}{item.backStampPosition && ` · ${item.backStampPosition === 'center' ? 'Centro' : 'Izquierda'}`}
                        </p>
                      )}
                      {item.backDesign && !item.backStampSize && <p className="text-xs text-emerald-600">✓ Con estampado trasero</p>}
                      <p className="text-xs text-muted-foreground">Cantidad: {item.quantity}</p>
                    </div>
                    <div className="text-right pr-7">
                      <p className="font-semibold text-sm">{formatCurrency(item.price * item.quantity)}</p>
                      <p className="text-[10px] text-muted-foreground">{formatCurrency(item.price)} c/u</p>
                    </div>
                    {/* Delete button — siempre visible en mobile, hover en desktop */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`¿Eliminar ${item.name} del carrito?`)) {
                          removeItem(item.id)
                          // Si era el item seleccionado, resetear al primero
                          if (idx === selectedItemIndex) setSelectedItemIndex(0)
                        }
                      }}
                      aria-label={`Eliminar ${item.name}`}
                      className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors sm:opacity-60 sm:group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600 font-medium">¡Gratis!</span>
                    ) : (
                      formatCurrency(shippingCost)
                    )}
                  </span>
                </div>
                {subtotal < shippingThreshold && (
                  <div className="bg-blue-500/10 p-2 rounded space-y-1.5">
                    <p className="text-xs font-medium text-blue-200">
                      Te faltan {formatCurrency(shippingThreshold - subtotal)} para envío gratuito
                    </p>
                    <div className="w-full bg-blue-500/20 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (subtotal / shippingThreshold) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {appliedDiscount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">Descuento ({appliedDiscount.code})</span>
                    <span className="text-emerald-600 font-medium">−{formatCurrency(discountARS)}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 mb-1">
                <DiscountInput
                  subtotal={subtotal}
                  applied={appliedDiscount ? { code: appliedDiscount.code, discountARS: appliedDiscount.discountARS, codeLabel: appliedDiscount.codeLabel } : null}
                  onApply={data => setAppliedDiscount({ code: data.code, codeId: data.codeId, discountARS: data.discountARS, codeLabel: data.codeLabel })}
                  onRemove={() => setAppliedDiscount(null)}
                />
              </div>

              <Separator className="my-4" />

              {cardSurcharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recargo pago con tarjeta (10%)</span>
                  <span className="text-muted-foreground">+{formatCurrency(cardSurcharge)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-xl text-green-600">{formatCurrency(totalAPagar)}</span>
              </div>
              {cardSurcharge > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Pagando por transferencia: {formatCurrency(total)}
                </p>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleCheckout} disabled={isProcessing} className="w-full text-base" size="lg">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando tu pedido...
              </>
            ) : (
              <>
                {paymentMethod === 'mercadopago' ? (
                  <CreditCard className="mr-2 h-5 w-5" />
                ) : (
                  <Building2 className="mr-2 h-5 w-5" />
                )}
                {/* Con MP el monto es el que se cobra (incluye recargo de tarjeta): antes
                    el botón decía el total SIN recargo y el resumen, con recargo. */}
                {paymentMethod === 'mercadopago' ? 'Confirmar y Pagar' : 'Confirmar Pedido'} — {formatCurrency(totalAPagar)}
              </>
            )}
          </Button>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground py-2">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Pago 100% seguro
            </span>
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              Envío a todo el país
            </span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {paymentMethod === 'mercadopago'
              ? 'Vas a ser redirigido a Mercado Pago para completar tu compra de forma segura.'
              : 'Vas a ver los datos de transferencia bancaria para completar tu pago.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
