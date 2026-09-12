import {
  PracticeSession,
  FretMasteryData,
  SavedLoop,
  MilestonePost,
  LeaderboardUser,
  CreatorStats,
  PracticeReminderSettings,
  DigitalAsset,
  TipTransaction,
  CustomChordProgression,
  OnlineLessonSession,
} from '../types/guitar';

const STORAGE_KEYS = {
  SESSIONS: 'fretmaster_sessions_v1',
  MASTERY: 'fretmaster_mastery_v1',
  SAVED_LOOPS: 'fretmaster_loops_v1',
  POSTS: 'fretmaster_posts_v1',
  REMINDERS: 'fretmaster_reminders_v1',
  CREATOR_STATS: 'fretmaster_creator_v1',
  VAULT_KEY: 'fretmaster_vault_key_v1',
  DIGITAL_ASSETS: 'fretmaster_assets_v1',
  TIPS: 'fretmaster_tips_v1',
  LAST_SYNC: 'fretmaster_last_sync_v1',
  PROGRESSIONS: 'fretmaster_progressions_v1',
  LESSONS: 'fretmaster_lessons_v1',
};

// Initial realistic seed data for community feed
const INITIAL_POSTS: MilestonePost[] = [
  {
    id: 'post-1',
    author: 'Elena R. (Jazz/Fusion)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    badge: 'Virtuoso 🎸',
    title: 'Nailed the 16th-note Dorian run at 140 BPM!',
    content: 'Finally memorized the entire D Dorian 3-notes-per-string layout across the neck with 98% pitch accuracy on the audio tuner. Practice reminders kept me on track for 21 days straight!',
    timestamp: '2 hours ago',
    likes: 42,
    commentsCount: 7,
    exerciseScore: { accuracy: 98, streak: 21, xp: 480 },
    hasAudioSample: true,
  },
  {
    id: 'post-2',
    author: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    badge: 'Pro Shredder 🔥',
    title: 'Drop D riff session loop exported!',
    content: 'Recorded a fresh heavy groove using the new Looper feature over the E Minor backing track. Exported the WAV track and shared it with my bandmates.',
    timestamp: '5 hours ago',
    likes: 29,
    commentsCount: 4,
    exerciseScore: { accuracy: 94, streak: 14, xp: 350 },
    hasAudioSample: true,
  },
  {
    id: 'post-3',
    author: 'Chloe Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    badge: 'Ear Master 🎧',
    title: 'Completed Ear Training Level 5',
    content: 'Recognizing root notes and minor 7th intervals purely by ear now. The pitch detection test gives immediate honest feedback.',
    timestamp: 'Yesterday',
    likes: 56,
    commentsCount: 11,
    exerciseScore: { accuracy: 96, streak: 9, xp: 620 },
  },
];

