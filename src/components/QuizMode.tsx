import React, { useState } from 'react';
import { QUIZ_QUESTIONS, CELL_ORGANELLES, Organelle } from '../data/cellData';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Award,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface QuizModeProps {
  onHighlightOrganelle: (id: string | null) => void;
  onSelectOrganelleInScene: (organelle: Organelle) => void;
}

export const QuizMode: React.FC<QuizModeProps> = ({
  onHighlightOrganelle,
  onSelectOrganelleInScene,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const question = QUIZ_QUESTIONS[currentIdx];

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option === question.correctAnswer;
    if (isCorrect) {
      soundManager.playSuccess();
      setScore((s) => s + 1);
    } else {
      soundManager.playError();
    }

    // Highlight target organelle in 3D scene
    onHighlightOrganelle(question.targetOrganelleId);
    const org = CELL_ORGANELLES.find((o) => o.id === question.targetOrganelleId);
    if (org) {
      onSelectOrganelleInScene(org);
    }
  };

  const handleNext = () => {
    onHighlightOrganelle(null);
    if (currentIdx + 1 < QUIZ_QUESTIONS.length) {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsCompleted(false);
    onHighlightOrganelle(null);
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-slate-100 flex flex-col gap-4">
      {/* Quiz Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Cell Function Mastery Quiz</h3>
          <p className="text-xs text-slate-400">
            Test your understanding of the 7 core organelle functions.
          </p>
        </div>
        {!isCompleted && (
          <div className="text-xs font-mono font-bold text-cyan-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 tabular-nums">
            Q {currentIdx + 1} / {QUIZ_QUESTIONS.length}
          </div>
        )}
      </div>

      {!isCompleted ? (
        <div className="flex flex-col gap-4">
          {/* Question Text */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white leading-relaxed">
              {question.question}
            </h4>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2">
            {question.options.map((opt, i) => {
              const isSelected = selectedOption === opt;
              const isCorrect = opt === question.correctAnswer;

              let optionStyle = 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200';
              if (isAnswered) {
                if (isCorrect) {
                  optionStyle = 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200 font-semibold';
                } else if (isSelected && !isCorrect) {
                  optionStyle = 'bg-red-950/60 border-red-500/70 text-red-200';
                } else {
                  optionStyle = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelectOption(opt)}
                  disabled={isAnswered}
                  className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
                >
                  <span>{opt}</span>
                  {isAnswered && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {isAnswered && (
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-xs flex flex-col gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <HelpCircle className="w-4 h-4" />
                <span>Biological Explanation</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{question.explanation}</p>
              <button
                onClick={handleNext}
                className="mt-1 w-full py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{currentIdx + 1 === QUIZ_QUESTIONS.length ? 'View Results' : 'Next Question'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="flex flex-col items-center text-center gap-3 py-4 animate-in zoom-in-95 duration-300">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/10">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Quiz Complete!</h3>
            <p className="text-xs text-slate-300 mt-1">
              You scored <strong className="text-cyan-400">{score}</strong> out of{' '}
              <strong className="text-cyan-400">{QUIZ_QUESTIONS.length}</strong>!
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 w-full max-w-xs text-xs text-slate-300">
            {score === 7 ? (
              <span className="text-emerald-400 font-bold">
                🌟 Perfect Score! You are a certified Cellular Biologist!
              </span>
            ) : score >= 5 ? (
              <span className="text-cyan-300 font-semibold">
                👏 Great effort! You have a solid grasp of organelle functions.
              </span>
            ) : (
              <span className="text-amber-300">
                📚 Keep exploring in AR to reinforce what each organelle does!
              </span>
            )}
          </div>
          <button
            onClick={handleRestart}
            className="mt-2 px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Quiz</span>
          </button>
        </div>
      )}
    </div>
  );
};
