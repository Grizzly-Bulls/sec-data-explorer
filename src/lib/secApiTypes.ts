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

export interface SecFilingSectionMetadata {
  key: string;
  item: string;
  title: string | null;
  contentSha256: string;
  wordCount: number;
  normalizedStartLine: number;
  normalizedEndLine: number;
}

export interface SecFilingEvent {
  eventType: '8-k-item';
  item: string;
  sectionKey: string;
  title: string | null;
  semanticInference: false;
}

export interface SecFilingIntelligenceSemantics {
  requestTimeSecFetch: boolean;
  automaticAmendmentLinkage: boolean;
  eventSemanticInference: boolean;
}

export interface SecFilingIntelligenceMeta {
  apiVersion: string;
  sourceAuthority: string;
  retrievedAt: string;
  semantics: SecFilingIntelligenceSemantics;
}

export interface SecFilingIntelligenceManifest {
  schemaVersion: number;
  extractorVersion: string;
  accessionNumber: string;
  formType: string;
  baseFormType: '10-K' | '10-Q' | '8-K';
  filingDate: string;
  isAmendment: boolean;
  selectedDocument: {
    documentType: string;
    sequence: number | null;
    filename: string | null;
    description: string | null;
  };
  sourceContentSha256: string;
  normalizedDocumentSha256: string;
  sections: SecFilingSectionMetadata[];
  events: SecFilingEvent[];
  semantics: SecFilingIntelligenceSemantics;
}

export interface SecFilingSectionsResponse {
  data: { filing: SecFilingIntelligenceManifest };
  meta: SecFilingIntelligenceMeta;
}

export interface SecFilingSection extends SecFilingSectionMetadata {
  text: string;
}

export interface SecFilingSectionResponse {
  data: {
    accessionNumber: string;
    section: SecFilingSection;
  };
  meta: SecFilingIntelligenceMeta;
}

export type SecFilingDiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';

export interface SecFilingDiffSection {
  key: string;
  item: string;
  status: SecFilingDiffStatus;
  fromContentSha256: string | null;
  toContentSha256: string | null;
  fromWordCount: number | null;
  toWordCount: number | null;
  wordCountDelta: number | null;
}

export interface SecFilingDiff {
  schemaVersion: number;
  fromAccessionNumber: string;
  toAccessionNumber: string;
  baseFormType: '10-K' | '10-Q' | '8-K';
  sections: SecFilingDiffSection[];
  summary: {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
  };
  semantics: {
    comparedExplicitAccessions: boolean;
    automaticAmendmentLinkage: boolean;
  };
}

export interface SecFilingDiffResponse {
  data: { diff: SecFilingDiff };
  meta: SecFilingIntelligenceMeta;
}
