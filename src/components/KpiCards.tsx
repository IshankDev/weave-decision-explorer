"use client";

import type { OverviewKpis } from "@/lib/aggregations";
import { formatMs, formatNumber, formatPct } from "@/lib/format";

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-surface p-3 shadow-sm ring-1 ring-border">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}

export function KpiCards({ kpis }: { kpis: OverviewKpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
