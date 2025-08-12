import { NextResponse } from "next/server"
import { getRecentImages } from "@/lib/db"

export async function GET() {
  try {
    // Obtener todas las imágenes recientes
    const images = await getRecentImages(20) // Obtener hasta 20 imágenes

    return NextResponse.json({ images })
  } catch (error) {
    console.error("Error fetching images:", error)
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 })
  }
}
