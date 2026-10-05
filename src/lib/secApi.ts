import 'server-only';

import {
  buildFilingSearchPath,
  DEFAULT_SEC_API_BASE_URL,
  normalizeApiBaseUrl,
  type FilingSearchInput,
} from './secApiCore';
import type { SecFilingResponse, SecFilingSearchResponse } from './secApiTypes';

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
  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    !Array.isArray(payload.data.filings) ||
    !isRecord(payload.pagination) ||
    !isRecord(payload.meta)
  ) {
    throw new SecApiRequestError('The SEC API returned an unexpected filing-search response.', 502);
  }
  return payload as unknown as SecFilingSearchResponse;
}

function parseFilingResponse(payload: unknown): SecFilingResponse {
  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    !isRecord(payload.data.filing) ||
    !isRecord(payload.meta)
  ) {
    throw new SecApiRequestError('The SEC API returned an unexpected filing response.', 502);
  }
  return payload as unknown as SecFilingResponse;
}

export async function searchSecFilings(
  input: FilingSearchInput,
): Promise<SecFilingSearchResponse> {
  return parseSearchResponse(await requestJson(buildFilingSearchPath(input)));
}

export async function getSecFiling(accessionNumber: string): Promise<SecFilingResponse> {
  return parseFilingResponse(
    await requestJson(`/filings/${encodeURIComponent(accessionNumber)}`),
  );
}
