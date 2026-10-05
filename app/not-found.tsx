import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="shell page-stack">
      <section className="notice-panel">
        <p className="eyebrow">Not found</p>
        <h1>That filing could not be found.</h1>
        <p>Check the accession number or return to the bounded filing search.</p>
        <Link className="button primary" href="/filings">Search filings</Link>
      </section>
    </div>
  );
}
