import React, { useMemo } from 'react';

interface YoutubeEmbedProps {
  url: string;
  seekTimestamp: string | null;
}

const VIDEO_ID_PATTERNS = [
  /youtube\.com\/watch\?v=([\w-]+)/,
  /youtu\.be\/([\w-]+)/,
  /youtube\.com\/shorts\/([\w-]+)/,
];

const parseVideoId = (url: string): string | null => {
  for (const pattern of VIDEO_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const timestampToSeconds = (ts: string): number => {
  const parts = ts.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
};

const YoutubeEmbed: React.FC<YoutubeEmbedProps> = ({ url, seekTimestamp }) => {
  const videoId = useMemo(() => parseVideoId(url), [url]);
  const start = seekTimestamp ? timestampToSeconds(seekTimestamp) : 0;

  if (!videoId) {
    return (
        <div className="h-64 md:h-full w-full rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p>Paste a public YouTube link to preview it here</p>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-800">
        {/* Remounting on `start` forces the embed to jump to the clicked locator */}
        <iframe
            key={start}
            src={`https://www.youtube.com/embed/${videoId}?start=${start}${seekTimestamp ? '&autoplay=1' : ''}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video preview"
        />
    </div>
  );
};

export default YoutubeEmbed;
