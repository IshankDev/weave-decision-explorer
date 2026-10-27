import type { Decision } from "./schema";

export interface SessionAction {
  requestId: string;
  requestedAt: string;
  rows: Decision[];
  switched: boolean;
  models: string[];
}

/** Group session rows by request_id; order actions by requested_at. */
export function buildSessionTimeline(rows: Decision[]): SessionAction[] {
  const byRequest = new Map<string, Decision[]>();
  for (const row of rows) {
    const list = byRequest.get(row.request_id) ?? [];
    list.push(row);
    byRequest.set(row.request_id, list);
  }

  const actions: SessionAction[] = [];
  for (const [requestId, group] of byRequest) {
    const sorted = [...group].sort(
      (a, b) =>
        a.requested_at.localeCompare(b.requested_at) || a.id.localeCompare(b.id),
    );
    const models = Array.from(
      new Set(
        sorted
          .map((r) => r.decision_model)
          .filter((m): m is string => Boolean(m)),
      ),
    );
    const switched = sorted.some(
      (r) =>
        r.requested_model &&
        r.decision_model &&
        r.requested_model !== r.decision_model,
    );
    actions.push({
      requestId,
      requestedAt: sorted[0]!.requested_at,
      rows: sorted,
      switched,
      models,
    });
  }

  return actions.sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
}
