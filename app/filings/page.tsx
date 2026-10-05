import Link from 'next/link';

import { searchSecFilings } from '@/src/lib/secApi';
import {
  buildExplorerSearchHref,
  parseNonNegativeOffset,
  SEC_EXPLORER_PAGE_SIZE,
} from '@/src/lib/secApiCore';
import type { SecFilingSearchResponse } from '@/src/lib/secApiTypes';

export const metadata = {
  title: 'Filing search',
  description: 'Search retained SEC filing metadata by form, CIK, and filing date.',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
}

export default async function FilingsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const form = first(raw.form).trim();
  const cik = first(raw.cik).trim();
  const filedFrom = first(raw.filedFrom).trim();
  const filedTo = first(raw.filedTo).trim();
  const offset = parseNonNegativeOffset(first(raw.offset));
  const shouldSearch = Boolean(form || cik || filedFrom || filedTo);

  let result: SecFilingSearchResponse | null = null;
  let error: string | null = null;

  if (shouldSearch) {
    try {
      result = await searchSecFilings({
        form: form || undefined,
        cik: cik || undefined,
        filedFrom: filedFrom || undefined,
        filedTo: filedTo || undefined,
        limit: SEC_EXPLORER_PAGE_SIZE,
        offset,
      });
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'The filing search could not be completed.';
    }
  }

  const common = {
    form: form || undefined,
    cik: cik || undefined,
    filedFrom: filedFrom || undefined,
    filedTo: filedTo || undefined,
  };

  return (
    <div className="shell page-stack">
      <section className="page-heading">
        <p className="eyebrow">Retained filing discovery</p>
        <h1>Search SEC filings</h1>
        <p>Search retained filing metadata without proxying your request to SEC.gov. Use at least one filter in this reference UI.</p>
      </section>

      <form className="search-panel" action="/filings" method="get">
        <div className="field-grid">
          <label>
            <span>Form type</span>
            <input name="form" defaultValue={form} placeholder="10-K" maxLength={64} />
            <small>Exact normalized form, such as 10-K, 8-K, or 13F-HR.</small>
          </label>
          <label>
            <span>Observed filer CIK</span>
            <input name="cik" defaultValue={cik} placeholder="0000320193" inputMode="numeric" pattern="[0-9]{1,10}" maxLength={10} />
            <small>The filing&apos;s observed SEC CIK, not an inferred canonical identity.</small>
          </label>
          <label>
            <span>Filed from</span>
            <input name="filedFrom" defaultValue={filedFrom} type="date" />
          </label>
          <label>
            <span>Filed to</span>
            <input name="filedTo" defaultValue={filedTo} type="date" />
          </label>
        </div>
        <div className="search-actions">
          <button className="button primary" type="submit">Search retained filings</button>
          {shouldSearch ? <Link className="text-link" href="/filings">Clear filters</Link> : null}
        </div>
      </form>

      {!shouldSearch ? (
        <section className="notice-panel">
          <strong>Choose a bounded search.</strong>
          <p>This demo intentionally asks for a form, CIK, or filing-date boundary before querying. The underlying API contract remains authoritative for supported parameters.</p>
        </section>
      ) : null}

      {error ? (
        <section className="error-panel" role="alert">
          <strong>Search unavailable</strong>
          <p>{error}</p>
        </section>
      ) : null}

      {result ? (
        <section className="results-stack">
          <div className="results-heading">
            <div>
              <p className="eyebrow">API response</p>
              <h2>{result.pagination.returned} filing{result.pagination.returned === 1 ? '' : 's'} returned</h2>
            </div>
            <div className="response-meta">
              <span>{result.meta.sourceAuthority}</span>
              <span>Retrieved {formatDateTime(result.meta.retrievedAt)} UTC</span>
            </div>
          </div>

          {result.data.filings.length === 0 ? (
            <div className="notice-panel"><strong>No retained filings matched these filters.</strong></div>
          ) : (
            <div className="filing-list">
              {result.data.filings.map((filing) => (
                <article className="filing-card" key={filing.accessionNumber}>
                  <div className="filing-topline">
                    <span className="form-badge">{filing.formType}</span>
                    <time dateTime={filing.filingDate}>{filing.filingDate}</time>
                  </div>
                  <h3>{filing.observedFiler.name || 'Observed filer name unavailable'}</h3>
                  <dl className="compact-data">
                    <div><dt>CIK</dt><dd>{filing.observedFiler.cik || '—'}</dd></div>
                    <div><dt>Accession</dt><dd><code>{filing.accessionNumber}</code></dd></div>
                  </dl>
                  <Link className="card-link" href={`/filings/${encodeURIComponent(filing.accessionNumber)}`}>Inspect filing →</Link>
                </article>
              ))}
            </div>
          )}

          <nav className="pagination" aria-label="Filing search pagination">
            {result.pagination.offset > 0 ? (
              <Link className="button secondary" href={buildExplorerSearchHref({ ...common, offset: Math.max(0, result.pagination.offset - result.pagination.limit) })}>← Previous</Link>
            ) : <span />}
            <span>Offset {result.pagination.offset}</span>
            {result.pagination.hasMore && result.pagination.nextOffset !== null ? (
              <Link className="button secondary" href={buildExplorerSearchHref({ ...common, offset: result.pagination.nextOffset })}>Next →</Link>
            ) : <span />}
          </nav>
        </section>
      ) : null}
    </div>
  );
}
