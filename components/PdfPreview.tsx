import React, { useEffect, useState } from 'react';

interface PdfPreviewProps {
  pdfFile: File;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ pdfFile }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(pdfFile);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pdfFile]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-800">
      {pdfUrl && <embed src={pdfUrl} type="application/pdf" className="w-full h-full" />}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-white/70 pointer-events-none">
          {pdfFile.name}
      </div>
    </div>
  );
};

export default PdfPreview;
