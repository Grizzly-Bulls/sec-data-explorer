import Link from 'next/link';

import { getSecInstitutionalHoldings } from '@/src/lib/secApi';
import {
  buildExplorerInstitutionalHoldingsHref,
  isValidAccessionNumber,
  parseNonNegativeOffset,
  SEC_EXPLORER_PAGE_SIZE,
} from '@/src/lib/secApiCore';
import type { SecInstitutionalHoldingsResponse } from '@/src/lib/secApiTypes';

export const metadata = {
  title: 'Form 13F institutional holdings',
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function display(value: string | null | undefined): string {
  return value || '—';
}

export default async function InstitutionalHoldingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const accession = first(query.accession).trim();
  const offset = parseNonNegativeOffset(first(query.offset));
  const submitted = query.accession !== undefined;
  const validAccession = !accession || isValidAccessionNumber(accession);
  const ready = Boolean(accession && validAccession);

  let response: SecInstitutionalHoldingsResponse | null = null;
  let error: string | null = null;
  if (ready) {
    try {
      response = await getSecInstitutionalHoldings({
        accessionNumber: accession,
        limit: SEC_EXPLORER_PAGE_SIZE,
        offset,
      });
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Institutional holdings could not be loaded.';
    }
  }

  const filing = response?.data.filing;
  const holdings = response?.data.holdings || [];
  const pagination = response?.pagination;
  const meta = response?.meta;

  return (
    <div className="shell page-stack">
      <section className="page-heading">
        <p className="eyebrow">Source-faithful Form 13F holdings</p>
        <h1>Inspect one exact 13F filing without inventing company positions.</h1>
        <p>Enter a 13F-HR or 13F-HR/A accession. Issuer names, CUSIPs, manager identity, values, amounts, discretion, and voting authority remain filing observations.</p>
      </section>

      <section className="ownership-boundary">
        <article>
          <p className="card-eyebrow">Exact filing</p>
          <h3>This page</h3>
          <p>One explicit accession. No automatic amendment merge, manager canonicalization, or issuer/company resolution.</p>
        </article>
        <article>
          <p className="card-eyebrow">Company-centric</p>
          <h3>Current admitted ownership is separate</h3>
          <p>For reviewed current Section 16 and Schedule 13 subsets, query the canonical company ownership endpoint instead.</p>
          <Link className="text-link" href="/ownership">Open company ownership →</Link>
        </article>
      </section>

      <form className="search-panel" action="/institutional-holdings" method="get">
        <div className="field-grid single-field-grid">
          <label>
            Exact Form 13F accession
            <input name="accession" defaultValue={accession} placeholder="0001067983-26-000003" autoComplete="off" />
            <small>Exact SEC accession shape: 0000000000-00-000000.</small>
          </label>
        </div>
        <div className="search-actions">
          <button className="button primary" type="submit">Load 13F holdings</button>
          {submitted ? <Link className="text-link" href="/institutional-holdings">Clear</Link> : null}
        </div>
      </form>

      {submitted && !accession ? (
        <section className="error-panel" role="alert">
          <strong>Accession required</strong>
          <p>Enter one exact 13F-HR or 13F-HR/A accession.</p>
        </section>
      ) : null}

      {!validAccession ? (
        <section className="error-panel" role="alert">
          <strong>Invalid accession number</strong>
          <p>Use the exact SEC accession shape <code>0000000000-00-000000</code>.</p>
        </section>
      ) : null}

      {error ? (
        <section className="error-panel" role="alert">
          <strong>Institutional holdings unavailable</strong>
          <p>{error}</p>
        </section>
      ) : null}

      {filing && pagination && meta ? (
        <>
          <section className="detail-hero compact-hero">
            <div className="filing-topline">
              <span className="form-badge">{filing.formType}</span>
              <span>Report period {filing.reportPeriod}</span>
            </div>
            <h2>{filing.manager.observedName}</h2>
            <div className="financial-company-line">
              <span>Manager observed CIK <code>{filing.manager.observedCik}</code></span>
              <span>Filed {filing.filingDate}</span>
              <Link className="text-link" href={`/filings/${filing.accessionNumber}`}>Open filing detail →</Link>
            </div>
          </section>

          <section className="notice-panel ownership-warning">
            <strong>Filing observations, not canonical company/security identities</strong>
            <p>The manager name is observed from the filing header, issuer names are reported labels, CUSIP is not promoted into canonical security identity, and the API applies no company resolution to these rows.</p>
          </section>

          <section className="ownership-semantics" aria-label="13F semantics">
            <article><strong>{meta.semantics.exactAccessionScoped ? 'yes' : 'no'}</strong><span>exact accession scoped</span></article>
            <article><strong>{meta.semantics.automaticAmendmentMerge ? 'yes' : 'no'}</strong><span>automatic amendment merge</span></article>
            <article><strong>{meta.semantics.managerIdentityCanonicalized ? 'yes' : 'no'}</strong><span>manager canonicalized</span></article>
            <article><strong>{meta.semantics.companyResolutionApplied ? 'yes' : 'no'}</strong><span>company resolution applied</span></article>
          </section>

          <section className="results-stack">
            <div className="results-heading">
              <div>
                <p className="eyebrow">Information-table rows</p>
                <h2>{pagination.total} reported holding{pagination.total === 1 ? '' : 's'}</h2>
              </div>
              <span className="response-meta">Showing {pagination.offset + 1}–{pagination.offset + pagination.returned}<br />Values reported in thousands USD</span>
            </div>

            {holdings.length > 0 ? (
              <div className="holdings-list">
                {holdings.map((holding) => (
                  <article className="holding-row" key={`${holding.sourceOrdinal}-${holding.cusip}`}>
                    <div className="holding-identity">
                      <span className="source-ordinal">#{holding.sourceOrdinal}</span>
                      <div>
                        <h3>{holding.nameOfIssuer}</h3>
                        <p>{holding.titleOfClass}</p>
                        <code>CUSIP {holding.cusip}</code>
                      </div>
                    </div>
                    <dl className="holding-data">
                      <div><dt>Reported value</dt><dd><code>{holding.reportedValueThousandsUsd}</code> × $1,000</dd></div>
                      <div><dt>Reported amount</dt><dd><code>{holding.reportedAmount}</code> {holding.reportedAmountType}</dd></div>
                      <div><dt>Put / call</dt><dd>{display(holding.putCall)}</dd></div>
                      <div><dt>Discretion</dt><dd>{holding.investmentDiscretion}</dd></div>
                    </dl>
                    <dl className="vote-data">
                      <div><dt>Sole</dt><dd>{holding.votingAuthority.sole}</dd></div>
                      <div><dt>Shared</dt><dd>{holding.votingAuthority.shared}</dd></div>
                      <div><dt>None</dt><dd>{holding.votingAuthority.none}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <section className="notice-panel"><p>No retained information-table rows were returned for this exact filing.</p></section>
            )}

            <nav className="pagination" aria-label="Institutional holdings pagination">
              {pagination.offset > 0 ? (
                <Link className="button secondary" href={buildExplorerInstitutionalHoldingsHref(accession, Math.max(0, pagination.offset - pagination.limit))}>← Previous</Link>
              ) : <span />}
              <span>Offset {pagination.offset} · {pagination.returned} returned</span>
              {pagination.hasMore && pagination.nextOffset !== null ? (
                <Link className="button secondary" href={buildExplorerInstitutionalHoldingsHref(accession, pagination.nextOffset)}>Next →</Link>
              ) : <span />}
            </nav>
          </section>

          <section className="response-strip">
            <span>API version <strong>{meta.apiVersion}</strong></span>
            <span>Authority <strong>{meta.sourceAuthority}</strong></span>
            <span>Manager identity <strong>{filing.manager.identityAuthority}</strong></span>
            <span>Request-time SEC fetch <strong>{meta.semantics.requestTimeSecFetch ? 'yes' : 'no'}</strong></span>
          </section>
        </>
      ) : null}

      {!submitted ? (
        <section className="notice-panel">
          <strong>Start from an exact filing</strong>
          <p>Search <code>13F-HR</code> filings first if you do not already have an accession. The explorer will not choose a manager filing or merge amendments for you.</p>
          <Link className="text-link" href="/filings?form=13F-HR">Search 13F-HR filings →</Link>
        </section>
      ) : null}
    </div>
  );
}
