import React, { useState } from 'react';
import { DetectedPitch, GuitarTuning, NoteName } from '../types/guitar';
import { soundEngine } from '../utils/soundEngine';
import { X, Mic, MicOff, Volume2, Sparkles, Radio } from 'lucide-react';

interface TunerModalProps {
  isOpen: boolean;
  onClose: () => void;
  livePitch: DetectedPitch | null;
  isMicActive: boolean;
  onToggleMic: () => void;
  currentTuning: GuitarTuning;
}

export const TunerModal: React.FC<TunerModalProps> = ({
  isOpen,
  onClose,
  livePitch,
  isMicActive,
  onToggleMic,
  currentTuning,
}) => {
  const [selectedStringLock, setSelectedStringLock] = useState<number | null>(null);
  const [a4Calibration, setA4Calibration] = useState<number>(440);

  if (!isOpen) return null;

  // Compute needle angle: -50 cents = -45 deg, 0 = 0 deg, +50 cents = +45 deg
  const cents = livePitch ? Math.max(-50, Math.min(50, livePitch.cents)) : 0;
  const needleAngle = (cents / 50) * 45;
  const isInTune = livePitch && Math.abs(livePitch.cents) <= 4;

  const playReference = (stringNum: number) => {
    const stringConfig = currentTuning.strings.find((s) => s.stringNumber === stringNum);
    if (stringConfig) {
      soundEngine.playPluckedString(stringConfig.frequency, 3.5);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Strobe & Needle Chromatic Tuner</h2>
            <p className="text-xs text-slate-400">High-precision pitch detection calibrated to {a4Calibration} Hz</p>
          </div>
        </div>

        {/* Mic Activation Bar */}
        <div className="mb-6 flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2.5 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isMicActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {isMicActive ? 'Microphone Active & Listening' : 'Microphone Paused'}
            </span>
          </div>
          <button
            onClick={onToggleMic}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isMicActive
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            {isMicActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isMicActive ? 'Pause Mic' : 'Start Mic'}</span>
          </button>
        </div>

        {/* Needle & Strobe Display */}
        <div className="relative flex flex-col items-center justify-center py-6 px-4 rounded-2xl bg-slate-950 border border-slate-800/90 shadow-inner">
          {/* Circular dial meter */}
          <div className="relative w-64 h-36 overflow-hidden flex items-end justify-center">
            {/* Meter Arc marks */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-56 h-56 rounded-full border-4 border-dashed border-slate-800" />
            </div>

            {/* In-tune zone highlight */}
            <div
              className={`absolute bottom-0 w-24 h-24 rounded-full border-t-4 transition-colors duration-300 ${
                isInTune ? 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.5)]' : 'border-transparent'
              }`}
            />

            {/* Meter Needle */}
            <div
              className="absolute bottom-2 w-1.5 h-28 origin-bottom transition-transform duration-100 ease-out shadow-lg"
              style={{
                transform: `rotate(${needleAngle}deg)`,
                backgroundColor: isInTune ? '#34d399' : cents < 0 ? '#38bdf8' : '#fb923c',
              }}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full -top-1 -left-1 absolute ${
                  isInTune ? 'bg-emerald-300 shadow-[0_0_12px_#34d399]' : 'bg-slate-200'
                }`}
              />
            </div>

            {/* Needle Pivot */}
            <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 z-10" />
          </div>

          {/* Scale Labels: -50, 0, +50 cents */}
          <div className="w-64 flex justify-between text-[11px] font-mono text-slate-500 mt-2 px-4">
            <span className="text-cyan-400 font-bold">-50¢ Flat</span>
            <span className={`font-bold ${isInTune ? 'text-emerald-400' : 'text-slate-400'}`}>0¢ Perfect</span>
            <span className="text-amber-400 font-bold">+50¢ Sharp</span>
          </div>

          {/* Large Note Indicator */}
          <div className="mt-4 text-center">
            {livePitch ? (
              <div>
                <div
                  className={`text-6xl font-black font-mono transition-all duration-200 ${
                    isInTune
                      ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.6)] scale-105'
                      : 'text-white'
                  }`}
                >
                  {livePitch.note}
                  <span className="text-2xl text-slate-400 font-sans ml-1">{livePitch.octave}</span>
                </div>
                <div className="flex items-center justify-center gap-3 mt-1 font-mono text-xs">
                  <span className="text-slate-400">{livePitch.frequency} Hz</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                      isInTune
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : cents < 0
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {cents > 0 ? `+${cents}` : cents} cents
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-slate-500 font-mono text-sm">
                Pluck a string to tune...
              </div>
            )}
          </div>
        </div>

        {/* String Target Buttons for Current Tuning */}
        <div className="mt-6">
          <div className="text-xs text-slate-400 font-semibold mb-2 flex items-center justify-between">
            <span>Current Tuning: {currentTuning.name}</span>
            <span className="text-[11px] text-slate-500">Tap string to play reference pitch</span>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {currentTuning.strings.map((str) => {
              const isTargetMatch = livePitch && livePitch.note === str.note;
              return (
                <button
                  key={str.stringNumber}
                  onClick={() => playReference(str.stringNumber)}
                  className={`py-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer group ${
                    isTargetMatch
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-md'
                      : 'bg-slate-950/70 border-slate-800 hover:border-amber-500/50 text-slate-300'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 font-mono mb-0.5">
                    {str.stringNumber} ({str.note})
                  </span>
                  <span className="text-base font-extrabold font-mono text-white group-hover:text-amber-300">
                    {str.note}{str.octave}
                  </span>
                  <Volume2 className="w-3 h-3 text-slate-500 group-hover:text-amber-400 mt-1 opacity-60 group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Calibration Setting */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Pitch Standard: A4 = {a4Calibration} Hz</span>
          <div className="flex gap-2">
            {[432, 440, 442].map((hz) => (
              <button
                key={hz}
                onClick={() => setA4Calibration(hz)}
                className={`px-2 py-0.5 rounded font-mono ${
                  a4Calibration === hz ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:text-white'
                }`}
              >
                {hz}Hz
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
