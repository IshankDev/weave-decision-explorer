import type { Decision } from "./schema";

const BASE_COLUMNS: Array<keyof Decision | "cost_usd"> = [
  "id",
  "requested_at",
  "recorded_at",
  "request_id",
  "session_id",
  "turn_type",
  "requested_model",
  "decision_model",
  "decision_provider",
  "sticky_hit",
  "failover_used",
  "cross_format",
  "subscription_served",
  "chosen_score",
  "route_latency_ms",
  "total_latency_ms",
  "upstream_status_code",
  "error_class",
  "actual_input_cost_usd",
  "actual_output_cost_usd",
  "cost_usd",
];

function escapeCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowCost(d: Decision): string {
  const a = d.actual_input_cost_usd;
  const b = d.actual_output_cost_usd;
  if (a == null && b == null) return "";
  return String((a ?? 0) + (b ?? 0));
}

export function decisionsToCsv(
  decisions: Decision[],
  opts: { includeEmail: boolean },
): string {
  const columns = opts.includeEmail
    ? (["user_email", ...BASE_COLUMNS] as Array<keyof Decision | "cost_usd" | "user_email">)
    : BASE_COLUMNS;

  const header = columns.join(",");
  const lines = decisions.map((d) =>
    columns
      .map((col) => {
        if (col === "cost_usd") return escapeCell(rowCost(d));
        if (col === "user_email") return escapeCell(d.user_email);
        return escapeCell(d[col as keyof Decision]);
      })
      .join(","),
  );
  return [header, ...lines].join("\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
