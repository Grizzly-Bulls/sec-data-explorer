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

export type SecFinancialPeriodScope = 'all' | 'annual' | 'quarterly' | 'ttm';
export type SecFinancialStatement = 'income-statement' | 'cash-flow' | 'balance-sheet' | 'capital-returns';
export type SecFinancialFactKind = 'duration' | 'instant';
export type SecFinancialPeriodKind = 'fiscal-year' | 'fiscal-quarter' | 'fiscal-ytd' | 'instant';

export interface SecFinancialReportedFact {
  factId: string;
  seriesKey: string;
  companyId: string;
  secIssuerCik: string;
  metricKey: string;
  statement: SecFinancialStatement;
  factKind: SecFinancialFactKind;
  value: string;
  unit: string;
  currency: string | null;
  period: {
    periodId: string;
    kind: SecFinancialPeriodKind;
    startDate: string | null;
    endDate: string;
    fiscalYearLabel: string | null;
    fiscalPeriodLabel: string | null;
  };
  filing: {
    accession: string;
    form: string;
    filedAt: string;
    availableAt: string;
    filingFiscalYear: number | null;
    frame: string | null;
  };
  xbrl: {
    concept: string;
    sourceFactLocator: string;
  };
  evidence: {
    evidenceId: string;
    sourceId: string;
    sourceRecordId: string;
    contentSha256: string | null;
    acquiredAt: string;
    sourcePublishedAt: string | null;
    rightsProfileId: string;
  };
  revision: {
    number: number;
    supersedesFactId: string | null;
    currentlySelected: boolean;
    currentState: 'active' | 'superseded';
  };
  directMethod: string;
}

export interface SecFinancialDerivedInput {
  inputRecordId: string;
  ordinal: number;
  role: string;
  sourceFactLocator: string;
  evidenceId: string;
  value: string | null;
  unit: string | null;
  concept: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  filedAt: string | null;
  form: string | null;
}

export interface SecFinancialDerivedMetric {
  metricObservationId: string;
  companyId: string;
  metricKey: string;
  value: string;
  unit: string;
  asOfDate: string;
  availableAt: string;
  computedAt: string;
  methodology: {
    id: string;
    version: string;
  };
  rightsProfileId: string;
  currentlySelected: boolean;
  inputs: SecFinancialDerivedInput[];
}

export interface SecCompanyFinancialsResponse {
  data: {
    company: {
      companyId: string;
      secIssuerCik: string;
    };
    reportedFacts: SecFinancialReportedFact[];
    derivedMetrics: SecFinancialDerivedMetric[];
  };
  meta: {
    apiVersion: string;
    sourceAuthority: string;
    retrievedAt: string;
    query: {
      secIssuerCik: string;
      periodScope: SecFinancialPeriodScope;
      metricKey: string | null;
      asOf: string | null;
      limit: number;
    };
    semantics: {
      requestTimeSecFetch: boolean;
      canonicalCompanyIdentity: boolean;
      valuesAreDecimalStrings: boolean;
      pointInTimeMode: 'current-selection' | 'source-available-as-of';
      conservativeFilingAvailability: boolean;
      reportedFactRevisionChains: boolean;
      derivedMetricsAreSourceReported: boolean;
      derivedMetricsCarryExplicitInputs: boolean;
    };
  };
}
