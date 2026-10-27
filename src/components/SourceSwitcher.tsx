"use client";

import { useStore } from "@/lib/store/StoreProvider";
import { loadDemoDecisions } from "@/lib/sources/demo";
import type { DataSourceKind } from "@/lib/types";

const OPTIONS: { kind: DataSourceKind; label: string; href?: string }[] = [
  { kind: "demo", label: "Demo" },
  { kind: "file", label: "File", href: "/#source-file" },
  { kind: "live", label: "Live", href: "/#source-live" },
];

export function SourceSwitcher() {
  const { state, dispatch } = useStore();

  async function loadDemo() {
    dispatch({ type: "LOAD_START", source: "demo", label: "Demo data, synthetic" });
    try {
      const decisions = await loadDemoDecisions();
      dispatch({ type: "LOAD_SUCCESS", decisions });
    } catch (err) {
      dispatch({
        type: "LOAD_ERROR",
        error: err instanceof Error ? err.message : "Failed to load demo",
      });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Data source">
      <span className="text-sm text-muted">Source:</span>
      {OPTIONS.map((opt) => {
        const active = state.source.kind === opt.kind;
        if (opt.kind === "demo") {
          return (
            <button
              key={opt.kind}
              type="button"
              onClick={() => void loadDemo()}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-accent text-white"
                  : "bg-surface text-foreground ring-1 ring-border hover:bg-surface-muted"
              }`}
              aria-pressed={active}
            >
              {opt.label}
            </button>
          );
        }
        return (
          <a
            key={opt.kind}
            href={opt.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-accent text-white"
                : "bg-surface text-foreground ring-1 ring-border hover:bg-surface-muted"
            }`}
          >
            {opt.label}
          </a>
        );
      })}
      {state.status === "ready" && (
        <span className="text-sm text-muted">
          {state.source.rowCount.toLocaleString()} rows
          {state.source.skippedLines > 0
            ? ` · ${state.source.skippedLines} lines skipped`
            : ""}
          {state.schemaVersion ? ` · schema ${state.schemaVersion}` : ""}
        </span>
      )}
    </div>
  );
}
