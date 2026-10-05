import Link from 'next/link';

import { getSecCompanyFinancials } from '@/src/lib/secApi';
import {
  isValidAsOfTimestamp,
  isValidFinancialMetricKey,
  isValidFinancialPeriodScope,
  isValidSecIssuerCik,
  type FinancialPeriodScope,
} from '@/src/lib/secApiCore';
import type {
  SecCompanyFinancialsResponse,
  SecFinancialDerivedInput,
  SecFinancialReportedFact,
} from '@/src/lib/secApiTypes';

export const metadata = {
  title: 'Point-in-time financials',
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function display(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

function reportedPeriodLabel(fact: SecFinancialReportedFact): string {
  const labels = [fact.period.fiscalYearLabel, fact.period.fiscalPeriodLabel].filter(Boolean);
  return labels.length > 0 ? labels.join(' · ') : fact.period.periodId;
}

function inputValue(input: SecFinancialDerivedInput): string {
  if (input.value === null) return '—';
  return input.unit ? `${input.value} ${input.unit}` : input.value;
}

export default async function FinancialsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const cik = first(query.cik).trim();
  const periodInput = first(query.period).trim();
  const metric = first(query.metric).trim();
  const asOf = first(query.asOf).trim();
  const submitted = Boolean(cik || periodInput || metric || asOf);

  const validCik = !cik || isValidSecIssuerCik(cik);
  const validPeriod = !periodInput || isValidFinancialPeriodScope(periodInput);
  const validMetric = !metric || isValidFinancialMetricKey(metric);
  const validAsOf = !asOf || isValidAsOfTimestamp(asOf);
  const period: FinancialPeriodScope = validPeriod && periodInput
    ? periodInput as FinancialPeriodScope
    : 'all';
  const ready = Boolean(cik && validCik && validPeriod && validMetric && validAsOf);

  let response: SecCompanyFinancialsResponse | null = null;
  let error: string | null = null;
  if (ready) {
    try {
      response = await getSecCompanyFinancials({
        cik,
        period,
        metric: metric || undefined,
        asOf: asOf || undefined,
        limit: 25,
      });
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Company financials could not be loaded.';
    }
  }

  const company = response?.data.company;
  const reportedFacts = response?.data.reportedFacts || [];
  const derivedMetrics = response?.data.derivedMetrics || [];
  const meta = response?.meta;

  return (
    <div className="shell page-stack">
      <section className="page-heading">
        <p className="eyebrow">Canonical company financials</p>
        <h1>Reconstruct what was knowable at a point in time.</h1>
        <p>Query a reviewed SEC issuer CIK, optionally constrain the period or metric, and add an exact timestamp to exclude observations that were not yet source-available.</p>
      </section>

      <form className="search-panel" action="/financials" method="get">
        <div className="financial-form-grid">
          <label>
            SEC issuer CIK
            <input name="cik" defaultValue={cik} placeholder="0000320193" inputMode="numeric" autoComplete="off" />
            <small>Reviewed issuer identity; 1–10 digits.</small>
          </label>
          <label>
            Period scope
            <select name="period" defaultValue={period}>
              <option value="all">All admitted periods</option>
              <option value="annual">Annual</option>
              <option value="quarterly">Quarterly</option>
              <option value="ttm">TTM</option>
            </select>
            <small>Passed directly to the public financials contract.</small>
          </label>
          <label>
            Metric key
            <input name="metric" defaultValue={metric} placeholder="Exact canonical metric key" autoComplete="off" />
            <small>Optional exact canonical key; leave blank for all returned metrics.</small>
          </label>
          <label>
            As-of timestamp
            <input name="asOf" defaultValue={asOf} placeholder="2025-03-31T23:59:59Z" autoComplete="off" />
            <small>Optional RFC 3339 timestamp with Z or an explicit UTC offset.</small>
          </label>
        </div>
        <div className="search-actions">
          <button className="button primary" type="submit">Load financials</button>
          {submitted ? <Link className="text-link" href="/financials">Clear</Link> : null}
        </div>
      </form>

      {submitted && !cik ? (
        <section className="error-panel" role="alert">
          <strong>Issuer CIK required</strong>
          <p>Enter the reviewed SEC issuer CIK you want to query. Period, metric, and as-of controls only narrow a company-financials request; they do not identify the company themselves.</p>
        </section>
      ) : null}

      {!validCik ? (
        <section className="error-panel" role="alert">
          <strong>Invalid issuer CIK</strong>
          <p>Use 1–10 digits. The explorer sends the issuer CIK to the reviewed canonical company-financials endpoint rather than treating filing-observed identity as interchangeable.</p>
        </section>
      ) : null}

      {!validPeriod ? (
        <section className="error-panel" role="alert">
          <strong>Invalid period scope</strong>
          <p>Use one of <code>all</code>, <code>annual</code>, <code>quarterly</code>, or <code>ttm</code>.</p>
        </section>
      ) : null}

      {!validMetric ? (
        <section className="error-panel" role="alert">
          <strong>Invalid metric key</strong>
          <p>Canonical metric keys begin with a letter and contain only letters and digits.</p>
        </section>
      ) : null}

      {!validAsOf ? (
        <section className="error-panel" role="alert">
          <strong>Invalid as-of timestamp</strong>
          <p>Use an RFC 3339 timestamp with an explicit timezone, for example <code>2025-03-31T23:59:59Z</code>.</p>
        </section>
      ) : null}

      {error ? (
        <section className="error-panel" role="alert">
          <strong>Financials unavailable</strong>
          <p>{error}</p>
        </section>
      ) : null}

      {company && meta ? (
        <>
          <section className="detail-hero compact-hero">
            <div className="filing-topline">
              <span className="form-badge">Canonical issuer</span>
              <span>{meta.query.periodScope} scope</span>
            </div>
            <h2>Company financial observations</h2>
            <div className="financial-company-line">
              <span>CIK <code>{company.secIssuerCik}</code></span>
              <span>Company ID <code>{company.companyId}</code></span>
            </div>
          </section>

          <section className={`notice-panel ${meta.query.asOf ? 'point-in-time-notice' : ''}`}>
            <strong>{meta.query.asOf ? 'Source-available-as-of mode' : 'Current-selection mode'}</strong>
            {meta.query.asOf ? (
              <p>The cutoff is <code>{meta.query.asOf}</code>. Returned observations had to be source-available by that timestamp using conservative filing-availability timing; a financial period ending before the cutoff is not by itself enough.</p>
            ) : (
              <p>No historical knowledge cutoff was supplied. The API returns its current selected observations. Add an as-of timestamp to reconstruct what the retained evidence says was knowable then.</p>
            )}
          </section>

          <section className="financial-semantics" aria-label="Financial data semantics">
            <article><strong>{meta.semantics.pointInTimeMode}</strong><span>point-in-time mode</span></article>
            <article><strong>{meta.semantics.canonicalCompanyIdentity ? 'yes' : 'no'}</strong><span>canonical company identity</span></article>
            <article><strong>{meta.semantics.conservativeFilingAvailability ? 'yes' : 'no'}</strong><span>conservative availability</span></article>
            <article><strong>{meta.semantics.derivedMetricsAreSourceReported ? 'yes' : 'no'}</strong><span>derived metrics source-reported</span></article>
          </section>

          <section className="results-stack">
            <div className="results-heading">
              <div>
                <p className="eyebrow">Source-reported observations</p>
                <h2>{reportedFacts.length} reported fact{reportedFacts.length === 1 ? '' : 's'}</h2>
              </div>
              <span className="response-meta">Values remain decimal strings<br />Revision chains preserved</span>
            </div>

            {reportedFacts.length > 0 ? (
              <div className="financial-list">
                {reportedFacts.map((fact) => (
                  <article className="financial-card" key={fact.factId}>
                    <div className="financial-card-heading">
                      <div>
                        <span className="financial-kind">Reported · {fact.statement}</span>
                        <h3>{fact.metricKey}</h3>
                      </div>
                      <div className="financial-value-block">
                        <code>{fact.value}</code>
                        <span>{fact.currency || fact.unit}</span>
                      </div>
                    </div>
                    <dl className="financial-data-grid">
                      <div><dt>Period</dt><dd>{reportedPeriodLabel(fact)}</dd></div>
                      <div><dt>Period end</dt><dd>{fact.period.endDate}</dd></div>
                      <div><dt>Form</dt><dd>{fact.filing.form}</dd></div>
                      <div><dt>Filed</dt><dd>{fact.filing.filedAt}</dd></div>
                      <div><dt>Source available</dt><dd>{fact.filing.availableAt}</dd></div>
                      <div><dt>Revision</dt><dd>{fact.revision.number} · {fact.revision.currentState}</dd></div>
                    </dl>
                    <details className="financial-details">
                      <summary>Provenance and revision details</summary>
                      <dl className="financial-data-grid details-grid">
                        <div><dt>Accession</dt><dd><Link href={`/filings/${fact.filing.accession}`}><code>{fact.filing.accession}</code></Link></dd></div>
                        <div><dt>XBRL concept</dt><dd><code>{fact.xbrl.concept}</code></dd></div>
                        <div><dt>Evidence ID</dt><dd><code>{fact.evidence.evidenceId}</code></dd></div>
                        <div><dt>Source</dt><dd>{fact.evidence.sourceId}</dd></div>
                        <div><dt>Evidence acquired</dt><dd>{fact.evidence.acquiredAt}</dd></div>
                        <div><dt>Supersedes</dt><dd><code>{display(fact.revision.supersedesFactId)}</code></dd></div>
                        <div><dt>Direct method</dt><dd>{fact.directMethod}</dd></div>
                        <div><dt>Source locator</dt><dd><code className="breakable">{fact.xbrl.sourceFactLocator}</code></dd></div>
                      </dl>
                    </details>
                  </article>
                ))}
              </div>
            ) : (
              <section className="notice-panel"><p>No reported facts matched this exact query.</p></section>
            )}
          </section>

          <section className="results-stack">
            <div className="results-heading">
              <div>
                <p className="eyebrow">Explicitly derived observations</p>
                <h2>{derivedMetrics.length} derived metric{derivedMetrics.length === 1 ? '' : 's'}</h2>
              </div>
              <span className="response-meta">Not source-reported<br />Inputs carried explicitly</span>
            </div>

            {derivedMetrics.length > 0 ? (
              <div className="financial-list">
                {derivedMetrics.map((metricObservation) => (
                  <article className="financial-card derived-card" key={metricObservation.metricObservationId}>
                    <div className="financial-card-heading">
                      <div>
                        <span className="financial-kind">Derived · {metricObservation.methodology.id}</span>
                        <h3>{metricObservation.metricKey}</h3>
                      </div>
                      <div className="financial-value-block">
                        <code>{metricObservation.value}</code>
                        <span>{metricObservation.unit}</span>
                      </div>
                    </div>
                    <dl className="financial-data-grid">
                      <div><dt>As-of date</dt><dd>{metricObservation.asOfDate}</dd></div>
                      <div><dt>Available</dt><dd>{metricObservation.availableAt}</dd></div>
                      <div><dt>Computed</dt><dd>{metricObservation.computedAt}</dd></div>
                      <div><dt>Methodology</dt><dd>{metricObservation.methodology.id} v{metricObservation.methodology.version}</dd></div>
                      <div><dt>Selected</dt><dd>{metricObservation.currentlySelected ? 'yes' : 'no'}</dd></div>
                      <div><dt>Inputs</dt><dd>{metricObservation.inputs.length}</dd></div>
                    </dl>
                    <details className="financial-details">
                      <summary>Show explicit derivation inputs</summary>
                      <div className="input-list">
                        {metricObservation.inputs.map((input) => (
                          <article key={input.inputRecordId}>
                            <div><strong>{input.role}</strong><span>#{input.ordinal}</span></div>
                            <code>{inputValue(input)}</code>
                            <small>{display(input.concept)} · filed {display(input.filedAt)} · {display(input.form)}</small>
                            <small>Evidence <code>{input.evidenceId}</code></small>
                          </article>
                        ))}
                      </div>
                    </details>
                  </article>
                ))}
              </div>
            ) : (
              <section className="notice-panel"><p>No derived metrics matched this exact query.</p></section>
            )}
          </section>

          <section className="notice-panel">
            <strong>Reported and derived are deliberately separate</strong>
            <p>The explorer does not present a computed metric as if it appeared verbatim in an SEC filing. Reported facts carry filing/XBRL/evidence lineage and revision state; derived metrics carry their methodology and explicit inputs.</p>
          </section>

          <section className="response-strip">
            <span>API version <strong>{meta.apiVersion}</strong></span>
            <span>Authority <strong>{meta.sourceAuthority}</strong></span>
            <span>As-of <strong>{meta.query.asOf || 'current selection'}</strong></span>
            <span>Request-time SEC fetch <strong>{meta.semantics.requestTimeSecFetch ? 'yes' : 'no'}</strong></span>
          </section>
        </>
      ) : null}

      {!submitted ? (
        <section className="notice-panel">
          <strong>Try a reviewed issuer CIK</strong>
          <p>Start with a company CIK, then add a timestamp when you want the API to enforce historical source availability instead of returning current selections.</p>
        </section>
      ) : null}
    </div>
  );
}
