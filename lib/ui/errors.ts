import { toast } from "sonner"

type KnownError =
  | "BASE_NOT_FOUND"
  | "REMOVE_BG_FAILED"
  | "GENERATION_TIMEOUT"
  | "GENERATION_FAILED"
  | "NETWORK"
  | "UNKNOWN"

interface NovaError {
  code: KnownError
  key?: string
  message: string
}

export function handleError(err: unknown) {
  let e: NovaError = { code: "UNKNOWN", message: "Error inesperado." }

  if (typeof err === "string") {
    e.message = err
  } else if (err instanceof Error) {
    e.message = err.message
  } else if (typeof err === "object" && err && "error" in err) {
    const anyErr = err as any
    e = {
      code: anyErr.error ?? "UNKNOWN",
      key: anyErr.key,
      message:
        anyErr.message ??
        (anyErr.error === "BASE_NOT_FOUND"
          ? `No se encontró la base de la prenda (${anyErr.key})`
          : "Ocurrió un error inesperado."),
    }
  }

  const icon =
    e.code === "BASE_NOT_FOUND"
      ? "🧩"
      : e.code === "REMOVE_BG_FAILED"
      ? "🎨"
      : e.code === "NETWORK"
      ? "🌐"
      : e.code === "GENERATION_TIMEOUT"
      ? "⏱️"
      : "⚠️"

  toast.error(`${icon} ${e.message}`, {
    description:
      e.code === "BASE_NOT_FOUND"
        ? "Verificá la prenda y color seleccionados."
        : e.code === "REMOVE_BG_FAILED"
        ? "Intentá nuevamente o cambiá la imagen."
        : e.code === "GENERATION_TIMEOUT"
        ? "El servidor tardó más de lo esperado."
        : e.code === "GENERATION_FAILED"
        ? "No se pudo generar la imagen."
        : undefined,
    duration: 5000,
  })

  console.error("[NovaError]", e)
}

export function handleSuccess(message: string, description?: string) {
  toast.success(`✅ ${message}`, {
    description,
    duration: 3000,
  })
}

export function handleInfo(message: string, description?: string) {
  toast.info(`ℹ️ ${message}`, {
    description,
    duration: 3000,
  })
}

