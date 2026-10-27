import { parseDecisionRow, type Decision } from "../schema";
import { proxyPath } from "../adapters/transport";
import type { LiveProgress } from "../types";

export const MAX_LIVE_PAGES = 50;
export const LIVE_PAGE_LIMIT = 1000;

export interface LiveFetchOptions {
  routerUrl: string;
  analyticsKey: string;
  since: string;
  until?: string;
  signal?: AbortSignal;
  onProgress?: (progress: LiveProgress) => void;
}

export interface LiveFetchResult {
  decisions: Decision[];
  pages: number;
  stopped: boolean;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export class LiveFetchError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "LiveFetchError";
  }
}

/**
 * Page through routing-decisions via the allow-listed proxy until
 * X-Weave-Has-More is not true, or MAX_LIVE_PAGES is hit / Stop is pressed.
 */
export async function fetchLiveDecisions(
  opts: LiveFetchOptions,
): Promise<LiveFetchResult> {
  const byId = new Map<string, Decision>();
  let cursor: string | null = null;
  let pages = 0;
  let stopped = false;

  while (pages < MAX_LIVE_PAGES) {
    if (opts.signal?.aborted) {
      stopped = true;
      break;
    }

    const params = new URLSearchParams();
    params.set("format", "ndjson");
    params.set("limit", String(LIVE_PAGE_LIMIT));
    if (cursor) {
      params.set("cursor", cursor);
    } else {
      params.set("since", opts.since);
      if (opts.until) params.set("until", opts.until);
    }

    const url = proxyPath("v1/analytics/routing-decisions", params);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${opts.analyticsKey}`,
        "x-router-url": opts.routerUrl,
      },
      cache: "no-store",
      signal: opts.signal,
    });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After") ?? "5");
      const waitSec =
        Number.isFinite(retryAfter) && retryAfter >= 0 ? retryAfter : 5;
      opts.onProgress?.({
        pages,
        rows: byId.size,
        waitingRetryAfter: waitSec,
        stopped: false,
      });
      await sleep(waitSec * 1000, opts.signal);
      continue;
    }

    if (res.status === 401) {
      throw new LiveFetchError(
        "Key rejected; use a read-only ra_ analytics key (rk_ routing keys are refused by this endpoint)",
        401,
      );
    }
    if (res.status === 404) {
      throw new LiveFetchError(
        "This router has no analytics service mounted",
        404,
      );
    }
    if (!res.ok) {
      throw new LiveFetchError(`Upstream error ${res.status}`, res.status);
    }

    const text = await res.text();
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let raw: unknown;
      try {
        raw = JSON.parse(trimmed);
      } catch {
        continue;
      }
      const parsed = parseDecisionRow(raw);
      if (parsed.ok) byId.set(parsed.data.id, parsed.data);
    }

    pages += 1;
    const hasMore = res.headers.get("X-Weave-Has-More") === "true";
    cursor = res.headers.get("X-Weave-Next-Cursor");

    opts.onProgress?.({
      pages,
      rows: byId.size,
      waitingRetryAfter: null,
      stopped: false,
    });

    if (!hasMore || !cursor) break;
  }

  if (pages >= MAX_LIVE_PAGES) stopped = true;

  return {
    decisions: Array.from(byId.values()),
    pages,
    stopped,
  };
}
