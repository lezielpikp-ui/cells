import React, { useState, useEffect } from 'react';
import { CELL_ORGANELLES, Organelle, RESCUE_SCENARIOS, RescueScenario } from '../data/cellData';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Zap, 
  Flame, 
  Award, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Sparkles,
  Trophy,
  Heart
} from 'lucide-react';

interface RescueMissionGameProps {
  onHighlightOrganelle: (id: string | null) => void;
  onSelectOrganelleInScene: (organelle: Organelle) => void;
  selectedOrganelle: Organelle | null;
  cellType: 'plant' | 'animal';
  setCellType: (type: 'plant' | 'animal') => void;
}

export const RescueMissionGame: React.FC<RescueMissionGameProps> = ({
  onHighlightOrganelle,
  onSelectOrganelleInScene,
  selectedOrganelle,
  cellType,
  setCellType,
}) => {
  const [scenarioIndex, setScenarioIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [health, setHealth] = useState<number>(100);
  const [timeLeft, setTimeLeft] = useState<number>(25);
  const [gameState, setGameState] = useState<'playing' | 'round_result' | 'game_over' | 'victory'>('playing');
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  const currentScenario: RescueScenario = RESCUE_SCENARIOS[scenarioIndex];
  const targetOrganelle = CELL_ORGANELLES.find((o) => o.id === currentScenario?.targetOrganelleId);

  // Automatically switch cell type to plant if scenario targets plant-only organelle
  useEffect(() => {
    if (currentScenario?.cellTypeNeeded === 'plant' && cellType !== 'plant') {
      setCellType('plant');
    }
  }, [currentScenario, cellType, setCellType]);

  // Countdown timer for each scenario round
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, scenarioIndex]);

  // Listen to 3D AR viewer selection
  useEffect(() => {
    if (gameState === 'playing' && selectedOrganelle) {
      checkSelection(selectedOrganelle.id);
    }
  }, [selectedOrganelle, gameState]);

  const handleTimeout = () => {
    soundManager.playError();
    setStreak(0);
    setHealth((h) => Math.max(0, h - 25));
    setLastAnswerCorrect(false);
    onHighlightOrganelle(currentScenario.targetOrganelleId);
    setGameState('round_result');
  };

  const checkSelection = (chosenId: string) => {
    const isCorrect = chosenId === currentScenario.targetOrganelleId;

    if (isCorrect) {
      soundManager.playSuccess();
      const points = 100 + streak * 25 + timeLeft * 5;
      setScore((s) => s + points);
      setStreak((st) => st + 1);
      setLastAnswerCorrect(true);
      onHighlightOrganelle(chosenId);
      setGameState('round_result');
    } else {
      soundManager.playError();
      setStreak(0);
      setHealth((h) => {
        const next = Math.max(0, h - 20);
        if (next === 0) {
          setTimeout(() => setGameState('game_over'), 800);
        }
        return next;
      });
      setLastAnswerCorrect(false);
      onHighlightOrganelle(currentScenario.targetOrganelleId);
      setGameState('round_result');
    }
  };

  const handleNextScenario = () => {
    onHighlightOrganelle(null);
    if (scenarioIndex + 1 < RESCUE_SCENARIOS.length && health > 0) {
      setScenarioIndex((i) => i + 1);
      setTimeLeft(25);
      setGameState('playing');
      setLastAnswerCorrect(null);
    } else {
      if (health > 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        setGameState('victory');
      } else {
        setGameState('game_over');
      }
    }
  };

  const handleRestart = () => {
    setScenarioIndex(0);
    setScore(0);
    setStreak(0);
    setHealth(100);
    setTimeLeft(25);
    setGameState('playing');
    setLastAnswerCorrect(null);
    onHighlightOrganelle(null);
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-slate-100 flex flex-col gap-4">
      {/* Top HUD: Score, Streak, Timer, Health */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">MISSION SCORE</div>
            <div className="text-xl font-bold font-mono text-cyan-400 tabular-nums">{score}</div>
          </div>
          {streak > 1 && (
            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-950/40 border border-amber-500/30 px-2 py-1 rounded-md">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{streak}x Combo</span>
            </div>
          )}
        </div>

        {/* Cell Health & Round Timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Heart
              className={`w-4 h-4 ${
                health > 50 ? 'text-rose-500 fill-rose-500' : 'text-rose-400 fill-rose-400 animate-pulse'
              }`}
            />
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  health > 50 ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${health}%` }}
              />
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-300">{health}%</span>
          </div>

          <div
            className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border tabular-nums ${
              timeLeft <= 5
                ? 'bg-red-950/80 text-red-300 border-red-500 animate-bounce'
                : 'bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            ⏱️ {timeLeft}s
          </div>
        </div>
      </div>

      {/* Main Game State Views */}
      {gameState === 'playing' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Mission {scenarioIndex + 1} of {RESCUE_SCENARIOS.length}
            </span>
            <span className="text-cyan-400 font-medium">
              Tap the 3D organelle in AR or select below
            </span>
          </div>

          {/* Emergency Alert Banner */}
          <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-slate-200">
            <div className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-wide mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>{currentScenario.title}</span>
            </div>
            <p className="text-xs text-slate-300 mb-2">{currentScenario.emergency}</p>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-semibold text-cyan-300">
              🎯 Clue: {currentScenario.clue}
            </div>
          </div>

          {/* Organelle Selection Grid (Accessible alternative to 3D clicking) */}
          <div>
            <div className="text-[11px] text-slate-400 font-medium mb-1.5 uppercase tracking-wider">
              Diagnose & Deploy Organelle:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CELL_ORGANELLES.map((org) => {
                const isPlantOnly = org.plantsOnly;
                return (
                  <button
                    key={org.id}
                    onClick={() => {
                      onSelectOrganelleInScene(org);
                      checkSelection(org.id);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-left transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-2 group"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                      style={{ backgroundColor: org.color }}
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-100 truncate">
                        {org.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {isPlantOnly ? '🌿 Plants only' : 'Dual cell'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Round Result View */}
      {gameState === 'round_result' && (
        <div className="flex flex-col gap-3 py-2 animate-in fade-in duration-200">
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              lastAnswerCorrect
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/40 border-red-500/40 text-red-200'
            }`}
          >
            {lastAnswerCorrect ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-bold mb-1">
                {lastAnswerCorrect ? 'Target Identified & Cell Stabilized!' : 'Critical Diagnostic Error!'}
              </h4>
              <p className="text-xs text-slate-300 mb-2">
                The required organelle was{' '}
                <strong className="text-white">{targetOrganelle?.name}</strong>.
              </p>
              <div className="text-xs p-2 rounded bg-slate-950/60 border border-slate-800 text-cyan-200">
                <strong>Function:</strong> {targetOrganelle?.function}
              </div>
            </div>
          </div>

          <button
            onClick={handleNextScenario}
            className="w-full py-2.5 rounded-xl font-semibold text-xs bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
          >
            <span>Proceed to Next Mission</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Victory View */}
      {gameState === 'victory' && (
        <div className="flex flex-col items-center text-center gap-3 py-4 animate-in zoom-in-95 duration-300">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Mission Accomplished!</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-sm">
              All cellular crises resolved! You demonstrated full command over the cell organelles and their biological functions.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 w-full max-w-xs flex justify-around text-center">
            <div>
              <div className="text-[10px] text-slate-400 font-medium">FINAL SCORE</div>
              <div className="text-lg font-bold font-mono text-cyan-400">{score}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">CELL HEALTH</div>
              <div className="text-lg font-bold font-mono text-emerald-400">{health}%</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">RANK</div>
              <div className="text-lg font-bold text-amber-400">Bio-Chief</div>
            </div>
          </div>
          <button
            onClick={handleRestart}
            className="mt-2 px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        </div>
      )}

      {/* Game Over View */}
      {gameState === 'game_over' && (
        <div className="flex flex-col items-center text-center gap-3 py-4 animate-in zoom-in-95 duration-300">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400">
            <XCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Cellular Collapse!</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-sm">
              The cell suffered critical functional collapse. Review the organelle functions and restore balance!
            </p>
          </div>
          <button
            onClick={handleRestart}
            className="mt-2 px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Mission Again</span>
          </button>
        </div>
      )}
    </div>
  );
};
