import { serverEnv } from "../env";

const DEFAULT_ORIGIN = "https://staging4.maltavisions.com";
const DEFAULT_CACHE_TTL_SECONDS = 300;

export function wpOrigin(): string {
  return (serverEnv("WORDPRESS_API_URL") || DEFAULT_ORIGIN).replace(/\/$/, "");
}

export function wpApiRoot(): string {
  return `${wpOrigin()}/wp-json`;
}

type FetchOptions = {
  searchParams?: Record<string, string | number | undefined>;
  auth?: boolean;
};

type CacheEntry = { expires: number; value: Promise<unknown> };

// Process-wide: one Node process serves every request, so this is shared
// across visitors until it expires or /api/revalidate clears it.
const cache = new Map<string, CacheEntry>();

function cacheTtlMs(): number {
  const seconds = Number(serverEnv("WP_CACHE_TTL_SECONDS") ?? DEFAULT_CACHE_TTL_SECONDS);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : DEFAULT_CACHE_TTL_SECONDS * 1000;
}

export function clearWpCache(): number {
  const size = cache.size;
  cache.clear();
  return size;
}

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const ttl = cacheTtlMs();
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.value as Promise<T>;

  const value = load();
  cache.set(key, { expires: now + ttl, value });
  // Never keep a failed request; the next visitor should retry WordPress.
  value.catch(() => {
    if (cache.get(key)?.value === value) cache.delete(key);
  });
  return value;
}

function authHeader(): HeadersInit {
  const user = serverEnv("WORDPRESS_APPLICATION_USER");
  const pass = serverEnv("WORDPRESS_APPLICATION_PASSWORD");
  if (!user || !pass) return {};
  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

function buildUrl(path: string, searchParams?: FetchOptions["searchParams"]): URL {
  const url = new URL(path.startsWith("http") ? path : `${wpApiRoot()}${path}`);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }
  return url;
}

async function request(url: URL, auth?: boolean): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MaltaVisionsAstro/0.1 (+https://maltavisions.com)",
      ...(auth ? authHeader() : {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WordPress API ${response.status} for ${url.pathname}: ${body.slice(0, 200)}`);
  }
  return response;
}

export function wpFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = buildUrl(path, options.searchParams);
  return cached(`one:${url}`, async () => (await request(url, options.auth)).json() as Promise<T>);
}

export function wpFetchCollection<T>(
  path: string,
  options: FetchOptions & { perPage?: number } = {},
): Promise<T[]> {
  const perPage = Math.min(options.perPage ?? 100, 100);
  const firstUrl = buildUrl(path, { ...options.searchParams, per_page: perPage });

  return cached(`all:${firstUrl}`, async () => {
    const first = await request(firstUrl, options.auth);
    const totalPages = Number(first.headers.get("X-WP-TotalPages") || "1");
    const items = (await first.json()) as T[];

    for (let page = 2; page <= totalPages; page += 1) {
      const url = buildUrl(path, { ...options.searchParams, per_page: perPage, page });
      items.push(...((await (await request(url, options.auth)).json()) as T[]));
    }
    return items;
  });
}
