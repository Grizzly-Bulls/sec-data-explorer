import 'server-only';

import {
  buildCompanyFinancialsPath,
  buildCompanyOwnershipPath,
  buildFilingDiffPath,
  buildFilingSearchPath,
  buildFilingSectionPath,
  buildFilingSectionsPath,
  buildInstitutionalHoldingsPath,
  DEFAULT_SEC_API_BASE_URL,
  normalizeApiBaseUrl,
  type CompanyFinancialsInput,
  type CompanyOwnershipInput,
  type FilingSearchInput,
  type InstitutionalHoldingsInput,
} from './secApiCore';
import type {
  SecCompanyFinancialsResponse,
  SecCompanyOwnershipResponse,
  SecFilingDiffResponse,
  SecFilingResponse,
  SecFilingSearchResponse,
  SecFilingSectionResponse,
  SecFilingSectionsResponse,
  SecInstitutionalHoldingsResponse,
} from './secApiTypes';

export class SecApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'SecApiRequestError';
  }
}

function apiKey(): string {
  const key = process.env.GRIZZLY_BULLS_API_KEY?.trim();
  if (!key) {
    throw new SecApiRequestError(
      'The server is not configured with a Grizzly Bulls API key.',
      500,
    );
  }
  return key;
}

function apiBaseUrl(): string {
  return normalizeApiBaseUrl(
    process.env.GRIZZLY_BULLS_SEC_API_BASE_URL || DEFAULT_SEC_API_BASE_URL,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload) || !isRecord(payload.error)) return fallback;
  return typeof payload.error.message === 'string' ? payload.error.message : fallback;
}

