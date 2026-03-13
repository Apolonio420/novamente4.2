import React from 'react'
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Carrito | Novamente",
}

export default function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


