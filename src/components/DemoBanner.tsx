"use client";

import { useStore } from "@/lib/store/StoreProvider";

export function DemoBanner() {
  const { state } = useStore();
  if (state.source.kind !== "demo" || state.status !== "ready") return null;

  return (
    <div
      role="status"
      className="mb-4 rounded-md border border-banner-border bg-banner px-3 py-2 text-sm text-warn"
    >
      Demo data, synthetic — not live router traffic.
    </div>
  );
}
