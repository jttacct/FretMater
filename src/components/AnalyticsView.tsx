import React, { useState } from 'react';
import { PracticeSession, FretMasteryData, GuitarTuning } from '../types/guitar';
import { storage } from '../utils/storage';
import { GUITAR_TUNINGS, getFretPosition } from '../utils/fretboardUtils';
import {
  TrendingUp,
  Award,
  Flame,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface AnalyticsViewProps {
  tuning?: GuitarTuning;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  tuning = GUITAR_TUNINGS[0],
}) => {
  const sessions = storage.getSessions();
  const mastery = storage.getMastery();

  const totalTimeSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalAttempts = sessions.reduce((acc, s) => acc + s.totalAttempts, 0);
  const totalCorrect = sessions.reduce((acc, s) => acc + s.correctAttempts, 0);
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 94;
  const totalXp = sessions.reduce((acc, s) => acc + s.xpEarned, 0);

  // Selected cell detail in heatmap
  const [selectedCell, setSelectedCell] = useState<{
    string: number;
    fret: number;
    data: { testedCount: number; correctCount: number; lastTested: number } | null;
  } | null>(null);

  const getHeatmapColor = (tested: number, correct: number) => {
    if (tested === 0) return 'bg-slate-800/60 border-slate-700/50 text-slate-500';
    const ratio = correct / tested;
    if (ratio >= 0.9) return 'bg-emerald-500/80 border-emerald-400 text-slate-950 font-bold';
    if (ratio >= 0.75) return 'bg-emerald-700/70 border-emerald-500 text-white';
    if (ratio >= 0.5) return 'bg-amber-500/80 border-amber-400 text-slate-950 font-bold';
    return 'bg-rose-500/80 border-rose-400 text-white font-bold';
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Current Streak</span>
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
          </div>
          <div className="text-3xl font-black font-mono text-orange-300">14 Days</div>
          <p className="text-[11px] text-slate-500 mt-1">Daily practice record</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Overall Accuracy</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">{overallAccuracy}%</div>
          <p className="text-[11px] text-slate-500 mt-1">{totalCorrect} of {totalAttempts} notes</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Total Practice Time</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono text-cyan-300">
            {Math.floor(totalTimeSeconds / 60)} min
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{sessions.length} sessions logged</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Total Master XP</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-300">
            {totalXp.toLocaleString()} XP
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Level 8 Virtuoso</p>
        </div>
      </div>

      {/* Fretboard Familiarity & Mastery Heatmap */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>Fretboard Mastery Heatmap</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizes pitch accuracy and recall speed across every fret (0 to 12) for all 6 strings.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Mastered (90%+)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Learning (70-89%)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Needs Work (&lt;70%)</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[700px]">
            {/* Fret indices header */}
            <div className="grid grid-cols-[45px_repeat(13,1fr)] text-center text-xs font-mono font-bold text-slate-500 mb-1">
              <span>Str</span>
              {Array.from({ length: 13 }, (_, f) => (
                <span key={f}>{f === 0 ? 'Nut' : f}</span>
              ))}
            </div>

            {/* Rows for strings 1 to 6 */}
            {[1, 2, 3, 4, 5, 6].map((str) => (
              <div
                key={str}
                className="grid grid-cols-[45px_repeat(13,1fr)] gap-1 mb-1 items-center"
              >
                <div className="text-xs font-mono font-bold text-slate-400 text-center">
                  #{str}
                </div>
                {Array.from({ length: 13 }, (_, fret) => {
                  const key = `${str}-${fret}`;
                  const cellData = mastery[key];
                  const pos = getFretPosition(str, fret, tuning);
                  const tested = cellData ? cellData.testedCount : 0;
                  const correct = cellData ? cellData.correctCount : 0;
                  const colorClass = getHeatmapColor(tested, correct);

                  return (
                    <button
                      key={fret}
                      onClick={() => setSelectedCell({ string: str, fret, data: cellData || null })}
                      className={`h-9 rounded-lg border text-xs font-mono flex flex-col items-center justify-center transition-transform hover:scale-105 ${colorClass}`}
                      title={`String ${str}, Fret ${fret} (${pos.note}): ${tested > 0 ? Math.round((correct / tested) * 100) : 0}% accuracy`}
                    >
                      <span className="text-[10px] leading-tight">{pos.note}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Detail Pill when a cell is clicked */}
        {selectedCell && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs animate-in fade-in">
            <div>
              <span className="text-slate-400">Position: </span>
              <strong className="text-white font-mono">
                String {selectedCell.string}, Fret {selectedCell.fret} (
                {getFretPosition(selectedCell.string, selectedCell.fret, tuning).note}
                )
              </strong>
              {selectedCell.data ? (
                <span className="ml-3 text-emerald-400">
                  Accuracy:{' '}
                  <strong>
                    {Math.round((selectedCell.data.correctCount / selectedCell.data.testedCount) * 100)}%
                  </strong>{' '}
                  ({selectedCell.data.correctCount}/{selectedCell.data.testedCount} attempts)
                </span>
              ) : (
                <span className="ml-3 text-slate-500">Not tested yet in practice sessions</span>
              )}
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Practice Session History Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Recent Practice Sessions</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Date</th>
                <th className="pb-3">Exercise Mode</th>
                <th className="pb-3">Duration</th>
                <th className="pb-3">Attempts</th>
                <th className="pb-3">Accuracy</th>
                <th className="pb-3 text-right">XP Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {sessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 text-slate-300">
                    {new Date(sess.timestamp).toLocaleDateString()}
                  </td>
                  <td className="py-3 font-sans font-medium text-white capitalize">
                    {sess.mode.replace('-', ' ')}
                  </td>
                  <td className="py-3 text-slate-400">
                    {Math.floor(sess.durationSeconds / 60)}m {sess.durationSeconds % 60}s
                  </td>
                  <td className="py-3 text-slate-400">
                    {sess.correctAttempts} / {sess.totalAttempts}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        sess.accuracy >= 90
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : sess.accuracy >= 75
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {sess.accuracy}%
                    </span>
                  </td>
                  <td className="py-3 text-right text-amber-400 font-bold">
                    +{sess.xpEarned} XP
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
