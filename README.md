# SEC Data Explorer

SEC Data Explorer is an open-source Next.js reference application for the [Grizzly Bulls SEC Data API](https://grizzlybulls.com/sec-api).

It shows how to build server-side applications against retained SEC filings, canonical company financials, and reviewed ownership surfaces without operating an EDGAR ingestion, normalization, evidence-retention, or API-serving stack yourself.

The application uses the same public API contract available to any developer. It does not import private Grizzly Bulls code, connect to Grizzly Bulls databases, scrape SEC.gov, or maintain a second SEC-data source of truth.

## What works today

- bounded retained filing search and exact-accession lookup;
- normalized 10-K, 10-Q, and 8-K section reading plus deterministic 8-K item events;
- explicit filing-to-filing section comparison;
- canonical company financials with annual, quarterly, TTM, metric, and source-available-as-of filtering;
- reported financial facts kept separate from explicit derived metrics and their lineage;
- commercially admitted current Section 16-derived ownership positions;
- separately modeled admitted Schedule 13 beneficial aggregates; and
- source-faithful exact-filing 13F-HR / 13F-HR/A holdings with pagination.

The ownership workflows intentionally stay separate. Company ownership is a reviewed current subset; exact-filing 13F rows remain filing observations rather than being silently converted into canonical company positions.

## Five-minute quickstart

You need Node.js 24, pnpm 11, and a Grizzly Bulls API key.

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

Then run:

```bash
pnpm dev
```

Open `http://localhost:3000` and try the filing, financials, company ownership, and exact-filing 13F workflows.

## Architecture

The browser never receives the API key.

```text
browser
  |
  | GET reference-app routes
  v
Next.js server-rendered application
  |
  | Authorization: Bearer <server-only API key>
  v
https://grizzlybulls.com/api/v1/sec
```

The repository has no SEC database, EDGAR acquisition pipeline, account system, queue, or private Grizzly Bulls dependency.

## Public API examples

Keep API keys on a server, command line, or other trusted environment.

### Filing search

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $GRIZZLY_BULLS_API_KEY" \
  -H "Accept: application/json" \
  "https://grizzlybulls.com/api/v1/sec/filings?form=10-K&cik=0000320193&limit=25&offset=0"
```

### Point-in-time company financials

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $GRIZZLY_BULLS_API_KEY" \
  -H "Accept: application/json" \
  "https://grizzlybulls.com/api/v1/sec/companies/0000320193/financials?period=quarterly&asOf=2025-03-31T23%3A59%3A59Z&limit=25"
```

### Commercially admitted company ownership

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $GRIZZLY_BULLS_API_KEY" \
  -H "Accept: application/json" \
  "https://grizzlybulls.com/api/v1/sec/companies/0000320193/ownership?limit=25"
```

This response can contain admitted current Section 16-derived positions and separately modeled Schedule 13 beneficial aggregates. It is not a complete beneficial-ownership register and does not include Form 13F holdings.

### Exact-filing Form 13F holdings

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $GRIZZLY_BULLS_API_KEY" \
  -H "Accept: application/json" \
  "https://grizzlybulls.com/api/v1/sec/filings/0001067983-26-000003/institutional-holdings?limit=25&offset=0"
```

The 13F route is scoped to the exact accession. It does not merge amendments, canonicalize the observed manager, resolve reported issuer labels to companies, or treat reported CUSIP as canonical security identity.

The machine-readable contract is available as [OpenAPI 3.1](https://grizzlybulls.com/api/v1/sec/openapi).

## Data interpretation

The reference app preserves the public API's boundaries instead of inventing friendlier-but-wrong semantics.

- Observed filing identity is not silently promoted into canonical company identity.
- Financial `asOf` means source-available-as-of, not merely period end.
- Reported financial facts and derived metrics remain separate fact classes.
- Company ownership requires commercial admission and excludes unresolved person identity.
- The Schedule 13 surface is a reviewed subset and does not claim complete beneficial ownership.
- Form 13F rows remain exact-filing observations; manager names, issuer labels, and CUSIPs are not silently canonicalized.
- 13F amendment relationships are not automatically merged.
- Retained evidence is served without request-time SEC.gov fetching.

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
