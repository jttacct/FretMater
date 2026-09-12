/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { FretboardView } from './components/FretboardView';
import { ExerciseTrainer } from './components/ExerciseTrainer';
import { BackingTracksView } from './components/BackingTracksView';
import { LooperView } from './components/LooperView';
import { AnalyticsView } from './components/AnalyticsView';
import { SocialFeedView } from './components/SocialFeedView';
import { CreatorStudioView } from './components/CreatorStudioView';
import { LiveTeachingView } from './components/LiveTeachingView';
import { ChordEncyclopedia } from './components/ChordEncyclopedia';
import { TunerModal } from './components/TunerModal';
import { RemindersModal } from './components/RemindersModal';
import { CloudSyncModal } from './components/CloudSyncModal';

import {
  DetectedPitch,
  GuitarTuning,
  NoteName,
  ScaleDefinition,
  SavedLoop,
} from './types/guitar';
import { GUITAR_TUNINGS, SCALES } from './utils/fretboardUtils';
import { globalAudioDetector } from './utils/audioPitchDetector';
import { storage } from './utils/storage';
import { soundEngine } from './utils/soundEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('fretboard');
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [livePitch, setLivePitch] = useState<DetectedPitch | null>(null);

  // Fretboard musical settings
  const [currentTuning, setCurrentTuning] = useState<GuitarTuning>(GUITAR_TUNINGS[0]);
  const [selectedRoot, setSelectedRoot] = useState<NoteName>('A');
  const [selectedScale, setSelectedScale] = useState<ScaleDefinition | null>(SCALES[0]); // Minor Pentatonic default

  // Modals
  const [isTunerOpen, setIsTunerOpen] = useState<boolean>(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState<boolean>(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState<boolean>(false);

  // User streak
  const [currentStreak, setCurrentStreak] = useState<number>(14);

  // Toggle microphone pitch detection
  const handleToggleMic = useCallback(async () => {
    if (isMicActive) {
      globalAudioDetector.stop();
      setIsMicActive(false);
      setLivePitch(null);
    } else {
      const ok = await globalAudioDetector.start((pitch) => {
        setLivePitch(pitch);
      });
      if (ok) {
        setIsMicActive(true);
      }
    }
  }, [isMicActive]);

  // Handle syncing fretboard from a chosen backing track
  const handleSyncFretboardFromTrack = (key: NoteName, scale: ScaleDefinition) => {
    setSelectedRoot(key);
    setSelectedScale(scale);
    setActiveTab('fretboard');
  };

  // Handle sharing a recorded loop to the community feed
  const handleShareLoopToFeed = (loop: SavedLoop) => {
    storage.addPost({
      id: `post-${Date.now()}`,
      author: 'You (Guitar Virtuoso)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      badge: 'Loop Creator 🎙️',
      title: `Fresh Riff: ${loop.title}`,
      content: `Just exported this ${loop.durationSeconds}-second loop in ${loop.key} (${loop.bpm} BPM). Feel free to jam along or practice lead solos over it!`,
      timestamp: 'Just now',
      likes: 3,
      commentsCount: 1,
      exerciseScore: { accuracy: 95, streak: currentStreak, xp: 320 },
      hasAudioSample: true,
    });
    setActiveTab('community');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top App Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMicActive={isMicActive}
        onToggleMic={handleToggleMic}
        livePitch={livePitch}
        onOpenTuner={() => setIsTunerOpen(true)}
        onOpenReminders={() => setIsRemindersOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        currentStreak={currentStreak}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {activeTab === 'fretboard' && (
          <div className="space-y-6">
            <FretboardView
              currentTuning={currentTuning}
              setCurrentTuning={setCurrentTuning}
              selectedRoot={selectedRoot}
              setSelectedRoot={setSelectedRoot}
              selectedScale={selectedScale}
              setSelectedScale={setSelectedScale}
              livePitch={livePitch}
              onOpenTeachingTab={() => setActiveTab('teaching')}
            />

            {/* Quick Practice Prompt Banner */}
            <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-lg">
                  🎯
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Ready for Real-Time Pitch Exercises?</h4>
                  <p className="text-xs text-slate-400">
                    Test your note identification and ear training using your physical guitar or on-screen inputs.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('trainer')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Launch Audio Trainer
                </button>
                <button
                  onClick={() => setIsTunerOpen(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
                >
                  Tune Guitar
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trainer' && (
          <ExerciseTrainer
            livePitch={livePitch}
            isMicActive={isMicActive}
            onToggleMic={handleToggleMic}
            tuning={currentTuning}
            onSessionComplete={() => setCurrentStreak((prev) => prev + 1)}
          />
        )}

        {activeTab === 'chords' && (
          <ChordEncyclopedia
            currentTuning={currentTuning}
            onNavigateToCreator={() => setActiveTab('creator')}
            onInspectOnFretboard={(root) => {
              setSelectedRoot(root);
              setActiveTab('fretboard');
            }}
          />
        )}

        {activeTab === 'backing-tracks' && (
          <BackingTracksView onSyncFretboard={handleSyncFretboardFromTrack} />
        )}

        {activeTab === 'looper' && (
          <LooperView onShareToCommunity={handleShareLoopToFeed} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView tuning={currentTuning} />
        )}

        {activeTab === 'community' && (
          <SocialFeedView />
        )}

        {activeTab === 'creator' && (
          <CreatorStudioView onSyncFretboard={handleSyncFretboardFromTrack} />
        )}

        {activeTab === 'teaching' && (
          <LiveTeachingView onSyncFretboard={handleSyncFretboardFromTrack} />
        )}
      </main>

      {/* Global Modals */}
      <TunerModal
        isOpen={isTunerOpen}
        onClose={() => setIsTunerOpen(false)}
        livePitch={livePitch}
        isMicActive={isMicActive}
        onToggleMic={handleToggleMic}
        currentTuning={currentTuning}
      />

      <RemindersModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
      />

      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        onDataRestored={() => window.location.reload()}
      />

      {/* Persistent Bottom Bar / Offline Status */}
      <footer className="border-t border-slate-900 bg-slate-950/80 text-xs text-slate-500 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>FretMaster Studio Engine</span>
            <span>•</span>
            <span>Web Audio 44.1 kHz YIN Pitch Detection</span>
            <span>•</span>
            <span className="text-slate-400">Offline PWA Ready</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsCloudSyncOpen(true)}
              className="hover:text-cyan-300 transition-colors"
            >
              Cloud Backup Snapshot
            </button>
            <span>•</span>
            <button
              onClick={() => setIsRemindersOpen(true)}
              className="hover:text-amber-300 transition-colors"
            >
              Practice Reminders
            </button>
            <span>•</span>
            <button
              onClick={() => setIsTunerOpen(true)}
              className="hover:text-amber-300 transition-colors"
            >
              Chromatic Tuner
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
