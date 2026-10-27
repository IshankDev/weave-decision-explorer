"use client";

import type { SavingsEstimate as Savings } from "@/lib/savings";
import { formatUsd } from "@/lib/format";

export function SavingsEstimateCard({ estimate }: { estimate: Savings }) {
  const saved = estimate.deltaUsd;
  return (
    <section
      aria-labelledby="savings-heading"
      className="rounded-lg bg-surface p-4 ring-1 ring-border"
    >
      <h2 id="savings-heading" className="text-lg font-semibold">
        Savings estimate
      </h2>
      <p className="mt-1 text-xs text-muted">{estimate.label}</p>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted">If requested models</dt>
          <dd className="text-lg font-semibold tabular-nums">
            {formatUsd(estimate.requestedUsd)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Actual (export)</dt>
          <dd className="text-lg font-semibold tabular-nums">
            {formatUsd(estimate.actualUsd)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Delta</dt>
          <dd
            className={`text-lg font-semibold tabular-nums ${
              saved > 0 ? "text-accent" : saved < 0 ? "text-danger" : ""
            }`}
          >
            {saved > 0 ? "saved " : saved < 0 ? "extra " : ""}
            {formatUsd(Math.abs(saved))}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Priced rows</dt>
          <dd className="text-lg font-semibold tabular-nums">{estimate.pricedRows}</dd>
        </div>
      </dl>
    </section>
  );
}
