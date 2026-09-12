import { EncyclopediaChord, NoteName, ChordVoicing, ChordVoicingFret } from '../types/guitar';
import { NOTE_NAMES, GUITAR_TUNINGS, getFretPosition } from './fretboardUtils';

/**
 * Chord Voicing Generator & Master Encyclopedia
 * Generates and indexes complex guitar voicings across all 12 chromatic roots:
 * - Complex extensions: 7#9 (Hendrix), 13th, 9th, maj9, m9, 11th, m11, 7alt, m7b5 (half-diminished)
 * - Voicing styles: Drop-2, Drop-3, Shell voicings, Thumb-over (Hendrix/Frusciante style), Open folk, Quartal neo-soul
 */

// Helper to shift semitones
export function getTransposedNote(root: NoteName, semitones: number): NoteName {
  const rootIndex = NOTE_NAMES.indexOf(root);
  return NOTE_NAMES[(rootIndex + semitones + 120) % 12];
}

// Chord archetype template
interface ChordArchetype {
  quality: string;
  symbolSuffix: string;
  nameSuffix: string;
  category: EncyclopediaChord['category'];
  intervals: number[];
  formula: string;
  voicingTemplates: {
    name: string;
    difficulty: ChordVoicing['difficulty'];
    description: string;
    formula: string;
    suggestedGenre: string;
    tags: string[];
    // string 6 (Low E) to string 1 (High E): -1 = x, 0 = open, >0 = fret offset from root fret or absolute
    pattern: {
      rootString: number; // 6, 5, or 4
      frets: [number, number, number, number, number, number]; // [s6, s5, s4, s3, s2, s1] relative to root fret
      fingers: [number, number, number, number, number, number];
      intervals: [string, string, string, string, string, string];
    }[];
  }[];
}

