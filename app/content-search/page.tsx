import Link from 'next/link';

import { searchSecFilingContent } from '@/src/lib/secApi';
import {
  buildExplorerContentSearchHref,
  isValidAccessionNumber,
  isValidSecIssuerCik,
  isValidObservedFilerCikList,
  isValidSectionKey,
  parseNonNegativeOffset,
  type FilingContentSearchInput,
} from '@/src/lib/secApiCore';
import type { SecFilingContentSearchResponse } from '@/src/lib/secApiTypes';

import styles from './content-search.module.css';

export const metadata = {
  title: 'Search retained SEC filing text',
  description: 'Search retained SEC filing sections by literal terms, one observed filer or a selected peer cohort of up to ten CIKs, form and filing date.',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] ?? '' : value ?? '').trim();

function renderSnippet(snippet: string) {
  // The machine API uses square brackets to mark matched terms. React escapes
  // all text, so neither matching text nor hostile source text becomes markup.
  return snippet.split(/(\[[^\]\r\n]{1,100}\])/g).map((part, index) =>
    part.startsWith('[') && part.endsWith(']')
      ? <mark key={index}>{part.slice(1, -1)}</mark>
      : <span key={index}>{part}</span>);
}

export default async function ContentSearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = first(params.q);
  const cik = first(params.cik);
  const ciks = first(params.ciks);
  const form = first(params.form).toUpperCase();
  const filedFrom = first(params.filedFrom);
  const filedTo = first(params.filedTo);
  const offset = parseNonNegativeOffset(first(params.offset));
  const submitted = Boolean(q || cik || ciks || form || filedFrom || filedTo);
  const tokens = q.normalize('NFKC').match(/[\p{L}\p{N}]+/gu) ?? [];
  const validQuery = q.length >= 1 && q.length <= 200
    && tokens.length >= 1 && tokens.length <= 8
    && tokens.every(token => token.length <= 40);
  const validCik = !cik || isValidSecIssuerCik(cik);
  const validCiks = !ciks || isValidObservedFilerCikList(ciks);
  const validIssuerScope = !(cik && ciks);
  const validForm = !form || form === '10-K' || form === '10-Q' || form === '8-K';
  const validDates = (!filedFrom || /^\d{4}-\d{2}-\d{2}$/.test(filedFrom))
    && (!filedTo || /^\d{4}-\d{2}-\d{2}$/.test(filedTo))
    && (!filedFrom || !filedTo || filedFrom <= filedTo);

  const filters: FilingContentSearchInput = {
    q,
    cik: cik || undefined,
    ciks: ciks || undefined,
    form: validForm && form ? form as '10-K' | '10-Q' | '8-K' : undefined,
    filedFrom: filedFrom || undefined,
    filedTo: filedTo || undefined,
  };

  let result: SecFilingContentSearchResponse | null = null;
  let error: string | null = null;
  if (submitted && validQuery && validCik && validCiks && validIssuerScope && validForm && validDates) {
    try {
      result = await searchSecFilingContent({ ...filters, limit: 10, offset });
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'The retained filing text search could not be completed.';
    }
  }

  const invalid = submitted && (!validQuery || !validCik || !validCiks || !validIssuerScope || !validForm || !validDates);

  return (
    <div className="shell page-stack">
      <section className="page-heading">
        <p className="eyebrow">Retained section search</p>
        <h1>Find evidence inside SEC filings.</h1>
        <p>Search normalized text from retained 10-K, 10-Q and 8-K sections. Search one filer or compare selected peers using CIKs observed in the SEC filing catalog, not accession prefixes or guessed company identities.</p>
      </section>

      <form className="search-panel" action="/content-search" method="get">
        <div className="field-grid">
          <label>
            <span>Search words (all terms must match)</span>
            <input name="q" required maxLength={200} defaultValue={q} placeholder="liquidity cash" />
            <small>One to eight literal searchable words, not EDGAR query operators.</small>
          </label>
          <label>
            <span>Observed filer CIK (optional)</span>
            <input name="cik" maxLength={10} pattern="[0-9]{1,10}" inputMode="numeric"
              defaultValue={cik} placeholder="0000320193" />
            <small>Choose this field or the peer-company field below, not both.</small>
          </label>
          <label>
            <span>Peer-company observed CIKs (optional)</span>
            <input name="ciks" maxLength={160} defaultValue={ciks}
              placeholder="0000320193,0001045810" aria-describedby="peer-cik-help" />
            <small id="peer-cik-help">Enter 1–10 distinct, comma-separated CIKs. Apple: 0000320193 · NVIDIA: 0001045810. Only filers with indexed sections are searchable.</small>
          </label>
          <label>
            <span>Filing form</span>
            <select name="form" className={styles.select} defaultValue={form}>
              <option value="">All indexed forms</option>
              <option value="10-K">10-K</option>
              <option value="10-Q">10-Q</option>
              <option value="8-K">8-K</option>
            </select>
          </label>
          <label>
            <span>Filed from</span>
            <input type="date" name="filedFrom" defaultValue={filedFrom} />
          </label>
          <label>
            <span>Filed through</span>
            <input type="date" name="filedTo" defaultValue={filedTo} />
          </label>
        </div>
        <div className="search-actions">
          <button className="button primary" type="submit">Search filing text</button>
          <Link className="text-link" href="/content-search?q=liquidity&ciks=0000320193%2C0001045810&form=10-K">Try Apple + NVIDIA</Link>
          {submitted ? <Link className="text-link" href="/content-search">Clear filters</Link> : null}
        </div>
      </form>

      {!submitted ? (
        <section className="notice-panel">
          <strong>Search a bounded retained corpus.</strong>
          <p>Try &ldquo;liquidity&rdquo; for Apple and NVIDIA together, or select one observed filer. Every search word must match in a retained section. Results link to normalized text and exact filing evidence.</p>
        </section>
      ) : null}

      {invalid ? (
        <section className="error-panel" role="alert">
          <strong>Check your search filters</strong>
          <p>Provide one to eight searchable words (200 characters maximum), either one numeric CIK or 1–10 distinct comma-separated CIKs (not both), a supported form, and a valid filing-date range.</p>
        </section>
      ) : null}
      {error ? (
        <section className="error-panel" role="alert">
          <strong>Content search unavailable</strong>
          <p>{error}</p>
        </section>
      ) : null}

      {result ? (
        <section className="results-stack">
          <div className="results-heading">
            <div>
              <p className="eyebrow">Real SEC API results</p>
              <h2>{result.pagination.returned} matching section{result.pagination.returned === 1 ? '' : 's'} returned</h2>
            </div>
            <div className="response-meta">
              <span>{result.meta.sourceAuthority}</span>
              <span>Indexed {result.meta.indexedFilings.toLocaleString()} retained filings</span>
            </div>
          </div>
          <div className={styles.coverage} aria-label="Retained search coverage">
            <div><strong>{result.meta.indexedFilings.toLocaleString()}</strong><span>indexed filings</span></div>
            <div><strong>{result.meta.indexedSections.toLocaleString()}</strong><span>indexed sections</span></div>
            <div>
              <strong>{result.meta.indexedFilingsWithObservedCik?.toLocaleString() ?? 'Unknown'}</strong>
              <span>filings with observed CIK</span>
            </div>
            <div>
              <strong>{result.meta.indexedSectionsWithObservedCik?.toLocaleString() ?? 'Unknown'}</strong>
              <span>sections with observed CIK</span>
            </div>
          </div>

          {result.data.matches.length === 0 ? (
            <div className="notice-panel"><strong>No retained sections matched.</strong><p>Try broader literal terms or remove a filter. This is not a search of all EDGAR filings.</p></div>
          ) : (
            <div className={styles.results}>
              {result.data.matches.map((match, index) => {
                const validSource = isValidAccessionNumber(match.accessionNumber)
                  && isValidSectionKey(match.sectionKey);
                return (
                  <article className={styles.match} key={match.accessionNumber + match.sectionKey + index}>
                    <div className="filing-topline">
                      <span className="form-badge">{match.formType}</span>
                      <time dateTime={match.filingDate}>{match.filingDate}</time>
                      <span className={styles.cik}>Observed CIK: {match.observedFilerCik ?? 'not recorded'}</span>
                    </div>
                    <h3>{match.sectionTitle || match.sectionKey}</h3>
                    <p className={styles.excerpt}>{renderSnippet(match.snippet)}</p>
                    <div className={styles.provenance}>
                      <code>{match.accessionNumber}</code>
                      <code>{match.sectionKey}</code>
                    </div>
                    {validSource ? (
                      <div className={styles.links}>
                        <Link href={`/filings/${encodeURIComponent(match.accessionNumber)}/sections/${encodeURIComponent(match.sectionKey)}`}>
                          Read normalized section →
                        </Link>
                        <Link href={`/filings/${encodeURIComponent(match.accessionNumber)}`}>
                          View filing evidence →
                        </Link>
                      </div>
                    ) : null}
                    <details className={styles.hashes}>
                      <summary>Source and section SHA-256</summary>
                      <dl>
                        <div><dt>Source</dt><dd><code>{match.sourceContentSha256}</code></dd></div>
                        <div><dt>Section</dt><dd><code>{match.sectionContentSha256}</code></dd></div>
                      </dl>
                    </details>
                  </article>
                );
              })}
            </div>
          )}

          <nav className="pagination" aria-label="Content search pagination">
            {result.pagination.offset > 0 ? (
              <Link className="button secondary"
                href={buildExplorerContentSearchHref({ ...filters, offset: Math.max(0, result.pagination.offset - result.pagination.limit) })}>
                ← Previous
              </Link>
            ) : <span />}
            <span>Offset {result.pagination.offset}</span>
            {result.pagination.hasMore && result.pagination.nextOffset !== null ? (
              <Link className="button secondary"
                href={buildExplorerContentSearchHref({ ...filters, offset: result.pagination.nextOffset })}>
                Next →
              </Link>
            ) : <span />}
          </nav>
          <section className="notice-panel">
            <strong>Scope and provenance</strong>
            <p>This search includes only materialized, indexed filing sections—not every EDGAR filing, exhibit or original document. Peer results are ranked together, not allotted an equal number per company; a zero-match company may still have unindexed disclosures. CIK attribution is observed filing-catalog metadata, not canonical company identity. Section text is a normalized projection. No request-time SEC.gov fetch is performed.</p>
          </section>
          <section className="response-strip">
            <span>API authority <strong>{result.meta.sourceAuthority}</strong></span>
            <span>All words required <strong>{result.meta.semantics.searchTermsCombinedWithAnd ? 'yes' : 'no'}</strong></span>
            <span>Request-time SEC fetch <strong>{result.meta.semantics.requestTimeSecFetch ? 'yes' : 'no'}</strong></span>
          </section>
        </section>
      ) : null}
    </div>
  );
}
