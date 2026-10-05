import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getSecFilingSection, SecApiRequestError } from '@/src/lib/secApi';
import { isValidAccessionNumber, isValidSectionKey } from '@/src/lib/secApiCore';

export const metadata = {
  title: 'Filing section',
};

export default async function FilingSectionPage({
  params,
}: {
  params: Promise<{ accessionNumber: string; sectionKey: string }>;
}) {
  const { accessionNumber, sectionKey } = await params;
  if (!isValidAccessionNumber(accessionNumber) || !isValidSectionKey(sectionKey)) notFound();

  let response;
  try {
    response = await getSecFilingSection(accessionNumber, sectionKey);
  } catch (cause) {
    if (cause instanceof SecApiRequestError && cause.status === 404) notFound();
    const message = cause instanceof Error ? cause.message : 'The normalized filing section could not be loaded.';
    return (
      <div className="shell page-stack">
        <Link className="back-link" href={`/filings/${accessionNumber}/sections`}>← Back to section manifest</Link>
        <section className="error-panel" role="alert">
          <strong>Filing section unavailable</strong>
          <p>{message}</p>
        </section>
      </div>
    );
  }

  const section = response.data.section;

  return (
    <div className="shell page-stack">
      <Link className="back-link" href={`/filings/${accessionNumber}/sections`}>← Back to section manifest</Link>
      <section className="detail-hero">
        <div className="filing-topline">
          <span className="form-badge">{section.item}</span>
          <span>{section.wordCount.toLocaleString()} words</span>
        </div>
        <h1>{section.title || section.key}</h1>
        <p className="accession"><code>{accessionNumber}</code> · <code>{section.key}</code></p>
      </section>

      <article className="section-reader">
        <div className="section-reader-meta">
          <span>Normalized lines {section.normalizedStartLine}–{section.normalizedEndLine}</span>
          <span>Content SHA-256 <code className="breakable">{section.contentSha256}</code></span>
        </div>
        <pre className="section-text">{section.text}</pre>
      </article>

      <section className="notice-panel">
        <strong>Normalized projection, not a replacement source document</strong>
        <p>This text was extracted from retained filing evidence. Use the filing detail page and source links when you need the underlying SEC filing context.</p>
      </section>

      <section className="response-strip">
        <span>API version <strong>{response.meta.apiVersion}</strong></span>
        <span>Authority <strong>{response.meta.sourceAuthority}</strong></span>
        <span>Request-time SEC fetch <strong>{response.meta.semantics.requestTimeSecFetch ? 'yes' : 'no'}</strong></span>
      </section>
    </div>
  );
}
