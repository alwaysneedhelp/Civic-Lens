import React, { useState } from 'react';
import { AuditResult } from '../types';

interface VerdictCardProps {
  result: AuditResult;
  onClickTimestamp: (time: string) => void;
}

const VerdictCard: React.FC<VerdictCardProps> = ({ result, onClickTimestamp }) => {
  const [expanded, setExpanded] = useState(false);

  const getVerdictStyles = (verdict: string) => {
    switch (verdict) {
      case 'TRUE': return 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400';
      case 'FALSE': return 'border-red-500/50 bg-red-950/20 text-red-400';
      case 'PARTIAL': return 'border-yellow-500/50 bg-yellow-950/20 text-yellow-400';
      case 'AMBIGUOUS': return 'border-slate-500/50 bg-slate-800/50 text-slate-400';
      default: return 'border-gray-500 bg-gray-800 text-gray-400';
    }
  };

  const getBadgeColor = (verdict: string) => {
    switch (verdict) {
      case 'TRUE': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'FALSE': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'PARTIAL': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'AMBIGUOUS': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className={`rounded-xl border p-4 mb-4 transition-all duration-200 hover:shadow-lg ${getVerdictStyles(result.verdict)}`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-3">
            <button 
                onClick={() => onClickTimestamp(result.timestamp)}
                className="font-mono text-sm bg-slate-900/50 px-2 py-1 rounded hover:bg-slate-900 text-blue-400 transition-colors"
            >
                ▶ {result.timestamp}
            </button>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getBadgeColor(result.verdict)}`}>
                {result.verdict}
            </span>
            <span className="text-xs text-slate-500">Conf: {(result.confidence * 100).toFixed(0)}%</span>
        </div>
        <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xs uppercase tracking-wider opacity-60 hover:opacity-100"
        >
            {expanded ? 'Hide Evidence' : 'View Evidence'}
        </button>
      </div>

      <div className="mt-3">
        <h4 className="font-semibold text-lg leading-snug opacity-95">"{result.speaker_claim}"</h4>
        <p className="mt-2 text-sm opacity-80 leading-relaxed">{result.reasoning}</p>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-700/50 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h5 className="text-xs uppercase tracking-wider text-slate-500 mb-1">Normalized Claim</h5>
                    <pre className="bg-slate-950/50 p-2 rounded text-xs font-mono overflow-x-auto text-slate-300 border border-slate-800">
                        {JSON.stringify(result.normalized_claim, null, 2)}
                    </pre>
                </div>
                <div>
                    <h5 className="text-xs uppercase tracking-wider text-slate-500 mb-1">Ground Truth (PDF Page {result.document_evidence.page})</h5>
                    <div className="bg-slate-950/50 p-2 rounded text-xs italic border border-slate-800 text-slate-300">
                        "{result.document_evidence.text}"
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default VerdictCard;