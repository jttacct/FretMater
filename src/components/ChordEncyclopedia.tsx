import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Volume2,
  Plus,
  Play,
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
  Check,
  Music,
  Info,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  EncyclopediaChord,
  ChordVoicing,
  NoteName,
  GuitarTuning,
  CustomChordProgression,
  ProgressionChord,
} from '../types/guitar';
import { NOTE_NAMES, GUITAR_TUNINGS, getFretMarkerType } from '../utils/fretboardUtils';
import { getFullChordEncyclopedia } from '../utils/chordEncyclopediaData';
import { soundEngine } from '../utils/soundEngine';
import { storage } from '../utils/storage';

interface ChordEncyclopediaProps {
  currentTuning?: GuitarTuning;
  onAddToProgression?: (chord: ProgressionChord, voicing?: ChordVoicing) => void;
  onNavigateToCreator?: () => void;
  onInspectOnFretboard?: (root: NoteName) => void;
}

const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'All', label: 'All Voicings', icon: '📚' },
  { id: 'Dominant & Blues', label: 'Dominant & Hendrix Blues', icon: '⚡' },
  { id: 'Jazz & Extensions', label: 'Jazz, 13ths & 9ths', icon: '🎷' },
  { id: 'Neo-Soul & Quartal', label: 'Neo-Soul & m11', icon: '✨' },
  { id: 'Altered & Diminished', label: 'Altered 7alt & Dim7', icon: '🔮' },
  { id: 'Triads & Open', label: 'Triads & Sus4', icon: '🎸' },
];

const DIFFICULTY_COLORS: { [key in ChordVoicing['difficulty']]: { bg: string; text: string; border: string } } = {
  Beginner: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Intermediate: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  Advanced: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  Master: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
};

