export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID

export const pageview = () => {
    if (typeof window !== "undefined" && (window as any).fbq) {
        ; (window as any).fbq("track", "PageView")
    }
}

// https://developers.facebook.com/docs/facebook-pixel/advanced/
export const event = (name: string, options = {}) => {
    if (typeof window !== "undefined" && (window as any).fbq) {
        ; (window as any).fbq("track", name, options)
    }
}

// Custom Helpers
export const viewContent = (options = {}) => event("ViewContent", options)
export const lead = (options = {}) => event("Lead", options)
export const purchase = (amount: number, currency = "ARS", options = {}) =>
    event("Purchase", { value: amount, currency, ...options })
