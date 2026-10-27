"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { loadDemoDecisions } from "../sources/demo";
import { readKeyFromSession, writeKeyToSession } from "../key";
import { appReducer, createInitialState } from "./reducer";
import type { AppAction, AppState } from "../types";

const StoreContext = createContext<{
  state: AppState;
  dispatch: Dispatch<AppAction>;
} | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);

  // Restore key from sessionStorage only (never localStorage).
  useEffect(() => {
    const key = readKeyFromSession();
    if (key) dispatch({ type: "SET_KEY", key });
  }, []);

  useEffect(() => {
    writeKeyToSession(state.analyticsKey);
  }, [state.analyticsKey]);

  // Default: load demo data on first mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      dispatch({ type: "LOAD_START", source: "demo", label: "Demo data, synthetic" });
      try {
        const decisions = await loadDemoDecisions();
        if (!cancelled) {
          dispatch({ type: "LOAD_SUCCESS", decisions });
        }
      } catch (err) {
        if (!cancelled) {
          dispatch({
            type: "LOAD_ERROR",
            error: err instanceof Error ? err.message : "Failed to load demo data",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
