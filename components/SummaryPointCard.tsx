import React from 'react';
import { SummaryPoint, SourceType } from '../types';

interface SummaryPointCardProps {
  point: SummaryPoint;
  sourceType: SourceType;
  onClickLocator: (locator: string) => void;
}

const SummaryPointCard: React.FC<SummaryPointCardProps> = ({ point, sourceType, onClickLocator }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 mb-4 transition-all duration-200 hover:shadow-lg hover:border-slate-700">
      <div className="flex items-center gap-3">
        {sourceType !== 'pdf' ? (
          <button
              onClick={() => onClickLocator(point.locator)}
              className="font-mono text-sm bg-slate-900/50 px-2 py-1 rounded hover:bg-slate-900 text-blue-400 transition-colors"
          >
              ▶ {point.locator}
          </button>
        ) : (
          <span className="font-mono text-sm bg-slate-900/50 px-2 py-1 rounded text-blue-400">
              {point.locator}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-200">{point.point}</p>
    </div>
  );
};

export default SummaryPointCard;
