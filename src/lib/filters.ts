import type { Decision } from "./schema";

export type BadgeFilter = "sticky" | "failover" | "cross_format" | "subscription";

export interface DecisionFilters {
  session: string;
  turnType: string; // "main_loop" default; "all" for everything
  model: string;
  badges: BadgeFilter[];
  errorClass: string;
  since: string;
  until: string;
}

export const DEFAULT_FILTERS: DecisionFilters = {
  session: "",
  turnType: "main_loop",
  model: "",
  badges: [],
  errorClass: "",
  since: "",
  until: "",
};

export function filtersFromSearchParams(
  params: URLSearchParams,
): DecisionFilters {
  const badges = (params.get("badges") ?? "")
    .split(",")
    .map((b) => b.trim())
    .filter((b): b is BadgeFilter =>
      b === "sticky" || b === "failover" || b === "cross_format" || b === "subscription",
    );

  return {
    session: params.get("session") ?? "",
    turnType: params.get("turn_type") ?? "main_loop",
    model: params.get("model") ?? "",
    badges,
    errorClass: params.get("error_class") ?? "",
    since: params.get("since") ?? "",
    until: params.get("until") ?? "",
  };
}

export function filtersToSearchParams(filters: DecisionFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.session) params.set("session", filters.session);
  if (filters.turnType && filters.turnType !== "main_loop") {
    params.set("turn_type", filters.turnType);
  }
  // Always reflect non-default turn_type; also set when explicitly "all"
  if (filters.turnType === "all") params.set("turn_type", "all");
  if (filters.model) params.set("model", filters.model);
  if (filters.badges.length) params.set("badges", filters.badges.join(","));
  if (filters.errorClass) params.set("error_class", filters.errorClass);
  if (filters.since) params.set("since", filters.since);
  if (filters.until) params.set("until", filters.until);
  return params;
}

export function applyFilters(
  decisions: Decision[],
  filters: DecisionFilters,
): Decision[] {
  return decisions.filter((d) => {
    if (filters.session && d.session_id !== filters.session) return false;

    if (filters.turnType !== "all") {
      if ((d.turn_type ?? "") !== filters.turnType) return false;
    }

    if (filters.model) {
      const hit =
        d.requested_model === filters.model || d.decision_model === filters.model;
      if (!hit) return false;
    }

    if (filters.badges.includes("sticky") && !d.sticky_hit) return false;
    if (filters.badges.includes("failover") && !d.failover_used) return false;
    if (filters.badges.includes("cross_format") && !d.cross_format) return false;
    if (filters.badges.includes("subscription") && !d.subscription_served) return false;

    if (filters.errorClass) {
      if ((d.error_class ?? "") !== filters.errorClass) return false;
    }

    if (filters.since && d.requested_at < filters.since) return false;
    if (filters.until && d.requested_at >= filters.until) return false;

    return true;
  });
}

export function uniqueSessions(decisions: Decision[]): string[] {
  return Array.from(
    new Set(decisions.map((d) => d.session_id).filter((s): s is string => Boolean(s))),
  ).sort();
}

export function uniqueModels(decisions: Decision[]): string[] {
  const set = new Set<string>();
  for (const d of decisions) {
    if (d.requested_model) set.add(d.requested_model);
    if (d.decision_model) set.add(d.decision_model);
  }
  return Array.from(set).sort();
}

export function uniqueErrorClasses(decisions: Decision[]): string[] {
  return Array.from(
    new Set(decisions.map((d) => d.error_class).filter((s): s is string => Boolean(s))),
  ).sort();
}

export function uniqueTurnTypes(decisions: Decision[]): string[] {
  return Array.from(
    new Set(decisions.map((d) => d.turn_type).filter((s): s is string => Boolean(s))),
  ).sort();
}
