import type { APIRoute } from "astro";
import { timingSafeEqual } from "node:crypto";
import { serverEnv } from "../../lib/env";
import { clearWpCache } from "../../lib/wordpress/client";

export const prerender = false;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function secretMatches(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const POST: APIRoute = async ({ request }) => {
  const expected = serverEnv("REVALIDATE_SECRET");
  if (!expected) {
    return json(500, { ok: false, error: "REVALIDATE_SECRET is not configured" });
  }

  const given = request.headers.get("x-revalidate-secret") ?? "";
  if (!secretMatches(given, expected)) {
    return json(401, { ok: false, error: "invalid secret" });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await request.json();
  } catch {
    // Body is optional; the cache is cleared either way.
  }

  const cleared = clearWpCache();
  return json(200, { ok: true, cleared, reason: payload.reason ?? null, at: new Date().toISOString() });
};
