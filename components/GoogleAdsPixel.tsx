'use client'

import Script from 'next/script'
import { GOOGLE_ADS_ID } from '@/lib/gads'

export default function GoogleAdsPixel() {
  return (
    <>
      <Script
        id="gtag-src"
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ADS_ID}');
          `,
        }}
      />
    </>
  )
}
