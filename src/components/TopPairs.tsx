"use client";

import type { ModelPair } from "@/lib/aggregations";

export function TopPairs({ pairs }: { pairs: ModelPair[] }) {
  return (
    <section aria-labelledby="top-pairs-heading" className="space-y-3">
      <h2 id="top-pairs-heading" className="section-title">
        Top requested → decision pairs
      </h2>
      <div className="panel overflow-hidden">
        <table className="min-w-full text-left text-[13px]">
          <thead className="border-b border-border bg-surface-muted text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Requested</th>
              <th className="px-4 py-2.5 font-medium">Decision</th>
              <th className="px-4 py-2.5 font-medium text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {pairs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-muted">
                  No pairs yet.
                </td>
              </tr>
            ) : (
              pairs.map((p) => (
                <tr
                  key={`${p.requested}-${p.decision}`}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-2.5 font-mono text-[12px] text-muted-strong">
                    {p.requested}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px]">
                    {p.decision}
                    {p.requested !== p.decision ? (
                      <span className="ml-2 font-medium text-accent" aria-label="switched">
                        →
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted">{p.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
