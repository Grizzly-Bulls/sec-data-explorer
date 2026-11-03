import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const read = (relative: string): string => fs.readFileSync(path.resolve(relative), 'utf8');

test('hosted content search uses server-only SEC adapter and keeps credentials out of rendered page', () => {
  const page = read('app/content-search/page.tsx');
  const adapter = read('src/lib/secApi.ts');
  assert.match(page, /searchSecFilingContent/);
  assert.match(adapter, /parseContentSearchResponse\(await requestJson\(buildFilingContentSearchPath\(input\)\)\)/);
  assert.match(adapter, /await enforceHostedDemoBoundary\(\)/);
  assert.match(adapter, /Authorization:/);
  assert.doesNotMatch(page, /GRIZZLY_BULLS_API_KEY|GRIZZLY_BULLS_SEC_DEMO_API_KEY|NEXT_PUBLIC_|fetch\(/);
});

test('search results preserve observed issuer semantics, indexed coverage and provenance', () => {
  const page = read('app/content-search/page.tsx');
  assert.match(page, /match\.observedFilerCik/);
  assert.match(page, /indexedFilingsWithObservedCik/);
  assert.match(page, /indexedSections/);
  assert.match(page, /sourceContentSha256/);
  assert.match(page, /sectionContentSha256/);
  assert.match(page, /searchTermsCombinedWithAnd/);
  assert.match(page, /requestTimeSecFetch/);
  assert.match(page, /isValidAccessionNumber\(match\.accessionNumber\)/);
  assert.match(page, /isValidSectionKey\(match\.sectionKey\)/);
  assert.match(page, /encodeURIComponent\(match\.sectionKey\)/);
  assert.doesNotMatch(page, /match\.(?:filingPath|sectionPath)[}\)]/);
});

test('global navigation and home promote the existing live text-search workflow', () => {
  assert.match(read('app/layout.tsx'), /href="\/content-search"/);
  assert.match(read('app/page.tsx'), /href: '\/content-search'/);
  assert.match(read('README.md'), /filing-content-search\?q=liquidity/);
});
