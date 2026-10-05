import React from 'react';
import { Organelle } from '../data/cellData';
import { soundManager } from '../utils/audio';
import { 
  Volume2, 
  X, 
  Sparkles, 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface OrganelleCardProps {
  organelle: Organelle;
  cellType: 'plant' | 'animal';
  onClose: () => void;
  onStartQuizWithOrganelle?: (organelleId: string) => void;
}

export const OrganelleCard: React.FC<OrganelleCardProps> = ({
  organelle,
  cellType,
  onClose,
  onStartQuizWithOrganelle,
}) => {
  const handleSpeak = () => {
    soundManager.speak(`${organelle.name}. ${organelle.function}`);
  };

  const isPlantsOnly = organelle.plantsOnly;
  const isPresentInCurrentCell = !(cellType === 'animal' && isPlantsOnly);

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
            style={{ backgroundColor: `${organelle.color}25`, border: `1.5px solid ${organelle.color}` }}
          >
            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: organelle.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">{organelle.name}</h3>
              <button
                onClick={handleSpeak}
                className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Listen to organelle name and function"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 font-medium">{organelle.tagline}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Reference Function Box */}
      <div className="bg-slate-950/70 border border-cyan-500/30 rounded-xl p-3.5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
          <span>Primary Function</span>
          {isPlantsOnly ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              ✅ Plants Only
            </span>
          ) : (
            <span className="text-slate-400 font-normal">
              Found in Plant & Animal Cells
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-white leading-relaxed">
          {organelle.function}
        </p>
      </div>

      {/* Alert if viewing in Animal cell but organelle is plants only */}
      {!isPresentInCurrentCell && (
        <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-600/50 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Note: <strong>{organelle.name}</strong> is present in plant cells only, and does not exist in animal cells!
          </span>
        </div>
      )}

      {/* Description Prose */}
      <p className="text-xs text-slate-300 leading-relaxed">
        {organelle.description}
      </p>

      {/* Real-World Analogy */}
      <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 flex items-start gap-2.5">
        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-semibold text-slate-200">Real-World Analogy: </span>
          <span className="text-xs text-slate-300">{organelle.realWorldAnalogy}</span>
        </div>
      </div>

      {/* Key Scientific Facts */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Key Biological Insights
        </h4>
        <ul className="space-y-1.5">
          {organelle.keyFacts.map((fact, idx) => (
            <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Footer */}
      {onStartQuizWithOrganelle && (
        <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={() => onStartQuizWithOrganelle(organelle.id)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Practice with this Organelle</span>
          </button>
        </div>
      )}
    </div>
  );
};
