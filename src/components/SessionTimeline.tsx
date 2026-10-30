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
        <h1 className="display-title">Session</h1>
        <p className="mt-2 font-mono text-[13px] text-muted">{sessionId}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Ordered by <code className="font-mono text-muted-strong">requested_at</code>. Note:{" "}
          <code className="font-mono text-muted-strong">recorded_at</code> order can differ.
          Retries and failovers are collapsed under one{" "}
          <code className="font-mono text-muted-strong">request_id</code>.
        </p>
      </div>

      <section aria-label="Model over time">
        <h2 className="eyebrow">Model over time</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {modelStrip.map((m, i) => (
            <span
              key={`${m}-${i}`}
              title={m}
              onMouseEnter={() => setHoverModel(m)}
              onMouseLeave={() => setHoverModel(null)}
              className={`h-7 min-w-7 rounded-md px-2 font-mono text-[10px] leading-7 transition ${
                hoverModel === m
                  ? "bg-accent text-background"
                  : "bg-surface-muted text-muted-strong"
              }`}
            >
              {m.split("-").slice(-1)[0]?.slice(0, 6)}
            </span>
          ))}
        </div>
      </section>

      <ol className="relative space-y-0 border-l border-border pl-5">
        {actions.map((action) => (
          <li key={action.requestId} className="relative py-3">
            {action.switched && (
              <span
                className="absolute -left-[1.4rem] top-5 h-3 w-3 rounded-full bg-accent ring-[3px] ring-background"
                title="Model switch"
                aria-label="Model switch"
              />
            )}
            {!action.switched && (
              <span className="absolute -left-[1.25rem] top-6 h-2 w-2 rounded-full bg-border-strong" />
            )}
            <div className="panel p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono text-[11px] text-muted">
                  {formatTimestamp(action.requestedAt)} · {action.requestId}
                </div>
                <div className="text-[12px] text-muted">
                  {action.rows.length > 1
                    ? `${action.rows.length} attempts`
                    : "1 attempt"}
                </div>
              </div>
              <ul className="mt-2 space-y-1">
                {action.rows.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({ type: "SELECT_DECISION", id: row.id })
                      }
                      className="pressable flex w-full flex-wrap items-center gap-2 rounded-[var(--radius)] px-2.5 py-2 text-left hover:bg-[var(--fill)]"
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