export const CHORD_ARCHETYPES: ChordArchetype[] = [
  // 1. Hendrix 7#9 (The Purple Haze Chord)
  {
    quality: '7#9',
    symbolSuffix: '7#9',
    nameSuffix: 'Dominant 7th (#9) Hendrix Chord',
    category: 'Dominant & Blues',
    intervals: [0, 4, 7, 10, 15],
    formula: '1 - 3 - 5 - b7 - #9',
    voicingTemplates: [
      {
        name: 'Root 5 Iconic Hendrix Voicing',
        difficulty: 'Intermediate',
        description: 'The legendary rock & psychedelic voicing pioneered by Jimi Hendrix in "Purple Haze". Root on 5th string with thumb or muted 6th string.',
        formula: '1 - 3 - b7 - #9',
        suggestedGenre: 'Psychedelic Rock / Funk Blues',
        tags: ['Hendrix', 'Funk', 'Rock Lead', 'Dominant Altered'],
        pattern: [
          {
            rootString: 5,
            frets: [-1, 0, -1, 1, 2, -1], // e.g. for E (7th fret A): x-7-6-8-9-x or open E7#9: 0-7-6-7-8-0
            fingers: [0, 2, 1, 3, 4, 0],
            intervals: ['', 'R', '3', 'b7', '#9', ''],
          },
          {
            rootString: 6,
            frets: [0, -1, -1, -2, -1, 0], // Root 6 variant
            fingers: [1, 0, 0, 2, 3, 4],
            intervals: ['R', '', 'b7', '#9', '3', 'R'],
          },
        ],
      },
      {
        name: 'Root 6 Funk Shell 7#9',
        difficulty: 'Advanced',
        description: 'Tight 4-finger funk comping shape with punchy attack and muted outer strings.',
        formula: '1 - b7 - #9',
        suggestedGenre: 'Funk / Fusion',
        tags: ['Funk Comping', 'Shell', 'Steely Dan'],
        pattern: [
          {
            rootString: 6,
            frets: [0, -1, -1, -1, 0, -1],
            fingers: [1, 0, 0, 2, 3, 0],
            intervals: ['R', '', 'b7', '#9', '5', ''],
          },
        ],
      },
    ],
  },

  // 2. Dominant 13th (Jazz & Neo-Soul Staple)
  {
    quality: '13',
    symbolSuffix: '13',
    nameSuffix: 'Dominant 13th',
    category: 'Jazz & Extensions',
    intervals: [0, 4, 7, 10, 14, 21],
    formula: '1 - 3 - 5 - b7 - 9 - 13',
    voicingTemplates: [
      {
        name: 'Root 6 Drop-3 Dominant 13th',
        difficulty: 'Intermediate',
        description: 'Classic Freddy Green & big band jazz rhythm voicing. Root on 6th string, muted 5th, with rich 3rd, b7, and 13 on top.',
        formula: '1 - (x) - b7 - 3 - 13 - (x)',
        suggestedGenre: 'Jazz Bebop / Big Band Swing',
        tags: ['Jazz Rhythm', 'Drop 3', 'Bebop Comping'],
        pattern: [
          {
            rootString: 6,
            frets: [0, -1, 0, 1, 2, -1],
            fingers: [1, 0, 2, 3, 4, 0],
            intervals: ['R', '', 'b7', '3', '13', ''],
          },
        ],
      },
      {
        name: 'Root 5 Modern Neo-Soul 13th',
        difficulty: 'Advanced',
        description: 'Smooth neo-soul & gospel voicing with tight inner voicings and silky high register voice-leading.',
        formula: '1 - 3 - b7 - 9 - 13',
        suggestedGenre: 'Neo-Soul / R&B / Gospel',
        tags: ['Neo-Soul', 'Gospel', 'Lofi Hip-Hop'],
        pattern: [
          {
            rootString: 5,
            frets: [-1, 0, -1, 1, 2, 2],
            fingers: [0, 1, 0, 2, 3, 4],
            intervals: ['', 'R', '3', 'b7', '9', '13'],
          },
        ],
      },
    ],
  },

  // 3. Dominant 9th (Blues & Funk Essential)
  {
    quality: '9',
    symbolSuffix: '9',
    nameSuffix: 'Dominant 9th',
    category: 'Dominant & Blues',
    intervals: [0, 4, 7, 10, 14],
    formula: '1 - 3 - 5 - b7 - 9',
    voicingTemplates: [
      {
        name: 'Root 5 Classic James Brown 9th',
        difficulty: 'Intermediate',
        description: 'The definitive funk chord (James Brown, Prince). Barred across high strings with root on 5th string.',
        formula: '1 - 3 - b7 - 9 - 5',
        suggestedGenre: 'Funk / Blues / Motown',
        tags: ['Funk', 'James Brown', 'Prince', 'Blues Comping'],
        pattern: [
          {
            rootString: 5,
            frets: [-1, 0, -1, 0, 0, 0],
            fingers: [0, 2, 1, 3, 3, 3],
            intervals: ['', 'R', '3', 'b7', '9', '5'],
          },
        ],
      },
      {
        name: 'Root 6 T-Bone Walker Blues 9th',
        difficulty: 'Advanced',
        description: 'Texas blues comping voicing with root on 6th string and singing 9th in upper middle voice.',
        formula: '1 - 3 - b7 - 9 - (x) - (x)',
        suggestedGenre: 'Texas Blues / Swing Blues',
        tags: ['T-Bone Walker', 'Texas Blues'],
        pattern: [
          {
            rootString: 6,
            frets: [0, -1, 0, -1, 0, -1],
            fingers: [2, 0, 1, 3, 4, 0],
            intervals: ['R', '', '3', 'b7', '9', ''],
          },
        ],
      },
    ],
  },

  // 4. Major 9th (Lush Modern Jazz / Neo-Soul)
  {
    quality: 'maj9',
    symbolSuffix: 'maj9',
    nameSuffix: 'Major 9th (Lush Impressionist)',
    category: 'Jazz & Extensions',
    intervals: [0, 4, 7, 11, 14],
    formula: '1 - 3 - 5 - 7 - 9',
    voicingTemplates: [
      {
        name: 'Root 5 Drop-2 Maj9 Voicing',
        difficulty: 'Intermediate',
        description: 'Warm, airy modern jazz voicing popular in contemporary worship, math rock, and neo-soul.',
        formula: '1 - 3 - 7 - 9 - (x)',
        suggestedGenre: 'Neo-Soul / Ambient / Math Rock',
        tags: ['Drop 2', 'Lush', 'Neo-Soul', 'Ambient'],
        pattern: [
          {
            rootString: 5,
            frets: [-1, 0, -1, 1, 0, -1],
            fingers: [0, 1, 0, 3, 2, 0],
            intervals: ['', 'R', '3', '7', '9', ''],
          },
        ],
      },
      {
        name: 'Root 6 Open-Voiced Maj9',
        difficulty: 'Advanced',
        description: 'Wide cinematic spread voicing that rings out beautifully on acoustic and clean electric guitars.',
        formula: '1 - 5 - 7 - 9 - 3 - (x)',
        suggestedGenre: 'Cinematic / Fingerstyle Acoustic',
        tags: ['Fingerstyle', 'Acoustic', 'Cinematic'],
        pattern: [
          {
            rootString: 6,
            frets: [0, -1, -1, 0, 1, 1],
            fingers: [1, 0, 0, 2, 3, 4],
            intervals: ['R', '', '7', '9', '3', '5'],
          },
        ],
      },
    ],
  },

  // 5. Minor 9th (Silky R&B & Bossa Nova)
  {
    quality: 'm9',
    symbolSuffix: 'm9',
    nameSuffix: 'Minor 9th',
    category: 'Neo-Soul & Quartal',
    intervals: [0, 3, 7, 10, 14],
    formula: '1 - b3 - 5 - b7 - 9',
    voicingTemplates: [
      {
        name: 'Root 5 Silky R&B Minor 9th',
        difficulty: 'Intermediate',
        description: 'The golden R&B and Bossa Nova voicing (e.g. Antonio Carlos Jobim, D’Angelo). Barred with sweet color.',
        formula: '1 - b3 - b7 - 9 - 5',
        suggestedGenre: 'Bossa Nova / R&B / Neo-Soul',
        tags: ['Bossa Nova', 'Jobim', 'R&B Ballad'],
        pattern: [
          {
            rootString: 5,
            frets: [-1, 0, -2, 0, 0, -1],
            fingers: [0, 2, 1, 3, 4, 0],
            intervals: ['', 'R', 'b3', 'b7', '9', ''],
          },
        ],
      },
      {
        name: 'Root 6 Modern Minor 9th Drop-3',
        difficulty: 'Advanced',
        description: 'Deep minor jazz sound with punchy root on low E string and clustered 9th and b3 on top.',
        formula: '1 - (x) - b7 - 9 - b3 - (x)',
        suggestedGenre: 'Cool Jazz / Post-Bop',
        tags: ['Drop 3', 'Modern Jazz'],
        pattern: [
          {
            rootString: 6,
            frets: [0, -1, -2, -1, -2, -1],
            fingers: [2, 0, 1, 3, 4, 0],
            intervals: ['R', '', 'b7', '9', 'b3', ''],
          },
        ],
      },
    ],
  },

  // 6. Minor 7th Flat 5 (Half-Diminished / Minor ii-V-i Essential)
  {
    quality: 'm7b5',
    symbolSuffix: 'm7b5',
    nameSuffix: 'Minor 7th Flat 5 (Half-Diminished)',
    category: 'Altered & Diminished',
    intervals: [0, 3, 6, 10],
    formula: '1 - b3 - b5 - b7',
    voicingTemplates: [
      {
        name: 'Root 5 Standard Half-Diminished',
        difficulty: 'Intermediate',
        description: 'Crucial iiø chord for resolving minor ii-V-i jazz progressions (e.g. "Autumn Leaves").',
        formula: '1 - b5 - b7 - b3',
        suggestedGenre: 'Jazz Standards / Bebop / Bossa Nova',
        tags: ['Minor ii-V-I', 'Half Diminished', 'Standards'],
        pattern: [
          {
            rootString: 5,
            frets: [-1, 0, 1, 0, 1, -1],
            fingers: [0, 1, 3, 2, 4, 0],
            intervals: ['', 'R', 'b5', 'b7', 'b3', ''],
          },
        ],
      },
      {
        name: 'Root 6 Gypsy Jazz m7b5',
        difficulty: 'Advanced',
        description: 'Django Reinhardt style Gypsy Jazz shape played with thumb on low E string.',
        formula: '1 - (x) - b5 - b7 - b3 - (x)',
        suggestedGenre: 'Gypsy Jazz / Manouche',
        tags: ['Django Reinhardt', 'Gypsy Jazz'],
        pattern: [
          {
            rootString: 6,
            frets: [0, -1, 0, 0, -1, -1],
            fingers: [-1, 0, 2, 3, 1, 0],
            intervals: ['R', '', 'b5', 'b7', 'b3', ''],
          },
        ],
      },
    ],
  },

  // 7. Altered 7th (7alt / 7b9#9b13 / Jazz Tension)
  {
    quality: '7alt',
    symbolSuffix: '7alt',
    nameSuffix: 'Altered Dominant 7th (Tension & Release)',
    category: 'Altered & Diminished',
    intervals: [0, 4, 8, 10, 13, 15],
    formula: '1 - 3 - (b5/#5) - b7 - (b9/#9)',
    voicingTemplates: [
      {
        name: 'Root 5 7(#9b13) Super-Altered Voicing',
        difficulty: 'Master',
        description: 'The pinnacle of jazz tension chords. Used right before resolving to a tonic minor or major chord.',
        formula: '1 - 3 - b7 - #9 - b13',
        suggestedGenre: 'Modern Jazz / Post-Bop Fusion',
        tags: ['Altered Scale', 'Tension', 'Bebop Turnaround'],
        pattern: [
          {
            rootString: 5,
            frets: [-1, 0, -1, 1, 2, 1],
            fingers: [0, 1, 0, 2, 4, 3],
            intervals: ['', 'R', '3', 'b7', '#9', 'b13'],
          },
        ],
      },
      {
        name: 'Root 6 7b9 Shell Altered',
        difficulty: 'Advanced',
        description: 'Compact 4-note shell voicing with biting minor 9th tension on the 3rd string.',
        formula: '1 - 3 - b7 - b9',
        suggestedGenre: 'Hard Bop / Fusion',
        tags: ['Diminished Sound', 'Tension'],
        pattern: [
          {
            rootString: 6,
            frets: [0, -1, -1, -1, -1, -1],
            fingers: [2, 0, 1, 3, 4, 0],
            intervals: ['R', '', '3', 'b7', 'b9', ''],
          },
        ],
      },
    ],
  },

  // 8. 6/9 Chord (Pentatonic & West Coast Jazz)
  {
    quality: '6/9',
    symbolSuffix: '6/9',
    nameSuffix: 'Major 6/9 (Pentatonic Sweetness)',
    category: 'Jazz & Extensions',
    intervals: [0, 4, 7, 9, 14],
    formula: '1 - 3 - 5 - 6 - 9',
    voicingTemplates: [
      {
        name: 'Root 5 Quintessential 6/9 Voicing',
        difficulty: 'Intermediate',
        description: 'No leading tone 7th makes this chord exceptionally tranquil and sweet. Heard in Wes Montgomery and Bossa endings.',
        formula: '1 - 3 - 6 - 9 - 5',
        suggestedGenre: 'West Coast Cool Jazz / Bossa Nova',
        tags: ['Wes Montgomery', 'Smooth', 'Final Chord'],
        pattern: [
          {
            rootString: 5,
            frets: [-1, 0, -1, -1, 0, 0],
            fingers: [0, 2, 1, 1, 3, 3],
            intervals: ['', 'R', '3', '6', '9', '5'],
          },
        ],
      },
    ],
  },

  // 9. Minor 11th (Modern Neo-Soul & Quartal Harmony)
  {
    quality: 'm11',
    symbolSuffix: 'm11',
    nameSuffix: 'Minor 11th (Quartal Stack)',
    category: 'Neo-Soul & Quartal',
    intervals: [0, 3, 7, 10, 14, 17],
    formula: '1 - b3 - 5 - b7 - 9 - 11',
    voicingTemplates: [
      {
        name: 'Root 6 "So What" Quartal Stack',
        difficulty: 'Advanced',
        description: 'Miles Davis "So What" modal voicing built of stacked perfect 4ths. Extremely airy and floating.',
        formula: '1 - 11 - b7 - b3 - 5',
        suggestedGenre: 'Modal Jazz / Neo-Soul / Math Rock',
        tags: ['So What', 'Quartal', 'Miles Davis', 'Neo-Soul'],
        pattern: [
          {
            rootString: 6,
            frets: [0, 0, 0, -1, -2, -1],
            fingers: [1, 1, 1, 0, 2, 0],
            intervals: ['R', '11', 'b7', 'b3', '5', ''],
          },
        ],
      },
      {
        name: 'Root 5 Neo-Soul Open Minor 11th',
        difficulty: 'Intermediate',
        description: 'Warm fingerstyle chord often used as a lush substitute for standard minor triads.',
        formula: '1 - 5 - b7 - b3 - 11 - (x)',
        suggestedGenre: 'Neo-Soul / Acoustic Folk',
        tags: ['Fingerstyle', 'Neo-Soul'],
        pattern: [
          {
            rootString: 5,
            frets: [-1, 0, 0, 0, 0, -1],
            fingers: [0, 1, 1, 1, 1, 0],
            intervals: ['', 'R', '5', 'b7', 'b3', '11'],
          },
        ],
      },
    ],
  },

  // 10. 7sus4 (Modal & Anthem Suspended)
  {
    quality: '7sus4',
    symbolSuffix: '7sus4',
    nameSuffix: 'Dominant 7th Suspended 4th',
    category: 'Triads & Open',
    intervals: [0, 5, 7, 10],
    formula: '1 - 4 - 5 - b7',
    voicingTemplates: [
      {
        name: 'Root 5 Herbie Hancock Maiden Voyage 7sus4',
        difficulty: 'Intermediate',
        description: 'The foundation of modal jazz ("Maiden Voyage") and classic arena rock anthems.',
        formula: '1 - 4 - b7 - 9',
        suggestedGenre: 'Modal Jazz / Pop Anthem',
        tags: ['Herbie Hancock', 'Suspended', 'Anthem'],
        pattern: [
          {
            rootString: 5,
            frets: [-1, 0, 0, 0, 1, -1],
            fingers: [0, 1, 2, 3, 4, 0],
            intervals: ['', 'R', '4', 'b7', '9', ''],
          },
        ],
      },
    ],
  },

  // 11. Diminished 7th (Symmetric Tension & Passing Chord)
  {
    quality: 'dim7',
    symbolSuffix: 'dim7',
    nameSuffix: 'Full Diminished 7th',
    category: 'Altered & Diminished',
    intervals: [0, 3, 6, 9],
    formula: '1 - b3 - b5 - bb7',
    voicingTemplates: [
      {
        name: 'Root 5 Symmetric Passing Dim7',
        difficulty: 'Intermediate',
        description: 'Symmetric minor-third stacked chord. Moving this shape 3 frets up or down yields an identical chord inversion!',
        formula: '1 - b5 - bb7 - b3',
        suggestedGenre: 'Classical / Jazz / Gypsy Jazz',
        tags: ['Symmetric', 'Passing Chord', 'Inversion Loop'],
        pattern: [
          {
            rootString: 5,
            frets: [-1, 0, 1, -1, 1, -1],
            fingers: [0, 1, 3, 2, 4, 0],
            intervals: ['', 'R', 'b5', 'bb7', 'b3', ''],
          },
        ],
      },
      {
        name: 'Root 6 Drop-2 Diminished 7th',
        difficulty: 'Advanced',
        description: 'Root 6 four-note cluster used heavily for chromatic voice-leading between diatonic chords.',
        formula: '1 - bb7 - b3 - b5',
        suggestedGenre: 'Jazz Swing / Django Reinhardt',
        tags: ['Voice Leading', 'Chromatic'],
        pattern: [
          {
            rootString: 6,
            frets: [0, -1, -1, -1, -2, -1],
            fingers: [2, 0, 1, 3, 4, 0],
            intervals: ['R', '', 'bb7', 'b3', 'b5', ''],
          },
        ],
      },
    ],
  },

  // 12. Major 7th (Essential Impressionist Jazz)
  {
    quality: 'maj7',
    symbolSuffix: 'maj7',
    nameSuffix: 'Major 7th',
    category: 'Jazz & Extensions',
    intervals: [0, 4, 7, 11],
    formula: '1 - 3 - 5 - 7',
    voicingTemplates: [
      {
        name: 'Root 6 Drop-3 Major 7th',
        difficulty: 'Beginner',
        description: 'Classic rich major 7th chord with bass root on low E string and sweet high major 7th.',
        formula: '1 - (x) - 7 - 3 - 5 - (x)',
        suggestedGenre: 'Jazz / Pop / Bossa Nova',
        tags: ['Standard', 'Drop 3', 'Bossa Nova'],
        pattern: [
          {
            rootString: 6,
            frets: [0, -1, -1, -1, -2, -1],
            fingers: [1, 0, 2, 3, 4, 0],
            intervals: ['R', '', '7', '3', '5', ''],
          },
        ],
      },
      {
        name: 'Root 5 Barre Major 7th',
        difficulty: 'Intermediate',
        description: 'Standard A-shape major 7th movable barre chord.',
        formula: '1 - 5 - 7 - 3 - 5',
        suggestedGenre: 'R&B / Soul / Pop',
        tags: ['Barre', 'Movable'],
        pattern: [
          {
            rootString: 5,
            frets: [-1, 0, 2, 1, 2, 0],
            fingers: [0, 1, 3, 2, 4, 1],
            intervals: ['', 'R', '5', '7', '3', '5'],
          },
        ],
      },
    ],
  },
];

