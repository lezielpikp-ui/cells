import React from 'react';
import { X, Download, Share2, Check } from 'lucide-react';

interface ARPhotoModalProps {
  photoDataUrl: string | null;
  onClose: () => void;
}

export const ARPhotoModal: React.FC<ARPhotoModalProps> = ({ photoDataUrl, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!photoDataUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `CellAR-Specimen-${Date.now()}.png`;
    link.href = photoDataUrl;
    link.click();
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">AR Specimen Snapshot</h3>
            <p className="text-xs text-slate-400">Captured with Augmented Reality CellAR</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snapshot Image Preview */}
        <div className="p-4 bg-slate-950 flex items-center justify-center">
          <img
            src={photoDataUrl}
            alt="AR Cell Snapshot"
            className="rounded-xl max-h-[60vh] object-contain border border-slate-800 shadow-lg"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
