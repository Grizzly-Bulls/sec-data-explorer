# SEC Data Explorer contributor instructions

SEC Data Explorer is an open-source reference application for the Grizzly Bulls SEC Data API. Keep it small, understandable, and useful to developers who want to inspect a real integration rather than a second implementation of the data product.

## Product boundary

Use only the public, versioned Grizzly Bulls SEC Data API at `https://grizzlybulls.com/api/v1/sec`.

Do not import private Grizzly Bulls application modules, query Grizzly Bulls databases, ingest SEC/EDGAR data directly, scrape SEC.gov, or create another source of truth.

The current application may demonstrate bounded filing discovery, exact filing lookup, reviewed 10-K/10-Q/8-K section extraction, normalized section reading, deterministic 8-K item events, explicit filing-to-filing section comparison, and canonical company financials including source-available-as-of queries. Add ownership or institutional holdings only through their reviewed public API contracts.

## API key boundary

`GRIZZLY_BULLS_API_KEY` is a server-only secret.

- Never expose it through `NEXT_PUBLIC_*`, rendered HTML, client JavaScript, browser storage, URLs, analytics, logs, screenshots, fixtures, or committed files.
- Browser components must not call the machine API directly while browser CORS is intentionally not part of the integration contract.
- Local clones use the developer's own server-side key.
- A future public hosted demo must use a dedicated first-party demo credential plus separate reviewed abuse controls; never place a normal customer key behind unrestricted public traffic.

## SEC semantics

Treat the public API response as authoritative.

- An observed filer CIK/name is filing metadata, not permission to invent a different canonical issuer identity.
- The company-financials route is a separate reviewed canonical issuer surface. Do not use its identity semantics to silently reinterpret filing-search results.
- Filing dates, discovery timestamps, source-availability timestamps, report periods, and historical `asOf` semantics must remain distinct.
- Financial `asOf` is a source-availability cutoff. Do not treat period end, filing date, acquisition time, or computation time as interchangeable with historical knowability.
- Financial values are decimal strings in the machine contract. Do not coerce them through JavaScript `number` merely for display formatting.
- Reported facts and derived metrics are different fact classes. Never present a derived metric as source-reported; preserve methodology IDs and explicit input lineage.
- Reported fact revision chains, evidence IDs, XBRL concepts, source locators, and `availableAt` fields are meaningful provenance. Do not discard them when the UI summarizes a fact.
- Retained evidence and provenance should be visible when useful; do not imply that the app fetched SEC.gov at request time.
- Extracted section text is a normalized projection of retained filing evidence. Do not present it as the original source document.
- 8-K item events are deterministic filing-structure observations with `semanticInference: false`. Do not rename them into inferred mergers, financings, executive changes, or other corporate-event labels.
- Filing diffs compare two exact accessions supplied by the caller. Do not automatically select a previous filing, infer amendment linkage, or turn content-hash status into an invented line-level redline.
- Source-faithful Form 13F rows and commercially admitted company ownership are different products and must not be merged into one invented ownership model.

## Architecture

Keep the architecture lean:

```text
browser
  -> Next.js server-rendered UI
  -> server-only adapter under src/lib/
  -> Grizzly Bulls SEC Data API
```

Do not add a database, account system, queue, ingestion worker, SEC fetcher, or private service dependency without a measured requirement.

## Public copy

Write for developers and financial-data users. Do not expose internal phase names, roadmap codenames, test names, or repository bookkeeping in the public UI or README. Prefer precise capabilities and explicit limitations over broad claims such as "complete", "real-time", or "all SEC data".

## Validation

Use Node.js 24 and pnpm 11. Before a pull request is ready:

```bash
pnpm install --frozen-lockfile
pnpm check
```

Do not weaken a boundary or guard merely to make the suite pass.
