import { parseDecisionRow, type Decision } from "../schema";

export async function loadDemoDecisions(): Promise<Decision[]> {
  const res = await fetch("/demo/routing-decisions.ndjson", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Demo NDJSON fetch failed (${res.status})`);
  }
  const text = await res.text();
  const decisions: Decision[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let raw: unknown;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      continue;
    }
    const parsed = parseDecisionRow(raw);
    if (parsed.ok) decisions.push(parsed.data);
  }
  return decisions;
}
