import type { Decision } from "./schema";

export type DataSourceKind = "demo" | "file" | "live";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

export interface SourceMeta {
  kind: DataSourceKind;
  label: string;
  rowCount: number;
  skippedLines: number;
  firstSkipError: string | null;
  truncated: boolean;
  loadedAt: string | null;
}

export interface LiveProgress {
  pages: number;
  rows: number;
  waitingRetryAfter: number | null;
  stopped: boolean;
}

export interface AppState {
  decisions: Decision[];
  byId: Map<string, Decision>;
  status: LoadStatus;
  error: string | null;
  source: SourceMeta;
  live: LiveProgress | null;
  /** Analytics key kept in React state only; mirrored to sessionStorage by the key helper. */
  analyticsKey: string | null;
  routerUrl: string;
  selectedId: string | null;
  schemaVersion: string | null;
  pricesAvailable: boolean;
}

export type AppAction =
  | { type: "LOAD_START"; source: DataSourceKind; label: string }
  | {
      type: "LOAD_SUCCESS";
      decisions: Decision[];
      skippedLines?: number;
      firstSkipError?: string | null;
      truncated?: boolean;
    }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "APPEND_DECISIONS"; decisions: Decision[] }
  | { type: "SET_LIVE_PROGRESS"; live: LiveProgress }
  | { type: "SET_KEY"; key: string | null }
  | { type: "SET_ROUTER_URL"; url: string }
  | { type: "SELECT_DECISION"; id: string | null }
  | { type: "SET_SCHEMA_VERSION"; version: string | null }
  | { type: "SET_PRICES_AVAILABLE"; available: boolean }
  | { type: "CLEAR" };