/**
 * Calculates fret positions for a given root and root-string
 * in standard tuning (E A D G B E)
 */
function getRootFretOnString(root: NoteName, stringNum: number): number {
  const tuning = GUITAR_TUNINGS[0];
  const stringCfg = tuning.strings.find((s) => s.stringNumber === stringNum);
  if (!stringCfg) return 0;

  const openNoteIdx = NOTE_NAMES.indexOf(stringCfg.note);
  const targetNoteIdx = NOTE_NAMES.indexOf(root);
  const diff = (targetNoteIdx - openNoteIdx + 12) % 12;
  return diff;
}

/**
 * Builds all concrete voicings for a specific root and archetype
 */
export function generateEncyclopediaChord(root: NoteName, archetype: ChordArchetype): EncyclopediaChord {
  const tuning = GUITAR_TUNINGS[0];
  const voicings: ChordVoicing[] = [];

  archetype.voicingTemplates.forEach((template, tIdx) => {
    template.pattern.forEach((pat, pIdx) => {
      let rootFret = getRootFretOnString(root, pat.rootString);
      // If root fret is too low (fret 0 or 1) and template wants negative offset, wrap up an octave (rootFret + 12)
      const minOffset = Math.min(...pat.frets.filter((f) => f >= 0));
      if (rootFret + minOffset < 0 || (rootFret <= 2 && pat.frets.some((f) => f < 0 && rootFret + f < 0))) {
        rootFret += 12;
      }

      // Build 6 strings frets
      const fretsData: ChordVoicingFret[] = [];
      const stringNumbers = [6, 5, 4, 3, 2, 1];

      stringNumbers.forEach((strNum, idx) => {
        const offset = pat.frets[idx];
        const finger = pat.fingers[idx];
        const interval = pat.intervals[idx];

        let fret = -1;
        let noteName: NoteName | undefined = undefined;

        if (offset !== -1) {
          fret = rootFret + offset;
          if (fret >= 0 && fret <= 24) {
            const pos = getFretPosition(strNum, fret, tuning);
            noteName = pos.note;
          } else {
            fret = -1; // out of neck bounds
          }
        }

        fretsData.push({
          string: strNum,
          fret,
          finger: finger !== 0 ? finger : undefined,
          note: noteName,
          interval: interval || undefined,
        });
      });

      // Filter out base fret (minimum fretted string > 0)
      const fretted = fretsData.filter((f) => f.fret > 0).map((f) => f.fret);
      const baseFret = fretted.length > 0 ? Math.min(...fretted) : 1;

      voicings.push({
        id: `${root}-${archetype.quality}-${tIdx}-${pIdx}`,
        name: pat.rootString === 6 ? `${template.name} (Root 6)` : pat.rootString === 5 ? `${template.name} (Root 5)` : template.name,
        difficulty: template.difficulty,
        description: template.description,
        baseFret,
        frets: fretsData,
        formula: template.formula,
        suggestedGenre: template.suggestedGenre,
        tags: template.tags,
      });
    });
  });

  return {
    id: `${root}-${archetype.quality}`,
    root,
    quality: archetype.quality,
    symbol: `${root}${archetype.symbolSuffix}`,
    fullName: `${root} ${archetype.nameSuffix}`,
    category: archetype.category,
    intervals: archetype.intervals,
    formula: archetype.formula,
    voicings,
  };
}

/**
 * Pre-computes the entire comprehensive chord encyclopedia
 */
let cachedEncyclopedia: EncyclopediaChord[] | null = null;

export function getFullChordEncyclopedia(): EncyclopediaChord[] {
  if (cachedEncyclopedia) return cachedEncyclopedia;

  const list: EncyclopediaChord[] = [];
  NOTE_NAMES.forEach((root) => {
    CHORD_ARCHETYPES.forEach((arch) => {
      list.push(generateEncyclopediaChord(root, arch));
    });
  });

  cachedEncyclopedia = list;
  return list;
}
