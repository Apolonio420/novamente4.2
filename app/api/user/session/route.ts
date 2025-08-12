import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

// Nombre de la cookie para el ID de sesión
const SESSION_COOKIE_NAME = "novamente_session_id"

export async function GET() {
  try {
    const cookieStore = cookies()
    let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

    // Si no hay ID de sesión, crear uno nuevo
    if (!sessionId) {
      sessionId = uuidv4()

      // En una implementación real, aquí se guardaría el ID de sesión en la base de datos
      console.log("Created new session ID:", sessionId)
    }

    return NextResponse.json({
      sessionId,
      isAuthenticated: false, // En una implementación real, esto dependería de si el usuario ha iniciado sesión
      expiresIn: 30 * 24 * 60 * 60, // 30 días en segundos
    })
  } catch (error) {
    console.error("Error getting session:", error)
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
  }
}
