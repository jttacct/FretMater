import React, { useState, useEffect, useRef } from 'react';
import { SavedLoop } from '../types/guitar';
import { storage } from '../utils/storage';
import { soundEngine } from '../utils/soundEngine';
import {
  Mic,
  Disc,
  Play,
  Square,
  Download,
  Share2,
  Trash2,
  Plus,
  Radio,
  FileAudio,
  CheckCircle2,
} from 'lucide-react';

interface LooperViewProps {
  onShareToCommunity?: (loop: SavedLoop) => void;
}

export const LooperView: React.FC<LooperViewProps> = ({ onShareToCommunity }) => {
  const [loops, setLoops] = useState<SavedLoop[]>(storage.getLoops());
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const [newLoopTitle, setNewLoopTitle] = useState<string>('My Custom Riff Loop');
  const [newLoopBpm, setNewLoopBpm] = useState<number>(100);
  const [newLoopKey, setNewLoopKey] = useState<string>('A Minor');
  const [includeMicInput, setIncludeMicInput] = useState<boolean>(true);
  const [playingLoopId, setPlayingLoopId] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<{ [id: string]: string }>({});

  const timerRef = useRef<number | null>(null);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Recording duration timer
  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      timerRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleStartRecording = async () => {
    setRecordedBlob(null);
    const success = await soundEngine.startRecording(includeMicInput);
    if (success) {
      setIsRecording(true);
    }
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    const blob = await soundEngine.stopRecording();
    if (blob) {
      setRecordedBlob(blob);
    }
  };

  const handleSaveAndExport = (downloadNow: boolean = false) => {
    const loopId = `loop-${Date.now()}`;
    let blobUrl: string | undefined;

    if (recordedBlob) {
      blobUrl = URL.createObjectURL(recordedBlob);
      setAudioUrls((prev) => ({ ...prev, [loopId]: blobUrl! }));
      if (downloadNow) {
        soundEngine.downloadBlob(recordedBlob, `${newLoopTitle.replace(/\s+/g, '_')}.webm`);
      }
    }

    const newLoop: SavedLoop = {
      id: loopId,
      title: newLoopTitle || 'Untitled Groove',
      createdAt: Date.now(),
      durationSeconds: recordDuration || 8,
      bpm: newLoopBpm,
      key: newLoopKey,
      audioBlobUrl: blobUrl,
      tags: ['Custom Riff', newLoopKey, `${newLoopBpm} BPM`],
    };

    storage.saveLoop(newLoop);
    setLoops(storage.getLoops());
    setRecordedBlob(null);
    setRecordDuration(0);
  };

  const handlePlaySavedLoop = (loop: SavedLoop) => {
    if (playingLoopId === loop.id) {
      if (currentAudioElementRef.current) {
        currentAudioElementRef.current.pause();
      }
      setPlayingLoopId(null);
      return;
    }

    const url = loop.audioBlobUrl || audioUrls[loop.id];
    if (url) {
      if (currentAudioElementRef.current) {
        currentAudioElementRef.current.pause();
      }
      const audio = new Audio(url);
      audio.loop = true;
      audio.play();
      currentAudioElementRef.current = audio;
      setPlayingLoopId(loop.id);

      audio.onended = () => setPlayingLoopId(null);
    } else {
      // Demo synthesized playback if no blob
      soundEngine.playClick(true);
      setPlayingLoopId(loop.id);
      setTimeout(() => setPlayingLoopId(null), 3000);
    }
  };

  const handleDeleteLoop = (id: string) => {
    if (playingLoopId === id && currentAudioElementRef.current) {
      currentAudioElementRef.current.pause();
      setPlayingLoopId(null);
    }
    storage.deleteLoop(id);
    setLoops(storage.getLoops());
  };

  // Export loop and session performance data as downloadable JSON
  const handleExportPerformanceData = (loop: SavedLoop) => {
    const data = {
      loop,
      exportDate: new Date().toISOString(),
      creatorMetadata: {
        app: 'FretMaster Studio',
        tuning: 'Standard E',
        sampleRate: 44100,
        tags: loop.tags,
      },
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    soundEngine.downloadBlob(blob, `${loop.title.replace(/\s+/g, '_')}_session_data.json`);
  };

  return (
    <div className="space-y-6">
      {/* Live Recorder Deck */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Disc className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-white">Live Audio Looper & Session Exporter</h2>
                <p className="text-xs text-slate-400">
                  Record real guitar riffs, overdub layers, and export high-fidelity audio loops + performance metadata.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMicInput}
                onChange={(e) => setIncludeMicInput(e.target.checked)}
                className="accent-amber-500"
              />
              <span>Include Guitar Microphone</span>
            </label>
          </div>
        </div>

        {/* Waveform & Recorder Display */}
        <div className="mt-6 p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
          {/* Pulsing Visual Loop Light */}
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-rose-500/20 border-4 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.4)] animate-pulse'
                : recordedBlob
                ? 'bg-emerald-500/20 border-4 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900 border-4 border-slate-800'
            }`}
          >
            {isRecording ? (
              <span className="font-mono text-rose-400 font-extrabold text-xl">
                {recordDuration}s
              </span>
            ) : recordedBlob ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            ) : (
              <Mic className="w-8 h-8 text-slate-600" />
            )}
          </div>

          <div className="mt-4">
            <h4 className="text-base font-bold text-white">
              {isRecording
                ? 'Recording in Progress...'
                : recordedBlob
                ? 'Loop Captured Ready for Export!'
                : 'Ready to Record Riff'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {isRecording
                ? 'Pluck your guitar or jam over backing tracks — audio is capturing live.'
                : 'Hit the button below to start your loop take.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-extrabold text-sm shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Start Recording Loop</span>
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop & Keep Take</span>
              </button>
            )}
          </div>
        </div>

        {/* Post-Recording Configuration Form */}
        {recordedBlob && (
          <div className="mt-6 p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 animate-in fade-in">
            <h4 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
              <span>Save & Export Loop Take ({recordDuration}s)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Loop Name</label>
                <input
                  type="text"
                  value={newLoopTitle}
                  onChange={(e) => setNewLoopTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Key</label>
                <input
                  type="text"
                  value={newLoopKey}
                  onChange={(e) => setNewLoopKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Estimated BPM</label>
                <input
                  type="number"
                  value={newLoopBpm}
                  onChange={(e) => setNewLoopBpm(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleSaveAndExport(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Audio File (.webm)</span>
              </button>

              <button
                onClick={() => handleSaveAndExport(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save to In-App Library Only</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Saved Loops Library */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Your Loop Library</h3>
            <p className="text-xs text-slate-400">Access and export your saved riffs and practice loops.</p>
          </div>
          <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded-full text-slate-300">
            {loops.length} loops
          </span>
        </div>

        {loops.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No saved loops yet. Record your first guitar riff above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loops.map((loop) => {
              const isPlayingThis = playingLoopId === loop.id;
              return (
                <div
                  key={loop.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {loop.key} • {loop.bpm} BPM
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {loop.durationSeconds}s length
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white">{loop.title}</h4>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {loop.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-slate-900 border border-slate-800 text-slate-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handlePlaySavedLoop(loop)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isPlayingThis
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isPlayingThis ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                      <span>{isPlayingThis ? 'Stop' : 'Play Loop'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleExportPerformanceData(loop)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                        title="Export Session Metadata (JSON)"
                      >
                        <FileAudio className="w-3.5 h-3.5" />
                      </button>

                      {onShareToCommunity && (
                        <button
                          onClick={() => onShareToCommunity(loop)}
                          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800"
                          title="Share to Community Feed"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteLoop(loop.id)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 border border-slate-800"
                        title="Delete Loop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
