import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CustomChordProgression,
  ProgressionChord,
  SynthVoiceType,
  NoteName,
  ScaleDefinition,
} from '../types/guitar';
import { NOTE_NAMES, SCALES } from '../utils/fretboardUtils';
import { soundEngine } from '../utils/soundEngine';
import { storage } from '../utils/storage';
import { downloadProgressionMidi } from '../utils/midiExporter';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Sliders,
  Download,
  Share2,
  Plus,
  Trash2,
  Sparkles,
  Music,
  Disc,
  Layers,
  ArrowRight,
  Check,
  Save,
  Radio,
  FileMusic,
  Shuffle,
  Eye,
  Guitar,
  BookOpen,
} from 'lucide-react';

interface ChordProgressionBuilderProps {
  onSyncFretboard?: (key: NoteName, scale: ScaleDefinition) => void;
  onTrackCreated?: (trackTitle: string) => void;
  onOpenChordEncyclopedia?: () => void;
}

// Common progression templates
const PROGRESSION_PRESETS: {
  name: string;
  genre: string;
  key: NoteName;
  mode: CustomChordProgression['scaleMode'];
  bpm: number;
  voice: SynthVoiceType;
  drumPattern: CustomChordProgression['drumPattern'];
  chords: { root: NoteName; quality: string; symbol: string; degree: string }[];
}[] = [
  {
    name: 'Pop Classic (I - V - vi - IV)',
    genre: 'Pop / Rock',
    key: 'C',
    mode: 'Major',
    bpm: 118,
    voice: 'poly-synth',
    drumPattern: 'straight-rock',
    chords: [
      { root: 'C', quality: 'maj', symbol: 'C', degree: 'I' },
      { root: 'G', quality: 'maj', symbol: 'G', degree: 'V' },
      { root: 'A', quality: 'm', symbol: 'Am', degree: 'vi' },
      { root: 'F', quality: 'maj', symbol: 'F', degree: 'IV' },
    ],
  },
  {
    name: 'Jazz Turnaround (ii7 - V7 - Imaj7 - VI7)',
    genre: 'Jazz / Neo-Soul',
    key: 'C',
    mode: 'Major',
    bpm: 92,
    voice: 'lofi-keys',
    drumPattern: 'smooth-swing',
    chords: [
      { root: 'D', quality: 'm7', symbol: 'Dm7', degree: 'ii7' },
      { root: 'G', quality: '7', symbol: 'G7', degree: 'V7' },
      { root: 'C', quality: 'maj7', symbol: 'Cmaj7', degree: 'Imaj7' },
      { root: 'A', quality: '7', symbol: 'A7', degree: 'VI7' },
    ],
  },
  {
    name: '12-Bar Blues Shuffle (I7 - IV7 - V7)',
    genre: 'Blues / Rock',
    key: 'A',
    mode: 'Blues',
    bpm: 104,
    voice: 'electric-crunch',
    drumPattern: 'shuffle',
    chords: [
      { root: 'A', quality: '7', symbol: 'A7', degree: 'I7' },
      { root: 'D', quality: '7', symbol: 'D7', degree: 'IV7' },
      { root: 'A', quality: '7', symbol: 'A7', degree: 'I7' },
      { root: 'E', quality: '7', symbol: 'E7', degree: 'V7' },
    ],
  },
  {
    name: 'Andalusian Cadence (i - bVII - bVI - V)',
    genre: 'Flamenco / Latin',
    key: 'A',
    mode: 'Minor',
    bpm: 110,
    voice: 'acoustic-pluck',
    drumPattern: 'funky-break',
    chords: [
      { root: 'A', quality: 'm', symbol: 'Am', degree: 'i' },
      { root: 'G', quality: 'maj', symbol: 'G', degree: 'bVII' },
      { root: 'F', quality: 'maj', symbol: 'F', degree: 'bVI' },
      { root: 'E', quality: '7', symbol: 'E7', degree: 'V7' },
    ],
  },
  {
    name: 'Dorian Neo-Soul Vibe (i7 - IV9)',
    genre: 'Neo-Soul / Funk',
    key: 'D',
    mode: 'Dorian',
    bpm: 86,
    voice: 'lofi-keys',
    drumPattern: 'funky-break',
    chords: [
      { root: 'D', quality: 'm7', symbol: 'Dm7', degree: 'i7' },
      { root: 'G', quality: '9', symbol: 'G9', degree: 'IV9' },
      { root: 'D', quality: 'm7', symbol: 'Dm7', degree: 'i7' },
      { root: 'G', quality: '7#9', symbol: 'G7#9', degree: 'IV7#9' },
    ],
  },
  {
    name: 'Space Ambient Odyssey (Imaj9 - vi9 - IVmaj7 - Vsus4)',
    genre: 'Cinematic / Ambient',
    key: 'E',
    mode: 'Major',
    bpm: 72,
    voice: 'ambient-pad',
    drumPattern: 'none',
    chords: [
      { root: 'E', quality: 'maj9', symbol: 'Emaj9', degree: 'Imaj9' },
      { root: 'C#', quality: 'm9', symbol: 'C#m9', degree: 'vi9' },
      { root: 'A', quality: 'maj7', symbol: 'Amaj7', degree: 'IVmaj7' },
      { root: 'B', quality: 'sus4', symbol: 'Bsus4', degree: 'Vsus4' },
    ],
  },
];

