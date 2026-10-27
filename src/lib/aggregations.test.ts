import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  aggregationFieldAllowlist,
  computeKpis,
  computeTopPairs,
  computeWhyItMoved,
} from "./aggregations";
import { parseDecisionRow, type Decision } from "./schema";

function loadDemo(): Decision[] {
  const text = readFileSync(
    join(__dirname, "../../public/demo/routing-decisions.ndjson"),
    "utf8",
  );
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parsed = parseDecisionRow(JSON.parse(line));
      if (!parsed.ok) throw new Error(parsed.error);
      return parsed.data;
    });
}

describe("aggregations", () => {
  it("never reads decision_reason for grouping", () => {
    const allow = new Set(aggregationFieldAllowlist());
    expect(allow.has("decision_reason")).toBe(false);

    const spy = new Proxy({} as Decision, {
      get(_t, prop) {
        if (prop === "decision_reason") {
          throw new Error("decision_reason must not be read by aggregations");
        }
        if (prop === "requested_model") return "a";
        if (prop === "decision_model") return "b";
        if (prop === "sticky_hit") return false;
        if (prop === "failover_used") return false;
        if (prop === "turn_type") return "main_loop";
        if (prop === "request_id") return "r1";
        if (prop === "route_latency_ms") return 10;
        if (prop === "id") return "1";
        return undefined;
      },
    });

    expect(() => computeKpis([spy])).not.toThrow();
    expect(() => computeWhyItMoved([spy])).not.toThrow();
    expect(() => computeTopPairs([spy])).not.toThrow();
  });

  it("computes KPIs from demo data", () => {
    const rows = loadDemo();
    const kpis = computeKpis(rows);
    expect(kpis.modelCalls).toBeGreaterThanOrEqual(60);
    expect(kpis.mainLoopTurns).toBeGreaterThan(0);
    expect(kpis.pctSticky).toBeGreaterThan(0);
    expect(kpis.pctFailover).toBeGreaterThan(0);
  });

  it("why-it-moved segments cover decision models", () => {
    const segments = computeWhyItMoved(loadDemo());
    expect(segments.length).toBeGreaterThan(0);
    const total = segments.reduce(
      (n, s) => n + s.stayed + s.switched + s.sticky + s.failover,
      0,
    );
    expect(total).toBe(loadDemo().length);
  });
});
