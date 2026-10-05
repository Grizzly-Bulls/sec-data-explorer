import Link from 'next/link';

const capabilities = [
  {
    eyebrow: 'Available now',
    title: 'Find retained SEC filings',
    body: 'Search by exact form type, observed filer CIK, and filing-date window, then open the exact accession returned by the API.',
    href: '/filings',
    cta: 'Search filings',
  },
  {
    eyebrow: 'Public API capability',
    title: 'Compare what changed',
    body: 'The SEC API exposes normalized filing sections and explicit filing-to-filing diffs without requiring a request-time SEC.gov fetch.',
    href: 'https://grizzlybulls.com/sec-api',
    cta: 'View API capabilities',
  },
  {
    eyebrow: 'Public API capability',
    title: 'Reconstruct what was knowable',
    body: 'Point-in-time company financials can use an as-of timestamp so later source observations do not silently leak into historical analysis.',
    href: 'https://grizzlybulls.com/sec-api',
    cta: 'Explore the API',
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
              <a className="button secondary" href="https://github.com/Grizzly-Bulls/sec-data-explorer">View source</a>
            </div>
          </div>
          <div className="terminal-card" aria-label="Example SEC API request">
            <div className="terminal-bar"><span></span><span></span><span></span></div>
            <pre><code>{`GET /api/v1/sec/filings
  ?form=10-K
  &cik=0000320193

Authorization: Bearer <server-key>

→ retained filing metadata
→ exact accession identity
→ source provenance
→ no request-time SEC fetch`}</code></pre>
          </div>
        </div>
      </section>

      <section className="shell section">
        <div className="section-heading">
          <p className="eyebrow">Reference workflows</p>
          <h2>Start from a real developer job.</h2>
          <p>The app stays intentionally narrower than the machine API so each screen remains easy to read, copy, and adapt.</p>
        </div>
        <div className="card-grid">
          {capabilities.map((capability) => (
            <article className="feature-card" key={capability.title}>
              <p className="card-eyebrow">{capability.eyebrow}</p>
              <h3>{capability.title}</h3>
              <p>{capability.body}</p>
              {capability.href.startsWith('/') ? (
                <Link href={capability.href}>{capability.cta} →</Link>
              ) : (
                <a href={capability.href}>{capability.cta} →</a>
              )}
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
