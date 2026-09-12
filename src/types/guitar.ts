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
