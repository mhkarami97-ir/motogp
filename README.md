# MotoGP Iran Dashboard

داشبورد اطلاعات موتوجی‌پی به زبان فارسی، ساخته‌شده با Vue 3، TypeScript و Tailwind CSS.

**آدرس هدف:** [motogp.mhkarami97.ir](https://motogp.mhkarami97.ir)

## منبع داده: MotoGP API

این پروژه از API رسمی MotoGP (Pulselive) استفاده می‌کند.

- Base URL: `https://api.pulselive.com/motogp/v1`
- داده‌های تاریخی فصل‌های گذشته در دسترس هستند
- endpoint‌های `standing` بر اساس سال کار می‌کنند

## اجرای محلی

```bash
npm install
npm run dev
```

## معماری

- **Repository Pattern** — `IMotoGPRepository`/`PulseliveRepository`
- **Singleton** — `services/httpClient.ts`
- **Strategy** — `services/polling.ts`
- **Facade** — Pinia stores

## دیپلوی

GitHub Actions (`.github/workflows/deploy.yml`) روی هر push به `main`، بعد از type-check و build، خروجی `dist/` را روی شاخه `gh-pages` منتشر می‌کند.
