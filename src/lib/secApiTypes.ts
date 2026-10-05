export interface SecObservedFiler {
  cik: string | null;
  name: string | null;
}

export interface SecArchive {
  archiveCik: string | null;
  sourcePath: string | null;
  completeSubmissionUrl: string | null;
}

export interface SecRetainedEvidence {
  evidenceId: string;
  documentName: string | null;
  mediaType: string | null;
  contentSha256: string | null;
  acquiredAt: string | null;
  resolverVersion: string | null;
  selectedAt: string | null;
}

export interface SecFiling {
  accessionNumber: string;
  formType: string;
  filingDate: string;
  filingDirectoryUrl: string;
  firstDiscoveredAt: string;
  firstDiscoverySource: string;
  observedFiler: SecObservedFiler;
  archive: SecArchive;
  retainedEvidence: SecRetainedEvidence | null;
}

export interface SecPagination {
  limit: number;
  offset: number;
  returned: number;
  hasMore: boolean;
  nextOffset: number | null;
}

export interface SecResponseMeta {
  apiVersion: string;
  sourceAuthority: string;
  retrievedAt: string;
  semantics: {
    observedFilerIsCanonicalIdentity: boolean;
    requestTimeSecFetch: boolean;
  };
}

export interface SecFilingSearchResponse {
  data: { filings: SecFiling[] };
  pagination: SecPagination;
  meta: SecResponseMeta;
}

export interface SecFilingResponse {
  data: { filing: SecFiling };
  meta: SecResponseMeta;
}
