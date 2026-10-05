# SEC Data Explorer

SEC Data Explorer is an open-source Next.js reference application for the [Grizzly Bulls SEC Data API](https://grizzlybulls.com/sec-api).

It shows how to build server-side applications against retained SEC filing data without operating an EDGAR ingestion, normalization, evidence-retention, or API-serving stack yourself.

The application uses the same public API contract available to any developer. It does not import private Grizzly Bulls code, connect to Grizzly Bulls databases, scrape SEC.gov, or maintain a second SEC-data source of truth.

## What works today

- bounded retained filing search by exact form type, observed filer CIK, and filing-date range;
- offset pagination through the public filing-search contract;
- exact accession lookup from a search result;
- observed filer and archive metadata plus retained-evidence/provenance display;
- extracted 10-K, 10-Q, and 8-K section manifests from retained filing evidence;
- normalized section-text reading through stable section keys;
- deterministic observed 8-K item events without semantic corporate-event inference;
- explicit filing-to-filing section comparison across two supplied accessions; and
- explicit request-time semantics showing that application requests are served from retained state rather than proxied to SEC.gov.

The broader public SEC API also exposes point-in-time company financials, commercially admitted ownership, and source-faithful exact-filing Form 13F holdings. This reference app adds those workflows incrementally rather than hiding every API capability behind one oversized interface.

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

Open `http://localhost:3000` and choose **Explore filings**.

Try these workflows:

1. Search retained filings by exact form, observed filer CIK, or filing-date window.
2. Open one exact accession and inspect its observed filing metadata and retained provenance.
3. For a supported 10-K, 10-Q, or 8-K, open **Extracted sections** and inspect the normalized section manifest.
4. Read an individual normalized section through its stable section key.
5. Open **Diffs** and compare two explicit accessions from the same supported base-form family.

## Architecture

The browser never receives the API key.

```text
browser
  |
  | GET /filings, /filings/{accession}/sections, or /filing-diff
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

The diff surface reports section identities, added/removed/changed/unchanged status, content hashes, word counts, and count deltas. It does not automatically choose related filings or claim a line-level textual redline.

The machine-readable contract is available as [OpenAPI 3.1](https://grizzlybulls.com/api/v1/sec/openapi).

## Data interpretation

The reference app preserves the public API's boundaries instead of inventing friendlier-but-wrong semantics.

- Observed filer metadata is not silently promoted into a different canonical company identity.
- Filing date, discovery time, report period, source availability, and historical knowledge time are distinct concepts.
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
