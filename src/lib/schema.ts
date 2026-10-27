import { z } from "zod";

/**
 * Verified Weave Router analytics export fields (schema v3).
 * Sources: docs/ANALYTICS_EXPORT.md, internal/analytics/schema.go @ 2026-10-27.
 * † = NOT NULL. Everything else is nullable/optional. Unknown additive columns
 * are tolerated via .passthrough() and shown only in Raw JSON.
 */
export const DecisionRowSchema = z
  .object({
    // Identity († = NOT NULL)
    id: z.string(),
    recorded_at: z.string(),
    requested_at: z.string(),
    request_id: z.string(),
    trace_id: z.string(),
    session_id: z.string().nullable().optional(),
    rollout_id: z.string().nullable().optional(),
    device_id: z.string().nullable().optional(),
    client_app: z.string().nullable().optional(),
    // typed as string — not a closed enum (docs may add values)
    turn_type: z.string().nullable().optional(),

    // End user
    user_id: z.string().nullable().optional(),
    user_email: z.string().nullable().optional(),
    user_account_uuid: z.string().nullable().optional(),

    // Decision
    requested_model: z.string().nullable().optional(),
    decision_model: z.string().nullable().optional(),
    decision_provider: z.string().nullable().optional(),
    route_id: z.string().nullable().optional(),
    routing_strategy: z.string().nullable().optional(),
    policy_route_key: z.string().nullable().optional(),
    cluster_router_version: z.string().nullable().optional(),
    candidate_models: z.array(z.string()).nullable().optional(),
    chosen_score: z.number().nullable().optional(),
    decision_reason: z.string().nullable().optional(),
    sticky_hit: z.boolean(),
    failover_used: z.boolean(),
    cross_format: z.boolean(),

    // Failure
    error_class: z.string().nullable().optional(),
    failure_owner: z.string().nullable().optional(),

    // Tokens
    estimated_input_tokens: z.number().nullable().optional(),
    input_tokens: z.number().nullable().optional(),
    output_tokens: z.number().nullable().optional(),
    cache_creation_tokens: z.number().nullable().optional(),
    cache_read_tokens: z.number().nullable().optional(),
    cache_creation_1h_tokens: z.number().nullable().optional(),
    reasoning_tokens: z.number().nullable().optional(),

    // Economics — null means unpriced; never coerce to 0
    subscription_served: z.boolean(),
    credential_source: z.string().nullable().optional(),
    actual_input_cost_usd: z.number().nullable().optional(),
    actual_output_cost_usd: z.number().nullable().optional(),

    // Performance
    route_latency_ms: z.number().nullable().optional(),
    upstream_latency_ms: z.number().nullable().optional(),
    total_latency_ms: z.number().nullable().optional(),
    ttft_ms: z.number().nullable().optional(),

    // Outcome
    upstream_status_code: z.number().nullable().optional(),
    upstream_finish_reason: z.string().nullable().optional(),
    stop_reason: z.string().nullable().optional(),
    tool_use_blocks: z.number().nullable().optional(),
    invalid_tool_args_blocks: z.number().nullable().optional(),
  })
  .passthrough();

export type Decision = z.infer<typeof DecisionRowSchema>;

export function parseDecisionRow(
  raw: unknown,
): { ok: true; data: Decision } | { ok: false; error: string } {
  const result = DecisionRowSchema.safeParse(raw);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
  };
}
