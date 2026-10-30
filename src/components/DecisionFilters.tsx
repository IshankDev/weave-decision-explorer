"use client";

import type { DecisionFilters, BadgeFilter } from "@/lib/filters";

const BADGE_OPTIONS: { id: BadgeFilter; label: string }[] = [
  { id: "sticky", label: "Sticky" },
  { id: "failover", label: "Failover" },
  { id: "cross_format", label: "Cross-format" },
  { id: "subscription", label: "Subscription" },
];

export function DecisionFiltersBar({
  filters,
  sessions,
  models,
  turnTypes,
  errorClasses,
  onChange,
}: {
  filters: DecisionFilters;
  sessions: string[];
  models: string[];
  turnTypes: string[];
  errorClasses: string[];
  onChange: (next: DecisionFilters) => void;
}) {
  function toggleBadge(id: BadgeFilter) {
    const has = filters.badges.includes(id);
    onChange({
      ...filters,
      badges: has ? filters.badges.filter((b) => b !== id) : [...filters.badges, id],
    });
  }

  return (
    <div className="panel flex flex-col gap-3.5 p-3.5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-[11px] font-medium text-muted">
          Session
          <select
            className="field"
            value={filters.session}
            onChange={(e) => onChange({ ...filters, session: e.target.value })}
          >
            <option value="">All sessions</option>
            {sessions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-[11px] font-medium text-muted">
          Turn type
          <select
            className="field"
            value={filters.turnType}
            onChange={(e) => onChange({ ...filters, turnType: e.target.value })}
          >
            <option value="main_loop">main_loop</option>
            <option value="all">All turn types</option>
            {turnTypes
              .filter((t) => t !== "main_loop")
              .map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-[11px] font-medium text-muted">
          Model
          <select
            className="field"
            value={filters.model}
            onChange={(e) => onChange({ ...filters, model: e.target.value })}
          >
            <option value="">Any model</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-[11px] font-medium text-muted">
          Error class
          <select
            className="field"
            value={filters.errorClass}
            onChange={(e) => onChange({ ...filters, errorClass: e.target.value })}
          >
            <option value="">Any / none</option>
            {errorClasses.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-[11px] font-medium text-muted">
          Since (requested_at)
          <input
            type="datetime-local"
            className="field"
            value={filters.since.slice(0, 16)}
            onChange={(e) =>
              onChange({
                ...filters,
                since: e.target.value ? new Date(e.target.value).toISOString() : "",
              })
            }
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[11px] font-medium text-muted">
          Until (exclusive)
          <input
            type="datetime-local"
            className="field"
            value={filters.until.slice(0, 16)}
            onChange={(e) =>
              onChange({
                ...filters,
                until: e.target.value ? new Date(e.target.value).toISOString() : "",
              })
            }
          />
        </label>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-[11px] font-medium text-muted">Badges</legend>
          <div className="segmented flex-wrap">
            {BADGE_OPTIONS.map((b) => {
              const active = filters.badges.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleBadge(b.id)}
                  className={`segmented-item ${active ? "is-active" : ""}`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
