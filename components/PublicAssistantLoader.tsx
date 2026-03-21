"use client"

import dynamic from "next/dynamic"

const PublicAssistant = dynamic(
  () => import("@/components/PublicAssistant").then(m => m.PublicAssistant),
  { ssr: false }
)

export function PublicAssistantLoader() {
  return <PublicAssistant />
}
