import Link from 'next/link';

import { diffSecFilings } from '@/src/lib/secApi';
import { isValidAccessionNumber } from '@/src/lib/secApiCore';
import type { SecFilingDiffResponse, SecFilingDiffSection } from '@/src/lib/secApiTypes';

export const metadata = {
  title: 'Filing diff',
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function count(value: number | null): string {
  return value === null ? '—' : value.toLocaleString();
}

function sectionReaderHref(accessionNumber: string, section: SecFilingDiffSection): string {
  return `/filings/${accessionNumber}/sections/${section.key}`;
}

export default async function FilingDiffPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const from = first(query.from).trim();
  const to = first(query.to).trim();
  const submitted = Boolean(from || to);
  const validFrom = !from || isValidAccessionNumber(from);
  const validTo = !to || isValidAccessionNumber(to);
  const ready = Boolean(from && to && validFrom && validTo);

  let response: SecFilingDiffResponse | null = null;
  let error: string | null = null;
  if (ready) {
    try {
      response = await diffSecFilings(from, to);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'The filing comparison could not be loaded.';
    }
  }

  const diff = response?.data.diff;

  return (
    <div className="shell page-stack">
      <section className="page-heading">
        <p className="eyebrow">Explicit filing comparison</p>
        <h1>Compare extracted SEC filing sections.</h1>
        <p>Supply two exact accessions. The API compares normalized section identities and content hashes; it does not guess amendment relationships or claim a textual redline that the public contract does not provide.</p>
      </section>

      <form className="search-panel" action="/filing-diff" method="get">
        <div className="field-grid">
          <label>
            Baseline accession
            <input name="from" defaultValue={from} placeholder="0000320193-25-000079" autoComplete="off" />
            <small>Exact SEC accession number.</small>
          </label>
          <label>
            Comparison accession
            <input name="to" defaultValue={to} placeholder="0000320193-26-000077" autoComplete="off" />
            <small>Must share a supported base form with the baseline.</small>
          </label>
        </div>
        <div className="search-actions">
          <button className="button primary" type="submit">Compare filings</button>
          {submitted ? <Link className="text-link" href="/filing-diff">Clear</Link> : null}
        </div>
      </form>

      {submitted && (!from || !to) ? (
        <section className="notice-panel" role="status">
          <strong>Two explicit accessions are required</strong>
          <p>Enter both the baseline and comparison filing. The explorer deliberately does not choose a previous filing automatically.</p>
        </section>
      ) : null}

      {!validFrom || !validTo ? (
        <section className="error-panel" role="alert">
          <strong>Invalid accession number</strong>
          <p>Use the exact SEC accession shape <code>0000000000-00-000000</code>.</p>
        </section>
      ) : null}

      {error ? (
        <section className="error-panel" role="alert">
          <strong>Comparison unavailable</strong>
          <p>{error}</p>
        </section>
      ) : null}

      {diff ? (
        <>
          <section className="detail-hero compact-hero">
            <div className="filing-topline">
              <span className="form-badge">{diff.baseFormType}</span>
              <span>Two explicit accessions</span>
            </div>
            <h2>Section-level change summary</h2>
            <div className="diff-pair">
              <code>{diff.fromAccessionNumber}</code>
              <span>→</span>
              <code>{diff.toAccessionNumber}</code>
            </div>
          </section>

          <section className="diff-summary" aria-label="Filing diff summary">
            <article><strong>{diff.summary.added}</strong><span>added</span></article>
            <article><strong>{diff.summary.removed}</strong><span>removed</span></article>
            <article><strong>{diff.summary.changed}</strong><span>changed</span></article>
            <article><strong>{diff.summary.unchanged}</strong><span>unchanged</span></article>
          </section>

          <section className="diff-list">
            {diff.sections.map((section) => (
              <article className="diff-row" key={section.key}>
                <div className="diff-section-heading">
                  <span className={`status-badge status-${section.status}`}>{section.status}</span>
                  <div>
                    <strong>{section.item}</strong>
                    <code>{section.key}</code>
                  </div>
                </div>
                <dl className="diff-counts">
                  <div><dt>Baseline words</dt><dd>{count(section.fromWordCount)}</dd></div>
                  <div><dt>Comparison words</dt><dd>{count(section.toWordCount)}</dd></div>
                  <div><dt>Delta</dt><dd>{section.wordCountDelta === null ? '—' : `${section.wordCountDelta >= 0 ? '+' : ''}${section.wordCountDelta.toLocaleString()}`}</dd></div>
                </dl>
                <div className="diff-read-links">
                  {section.status !== 'added' ? <Link href={sectionReaderHref(diff.fromAccessionNumber, section)}>Baseline section</Link> : null}
                  {section.status !== 'removed' ? <Link href={sectionReaderHref(diff.toAccessionNumber, section)}>Comparison section</Link> : null}
                </div>
              </article>
            ))}
          </section>

          <section className="notice-panel">
            <strong>What this comparison means</strong>
            <p>The API compared the exact accessions you supplied. Automatic amendment linkage is {diff.semantics.automaticAmendmentLinkage ? 'enabled' : 'not performed'}. A changed status means the normalized section content hash changed; this screen does not fabricate a line-by-line redline.</p>
          </section>

          <section className="response-strip">
            <span>API version <strong>{response.meta.apiVersion}</strong></span>
            <span>Authority <strong>{response.meta.sourceAuthority}</strong></span>
            <span>Explicit accessions <strong>{diff.semantics.comparedExplicitAccessions ? 'yes' : 'no'}</strong></span>
          </section>
        </>
      ) : null}

      {!submitted ? (
        <section className="notice-panel">
          <strong>Start from filing search</strong>
          <p>Find exact 10-K, 10-Q, or 8-K accessions in the explorer, then use “Compare this filing” from a filing detail or section manifest to prefill the baseline.</p>
          <Link className="text-link" href="/filings">Search filings →</Link>
        </section>
      ) : null}
    </div>
  );
}
