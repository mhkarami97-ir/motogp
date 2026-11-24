/**
 * Cloudflare Worker Proxy for MotoGP API (Pulselive)
 * Deployed to: https://motogp-proxy.mhkarami97.workers.dev
 *
 * Proxies calls to https://api.motogp.pulselive.com/motogp/v1
 * and adds CORS headers for frontend access.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    const url = new URL(request.url);

    // Normalize path: strip /motogp/v1 or /v1 prefix if present
    let path = url.pathname;
    if (path.startsWith("/motogp/v1/")) {
      path = path.slice("/motogp/v1".length);
    } else if (path === "/motogp/v1") {
      path = "/";
    } else if (path.startsWith("/v1/")) {
      path = path.slice("/v1".length);
    } else if (path === "/v1") {
      path = "/";
    }

    // Forward to official Pulselive MotoGP API
    const targetUrl = `https://api.motogp.pulselive.com/motogp/v1${path}${url.search}`;

    const headers = new Headers();
    headers.set(
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    );
    headers.set("Accept", "application/json, text/plain, */*");
    // CloudFront WAF requires legitimate Origin/Referer to bypass 403 Forbidden
    headers.set("Origin", "https://www.motogp.com");
    headers.set("Referer", "https://www.motogp.com/");

    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers,
      });

      const responseHeaders = new Headers(response.headers);
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        responseHeaders.set(key, value);
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch from upstream MotoGP API",
          details: String(err),
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...CORS_HEADERS,
          },
        }
      );
    }
  },
};
