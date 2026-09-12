import { BackingTrack, NoteName, CustomChordProgression, ProgressionChord, SynthVoiceType, ChordVoicing } from '../types/guitar';
import { midiToFrequency, noteToMidi, NOTE_NAMES, GUITAR_TUNINGS, getFretPosition } from './fretboardUtils';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isBackingTrackPlaying: boolean = false;
  private currentTrack: BackingTrack | null = null;
  private bpm: number = 100;
  private timerId: number | null = null;
  private currentStep: number = 0;

  // Custom Progression Synth Playback state
  private isProgressionPlaying: boolean = false;
  private progressionTimerId: number | null = null;
  private activeProgression: CustomChordProgression | null = null;
  private progressionStep: number = 0;

  // Mixer gains
  public masterGain: GainNode | null = null;
  public drumsGain: GainNode | null = null;
  public bassGain: GainNode | null = null;
  public chordGain: GainNode | null = null;

  // Volumes (0 to 1)
  public masterVolume: number = 0.8;
  public drumsVolume: number = 0.7;
  public bassVolume: number = 0.8;
  public chordsVolume: number = 0.6;

  // Metronome
  private isMetronomePlaying: boolean = false;
  private metronomeTimerId: number | null = null;
  private metronomeBpm: number = 100;
  private metronomeBeat: number = 0;

  // MediaRecorder for looper
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingDestination: MediaStreamAudioDestinationNode | null = null;

  public init(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);

      this.drumsGain = this.ctx.createGain();
      this.drumsGain.gain.value = this.drumsVolume;
      this.drumsGain.connect(this.masterGain);

      this.bassGain = this.ctx.createGain();
      this.bassGain.gain.value = this.bassVolume;
      this.bassGain.connect(this.masterGain);

      this.chordGain = this.ctx.createGain();
      this.chordGain.gain.value = this.chordsVolume;
      this.chordGain.connect(this.masterGain);

      this.recordingDestination = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.recordingDestination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Karplus-Strong Physical Modeling Plucked String Synthesis
   * Produces an authentic acoustic guitar plucked string sound!
   */
  public playPluckedString(frequency: number, duration: number = 2.5): void {
    const ctx = this.init();
    const period = ctx.sampleRate / frequency;
    const periodInt = Math.floor(period);
    if (periodInt <= 0) return;

    // Buffer length for the noise burst excitation
    const bufferSize = ctx.sampleRate * Math.min(duration, 3.5);
    const audioBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    // 1. Initial burst of noise (the pick striking the string)
    for (let i = 0; i < periodInt; i++) {
      channelData[i] = (Math.random() * 2 - 1) * 0.9;
    }

    // 2. Feedback delay line with low-pass decay averaging (Karplus-Strong)
    const decay = 0.992; // String sustain factor
    for (let i = periodInt; i < bufferSize; i++) {
      const prev = channelData[i - periodInt];
      const prevMinusOne = channelData[i - periodInt - 1] || prev;
      channelData[i] = ((prev + prevMinusOne) * 0.5) * decay;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    // Warm guitar tone filter (simulating wood body resonance)
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.value = Math.min(5000, frequency * 5);

    source.connect(bodyFilter);
    bodyFilter.connect(gain);
    if (this.masterGain) {
      gain.connect(this.masterGain);
    } else {
      gain.connect(ctx.destination);
    }

    source.start();
  }

  public playNote(note: NoteName, octave: number, duration: number = 2.5): void {
    const midi = noteToMidi(note, octave);
    const freq = midiToFrequency(midi);
    this.playPluckedString(freq, duration);
  }

  // Metronome tick
  public playClick(isAccent: boolean = false): void {
    const ctx = this.init();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isAccent ? 1600 : 900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(isAccent ? 0.6 : 0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

    osc.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);
    else gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  public toggleMetronome(bpm: number, onBeat?: (beat: number) => void): boolean {
    if (this.isMetronomePlaying) {
      this.stopMetronome();
      return false;
    }
    this.startMetronome(bpm, onBeat);
    return true;
  }

  public startMetronome(bpm: number, onBeat?: (beat: number) => void): void {
    this.stopMetronome();
    this.init();
    this.isMetronomePlaying = true;
    this.metronomeBpm = bpm;
    this.metronomeBeat = 0;

    const intervalMs = (60 / bpm) * 1000;
    const tick = () => {
      if (!this.isMetronomePlaying) return;
      const isAccent = this.metronomeBeat % 4 === 0;
      this.playClick(isAccent);
      if (onBeat) onBeat(this.metronomeBeat % 4);
      this.metronomeBeat = (this.metronomeBeat + 1) % 4;
      this.metronomeTimerId = window.setTimeout(tick, intervalMs);
    };
    tick();
  }

  public stopMetronome(): void {
    this.isMetronomePlaying = false;
    if (this.metronomeTimerId !== null) {
      clearTimeout(this.metronomeTimerId);
      this.metronomeTimerId = null;
    }
  }

  public isMetronomeActive(): boolean {
    return this.isMetronomePlaying;
  }

  /**
   * Backing Track Synthesizer:
   * Dynamically synthesizes drums, groovy basslines, and lush chords in real time!
   */
  public startBackingTrack(
    track: BackingTrack,
    bpm: number,
    onStep?: (step: number, chord: string) => void
  ): void {
    this.stopBackingTrack();
    this.init();
    this.isBackingTrackPlaying = true;
    this.currentTrack = track;
    this.bpm = bpm;
    this.currentStep = 0;

    const stepIntervalMs = ((60 / bpm) * 1000) / 4; // 16th notes
    const rootIndex = NOTE_NAMES.indexOf(track.key);

    const stepLoop = () => {
      if (!this.isBackingTrackPlaying || !this.currentTrack) return;

      const step = this.currentStep % 16; // 1 bar = 16 16th steps
      const beat = Math.floor(step / 4);  // 0, 1, 2, 3
      const barIndex = Math.floor(this.currentStep / 16) % this.currentTrack.chords.length;
      const currentChord = this.currentTrack.chords[barIndex];

      // 1. Synthesize Drums
      this.playDrumStep(step, track.drumPattern);

      // 2. Synthesize Bass (Plays on primary bass grooves)
      if (step === 0 || step === 6 || step === 10 || step === 14) {
        const bassOffset = track.bassProgression[barIndex % track.bassProgression.length] || 0;
        const bassMidi = noteToMidi(NOTE_NAMES[(rootIndex + bassOffset + 12) % 12], 2);
        this.playBassNote(bassMidi, 0.4);
      }

      // 3. Synthesize Accompaniment Chords (Strummed accents on beats 2 & 4 or offbeats)
      if (step === 4 || step === 12 || step === 7) {
        this.playAccompanimentChord(currentChord, track.key);
      }

      if (onStep) {
        onStep(step, currentChord);
      }

      this.currentStep++;
      this.timerId = window.setTimeout(stepLoop, stepIntervalMs);
    };

    stepLoop();
  }

  public stopBackingTrack(): void {
    this.isBackingTrackPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public isTrackPlaying(): boolean {
    return this.isBackingTrackPlaying;
  }

  // Synthesizes punchy kick, snare crack, and crisp hi-hat
  private playDrumStep(step: number, pattern: string): void {
    const ctx = this.ctx;
    if (!ctx || !this.drumsGain) return;

    const time = ctx.currentTime;
    // Hi-hat on every 8th note, swing offbeats
    if (step % 2 === 0) {
      this.playHiHat(time, step % 4 === 0 ? 0.3 : 0.18);
    }

    // Kick drum: on beat 1, beat 3, and variations
    const isKick = step === 0 || (pattern === 'shuffle' && step === 10) || (pattern === 'funky-break' && (step === 6 || step === 10)) || (step === 8);
    if (isKick) {
      this.playKick(time);
    }

    // Snare drum: on beat 2 and 4 (step 4 and step 12)
    const isSnare = step === 4 || step === 12;
    if (isSnare) {
      this.playSnare(time);
    }
  }

  private playKick(time: number): void {
    if (!this.ctx || !this.drumsGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.08);

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.drumsGain);
    osc.start(time);
    osc.stop(time + 0.26);
  }

  private playSnare(time: number): void {
    if (!this.ctx || !this.drumsGain) return;
    // Noise buffer for snap
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumsGain);

    // Low body tone
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.frequency.setValueAtTime(190, time);
    bodyOsc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    bodyGain.gain.setValueAtTime(0.4, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.drumsGain);

    noise.start(time);
    bodyOsc.start(time);
    bodyOsc.stop(time + 0.1);
  }

  private playHiHat(time: number, volume: number): void {
    if (!this.ctx || !this.drumsGain) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6500;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumsGain);

    noise.start(time);
  }

  private playBassNote(midi: number, duration: number): void {
    if (!this.ctx || !this.bassGain) return;
    const freq = midiToFrequency(midi);
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bassGain);

    osc.start();
    subOsc.start();
    osc.stop(this.ctx.currentTime + duration);
    subOsc.stop(this.ctx.currentTime + duration);
  }

  private playAccompanimentChord(chordSymbol: string, trackKey: NoteName): void {
    if (!this.ctx || !this.chordGain) return;
    // Map common chord names to midi notes
    const rootLetter = chordSymbol.slice(0, chordSymbol.length > 1 && (chordSymbol[1] === '#' || chordSymbol[1] === 'b') ? 2 : 1) as NoteName;
    const actualRoot = NOTE_NAMES.includes(rootLetter) ? rootLetter : trackKey;
    const rootIndex = NOTE_NAMES.indexOf(actualRoot);

    const isMinor = chordSymbol.includes('m') && !chordSymbol.includes('maj');
    const is7th = chordSymbol.includes('7');

    const chordIntervals = isMinor
      ? [0, 3, 7, is7th ? 10 : 12]
      : [0, 4, 7, is7th ? 10 : 11];

    // Strum 3-4 notes with subtle micro-delay
    chordIntervals.forEach((interval, idx) => {
      const midi = noteToMidi(NOTE_NAMES[(rootIndex + interval) % 12], 3 + Math.floor(interval / 12));
      const freq = midiToFrequency(midi);
      const strumDelay = idx * 0.02;

      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + strumDelay);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, this.ctx!.currentTime);

      gain.gain.setValueAtTime(0, this.ctx!.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + strumDelay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + strumDelay + 0.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.chordGain!);

      osc.start(this.ctx!.currentTime + strumDelay);
      osc.stop(this.ctx!.currentTime + strumDelay + 0.85);
    });
  }

  /**
   * Translates a ProgressionChord into its constituent MIDI note numbers
   */
  public getChordMidiNotes(chord: ProgressionChord): number[] {
    const root = chord.root;
    const baseMidi = noteToMidi(root, 3); // C3 to B3 base octave

    if (chord.voicingNotes && chord.voicingNotes.length > 0) {
      return chord.voicingNotes.map((interval) => baseMidi + interval);
    }

    const q = (chord.quality || '').toLowerCase().trim();
    let intervals: number[] = [0, 4, 7, 12]; // default major

    if (q === 'm' || q === 'min' || q === 'minor') {
      intervals = [0, 3, 7, 12];
    } else if (q === '7' || q === 'dom7') {
      intervals = [0, 4, 7, 10];
    } else if (q === 'maj7' || q === 'major7') {
      intervals = [0, 4, 7, 11];
    } else if (q === 'm7' || q === 'min7') {
      intervals = [0, 3, 7, 10];
    } else if (q === 'dim' || q === 'dim7') {
      intervals = [0, 3, 6, 9];
    } else if (q === 'm7b5' || q === 'half-dim') {
      intervals = [0, 3, 6, 10];
    } else if (q === 'sus4') {
      intervals = [0, 5, 7, 12];
    } else if (q === 'sus2') {
      intervals = [0, 2, 7, 12];
    } else if (q === 'add9') {
      intervals = [0, 4, 7, 14];
    } else if (q === '9') {
      intervals = [0, 4, 7, 10, 14];
    } else if (q === 'm9') {
      intervals = [0, 3, 7, 10, 14];
    } else if (q === 'maj9') {
      intervals = [0, 4, 7, 11, 14];
    } else if (q === '7#9') {
      intervals = [0, 4, 7, 10, 15]; // Hendrix chord!
    } else if (q === 'aug') {
      intervals = [0, 4, 8, 12];
    }

    return intervals.map((interval) => baseMidi + interval);
  }

  /**
   * Plays a single chord voicing using selected synthesizer voice
   */
  public playChordVoicing(
    chord: ProgressionChord,
    voice: SynthVoiceType = 'poly-synth',
    duration: number = 1.8
  ): void {
    this.init();
    const midiNotes = this.getChordMidiNotes(chord);

    switch (voice) {
      case 'acoustic-pluck': {
        // Karplus-Strong string pluck across notes
        midiNotes.forEach((midi, idx) => {
          const freq = midiToFrequency(midi);
          setTimeout(() => {
            this.playPluckedString(freq, duration);
          }, idx * 30);
        });
        break;
      }

      case 'electric-crunch': {
        this.playCrunchChord(midiNotes, duration);
        break;
      }

      case 'lofi-keys': {
        this.playLoFiKeysChord(midiNotes, duration);
        break;
      }

      case 'ambient-pad': {
        this.playAmbientPadChord(midiNotes, duration);
        break;
      }

      case 'poly-synth':
      default: {
        this.playPolySynthChord(midiNotes, duration);
        break;
      }
    }
  }

  /**
   * Plays an exact guitar chord voicing defined by physical fret positions (e.g. from Chord Encyclopedia)
   * Plays with realistic arpeggio strum or full acoustic pluck
   */
  public playVoicingFrets(
    voicing: ChordVoicing,
    arpeggiate: boolean = false,
    duration: number = 2.4
  ): void {
    this.init();
    const tuning = GUITAR_TUNINGS[0];

    // Filter valid sounding strings (fret >= 0), ordered from low E (string 6) to high E (string 1)
    const activeStrings = voicing.frets
      .filter((f) => f.fret >= 0)
      .sort((a, b) => b.string - a.string);

    if (activeStrings.length === 0) return;

    const strumDelay = arpeggiate ? 100 : 25; // ms between strings

    activeStrings.forEach((fretInfo, idx) => {
      const pos = getFretPosition(fretInfo.string, fretInfo.fret, tuning);
      setTimeout(() => {
        this.playPluckedString(pos.frequency, duration);
      }, idx * strumDelay);
    });
  }

  /**
   * Warm analog polyphonic synthesizer with detuned dual oscillators
   */
  private playPolySynthChord(midiNotes: number[], duration: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.chordGain) return;

    midiNotes.forEach((midi, idx) => {
      const freq = midiToFrequency(midi);
      const strumOffset = idx * 0.015;
      const startTime = ctx.currentTime + strumOffset;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Sawtooth + Square with slight chorus detune
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, startTime);
      osc1.detune.setValueAtTime(-6, startTime);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(freq, startTime);
      osc2.detune.setValueAtTime(6, startTime);

      // 24dB low-pass filter with envelope opening
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, startTime);
      filter.frequency.exponentialRampToValueAtTime(3200, startTime + 0.12);
      filter.frequency.exponentialRampToValueAtTime(1100, startTime + duration);
      filter.Q.value = 3.5;

      // ADSR Gain Envelope
      const level = 0.18 / Math.sqrt(midiNotes.length);
      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.linearRampToValueAtTime(level, startTime + 0.035);
      noteGain.gain.exponentialRampToValueAtTime(level * 0.6, startTime + 0.4);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.chordGain);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration + 0.05);
      osc2.stop(startTime + duration + 0.05);
    });
  }

  /**
   * Overdriven tube amplifier crunch chord with soft-clipping waveshaper
   */
  private playCrunchChord(midiNotes: number[], duration: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.chordGain) return;

    // Build soft clipping curve
    const n = 256;
    const curve = new Float32Array(n);
    const k = 20;
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }

    midiNotes.forEach((midi, idx) => {
      const freq = midiToFrequency(midi);
      const strumOffset = idx * 0.01;
      const startTime = ctx.currentTime + strumOffset;

      const osc = ctx.createOscillator();
      const waveShaper = ctx.createWaveShaper();
      const cabFilter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      waveShaper.curve = curve;
      waveShaper.oversample = '4x';

      cabFilter.type = 'lowpass';
      cabFilter.frequency.setValueAtTime(3400, startTime);
      cabFilter.Q.value = 1.2;

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.13, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.min(duration, 1.4));

      osc.connect(waveShaper);
      waveShaper.connect(cabFilter);
      cabFilter.connect(gain);
      gain.connect(this.chordGain);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * Lo-Fi Electric Piano (warm Rhodes / Wurlitzer vibe)
   */
  private playLoFiKeysChord(midiNotes: number[], duration: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.chordGain) return;

    midiNotes.forEach((midi, idx) => {
      const freq = midiToFrequency(midi);
      const strumOffset = idx * 0.02;
      const startTime = ctx.currentTime + strumOffset;

      const oscSine = ctx.createOscillator();
      const oscTri = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const noteGain = ctx.createGain();

      oscSine.type = 'sine';
      oscSine.frequency.setValueAtTime(freq, startTime);

      oscTri.type = 'triangle';
      oscTri.frequency.setValueAtTime(freq * 2, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, startTime);
      filter.frequency.exponentialRampToValueAtTime(600, startTime + duration);

      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      oscSine.connect(filter);
      oscTri.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.chordGain);

      oscSine.start(startTime);
      oscTri.start(startTime);
      oscSine.stop(startTime + duration);
      oscTri.stop(startTime + duration);
    });
  }

  /**
   * Shimmering atmospheric ambient pad with slow attack
   */
  private playAmbientPadChord(midiNotes: number[], duration: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.chordGain) return;

    midiNotes.forEach((midi) => {
      const freq = midiToFrequency(midi);
      const startTime = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, startTime);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq, startTime);
      osc2.detune.setValueAtTime(4, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, startTime);
      filter.Q.value = 1.8;

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.13, startTime + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.7);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.chordGain);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration + 0.8);
      osc2.stop(startTime + duration + 0.8);
    });
  }

  /**
   * Real-time Custom Progression Timeline Synth Player
   */
  public startProgressionSynth(
    progression: CustomChordProgression,
    onStepTick?: (barIndex: number, beat: number, step: number, chord: ProgressionChord) => void
  ): void {
    this.stopProgressionSynth();
    this.stopBackingTrack();
    this.init();

    if (!progression.chords || progression.chords.length === 0) return;

    this.isProgressionPlaying = true;
    this.activeProgression = progression;
    this.progressionStep = 0;

    const bpm = Math.max(50, Math.min(220, progression.bpm || 110));
    const stepIntervalMs = ((60 / bpm) * 1000) / 4; // 16th notes
    const totalBars = progression.chords.length;
    const totalSteps = totalBars * 16;

    const loop = () => {
      if (!this.isProgressionPlaying || !this.activeProgression) return;

      const total16th = this.progressionStep % totalSteps;
      const barIndex = Math.floor(total16th / 16);
      const stepInBar = total16th % 16; // 0 to 15
      const beat = Math.floor(stepInBar / 4); // 0, 1, 2, 3

      const currentChord = this.activeProgression.chords[barIndex] || this.activeProgression.chords[0];

      // 1. Drums (if enabled)
      if (this.activeProgression.drumsEnabled && this.activeProgression.drumPattern !== 'none') {
        this.playDrumStep(stepInBar, this.activeProgression.drumPattern);
      }

      // 2. Bass synthesis (if enabled)
      if (this.activeProgression.bassEnabled) {
        if (stepInBar === 0 || stepInBar === 6 || stepInBar === 10) {
          const rootMidi = noteToMidi(currentChord.root, 2);
          this.playBassNote(rootMidi, 0.42);
        }
      }

      // 3. Chord Strums / Voicings on timeline
      if (currentChord.beats === 2) {
        if (stepInBar === 0 || stepInBar === 8) {
          this.playChordVoicing(currentChord, this.activeProgression.synthVoice, (60 / bpm) * 1.8);
        }
      } else {
        if (stepInBar === 0) {
          this.playChordVoicing(currentChord, this.activeProgression.synthVoice, (60 / bpm) * 3.4);
        } else if (stepInBar === 8 && this.activeProgression.synthVoice !== 'ambient-pad') {
          // Half-bar comping strum
          this.playChordVoicing(currentChord, this.activeProgression.synthVoice, (60 / bpm) * 1.5);
        }
      }

      // Callback to update UI playhead cursor & LEDs
      if (onStepTick) {
        onStepTick(barIndex, beat, stepInBar, currentChord);
      }

      this.progressionStep++;
      this.progressionTimerId = window.setTimeout(loop, stepIntervalMs);
    };

    loop();
  }

  public stopProgressionSynth(): void {
    this.isProgressionPlaying = false;
    if (this.progressionTimerId !== null) {
      clearTimeout(this.progressionTimerId);
      this.progressionTimerId = null;
    }
  }

  public isProgressionActive(): boolean {
    return this.isProgressionPlaying;
  }

  public setVolumes(master: number, drums: number, bass: number, chords: number): void {
    this.masterVolume = master;
    this.drumsVolume = drums;
    this.bassVolume = bass;
    this.chordsVolume = chords;

    if (this.masterGain) this.masterGain.gain.value = master;
    if (this.drumsGain) this.drumsGain.gain.value = drums;
    if (this.bassGain) this.bassGain.gain.value = bass;
    if (this.chordGain) this.chordGain.gain.value = chords;
  }

  /**
   * Looper / Audio Recorder & WAV Export
   */
  public async startRecording(includeMic: boolean = false): Promise<boolean> {
    const ctx = this.init();
    this.recordedChunks = [];

    try {
      let combinedStream: MediaStream;
      if (includeMic) {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const micSource = ctx.createMediaStreamSource(micStream);
        const micGain = ctx.createGain();
        micGain.gain.value = 0.85;
        micSource.connect(micGain);
        if (this.recordingDestination) {
          micGain.connect(this.recordingDestination);
        }
      }

      if (!this.recordingDestination) {
        this.recordingDestination = ctx.createMediaStreamDestination();
        if (this.masterGain) this.masterGain.connect(this.recordingDestination);
      }

      combinedStream = this.recordingDestination.stream;
      this.mediaRecorder = new MediaRecorder(combinedStream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100);
      return true;
    } catch (err) {
      console.error('Error starting audio recording:', err);
      return false;
    }
  }

  public stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.recordedChunks = [];
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Helper to download recorded loop as audio file
   */
  public downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export const soundEngine = new SoundEngine();
