import React, { useRef, useEffect } from 'react';

interface VideoSectionProps {
  videoFile: File | null;
  seekToTimestamp: string | null;
}

const VideoSection: React.FC<VideoSectionProps> = ({ videoFile, seekToTimestamp }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  useEffect(() => {
    if (seekToTimestamp && videoRef.current) {
        // Parse "MM:SS" to seconds
        const parts = seekToTimestamp.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0], 10);
            const seconds = parseInt(parts[1], 10);
            const timeInSeconds = minutes * 60 + seconds;
            videoRef.current.currentTime = timeInSeconds;
            videoRef.current.play();
        }
    }
  }, [seekToTimestamp]);

  if (!videoFile) {
    return (
        <div className="h-64 md:h-full w-full rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center text-slate-500">
            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p>Upload a video to begin analysis</p>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-800">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video 
            ref={videoRef}
            src={videoUrl || ""} 
            className="w-full h-full object-contain"
            controls
        />
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-white/70 pointer-events-none">
            {videoFile.name}
        </div>
    </div>
  );
};

export default VideoSection;