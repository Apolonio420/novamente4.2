export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID

type FbqFn = (...args: unknown[]) => void

const getFbq = (): FbqFn | null => {
    if (typeof window === "undefined") return null
    const fbq = (window as unknown as { fbq?: FbqFn }).fbq
    return fbq ?? null
}

export const pageview = () => {
    const fbq = getFbq()
    if (!fbq) {
        if (typeof window !== "undefined") console.warn("[PIXEL] PageView dropped — fbq not ready")
        return
    }
    console.log("[PIXEL] PageView fired")
    fbq("track", "PageView")
}

export const event = (name: string, options: Record<string, unknown> = {}) => {
    const fbq = getFbq()
    if (!fbq) {
        if (typeof window !== "undefined") console.warn(`[PIXEL] ${name} dropped — fbq not ready`, options)
        return
    }
    console.log(`[PIXEL] ${name} fired`, options)
    fbq("track", name, options)
}

// Custom Helpers
export const viewContent = (options: Record<string, unknown> = {}) => event("ViewContent", options)
export const lead = (options: Record<string, unknown> = {}) => event("Lead", options)
export const purchase = (amount: number, currency = "ARS", options: Record<string, unknown> = {}) =>
    event("Purchase", { value: amount, currency, ...options })
