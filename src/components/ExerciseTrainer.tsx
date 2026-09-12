import React, { useState, useEffect, useRef } from 'react';
import {
  ExerciseMode,
  NoteName,
  DetectedPitch,
  GuitarTuning,
  PracticeSession,
} from '../types/guitar';
import { NOTE_NAMES, GUITAR_TUNINGS, getFretPosition } from '../utils/fretboardUtils';
import { soundEngine } from '../utils/soundEngine';
import { storage } from '../utils/storage';
import confetti from 'canvas-confetti';
import {
  Award,
  Flame,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  Mic,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface ExerciseTrainerProps {
  livePitch: DetectedPitch | null;
  isMicActive: boolean;
  onToggleMic: () => void;
  tuning: GuitarTuning;
  onSessionComplete?: () => void;
}

export const ExerciseTrainer: React.FC<ExerciseTrainerProps> = ({
  livePitch,
  isMicActive,
  onToggleMic,
  tuning,
  onSessionComplete,
}) => {
  const [mode, setMode] = useState<ExerciseMode>('note-finder');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [correctAttempts, setCorrectAttempts] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Current challenge state
  const [targetNote, setTargetNote] = useState<NoteName>('A');
  const [targetString, setTargetString] = useState<number>(1);
  const [targetFret, setTargetFret] = useState<number>(5);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  // Audio pitch verification lock to prevent double triggers
  const lastProcessedPitchRef = useRef<number>(0);

  // Timer loop
  useEffect(() => {
    let timer: number | null = null;
    if (isActive) {
      timer = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive]);

  // Generate a new challenge based on selected mode
  const generateNewChallenge = () => {
    const randomNote = NOTE_NAMES[Math.floor(Math.random() * NOTE_NAMES.length)];
    const randomString = Math.floor(Math.random() * 6) + 1;
    const randomFret = Math.floor(Math.random() * 12) + 1;

    setTargetNote(randomNote);
    setTargetString(randomString);
    setTargetFret(randomFret);
    setFeedback(null);

    // If ear training, play the target note automatically
    if (mode === 'ear-training') {
      const pos = getFretPosition(randomString, randomFret, tuning);
      setTimeout(() => {
        soundEngine.playPluckedString(pos.frequency, 3.0);
      }, 300);
    }
  };

  // Start exercise session
  const startSession = () => {
    setIsActive(true);
    setScore(0);
    setStreak(0);
    setTotalAttempts(0);
    setCorrectAttempts(0);
    setElapsedSeconds(0);
    setStartTime(Date.now());
    generateNewChallenge();
  };

  // Finish and save session
  const stopSession = () => {
    if (totalAttempts > 0) {
      const accuracy = Math.round((correctAttempts / totalAttempts) * 100);
      const session: PracticeSession = {
        id: `sess-${Date.now()}`,
        timestamp: Date.now(),
        mode,
        durationSeconds: elapsedSeconds,
        totalAttempts,
        correctAttempts,
        accuracy,
        xpEarned: score,
      };
      storage.saveSession(session);
      if (onSessionComplete) onSessionComplete();

      if (accuracy >= 80) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
    setIsActive(false);
  };

  // Evaluate an answer (either from fret click or detected live microphone audio!)
  const handleAnswer = (answeredNote: NoteName, fromString?: number, fromFret?: number) => {
    if (!isActive) return;

    let isCorrect = false;

    if (mode === 'note-finder' || mode === 'ear-training') {
      isCorrect = answeredNote === targetNote;
    } else if (mode === 'speed-quiz') {
      const actualPos = getFretPosition(targetString, targetFret, tuning);
      isCorrect = answeredNote === actualPos.note;
    } else if (mode === 'scale-runner') {
      isCorrect = answeredNote === targetNote;
    }

    setTotalAttempts((prev) => prev + 1);

    if (fromString !== undefined && fromFret !== undefined) {
      storage.recordFretAttempt(fromString, fromFret, isCorrect);
    }

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      const points = 10 + newStreak * 2;
      setScore((prev) => prev + points);
      setCorrectAttempts((prev) => prev + 1);
      setFeedback({ isCorrect: true, message: `Perfect! +${points} XP` });
      soundEngine.playClick(true);

      // Trigger mini confetti on high streaks
      if (newStreak % 5 === 0) {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      }

      setTimeout(() => {
        generateNewChallenge();
      }, 700);
    } else {
      setStreak(0);
      setFeedback({
        isCorrect: false,
        message: `Oops! Target was ${targetNote}, you hit ${answeredNote}`,
      });
    }
  };

  // Listen to live microphone pitch detection input when active!
  useEffect(() => {
    if (!isActive || !livePitch) return;

    // Throttle to avoid repeated triggers within 600ms
    const now = Date.now();
    if (now - lastProcessedPitchRef.current < 650) return;

    // Check if live pitch volume/clarity is sufficient
    if (livePitch.clarity > 0.75 && livePitch.volume > 0.08) {
      lastProcessedPitchRef.current = now;
      handleAnswer(livePitch.note);
    }
  }, [livePitch, isActive]);

  const currentPos = getFretPosition(targetString, targetFret, tuning);
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl">
      {/* Header & Modes */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white">Audio Pitch Trainer</h2>
              <p className="text-xs text-slate-400">
                Interactive real-time fretboard drills powered by live guitar audio pitch detection.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'note-finder', label: 'Note Finder' },
            { id: 'speed-quiz', label: 'Speed Quiz' },
            { id: 'ear-training', label: 'Ear Training' },
            { id: 'scale-runner', label: 'Scale Runner' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id as ExerciseMode);
                if (isActive) stopSession();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === m.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Mic Listening Status Pill */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMic}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isMicActive
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isMicActive ? 'Listening to Guitar (Mic On)' : 'Enable Guitar Mic Input'}</span>
          </button>
          <span className="text-xs text-slate-400 hidden sm:inline">
            {isMicActive
              ? 'Pluck the target note on your physical guitar — detection is live!'
              : 'You can also answer by clicking on-screen note buttons below.'}
          </span>
        </div>

        {livePitch && (
          <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Heard: </span>
            <span className="font-bold text-white text-sm">{livePitch.note}{livePitch.octave}</span>
          </div>
        )}
      </div>

      {/* Main Game Stage */}
      {!isActive ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mb-4 shadow-xl text-amber-400">
            🎸
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Ready to Test Your Fretboard Skills?</h3>
          <p className="text-slate-400 text-sm max-w-md mb-6">
            {mode === 'note-finder' && 'Locate target notes anywhere on the neck. Play them on your real guitar or tap note buttons.'}
            {mode === 'speed-quiz' && 'Rapid flashcards: determine which note lives at the indicated string and fret.'}
            {mode === 'ear-training' && 'Listen to the plucked acoustic reference note, identify the pitch by ear, and hit the target!'}
            {mode === 'scale-runner' && 'Practice fluid scale progressions across the fretboard with rhythm feedback.'}
          </p>
          <button
            onClick={startSession}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 transition-all transform hover:scale-105 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Start Practice Round</span>
          </button>
        </div>
      ) : (
        <div className="mt-6">
          {/* Active HUD: Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">XP Points</span>
              <span className="text-xl font-extrabold text-amber-400 font-mono">{score}</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Streak</span>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                <span className="text-xl font-extrabold text-orange-300 font-mono">{streak}</span>
              </div>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Accuracy</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">{accuracy}%</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Time Elapsed</span>
              <span className="text-xl font-extrabold text-cyan-400 font-mono">
                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Current Target Question Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-700/80 p-6 md:p-8 text-center shadow-xl">
            <div className="text-xs uppercase tracking-wider text-amber-400/90 font-bold mb-2">
              {mode === 'speed-quiz' ? 'Identify Note at Fret' : 'Target Note'}
            </div>

            {mode === 'speed-quiz' ? (
              <div className="my-4">
                <div className="text-4xl md:text-5xl font-black font-mono text-white mb-2">
                  String {targetString}, Fret {targetFret}
                </div>
                <p className="text-xs text-slate-400">
                  (String {targetString} open is {tuning.strings.find((s) => s.stringNumber === targetString)?.note})
                </p>
              </div>
            ) : mode === 'ear-training' ? (
              <div className="my-4">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <button
                    onClick={() => {
                      const pos = getFretPosition(targetString, targetFret, tuning);
                      soundEngine.playPluckedString(pos.frequency, 3.0);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-sm font-semibold transition-all"
                  >
                    <Volume2 className="w-5 h-5 text-amber-400 animate-pulse" />
                    <span>Replay Audio Mystery Pitch</span>
                  </button>
                </div>
                <div className="text-3xl font-extrabold text-slate-200">
                  Guess the Plucked Note!
                </div>
              </div>
            ) : (
              <div className="my-4">
                <div className="text-6xl md:text-7xl font-black font-mono text-amber-300 drop-shadow-md">
                  {targetNote}
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Pluck any <span className="font-bold text-white">{targetNote}</span> on your guitar, or click below!
                </p>
              </div>
            )}

            {/* Instant Feedback Pill */}
            {feedback && (
              <div
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mt-2 animate-in fade-in zoom-in-95 ${
                  feedback.isCorrect
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                }`}
              >
                {feedback.isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Interactive Note Choice Grid (On-screen fallback / speed tap) */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-3 font-medium">
                Tap Note To Answer (or play on physical guitar):
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2 max-w-2xl mx-auto">
                {NOTE_NAMES.map((note) => (
                  <button
                    key={note}
                    onClick={() => handleAnswer(note)}
                    className="py-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 border border-slate-700/80 hover:border-amber-400 text-sm font-bold font-mono text-slate-200 transition-all transform active:scale-95 shadow-sm"
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>

            {/* Session Controls */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={generateNewChallenge}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Skip Question</span>
              </button>
              <button
                onClick={stopSession}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Finish Practice Round</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
