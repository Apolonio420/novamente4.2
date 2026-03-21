"use client"

import dynamic from "next/dynamic"

const EmailCapturePopup = dynamic(
  () => import("@/components/EmailCapturePopup").then(m => m.EmailCapturePopup),
  { ssr: false }
)

export function EmailCaptureLoader() {
  return <EmailCapturePopup />
}
