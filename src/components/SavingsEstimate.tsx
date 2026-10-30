"use client";

import type { SavingsEstimate as Savings } from "@/lib/savings";
import { formatUsd } from "@/lib/format";

export function SavingsEstimateCard({ estimate }: { estimate: Savings }) {
  const saved = estimate.deltaUsd;
  return (
    <section aria-labelledby="savings-heading" className="panel p-4">
      <h2 id="savings-heading" className="section-title">
        Savings estimate
      </h2>
      <p className="mt-1 text-[11px] text-muted">{estimate.label}</p>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <dt className="eyebrow">If requested models</dt>
          <dd className="mt-1 text-[20px] font-medium tracking-[-0.03em] tabular-nums">
            {formatUsd(estimate.requestedUsd)}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Actual (export)</dt>
          <dd className="mt-1 text-[20px] font-medium tracking-[-0.03em] tabular-nums">
            {formatUsd(estimate.actualUsd)}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Delta</dt>
          <dd
            className={`mt-1 text-[20px] font-medium tracking-[-0.03em] tabular-nums ${
              saved > 0 ? "text-[#34d399]" : saved < 0 ? "text-danger" : ""
            }`}
          >
            {saved > 0 ? "saved " : saved < 0 ? "extra " : ""}
            {formatUsd(Math.abs(saved))}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Priced rows</dt>
          <dd className="mt-1 text-[20px] font-medium tracking-[-0.03em] tabular-nums">
            {estimate.pricedRows}
          </dd>
        </div>
      </dl>
    </section>
  );
}
