import { DetectedPitch } from '../types/guitar';
import { frequencyToNoteData } from './fretboardUtils';

export class AudioPitchDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private biquadFilter: BiquadFilterNode | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private buffer: Float32Array | null = null;

  // Sensitivity settings
  public rmsThreshold: number = 0.015; // Noise gate minimum amplitude
  public minFreq: number = 65;   // ~C2 (covers Drop D, low D2 is 73.4Hz, Low B 7-string is 61Hz)
  public maxFreq: number = 1100; // ~C6 (highest 24th fret on High E is ~1318Hz, octave 5 is common)

  private onPitchDetectedCallback: ((pitch: DetectedPitch | null) => void) | null = null;
  private onWaveformDataCallback: ((waveformData: Float32Array) => void) | null = null;

  public async start(
    onPitch: (pitch: DetectedPitch | null) => void,
    onWaveform?: (waveformData: Float32Array) => void
  ): Promise<boolean> {
    if (this.isRunning) return true;

    this.onPitchDetectedCallback = onPitch;
    this.onWaveformDataCallback = onWaveform || null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.mediaStream = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(stream);

      // Low-cut filter to eliminate sub-bass rumble (< 60Hz)
      this.biquadFilter = this.audioContext.createBiquadFilter();
      this.biquadFilter.type = 'highpass';
      this.biquadFilter.frequency.value = 60;

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 4096; // High frequency resolution for low bass/guitar strings

      this.sourceNode.connect(this.biquadFilter);
      this.biquadFilter.connect(this.analyser);

      this.buffer = new Float32Array(this.analyser.fftSize);
      this.isRunning = true;
      this.detectLoop();

      return true;
    } catch (err) {
      console.warn('Microphone access error or denied:', err);
      this.stop();
      return false;
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.biquadFilter) {
      this.biquadFilter.disconnect();
      this.biquadFilter = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    if (this.onPitchDetectedCallback) {
      this.onPitchDetectedCallback(null);
    }
  }

  public getStatus(): boolean {
    return this.isRunning;
  }

  private detectLoop = (): void => {
    if (!this.isRunning || !this.analyser || !this.buffer || !this.audioContext) return;

    this.analyser.getFloatTimeDomainData(this.buffer);

    if (this.onWaveformDataCallback) {
      this.onWaveformDataCallback(this.buffer);
    }

    // 1. Calculate Root Mean Square (RMS) energy to check if a string was plucked
    let sumSquares = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      sumSquares += this.buffer[i] * this.buffer[i];
    }
    const rms = Math.sqrt(sumSquares / this.buffer.length);

    if (rms < this.rmsThreshold) {
      // Below noise floor: no sound detected
      if (this.onPitchDetectedCallback) {
        this.onPitchDetectedCallback(null);
      }
    } else {
      // 2. Perform Autocorrelation pitch detection with parabolic interpolation
      const pitchResult = this.autoCorrelate(this.buffer, this.audioContext.sampleRate);

      if (pitchResult && pitchResult.frequency >= this.minFreq && pitchResult.frequency <= this.maxFreq) {
        const noteData = frequencyToNoteData(pitchResult.frequency);
        const volumeClamped = Math.min(1, rms * 4); // Scale to 0-1 range

        const detected: DetectedPitch = {
          frequency: Math.round(pitchResult.frequency * 10) / 10,
          note: noteData.note,
          octave: noteData.octave,
          cents: noteData.cents,
          clarity: pitchResult.clarity,
          volume: volumeClamped,
          isStandardGuitarRange: pitchResult.frequency >= 70 && pitchResult.frequency <= 1400,
        };

        if (this.onPitchDetectedCallback) {
          this.onPitchDetectedCallback(detected);
        }
      } else {
        if (this.onPitchDetectedCallback) {
          this.onPitchDetectedCallback(null);
        }
      }
    }

    this.animFrameId = requestAnimationFrame(this.detectLoop);
  };

  /**
   * Fast Autocorrelation algorithm with parabolic interpolation
   */
  private autoCorrelate(
    buffer: Float32Array,
    sampleRate: number
  ): { frequency: number; clarity: number } | null {
    const SIZE = buffer.length;
    const maxPeriod = Math.floor(sampleRate / this.minFreq);
    const minPeriod = Math.floor(sampleRate / this.maxFreq);

    // Compute autocorrelation for lags within target frequency range
    let bestLag = -1;
    let bestCorrelation = 0;
    let foundEdge = false;

    // Normalizing denominator
    let energy0 = 0;
    for (let i = 0; i < SIZE; i++) {
      energy0 += buffer[i] * buffer[i];
    }
    if (energy0 === 0) return null;

    for (let lag = minPeriod; lag <= maxPeriod; lag++) {
      let correlation = 0;
      let energyLag = 0;

      const limit = SIZE - lag;
      for (let i = 0; i < limit; i++) {
        correlation += buffer[i] * buffer[i + lag];
        energyLag += buffer[i + lag] * buffer[i + lag];
      }

      // Normalized cross-correlation
      const norm = Math.sqrt(energy0 * energyLag);
      const r = norm > 0 ? correlation / norm : 0;

      // Peak-picking: search for initial dip and subsequent highest positive peak
      if (!foundEdge && r < 0.3) {
        foundEdge = true;
      } else if (foundEdge && r > 0.65) {
        if (r > bestCorrelation) {
          bestCorrelation = r;
          bestLag = lag;
        }
      }
    }

    if (bestLag === -1 || bestCorrelation < 0.68) {
      return null;
    }

    // Parabolic interpolation around the peak for high precision (sub-sample accuracy)
    let betterLag = bestLag;
    if (bestLag > 1 && bestLag < SIZE - 1) {
      const x0 = bestLag - 1;
      const x1 = bestLag;
      const x2 = bestLag + 1;

      // Sample local correlation
      const computeR = (l: number) => {
        let c = 0;
        let e = 0;
        const lim = SIZE - l;
        for (let i = 0; i < lim; i++) {
          c += buffer[i] * buffer[i + l];
          e += buffer[i + l] * buffer[i + l];
        }
        return Math.sqrt(energy0 * e) > 0 ? c / Math.sqrt(energy0 * e) : 0;
      };

      const y0 = computeR(x0);
      const y1 = bestCorrelation;
      const y2 = computeR(x2);

      const denom = 2 * (2 * y1 - y0 - y2);
      if (denom !== 0) {
        const delta = (y2 - y0) / denom;
        betterLag = x1 + delta;
      }
    }

    const fundamentalFreq = sampleRate / betterLag;
    return {
      frequency: fundamentalFreq,
      clarity: bestCorrelation,
    };
  }
}

export const globalAudioDetector = new AudioPitchDetector();
