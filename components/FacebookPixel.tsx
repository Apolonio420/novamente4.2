'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import * as fpixel from '@/lib/fpixel'

const FacebookPixelEvents = () => {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        fpixel.pageview()
    }, [pathname, searchParams])

    return null
}

export default function FacebookPixel() {
    const pixelId = fpixel.FB_PIXEL_ID

    useEffect(() => {
        if (!pixelId && process.env.NODE_ENV === 'development') {
            console.warn('Meta Pixel ID is missing. Check NEXT_PUBLIC_FACEBOOK_PIXEL_ID environment variable.')
        }
    }, [pixelId])

    if (!pixelId) return null

    return (
        <>
            <Script
                id="fb-pixel"
                strategy="afterInteractive"
                src={`https://connect.facebook.net/en_US/fbevents.js`}
                onLoad={() => {
                    ; (window as any).fbq('init', pixelId)
                        ; (window as any).fbq('track', 'PageView')
                }}
            />
            {/* Fallback script in case onLoad doesn't fire as expected or for faster init */}
            <Script
                id="fb-pixel-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
                }}
            />
            <Suspense fallback={null}>
                <FacebookPixelEvents />
            </Suspense>
            <noscript>
                <img
                    height="1"
                    width="1"
                    style={{ display: 'none' }}
                    src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                    alt=""
                />
            </noscript>
        </>
    )
}
