import React from 'react'
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checkout | Novamente",
  robots: { index: false, follow: false },
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


