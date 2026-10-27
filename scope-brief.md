# Scope brief: Weave Router, Routing Decision Explorer

**Repo:** `ishank-labs/weave-decision-explorer` · **Deploy:** Vercel (`weave-decision-explorer.vercel.app`) · **Effort:** about 5h · **Rechecked:** 2026-10-27 IST

## Problem
Weave Router picks a model for every upstream call (an "action"), but there is still no per-decision "why" view. What exists today:
- An opt-in one-line chat marker, e.g. `✦ Weave Router → model · request classified as high difficulty`. It shipped in #1463 (2026-09-24) and was reformatted in #1843 (2026-10-26).
- Dashboard charts with a drill-down from user to session to model pair. The drill-down table (`frontend/src/components/charts/DrillDownModal.tsx`) shows requested and decision model, provider, tokens, cost, latency and status. It does **not** show `decision_reason`, `candidate_models`, `chosen_score`, `sticky_hit` or `failover_used`.

Weave's own docs say: *"For request-by-request rows, filter the analytics export on `session_id`. There is no local decision log on the machine."* (docs.weaveos.com/router/reporting). The export is raw NDJSON meant for a warehouse: *"There is no dashboard in the loop"* (`docs/ANALYTICS_EXPORT.md`).

## User
An engineering lead or platform engineer whose team runs Claude Code, Codex or opencode through Weave Router. They want to know why a turn was downgraded, upgraded, pinned or failed over without writing SQL.

## Build
A standalone Next.js app on Weave's **public, read-only analytics export**. It needs none of Weave's private code. Data comes from one of three sources:
1. **Demo mode** (the default): seeded synthetic NDJSON shaped exactly like the schema v3 fields.
2. **File import:** drag-drop an `.ndjson` file produced by `GET /v1/analytics/routing-decisions`.
3. **Live read-only:** the user pastes an `ra_` analytics key and a router URL in the browser. The key is held in sessionStorage only. Requests go through a stateless pass-through route because the hosted router sends no CORS allow-origin.

## Features
- A decisions table with filters for session, `turn_type` (main_loop by default), requested vs decision model, sticky, failover, error class and date.
- A decision detail drawer showing:
  - requested vs served model
  - the candidate set, with the chosen model highlighted and `chosen_score`
  - sticky/failover/cross-format badges
  - `routing_strategy` and `route_id`
  - tokens, cost, latency breakdown (route, upstream, ttft) and outcome
  - `decision_reason` shown verbatim as prose. Per Weave's docs it is never parsed or grouped.
- A session timeline: actions in `requested_at` order, model switches marked, and retries and failovers collapsed by `request_id`.
- A "Why it moved" summary showing counts of downgrades, upgrades, stayed, sticky and failover, grouped only on stable fields.
- An optional savings estimate using `/v1/analytics/models` prices, labelled as an estimate per Weave's docs.

## Out of scope
- Live `POST /v1/route` what-if calls. These need an `rk_` routing key, which is not read-only. Save this for "what I'd build next."
- Any write or admin endpoint, accounts, a backend database, persisting keys, and Weave branding that looks official.

## Done = on the demo URL
- [ ] It loads in demo mode with no key and shows at least 3 seeded sessions (at least 40 rows) covering downgrade, upgrade, sticky, failover, subscription-served and error rows.
- [ ] Clicking any row opens the drawer with candidates, score, badges, latency and verbatim reason.
- [ ] Importing a real export `.ndjson` renders identically, and unknown or new columns are tolerated.
- [ ] Live mode pages through results with `X-Weave-Next-Cursor` and `X-Weave-Has-More`, and handles 401, 404 and 429 (`Retry-After`).
- [ ] The key never touches localStorage, logs, URLs or the repo. Closing the tab clears it.
- [ ] `npm run build` passes, there are no console errors, the layout works on mobile and desktop, and the footer reads "Built by Ishank, unofficial demo."

## Stack
Next.js (App Router) + TypeScript + Tailwind, plus zod for row validation. No database. Vercel Hobby.
