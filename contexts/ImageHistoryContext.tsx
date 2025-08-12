"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface ImageHistoryItem {
  id: string
  url: string
  prompt: string
  timestamp: number
}

interface ImageHistoryContextType {
  imageHistory: ImageHistoryItem[]
  addImage: (image: ImageHistoryItem) => void
  clearHistory: () => void
}

const ImageHistoryContext = createContext<ImageHistoryContextType | undefined>(undefined)

export function ImageHistoryProvider({ children }: { children: ReactNode }) {
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([])

  const addImage = (image: ImageHistoryItem) => {
    setImageHistory((prev) => [image, ...prev])
  }

  const clearHistory = () => {
    setImageHistory([])
  }

  return (
    <ImageHistoryContext.Provider value={{ imageHistory, addImage, clearHistory }}>
      {children}
    </ImageHistoryContext.Provider>
  )
}

export function useImageHistory() {
  const context = useContext(ImageHistoryContext)
  if (context === undefined) {
    throw new Error("useImageHistory must be used within an ImageHistoryProvider")
  }
  return context
}
