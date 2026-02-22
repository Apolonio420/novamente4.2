import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    const debugKey = process.env.DEBUG_KEY || "novamente-debug-2024"

    const isDev = process.env.NODE_ENV === "development"
    const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID

    // Allow in dev OR if correct key is provided in prod
    if (!isDev && key !== debugKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
        present: !!pixelId,
        pixelIdLast4: pixelId ? pixelId.slice(-4) : null,
        envNameUsed: "NEXT_PUBLIC_FACEBOOK_PIXEL_ID",
        nodeEnv: process.env.NODE_ENV,
        status: pixelId ? "Loaded" : "Missing",
    })
}
