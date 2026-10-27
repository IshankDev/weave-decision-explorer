/**
 * Deterministic demo NDJSON generator for Weave Decision Explorer.
 * Run: npm run seed:demo
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Decision } from "../src/lib/schema";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../public/demo/routing-decisions.ndjson");

/** Mulberry32 — seeded PRNG for reproducible demo data. */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0x57454156); // "WEAV"
const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!;
const between = (lo: number, hi: number) => lo + rand() * (hi - lo);
const intBetween = (lo: number, hi: number) => Math.floor(between(lo, hi + 1));

const MODELS = [
  "claude-sonnet-4-5",
  "claude-haiku-4-5",
  "claude-opus-4-1",
  "gpt-5",
  "gpt-5-mini",
  "gemini-2.5-pro",
] as const;

const CHEAPER: Record<string, string> = {
  "claude-opus-4-1": "claude-sonnet-4-5",
  "claude-sonnet-4-5": "claude-haiku-4-5",
  "gpt-5": "gpt-5-mini",
  "gemini-2.5-pro": "claude-haiku-4-5",
};

const PROVIDERS: Record<string, string> = {
  "claude-sonnet-4-5": "anthropic",
  "claude-haiku-4-5": "anthropic",
  "claude-opus-4-1": "anthropic",
  "gpt-5": "openai",
  "gpt-5-mini": "openai",
  "gemini-2.5-pro": "google",
};

const SESSIONS = [
  {
    id: "demo-session-alpha",
    email: "dev1@example.com",
    user: "demo-user-1",
  },
  {
    id: "demo-session-beta",
    email: "dev2@example.com",
    user: "demo-user-2",
  },
  {
    id: "demo-session-gamma",
    email: "dev3@example.com",
    user: "demo-user-3",
  },
] as const;

const TURN_TYPES = [
  "main_loop",
  "tool_result",
  "compaction",
  "title_gen",
  "sub_agent_dispatch",
  "probe",
  "recap",
  "classifier",
] as const;

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

function candidatesFor(decision: string, requested: string): string[] {
  const set = new Set<string>([decision, requested]);
  while (set.size < intBetween(2, 5)) {
    set.add(pick(MODELS));
  }
  return Array.from(set);
}

function baseRow(partial: Partial<Decision> & Pick<
  Decision,
  | "id"
  | "recorded_at"
  | "requested_at"
  | "request_id"
  | "trace_id"
  | "sticky_hit"
  | "failover_used"
  | "cross_format"
  | "subscription_served"
>): Decision {
  const requested = partial.requested_model ?? pick(MODELS);
  const decision = partial.decision_model ?? requested;
  return {
    session_id: SESSIONS[0].id,
    user_id: SESSIONS[0].user,
    user_email: SESSIONS[0].email,
    client_app: "claude-code",
    turn_type: "main_loop",
    requested_model: requested,
    decision_model: decision,
    decision_provider: PROVIDERS[decision] ?? "unknown",
    route_id: "demo-route-default",
    routing_strategy: "cluster_router",
    policy_route_key: "default",
    cluster_router_version: "demo-0.1.0",
    candidate_models: candidatesFor(decision, requested),
    chosen_score: Number(between(0.55, 0.98).toFixed(4)),
    decision_reason: `Synthetic router note for ${decision} (synthetic)`,
    error_class: null,
    failure_owner: null,
    estimated_input_tokens: intBetween(800, 4000),
    input_tokens: intBetween(700, 3800),
    output_tokens: intBetween(120, 900),
    cache_creation_tokens: intBetween(0, 200),
    cache_read_tokens: intBetween(0, 1500),
    cache_creation_1h_tokens: 0,
    reasoning_tokens: intBetween(0, 300),
    credential_source: "api_key",
    actual_input_cost_usd: Number(between(0.001, 0.04).toFixed(6)),
    actual_output_cost_usd: Number(between(0.002, 0.06).toFixed(6)),
    route_latency_ms: intBetween(8, 80),
    upstream_latency_ms: intBetween(200, 2400),
    total_latency_ms: intBetween(250, 2600),
    ttft_ms: intBetween(80, 600),
    upstream_status_code: 200,
    upstream_finish_reason: "stop",
    stop_reason: "end_turn",
    tool_use_blocks: 0,
    invalid_tool_args_blocks: 0,
    rollout_id: null,
    device_id: null,
    user_account_uuid: null,
    ...partial,
  };
}

