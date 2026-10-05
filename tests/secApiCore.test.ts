import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildExplorerSearchHref,
  buildFilingSearchPath,
  isValidAccessionNumber,
  normalizeApiBaseUrl,
  parseNonNegativeOffset,
} from '../src/lib/secApiCore';

test('normalizes the SEC API base URL without changing the public default', () => {
  assert.equal(normalizeApiBaseUrl(undefined), 'https://grizzlybulls.com/api/v1/sec');
  assert.equal(normalizeApiBaseUrl('https://example.test/sec///'), 'https://example.test/sec');
});

test('builds bounded filing-search paths with only supplied filters', () => {
  assert.equal(
    buildFilingSearchPath({ form: ' 10-K ', cik: '0000320193', limit: 25, offset: 50 }),
    '/filings?form=10-K&cik=0000320193&limit=25&offset=50',
  );
});

test('builds local search links without leaking machine API credentials', () => {
  assert.equal(
    buildExplorerSearchHref({ form: '8-K', filedFrom: '2026-10-01', offset: 25 }),
    '/filings?form=8-K&filedFrom=2026-10-01&offset=25',
  );
});

test('validates exact SEC accession-number shape', () => {
  assert.equal(isValidAccessionNumber('0000320193-26-000077'), true);
  assert.equal(isValidAccessionNumber('0000320193-2026-77'), false);
});

test('offset parsing fails closed to the first page', () => {
  assert.equal(parseNonNegativeOffset(undefined), 0);
  assert.equal(parseNonNegativeOffset('-1'), 0);
  assert.equal(parseNonNegativeOffset('abc'), 0);
  assert.equal(parseNonNegativeOffset('25'), 25);
});
