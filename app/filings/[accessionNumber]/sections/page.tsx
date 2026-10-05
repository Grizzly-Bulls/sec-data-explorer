import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getSecFilingSections, SecApiRequestError } from '@/src/lib/secApi';
import { buildExplorerFilingDiffHref, isValidAccessionNumber } from '@/src/lib/secApiCore';

export const metadata = {
  title: 'Filing sections',
};

function display(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

export default async function FilingSectionsPage({ params }: { params: Promise<{ accessionNumber: string }> }) {
  const { accessionNumber } = await params;
  if (!isValidAccessionNumber(accessionNumber)) notFound();

  let response;
  try {
    response = await getSecFilingSections(accessionNumber);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Extracted sections could not be loaded.';
    return (
      <div className="shell page-stack">
        <Link className="back-link" href={`/filings/${accessionNumber}`}>← Back to filing detail</Link>
        <section className={cause instanceof SecApiRequestError && cause.status === 404 ? 'notice-panel' : 'error-panel'} role="alert">
          <strong>{cause instanceof SecApiRequestError && cause.status === 404 ? 'No extracted filing intelligence available' : 'Filing intelligence unavailable'}</strong>
          <p>{message}</p>
        </section>
      </div>
    );
  }

  const filing = response.data.filing;

  return (
    <div className="shell page-stack">
      <Link className="back-link" href={`/filings/${accessionNumber}`}>← Back to filing detail</Link>

      <section className="detail-hero">
        <div className="filing-topline">
          <span className="form-badge">{filing.formType}</span>
          <time dateTime={filing.filingDate}>Filed {filing.filingDate}</time>
        </div>
        <h1>Extracted filing sections</h1>
        <p className="accession"><code>{filing.accessionNumber}</code></p>
        <div className="button-row">
          <Link className="button secondary" href={buildExplorerFilingDiffHref(filing.accessionNumber)}>Compare this filing</Link>
        </div>
      </section>

      <section className="detail-grid">
        <article className="data-panel">
          <p className="eyebrow">Extraction</p>
          <h2>Selected document</h2>
          <dl className="detail-data">
            <div><dt>Base form</dt><dd>{filing.baseFormType}</dd></div>
            <div><dt>Amendment</dt><dd>{filing.isAmendment ? 'yes' : 'no'}</dd></div>
            <div><dt>Document type</dt><dd>{filing.selectedDocument.documentType}</dd></div>
            <div><dt>Sequence</dt><dd>{display(filing.selectedDocument.sequence)}</dd></div>
            <div><dt>Filename</dt><dd>{display(filing.selectedDocument.filename)}</dd></div>
            <div><dt>Extractor</dt><dd>{filing.extractorVersion}</dd></div>
          </dl>
          <p className="semantic-note">Sections are normalized projections of one explicitly selected retained filing document. They do not replace the filing as source evidence.</p>
        </article>

        <article className="data-panel">
          <p className="eyebrow">Semantics</p>
          <h2>What the API did not infer</h2>
          <dl className="detail-data">
            <div><dt>Request-time SEC fetch</dt><dd>{filing.semantics.requestTimeSecFetch ? 'yes' : 'no'}</dd></div>
            <div><dt>Automatic amendment linkage</dt><dd>{filing.semantics.automaticAmendmentLinkage ? 'yes' : 'no'}</dd></div>
            <div><dt>Event semantic inference</dt><dd>{filing.semantics.eventSemanticInference ? 'yes' : 'no'}</dd></div>
          </dl>
          <p className="semantic-note">8-K events below are observed item markers from the extracted filing structure. The reference app does not rename them into inferred corporate events.</p>
        </article>
      </section>

      {filing.events.length > 0 ? (
        <section className="results-stack">
          <div className="results-heading">
            <div>
              <p className="eyebrow">Observed 8-K items</p>
              <h2>Deterministic filing events</h2>
            </div>
            <span className="response-meta">{filing.events.length} event{filing.events.length === 1 ? '' : 's'}</span>
          </div>
          <div className="event-list">
            {filing.events.map((event) => (
              <article className="event-card" key={`${event.item}-${event.sectionKey}`}>
                <span className="form-badge">Item {event.item}</span>
                <div>
                  <strong>{event.title || event.sectionKey}</strong>
                  <p>Semantic inference: {event.semanticInference ? 'yes' : 'no'}</p>
                </div>
                <Link className="text-link" href={`/filings/${accessionNumber}/sections/${event.sectionKey}`}>Read section →</Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="results-stack">
        <div className="results-heading">
          <div>
            <p className="eyebrow">Section manifest</p>
            <h2>{filing.sections.length} extracted section{filing.sections.length === 1 ? '' : 's'}</h2>
          </div>
          <span className="response-meta">Normalized document SHA-256<br /><code className="breakable">{filing.normalizedDocumentSha256}</code></span>
        </div>
        <div className="section-list">
          {filing.sections.map((section) => (
            <article className="section-row" key={section.key}>
              <div className="section-identity">
                <span className="form-badge">{section.item}</span>
                <div>
                  <h3>{section.title || section.key}</h3>
                  <code>{section.key}</code>
                </div>
              </div>
              <div className="section-stats">
                <span><strong>{section.wordCount.toLocaleString()}</strong> words</span>
                <span>lines {section.normalizedStartLine}–{section.normalizedEndLine}</span>
              </div>
              <Link className="text-link" href={`/filings/${accessionNumber}/sections/${section.key}`}>Read normalized text →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="response-strip">
        <span>API version <strong>{response.meta.apiVersion}</strong></span>
        <span>Authority <strong>{response.meta.sourceAuthority}</strong></span>
        <span>Request-time SEC fetch <strong>{response.meta.semantics.requestTimeSecFetch ? 'yes' : 'no'}</strong></span>
      </section>
    </div>
  );
}
