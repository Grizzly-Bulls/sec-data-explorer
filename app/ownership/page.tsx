import Link from 'next/link';

import { getSecCompanyOwnership } from '@/src/lib/secApi';
import { isValidSecIssuerCik } from '@/src/lib/secApiCore';
import type { SecCompanyOwnershipResponse, SecOwnershipSource } from '@/src/lib/secApiTypes';

export const metadata = {
  title: 'Company ownership',
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function display(value: string | null | undefined): string {
  return value || '—';
}

function formatUsd(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function SourceList({ sources }: { sources: SecOwnershipSource[] }) {
  return (
    <div className="source-list">
      {sources.map((source) => (
        <article key={source.sourceId}>
          <strong>{source.publisher}</strong>
          <span>{source.title}</span>
          <small>{source.locator.kind}: {display(source.locator.value)}</small>
          <small>Published {display(source.publishedAt)}</small>
        </article>
      ))}
    </div>
  );
}

export default async function OwnershipPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const cik = first(query.cik).trim();
  const submitted = query.cik !== undefined;
  const validCik = !cik || isValidSecIssuerCik(cik);
  const ready = Boolean(cik && validCik);

  let response: SecCompanyOwnershipResponse | null = null;
  let error: string | null = null;
  if (ready) {
    try {
      response = await getSecCompanyOwnership({ cik, limit: 25 });
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Company ownership could not be loaded.';
    }
  }

  const company = response?.data.company;
  const positions = response?.data.positions || [];
  const beneficialPositions = response?.data.beneficialOwnershipPositions || [];
  const pagination = response?.pagination;
  const beneficialOwnershipPagination = response?.beneficialOwnershipPagination;
  const meta = response?.meta;

  return (
    <div className="shell page-stack">
      <section className="page-heading">
        <p className="eyebrow">Commercially admitted company ownership</p>
        <h1>Explore reviewed current ownership without pretending it is a complete register.</h1>
        <p>This company-centric endpoint combines a commercially admitted current Section 16 subset with separately modeled Schedule 13 beneficial aggregates. It deliberately excludes Form 13F holdings.</p>
      </section>

      <section className="ownership-boundary">
        <article>
          <p className="card-eyebrow">Company-centric</p>
          <h3>This page</h3>
          <p>Reviewed current Section 16-derived positions and admitted Schedule 13 beneficial aggregates for one canonical issuer.</p>
        </article>
        <article>
          <p className="card-eyebrow">Filing-centric</p>
          <h3>Form 13F is separate</h3>
          <p>13F holdings remain exact-accession filing observations, without amendment merging or company/security identity inference.</p>
          <Link className="text-link" href="/institutional-holdings">Open 13F holdings explorer →</Link>
        </article>
      </section>

      <form className="search-panel" action="/ownership" method="get">
        <div className="field-grid single-field-grid">
          <label>
            SEC issuer CIK
            <input name="cik" defaultValue={cik} placeholder="0000320193" inputMode="numeric" autoComplete="off" />
            <small>Reviewed issuer identity; 1–10 digits.</small>
          </label>
        </div>
        <div className="search-actions">
          <button className="button primary" type="submit">Load ownership</button>
          {submitted ? <Link className="text-link" href="/ownership">Clear</Link> : null}
        </div>
      </form>

      {submitted && !cik ? (
        <section className="error-panel" role="alert">
          <strong>Issuer CIK required</strong>
          <p>Enter the reviewed SEC issuer CIK for the company-centric ownership endpoint.</p>
        </section>
      ) : null}

      {!validCik ? (
        <section className="error-panel" role="alert">
          <strong>Invalid issuer CIK</strong>
          <p>Use 1–10 digits.</p>
        </section>
      ) : null}

      {error ? (
        <section className="error-panel" role="alert">
          <strong>Ownership unavailable</strong>
          <p>{error}</p>
        </section>
      ) : null}

      {company && meta && pagination && beneficialOwnershipPagination ? (
        <>
          <section className="detail-hero compact-hero">
            <div className="filing-topline">
              <span className="form-badge">Canonical issuer</span>
              <span>Knowledge as of {meta.knowledgeAsOf}</span>
            </div>
            <h2>{company.name}</h2>
            <div className="financial-company-line">
              <span>CIK <code>{company.secIssuerCik}</code></span>
              <span>Company ID <code>{company.companyId}</code></span>
            </div>
          </section>

          <section className="notice-panel ownership-warning">
            <strong>Reviewed subset, not a complete beneficial-ownership register</strong>
            <p>Commercial admission is required, unresolved person identity is excluded, and only current admitted positions are returned. Form 13F holdings are explicitly not included here.</p>
          </section>

          <section className="ownership-semantics" aria-label="Ownership coverage and semantics">
            <article><strong>{meta.coverage.section16CurrentDisclosedPositions}</strong><span>Section 16 coverage</span></article>
            <article><strong>{meta.coverage.schedule13BeneficialOwnership}</strong><span>Schedule 13 coverage</span></article>
            <article><strong>{meta.semantics.completeBeneficialOwnership ? 'yes' : 'no'}</strong><span>complete beneficial ownership</span></article>
            <article><strong>{meta.semantics.institutionalHoldingsIncluded ? 'yes' : 'no'}</strong><span>13F included here</span></article>
          </section>

          <section className="results-stack">
            <div className="results-heading">
              <div>
                <p className="eyebrow">Current Section 16-derived positions</p>
                <h2>{positions.length} admitted position{positions.length === 1 ? '' : 's'}</h2>
              </div>
              <span className="response-meta">{pagination.returned} of {pagination.total} returned</span>
            </div>
            {positions.length > 0 ? (
              <div className="ownership-list">
                {positions.map((item) => (
                  <article className="ownership-card" key={item.version.versionId}>
                    <div className="ownership-card-heading">
                      <div>
                        <span className="ownership-kind">Section 16 · {item.position.ownershipKind}</span>
                        <h3>{item.owner.name}</h3>
                        <p>{item.security.name}{item.security.ticker ? ` · ${item.security.ticker}` : ''}</p>
                      </div>
                      <div className="ownership-value">
                        <code>{item.position.currentBasisUnits}</code>
                        <span>current basis units</span>
                      </div>
                    </div>
                    <dl className="ownership-data-grid">
                      <div><dt>Reporting owner CIK</dt><dd><code>{item.owner.reportingOwnerCik}</code></dd></div>
                      <div><dt>Relationship</dt><dd>{item.position.relationshipState}</dd></div>
                      <div><dt>Reported units</dt><dd>{display(item.position.reportedUnits)}</dd></div>
                      <div><dt>Reported as of</dt><dd>{item.position.reportedAsOfDate}</dd></div>
                      <div><dt>Valuation as of</dt><dd>{item.position.valuationAsOfDate}</dd></div>
                      <div><dt>Current value</dt><dd>{formatUsd(item.position.currentValueUsd)}</dd></div>
                    </dl>
                    <details className="ownership-details">
                      <summary>Filing, version, and sources</summary>
                      <dl className="ownership-data-grid details-grid">
                        <div><dt>Filing</dt><dd><Link href={`/filings/${item.filing.accessionNumber}`}><code>{item.filing.accessionNumber}</code></Link></dd></div>
                        <div><dt>Form</dt><dd>{item.filing.form}</dd></div>
                        <div><dt>Effective date</dt><dd>{item.filing.effectiveDate}</dd></div>
                        <div><dt>Version</dt><dd><code>{item.version.versionId}</code></dd></div>
                      </dl>
                      <SourceList sources={item.sources} />
                    </details>
                  </article>
                ))}
              </div>
            ) : (
              <section className="notice-panel"><p>No commercially admitted current Section 16-derived positions were returned for this company.</p></section>
            )}
            {pagination.hasMore ? (
              <section className="notice-panel"><p>The public response is capped at {pagination.limit} rows for this request; {pagination.total} admitted Section 16-derived positions are available.</p></section>
            ) : null}
          </section>

          <section className="results-stack">
            <div className="results-heading">
              <div>
                <p className="eyebrow">Schedule 13 beneficial aggregates</p>
                <h2>{beneficialPositions.length} admitted aggregate{beneficialPositions.length === 1 ? '' : 's'}</h2>
              </div>
              <span className="response-meta">{beneficialOwnershipPagination.returned} of {beneficialOwnershipPagination.total} returned</span>
            </div>
            {beneficialPositions.length > 0 ? (
              <div className="ownership-list">
                {beneficialPositions.map((item) => (
                  <article className="ownership-card beneficial-card" key={item.version.versionId}>
                    <div className="ownership-card-heading">
                      <div>
                        <span className="ownership-kind">Schedule 13 · beneficial aggregate</span>
                        <h3>{item.owner.name}</h3>
                        <p>{item.security.name}{item.security.ticker ? ` · ${item.security.ticker}` : ''}</p>
                      </div>
                      <div className="ownership-value">
                        <code>{item.position.reportedShares}</code>
                        <span>reported shares</span>
                      </div>
                    </div>
                    <dl className="ownership-data-grid">
                      <div><dt>Relationship</dt><dd>{item.position.relationshipState}</dd></div>
                      <div><dt>Reported as of</dt><dd>{item.position.reportedAsOfDate}</dd></div>
                      <div><dt>Valuation treatment</dt><dd>{item.position.valuationTreatment}</dd></div>
                      <div><dt>Continuity through</dt><dd>{item.materialContinuity.throughDate}</dd></div>
                      <div><dt>Exact shares reobserved</dt><dd>{item.materialContinuity.exactShareCountReobserved ? 'yes' : 'no'}</dd></div>
                      <div><dt>Methodology</dt><dd>{item.materialContinuity.methodologyVersion}</dd></div>
                    </dl>
                    <details className="ownership-details">
                      <summary>Filing, continuity, and sources</summary>
                      <dl className="ownership-data-grid details-grid">
                        <div><dt>Filing</dt><dd><Link href={`/filings/${item.filing.accessionNumber}`}><code>{item.filing.accessionNumber}</code></Link></dd></div>
                        <div><dt>Version</dt><dd><code>{item.version.versionId}</code></dd></div>
                        <div><dt>Knowledge recorded</dt><dd>{item.version.knowledgeRecordedAt}</dd></div>
                        <div><dt>Knowledge valid from</dt><dd>{item.version.knowledgeValidFrom}</dd></div>
                      </dl>
                      <SourceList sources={item.sources} />
                    </details>
                  </article>
                ))}
              </div>
            ) : (
              <section className="notice-panel"><p>No commercially admitted Schedule 13 beneficial aggregates were returned for this company.</p></section>
            )}
          </section>

          <section className="notice-panel">
            <strong>Need institutional holdings?</strong>
            <p>Do not infer them from this company-centric view. Use one exact 13F-HR or 13F-HR/A accession in the source-faithful holdings explorer.</p>
            <Link className="text-link" href="/institutional-holdings">Explore exact-filing 13F holdings →</Link>
          </section>

          <section className="response-strip">
            <span>API version <strong>{meta.apiVersion}</strong></span>
            <span>Authority <strong>{meta.sourceAuthority}</strong></span>
            <span>Effective as of <strong>{meta.effectiveAsOf || '—'}</strong></span>
            <span>Request-time SEC fetch <strong>{meta.semantics.requestTimeSecFetch ? 'yes' : 'no'}</strong></span>
          </section>
        </>
      ) : null}

      {!submitted ? (
        <section className="notice-panel">
          <strong>Start with a reviewed issuer CIK</strong>
          <p>This surface answers a company-centric question. For institutional manager holdings, use an exact Form 13F accession instead.</p>
        </section>
      ) : null}
    </div>
  );
}
