import React, { useState } from 'react';
import {
  GuitarTuning,
  NoteName,
  ScaleDefinition,
  DetectedPitch,
} from '../types/guitar';
import {
  GUITAR_TUNINGS,
  SCALES,
  NOTE_NAMES,
  getFretPosition,
  isNoteInScale,
  getFretMarkerType,
} from '../utils/fretboardUtils';
import { soundEngine } from '../utils/soundEngine';
import { Volume2, Music, Layers, Settings2, Sliders, Eye, ZoomIn, ZoomOut, Video } from 'lucide-react';

interface FretboardViewProps {
  currentTuning: GuitarTuning;
  setCurrentTuning: (tuning: GuitarTuning) => void;
  selectedRoot: NoteName;
  setSelectedRoot: (root: NoteName) => void;
  selectedScale: ScaleDefinition | null;
  setSelectedScale: (scale: ScaleDefinition | null) => void;
  livePitch: DetectedPitch | null;
  onFretClick?: (stringNum: number, fret: number, note: NoteName) => void;
  onOpenTeachingTab?: () => void;
}

export const FretboardView: React.FC<FretboardViewProps> = ({
  currentTuning,
  setCurrentTuning,
  selectedRoot,
  setSelectedRoot,
  selectedScale,
  setSelectedScale,
  livePitch,
  onFretClick,
  onOpenTeachingTab,
}) => {
  const [fretCount, setFretCount] = useState<number>(15); // 12, 15, 21, 24
  const [displayMode, setDisplayMode] = useState<'notes' | 'intervals' | 'octaves'>('notes');
  const [showAllNotes, setShowAllNotes] = useState<boolean>(false);
  const [lastPluckedString, setLastPluckedString] = useState<number | null>(null);

  // Zoom feature for online teaching
  const [fretZoomSection, setFretZoomSection] = useState<'all' | '0-5' | '5-12' | '12-24'>('all');
  const [zoomScale, setZoomScale] = useState<number>(100);

  const handlePlayFret = (stringNum: number, fret: number) => {
    const pos = getFretPosition(stringNum, fret, currentTuning);
    soundEngine.playPluckedString(pos.frequency, 2.2);
    setLastPluckedString(stringNum);
    setTimeout(() => setLastPluckedString(null), 400);

    if (onFretClick) {
      onFretClick(stringNum, fret, pos.note);
    }
  };

  const getRenderedFrets = () => {
    switch (fretZoomSection) {
      case '0-5':
        return [0, 1, 2, 3, 4, 5];
      case '5-12':
        return [5, 6, 7, 8, 9, 10, 11, 12];
      case '12-24':
        return Array.from({ length: Math.min(13, Math.max(1, fretCount - 11)) }, (_, i) => 12 + i);
      case 'all':
      default:
        return Array.from({ length: fretCount + 1 }, (_, i) => i);
    }
  };

  const renderedFrets = getRenderedFrets();
  const isNutIncluded = renderedFrets.includes(0);
  const fretsToDisplay = renderedFrets.filter((f) => f > 0);
  const fretColWidth = Math.round(44 * (zoomScale / 100));

  // Strings from 1 (High E) to 6 (Low E)
  const stringsArray = [1, 2, 3, 4, 5, 6];

  // String thicknesses for visual realism
  const stringGaugeStyles: { [key: number]: string } = {
    1: 'h-[1.5px] bg-slate-300 shadow-[0_1px_2px_rgba(255,255,255,0.4)]',
    2: 'h-[2px] bg-slate-300 shadow-[0_1px_2px_rgba(255,255,255,0.4)]',
    3: 'h-[2.5px] bg-amber-200/80 shadow-[0_1px_2px_rgba(217,119,6,0.3)]',
    4: 'h-[3px] bg-amber-300/80 shadow-[0_1px_2px_rgba(217,119,6,0.4)]',
    5: 'h-[3.5px] bg-amber-400/90 shadow-[0_1px_2px_rgba(217,119,6,0.5)]',
    6: 'h-[4.5px] bg-amber-500/90 shadow-[0_1px_3px_rgba(217,119,6,0.6)]',
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Interactive Fretboard</span>
            <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              Real-Time Audio Sync
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any fret to pluck with physical modeling, or play your real guitar to light up notes via microphone!
          </p>
        </div>

        {/* Configuration Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tuning Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Tuning:</span>
            <select
              value={currentTuning.id}
              onChange={(e) => {
                const found = GUITAR_TUNINGS.find((t) => t.id === e.target.value);
                if (found) setCurrentTuning(found);
              }}
              className="bg-transparent text-amber-300 font-semibold focus:outline-none cursor-pointer"
            >
              {GUITAR_TUNINGS.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Root Note */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Root:</span>
            <select
              value={selectedRoot}
              onChange={(e) => setSelectedRoot(e.target.value as NoteName)}
              className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
            >
              {NOTE_NAMES.map((n) => (
                <option key={n} value={n} className="bg-slate-900 text-slate-200">
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Scale Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Scale:</span>
            <select
              value={selectedScale?.id || 'none'}
              onChange={(e) => {
                if (e.target.value === 'none') {
                  setSelectedScale(null);
                } else {
                  const s = SCALES.find((sc) => sc.id === e.target.value);
                  if (s) setSelectedScale(s);
                }
              }}
              className="bg-transparent text-amber-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="none" className="bg-slate-900 text-slate-400">
                All Notes (Free Play)
              </option>
              {SCALES.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  {s.name} ({s.formula})
                </option>
              ))}
            </select>
          </div>

          {/* Display Mode (Notes vs Intervals) */}
          <div className="flex rounded-lg bg-slate-950/80 p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setDisplayMode('notes')}
              className={`px-2 py-1 rounded font-medium transition-all ${
                displayMode === 'notes' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => setDisplayMode('intervals')}
              className={`px-2 py-1 rounded font-medium transition-all ${
                displayMode === 'intervals' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Intervals
            </button>
          </div>

          {/* Frets Count Toggle (12, 15, 24) */}
          <div className="flex rounded-lg bg-slate-950/80 p-0.5 border border-slate-800 text-xs">
            {[12, 15, 24].map((f) => (
              <button
                key={f}
                onClick={() => setFretCount(f)}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  fretCount === f ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}F
              </button>
            ))}
          </div>

          {/* Optical Zoom & Neck Isolation for Online Teaching */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/90 px-2.5 py-1 rounded-xl border border-blue-500/30 text-xs">
            <span className="text-blue-400 font-bold flex items-center gap-1">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Zoom:</span>
            </span>

            {[
              { id: 'all', label: 'Full' },
              { id: '0-5', label: '0-5 Nut' },
              { id: '5-12', label: '5-12 Mid' },
              { id: '12-24', label: '12+ Lead' },
            ].map((z) => (
              <button
                key={z.id}
                onClick={() => setFretZoomSection(z.id as any)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  fretZoomSection === z.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {z.label}
              </button>
            ))}

            <div className="h-3.5 w-px bg-slate-700" />

            {[100, 125, 150].map((s) => (
              <button
                key={s}
                onClick={() => setZoomScale(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  zoomScale === s
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Magnify display to ${s}% for teaching`}
              >
                {s}%
              </button>
            ))}
          </div>

          {onOpenTeachingTab && (
            <button
              onClick={onOpenTeachingTab}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              title="Open 1-on-1 Online Teaching Classroom with Webcam and Zoom Integration"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Teach Online (Zoom)</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Pitch Detection Status Banner */}
      {livePitch && (
        <div className="mt-3 py-2 px-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-300 font-semibold">
              Live Guitar Input Detected:
            </span>
            <span className="font-mono text-white text-sm font-extrabold bg-emerald-700/60 px-2 py-0.5 rounded">
              {livePitch.note}{livePitch.octave} ({livePitch.frequency} Hz)
            </span>
            <span className="text-slate-400 hidden sm:inline">
              Offset: {livePitch.cents > 0 ? `+${livePitch.cents}` : livePitch.cents} cents
            </span>
          </div>
          <span className="text-emerald-400/80 text-[11px]">
            Highlighting all matching '{livePitch.note}' notes on fretboard
          </span>
        </div>
      )}

      {/* Fretboard Canvas Container */}
      <div className="mt-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        <div className="min-w-[780px] select-none">
          {/* Fret Number Markers Header */}
          <div
            className="grid text-center text-[11px] font-mono font-bold text-slate-400 mb-1"
            style={{
              gridTemplateColumns: `54px repeat(${fretsToDisplay.length}, minmax(${fretColWidth}px, 1fr))`,
            }}
          >
            <div className="text-slate-400 font-bold">{isNutIncluded ? 'Nut' : 'Open'}</div>
            {fretsToDisplay.map((fret) => (
              <div key={fret} className="flex flex-col items-center justify-center">
                <span className={fret === 12 || fret === 24 ? 'text-amber-400 font-black' : ''}>{fret}</span>
                {/* Traditional Top Dots */}
                {fret === 12 || fret === 24 ? (
                  <span className="text-amber-400 text-[10px] leading-none">••</span>
                ) : [3, 5, 7, 9, 15, 17, 19, 21].includes(fret) ? (
                  <span className="text-slate-500 text-[10px] leading-none">•</span>
                ) : (
                  <span className="h-[10px]"></span>
                )}
              </div>
            ))}
          </div>

          {/* Wooden Fretboard Neck */}
          <div className="relative rounded-xl overflow-hidden border-2 border-amber-950/70 shadow-2xl bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 p-1">
            {/* Wood Grain & Frets Grid */}
            <div
              className="grid gap-0"
              style={{
                gridTemplateColumns: `54px repeat(${fretsToDisplay.length}, minmax(${fretColWidth}px, 1fr))`,
              }}
            >
              {stringsArray.map((stringNum) => {
                const openPos = getFretPosition(stringNum, 0, currentTuning);
                const isStringVibrating = lastPluckedString === stringNum;

                return (
                  <React.Fragment key={stringNum}>
                    {/* Open String (Nut or Open Reference) */}
                    <div
                      onClick={() => handlePlayFret(stringNum, 0)}
                      className="relative h-12 flex items-center justify-center bg-slate-950/90 border-r-4 border-amber-100/90 cursor-pointer hover:bg-slate-800 transition-colors"
                      title={`Open String ${stringNum}: ${openPos.note}${openPos.octave}`}
                    >
                      {/* String Line */}
                      <div
                        className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 ${
                          stringGaugeStyles[stringNum]
                        } ${isStringVibrating ? 'animate-pulse scale-y-125' : ''}`}
                      />

                      {/* Open Note Badge */}
                      <div className="relative z-10 w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold font-mono text-slate-200 hover:border-amber-400 shadow-md">
                        {openPos.note}
                      </div>
                    </div>

                    {/* Frets to Display */}
                    {fretsToDisplay.map((fret) => {
                      const pos = getFretPosition(stringNum, fret, currentTuning);
                      const marker = getFretMarkerType(fret);
                      const isScaleInfo = selectedScale
                        ? isNoteInScale(pos.note, selectedRoot, selectedScale)
                        : null;

                      const isInScale = isScaleInfo ? isScaleInfo.inScale : true;
                      const isRoot = isScaleInfo ? isScaleInfo.isRoot : pos.note === selectedRoot;
                      const isLiveMatch = livePitch && livePitch.note === pos.note;

                      // Determine Interval symbol
                      let intervalLabel: string = pos.note;
                      if (displayMode === 'intervals' && selectedScale && isScaleInfo) {
                        const intervalsMap = ['R', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
                        const rootIdx = NOTE_NAMES.indexOf(selectedRoot);
                        const noteIdx = NOTE_NAMES.indexOf(pos.note);
                        const dist = (noteIdx - rootIdx + 12) % 12;
                        intervalLabel = intervalsMap[dist] || pos.note;
                      }

                      return (
                        <div
                          key={fret}
                          onClick={() => handlePlayFret(stringNum, fret)}
                          className="relative h-12 flex items-center justify-center border-r border-slate-700/80 cursor-pointer group hover:bg-white/5 transition-all"
                          title={`String ${stringNum}, Fret ${fret}: ${pos.note}${pos.octave} (${Math.round(pos.frequency)} Hz)`}
                        >
                          {/* Fret Wire Right Edge */}
                          <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 shadow-sm" />

                          {/* Pearl Inlay Markers inside Fretboard */}
                          {stringNum === 3 && marker === 'single' && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-slate-300/30 border border-slate-200/20 pointer-events-none" />
                          )}
                          {stringNum === 2 && marker === 'double' && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-slate-300/30 border border-slate-200/20 pointer-events-none" />
                          )}
                          {stringNum === 5 && marker === 'double' && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-slate-300/30 border border-slate-200/20 pointer-events-none" />
                          )}

                          {/* String line */}
                          <div
                            className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none ${
                              stringGaugeStyles[stringNum]
                            } ${isStringVibrating ? 'scale-y-150 animate-pulse' : ''}`}
                          />

                          {/* Note Indicator Marker */}
                          {(isInScale || showAllNotes || isLiveMatch) && (
                            <div
                              className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-bold transition-all shadow-md group-hover:scale-110 ${
                                isLiveMatch
                                  ? 'bg-emerald-400 text-slate-950 ring-4 ring-emerald-400/50 scale-110 animate-pulse'
                                  : isRoot
                                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ring-2 ring-amber-300 font-extrabold shadow-amber-500/50'
                                  : isInScale
                                  ? 'bg-slate-800 text-amber-200 border border-amber-500/40'
                                  : 'bg-slate-900/80 text-slate-400 border border-slate-800'
                              }`}
                            >
                              {displayMode === 'intervals' ? intervalLabel : pos.note}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Guide Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-2 ring-amber-300 inline-block"></span>
            <span className="text-slate-300 font-semibold">Root Note ({selectedRoot})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-800 border border-amber-500/50 inline-block"></span>
            <span className="text-slate-300">Scale Tone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-emerald-300/60 inline-block animate-pulse"></span>
            <span className="text-emerald-300 font-semibold">Live Mic Audio Match</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAllNotes(!showAllNotes)}
            className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all ${
              showAllNotes
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {showAllNotes ? 'Hide Non-Scale Notes' : 'Show All Chromatic Notes'}
          </button>
        </div>
      </div>
    </div>
  );
};
