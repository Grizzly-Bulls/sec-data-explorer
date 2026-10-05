import type { Metadata } from 'next';
import Link from 'next/link';

import './globals.css';
import './intelligence.css';
import './financials.css';
import './ownership.css';

export const metadata: Metadata = {
  title: {
    default: 'SEC Data Explorer',
    template: '%s · SEC Data Explorer',
  },
  description:
    'Open-source reference app for exploring retained SEC filings, filing intelligence, point-in-time financials, and reviewed ownership with the Grizzly Bulls SEC Data API.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="shell header-inner">
            <Link className="brand" href="/">
              <span className="brand-mark" aria-hidden="true">GB</span>
              <span>
                <strong>SEC Data Explorer</strong>
                <small>Grizzly Bulls reference app</small>
              </span>
            </Link>
            <nav className="top-nav" aria-label="Primary navigation">
              <Link href="/filings">Filings</Link>
              <Link href="/filing-diff">Diffs</Link>
              <Link href="/financials">Financials</Link>
              <Link href="/ownership">Ownership</Link>
              <a href="https://github.com/Grizzly-Bulls/sec-data-explorer">GitHub</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="shell footer-inner">
            <p>Built against the public Grizzly Bulls SEC Data API.</p>
            <div>
              <a href="https://grizzlybulls.com/sec-api">Developer hub</a>
              <a href="https://grizzlybulls.com/api/v1/sec/openapi">OpenAPI 3.1</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
