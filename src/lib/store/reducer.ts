import type { Decision } from "../schema";
import type { AppAction, AppState, SourceMeta } from "../types";

const DEFAULT_ROUTER =
  process.env.NEXT_PUBLIC_DEFAULT_ROUTER_URL ?? "https://router.workweave.ai";

export function createInitialState(): AppState {
  return {
    decisions: [],
    byId: new Map(),
    status: "idle",
    error: null,
    source: emptySource("demo", "Demo data, synthetic"),
    live: null,
    analyticsKey: null,
    routerUrl: DEFAULT_ROUTER,
    selectedId: null,
    schemaVersion: null,
    pricesAvailable: false,
  };
}

function emptySource(kind: SourceMeta["kind"], label: string): SourceMeta {
  return {
    kind,
    label,
    rowCount: 0,
    skippedLines: 0,
    firstSkipError: null,
    truncated: false,
    loadedAt: null,
  };
}

/** Dedupe on `id`; later rows win (immutable export semantics). */
export function mergeDecisions(
  existing: Map<string, Decision>,
  incoming: Decision[],
): { list: Decision[]; map: Map<string, Decision> } {
  const map = new Map(existing);
  for (const row of incoming) {
    map.set(row.id, row);
  }
  const list = Array.from(map.values()).sort(
    (a, b) =>
      a.recorded_at.localeCompare(b.recorded_at) || a.id.localeCompare(b.id),
  );
  return { list, map };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "LOAD_START":
      return {
        ...state,
        status: "loading",
        error: null,
        decisions: [],
        byId: new Map(),
        selectedId: null,
        live: action.source === "live" ? { pages: 0, rows: 0, waitingRetryAfter: null, stopped: false } : null,
        source: emptySource(action.source, action.label),
      };
    case "LOAD_SUCCESS": {
      const { list, map } = mergeDecisions(new Map(), action.decisions);
      return {
        ...state,
        status: "ready",
        error: null,
        decisions: list,
        byId: map,
        source: {
          ...state.source,
          rowCount: list.length,
          skippedLines: action.skippedLines ?? 0,
          firstSkipError: action.firstSkipError ?? null,
          truncated: action.truncated ?? false,
          loadedAt: new Date().toISOString(),
        },
      };
    }
    case "APPEND_DECISIONS": {
      const { list, map } = mergeDecisions(state.byId, action.decisions);
      return {
        ...state,
        decisions: list,
        byId: map,
        source: { ...state.source, rowCount: list.length },
      };
    }
    case "LOAD_ERROR":
      return { ...state, status: "error", error: action.error };
    case "SET_LIVE_PROGRESS":
      return { ...state, live: action.live };
    case "SET_KEY":
      return { ...state, analyticsKey: action.key };
    case "SET_ROUTER_URL":
      return { ...state, routerUrl: action.url };
    case "SELECT_DECISION":
      return { ...state, selectedId: action.id };
    case "SET_SCHEMA_VERSION":
      return { ...state, schemaVersion: action.version };
    case "SET_PRICES_AVAILABLE":
      return { ...state, pricesAvailable: action.available };
    case "CLEAR":
      return {
        ...createInitialState(),
        analyticsKey: state.analyticsKey,
        routerUrl: state.routerUrl,
      };
    default:
      return state;
  }
}
