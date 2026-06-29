import { uploadToR2, generateImageName } from "@/lib/cloudflare-r2"
import { getGarmentMapping } from "@/lib/garment-mappings"
import { v4 as uuidv4 } from "uuid"
import { normalizeR2Key } from "@/lib/r2"

// Dynamic import for canvas
let createCanvas: any, loadImage: any;
try {
    const canvas = require('@napi-rs/canvas');
    createCanvas = canvas.createCanvas;
    loadImage = canvas.loadImage;
} catch (e) {
    try {
        const canvas = require('canvas');
        createCanvas = canvas.createCanvas;
        loadImage = canvas.loadImage;
    } catch (e2) {
        console.warn("Canvas not available");
    }
}

interface GenerateMockupParams {
    designImageUrl: string
    garmentType: string
    garmentColor: string
    side: "front" | "back"
    size?: "R1" | "R2" | "R3"
    prompt?: string
    originalImageId?: string
}

export async function generateMockup({
    designImageUrl,
    garmentType,
    garmentColor,
    side,
    size = 'R3',
    prompt,
    originalImageId
}: GenerateMockupParams) {
    console.log("🎨 MOCKUP-SERVICE: Generating...", { garmentType, garmentColor })

    // 1. Mapping
    const mapping = getGarmentMapping(garmentType, garmentColor, side)
    if (!mapping || mapping.garmentPath === 'fallback') {
        throw new Error(`No mapping for ${garmentType}-${garmentColor}-${side}`)
    }

    // 2. Fetch Design
    let designBuffer: Buffer
    if (designImageUrl.startsWith('http')) {
        const res = await fetch(designImageUrl)
        const ab = await res.arrayBuffer()
        designBuffer = Buffer.from(ab)
    } else {
        // TODO: Handle R2 Keys internal fetching if needed, for now assume URL
        throw new Error("Only HTTP URLs supported for internal generation MVP")
    }

    // 3. Fetch Garment
    const garmentUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${mapping.garmentPath}`
    const garmentRes = await fetch(garmentUrl)
    if (!garmentRes.ok) throw new Error("Failed to fetch garment image")
    const garmentBuffer = Buffer.from(await garmentRes.arrayBuffer())

    // 4. Canvas Composition
    if (!createCanvas || !loadImage) throw new Error("Canvas not initialized")

    const canvas = createCanvas(400, 500)
    const ctx = canvas.getContext('2d')

    // Draw Garment
    const garmentImg = await loadImage(garmentBuffer)
    ctx.drawImage(garmentImg, 0, 0, 400, 500)

    // Draw Design
    const designImg = await loadImage(designBuffer)
    const { x: mapX, y: mapY, width: mapWidth, height: mapHeight } = mapping.coordinates

    // Scale
    let scaleFactor = 1.0
    switch (size) {
        case 'R1': scaleFactor = 0.35; break;
        case 'R2': scaleFactor = 0.65; break;
        default: scaleFactor = 1.0; break;
    }

    const drawWidth = mapWidth * scaleFactor
    const drawHeight = mapHeight * scaleFactor
    const drawX = mapX + (mapWidth - drawWidth) / 2
    const drawY = mapY + (mapHeight - drawHeight) / 2

    ctx.drawImage(designImg, drawX, drawY, drawWidth, drawHeight)

    // 5. Upload to R2
    const finalBuffer = canvas.toBuffer('image/png')
    const baseImageId = originalImageId || uuidv4()
    const mockupId = uuidv4()
    const description = prompt ? prompt.split(' ').slice(0, 2).join(' ') : 'design'
    const token = `${garmentType}_${garmentColor}_${side}`
    const fileName = generateImageName(description, token)

    const r2Key = `images/${baseImageId}/mockups/${mockupId}/${fileName}`
    const publicUrl = await uploadToR2(finalBuffer, r2Key, "image/png")

    return {
        publicUrl,
        mockupId
    }
}
