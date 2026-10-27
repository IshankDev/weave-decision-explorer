import type { Decision } from "./schema";
import { estimateRequestedCostUsd } from "./adapters/pricesAdapter";
import type { PriceBook } from "./aggregations";

export interface SavingsEstimate {
  /** Sum of actual_input + actual_output where both present (or 0 when subscription). */
  actualUsd: number;
  /** Estimated cost if every call used requested_model at current prices. */
  requestedUsd: number;
  deltaUsd: number;
  pricedRows: number;
  label: "estimate, current prices, not historical";
}

export function computeSavingsEstimate(
  decisions: Decision[],
  book: PriceBook,
): SavingsEstimate | null {
  let actualUsd = 0;
  let requestedUsd = 0;
  let pricedRows = 0;

  for (const d of decisions) {
    const est = estimateRequestedCostUsd(
      d.requested_model,
      d.input_tokens,
      d.output_tokens,
      book,
    );
    if (est == null) continue;

    const a = d.actual_input_cost_usd;
    const b = d.actual_output_cost_usd;
    // Skip unpriced actuals (null); subscription $0 is fine.
    if (a == null && b == null && !d.subscription_served) continue;

    pricedRows += 1;
    requestedUsd += est;
    actualUsd += (a ?? 0) + (b ?? 0);
  }

  if (pricedRows === 0) return null;

  return {
    actualUsd,
    requestedUsd,
    deltaUsd: requestedUsd - actualUsd,
    pricedRows,
    label: "estimate, current prices, not historical",
  };
}
