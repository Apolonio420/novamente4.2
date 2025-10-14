"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Copy, Check, Building2, CreditCard, User, MapPin, Phone, X, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ReceiptUploader from "@/components/ReceiptUploader"

interface TransferData {
  bank: string
  cvu?: string
  cbu?: string
  alias: string
  amount: number
  customer: {
    email: string
    firstName: string
    lastName: string
    phone: string
    address: string
    city: string
    postalCode: string
  }
  items: any[]
}

export default function TransferPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [transferData, setTransferData] = useState<TransferData | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showZoomModal, setShowZoomModal] = useState(false)
  const [zoomImageUrl, setZoomImageUrl] = useState("")
  const [zoomImageAlt, setZoomImageAlt] = useState("")
  const [receiptUploaded, setReceiptUploaded] = useState(false)

  useEffect(() => {
    const data = localStorage.getItem('transferData')
    console.log("📥 Leyendo datos de transferencia del localStorage:", data)
    if (data) {
      const parsedData = JSON.parse(data)
      console.log("📥 Datos parseados:", parsedData)
      setTransferData(parsedData)
    } else {
      router.push('/checkout')
    }
  }, [router])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast({
        title: "Copiado",
        description: `${field} copiado al portapapeles`,
      })
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const handleImageDoubleClick = (imageUrl: string, alt: string) => {
    setZoomImageUrl(imageUrl)
    setZoomImageAlt(alt)
    setShowZoomModal(true)
  }

  const handleReceiptUploadSuccess = (receiptId: string) => {
    setReceiptUploaded(true)
    console.log('✅ Comprobante subido exitosamente:', receiptId)
  }

  if (!transferData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Cargando...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/checkout">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Checkout
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Transferencia Bancaria</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Datos de transferencia */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Datos para la Transferencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Banco</label>
                  <div className="p-3 bg-muted rounded-lg font-medium">
                    {transferData.bank}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">CVU</label>
                  <div className="flex items-center gap-2">
                    <div className="p-3 bg-muted rounded-lg font-mono flex-1">
                      {transferData.cvu || transferData.cbu}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(transferData.cvu || transferData.cbu, 'CVU')}
                    >
                      {copiedField === 'CVU' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Alias</label>
                  <div className="flex items-center gap-2">
                    <div className="p-3 bg-muted rounded-lg font-mono flex-1">
                      {transferData.alias}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(transferData.alias, 'Alias')}
                    >
                      {copiedField === 'Alias' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Importante:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Realiza la transferencia por el monto exacto: <strong>{formatCurrency(transferData.amount)}</strong></li>
                  <li>• Envía el comprobante a nuestro WhatsApp</li>
                  <li>• Tu pedido será procesado una vez confirmado el pago</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Datos del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">Cliente</label>
                  <p className="font-medium">{transferData.customer.firstName} {transferData.customer.lastName}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Email</label>
                  <p className="font-medium">{transferData.customer.email}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Teléfono</label>
                  <p className="font-medium">{transferData.customer.phone}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Ciudad</label>
                  <p className="font-medium">{transferData.customer.city}</p>
                </div>
              </div>
              
              <div>
                <label className="text-muted-foreground">Dirección de Envío</label>
                <p className="font-medium">{transferData.customer.address}</p>
                {transferData.customer.postalCode && (
                  <p className="text-sm text-muted-foreground">CP: {transferData.customer.postalCode}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumen del pedido */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transferData.items.map((item) => (
                  <div key={item.id} className="space-y-4">
                    {/* Imagen grande del producto */}
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 group">
                      <Image 
                        src={item.frontMockup || item.backMockup || item.image || "/placeholder.svg"} 
                        alt={item.name} 
                        fill 
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-contain cursor-pointer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg"
                        }}
                        onDoubleClick={() => handleImageDoubleClick(
                          item.frontMockup || item.backMockup || item.image || "/placeholder.svg",
                          item.name
                        )}
                        unoptimized={(item.frontMockup || item.backMockup || item.image || "").startsWith('/api/')}
                      />
                      {/* Leyenda de zoom */}
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        Doble click para zoom
                      </div>
                    </div>
                    
                    {/* Detalles del producto */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-base">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.garmentType} - {item.color} - Talle {item.size}
                      </p>
                      <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{formatCurrency(item.price * item.quantity)}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} c/u</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(transferData.items.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span className="text-green-600 font-medium">Gratis</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total a Transferir</span>
                <span className="text-xl text-green-600">{formatCurrency(transferData.amount)}</span>
              </div>
            </CardContent>
          </Card>

          {!receiptUploaded ? (
            <ReceiptUploader
              orderId={`order_${Date.now()}`}
              customerEmail={transferData.customer.email}
              onUploadSuccess={handleReceiptUploadSuccess}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  Comprobante Recibido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <h3 className="font-medium text-green-700">¡Comprobante subido exitosamente!</h3>
                  <p className="text-sm text-muted-foreground">
                    Hemos recibido tu comprobante de pago. Te contactaremos pronto para confirmar el pago y comenzar a preparar tu pedido.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-medium">Transferencia Realizada</h3>
                      <p className="text-sm text-muted-foreground">
                        Has completado la transferencia bancaria
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-medium">Comprobante Enviado</h3>
                      <p className="text-sm text-muted-foreground">
                        Hemos recibido tu comprobante de pago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <h3 className="font-medium">Confirmación Pendiente</h3>
                      <p className="text-sm text-muted-foreground">
                        Te contactaremos pronto para confirmar el pago
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de zoom */}
      <Dialog open={showZoomModal} onOpenChange={setShowZoomModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>{zoomImageAlt}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowZoomModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[70vh] bg-gray-100">
            <Image
              src={zoomImageUrl}
              alt={zoomImageAlt}
              fill
              className="object-contain"
              unoptimized={zoomImageUrl.startsWith('/api/')}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
