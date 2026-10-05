import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const client = readFileSync(new URL('../src/lib/secApi.ts', import.meta.url), 'utf8');
const hostedDemo = readFileSync(new URL('../src/lib/hostedDemo.ts', import.meta.url), 'utf8');
const healthRoute = readFileSync(new URL('../app/api/health/route.ts', import.meta.url), 'utf8');
const dockerfile = readFileSync(new URL('../Dockerfile', import.meta.url), 'utf8');
const core = readFileSync(new URL('../src/lib/secApiCore.ts', import.meta.url), 'utf8');
const sectionsPage = readFileSync(new URL('../app/filings/[accessionNumber]/sections/page.tsx', import.meta.url), 'utf8');
const diffPage = readFileSync(new URL('../app/filing-diff/page.tsx', import.meta.url), 'utf8');
const financialsPage = readFileSync(new URL('../app/financials/page.tsx', import.meta.url), 'utf8');
const ownershipPage = readFileSync(new URL('../app/ownership/page.tsx', import.meta.url), 'utf8');
const holdingsPage = readFileSync(new URL('../app/institutional-holdings/page.tsx', import.meta.url), 'utf8');
const envExample = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> };

test('the machine API adapter is explicitly server-only', () => {
  assert.match(client, /import 'server-only'/);
  assert.match(client, /resolveSecServerCredential/);
  assert.doesNotMatch(client, /NEXT_PUBLIC_/);
});

test('the reference app points at the versioned public SEC API rather than SEC.gov', () => {
  assert.match(client, /GRIZZLY_BULLS_SEC_API_BASE_URL/);
  assert.doesNotMatch(client, /sec\.gov/i);
  assert.match(envExample, /GRIZZLY_BULLS_API_KEY=your_key_here/);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_/);
});

test('hosted demo mode uses a dedicated server-only credential and bounded edge limiter', () => {
  assert.match(hostedDemo, /GRIZZLY_BULLS_SEC_DEMO_ENABLED/);
  assert.match(hostedDemo, /GRIZZLY_BULLS_SEC_DEMO_API_KEY/);
  assert.match(hostedDemo, /HOSTED_DEMO_REQUESTS_PER_WINDOW = 30/);
  assert.match(hostedDemo, /HOSTED_DEMO_WINDOW_MS = 60_000/);
  assert.match(client, /identifyHostedDemoClient/);
  assert.match(client, /hostedDemoRateLimiter\.consume/);
  assert.doesNotMatch(hostedDemo, /NEXT_PUBLIC_/);
  assert.match(healthRoute, /service: 'sec-data-explorer'/);
  assert.match(healthRoute, /Cache-Control/);
  assert.doesNotMatch(healthRoute, /API_KEY/);
  assert.match(dockerfile, /USER nextjs/);
});

test('filing intelligence stays on reviewed public routes and explicit identities', () => {
  assert.match(client, /getSecFilingSections/);
  assert.match(client, /getSecFilingSection/);
  assert.match(client, /diffSecFilings/);
  assert.match(core, /buildFilingDiffPath/);
  assert.match(sectionsPage, /event\.semanticInference/);
  assert.match(diffPage, /does not choose a previous filing automatically/);
  assert.match(diffPage, /does not fabricate a line-by-line redline/);
  assert.doesNotMatch(sectionsPage, /fetch\(/);
  assert.doesNotMatch(diffPage, /fetch\(/);
});

test('point-in-time financials preserve source availability and fact-class boundaries', () => {
  assert.match(client, /getSecCompanyFinancials/);
  assert.match(core, /buildCompanyFinancialsPath/);
  assert.match(financialsPage, /source-available-as-of/i);
  assert.match(financialsPage, /conservative filing-availability/i);
  assert.match(financialsPage, /derived metrics source-reported/i);
  assert.match(financialsPage, /explicit derivation inputs/i);
  assert.doesNotMatch(financialsPage, /fetch\(/);
  assert.doesNotMatch(financialsPage, /Number\(.*\.value/);
});

test('company ownership and exact-filing 13F remain separate public workflows', () => {
  assert.match(client, /getSecCompanyOwnership/);
  assert.match(client, /getSecInstitutionalHoldings/);
  assert.match(core, /buildCompanyOwnershipPath/);
  assert.match(core, /buildInstitutionalHoldingsPath/);
  assert.match(ownershipPage, /Reviewed subset, not a complete beneficial-ownership register/);
  assert.match(ownershipPage, /Form 13F holdings are explicitly not included here/);
  assert.match(ownershipPage, /institutionalHoldingsIncluded/);
  assert.match(ownershipPage, /13F included here/);
  assert.match(holdingsPage, /No automatic amendment merge/);
  assert.match(holdingsPage, /CUSIP is not promoted into canonical security identity/);
  assert.match(holdingsPage, /Other manager/);
  assert.doesNotMatch(ownershipPage, /fetch\(/);
  assert.doesNotMatch(holdingsPage, /fetch\(/);
});

test('one check command covers lint, types, tests, and production build', () => {
  assert.match(packageJson.scripts.check, /pnpm lint/);
  assert.match(packageJson.scripts.check, /pnpm typecheck/);
  assert.match(packageJson.scripts.check, /pnpm test/);
  assert.match(packageJson.scripts.check, /pnpm build/);
});
