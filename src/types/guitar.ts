export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export interface TuningString {
  stringNumber: number; // 1 to 6 (1 = high E, 6 = low E)
  note: NoteName;
  octave: number;
  frequency: number;
}

export interface GuitarTuning {
  id: string;
  name: string;
  description: string;
  strings: TuningString[]; // from 6 (thickest) to 1 (thinnest)
}

export interface FretboardPosition {
  string: number; // 1 to 6
  fret: number;   // 0 to 24 (0 is open string)
  note: NoteName;
  octave: number;
  frequency: number;
}

export interface ScaleDefinition {
  id: string;
  name: string;
  category: 'Pentatonic' | 'Major/Minor' | 'Modes' | 'Exotic';
  intervals: number[]; // semitone intervals from root
  formula: string;
}

export interface DetectedPitch {
  frequency: number;
  note: NoteName;
  octave: number;
  cents: number; // -50 to +50
  clarity: number; // 0 to 1 confidence
  volume: number; // 0 to 1
  isStandardGuitarRange: boolean;
  closestTargetString?: number;
}

export type ExerciseMode = 'note-finder' | 'scale-runner' | 'ear-training' | 'speed-quiz';

export interface PracticeSession {
  id: string;
  timestamp: number;
  mode: ExerciseMode;
  durationSeconds: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  xpEarned: number;
}

export interface FretMasteryData {
  // key: "string-fret" e.g. "6-5" (Low E 5th fret = A)
  [key: string]: {
    testedCount: number;
    correctCount: number;
    lastTested: number;
  };
}

export interface BackingTrack {
  id: string;
  title: string;
  genre: 'Blues' | 'Rock' | 'Funk' | 'Acoustic' | 'Lo-Fi' | 'Neo-Soul';
  key: NoteName;
  scaleType: string;
  bpm: number;
  chords: string[];
  description: string;
  drumPattern: 'shuffle' | 'straight-rock' | 'funky-break' | 'smooth-swing';
  bassProgression: number[]; // semitone offsets from root
}

export interface SavedLoop {
  id: string;
  title: string;
  createdAt: number;
  durationSeconds: number;
  bpm: number;
  key: string;
  audioBlobUrl?: string;
  notesData?: string;
  tags: string[];
}

export interface MilestonePost {
  id: string;
  author: string;
  avatar: string;
  badge: string;
  title: string;
  content: string;
  timestamp: string;
  likes: number;
  commentsCount: number;
  exerciseScore?: {
    accuracy: number;
    streak: number;
    xp: number;
  };
  hasAudioSample?: boolean;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  tier: 'Virtuoso' | 'Pro Shredder' | 'Member';
  xp: number;
  streakDays: number;
  accuracy: number;
  badge: string;
}

export interface DigitalAsset {
  id: string;
  title: string;
  category: 'Tabs & Loops' | 'Impulse Responses' | 'Backing Tracks' | 'Video Masterclass';
  price: number;
  salesCount: number;
  revenue: number;
  rating: number;
  description: string;
}

export interface TipTransaction {
  id: string;
  supporterName: string;
  amount: number;
  message: string;
  timestamp: string;
}

export interface CreatorStats {
  monthlyRecurringRevenue: number;
  activeSubscribers: number;
  totalTipsReceived: number;
  marketplaceSales: number;
  totalEarnings: number;
  encryptedVaultStatus: 'locked' | 'unlocked' | 'synced';
}

export interface PracticeReminderSettings {
  enabled: boolean;
  time: string; // e.g. "18:00"
  days: string[]; // ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  motivationText: string;
}

export type SynthVoiceType = 'poly-synth' | 'acoustic-pluck' | 'electric-crunch' | 'lofi-keys' | 'ambient-pad';

export interface ProgressionChord {
  id: string;
  root: NoteName;
  quality: string; // 'maj', 'm', '7', 'maj7', 'm7', 'dim', 'sus4', 'sus2', 'add9', 'm7b5'
  symbol: string; // e.g. 'Am', 'Cmaj7', 'G7'
  beats: number; // 2 or 4 beats
  degree?: string; // e.g. 'I', 'ii', 'V', 'vi', 'bVII'
  voicingNotes?: number[]; // semitone intervals from root
  color?: string;
}

export interface CustomChordProgression {
  id: string;
  title: string;
  key: NoteName;
  scaleMode: 'Major' | 'Minor' | 'Dorian' | 'Mixolydian' | 'Blues';
  bpm: number;
  synthVoice: SynthVoiceType;
  drumPattern: 'straight-rock' | 'shuffle' | 'funky-break' | 'smooth-swing' | 'none';
  bassEnabled: boolean;
  drumsEnabled: boolean;
  chords: ProgressionChord[];
  description?: string;
  createdAt: number;
}

export interface OnlineLessonSession {
  id: string;
  studentName: string;
  studentEmail: string;
  scheduledTime: string;
  durationMinutes: number;
  topic: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  key: NoteName;
  scaleId?: string;
  zoomMeetingId?: string;
  zoomMeetingUrl?: string;
  zoomPasscode?: string;
  notes: string;
  homework: string[];
  completed: boolean;
  createdAt: number;
}

export interface LessonChatMessage {
  id: string;
  sender: 'teacher' | 'student' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
  tabSnippet?: string;
}

export interface ChordVoicingFret {
  string: number; // 1 (High E) to 6 (Low E)
  fret: number;   // -1 = muted/x, 0 = open, 1-24 = fretted
  finger?: number; // 1 = Index, 2 = Middle, 3 = Ring, 4 = Pinky, 0/undefined = none, -1 = Thumb (T)
  note?: NoteName;
  interval?: string; // 'R', '3', 'b3', '5', 'b5', '#5', '7', 'b7', '9', 'b9', '#9', '11', '#11', '13', 'b13'
}

export interface ChordVoicing {
  id: string;
  name: string; // e.g. "Root 6 Barre", "Drop 2", "Jimi Hendrix Thumb", "Open Folk", "Shell Voicing"
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';
  description: string;
  baseFret: number; // starting fret range reference
  frets: ChordVoicingFret[]; // all 6 strings from 6 to 1
  formula: string; // e.g. "1 - 3 - 5 - b7 - #9"
  suggestedGenre?: string; // 'Jazz / Bebop', 'Neo-Soul', 'Blues', 'Rock / Funk'
  tags: string[];
}

export interface EncyclopediaChord {
  id: string;
  root: NoteName;
  quality: string; // 'maj', 'm', '7', 'maj7', 'm7', 'm7b5', 'dim7', '7#9', '9', 'maj9', 'm9', '11', '13', 'sus4', 'sus2', 'add9', '7alt', '6/9'
  symbol: string; // e.g. "E7#9", "Cmaj7", "G13", "Dm7b5"
  fullName: string; // e.g. "E Dominant 7th Sharp 9 (Hendrix)", "C Major 7th"
  category: 'Triads & Open' | 'Dominant & Blues' | 'Jazz & Extensions' | 'Neo-Soul & Quartal' | 'Altered & Diminished';
  intervals: number[]; // semitones from root
  formula: string;
  voicings: ChordVoicing[];
}

