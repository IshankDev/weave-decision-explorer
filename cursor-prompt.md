# Cursor prompt: weave-decision-explorer

Paste everything below the line into a Cursor agent in an empty folder.

---

You are building **`ishank-labs/weave-decision-explorer`**. It is an unofficial, standalone **Routing Decision Explorer** for Weave Router (https://github.com/weave-os/router). The app answers one question for every routed model call: *why did the router pick this model?* It reads only Weave's **public, read-only analytics export**. Commit in small, logical steps, one commit per numbered milestone below.

## Ground rules (non-negotiable)
1. **No secrets in the repo.** There is no `.env` with real values, no hard-coded keys and no keys in test fixtures. Commit only a `.env.example` with non-secret defaults. Add `.env*` (except `.env.example`) to `.gitignore`.
2. **Never invent API fields.** Use only the fields listed under "Verified contract" below. Anything marked **ASSUMPTION** must go through `src/lib/adapters/` so it can be fixed in one place. Each assumption needs a `// ASSUMPTION:` comment and an entry in the README's "Assumptions" section.
3. **Demo mode is the default.** The app must work fully with no key and no network access.
4. **The user's key stays in the browser session.** Keep it in `sessionStorage` (and React state) only. Never use localStorage, cookies, URL params or analytics, and never log it, server-side or client-side. Add a "Forget key" button.
5. **Use only the read-only `ra_` key.** Reject anything that does not start with `ra_` in the UI, with a message explaining why. Do not implement `POST /v1/route` or any routing, write or admin endpoint.
6. **Treat `decision_reason` as prose.** Display it verbatim. Never parse it, regex it, group by it or derive enums from it, because Weave's docs explicitly say the format changes between versions. Group only on stable fields: `decision_model`, `requested_model`, `sticky_hit`, `failover_used`, `candidate_models`, `turn_type`, `error_class`.
7. Add the footer "Built by Ishank, unofficial demo. Not affiliated with Weave." Do not use the Weave logo.

## Stack
- Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS
- `zod` for row validation, `@tanstack/react-table` for the table, `date-fns`
- No database and no auth provider
- Vitest for unit tests and one Playwright smoke test
- Node 20+, deployed on Vercel

## Verified contract (from weave-os/router @ main, 2026-10-27)
Sources: `docs/ANALYTICS_EXPORT.md`, `internal/analytics/schema.go` (SchemaVersion "3"), https://docs.weaveos.com/router/analytics-export and https://docs.weaveos.com/router/reporting.

**Endpoint:** `GET {ROUTER_URL}/v1/analytics/routing-decisions`
- Header: `Authorization: Bearer ra_...`. Send `Accept-Encoding: gzip`.
- Query parameters:
  - `since`: RFC3339, inclusive. Required on the first page and ignored once `cursor` is passed.
  - `until`: RFC3339, exclusive. Optional.
  - `cursor`: opaque.
  - `limit`: default 1000, max 10000. Use 1000.
  - `format=ndjson`
- Body: **NDJSON**, one JSON object per line, with no envelope.
- Response headers: `X-Weave-Next-Cursor` (pass it back as `cursor`) and `X-Weave-Has-More` (`true` or `false`).
- Ordering is by `recorded_at` then `id`. The most recent 60 seconds are withheld. Rows are immutable, so **dedupe on `id`**.
- Errors: `401` means a bad key, or an `rk_` key was used. `404` means analytics is not mounted on that router. `429` means the rate limit (60 req/min per key) was hit, with a `Retry-After` header.
- Default `ROUTER_URL` is `https://router.workweave.ai`. An unauthenticated GET there returns 401, so the path exists. Self-hosted users enter their own URL.

**Also available:**
- `GET /v1/analytics/schema`: the field dictionary, the version, and grain/ordering semantics.
- `GET /v1/analytics/models`: the price book, giving input and output USD per 1M tokens per model and provider, plus a cache-read multiplier.

**Row fields:** declare these in `src/lib/schema.ts` with zod. Mark every field `.nullable().optional()` unless it is marked NOT NULL below, and use `.passthrough()` so new additive columns are tolerated.
- **Identity:** `id`†, `recorded_at`†, `requested_at`†, `request_id`†, `trace_id`†, `session_id`, `rollout_id`, `device_id`, `client_app`, `turn_type` (main_loop, tool_result, probe, title_gen, compaction, classifier, recap, sub_agent_dispatch; type it as a string and don't make it a closed enum).
- **End user:** `user_id`, `user_email`, `user_account_uuid`.
- **Decision:** `requested_model`, `decision_model`, `decision_provider`, `route_id`, `routing_strategy`, `policy_route_key`, `cluster_router_version`, `candidate_models` (string[]), `chosen_score` (float, comparable only within a row), `decision_reason` (prose), `sticky_hit`†, `failover_used`†, `cross_format`† (booleans).
- **Failure:** `error_class` (string, e.g. rate_limited, upstream_5xx, timeout, …) and `failure_owner` (provider, router, client or unknown).
- **Tokens:** `estimated_input_tokens`, `input_tokens`, `output_tokens`, `cache_creation_tokens`, `cache_read_tokens`, `cache_creation_1h_tokens`, `reasoning_tokens`.
- **Economics:** `subscription_served`† (boolean), `credential_source`, `actual_input_cost_usd`, `actual_output_cost_usd` (floats; null means unpriced, so never coerce to 0; 0 when `subscription_served`).
- **Performance:** `route_latency_ms`, `upstream_latency_ms`, `total_latency_ms`, `ttft_ms`.
- **Outcome:** `upstream_status_code`, `upstream_finish_reason`, `stop_reason`, `tool_use_blocks`, `invalid_tool_args_blocks`.

† marks a NOT NULL field. Ignore every other column the export sends. Keep it in a "Raw JSON" tab, but build no UI on it.

## ASSUMPTIONS (isolate in `src/lib/adapters/`)
- **A1 `schemaAdapter.ts`:** the exact JSON envelope of `/v1/analytics/schema` is unverified (expected something like `{version, fields:[{name,type,nullable,description}]}`; each field entry follows `analytics.Field` in schema.go). Only use it to display the "schema version" badge and to warn about unknown fields. If the shape doesn't match, fall back to "unknown".
- **A2 `pricesAdapter.ts`:** the exact JSON shape of `/v1/analytics/models` is unverified. Normalize it to `{model, provider, inputUsdPer1M, outputUsdPer1M, cacheReadMultiplier?}[]`. If parsing fails, hide the savings estimate. The estimate is always labelled "estimate, current prices, not historical" (as Weave's docs require).
- **A3 `transport.ts`:** CORS on the hosted router is unverified for browser calls. A preflight on 2026-10-27 returned 404 with no `Access-Control-Allow-Origin`, so assume the browser cannot call it directly. Use a **stateless pass-through Route Handler**, `src/app/api/weave/[...path]/route.ts`, that works like this:
  - It forwards only `GET` to an allow-list of paths: `v1/analytics/routing-decisions`, `v1/analytics/schema`, `v1/analytics/models`.
  - It takes the target base URL from an `x-router-url` request header. Validate it as `https:`, block private and loopback hosts (SSRF guard), and allow `http://localhost` only when `NODE_ENV=development`.
  - It forwards `Authorization` and copies back `X-Weave-Next-Cursor`, `X-Weave-Has-More`, `Retry-After` and the status code.
  - It never logs headers or bodies, never caches (`cache: 'no-store'`, `export const dynamic = 'force-dynamic'`), and keeps nothing.
- **A4:** timestamps are RFC3339 strings. Parse them with `date-fns/parseISO` and show invalid values as "—" without crashing.

## Data sources (`src/lib/sources/`)
1. **`demo.ts` (default):** load `public/demo/routing-decisions.ndjson`. Generate it with `scripts/seed-demo.ts`, which must be deterministic (seeded PRNG) and committed. Requirements:
   - At least 3 sessions and at least 60 rows, using **only verified fields**.
   - Cover these cases: downgrade (requested ≠ decision, cheaper), upgrade, stayed, `sticky_hit=true`, `failover_used=true` with a shared `request_id` across 2 rows, `cross_format=true`, `subscription_served=true` with $0 cost, a row with null costs, a 429/`rate_limited` row, a 5xx/`upstream_5xx` row, and non-main_loop turn types (tool_result, compaction, title_gen, sub_agent_dispatch).
   - Each row has 2–5 `candidate_models`, with `chosen_score` only on scored rows.
   - Use obviously synthetic ids (`demo-…`), emails `dev1@example.com` and so on, and short invented `decision_reason` prose with a "(synthetic)" suffix.
   - The UI shows a persistent "Demo data, synthetic" banner.
2. **`file.ts`:** drag-drop or pick a `.ndjson` (or `.jsonl`) file. Parse it line by line, streaming for large files (use `File.stream()` + TextDecoder and split on `\n`). Skip blank lines. Count invalid lines and show "N lines skipped" with the first error. Dedupe on `id`. Max 200k rows in memory; beyond that, warn and truncate.
3. **`live.ts`:** a form with the router URL (default `https://router.workweave.ai`), the `ra_` key (a password input) and a `since` date-time picker (default: 24h ago). It pages through the proxy until `X-Weave-Has-More` is not `true`, with a "Stop" button, a page/row counter and a cap of 50 pages. On 429 it waits `Retry-After` seconds and shows a countdown. 401 shows "Key rejected; use a read-only ra_ analytics key (rk_ routing keys are refused by this endpoint)". 404 shows "This router has no analytics service mounted".

All three sources normalize rows to one `Decision` type and go into one store (React context + `useReducer`; no external state library).

## Features
1. **Overview** (`/`): source switcher, KPI cards and a "Why it moved" breakdown.
   - KPI cards: model calls, main_loop turns, distinct `request_id`, % downgraded, % upgraded (by price book if available, else just "switched"), % sticky, % failover, and p50/p95 `route_latency_ms`.
   - "Why it moved" is a stacked bar per `decision_model` with the segments stayed, switched, sticky and failover, computed only from stable fields.
   - The overview also includes a top-10 `requested_model → decision_model` pairs table.
2. **Decisions table** (`/decisions`): a virtualized table.
   - Columns: time (`requested_at`), session, `turn_type`, requested → decision model (with a green arrow for a switch), provider, badges (sticky, failover, cross-format, subscription), score, route ms, total ms, status and cost.
   - Filters: session, `turn_type` (default main_loop with an "all" toggle), model, a badges multi-select, `error_class`, and date range.
   - The URL query reflects the filters, but never the key.
   - CSV export of the filtered rows, without user_email unless the user ticks a box.
3. **Decision drawer** (opens on row click):
   - A requested vs served header.
   - A **candidate list**: every `candidate_models` entry, with the served one highlighted and `chosen_score` beside it. Add the note: "Weave exports only the chosen model's score; per-candidate scores are intentionally not exported."
   - The badges with tooltips explaining each one (copy the meanings from the schema descriptions above).
   - A latency bar (route / upstream / ttft / total), tokens including cache read/write, cost (null shown as "unpriced"), and outcome.
   - `routing_strategy`, `route_id` and `cluster_router_version`.
   - `decision_reason` in a monospace "Router's own note (verbatim, format may change)" box.
   - Prev/next navigation and a "Raw JSON" tab.
4. **Session timeline** (`/sessions/[id]`): actions in `requested_at` order (note in the UI that `recorded_at` order differs).
   - Group rows by `request_id` so retries and failovers collapse under one action.
   - Mark model switches with a vertical marker and show a small model-over-time strip.
5. **Savings estimate (optional, A2):** shown only when prices load. Price `input_tokens`/`output_tokens` on `requested_model` versus `actual_*`. Label it clearly as an estimate.
6. **About page:** what the app is, the data flow diagram (browser → stateless proxy → your router), the key-handling promise, and links to Weave's docs.

## Acceptance criteria
- [ ] `npm i && npm run dev` opens in demo mode with no `.env` and no network access. `npm run build` and `npm run lint` pass. Typecheck runs with `strict: true` and has zero errors.
- [ ] Every demo case listed above is visible and reachable from the table filters. Each one opens a correct drawer.
- [ ] Importing `public/demo/routing-decisions.ndjson` through file import gives the same counts as demo mode. A file with 1 malformed line and 1 unknown extra column loads, with "1 line skipped" and no crash.
- [ ] Live mode works as follows, all of it covered by unit tests with mocked fetch:
  - It follows the cursor across at least 2 pages and stops on `X-Weave-Has-More: false`.
  - It dedupes repeated `id`s.
  - It handles 401, 404 and 429.
- [ ] Key safety, covered by tests or grep:
  - The key never appears in localStorage, cookies, URLs or console output.
  - The proxy forwards only allow-listed GET paths and rejects non-https and private hosts.
  - `git grep -nE "ra_[A-Za-z0-9]{8,}|rk_[A-Za-z0-9]{8,}"` returns nothing.
- [ ] `decision_reason` is never passed to any grouping or parsing function. Add a unit test asserting the aggregations don't read it.
- [ ] Lighthouse accessibility is at least 90. The app is usable at 375px width and there are no console errors.
- [ ] One Playwright smoke test covers this flow: load demo → filter `failover_used` → open drawer → see the candidate list.

## README.md (write it)
- **Problem:** quote Weave's docs: "For request-by-request rows, filter the analytics export on `session_id`. There is no local decision log on the machine." The dashboard drill-down doesn't show candidates, score, sticky/failover or the decision note.
- **What this does,** with a screenshot or GIF placeholder and the live demo link.
- **The three data modes,** and exactly how to get an `ra_` key (Weave dashboard → Settings → API keys → Issue key → scope "Analytics (read-only)").
- **Key handling and security model:** session-only storage, the stateless proxy and the allow-list, and why the proxy exists (CORS).
- **Local dev, tests and the demo-data seed script.**
- **Assumptions A1–A4,** with how to verify and fix each in `src/lib/adapters/`.
- **What I'd build next:** a `POST /v1/route` what-if panel (needs an `rk_` routing key, so it's deliberately not in v1), per-candidate score view if Weave ever exports it, and session diffing.
- **Disclaimer:** "Unofficial. Not affiliated with or endorsed by Workweave, Inc." License MIT. Credit that Weave Router is Apache-2.0.

## Vercel deploy steps (put these in the README too)
1. `git init && git add -A && git commit -m "init"`, then create the GitHub repo `ishank-labs/weave-decision-explorer` and push.
2. vercel.com → Add New → Project → import the repo. Framework preset Next.js, defaults unchanged. **Add no environment variables**, because none are required. Optionally set `NEXT_PUBLIC_DEFAULT_ROUTER_URL=https://router.workweave.ai`, which is not a secret.
3. Deploy, then set the project name or domain to `weave-decision-explorer.vercel.app`.
4. Post-deploy check:
   - Demo mode loads.
   - No console errors.
   - `/api/weave/v1/analytics/schema` without a key returns the upstream 401, passed through.
   - A request to a non-allow-listed path returns 403.
   - Mobile layout works.
5. Add an OG image (`app/opengraph-image.tsx`) titled "Why did the router pick that model?" with no Weave logo.

## Milestones (commit after each)
1. Scaffold, Tailwind, layout and footer, plus `.gitignore` and `.env.example`.
2. `schema.ts` (zod), the `Decision` type, the seed script and the demo NDJSON.
3. Store, demo source, overview KPIs and the "Why it moved" chart.
4. Decisions table, filters and CSV.
5. Drawer and session timeline.
6. File import.
7. Proxy route, live source and key handling.
8. Adapters (A1/A2) and the savings estimate.
9. Tests (Vitest + Playwright) and the README.
10. Polish: accessibility, mobile and the OG image.

Stop and ask before adding any endpoint, field or dependency not listed here.
