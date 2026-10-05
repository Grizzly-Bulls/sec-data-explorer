import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getSecFiling, SecApiRequestError } from '@/src/lib/secApi';
import {
  buildExplorerFilingDiffHref,
  isValidAccessionNumber,
  supportsFilingIntelligence,
} from '@/src/lib/secApiCore';

export const metadata = {
  title: 'Filing detail',
};

function display(value: string | null | undefined): string {
  return value || '—';
}

export default async function FilingDetailPage({ params }: { params: Promise<{ accessionNumber: string }> }) {
  const { accessionNumber } = await params;
  if (!isValidAccessionNumber(accessionNumber)) notFound();

  let response;
  try {
    response = await getSecFiling(accessionNumber);
  } catch (cause) {
    if (cause instanceof SecApiRequestError && cause.status === 404) notFound();
    const message = cause instanceof Error ? cause.message : 'The filing could not be loaded.';
    return (
      <div className="shell page-stack">
        <Link className="back-link" href="/filings">← Back to filing search</Link>
        <section className="error-panel" role="alert">
          <strong>Filing unavailable</strong>
          <p>{message}</p>
        </section>
      </div>
    );
  }

  const filing = response.data.filing;
  const hasIntelligence = supportsFilingIntelligence(filing.formType);

  return (
    <div className="shell page-stack">
      <Link className="back-link" href="/filings">← Back to filing search</Link>
      <section className="detail-hero">
        <div className="filing-topline">
          <span className="form-badge">{filing.formType}</span>
          <time dateTime={filing.filingDate}>Filed {filing.filingDate}</time>
        </div>
        <h1>{filing.observedFiler.name || 'Observed filer name unavailable'}</h1>
        <p className="accession"><code>{filing.accessionNumber}</code></p>
        <div className="button-row">
          <a className="button primary" href={filing.filingDirectoryUrl} target="_blank" rel="noreferrer">Open SEC filing directory ↗</a>
          {hasIntelligence ? (
            <>
              <Link className="button secondary" href={`/filings/${filing.accessionNumber}/sections`}>Inspect extracted sections</Link>
              <Link className="button secondary" href={buildExplorerFilingDiffHref(filing.accessionNumber)}>Compare this filing</Link>
            </>
          ) : null}
        </div>
      </section>

      <section className="detail-grid">
        <article className="data-panel">
          <p className="eyebrow">Filing identity</p>
          <h2>Observed SEC metadata</h2>
          <dl className="detail-data">
            <div><dt>Observed filer CIK</dt><dd>{display(filing.observedFiler.cik)}</dd></div>
            <div><dt>Form</dt><dd>{filing.formType}</dd></div>
            <div><dt>Filing date</dt><dd>{filing.filingDate}</dd></div>
            <div><dt>First discovered</dt><dd>{filing.firstDiscoveredAt}</dd></div>
            <div><dt>Discovery source</dt><dd>{filing.firstDiscoverySource}</dd></div>
            <div><dt>Archive CIK</dt><dd>{display(filing.archive.archiveCik)}</dd></div>
          </dl>
          <p className="semantic-note">The observed filer is filing metadata. This page does not silently convert it into a different canonical company identity.</p>
        </article>

        <article className="data-panel">
          <p className="eyebrow">Provenance</p>
          <h2>Retained evidence</h2>
          {filing.retainedEvidence ? (
            <dl className="detail-data">
              <div><dt>Evidence ID</dt><dd><code>{filing.retainedEvidence.evidenceId}</code></dd></div>
              <div><dt>Document</dt><dd>{display(filing.retainedEvidence.documentName)}</dd></div>
              <div><dt>Media type</dt><dd>{display(filing.retainedEvidence.mediaType)}</dd></div>
              <div><dt>Acquired</dt><dd>{display(filing.retainedEvidence.acquiredAt)}</dd></div>
              <div><dt>Selected</dt><dd>{display(filing.retainedEvidence.selectedAt)}</dd></div>
              <div><dt>Resolver</dt><dd>{display(filing.retainedEvidence.resolverVersion)}</dd></div>
              <div className="wide"><dt>Content SHA-256</dt><dd><code className="breakable">{display(filing.retainedEvidence.contentSha256)}</code></dd></div>
            </dl>
          ) : (
            <p>No retained document evidence is attached to this filing record.</p>
          )}
          <p className="semantic-note">This application reads retained Grizzly Bulls state. Opening this page does not trigger a request-time SEC.gov fetch.</p>
        </article>
      </section>

      <section className="response-strip">
        <span>API version <strong>{response.meta.apiVersion}</strong></span>
        <span>Authority <strong>{response.meta.sourceAuthority}</strong></span>
        <span>Request-time SEC fetch <strong>{response.meta.semantics.requestTimeSecFetch ? 'yes' : 'no'}</strong></span>
      </section>
    </div>
  );
}
