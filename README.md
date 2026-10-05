# SEC Data Explorer

SEC Data Explorer is an open-source Next.js reference application for the [Grizzly Bulls SEC Data API](https://grizzlybulls.com/sec-api).

A public hosted copy is available at [sec-demo.grizzlybulls.com](https://sec-demo.grizzlybulls.com). Local clones use the same public API contract with their own server-side API key.

It shows how to build server-side applications against retained SEC filing data, canonical company financials, and reviewed ownership surfaces without operating an EDGAR ingestion, normalization, evidence-retention, or API-serving stack yourself.

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
- reported facts with filing/XBRL/evidence/revision lineage kept separate from derived metrics with explicit methodology inputs;
- commercially admitted current Section 16-derived ownership positions;
- separately modeled commercially admitted Schedule 13 beneficial aggregates;
- source-faithful exact-filing 13F-HR / 13F-HR/A holdings with pagination; and
- explicit request-time semantics showing that application requests are served from retained state rather than proxied to SEC.gov.

The ownership workflows intentionally stay separate. Company ownership is a reviewed current subset; exact-filing 13F rows remain filing observations rather than being silently converted into canonical company or security positions.

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
7. Open **Ownership** to inspect commercially admitted current Section 16-derived positions and Schedule 13 beneficial aggregates for one reviewed issuer.
8. Open **13F holdings** from a 13F-HR filing detail, or enter an exact accession directly, to inspect source-faithful information-table rows without canonicalizing the filing observations.

## Architecture

The browser never receives the API key.

```text
browser
  |
  | GET /filings, /filing-diff, /financials, /ownership,
  |     or /institutional-holdings
  v
Next.js server-rendered application
  |
  | Authorization: Bearer <server-only API key>
  v
https://grizzlybulls.com/api/v1/sec
```

`GRIZZLY_BULLS_API_KEY` is read only by the server-side adapter under `src/lib/`. The repository has no SEC database, EDGAR acquisition pipeline, account system, queue, or private Grizzly Bulls dependency.

### Hosted-demo boundary

The public hosted deployment uses a dedicated first-party credential rather than a customer credential:

```bash
GRIZZLY_BULLS_SEC_DEMO_ENABLED=true
GRIZZLY_BULLS_SEC_DEMO_API_KEY=<server-only dedicated demo credential>
GRIZZLY_BULLS_SEC_DEMO_REVISION=<deployed git commit>
```

When hosted-demo mode is enabled, the adapter refuses to fall back to `GRIZZLY_BULLS_API_KEY`. Requests are also bounded to 30 machine-API calls per client in any rolling 60-second window before they reach the upstream API. The in-process limiter is defense in depth; the dedicated credential's SEC API entitlement and usage limits remain the durable quota authority across application restarts.

The reverse proxy must normalize the client-address headers used by the limiter (`CF-Connecting-IP`, `X-Real-IP`, or `X-Forwarded-For`) and the application container should be exposed only on a loopback/private listener. `GET /api/health` reports readiness, deployment mode, and optional revision without returning credential material.

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

### Point-in-time company financials

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $GRIZZLY_BULLS_API_KEY" \
  -H "Accept: application/json" \
  "https://grizzlybulls.com/api/v1/sec/companies/0000320193/financials?period=quarterly&asOf=2025-03-31T23%3A59%3A59Z&limit=25"
```

`asOf` is a historical knowledge cutoff, not a financial period-end filter. The API conservatively requires returned observations to have been source-available by that timestamp. Reported facts retain revision/evidence lineage; derived metrics are separately identified and carry explicit inputs.

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

- Observed filer metadata is not silently promoted into a different canonical company identity.
- The company-financials and company-ownership routes use reviewed canonical issuer mappings rather than filing-observed identity alone.
- Filing date, discovery time, report period, source availability, and historical knowledge time are distinct concepts.
- An `asOf` cutoff means source-available-as-of; a period ending before the cutoff does not by itself make the observation historically knowable.
- Reported financial facts remain distinct from Grizzly Bulls derived metrics. Derived observations are not presented as source-reported and carry explicit methodology inputs.
- Financial values remain decimal strings so the reference app does not silently change machine precision.
- Company ownership requires commercial admission and excludes unresolved person identity; it remains a subset rather than a complete beneficial-ownership register.
- Section 16 current positions and Schedule 13 beneficial aggregates remain separate models even inside the company-centric ownership response.
- Source-faithful 13F holdings are a different data product from company ownership. They remain scoped to one exact accession, with no automatic amendment merge.
- 13F manager names, issuer labels, and CUSIPs remain filing observations and are not silently canonicalized into manager, company, or security identity.
- Retained evidence is provenance for the API response; opening a page does not cause a request-time SEC.gov fetch.
- Extracted section text is a normalized projection of retained filing evidence, not a replacement source document.
- 8-K item events are deterministic filing-structure observations. The app does not rename them into inferred corporate events.
- Filing comparisons use two explicit accessions and do not automatically link amendments or previous filings.

## Validation

```bash
pnpm check
```

That runs lint, TypeScript checking, focused tests, and a production Next.js build. CI and Docker use the committed lockfile with frozen installs.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md) before opening a pull request.

## Links

- [Hosted demo](https://sec-demo.grizzlybulls.com)
- [SEC Data API](https://grizzlybulls.com/sec-api)
- [OpenAPI 3.1 contract](https://grizzlybulls.com/api/v1/sec/openapi)
- [Grizzly Bulls](https://grizzlybulls.com)
- [MIT license](./LICENSE)

## License

MIT. See [LICENSE](./LICENSE).
