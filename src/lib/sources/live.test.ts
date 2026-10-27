import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLiveDecisions, LiveFetchError } from "./live";

function ndjson(rows: object[]): string {
  return rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
}

function baseRow(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    recorded_at: "2026-10-26T10:00:00.000Z",
    requested_at: "2026-10-26T10:00:00.000Z",
    request_id: `req-${id}`,
    trace_id: `tr-${id}`,
    sticky_hit: false,
    failover_used: false,
    cross_format: false,
    subscription_served: false,
    requested_model: "claude-sonnet-4-5",
    decision_model: "claude-sonnet-4-5",
    ...extra,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchLiveDecisions", () => {
  it("pages with cursor until Has-More is false and dedupes ids", async () => {
    const fetches: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        fetches.push(url);
        if (fetches.length === 1) {
          return new Response(ndjson([baseRow("a"), baseRow("b")]), {
            status: 200,
            headers: {
              "X-Weave-Has-More": "true",
              "X-Weave-Next-Cursor": "cursor-2",
            },
          });
        }
        return new Response(ndjson([baseRow("b"), baseRow("c")]), {
          status: 200,
          headers: {
            "X-Weave-Has-More": "false",
            "X-Weave-Next-Cursor": "",
          },
        });
      }),
    );

    const result = await fetchLiveDecisions({
      routerUrl: "https://router.workweave.ai",
      analyticsKey: "ra_test_key_not_real",
      since: "2026-10-25T00:00:00.000Z",
    });

    expect(result.pages).toBe(2);
    expect(result.decisions.map((d) => d.id).sort()).toEqual(["a", "b", "c"]);
    expect(fetches[0]).toContain("since=");
    expect(fetches[1]).toContain("cursor=cursor-2");
    expect(fetches[1]).not.toContain("since=");
  });

  it("maps 401 and 404 to clear errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 401 })),
    );
    await expect(
      fetchLiveDecisions({
        routerUrl: "https://router.workweave.ai",
        analyticsKey: "ra_bad",
        since: "2026-10-25T00:00:00.000Z",
      }),
    ).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining("ra_"),
    } satisfies Partial<LiveFetchError>);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 404 })),
    );
    await expect(
      fetchLiveDecisions({
        routerUrl: "https://router.workweave.ai",
        analyticsKey: "ra_ok",
        since: "2026-10-25T00:00:00.000Z",
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("waits Retry-After on 429 then continues", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) {
          return new Response("", {
            status: 429,
            headers: { "Retry-After": "0" },
          });
        }
        return new Response(ndjson([baseRow("z")]), {
          status: 200,
          headers: { "X-Weave-Has-More": "false" },
        });
      }),
    );

    const progress: number[] = [];
    const result = await fetchLiveDecisions({
      routerUrl: "https://router.workweave.ai",
      analyticsKey: "ra_ok",
      since: "2026-10-25T00:00:00.000Z",
      onProgress: (p) => {
        if (p.waitingRetryAfter != null) progress.push(p.waitingRetryAfter);
      },
    });

    expect(result.decisions).toHaveLength(1);
    expect(progress.length).toBeGreaterThan(0);
    expect(calls).toBe(2);
  });
});
