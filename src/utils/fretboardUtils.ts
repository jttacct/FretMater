import { NoteName, GuitarTuning, ScaleDefinition, FretboardPosition } from '../types/guitar';

export const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// MIDI note 69 is A4 (440 Hz)
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteToMidi(note: NoteName, octave: number): number {
  const noteIndex = NOTE_NAMES.indexOf(note);
  return (octave + 1) * 12 + noteIndex;
}

export function frequencyToNoteData(frequency: number): {
  note: NoteName;
  octave: number;
  cents: number;
  midi: number;
} {
  // A4 = 440 Hz = MIDI 69
  const exactMidi = 69 + 12 * Math.log2(frequency / 440);
  const roundedMidi = Math.round(exactMidi);
  const cents = Math.round((exactMidi - roundedMidi) * 100);

  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;

  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    cents,
    midi: roundedMidi,
  };
}

export const GUITAR_TUNINGS: GuitarTuning[] = [
  {
    id: 'standard',
    name: 'Standard (E A D G B E)',
    description: 'Most common guitar tuning worldwide.',
    strings: [
      { stringNumber: 6, note: 'E', octave: 2, frequency: midiToFrequency(noteToMidi('E', 2)) }, // 82.41 Hz
      { stringNumber: 5, note: 'A', octave: 2, frequency: midiToFrequency(noteToMidi('A', 2)) }, // 110.00 Hz
      { stringNumber: 4, note: 'D', octave: 3, frequency: midiToFrequency(noteToMidi('D', 3)) }, // 146.83 Hz
      { stringNumber: 3, note: 'G', octave: 3, frequency: midiToFrequency(noteToMidi('G', 3)) }, // 196.00 Hz
      { stringNumber: 2, note: 'B', octave: 3, frequency: midiToFrequency(noteToMidi('B', 3)) }, // 246.94 Hz
      { stringNumber: 1, note: 'E', octave: 4, frequency: midiToFrequency(noteToMidi('E', 4)) }, // 329.63 Hz
    ],
  },
  {
    id: 'drop-d',
    name: 'Drop D (D A D G B E)',
    description: 'Low 6th string dropped to D for heavy riffs and power chords.',
    strings: [
      { stringNumber: 6, note: 'D', octave: 2, frequency: midiToFrequency(noteToMidi('D', 2)) },
      { stringNumber: 5, note: 'A', octave: 2, frequency: midiToFrequency(noteToMidi('A', 2)) },
      { stringNumber: 4, note: 'D', octave: 3, frequency: midiToFrequency(noteToMidi('D', 3)) },
      { stringNumber: 3, note: 'G', octave: 3, frequency: midiToFrequency(noteToMidi('G', 3)) },
      { stringNumber: 2, note: 'B', octave: 3, frequency: midiToFrequency(noteToMidi('B', 3)) },
      { stringNumber: 1, note: 'E', octave: 4, frequency: midiToFrequency(noteToMidi('E', 4)) },
    ],
  },
  {
    id: 'dadgad',
    name: 'DADGAD (Celtic / Folk)',
    description: 'Modal tuning beloved in Celtic, acoustic fingerstyle, and Led Zeppelin.',
    strings: [
      { stringNumber: 6, note: 'D', octave: 2, frequency: midiToFrequency(noteToMidi('D', 2)) },
      { stringNumber: 5, note: 'A', octave: 2, frequency: midiToFrequency(noteToMidi('A', 2)) },
      { stringNumber: 4, note: 'D', octave: 3, frequency: midiToFrequency(noteToMidi('D', 3)) },
      { stringNumber: 3, note: 'G', octave: 3, frequency: midiToFrequency(noteToMidi('G', 3)) },
      { stringNumber: 2, note: 'A', octave: 3, frequency: midiToFrequency(noteToMidi('A', 3)) },
      { stringNumber: 1, note: 'D', octave: 4, frequency: midiToFrequency(noteToMidi('D', 4)) },
    ],
  },
  {
    id: 'half-step-down',
    name: 'Half-Step Down (Eb Ab Db Gb Bb Eb)',
    description: 'Used by Jimi Hendrix, Stevie Ray Vaughan, Guns N Roses, and Nirvana.',
    strings: [
      { stringNumber: 6, note: 'D#', octave: 2, frequency: midiToFrequency(noteToMidi('D#', 2)) },
      { stringNumber: 5, note: 'G#', octave: 2, frequency: midiToFrequency(noteToMidi('G#', 2)) },
      { stringNumber: 4, note: 'C#', octave: 3, frequency: midiToFrequency(noteToMidi('C#', 3)) },
      { stringNumber: 3, note: 'F#', octave: 3, frequency: midiToFrequency(noteToMidi('F#', 3)) },
      { stringNumber: 2, note: 'A#', octave: 3, frequency: midiToFrequency(noteToMidi('A#', 3)) },
      { stringNumber: 1, note: 'D#', octave: 4, frequency: midiToFrequency(noteToMidi('D#', 4)) },
    ],
  },
  {
    id: 'open-g',
    name: 'Open G (D G D G B D)',
    description: 'Classic Rolling Stones (Keith Richards) and blues slide tuning.',
    strings: [
      { stringNumber: 6, note: 'D', octave: 2, frequency: midiToFrequency(noteToMidi('D', 2)) },
      { stringNumber: 5, note: 'G', octave: 2, frequency: midiToFrequency(noteToMidi('G', 2)) },
      { stringNumber: 4, note: 'D', octave: 3, frequency: midiToFrequency(noteToMidi('D', 3)) },
      { stringNumber: 3, note: 'G', octave: 3, frequency: midiToFrequency(noteToMidi('G', 3)) },
      { stringNumber: 2, note: 'B', octave: 3, frequency: midiToFrequency(noteToMidi('B', 3)) },
      { stringNumber: 1, note: 'D', octave: 4, frequency: midiToFrequency(noteToMidi('D', 4)) },
    ],
  },
];

