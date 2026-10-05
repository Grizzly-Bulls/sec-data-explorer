# Contributing

Thanks for helping improve SEC Data Explorer.

This repository is intentionally a small reference integration for the public Grizzly Bulls SEC Data API. Changes should make the integration clearer, safer, or more useful without creating a second SEC data pipeline.

## Local setup

You need Node.js 24 and pnpm 11.

```bash
git clone https://github.com/Grizzly-Bulls/sec-data-explorer.git
cd sec-data-explorer
pnpm install
cp .env.example .env.local
```

Add your Grizzly Bulls API key to `.env.local`, then run:

```bash
pnpm dev
```

## Before opening a pull request

```bash
pnpm check
```

Please keep API credentials server-only, use only the public SEC API contract, add focused tests when behavior changes, and avoid introducing private Grizzly Bulls dependencies or request-time SEC.gov scraping.
