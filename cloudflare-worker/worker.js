/**
 * Cloudflare Worker Proxy for MotoGP API (Pulselive)
 * Fixes CloudFront 403 Forbidden caused by Origin mismatch.
 */
export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    // Forward path and search query to official Pulselive MotoGP API
    const targetUrl = `https://api.motogp.pulselive.com/motogp/v1${url.pathname}${url.search}`;

    const headers = new Headers();
    headers.set(
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    );
    headers.set("Accept", "application/json");
    // CloudFront WAF on api.motogp.pulselive.com blocks requests with unexpected Origin.
    // Overriding Origin & Referer to official motogp domain resolves the 403 block.
    headers.set("Origin", "https://www.motogp.com");
    headers.set("Referer", "https://www.motogp.com/");

    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers,
      });

      const responseHeaders = new Headers(response.headers);
      for (const [key, value] of Object.entries(corsHeaders)) {
        responseHeaders.set(key, value);
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Upstream fetch failed", details: String(err) }),
        {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  },
};
