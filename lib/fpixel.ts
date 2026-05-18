import { getStoredPixelUser } from "./pixel-user"

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID

type FbqFn = (...args: unknown[]) => void

const getFbq = (): FbqFn | null => {
    if (typeof window === "undefined") return null
    const fbq = (window as unknown as { fbq?: FbqFn }).fbq
    return fbq ?? null
}

/**
 * Merge stored user data (Advanced Matching) into the event options.
 * Lifts Event Match Quality Score by including em/ph/fn/ln/etc on each track.
 */
const enrichWithUser = (options: Record<string, unknown> = {}): Record<string, unknown> => {
    const user = getStoredPixelUser()
    return Object.keys(user).length > 0 ? { ...user, ...options } : options
}

export const pageview = () => {
    const fbq = getFbq()
    if (!fbq) {
        if (typeof window !== "undefined") console.warn("[PIXEL] PageView dropped — fbq not ready")
        return
    }
    const opts = enrichWithUser()
    console.log("[PIXEL] PageView fired")
    if (Object.keys(opts).length > 0) {
        fbq("track", "PageView", opts)
    } else {
        fbq("track", "PageView")
    }
}

export const event = (name: string, options: Record<string, unknown> = {}) => {
    const fbq = getFbq()
    if (!fbq) {
        if (typeof window !== "undefined") console.warn(`[PIXEL] ${name} dropped — fbq not ready`, options)
        return
    }
    const enriched = enrichWithUser(options)
    console.log(`[PIXEL] ${name} fired`, enriched)
    fbq("track", name, enriched)
}

// Custom Helpers
export const viewContent = (options: Record<string, unknown> = {}) => event("ViewContent", options)
export const lead = (options: Record<string, unknown> = {}) => event("Lead", options)
export const purchase = (amount: number, currency = "ARS", options: Record<string, unknown> = {}) =>
    event("Purchase", { value: amount, currency, ...options })
