import { NextResponse } from "next/server"
import { checkGenerationLimit } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "Session ID is required and must be a string" }, { status: 400 })
    }

    const result = await checkGenerationLimit(sessionId)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("Error in generation-limit API:", error)

    // Always return JSON, never HTML
    return NextResponse.json(
      {
        error: "Internal server error",
        limitReached: false,
        count: 0,
      },
      { status: 500 },
    )
  }
}
