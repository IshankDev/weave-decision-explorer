/**
 * ASSUMPTION A3: CORS on the hosted router is unverified for browser calls.
 * A preflight on 2026-10-27 returned 404 with no Access-Control-Allow-Origin,
 * so the browser cannot call it directly. Use the stateless pass-through
 * Route Handler at /api/weave/[...path].
 */

export const ALLOWED_PATHS = [
  "v1/analytics/routing-decisions",
  "v1/analytics/schema",
  "v1/analytics/models",
] as const;

export type AllowedPath = (typeof ALLOWED_PATHS)[number];

const PRIVATE_HOST_RE =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|0\.0\.0\.0|\[::1\]|::1$)/i;

export function isAllowedPath(path: string): path is AllowedPath {
  const normalized = path.replace(/^\/+/, "");
  return (ALLOWED_PATHS as readonly string[]).includes(normalized);
}

/**
 * Validate router base URL for SSRF safety.
 * - Must be https: (http://localhost only in development)
 * - Block private / loopback hosts in production
 */
export function validateRouterUrl(
  raw: string,
  opts: { nodeEnv?: string } = {},
): { ok: true; url: URL } | { ok: false; error: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: "Invalid router URL" };
  }

  const env = opts.nodeEnv ?? process.env.NODE_ENV;
  const isLocalHttp =
    env === "development" &&
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");

  if (url.protocol !== "https:" && !isLocalHttp) {
    return { ok: false, error: "Router URL must use https" };
  }

  if (PRIVATE_HOST_RE.test(url.hostname) && !isLocalHttp) {
    return { ok: false, error: "Private or loopback router hosts are blocked" };
  }

  return { ok: true, url };
}

/** Build the browser-facing proxy URL for an allow-listed Weave path. */
export function proxyPath(path: AllowedPath, search?: URLSearchParams): string {
  const qs = search?.toString();
  return `/api/weave/${path}${qs ? `?${qs}` : ""}`;
}
