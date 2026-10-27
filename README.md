# Weave Decision Explorer

Unofficial, standalone **Routing Decision Explorer** for [Weave Router](https://github.com/weave-os/router).

> For request-by-request rows, filter the analytics export on `session_id`. There is no local decision log on the machine.  
> — Weave docs ([reporting](https://docs.weaveos.com/router/reporting))

The Weave dashboard drill-down shows requested/decision model, tokens, cost, and latency — but not `decision_reason`, `candidate_models`, `chosen_score`, `sticky_hit`, or `failover_used`. The analytics export is raw NDJSON meant for a warehouse: *"There is no dashboard in the loop."* This app fills that gap.

**Live demo:** [weave-decision-explorer.vercel.app](https://weave-decision-explorer.vercel.app)  
**Screenshot / GIF:** _placeholder — add after first deploy_

## What this does

For every routed model call it answers: **why did the router pick this model?**

- Overview KPIs and a “Why it moved” breakdown (stayed / switched / sticky / failover)
- Filterable decisions table with CSV export
- Decision drawer: candidates, score, badges, latency, tokens, cost, and **verbatim** `decision_reason`
- Session timeline with retries/failovers collapsed by `request_id`
- Optional savings estimate from `/v1/analytics/models` (labelled as an estimate)

## Three data modes

1. **Demo (default)** — seeded synthetic NDJSON, no key, no network to Weave required after the page loads the static file.
2. **File import** — drag-drop a `.ndjson` / `.jsonl` export; parsed entirely in the browser.
3. **Live (read-only)** — paste an `ra_` analytics key + router URL. Requests go through a stateless Next.js proxy (CORS).

### How to get an `ra_` key

Weave dashboard → **Settings** → **API keys** → **Issue key** → scope **Analytics (read-only)**.

This app rejects anything that does not start with `ra_`. It never calls `POST /v1/route` or any write/admin endpoint.

## Key handling & security

- Key lives in **React state + `sessionStorage` only**
- Never `localStorage`, cookies, URL params, or analytics
- “Forget key” clears it; closing the tab clears it
- Proxy (`/api/weave/[...path]`) is **stateless**: allow-listed GET paths only, SSRF guard on `x-router-url`, `cache: 'no-store'`, no logging of headers/bodies
- Proxy exists because a browser preflight against the hosted router returned 404 with no `Access-Control-Allow-Origin` (ASSUMPTION A3)

## Local development

```bash
npm i
npm run seed:demo   # regenerates public/demo/routing-decisions.ndjson (deterministic)
npm run dev         # http://localhost:3000 — demo mode, no .env required
npm run typecheck
npm run lint
npm run build
npm test            # Vitest unit tests
npx playwright install chromium
npm run test:e2e    # Playwright smoke
```

Optional `.env.local` (from `.env.example`):

```
NEXT_PUBLIC_DEFAULT_ROUTER_URL=https://router.workweave.ai
```

No secrets are required. Never commit `.env*` except `.env.example`.

## Assumptions (isolated in `src/lib/adapters/`)

| ID | File | Assumption | How to verify / fix |
|----|------|------------|---------------------|
| A1 | `schemaAdapter.ts` | `/v1/analytics/schema` envelope unverified | Hit the endpoint with an `ra_` key; adjust parser; UI falls back to `"unknown"` |
| A2 | `pricesAdapter.ts` | `/v1/analytics/models` shape unverified | Same; if parse fails, savings estimate is hidden |
| A3 | `transport.ts` + `app/api/weave/[...path]/route.ts` | Browser CORS blocked; proxy required | Re-check preflight; if CORS appears, proxy can stay as a safe default |
| A4 | `format.ts` | Timestamps are RFC3339 | Invalid values render as `—` |

## What I'd build next

- A `POST /v1/route` what-if panel (needs an `rk_` routing key — deliberately out of v1)
- Per-candidate scores if Weave ever exports them
- Session diffing across time windows

## Vercel deploy

1. `git init && git add -A && git commit` (already done in this repo), create GitHub repo `ishank-labs/weave-decision-explorer`, push.
2. vercel.com → Add New → Project → import. Framework: Next.js. **Add no environment variables** (none required). Optionally set `NEXT_PUBLIC_DEFAULT_ROUTER_URL`.
3. Deploy; set domain to `weave-decision-explorer.vercel.app`.
4. Post-deploy check:
   - Demo mode loads
   - No console errors
   - `/api/weave/v1/analytics/schema` without a key returns upstream 401
   - Non-allow-listed path returns 403
   - Mobile layout works

## Disclaimer

Unofficial. Not affiliated with or endorsed by Workweave, Inc.

Built by Ishank, unofficial demo. Not affiliated with Weave.

License: **MIT**. Weave Router is Apache-2.0.