// Diatonic Roman numeral degree definitions per mode
function getDiatonicChords(root: NoteName, mode: 'Major' | 'Minor' | 'Dorian' | 'Mixolydian' | 'Blues') {
  const rootIdx = NOTE_NAMES.indexOf(root);
  const getNote = (interval: number): NoteName => NOTE_NAMES[(rootIdx + interval) % 12];

  if (mode === 'Major') {
    return [
      { degree: 'I', root: getNote(0), quality: 'maj', symbol: `${getNote(0)}`, color: 'border-amber-400/70 bg-amber-500/10' },
      { degree: 'ii', root: getNote(2), quality: 'm', symbol: `${getNote(2)}m`, color: 'border-cyan-400/70 bg-cyan-500/10' },
      { degree: 'iii', root: getNote(4), quality: 'm', symbol: `${getNote(4)}m`, color: 'border-cyan-400/70 bg-cyan-500/10' },
      { degree: 'IV', root: getNote(5), quality: 'maj', symbol: `${getNote(5)}`, color: 'border-emerald-400/70 bg-emerald-500/10' },
      { degree: 'V', root: getNote(7), quality: 'maj', symbol: `${getNote(7)}`, color: 'border-rose-400/70 bg-rose-500/10' },
      { degree: 'vi', root: getNote(9), quality: 'm', symbol: `${getNote(9)}m`, color: 'border-purple-400/70 bg-purple-500/10' },
      { degree: 'vii°', root: getNote(11), quality: 'dim', symbol: `${getNote(11)}dim`, color: 'border-slate-500 bg-slate-800/40' },
    ];
  } else if (mode === 'Minor') {
    return [
      { degree: 'i', root: getNote(0), quality: 'm', symbol: `${getNote(0)}m`, color: 'border-rose-400/70 bg-rose-500/10' },
      { degree: 'ii°', root: getNote(2), quality: 'dim', symbol: `${getNote(2)}dim`, color: 'border-slate-500 bg-slate-800/40' },
      { degree: 'bIII', root: getNote(3), quality: 'maj', symbol: `${getNote(3)}`, color: 'border-amber-400/70 bg-amber-500/10' },
      { degree: 'iv', root: getNote(5), quality: 'm', symbol: `${getNote(5)}m`, color: 'border-cyan-400/70 bg-cyan-500/10' },
      { degree: 'v', root: getNote(7), quality: 'm', symbol: `${getNote(7)}m`, color: 'border-indigo-400/70 bg-indigo-500/10' },
      { degree: 'bVI', root: getNote(8), quality: 'maj', symbol: `${getNote(8)}`, color: 'border-emerald-400/70 bg-emerald-500/10' },
      { degree: 'bVII', root: getNote(10), quality: 'maj', symbol: `${getNote(10)}`, color: 'border-cyan-400/70 bg-cyan-500/10' },
    ];
  } else if (mode === 'Dorian') {
    return [
      { degree: 'i7', root: getNote(0), quality: 'm7', symbol: `${getNote(0)}m7`, color: 'border-rose-400/70 bg-rose-500/10' },
      { degree: 'ii7', root: getNote(2), quality: 'm7', symbol: `${getNote(2)}m7`, color: 'border-indigo-400/70 bg-indigo-500/10' },
      { degree: 'bIIImaj7', root: getNote(3), quality: 'maj7', symbol: `${getNote(3)}maj7`, color: 'border-amber-400/70 bg-amber-500/10' },
      { degree: 'IV7', root: getNote(5), quality: '7', symbol: `${getNote(5)}7`, color: 'border-emerald-400/70 bg-emerald-500/10' },
      { degree: 'v7', root: getNote(7), quality: 'm7', symbol: `${getNote(7)}m7`, color: 'border-cyan-400/70 bg-cyan-500/10' },
      { degree: 'vi°', root: getNote(9), quality: 'm7b5', symbol: `${getNote(9)}m7b5`, color: 'border-slate-500 bg-slate-800/40' },
      { degree: 'bVIImaj7', root: getNote(10), quality: 'maj7', symbol: `${getNote(10)}maj7`, color: 'border-purple-400/70 bg-purple-500/10' },
    ];
  } else if (mode === 'Mixolydian') {
    return [
      { degree: 'I7', root: getNote(0), quality: '7', symbol: `${getNote(0)}7`, color: 'border-amber-400/70 bg-amber-500/10' },
      { degree: 'ii7', root: getNote(2), quality: 'm7', symbol: `${getNote(2)}m7`, color: 'border-cyan-400/70 bg-cyan-500/10' },
      { degree: 'iii°', root: getNote(4), quality: 'm7b5', symbol: `${getNote(4)}m7b5`, color: 'border-slate-500 bg-slate-800/40' },
      { degree: 'IVmaj7', root: getNote(5), quality: 'maj7', symbol: `${getNote(5)}maj7`, color: 'border-emerald-400/70 bg-emerald-500/10' },
      { degree: 'vm7', root: getNote(7), quality: 'm7', symbol: `${getNote(7)}m7`, color: 'border-indigo-400/70 bg-indigo-500/10' },
      { degree: 'vi7', root: getNote(9), quality: 'm7', symbol: `${getNote(9)}m7`, color: 'border-purple-400/70 bg-purple-500/10' },
      { degree: 'bVII', root: getNote(10), quality: 'maj', symbol: `${getNote(10)}`, color: 'border-cyan-400/70 bg-cyan-500/10' },
    ];
  } else {
    // Blues
    return [
      { degree: 'I7', root: getNote(0), quality: '7', symbol: `${getNote(0)}7`, color: 'border-amber-400/70 bg-amber-500/10' },
      { degree: 'IV7', root: getNote(5), quality: '7', symbol: `${getNote(5)}7`, color: 'border-emerald-400/70 bg-emerald-500/10' },
      { degree: 'V7', root: getNote(7), quality: '7', symbol: `${getNote(7)}7`, color: 'border-rose-400/70 bg-rose-500/10' },
      { degree: 'bVII7', root: getNote(10), quality: '7', symbol: `${getNote(10)}7`, color: 'border-purple-400/70 bg-purple-500/10' },
      { degree: 'I7#9', root: getNote(0), quality: '7#9', symbol: `${getNote(0)}7#9`, color: 'border-pink-500/70 bg-pink-500/10' },
    ];
  }
}

