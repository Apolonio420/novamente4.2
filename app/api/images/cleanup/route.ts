import { NextResponse } from "next/server"
import { cleanupExpiredImages } from "@/lib/db"

export async function GET() {
  try {
    const summary = await cleanupExpiredImages()
    return NextResponse.json(summary)
  } catch (error) {
    console.error("❌ Error in cleanup route:", error)
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
  }
}
