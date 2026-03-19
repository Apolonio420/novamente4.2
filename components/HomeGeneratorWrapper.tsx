"use client"

import { useState, useEffect } from "react"
import { ImageGenerator } from "@/components/ImageGenerator"
import { getClientSupabase } from "@/lib/auth-client"

/**
 * Client-side wrapper that loads user/session data on the browser
 * instead of blocking SSR. This allows the homepage to be statically
 * rendered (instant TTFB) while dynamic data loads in the background.
 */
export function HomeGeneratorWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [generationCount, setGenerationCount] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function loadUserData() {
      try {
        const supabase = getClientSupabase()
        if (!supabase) {
          setReady(true)
          return
        }

        const { data } = await supabase.auth.getUser()
        const user = data?.user

        if (user) {
          setIsAuthenticated(true)
          setGenerationCount(0) // authenticated users have no limit
        } else {
          // For guest users, check generation count from cookie session
          const sessionId = document.cookie
            .split("; ")
            .find((row) => row.startsWith("novamente_session_id="))
            ?.split("=")[1]

          if (sessionId) {
            const { count } = await supabase
              .from("images")
              .select("id", { count: "exact", head: true })
              .or(`session_id.eq.${sessionId}`)

            setGenerationCount(typeof count === "number" ? count : 0)
          }
        }
      } catch (error) {
        // Silently continue — ImageGenerator works fine with defaults
      } finally {
        setReady(true)
      }
    }

    loadUserData()
  }, [])

  // Render immediately with defaults, update when data arrives
  return (
    <ImageGenerator
      initialGenerationCount={generationCount}
      isAuthenticated={isAuthenticated}
    />
  )
}
