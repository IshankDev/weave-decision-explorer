const SESSION_KEY = "weave-decision-explorer:ra_key";

/** Read-only analytics keys must start with ra_. */
export function isValidAnalyticsKey(key: string): boolean {
  return key.startsWith("ra_");
}

export function readKeyFromSession(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(SESSION_KEY);
    return value && isValidAnalyticsKey(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeKeyToSession(key: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!key) {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    if (!isValidAnalyticsKey(key)) return;
    sessionStorage.setItem(SESSION_KEY, key);
  } catch {
    // sessionStorage may be unavailable; ignore — key still lives in React state.
  }
}

export function forgetKey(): void {
  writeKeyToSession(null);
}
