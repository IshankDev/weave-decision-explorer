/**
 * ASSUMPTION A2: exact JSON shape of GET /v1/analytics/models is unverified.
 * Normalize to {model, provider, inputUsdPer1M, outputUsdPer1M, cacheReadMultiplier?}[].
 * If parsing fails, hide the savings estimate.
 * Estimate is always labelled "estimate, current prices, not historical".
 */

export interface ModelPrice {
  model: string;
  provider: string;
  inputUsdPer1M: number;
  outputUsdPer1M: number;
  cacheReadMultiplier?: number;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function fromRecord(r: Record<string, unknown>): ModelPrice | null {
  const model =
    (typeof r.model === "string" && r.model) ||
    (typeof r.name === "string" && r.name) ||
    (typeof r.id === "string" && r.id) ||
    null;
  if (!model) return null;

  const provider =
    (typeof r.provider === "string" && r.provider) ||
    (typeof r.vendor === "string" && r.vendor) ||
    "unknown";

  const inputUsdPer1M =
    num(r.inputUsdPer1M) ??
    num(r.input_usd_per_1m) ??
    num(r.input_price_per_1m) ??
    num(r.input_cost_per_1m_tokens) ??
    null;
  const outputUsdPer1M =
    num(r.outputUsdPer1M) ??
    num(r.output_usd_per_1m) ??
    num(r.output_price_per_1m) ??
    num(r.output_cost_per_1m_tokens) ??
    null;

  if (inputUsdPer1M == null || outputUsdPer1M == null) return null;

  const cacheReadMultiplier =
    num(r.cacheReadMultiplier) ??
    num(r.cache_read_multiplier) ??
    undefined;

  return {
    model,
    provider,
    inputUsdPer1M,
    outputUsdPer1M,
    ...(cacheReadMultiplier != null ? { cacheReadMultiplier } : {}),
  };
}

export function parsePricesResponse(raw: unknown): ModelPrice[] | null {
  try {
    let list: unknown[] | null = null;
    if (Array.isArray(raw)) list = raw;
    else if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      const candidate =
        obj.models ?? obj.data ?? obj.items ?? obj.prices ?? obj.results;
      if (Array.isArray(candidate)) list = candidate;
    }
    if (!list) return null;

    const prices: ModelPrice[] = [];
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const parsed = fromRecord(item as Record<string, unknown>);
      if (parsed) prices.push(parsed);
    }
    return prices.length > 0 ? prices : null;
  } catch {
    return null;
  }
}

export function toPriceBook(
  prices: ModelPrice[],
): Map<string, { inputUsdPer1M: number; outputUsdPer1M: number }> {
  const map = new Map<string, { inputUsdPer1M: number; outputUsdPer1M: number }>();
  for (const p of prices) {
    map.set(p.model, {
      inputUsdPer1M: p.inputUsdPer1M,
      outputUsdPer1M: p.outputUsdPer1M,
    });
  }
  return map;
}

/** Estimate what requested_model would have cost at current prices. */
export function estimateRequestedCostUsd(
  model: string | null | undefined,
  inputTokens: number | null | undefined,
  outputTokens: number | null | undefined,
  book: Map<string, { inputUsdPer1M: number; outputUsdPer1M: number }>,
): number | null {
  if (!model) return null;
  const entry = book.get(model);
  if (!entry) return null;
  const input = inputTokens ?? 0;
  const output = outputTokens ?? 0;
  return (input / 1_000_000) * entry.inputUsdPer1M + (output / 1_000_000) * entry.outputUsdPer1M;
}
