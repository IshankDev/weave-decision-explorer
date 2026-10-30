"use client";

import type { OverviewKpis } from "@/lib/aggregations";
import { formatMs, formatNumber, formatPct } from "@/lib/format";

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="panel px-3.5 py-3">
      <div className="eyebrow">{label}</div>
      <div className="mt-1.5 text-[22px] font-medium tracking-[-0.03em] tabular-nums text-foreground">
        {value}
      </div>
      {hint ? <div className="mt-0.5 text-[11px] text-muted">{hint}</div> : null}
    </div>
  );
}

export function KpiCards({ kpis }: { kpis: OverviewKpis }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <Card label="Model calls" value={formatNumber(kpis.modelCalls)} />
      <Card label="main_loop turns" value={formatNumber(kpis.mainLoopTurns)} />
      <Card label="Distinct requests" value={formatNumber(kpis.distinctRequests)} />
      {kpis.usedPriceBook ? (
        <>
          <Card label="% downgraded" value={formatPct(kpis.pctDowngraded)} hint="by price book" />
          <Card label="% upgraded" value={formatPct(kpis.pctUpgraded)} hint="by price book" />
        </>
      ) : (
        <Card label="% switched" value={formatPct(kpis.pctSwitched)} hint="requested ≠ decision" />
      )}
      <Card label="% sticky" value={formatPct(kpis.pctSticky)} />
      <Card label="% failover" value={formatPct(kpis.pctFailover)} />
      <Card label="p50 route" value={formatMs(kpis.p50RouteMs)} />
      <Card label="p95 route" value={formatMs(kpis.p95RouteMs)} />
    </div>
  );
}
