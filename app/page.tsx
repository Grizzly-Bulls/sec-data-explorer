import Link from 'next/link';

const capabilities = [
  {
    eyebrow: 'Available now',
    title: 'Find and inspect retained filings',
    body: 'Search retained SEC filings, open exact accessions, read normalized 10-K/10-Q/8-K sections, and inspect deterministic filing structure.',
    href: '/filings',
    cta: 'Explore filings',
  },
  {
    eyebrow: 'Available now',
    title: 'Compare what changed',
    body: 'Compare two explicit 10-K, 10-Q, or 8-K accessions section by section without automatic amendment matching or a fabricated redline.',
    href: '/filing-diff',
    cta: 'Compare filings',
  },
  {
    eyebrow: 'Available now',
    title: 'Reconstruct what was knowable',
    body: 'Query canonical company financials in current-selection or source-available-as-of mode, while keeping reported facts and explicitly derived metrics separate.',
    href: '/financials',
    cta: 'Explore financials',
  },
  {
    eyebrow: 'Available now',
    title: 'Keep ownership models honest',
    body: 'Explore reviewed company ownership separately from exact-filing Form 13F holdings so filing observations are not silently promoted into canonical positions.',
    href: '/ownership',
    cta: 'Explore ownership',
  },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div>
            <p className="eyebrow">Open-source SEC API reference application</p>
            <h1>Build with SEC data without rebuilding the SEC data pipeline.</h1>
            <p className="hero-copy">
              SEC Data Explorer is a small, real application built only on the public Grizzly Bulls SEC Data API. Use it to inspect the integration, try the data model, or clone the code for your own server-side project.
            </p>
            <div className="button-row">
              <Link className="button primary" href="/filings">Explore filings</Link>
              <Link className="button secondary" href="/ownership">Ownership workflows</Link>
              <a className="button secondary" href="https://github.com/Grizzly-Bulls/sec-data-explorer">View source</a>
            </div>
          </div>
          <div className="terminal-card" aria-label="Example SEC ownership API requests">
            <div className="terminal-bar"><span></span><span></span><span></span></div>
            <pre><code>{`GET /api/v1/sec/companies/0000320193/ownership
→ admitted current company ownership
→ 13F explicitly excluded

GET /api/v1/sec/filings/{accession}/institutional-holdings
→ exact-filing 13F rows
→ no company/security resolution

Authorization: Bearer <server-key>`}</code></pre>
          </div>
        </div>
      </section>

      <section className="shell section">
        <div className="section-heading">
          <p className="eyebrow">Reference workflows</p>
          <h2>Start from a real developer job.</h2>
          <p>The app stays intentionally narrower than the machine API so each screen remains easy to read, copy, and adapt.</p>
        </div>
        <div className="card-grid capability-grid">
          {capabilities.map((capability) => (
            <article className="feature-card" key={capability.title}>
              <p className="card-eyebrow">{capability.eyebrow}</p>
              <h3>{capability.title}</h3>
              <p>{capability.body}</p>
              <Link href={capability.href}>{capability.cta} →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="shell section split-section">
        <div>
          <p className="eyebrow">Integration boundary</p>
          <h2>One public API. No hidden data path.</h2>
        </div>
        <div className="prose-panel">
          <p>The browser never receives an API key. Server-rendered routes call the same versioned SEC API available to every developer.</p>
          <div className="flow" aria-label="Application architecture">
            <span>Browser</span><b>→</b><span>Next.js server</span><b>→</b><span>Grizzly Bulls SEC API</span>
          </div>
          <p>There is no SEC database, EDGAR ingestion worker, private Grizzly Bulls dependency, or second source of truth inside this repository.</p>
        </div>
      </section>
    </>
  );
}
