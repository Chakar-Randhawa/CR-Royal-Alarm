import { useState, useEffect, useRef, useCallback } from 'react';
import type { Alarm } from '@/types';
import {
  playAlarmTone,
  stopAlarmTone,
  playCustomAudio,
  stopCustomAudio,
  startFadeOut,
  vibratePattern,
  stopVibration,
  speakBriefing,
  getAnalyserData,
} from '@/lib/audio';
import { keepScreenAwake, allowSleep } from '@/lib/notifications';
import { getAlarms, saveAlarms } from '@/lib/storage';

interface AlarmTriggerProps {
  alarm: Alarm;
  onDismiss: () => void;
}

const SHAKE_THRESHOLDS: Record<string, number> = {
  gentle: 8,
  moderate: 13,
  vigorous: 20,
};

const BAR_COUNT = 24;

export function AlarmTrigger({ alarm, onDismiss }: AlarmTriggerProps) {
  const [snoozesUsed, setSnoozesUsed] = useState(0);
  const [missionState, setMissionState] = useState<'idle' | 'active' | 'complete'>('idle');
  const [shakeCount, setShakeCount] = useState(0);
  const [mathIndex, setMathIndex] = useState(0);
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathProblems, setMathProblems] = useState<{ question: string; answer: number }[]>([]);
  const [pinInput, setPinInput] = useState('');
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [barLevels, setBarLevels] = useState<number[]>(() => new Array(BAR_COUNT).fill(0.1));
  const vibrationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0, time: 0 });
  const rafRef = useRef<number | null>(null);

  const isCustomAudio = !!(alarm && alarm.audio_source === 'custom' && alarm.audio_local_path);

  useEffect(() => {
    try {
      keepScreenAwake();
    } catch (e) {
      console.log('Native screen lock bypass active', e);
    }

    try {
      if (isCustomAudio) {
        playCustomAudio(
          alarm.audio_local_path,
          alarm.audio_clip_length || 30,
          1.0,
          alarm.volume_crescendo || 'off'
        );
      } else {
        playAlarmTone(
          alarm ? alarm.audio_source : 'tone_1',
          1.0,
          alarm ? alarm.volume_crescendo : 'off',
          !!(alarm && alarm.vibrate_override)
        );
      }
    } catch (e) {
      console.error('Audio trigger delayed', e);
    }

    // Drive the equalizer visualizer from the real playing audio.
    function tickVisualizer() {
      const data = getAnalyserData();
      if (data) {
        const step = Math.floor(data.length / BAR_COUNT) || 1;
        const levels: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          const v = data[i * step] || 0;
          levels.push(Math.max(0.08, v / 255));
        }
        setBarLevels(levels);
      }
      rafRef.current = requestAnimationFrame(tickVisualizer);
    }
    rafRef.current = requestAnimationFrame(tickVisualizer);

    try {
      vibrationTimerRef.current = vibratePattern(alarm ? alarm.vibration_pattern : 'continuous');
    } catch (e) {
      console.error(e);
    }

    if (alarm && alarm.fade_out !== 'never') {
      try {
        startFadeOut(alarm.fade_out);
      } catch (e) {
        console.log(e);
      }
    }

    if (alarm && alarm.mission_type && alarm.mission_type !== 'none') {
      setMissionState('active');
      if (alarm.mission_type === 'math') {
        generateMathProblems();
      }
    }

    return () => {
      try {
        stopAlarmTone();
        stopCustomAudio();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (vibrationTimerRef.current) {
          stopVibration(vibrationTimerRef.current);
        }
        allowSleep();
      } catch (e) {
        console.log(e);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real shake detection via DeviceMotion (Android + most WebViews expose this
  // without needing a permission prompt; iOS Safari 13+ needs explicit
  // permission which is requested lazily on first mount if available).
  const registerShake = useCallback(() => {
    setShakeCount((prev) => {
      const next = prev + 1;
      const target = alarm.shake_count || 20;
      if (next >= target) {
        setMissionState('complete');
        try {
          stopAlarmTone();
          stopCustomAudio();
          if (vibrationTimerRef.current) stopVibration(vibrationTimerRef.current);
        } catch {
          // no-op
        }
      }
      return next;
    });
  }, [alarm.shake_count]);

  useEffect(() => {
    if (missionState !== 'active' || alarm.mission_type !== 'shake') return;

    const threshold = SHAKE_THRESHOLDS[alarm.shake_intensity] || SHAKE_THRESHOLDS.moderate;

    function handleMotion(e: DeviceMotionEvent) {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const now = Date.now();
      if (now - lastAccelRef.current.time < 120) return;

      const deltaX = Math.abs((acc.x || 0) - lastAccelRef.current.x);
      const deltaY = Math.abs((acc.y || 0) - lastAccelRef.current.y);
      const deltaZ = Math.abs((acc.z || 0) - lastAccelRef.current.z);

      lastAccelRef.current = { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0, time: now };

      if (deltaX + deltaY + deltaZ > threshold) {
        registerShake();
      }
    }

    // iOS 13+ requires an explicit user-gesture permission request; Android
    // and older browsers expose the event without one.
    const DeviceMotionEventTyped = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DeviceMotionEventTyped.requestPermission === 'function') {
      DeviceMotionEventTyped
        .requestPermission()
        .then((result) => {
          if (result === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(() => {
          // permission denied or unsupported — the manual "Simulate Shake" button still works
        });
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [missionState, alarm.mission_type, alarm.shake_intensity, registerShake]);

  function generateMathProblems() {
    const problems: { question: string; answer: number }[] = [];
    const count = alarm && typeof alarm.math_count === 'number' ? alarm.math_count : 3;

    for (let i = 0; i < count; i++) {
      let a: number, b: number, answer: number, question: string;
      const difficulty = alarm ? alarm.math_difficulty : 'easy';

      if (difficulty === 'easy') {
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        answer = a + b;
        question = `${a} + ${b}`;
      } else if (difficulty === 'medium') {
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 20) + 1;
        const op = Math.random() > 0.5 ? '+' : '-';
        if (op === '+') {
          answer = a + b;
          question = `${a} + ${b}`;
        } else {
          if (a < b) [a, b] = [b, a];
          answer = a - b;
          question = `${a} - ${b}`;
        }
      } else {
        a = Math.floor(Math.random() * 12) + 2;
        b = Math.floor(Math.random() * 12) + 2;
        answer = a * b;
        question = `${a} × ${b}`;
      }
      problems.push({ question, answer });
    }
    setMathProblems(problems);
  }

  function canSnooze() {
    if (!alarm) return false;
    if (typeof alarm.snooze_limit === 'number' && alarm.snooze_limit > 0 && snoozesUsed >= alarm.snooze_limit) {
      return false;
    }
    return true;
  }

  function getSnoozeDuration() {
    if (!alarm) return 5;
    const base = typeof alarm.snooze_duration === 'number' ? alarm.snooze_duration : 5;
    if (alarm.snooze_escalate) {
      const duration = base / Math.pow(2, snoozesUsed);
      return Math.max(Math.round(duration), 1);
    }
    return base;
  }

  async function handleSnooze() {
    if (alarm && alarm.snooze_shake_bypass && shakeCount < 5) {
      setShakeCount((prev) => prev + 1);
      return;
    }

    const duration = getSnoozeDuration();
    setSnoozesUsed((prev) => prev + 1);

    try {
      stopAlarmTone();
      stopCustomAudio();
      if (vibrationTimerRef.current) stopVibration(vibrationTimerRef.current);
      allowSleep();
    } catch {
      // no-op
    }

    const snoozeTime = new Date(Date.now() + duration * 60 * 1000);
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 100000),
            title: 'CR Royal Alarm',
            body: alarm ? alarm.label : 'Alarm ringing',
            schedule: { at: snoozeTime },
            extra: { alarmId: alarm ? alarm.id : '', missionType: alarm ? alarm.mission_type : 'none' },
            channelId: 'cr_royal_alarm_channel',
          },
        ],
      });
    } catch (e) {
      console.log('Local notification schedule bypass', e);
    }

    onDismiss();
  }

  async function handleDismiss() {
    if (missionState === 'active') return;

    try {
      stopAlarmTone();
      stopCustomAudio();
      if (vibrationTimerRef.current) stopVibration(vibrationTimerRef.current);
      allowSleep();
    } catch {
      // no-op
    }

    if (alarm && alarm.post_dismiss_tts) {
      try {
        speakBriefing();
      } catch {
        // no-op
      }
    }

    if (alarm && alarm.is_one_time && alarm.id) {
      try {
        const alarmsArray = getAlarms();
        const filteredAlarms = alarmsArray.filter((a) => a.id !== alarm.id);
        saveAlarms(filteredAlarms);
      } catch (error) {
        console.error('Local clean operation failed on trigger exit:', error);
      }
    }

    onDismiss();
  }

  function submitMathAnswer() {
    const answer = parseInt(mathAnswer);
    if (isNaN(answer) || !mathProblems || !mathProblems[mathIndex]) return;

    if (answer === mathProblems[mathIndex].answer) {
      const nextIndex = mathIndex + 1;
      if (nextIndex >= mathProblems.length) {
        setMissionState('complete');
        try {
          stopAlarmTone();
          stopCustomAudio();
          if (vibrationTimerRef.current) stopVibration(vibrationTimerRef.current);
        } catch {
          // no-op
        }
      } else {
        setMathIndex(nextIndex);
        setMathAnswer('');
      }
    } else {
      setMathAnswer('');
    }
  }

  function submitPin() {
    if (alarm && pinInput === alarm.scanner_skip_pin && pinInput.length > 0) {
      setMissionState('complete');
      try {
        stopAlarmTone();
        stopCustomAudio();
        if (vibrationTimerRef.current) stopVibration(vibrationTimerRef.current);
      } catch {
        // no-op
      }
    } else {
      setPinInput('');
    }
  }

  function completeScannerMission() {
    setMissionState('complete');
    try {
      stopAlarmTone();
      stopCustomAudio();
      if (vibrationTimerRef.current) stopVibration(vibrationTimerRef.current);
    } catch {
      // no-op
    }
  }

  const currentProblem = Array.isArray(mathProblems) ? mathProblems[mathIndex] : null;
  const missionComplete = missionState === 'complete' || missionState === 'idle';

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 35%, var(--c-bgTertiary) 0%, var(--c-bg) 70%)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Ambient floating particles for a premium, alive feel */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="cr-particle"
            style={{
              left: `${(i * 137) % 100}%`,
              animationDelay: `${(i * 0.6) % 6}s`,
              animationDuration: `${5 + (i % 5)}s`,
              opacity: 0.15 + (i % 4) * 0.05,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col items-center w-full max-w-sm relative">
        <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
          <span className="cr-ring cr-ring-1" />
          <span className="cr-ring cr-ring-2" />
          <span className="cr-ring cr-ring-3" />
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center relative z-10"
            style={{ backgroundColor: 'var(--c-error)', boxShadow: '0 0 50px var(--c-error), 0 0 100px rgba(220,38,38,0.4)' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="13" r="9" stroke="#fff" strokeWidth="2" />
              <path d="M12 8v5l3 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <path d="M5 3 2 6M22 6l-3-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-2 text-center" style={{ color: 'var(--c-text)' }}>
          {(alarm && alarm.label) || 'Alarm'}
        </h1>
        <p className="text-lg mb-4" style={{ color: 'var(--c-textSecondary)' }}>
          {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </p>

        {/* Real audio-reactive equalizer, driven by the actual playing tone / song */}
        <div className="flex items-end justify-center gap-[3px] h-10 mb-8 w-full max-w-[220px]">
          {barLevels.map((level, i) => (
            <span
              key={i}
              className="flex-1 rounded-full transition-[height] duration-75 ease-out"
              style={{
                height: `${Math.max(8, level * 100)}%`,
                backgroundColor: 'var(--c-primary)',
                opacity: 0.5 + level * 0.5,
              }}
            />
          ))}
        </div>

        {missionState === 'active' && alarm && alarm.mission_type === 'math' && currentProblem && (
          <div className="w-full mb-6">
            <p className="text-sm text-center mb-2" style={{ color: 'var(--c-textMuted)' }}>
              Solve equation {mathIndex + 1} of {mathProblems.length}
            </p>
            <div
              className="rounded-2xl p-6 mb-4 text-center"
              style={{ backgroundColor: 'var(--c-surface)', border: `1px solid var(--c-border)` }}
            >
              <p className="text-3xl font-bold" style={{ color: 'var(--c-text)' }}>
                {currentProblem.question} = ?
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={mathAnswer}
                onChange={(e) => {
                  if (alarm && alarm.math_anti_cheat) {
                    if (e.nativeEvent instanceof InputEvent && e.nativeEvent.inputType === 'insertFromPaste') return;
                  }
                  setMathAnswer(e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && submitMathAnswer()}
                onPaste={(e) => alarm && alarm.math_anti_cheat && e.preventDefault()}
                placeholder="Answer"
                className="flex-1 px-4 py-3 rounded-xl text-lg text-center outline-none"
                style={{ backgroundColor: 'var(--c-surface)', border: `1px solid var(--c-border)`, color: 'var(--c-text)' }}
              />
              <button
                type="button"
                onClick={submitMathAnswer}
                className="px-6 py-3 rounded-xl font-semibold text-sm"
                style={{ backgroundColor: 'var(--c-primary)', color: 'var(--c-primaryText)' }}
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {missionState === 'active' && alarm && alarm.mission_type === 'shake' && (
          <div className="w-full mb-6 text-center animate-in">
            <p className="text-sm mb-4" style={{ color: 'var(--c-textMuted)' }}>
              Shake your phone {alarm.shake_count || 20} times
            </p>
            <div className="w-full h-4 rounded-full overflow-hidden mb-3" style={{ backgroundColor: 'var(--c-surface)' }}>
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{
                  width: `${Math.min(Math.max(0, (shakeCount / (alarm.shake_count || 20)) * 100), 100)}%`,
                  backgroundColor: 'var(--c-primary)',
                }}
              />
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>
              {shakeCount} / {alarm.shake_count || 20}
            </p>
            <button
              type="button"
              onClick={registerShake}
              className="mt-4 px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-80 transition-colors"
              style={{ backgroundColor: 'var(--c-surface)', border: `1px solid var(--c-border)`, color: 'var(--c-text)' }}
            >
              Simulate Shake
            </button>
          </div>
        )}

        {missionState === 'active' && alarm && alarm.mission_type === 'scanner' && (
          <div className="w-full mb-6 text-center animate-in">
            <div className="rounded-2xl p-8 mb-4" style={{ backgroundColor: 'var(--c-surface)', border: `1px solid var(--c-border)` }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3">
                <path
                  d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"
                  stroke="var(--c-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M7 12h10" stroke="var(--c-primary)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--c-textSecondary)' }}>
                Point camera at registered barcode
              </p>
            </div>
            <button
              type="button"
              onClick={completeScannerMission}
              className="px-6 py-3 rounded-xl font-semibold text-sm mb-2 w-full"
              style={{ backgroundColor: 'var(--c-primary)', color: 'var(--c-primaryText)' }}
            >
              Simulate Scan
            </button>
            {alarm.scanner_skip_pin && (
              <button
                type="button"
                onClick={() => setShowPinFallback(!showPinFallback)}
                className="block mx-auto text-xs mt-2 underline"
                style={{ color: 'var(--c-textMuted)' }}
              >
                Use PIN fallback
              </button>
            )}
            {showPinFallback && (
              <div className="flex gap-2 mt-3 animate-in">
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter PIN"
                  className="flex-1 px-4 py-3 rounded-xl text-sm text-center outline-none"
                  style={{ backgroundColor: 'var(--c-surface)', border: `1px solid var(--c-border)`, color: 'var(--c-text)' }}
                />
                <button
                  type="button"
                  onClick={submitPin}
                  className="px-4 py-3 rounded-xl font-semibold text-sm"
                  style={{ backgroundColor: 'var(--c-surface)', border: `1px solid var(--c-border)`, color: 'var(--c-text)' }}
                >
                  Enter
                </button>
              </div>
            )}
          </div>
        )}

        {missionState === 'complete' && (
          <p className="text-sm mb-6 font-medium animate-in" style={{ color: 'var(--c-success)' }}>
            Mission complete! You can dismiss now.
          </p>
        )}

        <div className="flex gap-3 w-full">
          {canSnooze() && (
            <button
              type="button"
              onClick={handleSnooze}
              className="flex-1 py-4 rounded-2xl font-semibold text-sm transition-all hover:opacity-80 active:scale-95"
              style={{ backgroundColor: 'var(--c-surface)', border: `1px solid var(--c-border)`, color: 'var(--c-text)' }}
            >
              {alarm && alarm.snooze_shake_bypass && shakeCount < 5
                ? `Shake to snooze (${shakeCount}/5)`
                : `Snooze (${getSnoozeDuration()}m)`}
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            disabled={!missionComplete}
            className="flex-1 py-4 rounded-2xl font-semibold text-sm transition-all hover:opacity-80 active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: 'var(--c-error)', color: '#fff' }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
