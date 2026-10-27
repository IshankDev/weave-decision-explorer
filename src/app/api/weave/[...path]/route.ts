import {
  ALLOWED_PATHS,
  isAllowedPath,
  validateRouterUrl,
} from "@/lib/adapters/transport";

export const dynamic = "force-dynamic";

const FORWARD_RESPONSE_HEADERS = [
  "X-Weave-Next-Cursor",
  "X-Weave-Has-More",
  "Retry-After",
  "Content-Type",
  "Content-Encoding",
] as const;

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await context.params;
  const path = parts.join("/");

  if (!isAllowedPath(path)) {
    return jsonError(
      403,
      `Path not allow-listed. Allowed: ${ALLOWED_PATHS.join(", ")}`,
    );
  }

  const routerHeader = request.headers.get("x-router-url");
  if (!routerHeader) {
    return jsonError(400, "Missing x-router-url header");
  }

  const validated = validateRouterUrl(routerHeader);
  if (!validated.ok) {
    return jsonError(400, validated.error);
  }

  const auth = request.headers.get("authorization");
  const incoming = new URL(request.url);
  const target = new URL(path, validated.url.toString().replace(/\/?$/, "/") );
  incoming.searchParams.forEach((v, k) => target.searchParams.set(k, v));

  const upstreamHeaders: HeadersInit = {
    Accept: "application/x-ndjson, application/json, */*",
    "Accept-Encoding": "gzip",
  };
  if (auth) upstreamHeaders.Authorization = auth;

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      method: "GET",
      headers: upstreamHeaders,
      cache: "no-store",
    });
  } catch {
    return jsonError(502, "Upstream fetch failed");
  }

  const headers = new Headers();
  headers.set("Cache-Control", "no-store");
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  // Never log headers or bodies.
  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function POST() {
  return jsonError(405, "Only GET is allowed");
}
