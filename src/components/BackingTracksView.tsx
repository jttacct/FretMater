import React, { useState, useEffect } from 'react';
import { BackingTrack, NoteName, ScaleDefinition } from '../types/guitar';
import { BACKING_TRACKS } from '../data/backingTracks';
import { soundEngine } from '../utils/soundEngine';
import { SCALES } from '../utils/fretboardUtils';
import {
  Play,
  Pause,
  Sliders,
  RotateCcw,
  Volume2,
  Music2,
  Sparkles,
  ArrowRight,
  Disc,
} from 'lucide-react';

interface BackingTracksViewProps {
  onSyncFretboard: (key: NoteName, scale: ScaleDefinition) => void;
}

export const BackingTracksView: React.FC<BackingTracksViewProps> = ({ onSyncFretboard }) => {
  const [selectedTrack, setSelectedTrack] = useState<BackingTrack>(BACKING_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(selectedTrack.bpm);
  const [currentChord, setCurrentChord] = useState<string>(selectedTrack.chords[0]);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Mixer volumes (0 to 1)
  const [masterVol, setMasterVol] = useState<number>(0.8);
  const [drumsVol, setDrumsVol] = useState<number>(0.7);
  const [bassVol, setBassVol] = useState<number>(0.8);
  const [chordsVol, setChordsVol] = useState<number>(0.6);

  // Metronome state
  const [isMetronome, setIsMetronome] = useState<boolean>(false);
  const [activeBeat, setActiveBeat] = useState<number>(0);

  useEffect(() => {
    setBpm(selectedTrack.bpm);
    setCurrentChord(selectedTrack.chords[0]);
    if (isPlaying) {
      soundEngine.startBackingTrack(selectedTrack, selectedTrack.bpm, (step, chord) => {
        setActiveStep(step);
        setCurrentChord(chord);
      });
    }
  }, [selectedTrack]);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      soundEngine.stopBackingTrack();
      soundEngine.stopMetronome();
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      soundEngine.stopBackingTrack();
      setIsPlaying(false);
    } else {
      soundEngine.startBackingTrack(selectedTrack, bpm, (step, chord) => {
        setActiveStep(step);
        setCurrentChord(chord);
      });
      setIsPlaying(true);
    }
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    if (isPlaying) {
      soundEngine.startBackingTrack(selectedTrack, newBpm, (step, chord) => {
        setActiveStep(step);
        setCurrentChord(chord);
      });
    }
  };

  const handleMixerChange = (type: 'master' | 'drums' | 'bass' | 'chords', val: number) => {
    if (type === 'master') setMasterVol(val);
    if (type === 'drums') setDrumsVol(val);
    if (type === 'bass') setBassVol(val);
    if (type === 'chords') setChordsVol(val);

    soundEngine.setVolumes(
      type === 'master' ? val : masterVol,
      type === 'drums' ? val : drumsVol,
      type === 'bass' ? val : bassVol,
      type === 'chords' ? val : chordsVol
    );
  };

  const handleToggleMetronome = () => {
    const active = soundEngine.toggleMetronome(bpm, (beat) => {
      setActiveBeat(beat);
    });
    setIsMetronome(active);
  };

  const handleApplyToFretboard = (track: BackingTrack) => {
    let matchedScale = SCALES[0]; // default minor pentatonic
    if (track.scaleType.toLowerCase().includes('dorian')) {
      matchedScale = SCALES.find((s) => s.id === 'dorian') || SCALES[0];
    } else if (track.scaleType.toLowerCase().includes('blues')) {
      matchedScale = SCALES.find((s) => s.id === 'blues-scale') || SCALES[0];
    } else if (track.scaleType.toLowerCase().includes('major')) {
      matchedScale = SCALES.find((s) => s.id === 'major-pentatonic') || SCALES[0];
    }
    onSyncFretboard(track.key, matchedScale);
  };

  return (
    <div className="space-y-6">
      {/* Player Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            {/* Spinning Vinyl Record Icon */}
            <div
              className={`w-16 h-16 rounded-full bg-slate-950 border-2 border-amber-500/40 flex items-center justify-center shadow-xl ${
                isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-amber-500/30 flex items-center justify-center text-amber-300">
                <Disc className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {selectedTrack.genre}
                </span>
                <span className="text-xs text-slate-400 font-mono">Key of {selectedTrack.key}</span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">{selectedTrack.title}</h2>
              <p className="text-xs text-slate-400 max-w-xl mt-1">{selectedTrack.description}</p>
            </div>
          </div>

          {/* Primary Play Button & Fretboard Sync */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleApplyToFretboard(selectedTrack)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Map Scale to Fretboard</span>
            </button>

            <button
              onClick={handleTogglePlay}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-extrabold text-sm transition-all shadow-xl transform active:scale-95 ${
                isPlaying
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              <span>{isPlaying ? 'Stop Backing Track' : 'Start Jamming'}</span>
            </button>
          </div>
        </div>

        {/* Live Progression Tracker */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Chord Progression & Active Bar:</span>
            <span className="font-mono text-amber-400 font-bold">Current Chord: {currentChord}</span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {selectedTrack.chords.map((chord, index) => {
              const isCurrent = currentChord === chord;
              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl text-center border transition-all ${
                    isCurrent && isPlaying
                      ? 'bg-amber-500 text-slate-950 font-black border-amber-300 scale-105 shadow-lg shadow-amber-500/30'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] uppercase font-mono opacity-70 mb-1">Bar {index + 1}</div>
                  <div className="text-xl md:text-2xl font-mono font-black">{chord}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls: Tempo Slider, Metronome, Multi-Channel Mixer */}
        <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tempo BPM Control */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
              <span>Tempo (BPM)</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{bpm} BPM</span>
            </div>
            <input
              type="range"
              min={60}
              max={180}
              value={bpm}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>60 Slow</span>
              <span>120 Rock</span>
              <span>180 Swift</span>
            </div>
          </div>

          {/* Metronome Beat Assistant */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
              <span>Click / Metronome</span>
              <button
                onClick={handleToggleMetronome}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isMetronome
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isMetronome ? 'On' : 'Off'}
              </button>
            </div>
            {/* Visual Beat Pulse (4 beats) */}
            <div className="flex items-center justify-between gap-2 mt-3">
              {[0, 1, 2, 3].map((b) => (
                <div
                  key={b}
                  className={`flex-1 h-3 rounded-full transition-colors duration-100 ${
                    isMetronome && activeBeat === b
                      ? b === 0
                        ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                        : 'bg-emerald-400'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 text-center">4/4 Metronome Pulse</span>
          </div>

          {/* Mixer: Drums & Bass */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Drums Vol</span>
                <span className="font-mono text-slate-400">{Math.round(drumsVol * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={drumsVol}
                onChange={(e) => handleMixerChange('drums', Number(e.target.value))}
                className="w-full accent-amber-500 h-1 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Bass Vol</span>
                <span className="font-mono text-slate-400">{Math.round(bassVol * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={bassVol}
                onChange={(e) => handleMixerChange('bass', Number(e.target.value))}
                className="w-full accent-amber-500 h-1 cursor-pointer"
              />
            </div>
          </div>

          {/* Mixer: Chords & Master */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Chords Vol</span>
                <span className="font-mono text-slate-400">{Math.round(chordsVol * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={chordsVol}
                onChange={(e) => handleMixerChange('chords', Number(e.target.value))}
                className="w-full accent-amber-500 h-1 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Master Vol</span>
                <span className="font-mono text-slate-400">{Math.round(masterVol * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={masterVol}
                onChange={(e) => handleMixerChange('master', Number(e.target.value))}
                className="w-full accent-amber-500 h-1 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Backing Track Library Grid */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>Backing Track Library</span>
          <span className="text-xs text-slate-400 font-normal">({BACKING_TRACKS.length} curated multi-track jams)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BACKING_TRACKS.map((track) => {
            const isSelected = selectedTrack.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => {
                  setSelectedTrack(track);
                  if (isPlaying) {
                    soundEngine.stopBackingTrack();
                    setIsPlaying(false);
                  }
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {track.genre}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">{track.bpm} BPM</span>
                  </div>

                  <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    {track.title}
                  </h4>

                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{track.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300">
                    Key: <strong className="text-amber-400">{track.key}</strong> ({track.scaleType})
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyToFretboard(track);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-[11px]"
                  >
                    <span>Sync Scale</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
