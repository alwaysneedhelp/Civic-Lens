import React, { useState } from 'react';
import VideoSection from './components/VideoSection';
import AuditFeed from './components/AuditFeed';
import { AnalysisState, AuditResult, UploadedFiles } from './types';
import { analyzeContent } from './services/geminiService';
import { DEMO_AUDIT_RESULTS } from './services/demoData';

export default function App() {
  const [files, setFiles] = useState<UploadedFiles>({ video: null, pdf: null });
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: 'idle' });
  const [results, setResults] = useState<AuditResult[]>([]);
  const [seekTimestamp, setSeekTimestamp] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'pdf') => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
      // Reset state on new file
      setAnalysis({ status: 'idle' });
      setResults([]);
    }
  };

  const handleAudit = async () => {
    if (!files.video || !files.pdf) return;

    setAnalysis({ status: 'analyzing' });
    setResults([]);

    try {
      const data = await analyzeContent(files.video, files.pdf);
      setResults(data);
      setAnalysis({ status: 'complete' });
    } catch (error: any) {
      console.error(error);
      setAnalysis({ 
          status: 'error', 
          error: error.message || 'Failed to analyze content. Please check API Key or File Size.' 
      });
    }
  };

  const handleDownloadReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "civic_audit_report.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Check if we are showing demo data
  const isDemoMode = results === DEMO_AUDIT_RESULTS;

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
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Autonomous Auditor</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-500 border border-slate-800 rounded px-3 py-1.5 bg-slate-950">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                System: ONLINE
            </div>
            <div className="text-xs text-slate-600">v1.0.0 (Hackathon Build)</div>
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
            ⚠️ DEMO MODE: API Key missing. Showing example data. Your files were NOT analyzed.
         </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left: Video Player */}
        <div className="w-full md:w-1/2 lg:w-3/5 p-6 flex flex-col gap-6 overflow-y-auto border-r border-slate-800 bg-slate-950/50">
           <div className="flex-1 min-h-[300px] flex flex-col">
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Evidence Source (Video)</h2>
                 {files.video && <span className="text-xs text-slate-500 font-mono">{files.video.size > 1024*1024 ? `${(files.video.size / (1024*1024)).toFixed(1)} MB` : 'KB'}</span>}
              </div>
              <VideoSection videoFile={files.video} seekToTimestamp={seekTimestamp} />
           </div>

           {/* Upload Controls */}
           <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload Sources
              </h3>
              <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <input 
                        type="file" 
                        accept="video/*" 
                        onChange={(e) => handleFileChange(e, 'video')} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`h-12 px-4 rounded-lg border border-dashed flex items-center justify-center text-sm transition-all ${files.video ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-800'}`}>
                        {files.video ? 'Video Loaded ✓' : 'Select Video (MP4)'}
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <input 
                        type="file" 
                        accept="application/pdf" 
                        onChange={(e) => handleFileChange(e, 'pdf')} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`h-12 px-4 rounded-lg border border-dashed flex items-center justify-center text-sm transition-all ${files.pdf ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-800'}`}>
                        {files.pdf ? 'PDF Loaded ✓' : 'Select PDF'}
                    </div>
                  </div>
              </div>
              
              <button
                onClick={handleAudit}
                disabled={!files.video || !files.pdf || analysis.status === 'analyzing'}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
              >
                {analysis.status === 'analyzing' ? 'Auditing...' : 'Run Autonomous Audit'}
                {!analysis.status && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              </button>
           </div>
        </div>

        {/* Right: Feed */}
        <div className="w-full md:w-1/2 lg:w-2/5 p-6 bg-slate-900/20 backdrop-blur-sm relative border-t md:border-t-0 md:border-l border-slate-800">
           <AuditFeed 
              results={results} 
              status={analysis.status} 
              onSeek={setSeekTimestamp} 
           />
           
           {analysis.status === 'complete' && (
              <div className="absolute bottom-6 left-6 right-6">
                 <button 
                    onClick={handleDownloadReport}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded border border-slate-700 transition-colors"
                 >
                    Download Audit Report (JSON)
                 </button>
              </div>
           )}
        </div>
      </main>
    </div>
  );
}