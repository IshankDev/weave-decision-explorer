import { describe, expect, it } from "vitest";
import { parseNdjsonFile } from "./file";

function makeFile(content: string, name = "test.ndjson"): File {
  return new File([content], name, { type: "application/x-ndjson" });
}

const good = {
  id: "demo-1",
  recorded_at: "2026-10-26T10:00:00.000Z",
  requested_at: "2026-10-26T10:00:00.000Z",
  request_id: "r1",
  trace_id: "t1",
  sticky_hit: false,
  failover_used: false,
  cross_format: false,
  subscription_served: false,
  requested_model: "a",
  decision_model: "b",
  extra_unknown_column: "tolerated",
};

describe("parseNdjsonFile", () => {
  it("loads valid rows, skips malformed, tolerates unknown columns", async () => {
    const content = [
      JSON.stringify(good),
      "{not-json",
      JSON.stringify({ ...good, id: "demo-2" }),
      "",
    ].join("\n");

    const result = await parseNdjsonFile(makeFile(content));
    expect(result.decisions).toHaveLength(2);
    expect(result.skippedLines).toBe(1);
    expect(result.firstSkipError).toBeTruthy();
    expect(
      (result.decisions[0] as Record<string, unknown>).extra_unknown_column,
    ).toBe("tolerated");
  });
});
