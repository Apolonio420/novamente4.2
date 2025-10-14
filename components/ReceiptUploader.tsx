'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, Image, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface ReceiptUploaderProps {
  orderId: string
  customerEmail: string
  onUploadSuccess?: (receiptId: string) => void
}

export default function ReceiptUploader({ orderId, customerEmail, onUploadSuccess }: ReceiptUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setUploadStatus('idle')
      setErrorMessage('')
    }
  }

  const handleUpload = async () => {
    if (!uploadedFile) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    setUploadStatus('idle')
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('orderId', orderId)
      formData.append('customerEmail', customerEmail)

      const response = await fetch('/api/upload-receipt', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setUploadStatus('success')
        toast({
          title: "¡Comprobante subido!",
          description: "Tu comprobante ha sido enviado correctamente. Te contactaremos pronto.",
        })
        
        if (onUploadSuccess) {
          onUploadSuccess(result.receiptId)
        }
      } else {
        setUploadStatus('error')
        setErrorMessage(result.error || 'Error subiendo el archivo')
        toast({
          title: "Error",
          description: result.error || 'Error subiendo el archivo',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error uploading receipt:', error)
      setUploadStatus('error')
      setErrorMessage('Error de conexión')
      toast({
        title: "Error",
        description: "Error de conexión. Intenta nuevamente.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const resetUpload = () => {
    setUploadedFile(null)
    setUploadStatus('idle')
    setErrorMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5" />
    } else if (file.type === 'application/pdf') {
      return <FileText className="w-5 h-5" />
    }
    return <FileText className="w-5 h-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Subir Comprobante de Pago
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadStatus === 'success' ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h3 className="font-medium text-green-700">¡Comprobante subido exitosamente!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Hemos recibido tu comprobante. Te contactaremos pronto para confirmar el pago.
              </p>
            </div>
            <Button onClick={resetUpload} variant="outline" size="sm">
              Subir otro comprobante
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Seleccionar archivo</label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadedFile ? 'Cambiar archivo' : 'Seleccionar archivo'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos permitidos: JPG, PNG, WebP, PDF (máximo 10MB)
              </p>
            </div>

            {uploadedFile && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {getFileIcon(uploadedFile)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.size)}</p>
                  </div>
                </div>
              </div>
            )}

            {uploadStatus === 'error' && errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!uploadedFile || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Comprobante
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
