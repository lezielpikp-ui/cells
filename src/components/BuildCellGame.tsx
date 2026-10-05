import React, { useState } from 'react';
import { CELL_ORGANELLES, Organelle } from '../data/cellData';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Sparkles, 
  HelpCircle,
  Plus,
  Trash2
} from 'lucide-react';

interface BuildCellGameProps {
  onHighlightOrganelle: (id: string | null) => void;
  onSelectOrganelleInScene: (organelle: Organelle) => void;
  cellType: 'plant' | 'animal';
  setCellType: (type: 'plant' | 'animal') => void;
}

export const BuildCellGame: React.FC<BuildCellGameProps> = ({
  onHighlightOrganelle,
  onSelectOrganelleInScene,
  cellType,
  setCellType,
}) => {
  const [placedOrganelleIds, setPlacedOrganelleIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  // Target organelles for current cell type:
  // Plant: all 7 organelles
  // Animal: 5 organelles (no Cell Wall, no Chloroplasts)
  const requiredOrganelles = CELL_ORGANELLES.filter((o) => {
    if (cellType === 'animal') {
      return !o.plantsOnly;
    }
    return true;
  });

  const handleCellTypeSwitch = (type: 'plant' | 'animal') => {
    setCellType(type);
    setPlacedOrganelleIds([]);
    setFeedback(null);
    setIsComplete(false);
    onHighlightOrganelle(null);
  };

  const handleAddOrganelle = (organelle: Organelle) => {
    // Check if organelle is already placed
    if (placedOrganelleIds.includes(organelle.id)) {
      setFeedback({
        message: `${organelle.name} is already integrated into the cellular blueprint!`,
        type: 'warning',
      });
      return;
    }

    // Check plant-only constraint
    if (cellType === 'animal' && organelle.plantsOnly) {
      soundManager.playError();
      setFeedback({
        message: `⚠️ Biological mismatch! ${organelle.name} is found in PLANTS ONLY and cannot exist in an animal cell!`,
        type: 'error',
      });
      return;
    }

    // Success placement
    soundManager.playSuccess();
    onSelectOrganelleInScene(organelle);
    onHighlightOrganelle(organelle.id);

    const nextPlaced = [...placedOrganelleIds, organelle.id];
    setPlacedOrganelleIds(nextPlaced);

    // Check completion
    if (nextPlaced.length === requiredOrganelles.length) {
      setIsComplete(true);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      setFeedback({
        message: `🎉 Master Architect! You have built a fully functional ${cellType === 'plant' ? 'Plant' : 'Animal'} Cell with all proper organelles!`,
        type: 'success',
      });
    } else {
      setFeedback({
        message: `Added ${organelle.name}: ${organelle.function}`,
        type: 'success',
      });
    }
  };

  const handleRemoveOrganelle = (id: string) => {
    setPlacedOrganelleIds((prev) => prev.filter((item) => item !== id));
    setIsComplete(false);
    setFeedback(null);
    onHighlightOrganelle(null);
  };

  const handleReset = () => {
    setPlacedOrganelleIds([]);
    setFeedback(null);
    setIsComplete(false);
    onHighlightOrganelle(null);
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-slate-100 flex flex-col gap-4">
      {/* Header & Cell Type Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Cell Architect Studio</h3>
          <p className="text-xs text-slate-400">
            Construct a viable cell by installing organelles according to biological rules.
          </p>
        </div>

        {/* Plant vs Animal Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => handleCellTypeSwitch('plant')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              cellType === 'plant'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌿 Plant Cell
          </button>
          <button
            onClick={() => handleCellTypeSwitch('animal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              cellType === 'animal'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔬 Animal Cell
          </button>
        </div>
      </div>

      {/* Progress & Target Stats */}
      <div className="flex items-center justify-between text-xs bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl">
        <span className="text-slate-300">
          Target Requirements:{' '}
          <strong className="text-cyan-400">
            {placedOrganelleIds.length} / {requiredOrganelles.length} Organelles
          </strong>
        </span>
        <button
          onClick={handleReset}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Board</span>
        </button>
      </div>

      {/* Feedback Alert Bar */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
            feedback.type === 'error'
              ? 'bg-red-950/50 border-red-500/50 text-red-200'
              : feedback.type === 'warning'
              ? 'bg-amber-950/50 border-amber-500/50 text-amber-200'
              : 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{feedback.message}</span>
        </div>
      )}

      {/* Available Organelles Pool */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Available Organelles Inventory:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CELL_ORGANELLES.map((org) => {
            const isPlaced = placedOrganelleIds.includes(org.id);
            return (
              <button
                key={org.id}
                onClick={() => handleAddOrganelle(org)}
                disabled={isPlaced}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2 cursor-pointer ${
                  isPlaced
                    ? 'bg-slate-950/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                    : 'bg-slate-800/80 hover:bg-slate-700/90 border-slate-700 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: org.color }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1 truncate">
                      <span>{org.name}</span>
                      {org.plantsOnly && (
                        <span className="text-[10px] text-emerald-400 font-normal">· Plants only</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {org.function}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 mt-0.5">
                  {isPlaced ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Plus className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Installed Organelles in the Cell */}
      {placedOrganelleIds.length > 0 && (
        <div className="pt-2 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Integrated in {cellType === 'plant' ? 'Plant' : 'Animal'} Cell:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {placedOrganelleIds.map((id) => {
              const org = CELL_ORGANELLES.find((o) => o.id === id);
              if (!org) return null;
              return (
                <div
                  key={id}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: org.color }} />
                  <span>{org.name}</span>
                  <button
                    onClick={() => handleRemoveOrganelle(id)}
                    className="text-slate-400 hover:text-red-400 transition-colors ml-1 cursor-pointer"
                    title={`Remove ${org.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