function buildRows(): Decision[] {
  const start = Date.parse("2026-10-26T10:00:00.000Z");
  const rows: Decision[] = [];
  let seq = 0;
  const nextId = () => `demo-row-${String(++seq).padStart(4, "0")}`;
  const nextReq = () => `demo-req-${String(seq).padStart(4, "0")}`;
  const nextTrace = () => `demo-trace-${String(seq).padStart(4, "0")}`;

  // --- Explicit showcase cases (required by prompt) ---

  // 1. Downgrade (requested ≠ decision, cheaper)
  {
    const t = start + 60_000;
    const requested = "claude-opus-4-1";
    const decision = CHEAPER[requested]!;
    rows.push(
      baseRow({
        id: nextId(),
        recorded_at: iso(t + 1200),
        requested_at: iso(t),
        request_id: nextReq(),
        trace_id: nextTrace(),
        session_id: SESSIONS[0].id,
        user_id: SESSIONS[0].user,
        user_email: SESSIONS[0].email,
        requested_model: requested,
        decision_model: decision,
        decision_provider: PROVIDERS[decision],
        sticky_hit: false,
        failover_used: false,
        cross_format: false,
        subscription_served: false,
        decision_reason:
          "Downgraded: classified as medium difficulty, haiku sufficient (synthetic)",
        chosen_score: 0.91,
      }),
    );
  }

  // 2. Upgrade
  {
    const t = start + 120_000;
    rows.push(
      baseRow({
        id: nextId(),
        recorded_at: iso(t + 900),
        requested_at: iso(t),
        request_id: nextReq(),
        trace_id: nextTrace(),
        session_id: SESSIONS[0].id,
        user_id: SESSIONS[0].user,
        user_email: SESSIONS[0].email,
        requested_model: "claude-haiku-4-5",
        decision_model: "claude-opus-4-1",
        decision_provider: "anthropic",
        sticky_hit: false,
        failover_used: false,
        cross_format: false,
        subscription_served: false,
        decision_reason:
          "Upgraded: high-difficulty coding task needs opus (synthetic)",
        chosen_score: 0.88,
      }),
    );
  }

  // 3. Stayed (requested === decision)
  {
    const t = start + 180_000;
    rows.push(
      baseRow({
        id: nextId(),
        recorded_at: iso(t + 700),
        requested_at: iso(t),
        request_id: nextReq(),
        trace_id: nextTrace(),
        session_id: SESSIONS[0].id,
        user_id: SESSIONS[0].user,
        user_email: SESSIONS[0].email,
        requested_model: "claude-sonnet-4-5",
        decision_model: "claude-sonnet-4-5",
        decision_provider: "anthropic",
        sticky_hit: false,
        failover_used: false,
        cross_format: false,
        subscription_served: false,
        decision_reason: "Stayed on requested model; score best in cluster (synthetic)",
        chosen_score: 0.94,
      }),
    );
  }

  // 4. sticky_hit=true
  {
    const t = start + 240_000;
    rows.push(
      baseRow({
        id: nextId(),
        recorded_at: iso(t + 500),
        requested_at: iso(t),
        request_id: nextReq(),
        trace_id: nextTrace(),
        session_id: SESSIONS[0].id,
        user_id: SESSIONS[0].user,
        user_email: SESSIONS[0].email,
        requested_model: "claude-sonnet-4-5",
        decision_model: "claude-sonnet-4-5",
        sticky_hit: true,
        failover_used: false,
        cross_format: false,
        subscription_served: false,
        decision_reason: "Sticky session pin hit; reused prior decision (synthetic)",
        chosen_score: null,
        routing_strategy: "sticky",
      }),
    );
  }

  // 5. failover_used=true with shared request_id across 2 rows
  {
    const t = start + 300_000;
    const sharedReq = "demo-req-failover-shared";
    rows.push(
      baseRow({
        id: nextId(),
        recorded_at: iso(t + 400),
        requested_at: iso(t),
        request_id: sharedReq,
        trace_id: nextTrace(),
        session_id: SESSIONS[1].id,
        user_id: SESSIONS[1].user,
        user_email: SESSIONS[1].email,
        requested_model: "gpt-5",
        decision_model: "gpt-5",
        decision_provider: "openai",
        sticky_hit: false,
        failover_used: false,
        cross_format: false,
        subscription_served: false,
        error_class: "upstream_5xx",
        failure_owner: "provider",
        upstream_status_code: 503,
        decision_reason: "Primary provider returned 503; attempting failover (synthetic)",
        chosen_score: 0.7,
        actual_input_cost_usd: 0,
        actual_output_cost_usd: 0,
        output_tokens: 0,
      }),
      baseRow({
        id: nextId(),
        recorded_at: iso(t + 1800),
        requested_at: iso(t + 50),
        request_id: sharedReq,
        trace_id: nextTrace(),
        session_id: SESSIONS[1].id,
        user_id: SESSIONS[1].user,
        user_email: SESSIONS[1].email,
        requested_model: "gpt-5",
        decision_model: "claude-sonnet-4-5",
        decision_provider: "anthropic",
        sticky_hit: false,
        failover_used: true,
        cross_format: false,
        subscription_served: false,
        decision_reason: "Failover to anthropic after openai 503 (synthetic)",
        chosen_score: 0.82,
      }),
    );
  }

  // 6. cross_format=true
  {
    const t = start + 360_000;
    rows.push(
      baseRow({
        id: nextId(),
        recorded_at: iso(t + 600),
        requested_at: iso(t),
        request_id: nextReq(),
        trace_id: nextTrace(),
        session_id: SESSIONS[1].id,
        user_id: SESSIONS[1].user,
        user_email: SESSIONS[1].email,
        requested_model: "gpt-5",
        decision_model: "claude-sonnet-4-5",
        decision_provider: "anthropic",
        sticky_hit: false,
        failover_used: false,
        cross_format: true,
        subscription_served: false,
        decision_reason: "Cross-format translation openai→anthropic messages (synthetic)",
      }),
    );
  }

  // 7. subscription_served=true with $0 cost
  {
    const t = start + 420_000;
    rows.push(
      baseRow({
        id: nextId(),
        recorded_at: iso(t + 550),
        requested_at: iso(t),
        request_id: nextReq(),
        trace_id: nextTrace(),
        session_id: SESSIONS[2].id,
        user_id: SESSIONS[2].user,
        user_email: SESSIONS[2].email,
        requested_model: "claude-sonnet-4-5",
        decision_model: "claude-sonnet-4-5",
        sticky_hit: false,
        failover_used: false,
        cross_format: false,
        subscription_served: true,
        credential_source: "subscription",
        actual_input_cost_usd: 0,
        actual_output_cost_usd: 0,
        decision_reason: "Served via subscription quota; billed cost is $0 (synthetic)",
      }),
    );
  }

  // 8. null costs (unpriced)
  {
    const t = start + 480_000;
    rows.push(
      baseRow({
        id: nextId(),
        recorded_at: iso(t + 500),
        requested_at: iso(t),
        request_id: nextReq(),
        trace_id: nextTrace(),
        session_id: SESSIONS[2].id,
        user_id: SESSIONS[2].user,
        user_email: SESSIONS[2].email,
        requested_model: "gemini-2.5-pro",
        decision_model: "gemini-2.5-pro",
        decision_provider: "google",
        sticky_hit: false,
        failover_used: false,
        cross_format: false,
        subscription_served: false,
        actual_input_cost_usd: null,
        actual_output_cost_usd: null,
        decision_reason: "Unpriced model in price book for this window (synthetic)",
      }),
    );
  }

  // 9. 429 / rate_limited
  {
    const t = start + 540_000;
    rows.push(
      baseRow({
        id: nextId(),
        recorded_at: iso(t + 300),
        requested_at: iso(t),
        request_id: nextReq(),
        trace_id: nextTrace(),
        session_id: SESSIONS[2].id,
        user_id: SESSIONS[2].user,
        user_email: SESSIONS[2].email,
        requested_model: "claude-opus-4-1",
        decision_model: "claude-opus-4-1",
        sticky_hit: false,
        failover_used: false,
        cross_format: false,
        subscription_served: false,
        error_class: "rate_limited",
        failure_owner: "provider",
        upstream_status_code: 429,
        output_tokens: 0,
        decision_reason: "Upstream rate limit hit before completion (synthetic)",
        chosen_score: 0.6,
      }),
    );
  }

  // 10. 5xx / upstream_5xx (separate from failover pair)
  {
    const t = start + 600_000;
    rows.push(
      baseRow({
        id: nextId(),
        recorded_at: iso(t + 350),
        requested_at: iso(t),
        request_id: nextReq(),
        trace_id: nextTrace(),
        session_id: SESSIONS[2].id,
        user_id: SESSIONS[2].user,
        user_email: SESSIONS[2].email,
        requested_model: "gpt-5-mini",
        decision_model: "gpt-5-mini",
        decision_provider: "openai",
        sticky_hit: false,
        failover_used: false,
        cross_format: false,
        subscription_served: false,
        error_class: "upstream_5xx",
        failure_owner: "provider",
        upstream_status_code: 500,
        output_tokens: 0,
        decision_reason: "Upstream 500 with no failover candidate available (synthetic)",
      }),
    );
  }

  // Non-main_loop turn types
  const nonMain: Array<(typeof TURN_TYPES)[number]> = [
    "tool_result",
    "compaction",
    "title_gen",
    "sub_agent_dispatch",
  ];
  nonMain.forEach((turn, i) => {
    const t = start + 660_000 + i * 45_000;
    const session = SESSIONS[i % SESSIONS.length]!;
    rows.push(
      baseRow({
        id: nextId(),
        recorded_at: iso(t + 400),
        requested_at: iso(t),
        request_id: nextReq(),
        trace_id: nextTrace(),
        session_id: session.id,
        user_id: session.user,
        user_email: session.email,
        turn_type: turn,
        requested_model: "claude-haiku-4-5",
        decision_model: "claude-haiku-4-5",
        sticky_hit: false,
        failover_used: false,
        cross_format: false,
        subscription_served: false,
        decision_reason: `${turn} turn routed to haiku (synthetic)`,
        tool_use_blocks: turn === "tool_result" ? 1 : 0,
      }),
    );
  });

  // Fill to ≥60 rows with varied main_loop traffic across sessions
  let t = start + 900_000;
  while (rows.length < 64) {
    const session = SESSIONS[rows.length % SESSIONS.length]!;
    const requested: string = pick(MODELS);
    const roll = rand();
    let decision: string = requested;
    let sticky = false;
    let reason = "Cluster score favored requested model (synthetic)";
    if (roll < 0.25 && CHEAPER[requested]) {
      decision = CHEAPER[requested]!;
      reason = "Scored cheaper candidate higher for this turn (synthetic)";
    } else if (roll < 0.35) {
      sticky = true;
      reason = "Sticky pin reused prior model (synthetic)";
    } else if (roll > 0.92) {
      const others = MODELS.filter((m) => m !== requested);
      decision = pick(others);
      reason = "Policy switched model for load balance (synthetic)";
    }

    rows.push(
      baseRow({
        id: nextId(),
        recorded_at: iso(t + intBetween(200, 1500)),
        requested_at: iso(t),
        request_id: nextReq(),
        trace_id: nextTrace(),
        session_id: session.id,
        user_id: session.user,
        user_email: session.email,
        turn_type: pick(["main_loop", "main_loop", "main_loop", "probe", "recap"]),
        requested_model: requested,
        decision_model: decision,
        decision_provider: PROVIDERS[decision] ?? "unknown",
        sticky_hit: sticky,
        failover_used: false,
        cross_format: false,
        subscription_served: rand() < 0.08,
        decision_reason: reason,
        chosen_score: sticky ? null : Number(between(0.5, 0.99).toFixed(4)),
        actual_input_cost_usd:
          rand() < 0.08 ? null : Number(between(0.0005, 0.05).toFixed(6)),
        actual_output_cost_usd:
          rand() < 0.08 ? null : Number(between(0.001, 0.07).toFixed(6)),
      }),
    );
    t += intBetween(20_000, 90_000);
  }

  return rows.sort(
    (a, b) =>
      a.recorded_at.localeCompare(b.recorded_at) || a.id.localeCompare(b.id),
  );
}

const rows = buildRows();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, rows.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
console.log(`Wrote ${rows.length} rows → ${OUT}`);
