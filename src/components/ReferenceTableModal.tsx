import React from 'react';
import { CELL_ORGANELLES, Organelle } from '../data/cellData';
import { X, Volume2, Sparkles, BookOpen } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface ReferenceTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrganelle: (org: Organelle) => void;
}

export const ReferenceTableModal: React.FC<ReferenceTableModalProps> = ({
  isOpen,
  onClose,
  onSelectOrganelle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Cell Biology Reference Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Official organelle functions & plant/animal classification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-2">Cell Part</th>
                <th className="pb-3 px-3">Function</th>
                <th className="pb-3 px-2 text-center">Type</th>
                <th className="pb-3 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {CELL_ORGANELLES.map((org) => {
                const isPlantsOnly = org.plantsOnly;
                return (
                  <tr key={org.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 pl-2 font-semibold text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: org.color }}
                        />
                        <span>{org.name}</span>
                        {isPlantsOnly && (
                          <span className="text-emerald-400 text-[10px] font-bold">
                            ✅ plants only
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300 leading-relaxed">
                      {org.function}
                    </td>
                    <td className="py-3.5 px-2 text-center whitespace-nowrap">
                      {isPlantsOnly ? (
                        <span className="text-[11px] font-semibold text-emerald-400">
                          Plant Only
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Both Plant & Animal
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => soundManager.speak(`${org.name}: ${org.function}`)}
                          className="p-1 rounded text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                          title="Pronounce function"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            onSelectOrganelle(org);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-600/80 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
                        >
                          Inspect 3D
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 px-4">
          <span>Remember: Cell Wall & Chloroplasts are found in <strong>plants only</strong>.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white font-medium cursor-pointer"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
