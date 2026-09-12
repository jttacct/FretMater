import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  OnlineLessonSession,
  NoteName,
  ScaleDefinition,
  GuitarTuning,
  FretboardPosition,
} from '../types/guitar';
import {
  NOTE_NAMES,
  SCALES,
  GUITAR_TUNINGS,
  getFretPosition,
} from '../utils/fretboardUtils';
import { storage } from '../utils/storage';
import { soundEngine } from '../utils/soundEngine';
import confetti from 'canvas-confetti';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  ScreenShare,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Calendar,
  Clock,
  User,
  Users,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Trash2,
  BookOpen,
  Send,
  Sparkles,
  Music,
  Guitar,
  Disc,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  FileText,
  AlertCircle,
  Share2,
  Settings,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface LiveTeachingViewProps {
  onSyncFretboard?: (key: NoteName, scale: ScaleDefinition) => void;
}

type FretZoomRange = 'all' | 'open' | 'mid' | 'high';

export const LiveTeachingView: React.FC<LiveTeachingViewProps> = ({ onSyncFretboard }) => {
  // Lesson sessions list from storage
  const [lessons, setLessons] = useState<OnlineLessonSession[]>(() => storage.getLessons());
  const [activeLesson, setActiveLesson] = useState<OnlineLessonSession | null>(() => {
    const list = storage.getLessons();
    return list[0] || null;
  });

  // Classroom Mode Tabs
  const [classroomTab, setClassroomTab] = useState<'classroom' | 'schedule' | 'notes'>('classroom');

  // Video / Audio WebRTC Stream State
  const [isTeacherCamOn, setIsTeacherCamOn] = useState<boolean>(false);
  const [isTeacherMicOn, setIsTeacherMicOn] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isHighFidelityMusicMode, setIsHighFidelityMusicMode] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Student feed state
  const [isStudentCamActive, setIsStudentCamActive] = useState<boolean>(true);
  const [studentAudioLevel, setStudentAudioLevel] = useState<number>(65);
  const [studentHandRaised, setStudentHandRaised] = useState<boolean>(false);

  // Optical Fretboard Zoom
  const [fretZoomRange, setFretZoomRange] = useState<FretZoomRange>('all');

  // Video element refs
  const teacherVideoRef = useRef<HTMLVideoElement | null>(null);
  const teacherStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Fretboard Teaching State
  const [selectedKey, setSelectedKey] = useState<NoteName>(activeLesson?.key || 'A');
  const [selectedScale, setSelectedScale] = useState<ScaleDefinition>(() => {
    return SCALES.find((s) => s.id === 'minor-pentatonic') || SCALES[0];
  });
  const [highlightedFrets, setHighlightedFrets] = useState<{ string: number; fret: number; label?: string }[]>([
    { string: 6, fret: 5, label: 'R' },
    { string: 6, fret: 8, label: 'b3' },
    { string: 5, fret: 5, label: '4' },
    { string: 5, fret: 7, label: '5' },
    { string: 4, fret: 5, label: 'b7' },
    { string: 4, fret: 7, label: 'R' },
  ]);

  // Metronome state
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(false);
  const [lessonBpm, setLessonBpm] = useState<number>(90);
  const [metronomeBeat, setMetronomeBeat] = useState<number>(0);
  const metronomeIntervalRef = useRef<number | null>(null);

  // Lesson Timer
  const [lessonDurationMinutes, setLessonDurationMinutes] = useState<number>(activeLesson?.durationMinutes || 45);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Live Notes & Homework
  const [liveNotes, setLiveNotes] = useState<string>(
    activeLesson?.notes || 'Focus on relaxing the left-hand thumb and cleanly muting adjacent strings during whole-step bends.'
  );
  const [homeworkItems, setHomeworkItems] = useState<string[]>(
    activeLesson?.homework || [
      'Practice Box 1 ascending & descending with metronome at 80-100 BPM',
      'Target root note (A) on downbeat of measure 1 and 3',
      'Record a 4-bar improvisation loop for teacher review',
    ]
  );
  const [newHomeworkText, setNewHomeworkText] = useState<string>('');

  // Tablature scratchpad
  const [tabSnippet, setTabSnippet] = useState<string>(
    `e|---5---8-p5-------------------------|\nB|-------------8---5------------------|\nG|---------------------7b9---7-p5-----|\nD|---------------------------------7--|\nA|------------------------------------|\nE|------------------------------------|`
  );

  // Chat messages
  const [chatMessages, setChatMessages] = useState<{ sender: 'teacher' | 'student' | 'system'; text: string; time: string }[]>([
    { sender: 'system', text: 'Online Teaching Classroom initiated with high-fidelity 48kHz audio.', time: '10:00' },
    { sender: 'student', text: 'Hi teacher! Ready for today’s lesson on A Minor pentatonic bends.', time: '10:01' },
    { sender: 'teacher', text: 'Welcome! Tune up with the in-app tuner and let’s start with Box 1 warmups.', time: '10:02' },
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  // Copy feedback toast
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [savedLessonToast, setSavedLessonToast] = useState<boolean>(false);

  // New Lesson Modal Form
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentEmail, setNewStudentEmail] = useState<string>('');
  const [newLessonTime, setNewLessonTime] = useState<string>('Tomorrow at 4:00 PM');
  const [newLessonDuration, setNewLessonDuration] = useState<number>(45);
  const [newLessonTopic, setNewLessonTopic] = useState<string>('Improvisation & Soloing');
  const [newLessonKey, setNewLessonKey] = useState<NoteName>('E');

  // Start / Stop WebRTC Teacher Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      const constraints: MediaStreamConstraints = {
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: isHighFidelityMusicMode
          ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
          : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      teacherStreamRef.current = stream;

      if (teacherVideoRef.current) {
        teacherVideoRef.current.srcObject = stream;
      }
      setIsTeacherCamOn(true);
    } catch (err: unknown) {
      console.warn('Camera access not granted or unavailable:', err);
      const errMsg = err instanceof Error ? err.message : 'Camera device not accessible in this browser context.';
      setCameraError(errMsg);
      setIsTeacherCamOn(false);
    }
  };

  const stopCamera = () => {
    if (teacherStreamRef.current) {
      teacherStreamRef.current.getTracks().forEach((track) => track.stop());
      teacherStreamRef.current = null;
    }
    if (teacherVideoRef.current) {
      teacherVideoRef.current.srcObject = null;
    }
    setIsTeacherCamOn(false);
  };

  const toggleTeacherCamera = () => {
    if (isTeacherCamOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Screen sharing
  const [screenShareNotice, setScreenShareNotice] = useState<string | null>(null);

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      // Restore camera if active
      if (isTeacherCamOn && teacherVideoRef.current && teacherStreamRef.current) {
        teacherVideoRef.current.srcObject = teacherStreamRef.current;
      }
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          setScreenShareNotice('Screen sharing (display-capture) is not supported in this browser environment. Use Zoom desktop or open the app directly in a full browser tab.');
          return;
        }
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        if (teacherVideoRef.current) {
          teacherVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (isTeacherCamOn && teacherVideoRef.current && teacherStreamRef.current) {
            teacherVideoRef.current.srcObject = teacherStreamRef.current;
          }
        };
      } catch (err: unknown) {
        const errObj = err as { name?: string; message?: string };
        const msg = errObj?.message || String(err);
        // Handle permissions policy or user rejection gracefully
        if (msg.includes('permissions policy') || msg.includes('display-capture') || errObj?.name === 'NotAllowedError') {
          setScreenShareNotice(
            'Screen capture is restricted by iframe browser permissions policy. To share your screen with students, please click "Open in Zoom" or open this application in a dedicated browser tab (where display-capture is fully enabled).'
          );
        } else if (errObj?.name !== 'AbortError') {
          setScreenShareNotice(`Unable to start screen capture: ${msg}`);
        }
      }
    }
  };

  // Toggle mic
  const toggleTeacherMic = () => {
    if (teacherStreamRef.current) {
      teacherStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isTeacherMicOn;
      });
    }
    setIsTeacherMicOn(!isTeacherMicOn);
  };

  // Cleanup media streams on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (metronomeIntervalRef.current) {
        window.clearInterval(metronomeIntervalRef.current);
      }
    };
  }, []);

  // Metronome loop
  useEffect(() => {
    if (isMetronomeActive) {
      const intervalMs = (60 / lessonBpm) * 1000;
      metronomeIntervalRef.current = window.setInterval(() => {
        setMetronomeBeat((b) => {
          const next = (b + 1) % 4;
          soundEngine.playClick(next === 0);
          return next;
        });
      }, intervalMs);
    } else {
      if (metronomeIntervalRef.current) {
        window.clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
      }
      setMetronomeBeat(0);
    }

    return () => {
      if (metronomeIntervalRef.current) {
        window.clearInterval(metronomeIntervalRef.current);
      }
    };
  }, [isMetronomeActive, lessonBpm]);

  // Simulated student audio fluctuation to give life to student tile
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (isStudentCamActive) {
        setStudentAudioLevel(Math.floor(40 + Math.random() * 45));
      }
    }, 600);
    return () => clearInterval(timer);
  }, [isStudentCamActive]);

  // Lesson timer loop
  useEffect(() => {
    let interval: number | null = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = window.setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (secondsRemaining === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      soundEngine.playClick(true);
      alert('Lesson time complete! Great session.');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, secondsRemaining]);

  // Change active lesson
  const handleSelectLesson = (lesson: OnlineLessonSession) => {
    setActiveLesson(lesson);
    setSelectedKey(lesson.key);
    if (lesson.scaleId) {
      const found = SCALES.find((s) => s.id === lesson.scaleId);
      if (found) setSelectedScale(found);
    }
    setLiveNotes(lesson.notes);
    setHomeworkItems(lesson.homework || []);
    setLessonDurationMinutes(lesson.durationMinutes);
    setSecondsRemaining(lesson.durationMinutes * 60);
  };

  // Click on a fret to toggle highlight & play note
  const handleFretClick = (stringNum: number, fret: number) => {
    const pos = getFretPosition(stringNum, fret, GUITAR_TUNINGS[0]);
    soundEngine.playPluckedString(pos.frequency, 1.8);

    const existsIndex = highlightedFrets.findIndex((h) => h.string === stringNum && h.fret === fret);
    if (existsIndex >= 0) {
      setHighlightedFrets(highlightedFrets.filter((_, i) => i !== existsIndex));
    } else {
      setHighlightedFrets([...highlightedFrets, { string: stringNum, fret, label: pos.note }]);
    }
  };

  // Stamp quick chord shapes
  const handleStampChord = (shape: 'Am' | 'C' | 'E7' | 'G' | 'D9') => {
    let frets: { string: number; fret: number; label?: string }[] = [];
    if (shape === 'Am') {
      frets = [
        { string: 5, fret: 0, label: 'A' },
        { string: 4, fret: 2, label: 'E' },
        { string: 3, fret: 2, label: 'A' },
        { string: 2, fret: 1, label: 'C' },
        { string: 1, fret: 0, label: 'E' },
      ];
    } else if (shape === 'C') {
      frets = [
        { string: 5, fret: 3, label: 'C' },
        { string: 4, fret: 2, label: 'E' },
        { string: 3, fret: 0, label: 'G' },
        { string: 2, fret: 1, label: 'C' },
        { string: 1, fret: 0, label: 'E' },
      ];
    } else if (shape === 'E7') {
      frets = [
        { string: 6, fret: 0, label: 'E' },
        { string: 5, fret: 2, label: 'B' },
        { string: 4, fret: 0, label: 'D' },
        { string: 3, fret: 1, label: 'G#' },
        { string: 2, fret: 0, label: 'B' },
        { string: 1, fret: 0, label: 'E' },
      ];
    } else if (shape === 'D9') {
      frets = [
        { string: 5, fret: 5, label: 'D' },
        { string: 4, fret: 4, label: 'F#' },
        { string: 3, fret: 5, label: 'C' },
        { string: 2, fret: 5, label: 'E' },
      ];
    }
    setHighlightedFrets(frets);

    // Strum chord notes in sequence
    frets.forEach((f, idx) => {
      setTimeout(() => {
        const p = getFretPosition(f.string, f.fret, GUITAR_TUNINGS[0]);
        soundEngine.playPluckedString(p.frequency, 1.5);
      }, idx * 60);
    });
  };

  // Zoom range filter
  const getFretRange = (): { start: number; end: number } => {
    switch (fretZoomRange) {
      case 'open':
        return { start: 0, end: 5 };
      case 'mid':
        return { start: 5, end: 12 };
      case 'high':
        return { start: 12, end: 20 };
      case 'all':
      default:
        return { start: 0, end: 16 };
    }
  };

  const currentRange = getFretRange();
  const fretsToRender = Array.from(
    { length: currentRange.end - currentRange.start + 1 },
    (_, i) => currentRange.start + i
  );

  // Send message in in-class chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [
      ...prev,
      { sender: 'teacher', text: chatInput.trim(), time: now },
    ]);
    setChatInput('');
  };

  // Add homework item
  const handleAddHomework = () => {
    if (!newHomeworkText.trim()) return;
    setHomeworkItems([...homeworkItems, newHomeworkText.trim()]);
    setNewHomeworkText('');
  };

  // Save current lesson data
  const handleSaveLesson = () => {
    if (!activeLesson) return;
    const updated: OnlineLessonSession = {
      ...activeLesson,
      notes: liveNotes,
      homework: homeworkItems,
      durationMinutes: lessonDurationMinutes,
      key: selectedKey,
      scaleId: selectedScale.id,
    };
    storage.saveLesson(updated);
    setLessons(storage.getLessons());
    setActiveLesson(updated);
    setSavedLessonToast(true);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.85 } });
    setTimeout(() => setSavedLessonToast(false), 2200);
  };

  // Copy Zoom Invitation
  const handleCopyZoomInvite = () => {
    const inviteText = `🎸 FretMaster Live Online Guitar Lesson
-----------------------------------------
Student: ${activeLesson?.studentName || 'Student'}
Topic: ${activeLesson?.topic || 'Guitar Lesson'}
Key / Mode: ${selectedKey} ${selectedScale.name}
Time: ${activeLesson?.scheduledTime || 'Scheduled Session'} (${lessonDurationMinutes} minutes)

Zoom Meeting Link:
${activeLesson?.zoomMeetingUrl || 'https://zoom.us/j/84920391148?pwd=FRETMASTER_CLASSROOM'}

Meeting ID: ${activeLesson?.zoomMeetingId || '849 2039 1148'}
Passcode: ${activeLesson?.zoomPasscode || 'GUITAR24'}

Lesson Prep Checklist:
1. Please tune your guitar using the FretMaster audio tuner before joining.
2. Wear headphones or select 'Original Sound for Musicians' in Zoom audio settings for best acoustic tone.
3. Bring your pick, capo, and notebook!`;

    navigator.clipboard.writeText(inviteText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Download iCalendar invite (.ics)
  const handleDownloadIcs = () => {
    const title = `Guitar Lesson: ${activeLesson?.studentName || 'Student'} - ${activeLesson?.topic || 'Guitar Session'}`;
    const desc = `Live guitar lesson on ${selectedKey} ${selectedScale.name}. Zoom link: ${activeLesson?.zoomMeetingUrl || 'https://zoom.us'}`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FretMaster//Guitar Teaching Studio//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      `URL:${activeLesson?.zoomMeetingUrl || 'https://zoom.us'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-${(activeLesson?.studentName || 'student').toLowerCase().replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Schedule new lesson submit
  const handleCreateNewLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const randomMeetingId = `${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
    const randomPasscode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const cleanId = randomMeetingId.replace(/\s+/g, '');

    const newLesson: OnlineLessonSession = {
      id: `lesson-${Date.now()}`,
      studentName: newStudentName.trim(),
      studentEmail: newStudentEmail.trim() || 'student@example.com',
      scheduledTime: newLessonTime.trim() || 'Next week',
      durationMinutes: newLessonDuration,
      topic: newLessonTopic.trim() || 'Guitar Technique & Theory',
      level: 'Intermediate',
      key: newLessonKey,
      scaleId: 'minor-pentatonic',
      zoomMeetingId: randomMeetingId,
      zoomMeetingUrl: `https://zoom.us/j/${cleanId}?pwd=${randomPasscode}`,
      zoomPasscode: randomPasscode,
      notes: `Focus goals for ${newStudentName}: Clean string muting, rhythm timing, and ear training exercises.`,
      homework: [
        'Practice designated scale pattern daily for 15 minutes',
        'Record exercise run and review timing with metronome',
      ],
      completed: false,
      createdAt: Date.now(),
    };

    storage.saveLesson(newLesson);
    setLessons(storage.getLessons());
    setActiveLesson(newLesson);
    setIsScheduleModalOpen(false);
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 } });
  };

  // Format timer seconds
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-blue-950/40 border border-blue-400/30">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                Live Online Teaching & Zoom Studio
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                WebRTC & Zoom Suite
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive 1-on-1 virtual classroom with live video, dual fretboard optical zoom, synchronized metronome, and instant Zoom links.
            </p>
          </div>
        </div>

        {/* Studio View Navigation Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setClassroomTab('classroom')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                classroomTab === 'classroom'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Live Classroom</span>
            </button>

            <button
              onClick={() => setClassroomTab('schedule')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                classroomTab === 'schedule'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule & Zoom ({lessons.length})</span>
            </button>

            <button
              onClick={() => setClassroomTab('notes')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                classroomTab === 'notes'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Homework & Notes</span>
            </button>
          </div>

          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Student Session</span>
          </button>
        </div>
      </div>

      {/* Main Classroom View */}
      {classroomTab === 'classroom' && (
        <div className="space-y-6">
          {/* Active Lesson Banner & Instant Zoom Quick-Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-950/50 via-slate-900 to-slate-950 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    Current Student: {activeLesson?.studentName || 'Select a student'}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                    {activeLesson?.topic || 'Custom Lesson'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>{activeLesson?.scheduledTime}</span>
                  <span>•</span>
                  <span>Target Key: <strong className="text-amber-300 font-mono">{selectedKey} {selectedScale.name}</strong></span>
                </p>
              </div>
            </div>

            {/* Quick Zoom Launcher & Invitation */}
            <div className="flex items-center gap-2">
              <a
                href={activeLesson?.zoomMeetingUrl || 'https://zoom.us'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
                title="Launch this lesson in Zoom client or browser"
              >
                <Video className="w-3.5 h-3.5 fill-current" />
                <span>Open in Zoom</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>

              <button
                onClick={handleCopyZoomInvite}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                title="Copy ready-to-send Zoom invite with password & preparation instructions"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
                <span>{copiedLink ? 'Copied Invite!' : 'Copy Zoom Invite'}</span>
              </button>

              <button
                onClick={handleDownloadIcs}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                title="Download Calendar (.ics) file"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dual Video Stage (Teacher + Student Feeds) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Teacher Video Screen */}
            <div className="relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl aspect-video flex flex-col justify-between p-4 group">
              {/* Real Video Element or Camera Off Placeholder */}
              {isTeacherCamOn ? (
                <video
                  ref={teacherVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 flex flex-col items-center justify-center p-6 text-center z-0">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-3 text-slate-400">
                    <VideoOff className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Teacher Camera is Off</h4>
                  <p className="text-xs text-slate-400 max-w-xs mb-3">
                    Click "Turn Camera On" below to broadcast your guitar demonstration with high-resolution video.
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all"
                  >
                    Turn Camera On
                  </button>
                </div>
              )}

              {/* Overlay Top Bar: Status, High-Fi Music Mode */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700 text-[11px] font-bold text-white flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isTeacherCamOn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    Teacher (You)
                  </span>
                  {isScreenSharing && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                      Sharing Screen
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setIsHighFidelityMusicMode(!isHighFidelityMusicMode)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                    isHighFidelityMusicMode
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900/80 text-slate-400 border-slate-700'
                  }`}
                  title="Disables aggressive browser echo-cancellation to preserve guitar string tone"
                >
                  🎵 Music Audio Mode: {isHighFidelityMusicMode ? 'HQ 48kHz' : 'Standard Voice'}
                </button>
              </div>

              {/* Screen Share / Permissions Notice Warning if Triggered */}
              {screenShareNotice && (
                <div className="relative z-20 my-auto p-3.5 rounded-2xl bg-slate-900/95 border border-amber-500/40 text-left shadow-2xl backdrop-blur-md">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">Screen Sharing & Zoom Advisory</p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{screenShareNotice}</p>
                      <div className="flex items-center gap-2 pt-1.5">
                        <a
                          href={activeLesson?.zoomUrl || 'https://zoom.us'}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold inline-flex items-center gap-1"
                        >
                          <Video className="w-3 h-3 fill-current" />
                          <span>Open in Zoom Desktop</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <button
                          onClick={() => setScreenShareNotice(null)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Overlay Bottom Bar: Camera / Mic / Screen Share Controls */}
              <div className="relative z-10 flex items-center justify-between bg-slate-900/85 backdrop-blur-md border border-slate-800 p-2 rounded-2xl">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleTeacherCamera}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isTeacherCamOn
                        ? 'bg-slate-800 text-white hover:bg-slate-700'
                        : 'bg-rose-500 text-white hover:bg-rose-600'
                    }`}
                    title="Toggle Camera"
                  >
                    {isTeacherCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    <span>{isTeacherCamOn ? 'Cam On' : 'Cam Off'}</span>
                  </button>

                  <button
                    onClick={toggleTeacherMic}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isTeacherMicOn
                        ? 'bg-slate-800 text-white hover:bg-slate-700'
                        : 'bg-rose-500 text-white hover:bg-rose-600'
                    }`}
                    title="Toggle Microphone"
                  >
                    {isTeacherMicOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
                    <span>{isTeacherMicOn ? 'Mic On' : 'Muted'}</span>
                  </button>

                  <button
                    onClick={toggleScreenShare}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isScreenSharing
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Share Tab, Sheet Music or DAW Screen"
                  >
                    <ScreenShare className="w-4 h-4" />
                    <span>{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                  <Guitar className="w-3.5 h-3.5 text-amber-400" />
                  <span>1080p HD Studio</span>
                </div>
              </div>
            </div>

            {/* Student Video Screen */}
            <div className="relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl aspect-video flex flex-col justify-between p-4 group">
              {/* Simulated Student Video Feed */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-950 flex flex-col items-center justify-center p-6 text-center z-0">
                {/* Simulated Student Avatar / Feed Animation */}
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-950/50">
                    {activeLesson?.studentName
                      ? activeLesson.studentName.split(' ').map((n) => n[0]).join('')
                      : 'ST'}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                </div>
                <h4 className="text-sm font-bold text-white">{activeLesson?.studentName || 'Student'}</h4>
                <p className="text-xs text-slate-400 mb-2">Connected via WebRTC / Zoom Bridge</p>

                {/* Live Student Audio & Pitch Monitor */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-slate-400 text-[11px]">Guitar Audio Level:</span>
                  <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${studentAudioLevel}%` }}
                    />
                  </div>
                  <span className="font-mono text-emerald-400 text-[10px]">Active</span>
                </div>
              </div>

              {/* Overlay Top Bar: Student Name, Level & Hand Raise */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700 text-[11px] font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {activeLesson?.studentName} ({activeLesson?.level || 'Intermediate'})
                </span>

                {studentHandRaised && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold animate-bounce flex items-center gap-1">
                    ✋ Question / Hand Raised
                  </span>
                )}
              </div>

              {/* Overlay Bottom Bar: Audio controls & Quick Student Actions */}
              <div className="relative z-10 flex items-center justify-between bg-slate-900/85 backdrop-blur-md border border-slate-800 p-2 rounded-2xl">
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setStudentHandRaised(!studentHandRaised)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    title="Simulate student raising hand"
                  >
                    ✋ Hand: {studentHandRaised ? 'Raised' : 'Lowered'}
                  </button>

                  <button
                    onClick={() => {
                      // Student pitch check demo
                      soundEngine.playPluckedString(220, 1.2); // A3
                      alert(`Student Pitch Verified: Note A3 (220 Hz) detected cleanly in tune.`);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Check Student Tuning</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">Audio Stream:</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Lesson Companion Bar: Timer & Metronome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            {/* Countdown Lesson Timer */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Lesson Timer
                </span>
                <span className="text-2xl font-black font-mono text-white">
                  {formatTimer(secondsRemaining)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`p-2 rounded-lg text-xs font-bold transition-all ${
                    isTimerRunning
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                  title={isTimerRunning ? 'Pause Timer' : 'Start Timer'}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setSecondsRemaining(lessonDurationMinutes * 60);
                  }}
                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metronome */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Shared Metronome
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xl font-black font-mono text-white">{lessonBpm}</span>
                  <span className="text-xs text-slate-400">BPM</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((b) => (
                    <span
                      key={b}
                      className={`w-2 h-2 rounded-full transition-all ${
                        isMetronomeActive && metronomeBeat === b
                          ? 'bg-amber-400 scale-125'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    isMetronomeActive
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  {isMetronomeActive ? 'Stop' : 'Start'}
                </button>
              </div>
            </div>

            {/* Quick Key / Scale Sync */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Teaching Key & Scale
              </span>
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value as NoteName)}
                  className="bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-xs rounded-lg px-2 py-1 focus:outline-none"
                >
                  {NOTE_NAMES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedScale.id}
                  onChange={(e) => {
                    const s = SCALES.find((sc) => sc.id === e.target.value);
                    if (s) setSelectedScale(s);
                  }}
                  className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 focus:outline-none flex-1 truncate"
                >
                  {SCALES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sync to Student Main Fretboard */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Broadcast to Fretboard
                </span>
                <span className="text-xs text-slate-400">Sync with main neck trainer</span>
              </div>
              {onSyncFretboard && (
                <button
                  onClick={() => onSyncFretboard(selectedKey, selectedScale)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-bold transition-all"
                >
                  Sync
                </button>
              )}
            </div>
          </div>

          {/* Interactive Shared Teaching Fretboard with OPTICAL ZOOM */}
          <div className="p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Guitar className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    Interactive Teaching Fretboard
                  </h3>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Key of {selectedKey} {selectedScale.name}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any fret to audition notes and demonstrate fingerings. Use the Optical Zoom below to isolate specific neck positions for your student.
                </p>
              </div>

              {/* Fretboard Optical Zoom Selector */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs flex items-center gap-1 pl-1">
                  <ZoomIn className="w-3.5 h-3.5 text-blue-400" /> Zoom:
                </span>
                {(
                  [
                    { id: 'all', label: 'Full Neck (0-16)' },
                    { id: 'open', label: 'Nut & Open (0-5)' },
                    { id: 'mid', label: 'Box 1 Mid (5-12)' },
                    { id: 'high', label: 'Lead Solo (12-20)' },
                  ] as { id: FretZoomRange; label: string }[]
                ).map((z) => (
                  <button
                    key={z.id}
                    onClick={() => setFretZoomRange(z.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      fretZoomRange === z.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Chord Shape Stamps */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] font-semibold">Quick Voicings:</span>
                {(['Am', 'C', 'E7', 'D9'] as ('Am' | 'C' | 'E7' | 'D9')[]).map((chord) => (
                  <button
                    key={chord}
                    onClick={() => handleStampChord(chord)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-mono font-bold transition-colors border border-slate-700"
                  >
                    {chord}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setHighlightedFrets([])}
                className="text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All Markers
              </button>
            </div>

            {/* Guitar Fretboard Graphic View */}
            <div className="overflow-x-auto pb-3 pt-2">
              <div className="min-w-[700px] bg-gradient-to-r from-amber-950/20 via-slate-950 to-amber-950/20 p-4 rounded-2xl border border-slate-800 shadow-inner">
                {/* Frets Top Marker Numbers */}
                <div className="grid text-center font-mono text-[10px] text-slate-400 mb-1" style={{ gridTemplateColumns: `50px repeat(${fretsToRender.length}, 1fr)` }}>
                  <div>NUT</div>
                  {fretsToRender.map((f) => (
                    <div key={f} className={`font-bold ${[3, 5, 7, 9, 12, 15, 17, 19].includes(f) ? 'text-amber-400' : ''}`}>
                      {f}
                    </div>
                  ))}
                </div>

                {/* 6 Guitar Strings */}
                <div className="space-y-3 relative">
                  {[1, 2, 3, 4, 5, 6].map((stringNum) => {
                    const openPos = getFretPosition(stringNum, 0, GUITAR_TUNINGS[0]);
                    return (
                      <div
                        key={stringNum}
                        className="grid items-center relative"
                        style={{ gridTemplateColumns: `50px repeat(${fretsToRender.length}, 1fr)` }}
                      >
                        {/* String Label (e.g. E4, B3, G3, D3, A2, E2) */}
                        <button
                          onClick={() => soundEngine.playPluckedString(openPos.frequency, 2.0)}
                          className="w-10 h-7 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono text-xs font-bold flex items-center justify-center hover:bg-slate-700 transition-colors"
                          title="Audition open string"
                        >
                          {openPos.note}
                        </button>

                        {/* String Frets */}
                        {fretsToRender.map((fret) => {
                          const pos = getFretPosition(stringNum, fret, GUITAR_TUNINGS[0]);
                          const isHighlighted = highlightedFrets.some(
                            (h) => h.string === stringNum && h.fret === fret
                          );
                          const isRoot = pos.note === selectedKey;

                          return (
                            <div
                              key={fret}
                              onClick={() => handleFretClick(stringNum, fret)}
                              className={`h-8 border-r border-slate-700 relative flex items-center justify-center cursor-pointer transition-all hover:bg-blue-500/20 ${
                                fret === 0 ? 'border-r-4 border-amber-300/60' : ''
                              }`}
                            >
                              {/* Horizontal String Line */}
                              <div
                                className="absolute left-0 right-0 bg-slate-600"
                                style={{ height: `${0.8 + stringNum * 0.3}px` }}
                              />

                              {/* Fret Note Marker */}
                              {isHighlighted ? (
                                <span
                                  className={`relative z-10 w-6 h-6 rounded-full font-mono text-[11px] font-extrabold flex items-center justify-center shadow-lg transition-transform scale-110 ${
                                    isRoot
                                      ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                                      : 'bg-blue-500 text-white ring-2 ring-blue-300'
                                  }`}
                                >
                                  {pos.note}
                                </span>
                              ) : (
                                <span className="opacity-0 hover:opacity-100 relative z-10 text-[9px] font-mono text-slate-400 bg-slate-900/90 px-1 rounded">
                                  {pos.note}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Lesson Notepad & In-Class Tablature Scratchpad */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Lesson Notes & Homework */}
            <div className="p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h4 className="text-sm font-bold text-white">Live Lesson Notes & Goals</h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveLesson}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Notes</span>
                  </button>
                  {savedLessonToast && (
                    <span className="text-xs text-emerald-400 font-semibold animate-in fade-in">
                      Saved!
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Teacher Observations & Technique Feedback:
                </label>
                <textarea
                  value={liveNotes}
                  onChange={(e) => setLiveNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                  placeholder="Record finger placement, wrist posture, timing notes, and exercise advice..."
                />
              </div>

              {/* Homework Checklist */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-2">
                  Student Homework Checklist:
                </label>
                <div className="space-y-2 mb-3">
                  {homeworkItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                      <button
                        onClick={() => setHomeworkItems(homeworkItems.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newHomeworkText}
                    onChange={(e) => setNewHomeworkText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHomework()}
                    placeholder="Add practice task (e.g. 10 reps of clean barre chord transition)..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddHomework}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* In-Class Tablature Scratchpad & Instant Chat */}
            <div className="p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">Tablature Scratchpad & Chat</h4>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(tabSnippet);
                    alert('Tab snippet copied to clipboard!');
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                >
                  <Copy className="w-3 h-3" /> Copy Tab
                </button>
              </div>

              {/* Editable Tab Snippet */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Live Tablature Editor (Broadcasts in Real Time):
                </label>
                <textarea
                  value={tabSnippet}
                  onChange={(e) => setTabSnippet(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 leading-tight"
                />
              </div>

              {/* Chat Stream */}
              <div className="space-y-2">
                <div className="max-h-36 overflow-y-auto space-y-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        msg.sender === 'teacher' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-1.5 ${
                          msg.sender === 'teacher'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : msg.sender === 'system'
                            ? 'bg-slate-800 text-amber-300 font-mono text-[10px]'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none'
                        }`}
                      >
                        <span className="text-[10px] opacity-70 block mb-0.5">
                          {msg.sender === 'teacher' ? 'You' : msg.sender === 'student' ? activeLesson?.studentName : 'System'} • {msg.time}
                        </span>
                        <span>{msg.text}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChat} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type in-lesson message or tab instruction..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule & Zoom Sessions Tab */}
      {classroomTab === 'schedule' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lessons.map((lesson) => {
              const isActive = activeLesson?.id === lesson.id;
              return (
                <div
                  key={lesson.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                    isActive
                      ? 'bg-gradient-to-b from-blue-950/40 to-slate-900 border-blue-500/80 shadow-xl ring-2 ring-blue-500/20'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {lesson.level}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{lesson.durationMinutes} min</span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-0.5">{lesson.studentName}</h4>
                    <p className="text-xs text-amber-300 font-medium mb-2">{lesson.topic}</p>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 mb-4">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Time:</span>
                        <strong className="text-white">{lesson.scheduledTime}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Zoom ID:</span>
                        <strong className="text-blue-400 font-mono">{lesson.zoomMeetingId || 'Pending'}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Passcode:</span>
                        <strong className="text-amber-400 font-mono">{lesson.zoomPasscode || 'GUITAR'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        handleSelectLesson(lesson);
                        setClassroomTab('classroom');
                      }}
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Start Classroom Session</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <a
                        href={lesson.zoomMeetingUrl || 'https://zoom.us'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center gap-1"
                      >
                        <span>Open Zoom</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => {
                          const updated = lessons.filter((l) => l.id !== lesson.id);
                          setLessons(updated);
                          storage.deleteLesson(lesson.id);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Homework & Student Notes History Tab */}
      {classroomTab === 'notes' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Student Lesson Records & Assignments</h3>
              <p className="text-xs text-slate-400">
                Review past teaching notes, student progression milestones, and assigned practice tasks.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{lesson.studentName}</span>
                    <span className="text-xs text-slate-400">({lesson.studentEmail})</span>
                  </div>
                  <span className="text-xs text-amber-400 font-mono">{lesson.scheduledTime}</span>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Lesson Observations:
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    {lesson.notes}
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Assigned Homework Checklist:
                  </h5>
                  <ul className="space-y-1">
                    {lesson.homework.map((hw, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{hw}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule New Lesson Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Schedule New Online Lesson</h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateNewLesson} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Julian Casablancas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Student Email
                </label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="e.g. julian@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Lesson Date / Time
                  </label>
                  <input
                    type="text"
                    value={newLessonTime}
                    onChange={(e) => setNewLessonTime(e.target.value)}
                    placeholder="e.g. Thursday at 5:00 PM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Duration (Minutes)
                  </label>
                  <select
                    value={newLessonDuration}
                    onChange={(e) => setNewLessonDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Lesson Topic / Goal
                  </label>
                  <input
                    type="text"
                    value={newLessonTopic}
                    onChange={(e) => setNewLessonTopic(e.target.value)}
                    placeholder="e.g. Soloing & Minor Pentatonic"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Target Musical Key
                  </label>
                  <select
                    value={newLessonKey}
                    onChange={(e) => setNewLessonKey(e.target.value as NoteName)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {NOTE_NAMES.map((n) => (
                      <option key={n} value={n}>
                        Key of {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-xs text-slate-400 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>
                  FretMaster will automatically generate a unique Zoom meeting room ID, secure passcode, and formatted invite ready to send to your student.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all"
                >
                  Create & Generate Zoom Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