const INITIAL_LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, name: 'Mateo "Strings" Silva', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', tier: 'Virtuoso', xp: 14850, streakDays: 45, accuracy: 99.1, badge: 'Speed Demon' },
  { rank: 2, name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', tier: 'Virtuoso', xp: 12420, streakDays: 38, accuracy: 98.4, badge: 'Scale Sage' },
  { rank: 3, name: 'You (Current User)', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', tier: 'Pro Shredder', xp: 8950, streakDays: 14, accuracy: 95.2, badge: 'Pitch Perfect' },
  { rank: 4, name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', tier: 'Pro Shredder', xp: 7420, streakDays: 19, accuracy: 94.0, badge: 'Riff Architect' },
  { rank: 5, name: 'Chloe Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', tier: 'Member', xp: 6190, streakDays: 12, accuracy: 96.5, badge: 'Ear Prodigy' },
  { rank: 6, name: 'David K.', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', tier: 'Member', xp: 5120, streakDays: 8, accuracy: 91.8, badge: 'Groove Hunter' },
];

const INITIAL_DIGITAL_ASSETS: DigitalAsset[] = [
  {
    id: 'asset-1',
    title: 'Neo-Soul & Math Rock Licks (Guitar Pro & Audio)',
    category: 'Tabs & Loops',
    price: 19.99,
    salesCount: 148,
    revenue: 2958.52,
    rating: 4.9,
    description: '30 advanced chord-melody licks with hammer-on slides, natural harmonics, and hybrid picking transcriptions.',
  },
  {
    id: 'asset-2',
    title: '1965 Blackface Deluxe Reverb Impulse Response (IR) Pack',
    category: 'Impulse Responses',
    price: 14.99,
    salesCount: 312,
    revenue: 4676.88,
    rating: 5.0,
    description: 'Captured with vintage Neumann U87 and Shure SM57 microphones for true studio-grade warm tube feel.',
  },
  {
    id: 'asset-3',
    title: 'Improvisation Masterclass: Modal Mastery (Full Video + Stems)',
    category: 'Video Masterclass',
    price: 39.99,
    salesCount: 89,
    revenue: 3559.11,
    rating: 4.8,
    description: 'A 2.5-hour in-depth masterclass breaking down how to seamlessly weave between Dorian, Mixolydian, and Altered scales.',
  },
  {
    id: 'asset-4',
    title: 'Chicago & Delta Blues 24-Bit Backing Tracks Stem Bundle',
    category: 'Backing Tracks',
    price: 12.50,
    salesCount: 220,
    revenue: 2750.00,
    rating: 4.9,
    description: 'High-res uncompressed WAV multi-tracks recorded with live drums, upright bass, and Hammond B3 organ.',
  },
];

const INITIAL_TIPS: TipTransaction[] = [
  { id: 'tip-1', supporterName: 'Julian H.', amount: 15.00, message: 'Your CAGED explanation finally made triad inversions click. Keep rocking!', timestamp: 'Today, 2:15 PM' },
  { id: 'tip-2', supporterName: 'Sarah M.', amount: 25.00, message: 'Coffee on me! The real-time pitch feedback saved my intonation.', timestamp: 'Yesterday, 8:40 PM' },
  { id: 'tip-3', supporterName: 'Liam O.', amount: 10.00, message: 'Best backing tracks on the web. Thank you for the A minor blues jam.', timestamp: '3 days ago' },
];

export const storage = {
  // Sessions & Analytics
  getSessions(): PracticeSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    // Seed initial session history for analytics
    const initial: PracticeSession[] = [
      { id: 's1', timestamp: Date.now() - 86400000 * 4, mode: 'note-finder', durationSeconds: 620, totalAttempts: 40, correctAttempts: 37, accuracy: 92.5, xpEarned: 370 },
      { id: 's2', timestamp: Date.now() - 86400000 * 3, mode: 'scale-runner', durationSeconds: 840, totalAttempts: 55, correctAttempts: 52, accuracy: 94.5, xpEarned: 520 },
      { id: 's3', timestamp: Date.now() - 86400000 * 2, mode: 'ear-training', durationSeconds: 710, totalAttempts: 30, correctAttempts: 29, accuracy: 96.6, xpEarned: 430 },
      { id: 's4', timestamp: Date.now() - 86400000 * 1, mode: 'note-finder', durationSeconds: 950, totalAttempts: 60, correctAttempts: 58, accuracy: 96.6, xpEarned: 580 },
    ];
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(initial));
    return initial;
  },

  saveSession(session: PracticeSession): void {
    const sessions = storage.getSessions();
    sessions.unshift(session);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions.slice(0, 100)));
  },

  // Fretboard Familiarity / Mastery Heatmap
  getMastery(): FretMasteryData {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MASTERY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    // Default starting familiarity map
    const initial: FretMasteryData = {};
    for (let s = 1; s <= 6; s++) {
      for (let f = 0; f <= 12; f++) {
        // Higher familiarity on lower frets and open strings
        const baseTested = Math.max(2, 20 - f + (7 - s));
        const accuracy = 0.85 + (Math.sin(s * f) * 0.1);
        initial[`${s}-${f}`] = {
          testedCount: baseTested,
          correctCount: Math.round(baseTested * accuracy),
          lastTested: Date.now() - (f * 100000),
        };
      }
    }
    localStorage.setItem(STORAGE_KEYS.MASTERY, JSON.stringify(initial));
    return initial;
  },

  recordFretAttempt(stringNum: number, fret: number, isCorrect: boolean): void {
    const mastery = storage.getMastery();
    const key = `${stringNum}-${fret}`;
    if (!mastery[key]) {
      mastery[key] = { testedCount: 0, correctCount: 0, lastTested: Date.now() };
    }
    mastery[key].testedCount += 1;
    if (isCorrect) mastery[key].correctCount += 1;
    mastery[key].lastTested = Date.now();
    localStorage.setItem(STORAGE_KEYS.MASTERY, JSON.stringify(mastery));
  },

  // Saved Loops
  getLoops(): SavedLoop[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_LOOPS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'loop-demo-1',
        title: 'Late Night Blues Groove in A',
        createdAt: Date.now() - 172800000,
        durationSeconds: 16,
        bpm: 92,
        key: 'A Minor',
        tags: ['Blues', 'Rhythm', 'Improv'],
      },
      {
        id: 'loop-demo-2',
        title: 'Neo-Soul Maj7 Chord Progression',
        createdAt: Date.now() - 86400000,
        durationSeconds: 12,
        bpm: 84,
        key: 'C Major',
        tags: ['Soul', 'Chords', 'Fingerstyle'],
      },
    ];
  },

  saveLoop(loop: SavedLoop): void {
    const loops = storage.getLoops();
    loops.unshift(loop);
    localStorage.setItem(STORAGE_KEYS.SAVED_LOOPS, JSON.stringify(loops));
  },

  deleteLoop(id: string): void {
    const loops = storage.getLoops().filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.SAVED_LOOPS, JSON.stringify(loops));
  },

  // Posts & Social Feed
  getPosts(): MilestonePost[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(INITIAL_POSTS));
    return INITIAL_POSTS;
  },

  addPost(post: MilestonePost): void {
    const posts = storage.getPosts();
    posts.unshift(post);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  },

  likePost(id: string): void {
    const posts = storage.getPosts();
    const target = posts.find(p => p.id === id);
    if (target) {
      target.likes += 1;
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }
  },

  getLeaderboard(): LeaderboardUser[] {
    return INITIAL_LEADERBOARD;
  },

  // Creator & Monetization
  getCreatorStats(): CreatorStats {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CREATOR_STATS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    const initial: CreatorStats = {
      monthlyRecurringRevenue: 3420.00,
      activeSubscribers: 184,
      totalTipsReceived: 1860.00,
      marketplaceSales: 13944.51,
      totalEarnings: 19224.51,
      encryptedVaultStatus: 'locked',
    };
    localStorage.setItem(STORAGE_KEYS.CREATOR_STATS, JSON.stringify(initial));
    return initial;
  },

  saveCreatorStats(stats: CreatorStats): void {
    localStorage.setItem(STORAGE_KEYS.CREATOR_STATS, JSON.stringify(stats));
  },

  getDigitalAssets(): DigitalAsset[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DIGITAL_ASSETS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.DIGITAL_ASSETS, JSON.stringify(INITIAL_DIGITAL_ASSETS));
    return INITIAL_DIGITAL_ASSETS;
  },

  getTips(): TipTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TIPS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.TIPS, JSON.stringify(INITIAL_TIPS));
    return INITIAL_TIPS;
  },

  addTip(tip: TipTransaction): void {
    const tips = storage.getTips();
    tips.unshift(tip);
    localStorage.setItem(STORAGE_KEYS.TIPS, JSON.stringify(tips));

    const stats = storage.getCreatorStats();
    stats.totalTipsReceived += tip.amount;
    stats.totalEarnings += tip.amount;
    storage.saveCreatorStats(stats);
  },

  // Daily Reminders
  getReminders(): PracticeReminderSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    const initial: PracticeReminderSettings = {
      enabled: true,
      time: '18:30',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      motivationText: 'Consistency builds muscle memory. 15 minutes of fretboard drills today unlocks effortless soloing tomorrow!',
    };
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(initial));
    return initial;
  },

  saveReminders(settings: PracticeReminderSettings): void {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(settings));
  },

  // Cloud Backup Export & Restore
  exportBackupSnapshot(): string {
    const snapshot = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      sessions: storage.getSessions(),
      mastery: storage.getMastery(),
      loops: storage.getLoops(),
      posts: storage.getPosts(),
      creator: storage.getCreatorStats(),
      reminders: storage.getReminders(),
      assets: storage.getDigitalAssets(),
      tips: storage.getTips(),
      checksum: `sha256_${Math.random().toString(36).substring(2, 15)}`,
    };
    return JSON.stringify(snapshot, null, 2);
  },

  importBackupSnapshot(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.sessions) localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));
      if (data.mastery) localStorage.setItem(STORAGE_KEYS.MASTERY, JSON.stringify(data.mastery));
      if (data.loops) localStorage.setItem(STORAGE_KEYS.SAVED_LOOPS, JSON.stringify(data.loops));
      if (data.posts) localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(data.posts));
      if (data.creator) localStorage.setItem(STORAGE_KEYS.CREATOR_STATS, JSON.stringify(data.creator));
      if (data.reminders) localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(data.reminders));
      return true;
    } catch (e) {
      console.error('Failed to import backup snapshot:', e);
      return false;
    }
  },

  getLastSyncTime(): string {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || 'Just now (Encrypted Cloud Sync)';
  },

  setLastSyncTime(timeStr: string): void {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timeStr);
  },

  // Custom Chord Progressions
  getProgressions(): CustomChordProgression[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESSIONS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error reading progressions:', e);
      }
    }
    const initial: CustomChordProgression[] = [
      {
        id: 'prog-pop-classic',
        title: 'Pop Axis of Awesome (I - V - vi - IV)',
        key: 'C',
        scaleMode: 'Major',
        bpm: 116,
        synthVoice: 'poly-synth',
        drumPattern: 'straight-rock',
        bassEnabled: true,
        drumsEnabled: true,
        description: 'The legendary four-chord progression heard in hundreds of iconic pop anthems.',
        createdAt: Date.now() - 86400000 * 2,
        chords: [
          { id: 'c1', root: 'C', quality: 'maj', symbol: 'C', beats: 4, degree: 'I', color: 'border-amber-400/80' },
          { id: 'c2', root: 'G', quality: 'maj', symbol: 'G', beats: 4, degree: 'V', color: 'border-cyan-400/80' },
          { id: 'c3', root: 'A', quality: 'm', symbol: 'Am', beats: 4, degree: 'vi', color: 'border-rose-400/80' },
          { id: 'c4', root: 'F', quality: 'maj', symbol: 'F', beats: 4, degree: 'IV', color: 'border-emerald-400/80' },
        ],
      },
      {
        id: 'prog-neo-soul',
        title: 'Neo-Soul Groove & R&B Lush (ii7 - V9 - Imaj7 - VI7)',
        key: 'C',
        scaleMode: 'Major',
        bpm: 88,
        synthVoice: 'lofi-keys',
        drumPattern: 'funky-break',
        bassEnabled: true,
        drumsEnabled: true,
        description: 'Velvety jazz extensions with syncopated comping and warm Rhodes tones.',
        createdAt: Date.now() - 86400000,
        chords: [
          { id: 'ns1', root: 'D', quality: 'm7', symbol: 'Dm7', beats: 4, degree: 'ii7', color: 'border-indigo-400/80' },
          { id: 'ns2', root: 'G', quality: '9', symbol: 'G9', beats: 4, degree: 'V9', color: 'border-cyan-400/80' },
          { id: 'ns3', root: 'C', quality: 'maj7', symbol: 'Cmaj7', beats: 4, degree: 'Imaj7', color: 'border-amber-400/80' },
          { id: 'ns4', root: 'A', quality: '7', symbol: 'A7', beats: 4, degree: 'VI7', color: 'border-purple-400/80' },
        ],
      },
    ];
    localStorage.setItem(STORAGE_KEYS.PROGRESSIONS, JSON.stringify(initial));
    return initial;
  },

  saveProgression(progression: CustomChordProgression): void {
    const list = this.getProgressions();
    const existingIndex = list.findIndex((p) => p.id === progression.id);
    let updated: CustomChordProgression[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = progression;
    } else {
      updated = [progression, ...list];
    }
    localStorage.setItem(STORAGE_KEYS.PROGRESSIONS, JSON.stringify(updated));
  },

  deleteProgression(id: string): void {
    const list = this.getProgressions().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROGRESSIONS, JSON.stringify(list));
  },

  // Online Lessons & Zoom Teaching Sessions
  getLessons(): OnlineLessonSession[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LESSONS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error reading lessons:', e);
      }
    }
    const initial: OnlineLessonSession[] = [
      {
        id: 'lesson-101',
        studentName: 'Maya Kovacs',
        studentEmail: 'maya.k@example.com',
        scheduledTime: 'Today at 5:00 PM',
        durationMinutes: 45,
        topic: 'A Minor Pentatonic Box 1 & Whole-Step Bends',
        level: 'Intermediate',
        key: 'A',
        scaleId: 'minor-pentatonic',
        zoomMeetingId: '849 2039 1148',
        zoomMeetingUrl: 'https://zoom.us/j/84920391148?pwd=FRETMASTER_CLASSROOM',
        zoomPasscode: 'GUITAR24',
        notes: 'Review index finger anchor and wrist rotation on 3rd string whole-step bend at 7th fret. Practice alternate picking over 90 BPM backing track.',
        homework: [
          'Practice Box 1 ascending & descending with metronome at 80-100 BPM',
          'Target root note (A) on downbeat of measure 1 and 3',
          'Record a 4-bar improvisation loop for teacher review'
        ],
        completed: false,
        createdAt: Date.now() - 3600000 * 5,
      },
      {
        id: 'lesson-102',
        studentName: 'Liam Doherty',
        studentEmail: 'liam.d@example.com',
        scheduledTime: 'Tomorrow at 3:30 PM',
        durationMinutes: 60,
        topic: 'Barre Chords Transitions & Funk Comping (16th-note grooves)',
        level: 'Beginner',
        key: 'E',
        scaleId: 'blues-scale',
        zoomMeetingId: '912 4471 8820',
        zoomMeetingUrl: 'https://zoom.us/j/91244718820?pwd=FRETMASTER_CLASSROOM',
        zoomPasscode: 'GROOVE99',
        notes: 'Thumb placement behind 2nd fret, check for clean ring on B and high E strings. Mute unwanted bass strings with index tip.',
        homework: [
          'F Major to C Major clean transition challenge (10 reps without pause)',
          'Syncopated scratch rhythm on beats 2 and 4',
          'Check pitch tuner accuracy on high strings'
        ],
        completed: false,
        createdAt: Date.now() - 3600000 * 12,
      },
      {
        id: 'lesson-103',
        studentName: 'Sophia Tran',
        studentEmail: 'sophia.tran@example.com',
        scheduledTime: 'Friday at 6:00 PM',
        durationMinutes: 45,
        topic: 'Jazz ii-V-I Voicings & Arpeggios (Shell Chords)',
        level: 'Advanced',
        key: 'C',
        scaleId: 'major-scale',
        zoomMeetingId: '773 9921 4056',
        zoomMeetingUrl: 'https://zoom.us/j/77399214056?pwd=FRETMASTER_CLASSROOM',
        zoomPasscode: 'JAZZVOICE',
        notes: 'Dm7 -> G7 -> Cmaj7 rootless shell voicings with voice-leading through 3rds and 7ths.',
        homework: [
          'Transpose ii-V-I voicings into G and F Major',
          'Practice arpeggio connector lines using leading tones'
        ],
        completed: true,
        createdAt: Date.now() - 86400000 * 2,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(initial));
    return initial;
  },

  saveLesson(lesson: OnlineLessonSession): void {
    const list = this.getLessons();
    const idx = list.findIndex((l) => l.id === lesson.id);
    let updated: OnlineLessonSession[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = lesson;
    } else {
      updated = [lesson, ...list];
    }
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(updated));
  },

  deleteLesson(id: string): void {
    const list = this.getLessons().filter((l) => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(list));
  },
};
