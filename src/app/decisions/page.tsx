import { Suspense } from "react";
import { DecisionsPageClient } from "@/components/DecisionsPageClient";

export default function DecisionsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading decisions…</p>}>
      <DecisionsPageClient />
    </Suspense>
  );
}