async function requestJson(path: string): Promise<unknown> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey()}`,
    },
    cache: 'no-store',
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Keep public errors bounded when an upstream response is not JSON.
  }

  if (!response.ok) {
    throw new SecApiRequestError(
      errorMessage(payload, `SEC API request failed with status ${response.status}.`),
      response.status,
    );
  }

  return payload;
}

function parseSearchResponse(payload: unknown): SecFilingSearchResponse {
  if (!isRecord(payload) || !isRecord(payload.data) || !Array.isArray(payload.data.filings) || !isRecord(payload.pagination) || !isRecord(payload.meta)) {
    throw new SecApiRequestError('The SEC API returned an unexpected filing-search response.', 502);
  }
  return payload as unknown as SecFilingSearchResponse;
}

function parseFilingResponse(payload: unknown): SecFilingResponse {
  if (!isRecord(payload) || !isRecord(payload.data) || !isRecord(payload.data.filing) || !isRecord(payload.meta)) {
    throw new SecApiRequestError('The SEC API returned an unexpected filing response.', 502);
  }
  return payload as unknown as SecFilingResponse;
}

function parseSectionsResponse(payload: unknown): SecFilingSectionsResponse {
  if (!isRecord(payload) || !isRecord(payload.data) || !isRecord(payload.data.filing) || !Array.isArray(payload.data.filing.sections) || !Array.isArray(payload.data.filing.events) || !isRecord(payload.meta)) {
    throw new SecApiRequestError('The SEC API returned an unexpected filing-sections response.', 502);
  }
  return payload as unknown as SecFilingSectionsResponse;
}

function parseSectionResponse(payload: unknown): SecFilingSectionResponse {
  if (!isRecord(payload) || !isRecord(payload.data) || typeof payload.data.accessionNumber !== 'string' || !isRecord(payload.data.section) || typeof payload.data.section.text !== 'string' || !isRecord(payload.meta)) {
    throw new SecApiRequestError('The SEC API returned an unexpected filing-section response.', 502);
  }
  return payload as unknown as SecFilingSectionResponse;
}

function parseDiffResponse(payload: unknown): SecFilingDiffResponse {
  if (!isRecord(payload) || !isRecord(payload.data) || !isRecord(payload.data.diff) || !Array.isArray(payload.data.diff.sections) || !isRecord(payload.data.diff.summary) || !isRecord(payload.meta)) {
    throw new SecApiRequestError('The SEC API returned an unexpected filing-diff response.', 502);
  }
  return payload as unknown as SecFilingDiffResponse;
}

function parseCompanyFinancialsResponse(payload: unknown): SecCompanyFinancialsResponse {
  if (!isRecord(payload) || !isRecord(payload.data) || !isRecord(payload.data.company) || !Array.isArray(payload.data.reportedFacts) || !Array.isArray(payload.data.derivedMetrics) || !isRecord(payload.meta) || !isRecord(payload.meta.query) || !isRecord(payload.meta.semantics)) {
    throw new SecApiRequestError('The SEC API returned an unexpected company-financials response.', 502);
  }
  return payload as unknown as SecCompanyFinancialsResponse;
}

function parseCompanyOwnershipResponse(payload: unknown): SecCompanyOwnershipResponse {
  if (!isRecord(payload) || !isRecord(payload.data) || !isRecord(payload.data.company) || !Array.isArray(payload.data.positions) || !Array.isArray(payload.data.beneficialOwnershipPositions) || !isRecord(payload.pagination) || !isRecord(payload.beneficialOwnershipPagination) || !isRecord(payload.meta) || !isRecord(payload.meta.coverage) || !isRecord(payload.meta.semantics)) {
    throw new SecApiRequestError('The SEC API returned an unexpected company-ownership response.', 502);
  }
  return payload as unknown as SecCompanyOwnershipResponse;
}

function parseInstitutionalHoldingsResponse(payload: unknown): SecInstitutionalHoldingsResponse {
  if (!isRecord(payload) || !isRecord(payload.data) || !isRecord(payload.data.filing) || !Array.isArray(payload.data.holdings) || !isRecord(payload.pagination) || !isRecord(payload.meta) || !isRecord(payload.meta.semantics)) {
    throw new SecApiRequestError('The SEC API returned an unexpected institutional-holdings response.', 502);
  }
  return payload as unknown as SecInstitutionalHoldingsResponse;
}

export async function searchSecFilings(input: FilingSearchInput): Promise<SecFilingSearchResponse> {
  return parseSearchResponse(await requestJson(buildFilingSearchPath(input)));
}

export async function getSecFiling(accessionNumber: string): Promise<SecFilingResponse> {
  return parseFilingResponse(await requestJson(`/filings/${encodeURIComponent(accessionNumber)}`));
}

export async function getSecFilingSections(accessionNumber: string): Promise<SecFilingSectionsResponse> {
  return parseSectionsResponse(await requestJson(buildFilingSectionsPath(accessionNumber)));
}

export async function getSecFilingSection(accessionNumber: string, sectionKey: string): Promise<SecFilingSectionResponse> {
  return parseSectionResponse(await requestJson(buildFilingSectionPath(accessionNumber, sectionKey)));
}

export async function diffSecFilings(fromAccessionNumber: string, toAccessionNumber: string): Promise<SecFilingDiffResponse> {
  return parseDiffResponse(await requestJson(buildFilingDiffPath(fromAccessionNumber, toAccessionNumber)));
}

export async function getSecCompanyFinancials(input: CompanyFinancialsInput): Promise<SecCompanyFinancialsResponse> {
  return parseCompanyFinancialsResponse(await requestJson(buildCompanyFinancialsPath(input)));
}

export async function getSecCompanyOwnership(input: CompanyOwnershipInput): Promise<SecCompanyOwnershipResponse> {
  return parseCompanyOwnershipResponse(await requestJson(buildCompanyOwnershipPath(input)));
}

export async function getSecInstitutionalHoldings(input: InstitutionalHoldingsInput): Promise<SecInstitutionalHoldingsResponse> {
  return parseInstitutionalHoldingsResponse(await requestJson(buildInstitutionalHoldingsPath(input)));
}
