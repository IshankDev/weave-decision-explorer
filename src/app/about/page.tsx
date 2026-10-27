export default function AboutPage() {
  return (
    <article className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">About</h1>
        <p className="mt-2 text-muted">
          Unofficial Routing Decision Explorer for{" "}
          <a
            className="text-accent hover:underline"
            href="https://github.com/weave-os/router"
            target="_blank"
            rel="noreferrer"
          >
            Weave Router
          </a>
          . It answers one question for every routed model call:{" "}
          <em>why did the router pick this model?</em>
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Data flow</h2>
        <pre className="overflow-x-auto rounded-md bg-surface p-4 font-mono text-xs ring-1 ring-border">
{`browser (sessionStorage key)
  → GET /api/weave/v1/analytics/...  (stateless Next.js proxy)
  → your router  (Authorization: Bearer ra_…)
  → NDJSON rows rendered in this app`}
        </pre>
        <p className="text-sm text-muted">
          The proxy exists because the hosted router does not send CORS{" "}
          <code className="font-mono">Access-Control-Allow-Origin</code>. It forwards only
          allow-listed GET paths, never caches, and never logs headers or bodies.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Key handling</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Only <code className="font-mono">ra_</code> analytics keys are accepted.</li>
          <li>Stored in <code className="font-mono">sessionStorage</code> + React state only.</li>
          <li>Never localStorage, cookies, URL params, or analytics.</li>
          <li>Closing the tab clears it. Use &ldquo;Forget key&rdquo; anytime.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Weave docs</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            <a
              className="text-accent hover:underline"
              href="https://docs.weaveos.com/router/analytics-export"
              target="_blank"
              rel="noreferrer"
            >
              Analytics export
            </a>
          </li>
          <li>
            <a
              className="text-accent hover:underline"
              href="https://docs.weaveos.com/router/reporting"
              target="_blank"
              rel="noreferrer"
            >
              Reporting
            </a>
          </li>
        </ul>
      </section>

      <p className="text-sm text-muted">
        Unofficial. Not affiliated with or endorsed by Workweave, Inc.
      </p>
    </article>
  );
}
