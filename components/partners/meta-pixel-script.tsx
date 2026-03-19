'use client'

import Script from 'next/script'

interface MetaPixelScriptProps {
  pixelId: string
  event?: string
  eventData?: Record<string, unknown>
}

/**
 * Client component that renders the Meta Pixel base code + optionally fires an event.
 * Uses next/script with afterInteractive strategy for optimal loading.
 */
export default function MetaPixelScript({
  pixelId,
  event,
  eventData,
}: MetaPixelScriptProps) {
  if (!pixelId || !/^\d+$/.test(pixelId.trim())) return null

  const id = pixelId.trim()

  // Build the inline script: init pixel + PageView + optional custom event
  const lines = [
    `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');`,
    `fbq('init','${id}');`,
    `fbq('track','PageView');`,
  ]

  if (event) {
    if (eventData && Object.keys(eventData).length > 0) {
      lines.push(`fbq('track','${event}',${JSON.stringify(eventData)});`)
    } else {
      lines.push(`fbq('track','${event}');`)
    }
  }

  return (
    <>
      <Script
        id={`meta-pixel-${id}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: lines.join('\n') }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
