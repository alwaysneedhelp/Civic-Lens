export type SourceType = 'video' | 'pdf';

export interface SummaryPoint {
  locator: string; // e.g. "00:15" for video timestamps, "Page 3" for PDF
  point: string;
}

export interface SummaryResult {
  sourceType: SourceType;
  title: string;
  overview: string;
  points: SummaryPoint[];
}

export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'complete' | 'error';
  error?: string;
}
