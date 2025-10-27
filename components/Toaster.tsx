"use client"

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <>
      <ToastProvider>
        {toasts.map(({ id, title, description, action, ...props }) => (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
      
      {/* Sonner Toaster para mensajes estéticos */}
      <SonnerToaster
        position="top-right"
        richColors
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "border border-zinc-800 bg-zinc-950/90 text-zinc-100",
            title: "text-sm font-medium",
            description: "text-xs text-zinc-400",
            error: "border-red-600/40",
            success: "border-emerald-600/40",
            info: "border-violet-600/40",
          },
        }}
      />
    </>
  )
}
