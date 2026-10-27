import type { Decision } from "./schema";

/**
 * Aggregations use only stable fields.
 * Never read `decision_reason` — Weave docs say its format changes between versions.
 */
export interface OverviewKpis {
  modelCalls: number;
  mainLoopTurns: number;
  distinctRequests: number;
  pctDowngraded: number | null;
  pctUpgraded: number | null;
  pctSwitched: number;
  pctSticky: number;
  pctFailover: number;
  p50RouteMs: number | null;
  p95RouteMs: number | null;
  usedPriceBook: boolean;
}

export interface MoveSegment {
  model: string;
  stayed: number;
  switched: number;
  sticky: number;
  failover: number;
}

export interface ModelPair {
  requested: string;
  decision: string;
  count: number;
}

export type PriceBook = Map<string, { inputUsdPer1M: number; outputUsdPer1M: number }>;

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)]!;
}

function isSwitch(d: Decision): boolean {
  return Boolean(
    d.requested_model &&
      d.decision_model &&
      d.requested_model !== d.decision_model,
  );
}

/** Cheaper/dearer using price book input rate when available. */
function priceRank(model: string | null | undefined, book: PriceBook | null): number | null {
  if (!model || !book) return null;
  const entry = book.get(model);
  if (!entry) return null;
  return entry.inputUsdPer1M;
}

export function computeKpis(
  decisions: Decision[],
  priceBook: PriceBook | null = null,
): OverviewKpis {
  const mainLoop = decisions.filter((d) => d.turn_type === "main_loop");
  const base = mainLoop.length > 0 ? mainLoop : decisions;
  const requests = new Set(base.map((d) => d.request_id));

  let switched = 0;
  let downgraded = 0;
  let upgraded = 0;
  let pricedComparisons = 0;
  let sticky = 0;
  let failover = 0;
  const routeLatencies: number[] = [];

  for (const d of base) {
    if (d.sticky_hit) sticky += 1;
    if (d.failover_used) failover += 1;
    if (typeof d.route_latency_ms === "number") routeLatencies.push(d.route_latency_ms);

    if (!isSwitch(d)) continue;
    switched += 1;

    const reqPrice = priceRank(d.requested_model, priceBook);
    const decPrice = priceRank(d.decision_model, priceBook);
    if (reqPrice != null && decPrice != null) {
      pricedComparisons += 1;
      if (decPrice < reqPrice) downgraded += 1;
      else if (decPrice > reqPrice) upgraded += 1;
    }
  }

  const n = base.length || 1;
  routeLatencies.sort((a, b) => a - b);
  const usedPriceBook = pricedComparisons > 0;

  return {
    modelCalls: decisions.length,
    mainLoopTurns: mainLoop.length,
    distinctRequests: requests.size,
    pctDowngraded: usedPriceBook ? (downgraded / n) * 100 : null,
    pctUpgraded: usedPriceBook ? (upgraded / n) * 100 : null,
    pctSwitched: (switched / n) * 100,
    pctSticky: (sticky / n) * 100,
    pctFailover: (failover / n) * 100,
    p50RouteMs: percentile(routeLatencies, 50),
    p95RouteMs: percentile(routeLatencies, 95),
    usedPriceBook,
  };
}

export function computeWhyItMoved(decisions: Decision[]): MoveSegment[] {
  const byModel = new Map<string, MoveSegment>();

  for (const d of decisions) {
    const model = d.decision_model ?? "(unknown)";
    let seg = byModel.get(model);
    if (!seg) {
      seg = { model, stayed: 0, switched: 0, sticky: 0, failover: 0 };
      byModel.set(model, seg);
    }
    if (d.failover_used) seg.failover += 1;
    else if (d.sticky_hit) seg.sticky += 1;
    else if (isSwitch(d)) seg.switched += 1;
    else seg.stayed += 1;
  }

  return Array.from(byModel.values()).sort(
    (a, b) =>
      b.stayed + b.switched + b.sticky + b.failover -
      (a.stayed + a.switched + a.sticky + a.failover),
  );
}

export function computeTopPairs(decisions: Decision[], limit = 10): ModelPair[] {
  const counts = new Map<string, ModelPair>();
  for (const d of decisions) {
    const requested = d.requested_model ?? "(unknown)";
    const decision = d.decision_model ?? "(unknown)";
    const key = `${requested}→${decision}`;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { requested, decision, count: 1 });
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Exported for tests: ensure aggregations never touch decision_reason. */
export function aggregationFieldAllowlist(): readonly string[] {
  return [
    "id",
    "request_id",
    "turn_type",
    "requested_model",
    "decision_model",
    "sticky_hit",
    "failover_used",
    "route_latency_ms",
  ] as const;
}
