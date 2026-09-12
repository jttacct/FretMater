import { BackingTrack } from '../types/guitar';

export const BACKING_TRACKS: BackingTrack[] = [
  {
    id: 'blues-a-minor',
    title: 'Slow Chicago Blues in A Minor',
    genre: 'Blues',
    key: 'A',
    scaleType: 'Minor Pentatonic / Blues Scale',
    bpm: 88,
    chords: ['Am7', 'Dm7', 'Am7', 'E7#9'],
    description: 'Classic 12-bar blues shuffle with soulful dynamics. Perfect for practicing expressive string bends and vibrato.',
    drumPattern: 'shuffle',
    bassProgression: [0, 5, 0, 7], // A, D, A, E
  },
  {
    id: 'rock-e-minor',
    title: 'Heavy Arena Rock in E Minor',
    genre: 'Rock',
    key: 'E',
    scaleType: 'Minor Pentatonic / Natural Minor',
    bpm: 115,
    chords: ['Em', 'C', 'G', 'D'],
    description: 'High-energy rock progression with driving 8th-note rhythm and punchy bass. Ideal for speed picking and scale runs.',
    drumPattern: 'straight-rock',
    bassProgression: [0, 8, 3, 10], // E, C, G, D
  },
  {
    id: 'funk-d-dorian',
    title: 'Dorian Funk Jam Groove',
    genre: 'Funk',
    key: 'D',
    scaleType: 'Dorian Mode',
    bpm: 104,
    chords: ['Dm7', 'G7', 'Dm7', 'G7'],
    description: 'Syncopated slap bass with tight hi-hat grooves. The ultimate sandbox for modal improvisation and rhythm chops.',
    drumPattern: 'funky-break',
    bassProgression: [0, 5, 0, 5], // D, G
  },
  {
    id: 'soul-b-minor',
    title: 'Midnight Neo-Soul & R&B',
    genre: 'Neo-Soul',
    key: 'B',
    scaleType: 'Natural Minor / Pentatonic',
    bpm: 82,
    chords: ['Bm9', 'Gmaj7', 'Em9', 'F#7alt'],
    description: 'Warm, lush Rhodes electric piano chords with laid-back drum pocket. Great for double-stops and hammer-ons.',
    drumPattern: 'smooth-swing',
    bassProgression: [0, 8, 5, 7], // B, G, E, F#
  },
  {
    id: 'acoustic-g-major',
    title: 'Golden Sunset Acoustic Jam',
    genre: 'Acoustic',
    key: 'G',
    scaleType: 'Major Pentatonic / Ionian',
    bpm: 96,
    chords: ['G', 'Cadd9', 'Em7', 'Dsus4'],
    description: 'Open airy acoustic strumming vibe with gentle percussion. Perfect for melodic major lines and sweet country bends.',
    drumPattern: 'straight-rock',
    bassProgression: [0, 5, 9, 7], // G, C, E, D
  },
  {
    id: 'lofi-c-major',
    title: 'Rainy Rooftop Lo-Fi Chill Hop',
    genre: 'Lo-Fi',
    key: 'C',
    scaleType: 'Major Scale (Ionian)',
    bpm: 78,
    chords: ['Cmaj7', 'Am7', 'Dm7', 'G7'],
    description: 'Relaxing vintage tape-warmed chords with mellow vinyl dust. Ideal for melodic study and triad voicings.',
    drumPattern: 'smooth-swing',
    bassProgression: [0, 9, 2, 7], // C, A, D, G
  },
];
