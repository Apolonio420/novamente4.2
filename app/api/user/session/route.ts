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
      console.log("Created new session ID:", sessionId)
    }

    const res = NextResponse.json({
      sessionId,
      isAuthenticated: false,
      expiresIn: 30 * 24 * 60 * 60,
    })

    // Setear cookie persistente (30 días)
    res.headers.set(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax; HttpOnly`
    )

    return res
  } catch (error) {
    console.error("Error getting session:", error)
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
  }
}
