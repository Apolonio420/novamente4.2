/**
 * Meta Pixel code generation utilities.
 * Generates script snippets that can be injected into partner storefronts.
 */

/**
 * Returns the Meta Pixel base code as a script tag string.
 * This is the standard fbevents.js snippet from Meta.
 */
export function generatePixelSnippet(pixelId: string): string {
  if (!pixelId || !/^\d+$/.test(pixelId.trim())) {
    throw new Error('Invalid Meta Pixel ID: must be numeric')
  }

  const id = pixelId.trim()

  return `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`
}

/**
 * Returns an fbq() call string for a specific event.
 * Standard events: ViewContent, AddToCart, Purchase, Lead, CompleteRegistration, etc.
 */
export function generatePixelEvent(
  event: string,
  data?: Record<string, unknown>,
): string {
  if (!event) throw new Error('Event name is required')

  if (data && Object.keys(data).length > 0) {
    return `fbq('track', '${event}', ${JSON.stringify(data)});`
  }

  return `fbq('track', '${event}');`
}
