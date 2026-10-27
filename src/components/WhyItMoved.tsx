"use client";

import type { MoveSegment } from "@/lib/aggregations";

const SEGMENTS = [
  { key: "stayed" as const, label: "Stayed", color: "bg-accent" },
  { key: "switched" as const, label: "Switched", color: "bg-warn" },
  { key: "sticky" as const, label: "Sticky", color: "bg-sticky" },
  { key: "failover" as const, label: "Failover", color: "bg-danger" },
];

export function WhyItMoved({ segments }: { segments: MoveSegment[] }) {
  const top = segments.slice(0, 8);
  const max = Math.max(
    1,
    ...top.map((s) => s.stayed + s.switched + s.sticky + s.failover),
  );

  return (
    <section aria-labelledby="why-moved-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="why-moved-heading" className="text-lg font-semibold">
          Why it moved
        </h2>
        <ul className="flex flex-wrap gap-3 text-xs text-muted">
          {SEGMENTS.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className={`inline-block h-2.5 w-2.5 rounded-sm ${s.color}`} aria-hidden />
              {s.label}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-sm text-muted">
        Grouped on stable fields only (decision model, sticky, failover, switch) — never on
        decision_reason.
      </p>
      <div className="space-y-2 rounded-lg bg-surface p-4 ring-1 ring-border">
        {top.length === 0 ? (
          <p className="text-sm text-muted">No decisions loaded.</p>
        ) : (
          top.map((seg) => {
            const total = seg.stayed + seg.switched + seg.sticky + seg.failover;
            return (
              <div key={seg.model} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2">
                <div className="truncate font-mono text-xs" title={seg.model}>
                  {seg.model}
                </div>
                <div
                  className="flex h-5 overflow-hidden rounded bg-surface-muted"
                  role="img"
                  aria-label={`${seg.model}: ${total} calls`}
                >
                  {SEGMENTS.map((s) => {
                    const n = seg[s.key];
                    if (!n) return null;
                    return (
                      <div
                        key={s.key}
                        className={`${s.color} h-full`}
                        style={{ width: `${(n / max) * 100}%` }}
                        title={`${s.label}: ${n}`}
                      />
                    );
                  })}
                </div>
                <div className="tabular-nums text-xs text-muted">{total}</div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
