"use client";

import { useMemo, useState } from "react";
import type { Decision } from "@/lib/schema";
import { buildSessionTimeline } from "@/lib/sessions";
import { formatTimestamp } from "@/lib/format";
import { Badge } from "./Badge";
import { DecisionDrawer } from "./DecisionDrawer";
import { useStore } from "@/lib/store/StoreProvider";

export function SessionTimeline({
  sessionId,
  rows,
}: {
  sessionId: string;
  rows: Decision[];
}) {
  const { state, dispatch } = useStore();
  const actions = useMemo(() => buildSessionTimeline(rows), [rows]);
  const flat = useMemo(() => actions.flatMap((a) => a.rows), [actions]);
  const [hoverModel, setHoverModel] = useState<string | null>(null);

  const modelStrip = useMemo(() => {
    return actions.map((a) => a.rows[a.rows.length - 1]?.decision_model ?? "—");
  }, [actions]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Session</h1>
        <p className="mt-1 font-mono text-sm text-muted">{sessionId}</p>
        <p className="mt-2 text-sm text-muted">
          Ordered by <code className="font-mono">requested_at</code>. Note:{" "}
          <code className="font-mono">recorded_at</code> order can differ. Retries and
          failovers are collapsed under one <code className="font-mono">request_id</code>.
        </p>
      </div>

      <section aria-label="Model over time">
        <h2 className="text-sm font-semibold text-muted">Model over time</h2>
        <div className="mt-2 flex flex-wrap gap-1">
          {modelStrip.map((m, i) => (
            <span
              key={`${m}-${i}`}
              title={m}
              onMouseEnter={() => setHoverModel(m)}
              onMouseLeave={() => setHoverModel(null)}
              className={`h-6 min-w-6 rounded-sm px-1 font-mono text-[10px] leading-6 ${
                hoverModel === m ? "bg-accent text-white" : "bg-surface-muted text-foreground"
              }`}
            >
              {m.split("-").slice(-1)[0]?.slice(0, 6)}
            </span>
          ))}
        </div>
      </section>

      <ol className="relative space-y-0 border-l-2 border-border pl-4">
        {actions.map((action) => (
          <li key={action.requestId} className="relative py-3">
            {action.switched && (
              <span
                className="absolute -left-[1.3rem] top-4 h-3 w-3 rounded-full bg-accent ring-2 ring-surface"
                title="Model switch"
                aria-label="Model switch"
              />
            )}
            {!action.switched && (
              <span className="absolute -left-[1.15rem] top-5 h-2 w-2 rounded-full bg-border" />
            )}
            <div className="rounded-lg bg-surface p-3 ring-1 ring-border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono text-xs text-muted">
                  {formatTimestamp(action.requestedAt)} · {action.requestId}
                </div>
                <div className="text-xs text-muted">
                  {action.rows.length > 1
                    ? `${action.rows.length} attempts`
                    : "1 attempt"}
                </div>
              </div>
              <ul className="mt-2 space-y-2">
                {action.rows.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({ type: "SELECT_DECISION", id: row.id })
                      }
                      className="flex w-full flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface-muted"
                    >
                      <span className="font-mono text-xs">
                        {row.requested_model ?? "—"}
                        <span
                          className={`mx-1 ${
                            row.requested_model !== row.decision_model
                              ? "font-bold text-accent"
                              : "text-muted"
                          }`}
                        >
                          →
                        </span>
                        {row.decision_model ?? "—"}
                      </span>
                      <span className="text-xs text-muted">{row.turn_type}</span>
                      {row.sticky_hit && <Badge kind="sticky">sticky</Badge>}
                      {row.failover_used && <Badge kind="failover">failover</Badge>}
                      {row.cross_format && (
                        <Badge kind="cross-format">cross-format</Badge>
                      )}
                      {row.error_class && <Badge kind="error">{row.error_class}</Badge>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
        {actions.length === 0 && (
          <li className="py-6 text-sm text-muted">No rows for this session.</li>
        )}
      </ol>

      <DecisionDrawer
        decisions={flat}
        selectedId={state.selectedId}
        onClose={() => dispatch({ type: "SELECT_DECISION", id: null })}
        onSelect={(id) => dispatch({ type: "SELECT_DECISION", id })}
      />
    </div>
  );
}
