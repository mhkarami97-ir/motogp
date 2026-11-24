/**
 * Cloudflare Worker — پراکسی برای api.motogp.pulselive.com
 * رفع خطای CORS و هدرهای کلودفرانت Pulselive
 */

const UPSTREAM_BASE = 'https://api.motogp.pulselive.com/motogp/v1'
const SPOOFED_REFERER = 'https://www.motogp.com/'
const SPOOFED_ORIGIN = 'https://www.motogp.com'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '*'

    // پاسخ کامل به پیش‌پرواز CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      })
    }

    const url = new URL(request.url)

    // نرمال‌سازی مسیر (حذف پیشوندهای احتمالی /api یا /v1 یا /motogp/v1)
    let path = url.pathname
    if (path.startsWith('/api/')) path = path.slice(4)
    if (path.startsWith('/motogp/v1/')) path = path.slice(10)
    if (path.startsWith('/v1/')) path = path.slice(3)

    const upstreamUrl = `${UPSTREAM_BASE}${path.startsWith('/') ? path : '/' + path}${url.search}`

    try {
      const upstreamResponse = await fetch(upstreamUrl, {
        method: request.method,
        headers: {
          Accept: 'application/json, text/plain, */*',
          Referer: SPOOFED_REFERER,
          Origin: SPOOFED_ORIGIN,
          'User-Agent': USER_AGENT,
        },
      })

      const responseHeaders = new Headers(upstreamResponse.headers)
      for (const [key, value] of Object.entries(corsHeaders(origin))) {
        responseHeaders.set(key, value)
      }

      // فقط پاسخ‌های موفق کش شوند تا خطای ۴۰۳ یا ۵۰۰ کش نشود
      if (upstreamResponse.status === 200) {
        responseHeaders.set('Cache-Control', 'public, max-age=300')
      } else {
        responseHeaders.set('Cache-Control', 'no-store')
      }

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: responseHeaders,
      })
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: 'Upstream fetch failed',
          message: String(err),
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(origin),
            'Cache-Control': 'no-store',
          },
        },
      )
    }
  },
}

function corsHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}
