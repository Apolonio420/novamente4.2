import { NextResponse } from "next/server"

export async function GET() {
    const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID

    return NextResponse.json({
        present: !!pixelId,
        pixelId: pixelId || null,
        envReference: "NEXT_PUBLIC_FACEBOOK_PIXEL_ID",
        nodeEnv: process.env.NODE_ENV,
        status: pixelId ? "Loaded" : "Missing",
    })
}
