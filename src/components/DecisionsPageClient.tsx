"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  applyFilters,
  DEFAULT_FILTERS,
  filtersFromSearchParams,
  filtersToSearchParams,
  uniqueErrorClasses,
  uniqueModels,
  uniqueSessions,
  uniqueTurnTypes,
  type DecisionFilters,
} from "@/lib/filters";
import { decisionsToCsv, downloadCsv } from "@/lib/csv";
import { useStore } from "@/lib/store/StoreProvider";
import { DemoBanner } from "./DemoBanner";
import { DecisionFiltersBar } from "./DecisionFilters";
import { DecisionsTable } from "./DecisionsTable";
import { DecisionDrawer } from "./DecisionDrawer";

export function DecisionsPageClient() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [includeEmail, setIncludeEmail] = useState(false);

  const filters = useMemo(
    () => filtersFromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const setFilters = useCallback(
    (next: DecisionFilters) => {
      const params = filtersToSearchParams(next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const filtered = useMemo(
    () => applyFilters(state.decisions, filters),
    [state.decisions, filters],
  );

  const sessions = useMemo(() => uniqueSessions(state.decisions), [state.decisions]);
  const models = useMemo(() => uniqueModels(state.decisions), [state.decisions]);
  const turnTypes = useMemo(() => uniqueTurnTypes(state.decisions), [state.decisions]);
  const errorClasses = useMemo(
    () => uniqueErrorClasses(state.decisions),
    [state.decisions],
  );

  function exportCsv() {
    const csv = decisionsToCsv(filtered, { includeEmail });
    downloadCsv("routing-decisions.csv", csv);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Decisions</h1>
          <p className="mt-1 text-sm text-muted">
            {filtered.length.toLocaleString()} of {state.decisions.length.toLocaleString()}{" "}
            rows
            {filters.turnType === "main_loop" ? " · default turn_type=main_loop" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={includeEmail}
              onChange={(e) => setIncludeEmail(e.target.checked)}
            />
            Include user_email in CSV
          </label>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-border hover:bg-surface-muted"
          >
            Reset filters
          </button>
        </div>
      </div>

      <DemoBanner />

      <DecisionFiltersBar
        filters={filters}
        sessions={sessions}
        models={models}
        turnTypes={turnTypes}
        errorClasses={errorClasses}
        onChange={setFilters}
      />

      <DecisionsTable
        data={filtered}
        selectedId={state.selectedId}
        onRowClick={(id) => dispatch({ type: "SELECT_DECISION", id })}
      />

      <DecisionDrawer
        decisions={filtered}
        selectedId={state.selectedId}
        onClose={() => dispatch({ type: "SELECT_DECISION", id: null })}
        onSelect={(id) => dispatch({ type: "SELECT_DECISION", id })}
      />
    </div>
  );
}
