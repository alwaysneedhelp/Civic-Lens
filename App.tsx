import React, { useState } from 'react';
import VideoSection from './components/VideoSection';
import PdfPreview from './components/PdfPreview';
import YoutubeEmbed from './components/YoutubeEmbed';
import SummaryFeed from './components/SummaryFeed';
import { AnalysisState, SummaryResult, SourceType } from './types';
import { summarizeContent, summarizeYoutubeUrl, getSourceType, isYoutubeUrl, FILE_API_MAX_BYTES } from './services/geminiService';
import { DEMO_VIDEO_SUMMARY, DEMO_PDF_SUMMARY, DEMO_YOUTUBE_SUMMARY } from './services/demoData';

type InputMode = 'file' | 'youtube';

// Gemini tokenizes video at roughly this many tokens/second at default
// resolution (see https://ai.google.dev/gemini-api/docs/video-understanding).
// Used only to show a rough pre-run estimate; the real number is reported
// from the API's usageMetadata after each run.
const VIDEO_TOKENS_PER_SECOND = 300;

export default function App() {
  const [mode, setMode] = useState<InputMode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<SourceType | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [estimatedVideoTokens, setEstimatedVideoTokens] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: 'idle' });
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [seekTimestamp, setSeekTimestamp] = useState<string | null>(null);

  const resetResults = () => {
    setAnalysis({ status: 'idle' });
    setResult(null);
    setSeekTimestamp(null);
  };

  const handleModeChange = (nextMode: InputMode) => {
    setMode(nextMode);
    setFile(null);
    setSourceType(null);
    setYoutubeUrl('');
    setEstimatedVideoTokens(null);
    resetResults();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const type = getSourceType(selected);
    if (!type) {
      setAnalysis({ status: 'error', error: 'Unsupported file type. Please upload a video (MP4) or a PDF.' });
      return;
    }
    if (selected.size > FILE_API_MAX_BYTES) {
      setAnalysis({ status: 'error', error: `File too large (>${(FILE_API_MAX_BYTES / (1024 * 1024)).toFixed(0)}MB). Please use a shorter clip or smaller document.` });
      return;
    }

    setFile(selected);
    setSourceType(type);
    setEstimatedVideoTokens(null);
    resetResults();
  };

  const handleSummarize = async () => {
    if (mode === 'file' && !file) return;
    if (mode === 'youtube' && !isYoutubeUrl(youtubeUrl)) {
      setAnalysis({ status: 'error', error: 'Please enter a public YouTube video URL.' });
      return;
    }

    setAnalysis({ status: 'analyzing' });
    setResult(null);

    try {
      const data = mode === 'file'
        ? await summarizeContent(file!)
        : await summarizeYoutubeUrl(youtubeUrl);
      setResult(data);
      setAnalysis({ status: 'complete' });
    } catch (error: any) {
      console.error(error);
      setAnalysis({
          status: 'error',
          error: error.message || 'Failed to summarize content. Please check API Key or file/URL.'
      });
    }
  };

  const handleDownloadReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "civic_summary_report.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Check if we are showing demo data
  const isDemoMode = result === DEMO_VIDEO_SUMMARY || result === DEMO_PDF_SUMMARY || result === DEMO_YOUTUBE_SUMMARY;

  const canSummarize = mode === 'file' ? !!file : isYoutubeUrl(youtubeUrl);

  const tokenEstimateNote = (() => {
    if (mode === 'youtube') return 'Token cost scales with video length (~300 tokens/sec at default resolution).';
    if (sourceType === 'pdf') return 'Gemini tokenizes PDFs at roughly ~258 tokens per page.';
    if (sourceType === 'video' && estimatedVideoTokens != null) {
      return `Estimated ≤ ~${estimatedVideoTokens.toLocaleString()} tokens for this clip (~${VIDEO_TOKENS_PER_SECOND}/sec at default resolution).`;
    }
    return null;
  })();

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">

      {/* Header */}
      <header className="h-16 flex-none border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-900/20">
                CL
            </div>
            <div>
                <h1 className="font-bold text-xl tracking-tight text-white">CivicLens</h1>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Media Summarizer</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-500 border border-slate-800 rounded px-3 py-1.5 bg-slate-950">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                System: ONLINE
            </div>
            <div className="text-xs text-slate-600">v1.05 (Hackathon Build)</div>
        </div>
      </header>

      {/* Error / Demo Banner */}
      {analysis.status === 'error' && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 px-6 py-2 text-sm text-center">
            <strong>Analysis Failed:</strong> {analysis.error}
        </div>
      )}
      {analysis.status === 'complete' && isDemoMode && (
         <div className="bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-400 px-6 py-2 text-sm text-center font-mono">
            ⚠️ DEMO MODE: API Key missing. Showing example data. Your content was NOT analyzed.
         </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

        {/* Left: Source Preview */}
        <div className="w-full md:w-1/2 lg:w-3/5 p-6 flex flex-col gap-6 overflow-y-auto border-r border-slate-800 bg-slate-950/50">
           <div className="flex-1 min-h-[300px] flex flex-col">
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Source</h2>
                 {mode === 'file' && file && <span className="text-xs text-slate-500 font-mono">{file.size > 1024*1024 ? `${(file.size / (1024*1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`}</span>}
              </div>
              {mode === 'youtube' ? (
                <YoutubeEmbed url={youtubeUrl} seekTimestamp={seekTimestamp} />
              ) : sourceType === 'pdf' && file ? (
                <PdfPreview pdfFile={file} />
              ) : (
                <VideoSection
                  videoFile={sourceType === 'video' ? file : null}
                  seekToTimestamp={seekTimestamp}
                  onDuration={(seconds) => setEstimatedVideoTokens(Math.round(seconds * VIDEO_TOKENS_PER_SECOND))}
                />
              )}
           </div>

           {/* Upload Controls */}
           <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Upload Source
                </h3>
                <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs font-medium">
                    <button
                        onClick={() => handleModeChange('file')}
                        className={`px-3 py-1.5 transition-colors ${mode === 'file' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                    >
                        Upload File
                    </button>
                    <button
                        onClick={() => handleModeChange('youtube')}
                        className={`px-3 py-1.5 transition-colors ${mode === 'youtube' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                    >
                        YouTube Link
                    </button>
                </div>
              </div>

              {mode === 'file' ? (
                <div className="relative group">
                    <input
                        type="file"
                        accept="video/*,application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`h-12 px-4 rounded-lg border border-dashed flex items-center justify-center text-sm transition-all ${file ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-800'}`}>
                        {file ? `${sourceType === 'video' ? 'Video' : 'PDF'} Loaded ✓ (${file.name})` : 'Select Video (MP4) or PDF'}
                    </div>
                </div>
              ) : (
                <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => { setYoutubeUrl(e.target.value); resetResults(); }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full h-12 px-4 rounded-lg border border-slate-700 bg-slate-950 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              )}

              {tokenEstimateNote && (
                <p className="mt-2 text-xs text-slate-500">{tokenEstimateNote}</p>
              )}

              <button
                onClick={handleSummarize}
                disabled={!canSummarize || analysis.status === 'analyzing'}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
              >
                {analysis.status === 'analyzing' ? 'Summarizing...' : 'Run Autonomous Summary'}
                {!analysis.status && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              </button>
           </div>
        </div>

        {/* Right: Feed */}
        <div className="w-full md:w-1/2 lg:w-2/5 p-6 bg-slate-900/20 backdrop-blur-sm relative border-t md:border-t-0 md:border-l border-slate-800">
           <SummaryFeed
              result={result}
              status={analysis.status}
              onSeek={setSeekTimestamp}
           />

           {analysis.status === 'complete' && (
              <div className="absolute bottom-6 left-6 right-6">
                 <button
                    onClick={handleDownloadReport}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded border border-slate-700 transition-colors"
                 >
                    Download Summary Report (JSON)
                 </button>
              </div>
           )}
        </div>
      </main>
    </div>
  );
}
