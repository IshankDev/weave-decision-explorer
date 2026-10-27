"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { SessionTimeline } from "@/components/SessionTimeline";
import { useStore } from "@/lib/store/StoreProvider";

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const sessionId = decodeURIComponent(params.id);
  const { state } = useStore();

  const rows = useMemo(
    () => state.decisions.filter((d) => d.session_id === sessionId),
    [state.decisions, sessionId],
  );

  if (state.status === "loading") {
    return <p className="text-sm text-muted">Loading session…</p>;
  }

  return <SessionTimeline sessionId={sessionId} rows={rows} />;
}
