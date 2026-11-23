/**
 * Read a server-side env var at request time, falling back to the value
 * Vite inlined at build time. Lets SiteGround env vars override without a rebuild.
 */
export function serverEnv(name: string): string | undefined {
  const runtime = typeof process !== "undefined" ? process.env[name] : undefined;
  if (runtime !== undefined && runtime !== "") return runtime;
  const built = (import.meta.env as Record<string, string | undefined>)[name];
  return built === "" ? undefined : built;
}
