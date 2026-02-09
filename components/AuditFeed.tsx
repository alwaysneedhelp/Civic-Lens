import React from 'react';
import { AuditResult, AnalysisState } from '../types';
import VerdictCard from './VerdictCard';

interface AuditFeedProps {
  results: AuditResult[];
  status: AnalysisState['status'];
  onSeek: (timestamp: string) => void;
}

const AuditFeed: React.FC<AuditFeedProps> = ({ results, status, onSeek }) => {
  if (status === 'idle') {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-500">
            <h3 className="text-xl font-semibold mb-2 text-slate-400">Ready to Audit</h3>
            <p className="max-w-md text-sm">Upload a meeting recording (MP4) and an official document (PDF). CivicLens will autonomously extract claims and verify them against the ground truth.</p>
        </div>
    );
  }

  if (status === 'analyzing') {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-pulse">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-semibold text-blue-400 mb-2">Gemini 3 is Reasoning...</h3>
            <p className="text-slate-400 text-sm">Transcribing audio • Parsing PDF • Verifying Claims</p>
            <div className="mt-8 text-xs font-mono text-slate-600 bg-slate-900/50 p-2 rounded">
                Thinking Budget: HIGH<br/>
                Multimodal Context: ACTIVE
            </div>
        </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-2 pb-20">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-950/95 backdrop-blur z-10 py-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Live Audit Feed
            </h2>
            <div className="flex gap-2">
                 <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {results.length} Claims Detected
                 </span>
            </div>
        </div>
        
        {results.map((result, idx) => (
            <VerdictCard 
                key={idx} 
                result={result} 
                onClickTimestamp={onSeek} 
            />
        ))}

        <div className="h-12"></div>
    </div>
  );
};

export default AuditFeed;