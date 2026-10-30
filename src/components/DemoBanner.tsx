"use client";

import { useStore } from "@/lib/store/StoreProvider";

export function DemoBanner() {
  const { state } = useStore();
  if (state.source.kind !== "demo" || state.status !== "ready") return null;

  return (
    <div
      role="status"
      className="rounded-[var(--radius)] border border-banner-border bg-banner px-3.5 py-2.5 text-[13px] text-accent"
    >
      Demo data, synthetic — not live router traffic.
    </div>
  );
}