export const ChordEncyclopedia: React.FC<ChordEncyclopediaProps> = ({
  currentTuning = GUITAR_TUNINGS[0],
  onAddToProgression,
  onNavigateToCreator,
  onInspectOnFretboard,
}) => {
  const encyclopedia = useMemo(() => getFullChordEncyclopedia(), []);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRootFilter, setSelectedRootFilter] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');

  // Currently selected chord & voicing for detailed interactive fretboard display
  const [selectedChordId, setSelectedChordId] = useState<string>('E-7#9');
  const [selectedVoicingIndex, setSelectedVoicingIndex] = useState<number>(0);

  // Added notification feedback toast
  const [addedToast, setAddedToast] = useState<{ symbol: string; voicingName: string } | null>(null);

  // Quick preset shortcuts for iconic voicings
  const ICONIC_SHORTCUTS = [
    { label: 'Purple Haze (E7#9)', root: 'E', quality: '7#9' },
    { label: 'Steely Dan Mu Major (Cadd9)', root: 'C', quality: 'add9' },
    { label: 'Freddie Green Swing (G13)', root: 'G', quality: '13' },
    { label: 'James Brown Funk (D9)', root: 'D', quality: '9' },
    { label: 'Bossa Nova Velvet (Am9)', root: 'A', quality: 'm9' },
    { label: 'Autumn Leaves iiø (Dm7b5)', root: 'D', quality: 'm7b5' },
    { label: 'So What Quartal (Em11)', root: 'E', quality: 'm11' },
    { label: 'Coltrane Turnaround (C7alt)', root: 'C', quality: '7alt' },
  ];

  // Filter chords based on query and selections
  const filteredChords = useMemo(() => {
    return encyclopedia.filter((item) => {
      // Root filter
      if (selectedRootFilter !== 'All' && item.root !== selectedRootFilter) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const symbolMatch = item.symbol.toLowerCase().includes(q);
        const nameMatch = item.fullName.toLowerCase().includes(q);
        const formulaMatch = item.formula.toLowerCase().includes(q);
        const qualityMatch = item.quality.toLowerCase().includes(q);
        const tagMatch = item.voicings.some((v) =>
          v.name.toLowerCase().includes(q) ||
          v.tags.some((t) => t.toLowerCase().includes(q)) ||
          v.description.toLowerCase().includes(q)
        );
        if (!symbolMatch && !nameMatch && !formulaMatch && !qualityMatch && !tagMatch) {
          return false;
        }
      }
      // Difficulty filter
      if (selectedDifficulty !== 'All') {
        const hasDiff = item.voicings.some((v) => v.difficulty === selectedDifficulty);
        if (!hasDiff) return false;
      }
      return true;
    });
  }, [encyclopedia, selectedRootFilter, selectedCategory, searchQuery, selectedDifficulty]);

  // The active chord
  const activeChord: EncyclopediaChord = useMemo(() => {
    const found = encyclopedia.find((c) => c.id === selectedChordId);
    return found || filteredChords[0] || encyclopedia[0];
  }, [encyclopedia, selectedChordId, filteredChords]);

  // The active voicing
  const activeVoicing: ChordVoicing = useMemo(() => {
    if (!activeChord || activeChord.voicings.length === 0) {
      return encyclopedia[0].voicings[0];
    }
    const idx = Math.min(selectedVoicingIndex, activeChord.voicings.length - 1);
    return activeChord.voicings[idx];
  }, [activeChord, selectedVoicingIndex, encyclopedia]);

  // Audition playback
  const handleAuditionVoicing = (voicing: ChordVoicing, arpeggiate: boolean = false) => {
    soundEngine.playVoicingFrets(voicing, arpeggiate);
  };

  // Add Voicing directly to Creator Studio Progression
  const handleAddToProgression = (voicing: ChordVoicing) => {
    // 1. Build ProgressionChord representation with exact voicing intervals
    const targetChord: ProgressionChord = {
      id: `chord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      root: activeChord.root,
      quality: activeChord.quality,
      symbol: activeChord.symbol,
      beats: 4,
      degree: activeVoicing.name.includes('Root 6') ? 'Root 6' : activeVoicing.name.includes('Root 5') ? 'Root 5' : 'Voicing',
      color: activeChord.category === 'Dominant & Blues'
        ? 'border-amber-400/80 bg-amber-500/10'
        : activeChord.category === 'Jazz & Extensions'
        ? 'border-indigo-400/80 bg-indigo-500/10'
        : activeChord.category === 'Neo-Soul & Quartal'
        ? 'border-pink-400/80 bg-pink-500/10'
        : activeChord.category === 'Altered & Diminished'
        ? 'border-purple-400/80 bg-purple-500/10'
        : 'border-emerald-400/80 bg-emerald-500/10',
    };

    // 2. Persist to active custom progression in storage
    const list = storage.getProgressions();
    if (list && list.length > 0) {
      const activeProg = { ...list[0] };
      activeProg.chords = [...activeProg.chords, targetChord];
      storage.saveProgression(activeProg);
    }

    // 3. Trigger callback if passed
    if (onAddToProgression) {
      onAddToProgression(targetChord, voicing);
    }

    // 4. Play audio and celebrate
    soundEngine.playVoicingFrets(voicing, false);
    confetti({
      particleCount: 40,
      spread: 65,
      origin: { y: 0.8 },
      colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'],
    });

    // 5. Show toast
    setAddedToast({ symbol: activeChord.symbol, voicingName: voicing.name });
    setTimeout(() => {
      setAddedToast(null);
    }, 3500);
  };

  // Determine fretboard window for active voicing
  const neckFrets = useMemo(() => {
    // Collect frets used > 0
    const usedFrets = activeVoicing.frets.filter((f) => f.fret > 0).map((f) => f.fret);
    const minFret = usedFrets.length > 0 ? Math.min(...usedFrets) : 1;
    const maxFret = usedFrets.length > 0 ? Math.max(...usedFrets) : 5;

    // Show at least 5-6 frets around voicing
    let startFret = Math.max(0, minFret - 1);
    if (startFret > 0 && minFret <= 2) startFret = 0;
    const endFret = Math.max(startFret + 5, maxFret + 1);

    const frets: number[] = [];
    for (let f = startFret; f <= endFret; f++) {
      frets.push(f);
    }
    return frets;
  }, [activeVoicing]);

  return (
    <div id="chord-encyclopedia-root" className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner">
                <BookOpen className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Chord Encyclopedia
                  </h2>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/40">
                    Voicing Engine
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Search complex voicings, inspect fretboard positions & fingerings instantly, and export to your Creator Studio progression.
                </p>
              </div>
            </div>
          </div>

          {/* Direct CTA to Creator Studio */}
          {onNavigateToCreator && (
            <button
              id="btn-goto-creator-studio"
              onClick={onNavigateToCreator}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-md cursor-pointer hover:border-amber-400"
            >
              <Layers className="w-4 h-4" />
              <span>Open Creator Studio Timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search & Fast Filters */}
        <div className="mt-6 space-y-4">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="chord-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by symbol, name, artist or formula (e.g. '7#9', 'Hendrix', '13th', 'm7b5', 'Jobim', 'Quartal', 'Drop 2')..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>

          {/* Iconic Shortcuts Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Iconic Voicings:
            </span>
            {ICONIC_SHORTCUTS.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setSelectedRootFilter(item.root);
                  const targetId = `${item.root}-${item.quality}`;
                  setSelectedChordId(targetId);
                  setSelectedVoicingIndex(0);
                  setSearchQuery('');
                }}
                className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-slate-300 hover:text-white text-xs whitespace-nowrap transition-colors font-medium flex items-center gap-1"
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Root Note Filter Row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-xs text-slate-400 font-semibold mr-1">Root:</span>
            <button
              onClick={() => setSelectedRootFilter('All')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedRootFilter === 'All'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Roots
            </button>
            {NOTE_NAMES.map((root) => (
              <button
                key={root}
                onClick={() => {
                  setSelectedRootFilter(root);
                  // Auto pick matching chord if possible
                  const match = encyclopedia.find((c) => c.root === root);
                  if (match) {
                    setSelectedChordId(match.id);
                    setSelectedVoicingIndex(0);
                  }
                }}
                className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center ${
                  selectedRootFilter === root
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ring-2 ring-amber-300 shadow-md scale-105'
                    : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                {root}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-slate-800 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split View: Left Catalog + Right Live Interactive Fretboard Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Search Results & Voicing Picker (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-400" /> Matching Chords ({filteredChords.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Click to render on fretboard
              </span>
            </div>

            {/* Chords List */}
            <div className="mt-3 space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {filteredChords.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs">No chord voicings match your filters.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedRootFilter('All');
                      setSelectedCategory('All');
                    }}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                filteredChords.map((chord) => {
                  const isSelected = activeChord.id === chord.id;
                  return (
                    <div
                      key={chord.id}
                      id={`chord-card-${chord.id}`}
                      onClick={() => {
                        setSelectedChordId(chord.id);
                        setSelectedVoicingIndex(0);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-400 ring-1 ring-amber-400/40 shadow-lg'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black font-mono tracking-tight text-white">
                            {chord.symbol}
                          </span>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                            {chord.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {chord.voicings.length} {chord.voicings.length === 1 ? 'shape' : 'shapes'}
                          </span>
                          <ChevronRight className={`w-4 h-4 text-slate-500 ${isSelected ? 'text-amber-400 translate-x-0.5' : ''}`} />
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 mt-1 font-medium line-clamp-1">
                        {chord.fullName}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60 font-mono">
                        <span>Formula: {chord.formula}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (chord.voicings[0]) {
                              handleAuditionVoicing(chord.voicings[0]);
                            }
                          }}
                          className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-amber-400 hover:text-amber-300"
                          title="Quick preview voice"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Fretboard Stage & Voicing Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            {/* Chord Header & Voicing Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black font-mono tracking-tight bg-gradient-to-r from-amber-300 via-white to-amber-200 bg-clip-text text-transparent">
                    {activeChord.symbol}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      DIFFICULTY_COLORS[activeVoicing.difficulty]?.border || 'border-slate-700'
                    } ${DIFFICULTY_COLORS[activeVoicing.difficulty]?.bg || 'bg-slate-800'} ${
                      DIFFICULTY_COLORS[activeVoicing.difficulty]?.text || 'text-slate-300'
                    }`}
                  >
                    {activeVoicing.difficulty}
                  </span>
                  {activeVoicing.suggestedGenre && (
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
                      • {activeVoicing.suggestedGenre}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mt-1">
                  {activeVoicing.name}
                </h3>
              </div>

              {/* Action Buttons: Audition + Strum + Add to Progression */}
              <div className="flex items-center gap-2">
                <button
                  id="btn-strum-chord"
                  onClick={() => handleAuditionVoicing(activeVoicing, false)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 transition-all shadow-md cursor-pointer"
                  title="Strum full chord with physical acoustic modeling"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Strum</span>
                </button>

                <button
                  id="btn-arpeggiate-chord"
                  onClick={() => handleAuditionVoicing(activeVoicing, true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 transition-all shadow-md cursor-pointer"
                  title="Arpeggiate note-by-note through strings"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Arpeggio</span>
                </button>

                <button
                  id="btn-add-to-progression"
                  onClick={() => handleAddToProgression(activeVoicing)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-950/40 transition-all transform active:scale-95 cursor-pointer"
                  title="Export this voicing directly into Creator Studio progression timeline"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Progression</span>
                </button>
              </div>
            </div>

            {/* Voicing Switcher Pills */}
            {activeChord.voicings.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs text-slate-400 font-semibold mr-1">Shapes:</span>
                {activeChord.voicings.map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVoicingIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedVoicingIndex === idx
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Shape {idx + 1}: {v.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Educational Description & Musical Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 leading-relaxed font-medium">
                  {activeVoicing.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                <div>
                  <span className="text-slate-500">Interval Formula: </span>
                  <span className="text-amber-300 font-bold">{activeVoicing.formula}</span>
                </div>
                <div>
                  <span className="text-slate-500">Base Fret: </span>
                  <span className="text-white font-bold">{activeVoicing.baseFret}</span>
                </div>
                <div>
                  <span className="text-slate-500">Tags: </span>
                  <span className="text-cyan-300">{activeVoicing.tags.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Interactive Fretboard Visual Diagram */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <span>Guitar Fretboard Diagram</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (Standard Tuning E-A-D-G-B-E)
                  </span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Base Fret: <strong className="text-amber-300">{neckFrets[0] === 0 ? 'Nut (Open)' : `Fret ${neckFrets[0]}`}</strong>
                </span>
              </div>

              {/* Fretboard Container */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-amber-950/80 shadow-2xl bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 p-2">
                {/* Fret Numbers Header */}
                <div
                  className="grid gap-0 mb-1"
                  style={{
                    gridTemplateColumns: `54px repeat(${neckFrets.length}, minmax(44px, 1fr))`,
                  }}
                >
                  <div className="text-center text-[10px] font-mono text-slate-500 font-bold">
                    STR
                  </div>
                  {neckFrets.map((fret) => (
                    <div key={fret} className="text-center text-[10px] font-mono text-slate-400 font-bold">
                      {fret === 0 ? 'NUT' : `F${fret}`}
                      {getFretMarkerType(fret) === 'single' && (
                        <span className="text-amber-400 ml-0.5">•</span>
                      )}
                      {getFretMarkerType(fret) === 'double' && (
                        <span className="text-amber-400 ml-0.5">••</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Strings Grid: 6 strings from 1 (High E, top) to 6 (Low E, bottom) */}
                <div
                  className="grid gap-0"
                  style={{
                    gridTemplateColumns: `54px repeat(${neckFrets.length}, minmax(44px, 1fr))`,
                  }}
                >
                  {[1, 2, 3, 4, 5, 6].map((strNum) => {
                    const voicingFret = activeVoicing.frets.find((f) => f.string === strNum);
                    const isMuted = voicingFret?.fret === -1 || voicingFret === undefined;
                    const isOpen = voicingFret?.fret === 0;
                    const isFretted = voicingFret && voicingFret.fret > 0;

                    const stringName = ['E', 'B', 'G', 'D', 'A', 'E'][strNum - 1];

                    return (
                      <React.Fragment key={strNum}>
                        {/* String Label / Mute indicator */}
                        <div
                          className="h-11 flex items-center justify-between px-2 bg-slate-950/90 border-r-4 border-amber-100/90"
                          title={`String ${strNum} (${stringName})`}
                        >
                          <span className="text-[10px] font-mono text-slate-400">
                            {strNum}:{stringName}
                          </span>
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                              isMuted
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : isOpen
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {isMuted ? '✕' : isOpen ? '○' : '●'}
                          </span>
                        </div>

                        {/* Frets for this string */}
                        {neckFrets.map((fret) => {
                          const isThisFretted = isFretted && voicingFret.fret === fret;
                          const isThisOpen = isOpen && fret === 0;
                          const isRoot = isThisFretted && (voicingFret.interval === 'R' || voicingFret.note === activeChord.root);

                          return (
                            <div
                              key={fret}
                              onClick={() => {
                                if (voicingFret && voicingFret.fret >= 0) {
                                  soundEngine.playVoicingFrets(activeVoicing, false);
                                }
                              }}
                              className={`relative h-11 flex items-center justify-center border-r border-slate-700/80 cursor-pointer group hover:bg-white/5 transition-all ${
                                fret === 0 ? 'bg-slate-950/60' : ''
                              }`}
                            >
                              {/* Fret wire */}
                              <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400" />

                              {/* String metal wire line */}
                              <div
                                className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none ${
                                  strNum === 1
                                    ? 'h-[1.5px] bg-slate-300'
                                    : strNum === 2
                                    ? 'h-[2px] bg-slate-300'
                                    : strNum === 3
                                    ? 'h-[2.5px] bg-amber-200/80'
                                    : strNum === 4
                                    ? 'h-[3px] bg-amber-300/80'
                                    : strNum === 5
                                    ? 'h-[3.5px] bg-amber-400/90'
                                    : 'h-[4.5px] bg-amber-500/90'
                                }`}
                              />

                              {/* Fretted Finger Marker Badge */}
                              {(isThisFretted || isThisOpen) && (
                                <div
                                  className={`relative z-10 w-7 h-7 rounded-full flex flex-col items-center justify-center text-[10px] font-mono font-black shadow-lg transition-transform group-hover:scale-110 ${
                                    isRoot
                                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/50'
                                      : 'bg-indigo-600 text-white ring-2 ring-indigo-300 shadow-indigo-500/40'
                                  }`}
                                  title={`Fret ${fret}, Note: ${voicingFret.note || ''}, Interval: ${voicingFret.interval || ''}`}
                                >
                                  <span>{voicingFret.interval || voicingFret.note}</span>
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

              {/* Fretboard Legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-2 ring-amber-300 inline-block"></span>
                    <span className="text-slate-300 font-semibold">Root Note ({activeChord.root})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 ring-2 ring-indigo-300 inline-block"></span>
                    <span className="text-slate-300 font-semibold">Chord Extension / Color Note</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 flex items-center justify-center text-[9px] font-bold">✕</span>
                    <span>Muted (Don't Pluck)</span>
                  </div>
                </div>

                {onInspectOnFretboard && (
                  <button
                    onClick={() => onInspectOnFretboard(activeChord.root)}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Inspect Root across 24 Frets</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Voicing Tab String Map */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" /> Tablature Fingering Representation
              </h4>
              <div className="grid grid-cols-6 gap-2 text-center font-mono">
                {[6, 5, 4, 3, 2, 1].map((str) => {
                  const f = activeVoicing.frets.find((vf) => vf.string === str);
                  const isMuted = f?.fret === -1 || f === undefined;
                  const strLetter = ['E', 'B', 'G', 'D', 'A', 'E'][str - 1];
                  return (
                    <div key={str} className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Str {str} ({strLetter})</span>
                      <span
                        className={`text-base font-extrabold block mt-0.5 ${
                          isMuted
                            ? 'text-rose-400'
                            : f?.fret === 0
                            ? 'text-emerald-400'
                            : 'text-amber-300'
                        }`}
                      >
                        {isMuted ? 'X' : f?.fret}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {f?.interval ? `${f.interval}` : isMuted ? 'mute' : 'open'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast when Voicing is Added to Progression */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 border-2 border-emerald-500 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Added to Progression Timeline!</span>
              <span className="text-emerald-400 font-mono font-bold">{addedToast.symbol}</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Voicing: "{addedToast.voicingName}". Open Creator Studio to arrange your backing track.
            </p>
          </div>
          {onNavigateToCreator && (
            <button
              onClick={onNavigateToCreator}
              className="ml-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-extrabold transition-all"
            >
              View Studio
            </button>
          )}
        </div>
      )}
    </div>
  );
};
