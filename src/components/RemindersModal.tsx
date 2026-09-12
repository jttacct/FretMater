import React, { useState } from 'react';
import { PracticeReminderSettings } from '../types/guitar';
import { storage } from '../utils/storage';
import { soundEngine } from '../utils/soundEngine';
import { X, Bell, Check, Clock, Sparkles, Send } from 'lucide-react';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOTIVATION_QUOTES = [
  'Consistency builds muscle memory. 15 minutes of fretboard drills today unlocks effortless soloing tomorrow!',
  'The fretboard is a map, not a mystery. Five minutes on pentatonic positions will change your next jam session.',
  'Great tone comes from the fingers. Tune up, plug in, and claim today’s streak!',
  'Even 10 minutes of scale repetition rewires neural pathways faster than a 2-hour marathon on Sunday.',
];

export const RemindersModal: React.FC<RemindersModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<PracticeReminderSettings>(storage.getReminders());
  const [testSent, setTestSent] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  if (!isOpen) return null;

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleToggleDay = (day: string) => {
    let updatedDays = [...settings.days];
    if (updatedDays.includes(day)) {
      updatedDays = updatedDays.filter((d) => d !== day);
    } else {
      updatedDays.push(day);
    }
    const updated = { ...settings, days: updatedDays };
    setSettings(updated);
    storage.saveReminders(updated);
  };

  const handleToggleEnabled = async () => {
    const nextState = !settings.enabled;
    if (nextState && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      try {
        const perm = await Notification.requestPermission();
        setPermissionStatus(perm);
      } catch (err) {
        console.error(err);
      }
    }
    const updated = { ...settings, enabled: nextState };
    setSettings(updated);
    storage.saveReminders(updated);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = { ...settings, time: e.target.value };
    setSettings(updated);
    storage.saveReminders(updated);
  };

  const handleSendTestNotification = () => {
    soundEngine.playClick(true);
    setTestSent(true);

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('🎸 FretMaster Daily Practice Call', {
        body: settings.motivationText,
        icon: '/assets/icon.png',
      });
    }

    setTimeout(() => setTestSent(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Daily Practice Reminders</h2>
            <p className="text-xs text-slate-400">Keep your practice streak alive with daily motivational notifications</p>
          </div>
        </div>

        {/* Master Enabled Switch */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between mb-5">
          <div>
            <span className="text-sm font-bold text-white block">Active Daily Alerts</span>
            <span className="text-xs text-slate-400">
              {settings.enabled ? 'Reminders are actively scheduled' : 'Reminders are paused'}
            </span>
          </div>

          <button
            onClick={handleToggleEnabled}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              settings.enabled ? 'bg-amber-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Schedule Controls */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Reminder Time</span>
            </label>
            <input
              type="time"
              value={settings.time}
              onChange={handleTimeChange}
              className="bg-slate-950 border border-slate-800 text-white font-mono text-sm px-3 py-2 rounded-xl w-full focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Days of Week */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Repeating Days
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {daysOfWeek.map((day) => {
                const isSelected = settings.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Motivational Quote */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Motivation Quote</span>
            </label>
            <textarea
              rows={3}
              value={settings.motivationText}
              onChange={(e) => {
                const updated = { ...settings, motivationText: e.target.value };
                setSettings(updated);
                storage.saveReminders(updated);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed"
            />
            {/* Quick Inspiration chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {MOTIVATION_QUOTES.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const updated = { ...settings, motivationText: q };
                    setSettings(updated);
                    storage.saveReminders(updated);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Prompt #{idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Test Notification Action */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleSendTestNotification}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test Alert</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
          >
            Done
          </button>
        </div>

        {testSent && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs text-center font-medium animate-in fade-in">
            🔔 Test notification preview triggered!
          </div>
        )}
      </div>
    </div>
  );
};
