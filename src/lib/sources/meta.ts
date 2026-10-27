import { parseSchemaResponse } from "../adapters/schemaAdapter";
import { parsePricesResponse, toPriceBook } from "../adapters/pricesAdapter";
import { proxyPath } from "../adapters/transport";

export async function fetchSchemaVersion(
  routerUrl: string,
  analyticsKey: string,
): Promise<string> {
  try {
    const res = await fetch(proxyPath("v1/analytics/schema"), {
      headers: {
        Authorization: `Bearer ${analyticsKey}`,
        "x-router-url": routerUrl,
      },
      cache: "no-store",
    });
    if (!res.ok) return "unknown";
    const json: unknown = await res.json();
    return parseSchemaResponse(json).version;
  } catch {
    return "unknown";
  }
}

export async function fetchPriceBook(
  routerUrl: string,
  analyticsKey: string,
): Promise<Map<string, { inputUsdPer1M: number; outputUsdPer1M: number }> | null> {
  try {
    const res = await fetch(proxyPath("v1/analytics/models"), {
      headers: {
        Authorization: `Bearer ${analyticsKey}`,
        "x-router-url": routerUrl,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    const prices = parsePricesResponse(json);
    if (!prices) return null;
    return toPriceBook(prices);
  } catch {
    return null;
  }
}
