"use client";

import { useMemo } from "react";
import {
  computeKpis,
  computeTopPairs,
  computeWhyItMoved,
} from "@/lib/aggregations";
import { computeSavingsEstimate } from "@/lib/savings";
import { useStore } from "@/lib/store/StoreProvider";
import { DemoBanner } from "./DemoBanner";
import { FileImport } from "./FileImport";
import { KpiCards } from "./KpiCards";
import { LiveSource } from "./LiveSource";
import { SavingsEstimateCard } from "./SavingsEstimate";
import { SourceSwitcher } from "./SourceSwitcher";
import { TopPairs } from "./TopPairs";
import { WhyItMoved } from "./WhyItMoved";

export function Overview() {
  const { state } = useStore();

  const kpis = useMemo(
    () => computeKpis(state.decisions, state.priceBook),
    [state.decisions, state.priceBook],
  );
  const segments = useMemo(() => computeWhyItMoved(state.decisions), [state.decisions]);
  const pairs = useMemo(() => computeTopPairs(state.decisions), [state.decisions]);
  const savings = useMemo(
    () =>
      state.priceBook
        ? computeSavingsEstimate(state.decisions, state.priceBook)
        : null,
    [state.decisions, state.priceBook],
  );

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-title">Router decisions</h1>
          <p className="mt-2 max-w-xl text-[14px] leading-snug text-muted">
            Why did the router pick that model? Read-only analytics export explorer.
          </p>
        </div>
        <SourceSwitcher />
      </div>

      <DemoBanner />

      {state.status === "loading" && (
        <p className="text-[13px] text-muted" role="status">
          Loading decisions…
        </p>
      )}
      {state.status === "error" && state.source.kind !== "live" && (
        <p
          className="rounded-[var(--radius)] border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger"
          role="alert"
        >
          {state.error}
        </p>
      )}

      {state.status === "ready" && (
        <>
          <KpiCards kpis={kpis} />
          {savings && <SavingsEstimateCard estimate={savings} />}
          <WhyItMoved segments={segments} />
          <TopPairs pairs={pairs} />
        </>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <FileImport />
        <LiveSource />
      </div>
    </div>
  );
}
