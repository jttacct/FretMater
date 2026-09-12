import React from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Bell,
  CloudCheck,
  Award,
  Sparkles,
  Flame,
  Volume2,
} from 'lucide-react';
import { DetectedPitch } from '../types/guitar';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMicActive: boolean;
  onToggleMic: () => void;
  livePitch: DetectedPitch | null;
  onOpenTuner: () => void;
  onOpenReminders: () => void;
  onOpenCloudSync: () => void;
  currentStreak: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isMicActive,
  onToggleMic,
  livePitch,
  onOpenTuner,
  onOpenReminders,
  onOpenCloudSync,
  currentStreak,
}) => {
  const tabs = [
    { id: 'fretboard', label: 'Fretboard', icon: '🎸' },
    { id: 'chords', label: 'Chord Encyclopedia', icon: '📖' },
    { id: 'trainer', label: 'Audio Trainer', icon: '🎯' },
    { id: 'backing-tracks', label: 'Backing Tracks', icon: '🎶' },
    { id: 'looper', label: 'Looper & Export', icon: '🎙️' },
    { id: 'analytics', label: 'Analytics & Heatmap', icon: '📊' },
    { id: 'community', label: 'Community', icon: '🌍' },
    { id: 'creator', label: 'Creator Studio', icon: '💎' },
    { id: 'teaching', label: 'Live Lessons & Zoom', icon: '🎥' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Live Pitch Indicator */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-950/40 border border-amber-400/30">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-300 via-amber-200 to-white bg-clip-text text-transparent">
                  FretMaster
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Studio Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>Audio Pitch Engine</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-400/90 text-[11px]">Ready</span>
              </p>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onToggleMic}
              className={`p-2 rounded-lg text-sm border flex items-center gap-1.5 transition-colors ${
                isMicActive
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title="Toggle Live Audio Detection"
            >
              {isMicActive ? <Mic className="w-4 h-4 text-emerald-400 animate-pulse" /> : <MicOff className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={onOpenTuner}
              className="px-2.5 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold"
            >
              Tuner
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Global Toolbar: Mic, Live Pitch, Streak, Reminders, Cloud */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Live Audio Pitch Detection Pill */}
          <button
            onClick={onToggleMic}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isMicActive
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-950/30'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Real-Time Microphone Pitch Detection"
          >
            {isMicActive ? (
              <>
                <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="font-mono">
                  {livePitch ? (
                    <span className="font-bold text-white bg-emerald-800/50 px-1 rounded">
                      {livePitch.note}{livePitch.octave} ({livePitch.cents > 0 ? `+${livePitch.cents}` : livePitch.cents}¢)
                    </span>
                  ) : (
                    'Listening...'
                  )}
                </span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Audio Mic Off</span>
              </>
            )}
          </button>

          {/* Quick Tuner Button */}
          <button
            onClick={onOpenTuner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold transition-all"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>Tuner</span>
          </button>

          {/* Streak indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-950/40 border border-orange-500/30 text-orange-300 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-bounce" />
            <span>{currentStreak}d streak</span>
          </div>

          {/* Reminders Button */}
          <button
            onClick={onOpenReminders}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-amber-300 transition-colors"
            title="Daily Practice Reminders"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Cloud Sync / Backup Status Button */}
          <button
            onClick={onOpenCloudSync}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
            title="Cloud Backups & Offline Sync"
          >
            <CloudCheck className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
