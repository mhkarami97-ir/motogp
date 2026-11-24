/**
 * Cloudflare Worker — پراکسی ضد تحریم و بای‌پس ۴۰۳ برای MotoGP
 *
 * علت بروز خطای 403 قبلی:
 * کلودفرانتِ سرور رسمی (api.motogp.pulselive.com) رنج آی‌پی‌های سرورهای کلودفلر
 * را از طریق AWS WAF مسدود (403 Request blocked) کرده است.
 *
 * راه‌حل:
 * ۱. استفاده از آپ‌استریم اصلی و معتبر (motogp-api-swart.vercel.app) که بدون بلاک کلودفرانت کار می‌کند.
 * ۲. فال‌بک خودکار به سرور رسمی در صورت بروز هرگونه مشکل یا قطعی.
 * ۳. ارسال کامل هدرهای CORS برای motogp.mhkarami97.ir و تست محلی.
 * ۴. کش کردن پاسخ‌های موفق (status 200) به مدت ۵ دقیقه برای سرعت بالاتر.
 */

const PRIMARY_UPSTREAM = 'https://motogp-api-swart.vercel.app/motogp/v1'
const FALLBACK_UPSTREAM = 'https://api.motogp.pulselive.com/motogp/v1'
const SPOOFED_REFERER = 'https://www.motogp.com/'
const SPOOFED_ORIGIN = 'https://www.motogp.com'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '*'

    // پاسخ به درخواست‌های پیش‌پرواز CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      })
    }

    const url = new URL(request.url)

    // نرمال‌سازی مسیر (حذف پیشوندهای اضافی /api یا /motogp/v1 یا /v1 در صورت وجود)
    let path = url.pathname
    if (path.startsWith('/api/')) path = path.slice(4)
    if (path.startsWith('/motogp/v1/')) path = path.slice(10)
    if (path.startsWith('/v1/')) path = path.slice(3)
    if (!path.startsWith('/')) path = '/' + path

    const search = url.search

    // تلاش اول: سرور پرایمری (Vercel OpenAPI Mirror بدون بلاک ۴۰۳ کلودفرانت)
    let response = await fetchUpstream(`${PRIMARY_UPSTREAM}${path}${search}`, request.method)

    // در صورتی که سرور اول در دسترس نبود یا خطای ۵۰۰ به بالا داد، تلاش فال‌بک با سرور رسمی
    if (!response || response.status >= 500) {
      try {
        const fallbackRes = await fetchUpstream(`${FALLBACK_UPSTREAM}${path}${search}`, request.method, true)
        if (fallbackRes && fallbackRes.status < 500) {
          response = fallbackRes
        }
      } catch {
        // نادیده گرفتن خطای فال‌بک
      }
    }

    if (!response) {
      return new Response(
        JSON.stringify({ error: 'All upstreams failed' }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(origin),
            'Cache-Control': 'no-store',
          },
        }
      )
    }

    // بازنویسی هدرهای پاسخ برای اضافه کردن CORS
    const responseHeaders = new Headers(response.headers)
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      responseHeaders.set(key, value)
    }

    // کش کردن در مرورگر و کلودفلر فقط در صورت موفقیت
    if (response.status === 200) {
      responseHeaders.set('Cache-Control', 'public, max-age=300')
    } else {
      responseHeaders.set('Cache-Control', 'no-store')
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  },
}

async function fetchUpstream(targetUrl, method, spoofHeaders = false) {
  try {
    const headers = {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': USER_AGENT,
    }

    if (spoofHeaders) {
      headers['Referer'] = SPOOFED_REFERER
      headers['Origin'] = SPOOFED_ORIGIN
    }

    const res = await fetch(targetUrl, {
      method,
      headers,
    })
    return res
  } catch {
    return null
  }
}

function corsHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}
