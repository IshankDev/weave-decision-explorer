"use client";

import type { ModelPair } from "@/lib/aggregations";

export function TopPairs({ pairs }: { pairs: ModelPair[] }) {
  return (
    <section aria-labelledby="top-pairs-heading" className="space-y-3">
      <h2 id="top-pairs-heading" className="text-lg font-semibold">
        Top requested → decision pairs
      </h2>
      <div className="overflow-x-auto rounded-lg bg-surface ring-1 ring-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Requested</th>
              <th className="px-3 py-2 font-medium">Decision</th>
              <th className="px-3 py-2 font-medium text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {pairs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-muted">
                  No pairs yet.
                </td>
              </tr>
            ) : (
              pairs.map((p) => (
                <tr key={`${p.requested}-${p.decision}`} className="border-b border-border/60">
                  <td className="px-3 py-2 font-mono text-xs">{p.requested}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {p.decision}
                    {p.requested !== p.decision ? (
                      <span className="ml-2 text-accent" aria-label="switched">
                        →
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
