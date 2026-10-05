export const DEFAULT_SEC_API_BASE_URL = 'https://grizzlybulls.com/api/v1/sec';
export const SEC_EXPLORER_PAGE_SIZE = 25;

export interface FilingSearchInput {
  form?: string;
  cik?: string;
  filedFrom?: string;
  filedTo?: string;
  limit?: number;
  offset?: number;
}

export const ACCESSION_NUMBER_PATTERN = /^[0-9]{10}-[0-9]{2}-[0-9]{6}$/;

export function normalizeApiBaseUrl(value: string | undefined): string {
  const candidate = value?.trim() || DEFAULT_SEC_API_BASE_URL;
  return candidate.replace(/\/+$/, '');
}

export function isValidAccessionNumber(value: string): boolean {
  return ACCESSION_NUMBER_PATTERN.test(value);
}

export function parseNonNegativeOffset(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) return 0;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function buildFilingSearchPath(input: FilingSearchInput): string {
  const params = new URLSearchParams();
  if (input.form?.trim()) params.set('form', input.form.trim());
  if (input.cik?.trim()) params.set('cik', input.cik.trim());
  if (input.filedFrom?.trim()) params.set('filedFrom', input.filedFrom.trim());
  if (input.filedTo?.trim()) params.set('filedTo', input.filedTo.trim());
  params.set('limit', String(input.limit ?? SEC_EXPLORER_PAGE_SIZE));
  params.set('offset', String(input.offset ?? 0));
  return `/filings?${params.toString()}`;
}

export function buildExplorerSearchHref(input: FilingSearchInput): string {
  const params = new URLSearchParams();
  if (input.form?.trim()) params.set('form', input.form.trim());
  if (input.cik?.trim()) params.set('cik', input.cik.trim());
  if (input.filedFrom?.trim()) params.set('filedFrom', input.filedFrom.trim());
  if (input.filedTo?.trim()) params.set('filedTo', input.filedTo.trim());
  if ((input.offset ?? 0) > 0) params.set('offset', String(input.offset));
  const query = params.toString();
  return query ? `/filings?${query}` : '/filings';
}
