import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCompanyFinancialsPath,
  buildCompanyOwnershipPath,
  buildExplorerFilingDiffHref,
  buildExplorerFinancialsHref,
  buildExplorerInstitutionalHoldingsHref,
  buildExplorerOwnershipHref,
  buildExplorerSearchHref,
  buildFilingDiffPath,
  buildFilingSearchPath,
  buildFilingSectionPath,
  buildFilingSectionsPath,
  buildInstitutionalHoldingsPath,
  isValidAccessionNumber,
  isValidAsOfTimestamp,
  isValidFinancialMetricKey,
  isValidFinancialPeriodScope,
  isValidSectionKey,
  isValidSecIssuerCik,
  normalizeApiBaseUrl,
  parseNonNegativeOffset,
  supportsFilingIntelligence,
  supportsInstitutionalHoldings,
} from '../src/lib/secApiCore';

test('normalizes the SEC API base URL without changing the public default', () => {
  assert.equal(normalizeApiBaseUrl(undefined), 'https://grizzlybulls.com/api/v1/sec');
  assert.equal(normalizeApiBaseUrl('https://example.test/sec///'), 'https://example.test/sec');
});

test('builds bounded filing-search paths with only supplied filters', () => {
  assert.equal(buildFilingSearchPath({ form: ' 10-K ', cik: '0000320193', limit: 25, offset: 50 }), '/filings?form=10-K&cik=0000320193&limit=25&offset=50');
});

test('builds local search links without leaking machine API credentials', () => {
  assert.equal(buildExplorerSearchHref({ form: '8-K', filedFrom: '2026-10-01', offset: 25 }), '/filings?form=8-K&filedFrom=2026-10-01&offset=25');
});

test('validates exact SEC accession-number shape', () => {
  assert.equal(isValidAccessionNumber('0000320193-26-000077'), true);
  assert.equal(isValidAccessionNumber('0000320193-2026-77'), false);
});

test('validates stable filing section keys', () => {
  assert.equal(isValidSectionKey('item-1-business'), true);
  assert.equal(isValidSectionKey('Item 1'), false);
  assert.equal(isValidSectionKey('a'.repeat(81)), false);
});

test('identifies filing forms supported by reviewed filing-specific surfaces', () => {
  assert.equal(supportsFilingIntelligence('10-K'), true);
  assert.equal(supportsFilingIntelligence('10-Q/A'), true);
  assert.equal(supportsFilingIntelligence('8-K'), true);
  assert.equal(supportsFilingIntelligence('DEF 14A'), false);
  assert.equal(supportsInstitutionalHoldings('13F-HR'), true);
  assert.equal(supportsInstitutionalHoldings('13F-HR/A'), true);
  assert.equal(supportsInstitutionalHoldings('13F-NT'), false);
});

test('builds filing intelligence machine paths from explicit identities', () => {
  assert.equal(buildFilingSectionsPath('0000320193-26-000077'), '/filings/0000320193-26-000077/sections');
  assert.equal(buildFilingSectionPath('0000320193-26-000077', 'item-1-business'), '/filings/0000320193-26-000077/sections/item-1-business');
  assert.equal(buildFilingDiffPath('0000320193-25-000079', '0000320193-26-000077'), '/filing-diff?from=0000320193-25-000079&to=0000320193-26-000077');
});

test('builds local diff links without machine credentials', () => {
  assert.equal(buildExplorerFilingDiffHref('0000320193-25-000079'), '/filing-diff?from=0000320193-25-000079');
});

test('validates point-in-time financial query inputs', () => {
  assert.equal(isValidSecIssuerCik('0000320193'), true);
  assert.equal(isValidSecIssuerCik('320193'), true);
  assert.equal(isValidSecIssuerCik('0000320193x'), false);
  assert.equal(isValidFinancialPeriodScope('quarterly'), true);
  assert.equal(isValidFinancialPeriodScope('monthly'), false);
  assert.equal(isValidFinancialMetricKey('Revenue'), true);
  assert.equal(isValidFinancialMetricKey('revenue-total'), false);
  assert.equal(isValidAsOfTimestamp('2025-03-31T23:59:59Z'), true);
  assert.equal(isValidAsOfTimestamp('2025-03-31'), false);
  assert.equal(isValidAsOfTimestamp('2025-03-31T23:59:59'), false);
});

test('builds canonical company-financial paths without changing the as-of timestamp', () => {
  assert.equal(buildCompanyFinancialsPath({ cik: '0000320193', period: 'quarterly', metric: 'Revenue', asOf: '2025-03-31T23:59:59Z', limit: 25 }), '/companies/0000320193/financials?period=quarterly&metric=Revenue&asOf=2025-03-31T23%3A59%3A59Z&limit=25');
  assert.equal(buildExplorerFinancialsHref({ cik: '0000320193', period: 'annual', metric: 'Revenue' }), '/financials?cik=0000320193&period=annual&metric=Revenue');
});

test('builds company ownership and exact-filing 13F paths as separate identities', () => {
  assert.equal(buildCompanyOwnershipPath({ cik: '0000320193', limit: 25 }), '/companies/0000320193/ownership?limit=25');
  assert.equal(buildInstitutionalHoldingsPath({ accessionNumber: '0001067983-26-000003', limit: 25, offset: 50 }), '/filings/0001067983-26-000003/institutional-holdings?limit=25&offset=50');
  assert.equal(buildExplorerOwnershipHref('0000320193'), '/ownership?cik=0000320193');
  assert.equal(buildExplorerInstitutionalHoldingsHref('0001067983-26-000003', 25), '/institutional-holdings?accession=0001067983-26-000003&offset=25');
});

test('offset parsing fails closed to the first page', () => {
  assert.equal(parseNonNegativeOffset(undefined), 0);
  assert.equal(parseNonNegativeOffset('-1'), 0);
  assert.equal(parseNonNegativeOffset('abc'), 0);
  assert.equal(parseNonNegativeOffset('25'), 25);
});
