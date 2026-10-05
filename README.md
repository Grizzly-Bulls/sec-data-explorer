# SEC Data Explorer

SEC Data Explorer is an open-source Next.js reference application for the [Grizzly Bulls SEC Data API](https://grizzlybulls.com/sec-api).

It shows how to build server-side applications against retained SEC filing data and canonical company financials without operating an EDGAR ingestion, normalization, evidence-retention, or API-serving stack yourself.

The application uses the same public API contract available to any developer. It does not import private Grizzly Bulls code, connect to Grizzly Bulls databases, scrape SEC.gov, or maintain a second SEC-data source of truth.

## What works today

- bounded retained filing search by exact form type, observed filer CIK, and filing-date range;
- offset pagination through the public filing-search contract;
- exact accession lookup from a search result;
- observed filer and archive metadata plus retained-evidence/provenance display;
- extracted 10-K, 10-Q, and 8-K section manifests from retained filing evidence;
- normalized section-text reading through stable section keys;
- deterministic observed 8-K item events without semantic corporate-event inference;
- explicit filing-to-filing section comparison across two supplied accessions;
- canonical company financials by reviewed SEC issuer CIK;
- annual, quarterly, TTM, and exact canonical metric filtering;
- optional source-available-as-of reconstruction with conservative filing availability;
- reported facts with filing/XBRL/evidence/revision lineage kept separate from derived metrics with explicit methodology inputs; and
- explicit request-time semantics showing that application requests are served from retained state rather than proxied to SEC.gov.

The broader public SEC API also exposes commercially admitted ownership and source-faithful exact-filing Form 13F holdings. This reference app adds those workflows incrementally rather than hiding every API capability behind one oversized interface.

## Five-minute quickstart

You need:

- Node.js 24
- pnpm 11
- a Grizzly Bulls API key

Create a free API key from the [SEC API developer page](https://grizzlybulls.com/sec-api), then:

```bash
git clone https://github.com/Grizzly-Bulls/sec-data-explorer.git
cd sec-data-explorer
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Add the key to `.env.local`:

```bash
GRIZZLY_BULLS_API_KEY=your_key_here
```

Start the app:

```bash
pnpm dev
```

Open `http://localhost:3000`.

Try these workflows:

1. Search retained filings by exact form, observed filer CIK, or filing-date window.
2. Open one exact accession and inspect its observed filing metadata and retained provenance.
3. For a supported 10-K, 10-Q, or 8-K, inspect the normalized section manifest and individual section text.
4. Open **Diffs** and compare two explicit accessions from the same supported base-form family.
5. Open **Financials**, enter a reviewed issuer CIK, and inspect reported facts separately from derived metrics.
6. Add an RFC 3339 **as-of timestamp** to reconstruct only observations that were source-available by that point in time.

## Architecture

The browser never receives the API key.

```text
browser
  |
  | GET /filings, /filing-diff, or /financials
  v
Next.js server-rendered application
  |
  | Authorization: Bearer <server-only API key>
  v
https://grizzlybulls.com/api/v1/sec
```

`GRIZZLY_BULLS_API_KEY` is read only by the server-side adapter under `src/lib/`. The repository has no SEC database, EDGAR acquisition pipeline, account system, queue, or private Grizzly Bulls dependency.

## Public API examples

Keep API keys on a server, command line, or other trusted environment.

### Filing search

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $GRIZZLY_BULLS_API_KEY" \
  -H "Accept: application/json" \
  "https://grizzlybulls.com/api/v1/sec/filings?form=10-K&cik=0000320193&limit=25&offset=0"
```

### Extracted sections

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $GRIZZLY_BULLS_API_KEY" \
  -H "Accept: application/json" \
  "https://grizzlybulls.com/api/v1/sec/filings/0000320193-26-000077/sections"
```

### Explicit filing comparison

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $GRIZZLY_BULLS_API_KEY" \
  -H "Accept: application/json" \
  "https://grizzlybulls.com/api/v1/sec/filing-diff?from=0000320193-25-000079&to=0000320193-26-000077"
```

### Point-in-time company financials

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $GRIZZLY_BULLS_API_KEY" \
  -H "Accept: application/json" \
  "https://grizzlybulls.com/api/v1/sec/companies/0000320193/financials?period=quarterly&asOf=2025-03-31T23%3A59%3A59Z&limit=25"
```

`asOf` is a historical knowledge cutoff, not a financial period-end filter. The API conservatively requires returned observations to have been source-available by that timestamp. Reported facts retain revision/evidence lineage; derived metrics are separately identified and carry explicit inputs.

The machine-readable contract is available as [OpenAPI 3.1](https://grizzlybulls.com/api/v1/sec/openapi).

## Data interpretation

The reference app preserves the public API's boundaries instead of inventing friendlier-but-wrong semantics.

- Observed filer metadata is not silently promoted into a different canonical company identity.
- The company-financials route uses a reviewed canonical issuer mapping rather than filing-observed identity alone.
- Filing date, discovery time, report period, source availability, and historical knowledge time are distinct concepts.
- An `asOf` cutoff means source-available-as-of; a period ending before the cutoff does not by itself make the observation historically knowable.
- Reported financial facts remain distinct from Grizzly Bulls derived metrics. Derived observations are not presented as source-reported and carry explicit methodology inputs.
- Financial values remain decimal strings so the reference app does not silently change machine precision.
- Retained evidence is provenance for the API response; opening a page does not cause a request-time SEC.gov fetch.
- Extracted section text is a normalized projection of retained filing evidence, not a replacement source document.
- 8-K item events are deterministic filing-structure observations. The app does not rename them into inferred corporate events.
- Filing comparisons use two explicit accessions and do not automatically link amendments or previous filings.
- Source-faithful 13F holdings and commercially admitted company ownership are different data products and should not be collapsed into one ownership view.

## Validation

```bash
pnpm check
```

That runs lint, TypeScript checking, focused tests, and a production Next.js build. CI and Docker use the committed lockfile with frozen installs.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md) before opening a pull request.

## Links

- [SEC Data API](https://grizzlybulls.com/sec-api)
- [OpenAPI 3.1 contract](https://grizzlybulls.com/api/v1/sec/openapi)
- [Grizzly Bulls](https://grizzlybulls.com)
- [MIT license](./LICENSE)

## License

MIT. See [LICENSE](./LICENSE).
