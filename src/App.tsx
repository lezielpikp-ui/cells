/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CELL_ORGANELLES, Organelle } from './data/cellData';
import { CellARViewer } from './components/CellARViewer';
import { OrganelleCard } from './components/OrganelleCard';
import { RescueMissionGame } from './components/RescueMissionGame';
import { BuildCellGame } from './components/BuildCellGame';
import { QuizMode } from './components/QuizMode';
import { ReferenceTableModal } from './components/ReferenceTableModal';
import { ARPhotoModal } from './components/ARPhotoModal';
import { soundManager } from './utils/audio';
import { 
  Sparkles, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Flame, 
  Wrench, 
  HelpCircle, 
  Compass, 
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';

export default function App() {
  const [cellType, setCellType] = useState<'plant' | 'animal'>('plant');
  const [activeTab, setActiveTab] = useState<'explore' | 'rescue' | 'build' | 'quiz'>('explore');
  const [selectedOrganelle, setSelectedOrganelle] = useState<Organelle | null>(
    CELL_ORGANELLES.find((o) => o.id === 'nucleus') || null
  );
  const [highlightOrganelleId, setHighlightOrganelleId] = useState<string | null>(null);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState<boolean>(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const toggleSound = () => {
    const nextState = !isSoundMuted;
    setIsSoundMuted(nextState);
    soundManager.enabled = !nextState;
    soundManager.speechEnabled = !nextState;
  };

  const handleSelectOrganelle = (org: Organelle | null) => {
    setSelectedOrganelle(org);
    setHighlightOrganelleId(org ? org.id : null);
    if (org && cellType === 'animal' && org.plantsOnly) {
      // If user selected plant-only organelle while viewing animal cell, switch to plant cell
      setCellType('plant');
    }
  };

  const handleStartQuizWithOrganelle = (organelleId: string) => {
    setActiveTab('quiz');
    setHighlightOrganelleId(organelleId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Universal Top Bar Contract: 3 Zones */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-white flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-display">CellAR</span>
          <span className="text-slate-400 font-normal text-xs hidden sm:inline">
            · Augmented Reality Biology
          </span>
        </a>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'explore'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>AR Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('rescue')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'rescue'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Organelle Rescue</span>
          </button>

          <button
            onClick={() => setActiveTab('build')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'build'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Cell Architect</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Mastery Quiz</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          {/* Reference Matrix button */}
          <button
            onClick={() => setIsReferenceOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Open Cell Part & Function Reference Table"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Reference Matrix</span>
          </button>

          {/* Sound Toggle button */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
            title={isSoundMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Tabs Bar (visible on small screens) */}
      <div className="md:hidden flex items-center justify-around p-2 bg-slate-900 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('explore')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
            activeTab === 'explore' ? 'bg-cyan-600 text-white' : 'text-slate-400'
          }`}
        >
          Explorer
        </button>
        <button
          onClick={() => setActiveTab('rescue')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
            activeTab === 'rescue' ? 'bg-amber-600 text-white' : 'text-slate-400'
          }`}
        >
          Rescue
        </button>
        <button
          onClick={() => setActiveTab('build')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
            activeTab === 'build' ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          Architect
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
            activeTab === 'quiz' ? 'bg-purple-600 text-white' : 'text-slate-400'
          }`}
        >
          Quiz
        </button>
      </div>

      {/* Main Content Layout (Two-Zone Split Architecture) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Zone: 3D AR Interactive Viewport (7 Cols on desktop) */}
        <section className="lg:col-span-7 flex flex-col gap-3 min-h-[520px] lg:h-[calc(100vh-130px)] sticky top-20">
          <CellARViewer
            cellType={cellType}
            selectedOrganelle={selectedOrganelle}
            highlightOrganelleId={highlightOrganelleId}
            onSelectOrganelle={handleSelectOrganelle}
            onCaptureSnapshot={(url) => setSnapshotUrl(url)}
            enableCutaway={true}
          />
        </section>

        {/* Right Zone: Control Deck, Information & Games (5 Cols on desktop) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          {/* Mode 1: Explorer Mode */}
          {activeTab === 'explore' && (
            <div className="flex flex-col gap-4">
              {/* Cell Type Selector Bar */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Cell Specimen Architecture
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Switch between plant & animal biology
                  </div>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    onClick={() => {
                      setCellType('plant');
                      soundManager.playOrganelleTone(520);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      cellType === 'plant'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🌿 Plant Cell
                  </button>
                  <button
                    onClick={() => {
                      setCellType('animal');
                      soundManager.playOrganelleTone(440);
                      // If currently selected organelle is plants only, switch selection to nucleus
                      if (selectedOrganelle?.plantsOnly) {
                        setSelectedOrganelle(CELL_ORGANELLES[1]);
                      }
                    }}
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

              {/* Selected Organelle Deep-Dive Card */}
              {selectedOrganelle ? (
                <OrganelleCard
                  organelle={selectedOrganelle}
                  cellType={cellType}
                  onClose={() => {
                    setSelectedOrganelle(null);
                    setHighlightOrganelleId(null);
                  }}
                  onStartQuizWithOrganelle={handleStartQuizWithOrganelle}
                />
              ) : (
                <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
                  <Compass className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-200 mb-1">
                    Select an organelle from the 3D cell in AR or choose from below.
                  </p>
                  <p className="text-slate-400">
                    Click any tag or organelle model to dissect its biological structure and function.
                  </p>
                </div>
              )}

              {/* Quick Organelle Catalog */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Organelles in {cellType === 'plant' ? 'Plant Cell (7)' : 'Animal Cell (5)'}
                  </h4>
                  <button
                    onClick={() => setIsReferenceOpen(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    View Matrix →
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {CELL_ORGANELLES.map((org) => {
                    const isPlantOnly = org.plantsOnly;
                    const isDimmed = cellType === 'animal' && isPlantOnly;
                    const isSelected = selectedOrganelle?.id === org.id;

                    return (
                      <button
                        key={org.id}
                        onClick={() => handleSelectOrganelle(org)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 border-cyan-500 text-white shadow-md'
                            : isDimmed
                            ? 'bg-slate-950/40 border-slate-900 text-slate-600 hover:bg-slate-900/60'
                            : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: org.color }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate flex items-center gap-1.5">
                              <span>{org.name}</span>
                              {isPlantOnly && (
                                <span className="text-[10px] text-emerald-400 font-normal">
                                  · Plants only
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {org.function}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-xs text-cyan-400 font-semibold shrink-0">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Organelle Rescue Mission */}
          {activeTab === 'rescue' && (
            <RescueMissionGame
              onHighlightOrganelle={(id) => setHighlightOrganelleId(id)}
              onSelectOrganelleInScene={(org) => setSelectedOrganelle(org)}
              selectedOrganelle={selectedOrganelle}
              cellType={cellType}
              setCellType={setCellType}
            />
          )}

          {/* Mode 3: Cell Architect */}
          {activeTab === 'build' && (
            <BuildCellGame
              onHighlightOrganelle={(id) => setHighlightOrganelleId(id)}
              onSelectOrganelleInScene={(org) => setSelectedOrganelle(org)}
              cellType={cellType}
              setCellType={setCellType}
            />
          )}

          {/* Mode 4: Mastery Quiz */}
          {activeTab === 'quiz' && (
            <QuizMode
              onHighlightOrganelle={(id) => setHighlightOrganelleId(id)}
              onSelectOrganelleInScene={(org) => setSelectedOrganelle(org)}
            />
          )}
        </section>
      </main>

      {/* Reference Table Modal */}
      <ReferenceTableModal
        isOpen={isReferenceOpen}
        onClose={() => setIsReferenceOpen(false)}
        onSelectOrganelle={(org) => {
          setSelectedOrganelle(org);
          setHighlightOrganelleId(org.id);
          setActiveTab('explore');
        }}
      />

      {/* AR Snapshot View/Download Modal */}
      <ARPhotoModal
        photoDataUrl={snapshotUrl}
        onClose={() => setSnapshotUrl(null)}
      />
    </div>
  );
}
