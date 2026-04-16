/**
 * Types for the Novamente Designer Style System
 * Defines interfaces for styles, design requests/results, and mockup operations
 */

export interface StyleDefinition {
  id: string
  name: string
  description: string
  keywords: string
  printOptimized: boolean
  thumbnailPath: string // e.g. /styles/pop-art-comic.png
}

export type GarmentColorway = 'crema' | 'negro' | 'blanco' | 'gris' | 'caramel' | 'marron'
export type PrintArea = 'R1' | 'R2' | 'R3' | 'espalda-completa' | 'pecho-pequeno'

export interface DesignRequest {
  prompt: string
  styleId?: string
  garmentKey?: string // e.g. 'tshirt-black-oversize'
  colorway?: GarmentColorway
  printArea?: PrintArea
}

export interface DesignResult {
  imageUrl: string // data:image/png;base64,... or public URL
  imageId: string
  model: string
  promptUsed: string
  styleApplied?: string
}

export interface MockupRequest {
  designImageUrl: string
  garmentKey: string // e.g. 'tshirt-black-oversize'
  side?: 'front' | 'back'
  stampSize?: 'R1' | 'R2' | 'R3'
}

export interface MockupResult {
  success: boolean
  mockupUrl?: string
  r2Key?: string
  error?: string
}
