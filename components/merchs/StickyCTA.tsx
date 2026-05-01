"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function StickyCTA() {
    const [show, setShow] = useState(false)

    useEffect(() => {
        function onScroll() {
            setShow(window.scrollY > 600)
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        onScroll()
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    return (
        <div
            className={`md:hidden fixed inset-x-0 bottom-0 z-40 transition-transform duration-200 ${
                show ? "translate-y-0" : "translate-y-full"
            }`}
        >
            <div className="mx-3 mb-3 rounded-2xl border border-violet-200 bg-white shadow-2xl shadow-violet-500/20 p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 leading-tight">Plan Gratis · sin tarjeta</p>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                        Lanzá tu marca hoy
                    </p>
                </div>
                <Link
                    href="/partners/join"
                    className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 whitespace-nowrap"
                >
                    Empezá gratis
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
    )
}
