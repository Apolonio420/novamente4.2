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
  // Reads localStorage 'nm_pixel_user' for Advanced Matching (boosts EMQ score).
  // Registers pixel id in window.__nm_partner_pixels so setPixelUser() can
  // re-init it later when user identifies.
  const lines = [
    `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');`,
    `(function(){var u={};try{var s=localStorage.getItem('nm_pixel_user');if(s)u=JSON.parse(s);}catch(e){}window.__nm_partner_pixels=window.__nm_partner_pixels||[];if(window.__nm_partner_pixels.indexOf('${id}')<0)window.__nm_partner_pixels.push('${id}');if(Object.keys(u).length>0){fbq('init','${id}',u);fbq('track','PageView',u);}else{fbq('init','${id}');fbq('track','PageView');}})();`,
  ]

  if (event) {
    // Merge Advanced Matching user data into custom events too
    const eventDataStr = eventData ? JSON.stringify(eventData) : '{}'
    lines.push(
      `(function(){var u={};try{var s=localStorage.getItem('nm_pixel_user');if(s)u=JSON.parse(s);}catch(e){}var d=Object.assign({},u,${eventDataStr});if(Object.keys(d).length>0){fbq('track','${event}',d);}else{fbq('track','${event}');}})();`,
    )
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
