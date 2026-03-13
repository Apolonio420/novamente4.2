"use client"

import { useState } from "react"
import { ImageUploader } from "./ImageUploader"
import { MockupViewer } from "./MockupViewer"
import { useToast } from "@/hooks/use-toast"

export function VisualizerContainer() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [originalFile, setOriginalFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [hasBackgroundRemoved, setHasBackgroundRemoved] = useState(false)

    const [selectedGarment, setSelectedGarment] = useState("aura-oversize-tshirt")
    const [selectedColor, setSelectedColor] = useState("black")

    const { toast } = useToast()

    const handleImageSelect = (file: File) => {
        setOriginalFile(file)
        const objectUrl = URL.createObjectURL(file)
        setSelectedImage(objectUrl)
        setHasBackgroundRemoved(false)
    }

    const handleRemoveImage = () => {
        setSelectedImage(null)
        setOriginalFile(null)
        setHasBackgroundRemoved(false)
    }

    const handleRemoveBackground = async () => {
        if (!selectedImage) return

        setIsProcessing(true)
        try {
            // Convertir blob URL o File a base64 si es necesario
            let imageToSend = selectedImage

            if (selectedImage.startsWith('blob:') && originalFile) {
                const reader = new FileReader()
                imageToSend = await new Promise((resolve, reject) => {
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(originalFile)
                })
            }

            const response = await fetch("/api/magic-remove-bg", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ imageUrl: imageToSend }),
            })

            if (!response.ok) {
                throw new Error("Error al procesar la imagen")
            }

            const data = await response.json()

            if (data.success && data.imageBase64) {
                setSelectedImage(data.imageBase64)
                setHasBackgroundRemoved(true)
                toast({
                    title: "¡Fondo removido!",
                    description: "La IA ha procesado tu imagen correctamente.",
                })
            } else {
                throw new Error("No se pudo remover el fondo")
            }
        } catch (error) {
            console.error("Error removing background:", error)
            toast({
                title: "Error",
                description: "No se pudo remover el fondo. Intenta con otra imagen.",
                variant: "destructive",
            })
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[600px]">
            {/* Left Panel: Controls */}
            <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        1. Tu Diseño
                    </h2>
                    <ImageUploader
                        onImageSelect={handleImageSelect}
                        selectedImage={selectedImage}
                        onRemoveImage={handleRemoveImage}
                        isProcessing={isProcessing}
                        onRemoveBackground={handleRemoveBackground}
                        hasBackgroundRemoved={hasBackgroundRemoved}
                    />
                </div>

                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-6 shadow-sm flex-1">
                    <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        2. Instrucciones
                    </h2>
                    <ul className="space-y-3 text-sm text-zinc-400">
                        <li className="flex gap-2">
                            <span className="bg-zinc-800 text-zinc-200 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                            Subí tu imagen (PNG, JPG).
                        </li>
                        <li className="flex gap-2">
                            <span className="bg-zinc-800 text-zinc-200 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                            Usá &quot;Remover Fondo&quot; para limpiar tu diseño automáticamente.
                        </li>
                        <li className="flex gap-2">
                            <span className="bg-zinc-800 text-zinc-200 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                            Elegí la prenda y el color para ver cómo queda.
                        </li>
                        <li className="flex gap-2">
                            <span className="bg-zinc-800 text-zinc-200 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                            Arrastrá el diseño en la prenda para ubicarlo (próximamente).
                        </li>
                    </ul>
                </div>
            </div>

            {/* Right Panel: Visualization */}
            <div className="lg:col-span-8">
                <MockupViewer
                    designImage={selectedImage}
                    selectedGarment={selectedGarment}
                    onGarmentChange={setSelectedGarment}
                    selectedColor={selectedColor}
                    onColorChange={setSelectedColor}
                />
            </div>
        </div>
    )
}
