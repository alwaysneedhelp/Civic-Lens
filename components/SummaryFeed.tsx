import React from 'react';
import { SummaryResult, AnalysisState } from '../types';
import SummaryPointCard from './SummaryPointCard';

interface SummaryFeedProps {
  result: SummaryResult | null;
  status: AnalysisState['status'];
  onSeek: (timestamp: string) => void;
}

const SummaryFeed: React.FC<SummaryFeedProps> = ({ result, status, onSeek }) => {
  if (status === 'idle') {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-500">
            <h3 className="text-xl font-semibold mb-2 text-slate-400">Ready to Summarize</h3>
            <p className="max-w-md text-sm">Upload a meeting recording (MP4) or an official document (PDF). CivicLens will read it and produce a factual summary.</p>
        </div>
    );
  }

  if (status === 'analyzing') {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-pulse">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-semibold text-blue-400 mb-2">Gemini is Reasoning...</h3>
            <p className="text-slate-400 text-sm">Reading the file • Extracting key points</p>
            <div className="mt-8 text-xs font-mono text-slate-600 bg-slate-900/50 p-2 rounded">
                Multimodal Context: ACTIVE
            </div>
        </div>
    );
  }

  if (!result) return null;

  return (
    <div className="h-full overflow-y-auto pr-2 pb-20">
        <div className="mb-6 sticky top-0 bg-slate-950/95 backdrop-blur z-10 py-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {result.title}
                </h2>
                <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {result.points.length} Points
                </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{result.overview}</p>
            {result.usage?.totalTokenCount != null && (
                <p className="mt-2 text-xs font-mono text-slate-600">
                    Tokens used: {result.usage.totalTokenCount.toLocaleString()}
                    {' '}(prompt {result.usage.promptTokenCount?.toLocaleString() ?? 0}
                    {' + '}thinking {result.usage.thoughtsTokenCount?.toLocaleString() ?? 0}
                    {' + '}output {result.usage.candidatesTokenCount?.toLocaleString() ?? 0})
                </p>
            )}
        </div>

        {result.points.map((point, idx) => (
            <SummaryPointCard
                key={idx}
                point={point}
                sourceType={result.sourceType}
                onClickLocator={onSeek}
            />
        ))}

        <div className="h-12"></div>
    </div>
  );
};

export default SummaryFeed;
