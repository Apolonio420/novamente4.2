"use client"

import { useState, useEffect } from "react"
import NextImage from "next/image"
import { MockupCanvas } from "@/components/MockupCanvas"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, Wand2, Loader2, Download, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

interface MockupViewerProps {
    designImage: string | null
    selectedGarment: string
    onGarmentChange: (garment: string) => void
    selectedColor: string
    onColorChange: (color: string) => void
}

const GARMENTS = [
    { id: "aura-oversize-tshirt", name: "Remera Oversize", colors: ["black", "white", "caramel"], type: "tshirt", variant: "oversize" },
    { id: "astra-oversize-hoodie", name: "Hoodie Oversize", colors: ["black", "caramel", "cream", "gray"], type: "hoodie", variant: "oversize" },
    { id: "aldea-classic-tshirt", name: "Remera Classic", colors: ["black", "white"], type: "tshirt", variant: "classic" },
]

const COLOR_MAP: Record<string, string> = {
    black: "bg-zinc-900",
    white: "bg-zinc-100",
    caramel: "bg-[#C68E17]",
    cream: "bg-[#F5F5DC]",
    gray: "bg-zinc-500",
}

export function MockupViewer({
    designImage,
    selectedGarment,
    onGarmentChange,
    selectedColor,
    onColorChange
}: MockupViewerProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [scale, setScale] = useState(0.35)
    const [side, setSide] = useState<"front" | "back">("front")
    const [isGenerating, setIsGenerating] = useState(false)
    const [mockupResult, setMockupResult] = useState<string | null>(null)
    const { toast } = useToast()

    // Reset position when garment changes
    useEffect(() => {
        setPosition({ x: 0, y: 0 })
    }, [selectedGarment, side])

    const currentGarment = GARMENTS.find(g => g.id === selectedGarment) || GARMENTS[0]

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.05, 0.9))
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.05, 0.1))

    const handleGenerateMockup = async () => {
        if (!designImage) return

        setIsGenerating(true)
        setMockupResult(null)

        try {
            // Convert blob to base64 if necessary
            let finalDesignUrl = designImage
            if (designImage.startsWith('blob:')) {
                const response = await fetch(designImage)
                const blob = await response.blob()
                finalDesignUrl = await new Promise((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.readAsDataURL(blob)
                })
            }

            // Map stamp size based on scale
            // R1: < 0.25, R2: 0.25 - 0.5, R3: > 0.5
            let stampSize: "R1" | "R2" | "R3" = "R2"
            if (scale < 0.2) stampSize = "R1"
            else if (scale > 0.45) stampSize = "R3"

            // Map position
            const stampPosition = Math.abs(position.x) > 30 ? "left" : "center"

            // API call
            const response = await fetch("/api/generate-stamp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    designImageUrl: finalDesignUrl,
                    garmentType: currentGarment.type,
                    garmentVariant: currentGarment.variant,
                    garmentColor: selectedColor,
                    side: side,
                    stampSize: stampSize,
                    stampPosition: stampPosition,
                    prompt: "Professional garment mockup with custom image"
                })
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.error || "Error al generar el mockup")
            }

            const data = await response.json()
            if (data.success && data.publicUrl) {
                setMockupResult(data.publicUrl)
                toast({
                    title: "¡Mockup Generado!",
                    description: "Se ha creado una vista profesional de tu diseño.",
                })
            }
        } catch (error) {
            console.error("Error generating mockup:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "No se pudo generar el mockup",
                variant: "destructive",
            })
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Garment Selector Tabs */}
            <div className="flex justify-center">
                <div className="bg-zinc-900/50 p-1 rounded-full border border-zinc-800 inline-flex shadow-inner">
                    {GARMENTS.map((garment) => (
                        <button
                            key={garment.id}
                            onClick={() => onGarmentChange(garment.id)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                selectedGarment === garment.id
                                    ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                            )}
                        >
                            {garment.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Viewer Area */}
            <div className="flex-1 relative min-h-[500px] bg-zinc-950/50 rounded-3xl border border-zinc-800/50 overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="relative w-full h-full max-w-[600px] mx-auto transition-transform duration-500">
                        <MockupCanvas
                            garmentType={selectedGarment}
                            garmentColor={selectedColor}
                            design={{
                                image: designImage || "",
                                position: position,
                                scale: scale
                            }}
                            onPositionChange={setPosition}
                            side={side}
                            showModel={false}
                        />
                    </div>
                </div>

                {/* ZOOM CONTROLS */}
                <div className="absolute top-6 left-6 flex flex-col gap-2 bg-zinc-900/80 backdrop-blur-md p-1.5 rounded-xl border border-zinc-800 shadow-xl z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleZoomIn}
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    <div className="h-[1px] bg-zinc-800 mx-2" />
                    <button
                        onClick={handleZoomOut}
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                    >
                        <Minus className="w-5 h-5" />
                    </button>
                </div>

                {/* Side Toggle (Front/Back) */}
                <div className="absolute top-6 right-6 flex flex-col gap-2 bg-zinc-900/80 backdrop-blur-md p-1.5 rounded-xl border border-zinc-800 shadow-xl z-20">
                    <button
                        onClick={() => setSide("front")}
                        className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all",
                            side === "front" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:bg-zinc-800"
                        )}
                    >
                        F
                    </button>
                    <button
                        onClick={() => setSide("back")}
                        className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all",
                            side === "back" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:bg-zinc-800"
                        )}
                    >
                        B
                    </button>
                </div>

                {/* Color Selector */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-md px-5 py-3 rounded-full border border-zinc-800 shadow-xl z-20 flex gap-4">
                    {currentGarment.colors.map((color) => (
                        <button
                            key={color}
                            onClick={() => onColorChange(color)}
                            className={cn(
                                "w-8 h-8 rounded-full border-2 transition-all hover:scale-125 hover:shadow-lg",
                                COLOR_MAP[color],
                                selectedColor === color
                                    ? "border-white scale-110 ring-4 ring-white/10"
                                    : "border-transparent opacity-60"
                            )}
                            title={color}
                        />
                    ))}
                </div>

                {/* GENERATE BUTTON */}
                {designImage && (
                    <div className="absolute bottom-6 right-6 z-30">
                        <Button
                            onClick={handleGenerateMockup}
                            disabled={isGenerating}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-6 py-6 h-auto shadow-[0_0_30px_rgba(79,70,229,0.4)] border-indigo-400/30 border"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5 mr-3" />
                                    Generar Mockup Final
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* MOCKUP RESULT OVERLAY */}
            <AnimatePresence>
                {mockupResult && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-zinc-900 p-2 rounded-[2rem] border border-zinc-800 shadow-2xl max-w-4xl w-full relative overflow-hidden"
                        >
                            <div className="aspect-square relative rounded-[1.8rem] overflow-hidden bg-zinc-950">
                                <NextImage src={mockupResult} alt="Mockup Final" fill className="object-contain" unoptimized />

                                <div className="absolute top-6 right-6 flex gap-3">
                                    <Button
                                        variant="secondary"
                                        className="rounded-full bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md"
                                        onClick={() => window.open(mockupResult, '_blank')}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Ver Full
                                    </Button>
                                    <Button
                                        className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg"
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = mockupResult;
                                            link.download = 'mockup-novamente.png';
                                            link.click();
                                        }}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Descargar
                                    </Button>
                                </div>

                                <button
                                    onClick={() => setMockupResult(null)}
                                    className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center border border-white/10 backdrop-blur-md transition-all"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Tu Mockup Pro</h3>
                                    <p className="text-zinc-400 text-sm">Generado con Imagen 3 por Novamente</p>
                                </div>
                                <Button onClick={() => setMockupResult(null)} variant="outline" className="rounded-full border-zinc-700 text-zinc-300">
                                    Seguir editando
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!designImage && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black/60 backdrop-blur-md text-white px-8 py-4 rounded-full border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center gap-3"
                    >
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        Subí una imagen para empezar la magia
                    </motion.div>
                </div>
            )}
        </div>
    )
}
