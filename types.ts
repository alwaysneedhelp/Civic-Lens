export interface NormalizedClaim {
  project?: string;
  amount?: number;
  currency?: string;
  date?: string;
  status?: string;
  [key: string]: any;
}

export interface DocumentEvidence {
  page: number;
  text: string;
}

export type VerdictType = 'TRUE' | 'FALSE' | 'PARTIAL' | 'AMBIGUOUS';

export interface AuditResult {
  timestamp: string;
  speaker_claim: string;
  normalized_claim: NormalizedClaim;
  document_evidence: DocumentEvidence;
  verdict: VerdictType;
  confidence: number;
  reasoning: string;
}

export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'complete' | 'error';
  error?: string;
}

export interface UploadedFiles {
  video: File | null;
  pdf: File | null;
}