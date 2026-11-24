# سرور واسط Cloudflare Worker برای MotoGP (motogp-proxy)

این ورکر برای دور زدن محدودیت‌های امنیتی (CORS) و فیلتر CloudFront ای‌پی‌آی رسمی MotoGP (Pulselive) طراحی شده است:
- دامنه رسمی: `https://api.motogp.pulselive.com/motogp/v1`
- آدرس ورکر: `https://motogp-proxy.mhkarami97.workers.dev`

## نحوه انتشار (Deploy)

در ترمینال همین پوشه:
```bash
cd cloudflare-worker
npx wrangler deploy
```
یا در ریشه پروژه:
```bash
npx wrangler deploy --config cloudflare-worker/wrangler.toml
```
