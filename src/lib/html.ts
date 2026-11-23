import { wpOrigin } from "./wordpress/client";

const WP_HOSTS = ["https://staging4.maltavisions.com", "http://staging4.maltavisions.com"];

/** Basic sanitization: drop scripts/event handlers; keep Gutenberg/CF7 markup. */
export function sanitizeWpHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

/**
 * Rewrite WordPress HTML for the Astro site:
 * - Theme bundled images → local `/images/...`
 * - Media Library uploads stay on the WP origin
 * - Internal page links become local routes
 */
export function localizeWpHtml(html: string): string {
  let out = sanitizeWpHtml(html);
  const origin = wpOrigin();
  // Staging + live production share the same path structure; rewrite both.
  const hosts = [
    ...new Set([
      ...WP_HOSTS,
      origin,
      "https://maltavisions.com",
      "http://maltavisions.com",
      "https://www.maltavisions.com",
      "http://www.maltavisions.com",
    ]),
  ];

  // Theme assets shipped with the theme → Astro public/images
  out = out.replace(
    /(?:https?:\/\/[^/"'\s]+)?\/wp-content\/themes\/maltavisions\/assets\/images\//gi,
    "/images/",
  );

  // Relative Media Library paths → absolute WP URLs
  out = out.replace(/(["'(])\/wp-content\/uploads\//g, `$1${origin}/wp-content/uploads/`);

  // Internal navigation links → local Astro routes (do not strip asset hosts)
  for (const host of hosts) {
    out = out.replaceAll(`${host}/portfolios`, "/portfolios");
    out = out.replaceAll(`${host}/portfolio/`, "/portfolio/");
    out = out.replaceAll(`${host}/our-services`, "/our-services");
    out = out.replaceAll(`${host}/about`, "/about");
    out = out.replaceAll(`${host}/contact`, "/contact");
    out = out.replaceAll(`${host}/privacy-policy`, "/privacy-policy");
    out = out.replaceAll(`${host}/floating-links`, "/floating-links");
    out = out.replaceAll(`href="${host}/"`, 'href="/"');
    out = out.replaceAll(`href='${host}/'`, "href='/'");
    out = out.replaceAll(`${host}/#`, "/#");
  }

  // SpecterAI has no portfolio CPT yet — point "Seen in" / work cards at the home AI case study.
  out = out.replace(
    /(<a\b[^>]*\bhref=["'])(?:\/portfolios\/?|work\.html)(["'][^>]*>)\s*SpecterAI/gi,
    `$1/#ai-title$2SpecterAI`,
  );
  out = out.replace(
    /(<a\b[^>]*\bhref=["'])(?:\/portfolios\/?|work\.html)(["'][^>]*aria-label=["'][^"']*SpecterAI)/gi,
    `$1/#ai-title$2`,
  );

  // Services "Custom websites" proof still ships as an editor placeholder from WP.
  out = out.replace(
    /<li>\s*<em class="pg-ph">\[Add a project\]<\/em>\s*<\/li>/gi,
    [
      '<li><a href="/portfolio/amaya-sales/">Amaya Sales</a></li>',
      '<li><a href="/portfolio/meals-on-wheels/">Meals on Wheels</a></li>',
      '<li><a href="/portfolio/kind-of-famous/">Kind of Famous</a></li>',
    ].join(""),
  );

  // Jump chips all pointed at #sv-pillars; send each to its panel.
  out = out.replace(
    /(<ul class="sv-jump"[^>]*>)([\s\S]*?)(<\/ul>)/i,
    (_full, open: string, inner: string, close: string) => {
      const targets = ["#sv-panel-wp", "#sv-panel-custom", "#sv-panel-ai"];
      let i = 0;
      const next = inner.replace(/href="#sv-pillars"/g, () => `href="${targets[i++] || "#sv-pillars"}"`);
      return open + next + close;
    },
  );

  return out;
}

export function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}
