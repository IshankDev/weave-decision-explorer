"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Decision } from "@/lib/schema";
import { formatMs, formatNumber, formatTimestamp, formatUsd } from "@/lib/format";
import { Badge } from "./Badge";

const BADGE_HELP = {
  sticky:
    "sticky_hit: session pin reused a prior decision model instead of re-scoring.",
  failover:
    "failover_used: this row is a retry after an upstream failure for the same request_id.",
  cross_format:
    "cross_format: request was translated across provider message formats.",
  subscription:
    "subscription_served: served from subscription quota; actual_* costs are $0.",
} as const;

const SHEET_SPRING = { type: "spring" as const, bounce: 0, duration: 0.32 };

export function DecisionDrawer({
  decisions,
  selectedId,
  onClose,
  onSelect,
}: {
  decisions: Decision[];
  selectedId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [tab, setTab] = useState<"detail" | "raw">("detail");
  const reduceMotion = useReducedMotion();

  const index = useMemo(
    () => (selectedId ? decisions.findIndex((d) => d.id === selectedId) : -1),
    [decisions, selectedId],
  );
  const decision = index >= 0 ? decisions[index] : null;

  useEffect(() => {
    setTab("detail");
  }, [selectedId]);

  useEffect(() => {
    if (!decision) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onSelect(decisions[index - 1]!.id);
      if (e.key === "ArrowRight" && index < decisions.length - 1) {
        onSelect(decisions[index + 1]!.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decision, decisions, index, onClose, onSelect]);

  const switched =
    decision?.requested_model &&
    decision.decision_model &&
    decision.requested_model !== decision.decision_model;

  const latencies = decision
    ? [
        { label: "Route", ms: decision.route_latency_ms },
        { label: "Upstream", ms: decision.upstream_latency_ms },
        { label: "TTFT", ms: decision.ttft_ms },
        { label: "Total", ms: decision.total_latency_ms },
      ]
    : [];
  const maxLat = Math.max(1, ...latencies.map((l) => l.ms ?? 0));

  return (
    <AnimatePresence>
      {decision ? (
        <div className="fixed inset-0 z-40 flex justify-end" role="presentation">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close decision drawer"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            className="relative z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-surface shadow-[var(--shadow-sheet)]"
            initial={reduceMotion ? { opacity: 0 } : { x: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: "100%" }}
            transition={reduceMotion ? { duration: 0.15 } : SHEET_SPRING}
            drag={reduceMotion ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.02, right: 0.2 }}
            onDragEnd={(_e, info) => {
              const projected = info.offset.x + info.velocity.x * 0.18;
              if (info.velocity.x > 500 || projected > 140) onClose();
            }}
          >
            <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5">
              <div>
                <h2
                  id="drawer-title"
                  className="text-[16px] font-medium tracking-[-0.02em]"
                >
                  Decision
                </h2>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {formatTimestamp(decision.requested_at)} · {decision.id}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={index <= 0}
                  onClick={() => onSelect(decisions[index - 1]!.id)}
                  className="btn btn-secondary"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={index >= decisions.length - 1}
                  onClick={() => onSelect(decisions[index + 1]!.id)}
                  className="btn btn-secondary"
                >
                  Next
                </button>
                <button type="button" onClick={onClose} className="btn btn-ghost">
                  Done
                </button>
              </div>
            </header>

            <div className="px-4 pt-3">
              <div className="segmented" role="tablist">
                {(["detail", "raw"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className={`segmented-item ${tab === t ? "is-active" : ""}`}
                  >
                    {t === "raw" ? "Raw JSON" : "Detail"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {tab === "raw" ? (
                <pre className="overflow-x-auto rounded-[var(--radius)] border border-border bg-surface-muted p-3 font-mono text-[11px] leading-relaxed text-muted-strong">
                  {JSON.stringify(decision, null, 2)}
                </pre>
              ) : (
                <div className="space-y-5">
                  <section>
                    <h3 className="eyebrow">Requested vs served</h3>
                    <p className="mt-1.5 font-mono text-[13px]">
                      {decision.requested_model ?? "—"}
                      <span
                        className={`mx-2 ${switched ? "font-medium text-accent" : "text-muted"}`}
                      >
                        →
                      </span>
                      {decision.decision_model ?? "—"}
                    </p>
                    <p className="mt-1 text-[13px] text-muted">
                      Provider: {decision.decision_provider ?? "—"}
                      {decision.session_id ? (
                        <>
                          {" "}
                          ·{" "}
                          <Link
                            href={`/sessions/${encodeURIComponent(decision.session_id)}`}
                          >
                            Session timeline
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </section>

                  <section>
                    <h3 className="eyebrow">Candidates</h3>
                    <ul className="mt-2 space-y-1">
                      {(decision.candidate_models ?? []).map((m) => {
                        const chosen = m === decision.decision_model;
                        return (
                          <li
                            key={m}
                            className={`flex items-center justify-between rounded-[var(--radius)] px-2.5 py-1.5 font-mono text-[12px] ${
                              chosen
                                ? "border border-banner-border bg-accent-soft text-accent"
                                : "bg-surface-muted text-muted-strong"
                            }`}
                          >
                            <span>
                              {m}
                              {chosen ? " · served" : ""}
                            </span>
                            {chosen && decision.chosen_score != null ? (
                              <span className="tabular-nums">
                                {decision.chosen_score.toFixed(4)}
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-2 text-[12px] leading-snug text-muted">
                      Weave exports only the chosen model&apos;s score; per-candidate scores
                      are intentionally not exported.
                    </p>
                  </section>

                  <section>
                    <h3 className="eyebrow">Badges</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {decision.sticky_hit && (
                        <Badge kind="sticky" title={BADGE_HELP.sticky}>
                          sticky
                        </Badge>
                      )}
                      {decision.failover_used && (
                        <Badge kind="failover" title={BADGE_HELP.failover}>
                          failover
                        </Badge>
                      )}
                      {decision.cross_format && (
                        <Badge kind="cross-format" title={BADGE_HELP.cross_format}>
                          cross-format
                        </Badge>
                      )}
                      {decision.subscription_served && (
                        <Badge kind="subscription" title={BADGE_HELP.subscription}>
                          subscription
                        </Badge>
                      )}
                      {!decision.sticky_hit &&
                        !decision.failover_used &&
                        !decision.cross_format &&
                        !decision.subscription_served && (
                          <span className="text-[13px] text-muted">None</span>
                        )}
                    </div>
                  </section>

                  <section>
                    <h3 className="eyebrow">Latency</h3>
                    <div className="mt-2 space-y-2">
                      {latencies.map((l) => (
                        <div
                          key={l.label}
                          className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-2 text-[12px]"
                        >
                          <span className="text-muted">{l.label}</span>
                          <div className="h-1.5 overflow-hidden rounded-sm bg-[var(--fill)]">
                            <div
                              className="h-full rounded-sm bg-accent"
                              style={{ width: `${((l.ms ?? 0) / maxLat) * 100}%` }}
                            />
                          </div>
                          <span className="text-right tabular-nums text-muted">
                            {formatMs(l.ms)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="grid grid-cols-2 gap-4 text-[13px]">
                    <div>
                      <h3 className="eyebrow">Tokens</h3>
                      <ul className="mt-1.5 space-y-1 text-[12px] text-muted-strong">
                        <li>input: {formatNumber(decision.input_tokens)}</li>
                        <li>output: {formatNumber(decision.output_tokens)}</li>
                        <li>cache read: {formatNumber(decision.cache_read_tokens)}</li>
                        <li>cache write: {formatNumber(decision.cache_creation_tokens)}</li>
                        <li>reasoning: {formatNumber(decision.reasoning_tokens)}</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="eyebrow">Cost / outcome</h3>
                      <ul className="mt-1.5 space-y-1 text-[12px] text-muted-strong">
                        <li>input: {formatUsd(decision.actual_input_cost_usd)}</li>
                        <li>output: {formatUsd(decision.actual_output_cost_usd)}</li>
                        <li>status: {decision.upstream_status_code ?? "—"}</li>
                        <li>finish: {decision.upstream_finish_reason ?? "—"}</li>
                        <li>error: {decision.error_class ?? "—"}</li>
                      </ul>
                    </div>
                  </section>

                  <section>
                    <h3 className="eyebrow">Routing meta</h3>
                    <ul className="mt-1.5 space-y-1 font-mono text-[11px] text-muted">
                      <li>strategy: {decision.routing_strategy ?? "—"}</li>
                      <li>route_id: {decision.route_id ?? "—"}</li>
                      <li>cluster: {decision.cluster_router_version ?? "—"}</li>
                      <li>turn_type: {decision.turn_type ?? "—"}</li>
                      <li>request_id: {decision.request_id}</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="eyebrow">
                      Router&apos;s own note (verbatim, format may change)
                    </h3>
                    <pre className="mt-2 whitespace-pre-wrap rounded-[var(--radius)] border border-border bg-surface-muted p-3 font-mono text-[12px] leading-relaxed text-muted-strong">
                      {decision.decision_reason ?? "—"}
                    </pre>
                  </section>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
