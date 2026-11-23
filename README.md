# MaltaVisions Astro (POC)

Headless Astro frontend for [staging4.maltavisions.com](https://staging4.maltavisions.com/), with WordPress as CMS.

## Locked decisions

- Source of truth: **staging4** MaltaVisions theme
- Forms: keep **Contact Form 7** endpoint
- Hosting: prefer **SiteGround static**; fallback Cloudflare Pages / Netlify / Vercel
- No ACF / no SEO plugins
- Application Password: create when authenticated REST is required

## POC scope

- `/` — Home (WP `content.rendered` + theme CSS/JS)
- `/portfolios/` — Work archive from `portfolio` CPT (19 projects, All/Plugin/Website filters)
- `/portfolio/[slug]/` — Project detail from CPT
- Contact form — Astro markup → CF7 REST (`/wp-json/contact-form-7/v1/contact-forms/66/feedback`)

### Known POC gaps

- Home still uses WP `content.rendered` (not per-block Astro components yet)
- CF7 HTML is not in REST output (preview placeholder) — replaced by `ContactForm.astro`
- Portfolio `plugin|website` type uses title heuristics until post meta is exposed to REST
- Unanswered defaults applied: include floating-links later, drop SG AI chat, privacy-only for terms until a Terms page exists

## Setup

```bash
cd maltavisions-astro
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:4321/

## Environment

| Variable | Purpose |
|---|---|
| `WORDPRESS_API_URL` | WP origin (default staging4) |
| `PUBLIC_SITE_URL` | Canonical base URL |
| `CF7_FORM_ID` | Contact form ID (66 on staging) |
| `REVALIDATE_SECRET` | Shared secret WordPress sends to `/api/revalidate/` |
| `WP_CACHE_TTL_SECONDS` | How long WP REST responses are cached in memory (default 300) |
| `WORDPRESS_APPLICATION_USER` / `WORDPRESS_APPLICATION_PASSWORD` | Optional auth for `content.raw` / menus |

## Live content (WordPress → Astro, no rebuild)

The WordPress-driven pages (`/`, `/about/`, `/our-services/`, `/contact/`, `/portfolios/`, `/portfolio/[slug]/`) render on request (`prerender = false`) on a Node.js server. WP REST responses are cached in memory for `WP_CACHE_TTL_SECONDS`.

When a page or portfolio item is published, updated, unpublished or trashed, the theme calls `POST /api/revalidate/` with the `x-revalidate-secret` header, which clears the cache. The next visit fetches fresh content. A rebuild is only needed when Astro code or CSS changes.

```
WP save page/portfolio → POST https://astro.maltavisions.com/api/revalidate/
  → Astro clears its WP cache → next request renders fresh content
```

### SiteGround Node.js project (GoGeek)

Site Tools → Devs → Node.js for `astro.maltavisions.com`:

- Source: GitHub repo [`mrsajidwork/maltavisions-astro`](https://github.com/mrsajidwork/maltavisions-astro.git) or ZIP upload of this folder (without `node_modules`, `dist`, `.env`)
- Node version: 22 or newer
- Build command: `npm ci && npm run build`
- Start command: `npm start` (runs `node ./dist/server/entry.mjs`, reads `HOST`/`PORT` from the environment)
- Environment variables: `WORDPRESS_API_URL`, `PUBLIC_SITE_URL`, `CF7_FORM_ID`, `REVALIDATE_SECRET`, `WP_CACHE_TTL_SECONDS`

Generate a secret with `openssl rand -hex 32`.

Test:

```bash
curl -X POST -H "x-revalidate-secret: $SECRET" https://astro.maltavisions.com/api/revalidate/
# {"ok":true,"cleared":N,...}
```

### WordPress (staging4 theme)

Theme code: `theme/maltavisions/inc/astro-revalidate.php` (loaded from `functions.php`). Configure in `wp-config.php`:

```php
define( 'MV_ASTRO_REVALIDATE_URL', 'https://astro.maltavisions.com/api/revalidate/' );
define( 'MV_ASTRO_REVALIDATE_SECRET', 'same as REVALIDATE_SECRET' );
```

or in **Settings → Astro Sync**, which also has a **Refresh Astro now** button and shows the result of the last call.

## Next (after POC review)

1. Native Astro components for each `mv/*` block (replace rendered-HTML home)
2. Application Password + block-attribute sync
3. Legal / Floating Links
4. Portfolio `plugin|website` post meta exposed to REST
5. CF7 submit adapter verified end-to-end
6. ~~Live WP content without rebuilds~~ (implemented — SSR on SiteGround Node.js + revalidate webhook)