export const SCALES: ScaleDefinition[] = [
  {
    id: 'minor-pentatonic',
    name: 'Minor Pentatonic',
    category: 'Pentatonic',
    intervals: [0, 3, 5, 7, 10],
    formula: '1 - b3 - 4 - 5 - b7',
  },
  {
    id: 'blues-scale',
    name: 'Blues Scale',
    category: 'Pentatonic',
    intervals: [0, 3, 5, 6, 7, 10],
    formula: '1 - b3 - 4 - b5 - 5 - b7',
  },
  {
    id: 'major-pentatonic',
    name: 'Major Pentatonic',
    category: 'Pentatonic',
    intervals: [0, 2, 4, 7, 9],
    formula: '1 - 2 - 3 - 5 - 6',
  },
  {
    id: 'natural-minor',
    name: 'Natural Minor (Aeolian)',
    category: 'Major/Minor',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    formula: '1 - 2 - b3 - 4 - 5 - b6 - b7',
  },
  {
    id: 'major-scale',
    name: 'Major Scale (Ionian)',
    category: 'Major/Minor',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    formula: '1 - 2 - 3 - 4 - 5 - 6 - 7',
  },
  {
    id: 'dorian',
    name: 'Dorian Mode',
    category: 'Modes',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    formula: '1 - 2 - b3 - 4 - 5 - 6 - b7',
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian Mode',
    category: 'Modes',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    formula: '1 - 2 - 3 - 4 - 5 - 6 - b7',
  },
  {
    id: 'harmonic-minor',
    name: 'Harmonic Minor',
    category: 'Exotic',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    formula: '1 - 2 - b3 - 4 - 5 - b6 - 7',
  },
];

// Returns note information for every string and fret on the guitar
export function getFretPosition(
  stringNum: number,
  fret: number,
  tuning: GuitarTuning = GUITAR_TUNINGS[0]
): FretboardPosition {
  const stringConfig = tuning.strings.find(s => s.stringNumber === stringNum) || tuning.strings[0];
  const openMidi = noteToMidi(stringConfig.note, stringConfig.octave);
  const currentMidi = openMidi + fret;
  
  const noteIndex = ((currentMidi % 12) + 12) % 12;
  const octave = Math.floor(currentMidi / 12) - 1;
  const frequency = midiToFrequency(currentMidi);

  return {
    string: stringNum,
    fret,
    note: NOTE_NAMES[noteIndex],
    octave,
    frequency,
  };
}

// Check if a note is in a scale given root note and scale definition
export function isNoteInScale(
  note: NoteName,
  rootNote: NoteName,
  scale: ScaleDefinition
): { inScale: boolean; isRoot: boolean; intervalIndex: number } {
  const rootIndex = NOTE_NAMES.indexOf(rootNote);
  const noteIndex = NOTE_NAMES.indexOf(note);
  const semitoneDistance = (noteIndex - rootIndex + 12) % 12;

  const intervalIndex = scale.intervals.indexOf(semitoneDistance);
  return {
    inScale: intervalIndex !== -1,
    isRoot: semitoneDistance === 0,
    intervalIndex,
  };
}

// Traditional fretboard inlay markers (single dot at 3, 5, 7, 9, 15, 17, 19, 21; double at 12, 24)
export function getFretMarkerType(fret: number): 'none' | 'single' | 'double' {
  if (fret === 12 || fret === 24) return 'double';
  if ([3, 5, 7, 9, 15, 17, 19, 21].includes(fret)) return 'single';
  return 'none';
}
