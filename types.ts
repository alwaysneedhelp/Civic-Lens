export type SourceType = 'video' | 'pdf' | 'youtube';

export interface SummaryPoint {
  locator: string; // e.g. "00:15" for video/YouTube timestamps, "Page 3" for PDF
  point: string;
}

export interface TokenUsage {
  promptTokenCount?: number;
  thoughtsTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export interface SummaryResult {
  sourceType: SourceType;
  title: string;
  overview: string;
  points: SummaryPoint[];
  usage?: TokenUsage;
}

export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'complete' | 'error';
  error?: string;
}
