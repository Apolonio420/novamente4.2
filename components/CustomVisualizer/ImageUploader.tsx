// @ts-nocheck
"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, Image as ImageIcon, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface ImageUploaderProps {
    onImageSelect: (file: File) => void
    selectedImage: string | null
    onRemoveImage: () => void
    isProcessing: boolean
    onRemoveBackground: () => void
    hasBackgroundRemoved: boolean
}

export function ImageUploader({
    onImageSelect,
    selectedImage,
    onRemoveImage,
    isProcessing,
    onRemoveBackground,
    hasBackgroundRemoved
}: ImageUploaderProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onImageSelect(acceptedFiles[0])
        }
    }, [onImageSelect])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1,
        disabled: isProcessing
    })

    return (
        <div className="w-full space-y-4">
            <AnimatePresence mode="wait">
                {!selectedImage ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        {...getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ease-in-out hover:border-primary/50 hover:bg-primary/5",
                            isDragActive ? "border-primary bg-primary/10 scale-[1.02]" : "border-zinc-800 bg-zinc-900/30",
                            isProcessing && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-zinc-400 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-medium text-zinc-200">
                                    {isDragActive ? "¡Soltala acá!" : "Subí tu diseño"}
                                </p>
                                <p className="text-sm text-zinc-500">
                                    Arrastrá y soltá o hacé click para elegir
                                </p>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">PNG</span>
                                <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">JPG</span>
                                <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">WEBP</span>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50 group"
                    >
                        <div className="aspect-square relative w-full max-h-[300px] flex items-center justify-center p-4">
                            {/* Checkerboard background for transparency */}
                            <div className="absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 0h10v10H0V0zm10 10h10v10H10V10z'/%3E%3C/g%3E%3C/svg%3E")`
                                }}
                            />
                            <img
                                src={selectedImage}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain relative z-10 drop-shadow-xl"
                            />
                        </div>

                        <div className="absolute top-2 right-2 flex gap-2">
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onRemoveImage()
                                }}
                                disabled={isProcessing}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
                            <Button
                                onClick={onRemoveBackground}
                                disabled={isProcessing || hasBackgroundRemoved}
                                className={cn(
                                    "w-full relative overflow-hidden transition-all",
                                    hasBackgroundRemoved
                                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
                                        : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20"
                                )}
                                variant={hasBackgroundRemoved ? "outline" : "default"}
                            >
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Remover Fondo con IA
                                </>
                            </Button>
                            {hasBackgroundRemoved && (
                                <p className="text-xs text-center text-emerald-500 mt-2 animate-in fade-in slide-in-from-bottom-1">
                                    ✨ Tu imagen está lista para estampar
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