// Extended chord variations for selected root
const CHORD_QUALITY_TABS = [
  { label: 'Diatonic', id: 'diatonic' },
  { label: '7th & 9th Chords', id: 'sevenths' },
  { label: 'Suspended & Color', id: 'suspended' },
  { label: 'Minor / Diminished', id: 'minors' },
];

export const ChordProgressionBuilder: React.FC<ChordProgressionBuilderProps> = ({
  onSyncFretboard,
  onTrackCreated,
  onOpenChordEncyclopedia,
}) => {
  // Saved progressions
  const [savedList, setSavedList] = useState<CustomChordProgression[]>(storage.getProgressions());
  
  // Current active progression state
  const [progression, setProgression] = useState<CustomChordProgression>(() => {
    const progs = storage.getProgressions();
    return progs[0] || {
      id: `prog-${Date.now()}`,
      title: 'My Custom Progression',
      key: 'C',
      scaleMode: 'Major',
      bpm: 110,
      synthVoice: 'poly-synth',
      drumPattern: 'straight-rock',
      bassEnabled: true,
      drumsEnabled: true,
      chords: [
        { id: '1', root: 'C', quality: 'maj', symbol: 'C', beats: 4, degree: 'I' },
        { id: '2', root: 'G', quality: 'maj', symbol: 'G', beats: 4, degree: 'V' },
        { id: '3', root: 'A', quality: 'm', symbol: 'Am', beats: 4, degree: 'vi' },
        { id: '4', root: 'F', quality: 'maj', symbol: 'F', beats: 4, degree: 'IV' },
      ],
      createdAt: Date.now(),
    };
  });

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBarIndex, setCurrentBarIndex] = useState<number>(0);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Drag and drop state
  const [draggedChord, setDraggedChord] = useState<ProgressionChord | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Chord palette filters
  const [paletteTab, setPaletteTab] = useState<string>('diatonic');
  const [paletteRoot, setPaletteRoot] = useState<NoteName>(progression.key);
  const [saveToast, setSaveToast] = useState<boolean>(false);

  // Tap tempo state
  const tapTimesRef = useRef<number[]>([]);

  // Stop sound playback on unmount
  useEffect(() => {
    return () => {
      soundEngine.stopProgressionSynth();
    };
  }, []);

  // Update paletteRoot when progression key changes
  useEffect(() => {
    setPaletteRoot(progression.key);
  }, [progression.key]);

  // Handle Play / Stop
  const handleTogglePlay = () => {
    if (isPlaying) {
      soundEngine.stopProgressionSynth();
      setIsPlaying(false);
      setCurrentStep(0);
    } else {
      setIsPlaying(true);
      soundEngine.startProgressionSynth(
        progression,
        (barIndex, beat, step) => {
          setCurrentBarIndex(barIndex);
          setCurrentBeat(beat);
          setCurrentStep(step);
        }
      );
    }
  };

  const handleStop = () => {
    soundEngine.stopProgressionSynth();
    setIsPlaying(false);
    setCurrentBarIndex(0);
    setCurrentBeat(0);
    setCurrentStep(0);
  };

  // Restart playback if params change while playing
  useEffect(() => {
    if (isPlaying) {
      soundEngine.startProgressionSynth(
        progression,
        (barIndex, beat, step) => {
          setCurrentBarIndex(barIndex);
          setCurrentBeat(beat);
          setCurrentStep(step);
        }
      );
    }
  }, [
    progression.bpm,
    progression.synthVoice,
    progression.drumPattern,
    progression.bassEnabled,
    progression.drumsEnabled,
    progression.chords,
  ]);

  // Tap Tempo calculator
  const handleTapTempo = () => {
    const now = performance.now();
    const times = tapTimesRef.current;
    times.push(now);
    if (times.length > 4) times.shift();

    if (times.length >= 2) {
      const intervals = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 50 && calculatedBpm <= 220) {
        setProgression((prev) => ({ ...prev, bpm: calculatedBpm }));
      }
    }
    soundEngine.playClick(true);
  };

  // Load Preset
  const handleLoadPreset = (presetName: string) => {
    const preset = PROGRESSION_PRESETS.find((p) => p.name === presetName);
    if (!preset) return;

    soundEngine.stopProgressionSynth();
    setIsPlaying(false);

    const newChords: ProgressionChord[] = preset.chords.map((c, i) => ({
      id: `chord-${Date.now()}-${i}`,
      root: c.root,
      quality: c.quality,
      symbol: c.symbol,
      beats: 4,
      degree: c.degree,
      color: 'border-amber-400/80',
    }));

    const updated: CustomChordProgression = {
      ...progression,
      title: preset.name,
      key: preset.key,
      scaleMode: preset.mode,
      bpm: preset.bpm,
      synthVoice: preset.voice,
      drumPattern: preset.drumPattern,
      chords: newChords,
    };

    setProgression(updated);
    setPaletteRoot(preset.key);
    soundEngine.playChordVoicing(newChords[0], preset.voice);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, chord: ProgressionChord) => {
    setDraggedChord(chord);
    e.dataTransfer.setData('text/plain', JSON.stringify(chord));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    let dropped: ProgressionChord | null = draggedChord;
    if (!dropped) {
      try {
        dropped = JSON.parse(e.dataTransfer.getData('text/plain'));
      } catch (err) {
        console.error('Failed to parse dropped chord:', err);
      }
    }

    if (!dropped) return;

    const newChords = [...progression.chords];
    const freshChord: ProgressionChord = {
      ...dropped,
      id: `chord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      beats: 4,
    };

    if (targetIndex >= newChords.length) {
      newChords.push(freshChord);
    } else {
      // Replace existing slot
      newChords[targetIndex] = freshChord;
    }

    setProgression({ ...progression, chords: newChords });
    soundEngine.playChordVoicing(freshChord, progression.synthVoice);
    setDraggedChord(null);
  };

  // Click to add chord directly to timeline
  const handleAddChordToTimeline = (chordTemplate: {
    root: NoteName;
    quality: string;
    symbol: string;
    degree?: string;
  }) => {
    const freshChord: ProgressionChord = {
      id: `chord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      root: chordTemplate.root,
      quality: chordTemplate.quality,
      symbol: chordTemplate.symbol,
      degree: chordTemplate.degree,
      beats: 4,
      color: 'border-amber-400/80',
    };

    const newChords = [...progression.chords, freshChord];
    setProgression({ ...progression, chords: newChords });
    soundEngine.playChordVoicing(freshChord, progression.synthVoice);
  };

  // Remove a chord from timeline
  const handleRemoveChord = (index: number) => {
    if (progression.chords.length <= 1) return;
    const newChords = progression.chords.filter((_, i) => i !== index);
    setProgression({ ...progression, chords: newChords });
  };

  // Toggle duration of chord between 2 and 4 beats
  const handleToggleChordBeats = (index: number) => {
    const newChords = [...progression.chords];
    const current = newChords[index];
    newChords[index] = {
      ...current,
      beats: current.beats === 4 ? 2 : 4,
    };
    setProgression({ ...progression, chords: newChords });
  };

  // Save progression
  const handleSave = () => {
    storage.saveProgression(progression);
    setSavedList(storage.getProgressions());
    setSaveToast(true);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.85 } });
    setTimeout(() => setSaveToast(false), 2500);
  };

  // Export MIDI file
  const handleExportMidi = () => {
    downloadProgressionMidi(progression);
  };

  // Export as Backing Track / Share to Community
  const handleExportToBackingTrack = () => {
    const trackTitle = progression.title;
    if (onTrackCreated) {
      onTrackCreated(trackTitle);
    }
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.8 } });
    alert(`Success! "${trackTitle}" has been converted to an exportable backing track structure.`);
  };

  // Sync with Fretboard Neck
  const handleSyncToFretboard = () => {
    if (!onSyncFretboard) return;
    // Map mode to ScaleDefinition
    let scaleMatch = SCALES.find((s) => s.id === 'major-scale');
    if (progression.scaleMode === 'Minor') scaleMatch = SCALES.find((s) => s.id === 'natural-minor');
    if (progression.scaleMode === 'Dorian') scaleMatch = SCALES.find((s) => s.id === 'dorian');
    if (progression.scaleMode === 'Mixolydian') scaleMatch = SCALES.find((s) => s.id === 'mixolydian');
    if (progression.scaleMode === 'Blues') scaleMatch = SCALES.find((s) => s.id === 'blues-scale');

    if (scaleMatch) {
      onSyncFretboard(progression.key, scaleMatch);
    }
  };

  // Generate extended chords for palette tab
  const diatonicChords = getDiatonicChords(progression.key, progression.scaleMode);

  const getExtendedPaletteChords = () => {
    const r = paletteRoot;
    if (paletteTab === 'sevenths') {
      return [
        { symbol: `${r}maj7`, root: r, quality: 'maj7', degree: 'Maj7' },
        { symbol: `${r}7`, root: r, quality: '7', degree: 'Dom7' },
        { symbol: `${r}m7`, root: r, quality: 'm7', degree: 'Min7' },
        { symbol: `${r}9`, root: r, quality: '9', degree: 'Dom9' },
        { symbol: `${r}maj9`, root: r, quality: 'maj9', degree: 'Maj9' },
        { symbol: `${r}m9`, root: r, quality: 'm9', degree: 'Min9' },
      ];
    } else if (paletteTab === 'suspended') {
      return [
        { symbol: `${r}sus4`, root: r, quality: 'sus4', degree: 'Sus4' },
        { symbol: `${r}sus2`, root: r, quality: 'sus2', degree: 'Sus2' },
        { symbol: `${r}7sus4`, root: r, quality: 'sus4', degree: '7sus4' },
        { symbol: `${r}add9`, root: r, quality: 'add9', degree: 'Add9' },
        { symbol: `${r}6`, root: r, quality: 'maj', degree: '6th' },
        { symbol: `${r}7#9`, root: r, quality: '7#9', degree: 'Hendrix 7#9' },
      ];
    } else if (paletteTab === 'minors') {
      return [
        { symbol: `${r}m`, root: r, quality: 'm', degree: 'Minor' },
        { symbol: `${r}m7`, root: r, quality: 'm7', degree: 'm7' },
        { symbol: `${r}dim`, root: r, quality: 'dim', degree: 'Dim' },
        { symbol: `${r}m7b5`, root: r, quality: 'm7b5', degree: 'Half-Dim' },
        { symbol: `${r}m6`, root: r, quality: 'm', degree: 'm6' },
        { symbol: `${r}aug`, root: r, quality: 'aug', degree: 'Aug' },
      ];
    }
    return diatonicChords;
  };

  const paletteChords = paletteTab === 'diatonic' ? diatonicChords : getExtendedPaletteChords();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Interactive Chord Progression Builder</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/40">
                  MIDI Synth Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Drag and drop chords onto the timeline to arrange custom backing track structures with dynamic MIDI synth playback.
              </p>
            </div>
          </div>
        </div>

        {/* Preset Selector & Chord Encyclopedia Link */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenChordEncyclopedia && (
            <button
              id="btn-open-encyclopedia-from-builder"
              onClick={onOpenChordEncyclopedia}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Search complex voicings in Chord Encyclopedia"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Chord Encyclopedia</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Presets:
            </span>
            <select
              onChange={(e) => handleLoadPreset(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>
                Load Chord Template...
              </option>
              {PROGRESSION_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.genre})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Progression Meta Bar: Title, Key, Mode, BPM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">Progression Title</label>
          <input
            type="text"
            value={progression.title}
            onChange={(e) => setProgression({ ...progression, title: e.target.value })}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">Key Root</label>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {NOTE_NAMES.map((n) => (
              <button
                key={n}
                onClick={() => setProgression({ ...progression, key: n })}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  progression.key === n
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">Scale / Mode</label>
          <select
            value={progression.scaleMode}
            onChange={(e) =>
              setProgression({
                ...progression,
                scaleMode: e.target.value as CustomChordProgression['scaleMode'],
              })
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none cursor-pointer"
          >
            <option value="Major">Major (Ionian)</option>
            <option value="Minor">Natural Minor (Aeolian)</option>
            <option value="Dorian">Dorian Mode (Funk / Jazz)</option>
            <option value="Mixolydian">Mixolydian Mode (Classic Rock)</option>
            <option value="Blues">Blues Scale Chords</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-400">Tempo: {progression.bpm} BPM</label>
            <button
              onClick={handleTapTempo}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono"
            >
              Tap Tempo
            </button>
          </div>
          <input
            type="range"
            min={50}
            max={200}
            value={progression.bpm}
            onChange={(e) => setProgression({ ...progression, bpm: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Transport & Synth Tone Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-inner">
        {/* Playback Transport */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg cursor-pointer ${
              isPlaying
                ? 'bg-rose-500 hover:bg-rose-600 text-white ring-4 ring-rose-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-4 ring-emerald-500/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play Progression</span>
              </>
            )}
          </button>

          <button
            onClick={handleStop}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Rewind to Bar 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Beat LED Indicator */}
          <div className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">Beat:</span>
            {[0, 1, 2, 3].map((b) => (
              <span
                key={b}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-75 ${
                  isPlaying && currentBeat === b
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] scale-125'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Synth Voice & Accompaniment Engine Settings */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Synth Voice Picker */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 text-[11px]">Synth Voice:</span>
            <select
              value={progression.synthVoice}
              onChange={(e) =>
                setProgression({
                  ...progression,
                  synthVoice: e.target.value as SynthVoiceType,
                })
              }
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="poly-synth" className="bg-slate-900">🎛️ Poly-Synth Pad</option>
              <option value="acoustic-pluck" className="bg-slate-900">🎸 Acoustic Pluck</option>
              <option value="electric-crunch" className="bg-slate-900">⚡ Electric Crunch</option>
              <option value="lofi-keys" className="bg-slate-900">🎹 Lo-Fi Keys</option>
              <option value="ambient-pad" className="bg-slate-900">🌌 Ambient Space</option>
            </select>
          </div>

          {/* Drum Groove */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Disc className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-400 text-[11px]">Drums:</span>
            <select
              value={progression.drumPattern}
              onChange={(e) =>
                setProgression({
                  ...progression,
                  drumPattern: e.target.value as CustomChordProgression['drumPattern'],
                })
              }
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="straight-rock" className="bg-slate-900">Straight Rock 4/4</option>
              <option value="shuffle" className="bg-slate-900">Blues Shuffle</option>
              <option value="funky-break" className="bg-slate-900">Funky Breakbeat</option>
              <option value="smooth-swing" className="bg-slate-900">Smooth Swing</option>
              <option value="none" className="bg-slate-900">Muted (Off)</option>
            </select>
          </div>

          {/* Bass accompaniment toggle */}
          <button
            onClick={() =>
              setProgression((prev) => ({ ...prev, bassEnabled: !prev.bassEnabled }))
            }
            className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
              progression.bassEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            Bassline: {progression.bassEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Timeline Measures & Drop Zone Canvas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>Arrangement Timeline</span>
              <span className="text-amber-400">({progression.chords.length} Bars)</span>
            </h4>
            <span className="text-[11px] text-slate-500">
              Drag chords from palette below or re-order measures
            </span>
          </div>

          <button
            onClick={() =>
              handleAddChordToTimeline({
                root: progression.key,
                quality: 'maj',
                symbol: progression.key,
                degree: 'I',
              })
            }
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Plus className="w-3 h-3" />
            <span>Add Measure</span>
          </button>
        </div>

        {/* Timeline Horizontal / Grid Track */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 min-h-[160px]">
          {progression.chords.map((chord, idx) => {
            const isCurrent = isPlaying && currentBarIndex === idx;
            const isDropTarget = dragOverIndex === idx;

            return (
              <div
                key={chord.id}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, idx)}
                className={`group relative p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-gradient-to-b from-amber-950/30 to-slate-900 border-amber-400 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/40'
                    : isDropTarget
                    ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-400/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Bar Header */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-2">
                  <span className="flex items-center gap-1 font-bold">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCurrent ? 'bg-amber-400 animate-ping' : 'bg-slate-700'
                      }`}
                    />
                    BAR {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex items-center gap-1">
                    {chord.degree && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                        {chord.degree}
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveChord(idx)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 transition-opacity"
                      title="Remove measure"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Main Chord Card (Draggable for re-ordering) */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, chord)}
                  onClick={() => soundEngine.playChordVoicing(chord, progression.synthVoice)}
                  className="py-2 text-center cursor-grab active:cursor-grabbing hover:scale-102 transition-transform"
                >
                  <span className="text-3xl font-black font-mono tracking-tight text-white block">
                    {chord.symbol}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium capitalize mt-0.5 block">
                    {chord.quality === 'maj' ? 'Major' : chord.quality === 'm' ? 'Minor' : chord.quality}
                  </span>
                </div>

                {/* Bar Footer: Duration & Audition */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <button
                    onClick={() => handleToggleChordBeats(idx)}
                    className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono"
                    title="Change measure beats"
                  >
                    {chord.beats} Beats
                  </button>

                  <button
                    onClick={() => soundEngine.playChordVoicing(chord, progression.synthVoice)}
                    className="p-1 rounded bg-slate-800/60 hover:bg-slate-700 text-amber-400 hover:text-amber-300"
                    title="Audition chord"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add Bar Drop Target */}
          <div
            onDragOver={(e) => handleDragOver(e, progression.chords.length)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, progression.chords.length)}
            onClick={() =>
              handleAddChordToTimeline({
                root: progression.key,
                quality: 'maj',
                symbol: progression.key,
                degree: 'I',
              })
            }
            className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 transition-all min-h-[140px] cursor-pointer ${
              dragOverIndex === progression.chords.length
                ? 'border-cyan-400 bg-cyan-950/30'
                : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/40 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Plus className="w-6 h-6 mb-1" />
            <span className="text-xs font-semibold">Drop Chord Here</span>
            <span className="text-[10px] text-slate-500">or click to add</span>
          </div>
        </div>
      </div>

      {/* Interactive Chord Palette & Root Library */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Music className="w-4 h-4 text-amber-400" />
              <span>Diatonic & Extended Chord Palette</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Drag chords onto the timeline above, or click "+" to append to arrangement.
            </p>
          </div>

          {/* Palette Tab Filters */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {CHORD_QUALITY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPaletteTab(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  paletteTab === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* If non-diatonic tab, allow choosing palette root */}
        {paletteTab !== 'diatonic' && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 text-[11px] mr-1">Root:</span>
            {NOTE_NAMES.map((n) => (
              <button
                key={n}
                onClick={() => setPaletteRoot(n)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  paletteRoot === n
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {/* Chord Chips Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {paletteChords.map((chord, i) => (
            <div
              key={`${chord.symbol}-${i}`}
              draggable
              onDragStart={(e) =>
                handleDragStart(e, {
                  id: `drag-${chord.symbol}`,
                  root: chord.root as NoteName,
                  quality: chord.quality,
                  symbol: chord.symbol,
                  degree: chord.degree,
                  beats: 4,
                })
              }
              className="group relative p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/80 transition-all cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-amber-500/5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className="font-mono font-bold text-amber-300">{chord.degree}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEngine.playChordVoicing(
                      {
                        id: 'prev',
                        root: chord.root as NoteName,
                        quality: chord.quality,
                        symbol: chord.symbol,
                        beats: 4,
                      },
                      progression.synthVoice
                    );
                  }}
                  className="p-1 text-slate-500 hover:text-amber-400"
                  title="Audition chord"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              </div>

              <span className="text-xl font-black font-mono text-white tracking-tight my-1 text-center">
                {chord.symbol}
              </span>

              <button
                onClick={() =>
                  handleAddChordToTimeline({
                    root: chord.root as NoteName,
                    quality: chord.quality,
                    symbol: chord.symbol,
                    degree: chord.degree,
                  })
                }
                className="w-full mt-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-2.5 h-2.5" /> Add
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer: Save, Export MIDI, Fretboard Sync, Backing Track */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Progression</span>
          </button>

          {saveToast && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> Saved to Creator Library!
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSyncFretboard && (
            <button
              onClick={handleSyncToFretboard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              title="Practice soloing over this progression on the guitar fretboard"
            >
              <Guitar className="w-3.5 h-3.5" />
              <span>Sync to Guitar Fretboard</span>
            </button>
          )}

          <button
            onClick={handleExportMidi}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            title="Download standard .mid file for Ableton, Logic, or FL Studio"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export MIDI (.mid)</span>
          </button>

          <button
            onClick={handleExportToBackingTrack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500/20 to-amber-500/20 hover:from-rose-500/30 hover:to-amber-500/30 text-white text-xs font-semibold border border-amber-500/30 transition-all cursor-pointer"
          >
            <FileMusic className="w-3.5 h-3.5 text-rose-400" />
            <span>Convert to Backing Track</span>
          </button>
        </div>
      </div>
    </div>
  );
};
