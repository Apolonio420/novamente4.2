import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
    try {
        const { imageUrl } = await request.json()

        if (!imageUrl) {
            return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
        }

        // 1. Get image data
        let base64Data: string
        let mimeType = "image/png"

        if (imageUrl.startsWith('data:')) {
            const parts = imageUrl.split(',')
            mimeType = parts[0].split(':')[1].split(';')[0]
            base64Data = parts[1]
        } else {
            const imageResponse = await fetch(imageUrl)
            if (!imageResponse.ok) throw new Error("Failed to fetch image")
            const arrayBuffer = await imageResponse.arrayBuffer()
            base64Data = Buffer.from(arrayBuffer).toString('base64')
        }

        // 2. Process with Gemini image model — quitar fondo NUNCA necesita pro.
        // Default flash-image; override con GEMINI_REMOVE_BG_MODEL para rollback.
        const removeBgModel = process.env.GEMINI_REMOVE_BG_MODEL ?? "gemini-2.5-flash-image"
        const model = genAI.getGenerativeModel({ model: removeBgModel })

        const prompt = `Perform professional background removal and "Stamp-ify" this design.

        INSTRUCTIONS:
        1. Remove the background COMPLETELY.
        2. Isolate the main subject.
        3. Professional Silk-Screen Look: Enhance the edges to be clean, slightly simplify complex textures to look like high-quality textile ink, and ensure colors are vibrant but realistic for a print.
        4. "Vender más": Ensure the resulting design looks premium, premium-quality, and ready for a physical garment store.

        Return ONLY the isolated subject with a transparent background as an image part.
        If you cannot remove the background, return the best isolated version possible.`

        const result = await model.generateContent([
            {
                text: prompt
            },
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            },
        ])

        const response = await result.response
        let processedBase64 = base64Data
        let hasBackgroundRemoved = false

        // Extract image from response parts
        const parts = response.candidates?.[0]?.content?.parts
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    processedBase64 = part.inlineData.data
                    hasBackgroundRemoved = true
                    break
                }
            }
        }

        if (!hasBackgroundRemoved) {
            console.warn("Gemini 3 did not return an image part. Response text:", response.text())
        }

        return NextResponse.json({
            success: true,
            imageBase64: hasBackgroundRemoved ? `data:image/png;base64,${processedBase64}` : imageUrl,
            hasBackgroundRemoved
        })

    } catch (error) {
        console.error("Error in magic-remove-bg (Gemini 3):", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to remove background",
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        )
    }
}
