import { CustomChordProgression, ProgressionChord } from '../types/guitar';
import { soundEngine } from './soundEngine';
import { noteToMidi } from './fretboardUtils';

/**
 * Encodes variable-length quantity for Standard MIDI Files
 */
function writeVarLen(val: number): number[] {
  const bytes: number[] = [];
  let buffer = val & 0x7f;

  while ((val >>= 7)) {
    buffer <<= 8;
    buffer |= (val & 0x7f) | 0x80;
  }

  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) {
      buffer >>= 8;
    } else {
      break;
    }
  }

  return bytes;
}

/**
 * Generates a Standard MIDI File (Format 0) from a CustomChordProgression
 */
export function generateMidiFile(progression: CustomChordProgression): Blob {
  const PPQ = 480; // Ticks per quarter note
  const bpm = Math.max(40, Math.min(240, progression.bpm || 110));
  const microSecsPerBeat = Math.round(60000000 / bpm);

  const trackEvents: number[] = [];

  // 1. Delta 0: Meta Event: Track Name
  const trackName = progression.title || 'FretMaster Chord Progression';
  const nameBytes = Array.from(new TextEncoder().encode(trackName));
  trackEvents.push(0x00, 0xff, 0x03, nameBytes.length, ...nameBytes);

  // 2. Delta 0: Meta Event: Set Tempo
  trackEvents.push(
    0x00,
    0xff,
    0x51,
    0x03,
    (microSecsPerBeat >> 16) & 0xff,
    (microSecsPerBeat >> 8) & 0xff,
    microSecsPerBeat & 0xff
  );

  // 3. Delta 0: Meta Event: Time Signature (4/4, 24 midi clocks, 8 32nd notes per quarter)
  trackEvents.push(0x00, 0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

  // 4. Note Events for each chord
  progression.chords.forEach((chord) => {
    const chordNotes = soundEngine.getChordMidiNotes(chord);
    const bassNote = noteToMidi(chord.root, 2); // Bass octave
    const durationTicks = Math.round((chord.beats || 4) * PPQ);
    const noteDuration = Math.max(10, durationTicks - 40); // slight staccato gap for articulation

    // Note On for bass note (Channel 0, velocity 84)
    trackEvents.push(...writeVarLen(0), 0x90, bassNote, 84);

    // Note On for chord notes (Channel 0, velocity 78)
    chordNotes.forEach((note) => {
      trackEvents.push(...writeVarLen(0), 0x90, note, 78);
    });

    // Note Off for bass note after noteDuration ticks
    trackEvents.push(...writeVarLen(noteDuration), 0x80, bassNote, 0);

    // Note Off for remaining chord notes (delta 0)
    chordNotes.forEach((note) => {
      trackEvents.push(...writeVarLen(0), 0x80, note, 0);
    });

    // Remaining gap before next chord
    const gap = durationTicks - noteDuration;
    if (gap > 0) {
      // Dummy controller or next delta will handle it
    }
  });

  // End of Track meta event with small 1-beat tail
  trackEvents.push(...writeVarLen(PPQ), 0xff, 0x2f, 0x00);

  // Build full SMF byte buffer
  // Header chunk: "MThd", length=6, format=0, tracks=1, division=PPQ
  const header = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // length 6
    0x00, 0x00,             // format 0
    0x00, 0x01,             // 1 track
    (PPQ >> 8) & 0xff, PPQ & 0xff // 480 PPQ
  ];

  // Track chunk: "MTrk", length (4 bytes), trackEvents
  const trackLen = trackEvents.length;
  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    (trackLen >> 24) & 0xff,
    (trackLen >> 16) & 0xff,
    (trackLen >> 8) & 0xff,
    trackLen & 0xff
  ];

  const fullMidiBytes = new Uint8Array([...header, ...trackHeader, ...trackEvents]);
  return new Blob([fullMidiBytes], { type: 'audio/midi' });
}

/**
 * Downloads a progression as a .mid file
 */
export function downloadProgressionMidi(progression: CustomChordProgression): void {
  const blob = generateMidiFile(progression);
  const cleanName = (progression.title || 'chord-progression')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanName}.mid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
