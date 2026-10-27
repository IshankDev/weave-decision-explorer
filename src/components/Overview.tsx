"use client";

import { useMemo } from "react";
import {
  computeKpis,
  computeTopPairs,
  computeWhyItMoved,
} from "@/lib/aggregations";
import { useStore } from "@/lib/store/StoreProvider";
import { DemoBanner } from "./DemoBanner";
import { KpiCards } from "./KpiCards";
import { SourceSwitcher } from "./SourceSwitcher";
import { TopPairs } from "./TopPairs";
import { WhyItMoved } from "./WhyItMoved";

export function Overview() {
  const { state } = useStore();

  const kpis = useMemo(() => computeKpis(state.decisions), [state.decisions]);
  const segments = useMemo(() => computeWhyItMoved(state.decisions), [state.decisions]);
  const pairs = useMemo(() => computeTopPairs(state.decisions), [state.decisions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted">
            Why did the router pick that model? Read-only analytics only.
          </p>
        </div>
        <SourceSwitcher />
      </div>

      <DemoBanner />

      {state.status === "loading" && (
        <p className="text-sm text-muted" role="status">
          Loading decisions…
        </p>
      )}
      {state.status === "error" && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      {state.status === "ready" && (
        <>
          <KpiCards kpis={kpis} />
          <WhyItMoved segments={segments} />
          <TopPairs pairs={pairs} />
        </>
      )}
    </div>
  );
}
