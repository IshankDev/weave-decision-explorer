"use client";

import { useRef, useState } from "react";
import { isValidAnalyticsKey } from "@/lib/key";
import { fetchLiveDecisions, LiveFetchError, MAX_LIVE_PAGES } from "@/lib/sources/live";
import { fetchPriceBook, fetchSchemaVersion } from "@/lib/sources/meta";
import { useStore } from "@/lib/store/StoreProvider";

function defaultSince(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

export function LiveSource() {
  const { state, dispatch } = useStore();
  const [routerUrl, setRouterUrl] = useState(state.routerUrl);
  const [keyInput, setKeyInput] = useState(state.analyticsKey ?? "");
  const [since, setSince] = useState(defaultSince);
  const [keyError, setKeyError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function forgetKey() {
    setKeyInput("");
    dispatch({ type: "SET_KEY", key: null });
  }

  async function startFetch() {
    const trimmed = keyInput.trim();
    if (!isValidAnalyticsKey(trimmed)) {
      setKeyError(
        "Only read-only ra_ analytics keys are accepted. Routing keys (rk_) and other prefixes are rejected.",
      );
      return;
    }
    setKeyError(null);
    dispatch({ type: "SET_KEY", key: trimmed });
    dispatch({ type: "SET_ROUTER_URL", url: routerUrl });
    dispatch({ type: "LOAD_START", source: "live", label: `Live: ${routerUrl}` });

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const sinceIso = new Date(since).toISOString();
      const result = await fetchLiveDecisions({
        routerUrl,
        analyticsKey: trimmed,
        since: sinceIso,
        signal: ac.signal,
        onProgress: (live) => dispatch({ type: "SET_LIVE_PROGRESS", live }),
      });
      dispatch({
        type: "LOAD_SUCCESS",
        decisions: result.decisions,
      });
      dispatch({
        type: "SET_LIVE_PROGRESS",
        live: {
          pages: result.pages,
          rows: result.decisions.length,
          waitingRetryAfter: null,
          stopped: result.stopped,
        },
      });

      const [version, book] = await Promise.all([
        fetchSchemaVersion(routerUrl, trimmed),
        fetchPriceBook(routerUrl, trimmed),
      ]);
      dispatch({ type: "SET_SCHEMA_VERSION", version });
      dispatch({ type: "SET_PRICE_BOOK", book });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        dispatch({
          type: "LOAD_ERROR",
          error: "Live fetch stopped",
        });
        return;
      }
      const message =
        err instanceof LiveFetchError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Live fetch failed";
      dispatch({ type: "LOAD_ERROR", error: message });
    }
  }

  function stopFetch() {
    abortRef.current?.abort();
    if (state.live) {
      dispatch({
        type: "SET_LIVE_PROGRESS",
        live: { ...state.live, stopped: true },
      });
    }
  }

  const loading = state.status === "loading" && state.source.kind === "live";

  return (
    <section id="source-live" className="panel space-y-3 p-4">
      <h2 className="section-title">Live (read-only)</h2>
      <p className="text-[13px] text-muted">
        Paste an <code className="font-mono text-muted-strong">ra_</code> analytics key. It
        stays in this browser session only — never localStorage, cookies, or the URL.
        Requests go through a stateless proxy because the hosted router has no CORS
        allow-origin.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted">
          Router URL
          <input
            type="url"
            value={routerUrl}
            onChange={(e) => setRouterUrl(e.target.value)}
            className="field"
            placeholder="https://router.workweave.ai"
            autoComplete="off"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted">
          Analytics key (ra_)
          <input
            type="password"
            value={keyInput}
            onChange={(e) => {
              setKeyInput(e.target.value);
              setKeyError(null);
            }}
            className="field font-mono"
            placeholder="ra_…"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted">
          Since
          <input
            type="datetime-local"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            className="field"
          />
        </label>
      </div>

      {keyError && (
        <p className="text-[13px] text-danger" role="alert">
          {keyError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void startFetch()}
          className="btn btn-primary"
        >
          {loading ? "Fetching…" : "Fetch decisions"}
        </button>
        {loading && (
          <button type="button" onClick={stopFetch} className="btn btn-secondary">
            Stop
          </button>
        )}
        <button type="button" onClick={forgetKey} className="btn btn-secondary">
          Forget key
        </button>
      </div>

      {state.live && state.source.kind === "live" && (
        <p className="text-[13px] text-muted" role="status">
          Page {state.live.pages}/{MAX_LIVE_PAGES} · {state.live.rows.toLocaleString()} rows
          {state.live.waitingRetryAfter != null
            ? ` · rate limited, retrying in ${state.live.waitingRetryAfter}s`
            : ""}
          {state.live.stopped ? " · stopped" : ""}
        </p>
      )}
      {state.status === "error" && state.source.kind === "live" && state.error && (
        <p className="text-[13px] text-danger" role="alert">
          {state.error}
        </p>
      )}
    </section>
  );
}
