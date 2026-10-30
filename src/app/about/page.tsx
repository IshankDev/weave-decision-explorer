export default function AboutPage() {
  return (
    <article className="max-w-2xl space-y-7">
      <div>
        <h1 className="display-title">About</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Unofficial Routing Decision Explorer for{" "}
          <a
            href="https://github.com/weave-os/router"
            target="_blank"
            rel="noreferrer"
          >
            Weave Router
          </a>
          . It answers one question for every routed model call:{" "}
          <span className="text-foreground">why did the router pick this model?</span>
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="section-title">Data flow</h2>
        <pre className="panel overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-muted-strong">
{`browser (sessionStorage key)
  → GET /api/weave/v1/analytics/...  (stateless Next.js proxy)
  → your router  (Authorization: Bearer ra_…)
  → NDJSON rows rendered in this app`}
        </pre>
        <p className="text-[13px] leading-relaxed text-muted">
          The proxy exists because the hosted router does not send CORS{" "}
          <code className="font-mono text-muted-strong">Access-Control-Allow-Origin</code>.
          It forwards only allow-listed GET paths, never caches, and never logs headers or
          bodies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="section-title">Key handling</h2>
        <ul className="list-disc space-y-2 pl-5 text-[13px] leading-relaxed text-muted">
          <li>
            Only <code className="font-mono text-muted-strong">ra_</code> analytics keys are
            accepted.
          </li>
          <li>
            Stored in <code className="font-mono text-muted-strong">sessionStorage</code> +
            React state only.
          </li>
          <li>Never localStorage, cookies, URL params, or analytics.</li>
          <li>Closing the tab clears it. Use “Forget key” anytime.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="section-title">Weave docs</h2>
        <ul className="list-disc space-y-2 pl-5 text-[13px]">
          <li>
            <a
              href="https://docs.weaveos.com/router/analytics-export"
              target="_blank"
              rel="noreferrer"
            >
              Analytics export
            </a>
          </li>
          <li>
            <a
              href="https://docs.weaveos.com/router/reporting"
              target="_blank"
              rel="noreferrer"
            >
              Reporting
            </a>
          </li>
        </ul>
      </section>

      <p className="text-[13px] text-muted">
        Unofficial. Not affiliated with or endorsed by Workweave, Inc.
      </p>
    </article>
  );
}
