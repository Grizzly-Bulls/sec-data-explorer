# SEC Data Explorer

SEC Data Explorer is an open-source Next.js reference application for the [Grizzly Bulls SEC Data API](https://grizzlybulls.com/sec-api).

It shows how to build server-side applications against retained SEC filing data without operating an EDGAR ingestion, normalization, evidence-retention, or API-serving stack yourself.

The application uses the same public API contract available to any developer. It does not import private Grizzly Bulls code, connect to Grizzly Bulls databases, scrape SEC.gov, or maintain a second SEC-data source of truth.

## What works today

- bounded retained filing search by exact form type, observed filer CIK, and filing-date range;
- offset pagination through the public filing-search contract;
- exact accession lookup from a search result;
- observed filer and archive metadata;
- retained-evidence/provenance display when available; and
- explicit request-time semantics showing that application requests are served from retained state rather than proxied to SEC.gov.

The broader public SEC API also exposes filing sections and diffs, point-in-time company financials, commercially admitted ownership, and source-faithful exact-filing Form 13F holdings. This reference app will add those workflows incrementally rather than hiding every API capability behind one oversized interface.

## Five-minute quickstart

You need:

- Node.js 24
- pnpm 11
- a Grizzly Bulls API key

Create a free API key from the [SEC API developer page](https://grizzlybulls.com/sec-api), then:

```bash
git clone https://github.com/Grizzly-Bulls/sec-data-explorer.git
cd sec-data-explorer
pnpm install
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

## Architecture

The browser never receives the API key.

```text
browser
  |
  | GET /filings or /filings/{accession}
  v
Next.js server-rendered application
  |
  | Authorization: Bearer <server-only API key>
  v
https://grizzlybulls.com/api/v1/sec
```

`GRIZZLY_BULLS_API_KEY` is read only by the server-side adapter under `src/lib/`. The repository has no SEC database, EDGAR acquisition pipeline, account system, queue, or private Grizzly Bulls dependency.

## Example API request

Keep API keys on a server, command line, or other trusted environment.

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $GRIZZLY_BULLS_API_KEY" \
  -H "Accept: application/json" \
  "https://grizzlybulls.com/api/v1/sec/filings?form=10-K&cik=0000320193&limit=25&offset=0"
```

The machine-readable contract is available as [OpenAPI 3.1](https://grizzlybulls.com/api/v1/sec/openapi).

## Data interpretation

The reference app preserves the public API's boundaries instead of inventing friendlier-but-wrong semantics.

- Observed filer metadata is not silently promoted into a different canonical company identity.
- Filing date, discovery time, report period, source availability, and historical knowledge time are distinct concepts.
- Retained evidence is provenance for the API response; opening a page does not cause a request-time SEC.gov fetch.
- Source-faithful 13F holdings and commercially admitted company ownership are different data products and should not be collapsed into one ownership view.

## Validation

```bash
pnpm check
```

That runs lint, TypeScript checking, focused tests, and a production Next.js build.

The initial repository bootstrap intentionally allows a non-frozen install until the first generated `pnpm-lock.yaml` is committed. After that, CI and Docker should use the committed lockfile with frozen installs.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md) before opening a pull request.

## Links

- [SEC Data API](https://grizzlybulls.com/sec-api)
- [OpenAPI 3.1 contract](https://grizzlybulls.com/api/v1/sec/openapi)
- [Grizzly Bulls](https://grizzlybulls.com)
- [MIT license](./LICENSE)

## License

MIT. See [LICENSE](./LICENSE).
