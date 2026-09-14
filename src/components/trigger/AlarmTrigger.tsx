import { useState, useEffect, useRef } from 'react';
import type { Alarm } from '@/types';
import {
  playAlarmTone,
  stopAlarmTone,
  startFadeOut,
  vibratePattern,
  stopVibration,
  speakBriefing,
} from '@/lib/audio';
import { keepScreenAwake, allowSleep } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { CloseIcon } from '@/components/icons/AlarmIcons';

interface AlarmTriggerProps {
  alarm: Alarm;
  onDismiss: () => void;
}

export function AlarmTrigger({ alarm, onDismiss }: AlarmTriggerProps) {
  const [snoozesUsed, setSnoozesUsed] = useState(0);
  const [showSnooze, setShowSnooze] = useState(true);
  const [missionState, setMissionState] = useState<'idle' | 'active' | 'complete'>('idle');
  const [shakeCount, setShakeCount] = useState(0);
  const [mathIndex, setMathIndex] = useState(0);
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathProblems, setMathProblems] = useState<{ question: string; answer: number }[]>([]);
  const [pinInput, setPinInput] = useState('');
  const [showPinFallback, setShowPinFallback] = useState(false);
  const vibrationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    keepScreenAwake();

    playAlarmTone(
      alarm.audio_source,
      1.0,
      alarm.volume_crescendo,
      alarm.vibrate_override
    );

    vibrationTimerRef.current = vibratePattern(alarm.vibration_pattern);

    if (alarm.fade_out !== 'never') {
      startFadeOut(alarm.fade_out);
    }

    if (alarm.mission_type !== 'none') {
      setMissionState('active');
      if (alarm.mission_type === 'math') {
        generateMathProblems();
      }
    }

    return () => {
      stopAlarmTone();
      stopVibration(vibrationTimerRef.current);
      allowSleep();
    };
  }, []);

  function generateMathProblems() {
    const problems: { question: string; answer: number }[] = [];
    const count = alarm.math_count;
    for (let i = 0; i < count; i++) {
      let a: number, b: number, answer: number, question: string;
      if (alarm.math_difficulty === 'easy') {
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        answer = a + b;
        question = `${a} + ${b}`;
      } else if (alarm.math_difficulty === 'medium') {
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
    if (alarm.snooze_limit > 0 && snoozesUsed >= alarm.snooze_limit) return false;
    return showSnooze;
  }

  function getSnoozeDuration() {
    if (alarm.snooze_escalate) {
      const base = alarm.snooze_duration;
      const duration = base / Math.pow(2, snoozesUsed);
      return Math.max(Math.round(duration), 1);
    }
    return alarm.snooze_duration;
  }

  async function handleSnooze() {
    if (alarm.snooze_shake_bypass) {
      // Would use accelerometer; for now, require shake simulation
      if (shakeCount < 5) {
        // Simulate: increment shake count
        setShakeCount((prev) => prev + 1);
        return;
      }
    }

    const duration = getSnoozeDuration();
    setSnoozesUsed((prev) => prev + 1);
    stopAlarmTone();
    stopVibration(vibrationTimerRef.current);
    allowSleep();

    // Schedule snooze notification
    const snoozeTime = new Date(Date.now() + duration * 60 * 1000);
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 100000),
            title: 'Alarmio Pro',
            body: alarm.label,
            schedule: { at: snoozeTime },
            extra: { alarmId: alarm.id, missionType: alarm.mission_type },
            channelId: 'alarmio-alarm',
          },
        ],
      });
    } catch {
      // no-op
    }

    onDismiss();
  }

  async function handleDismiss() {
    if (missionState === 'active') {
      return; // Must complete mission first
    }

    stopAlarmTone();
    stopVibration(vibrationTimerRef.current);
    allowSleep();

    if (alarm.post_dismiss_tts) {
      speakBriefing();
    }

    if (alarm.is_one_time) {
      await supabase.from('alarms').delete().eq('id', alarm.id);
    }

    onDismiss();
  }

  function submitMathAnswer() {
    const answer = parseInt(mathAnswer);
    if (isNaN(answer)) return;

    if (answer === mathProblems[mathIndex].answer) {
      const nextIndex = mathIndex + 1;
      if (nextIndex >= mathProblems.length) {
        setMissionState('complete');
        stopAlarmTone();
        stopVibration(vibrationTimerRef.current);
      } else {
        setMathIndex(nextIndex);
        setMathAnswer('');
      }
    } else {
      setMathAnswer('');
    }
  }

  function submitPin() {
    if (pinInput === alarm.scanner_skip_pin && pinInput.length > 0) {
      setMissionState('complete');
      stopAlarmTone();
      stopVibration(vibrationTimerRef.current);
    } else {
      setPinInput('');
    }
  }

  const currentProblem = mathProblems[mathIndex];
  const missionComplete = missionState === 'complete' || missionState === 'idle';

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6"
      style={{
        backgroundColor: 'var(--c-bg)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex flex-col items-center w-full max-w-sm">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-pulse"
          style={{
            backgroundColor: 'var(--c-error)',
            boxShadow: `0 0 40px var(--c-error)`,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="13" r="9" stroke="#fff" strokeWidth="2" />
            <path d="M12 8v5l3 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 3 2 6M22 6l-3-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--c-text)' }}>
          {alarm.label}
        </h1>
        <p className="text-lg mb-8" style={{ color: 'var(--c-textSecondary)' }}>
          {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </p>

        {/* Mission UI */}
        {missionState === 'active' && alarm.mission_type === 'math' && currentProblem && (
          <div className="w-full mb-6">
            <p className="text-sm text-center mb-2" style={{ color: 'var(--c-textMuted)' }}>
              Solve equation {mathIndex + 1} of {mathProblems.length}
            </p>
            <div
              className="rounded-2xl p-6 mb-4 text-center"
              style={{
                backgroundColor: 'var(--c-surface)',
                border: `1px solid var(--c-border)`,
              }}
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
                  if (alarm.math_anti_cheat) {
                    // Block paste by only accepting direct input
                    if (e.nativeEvent instanceof InputEvent && e.nativeEvent.inputType === 'insertFromPaste') return;
                  }
                  setMathAnswer(e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && submitMathAnswer()}
                onPaste={(e) => alarm.math_anti_cheat && e.preventDefault()}
                placeholder="Answer"
                className="flex-1 px-4 py-3 rounded-xl text-lg text-center outline-none"
                style={{
                  backgroundColor: 'var(--c-surface)',
                  border: `1px solid var(--c-border)`,
                  color: 'var(--c-text)',
                }}
              />
              <button
                onClick={submitMathAnswer}
                className="px-6 py-3 rounded-xl font-semibold text-sm"
                style={{
                  backgroundColor: 'var(--c-primary)',
                  color: 'var(--c-primaryText)',
                }}
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {missionState === 'active' && alarm.mission_type === 'shake' && (
          <div className="w-full mb-6 text-center">
            <p className="text-sm mb-4" style={{ color: 'var(--c-textMuted)' }}>
              Shake your phone {alarm.shake_count} times
            </p>
            <div
              className="w-full h-4 rounded-full overflow-hidden mb-3"
              style={{ backgroundColor: 'var(--c-surface)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{
                  width: `${(shakeCount / alarm.shake_count) * 100}%`,
                  backgroundColor: 'var(--c-primary)',
                }}
              />
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>
              {shakeCount} / {alarm.shake_count}
            </p>
            <button
              onClick={() => {
                const next = shakeCount + 1;
                setShakeCount(next);
                if (next >= alarm.shake_count) {
                  setMissionState('complete');
                  stopAlarmTone();
                  stopVibration(vibrationTimerRef.current);
                }
              }}
              className="mt-4 px-6 py-3 rounded-xl font-semibold text-sm"
              style={{
                backgroundColor: 'var(--c-surface)',
                border: `1px solid var(--c-border)`,
                color: 'var(--c-text)',
              }}
            >
              Simulate Shake
            </button>
          </div>
        )}

        {missionState === 'active' && alarm.mission_type === 'scanner' && (
          <div className="w-full mb-6 text-center">
            <div
              className="rounded-2xl p-8 mb-4"
              style={{
                backgroundColor: 'var(--c-surface)',
                border: `1px solid var(--c-border)`,
              }}
            >
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" stroke="var(--c-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 12h10" stroke="var(--c-primary)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--c-textSecondary)' }}>
                Point camera at registered barcode
              </p>
            </div>
            <button
              onClick={() => {
                setMissionState('complete');
                stopAlarmTone();
                stopVibration(vibrationTimerRef.current);
              }}
              className="px-6 py-3 rounded-xl font-semibold text-sm mb-2"
              style={{
                backgroundColor: 'var(--c-primary)',
                color: 'var(--c-primaryText)',
              }}
            >
              Simulate Scan
            </button>
            {alarm.scanner_skip_pin && (
              <button
                onClick={() => setShowPinFallback(!showPinFallback)}
                className="block mx-auto text-xs mt-2"
                style={{ color: 'var(--c-textMuted)' }}
              >
                Use PIN fallback
              </button>
            )}
            {showPinFallback && (
              <div className="flex gap-2 mt-3">
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter PIN"
                  className="flex-1 px-4 py-3 rounded-xl text-sm text-center outline-none"
                  style={{
                    backgroundColor: 'var(--c-surface)',
                    border: `1px solid var(--c-border)`,
                    color: 'var(--c-text)',
                  }}
                />
                <button
                  onClick={submitPin}
                  className="px-4 py-3 rounded-xl font-semibold text-sm"
                  style={{
                    backgroundColor: 'var(--c-surface)',
                    border: `1px solid var(--c-border)`,
                    color: 'var(--c-text)',
                  }}
                >
                  Enter
                </button>
              </div>
            )}
          </div>
        )}

        {missionComplete && (
          <p className="text-sm mb-6 font-medium" style={{ color: 'var(--c-success)' }}>
            {missionState === 'complete' ? 'Mission complete! You can dismiss now.' : ''}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 w-full">
          {canSnooze() && (
            <button
              onClick={handleSnooze}
              className="flex-1 py-4 rounded-2xl font-semibold text-sm transition-all hover:opacity-80 active:scale-95"
              style={{
                backgroundColor: 'var(--c-surface)',
                border: `1px solid var(--c-border)`,
                color: 'var(--c-text)',
              }}
            >
              {alarm.snooze_shake_bypass && shakeCount < 5
                ? `Shake to snooze (${shakeCount}/5)`
                : `Snooze (${getSnoozeDuration()}m)`}
            </button>
          )}
          <button
            onClick={handleDismiss}
            disabled={!missionComplete}
            className="flex-1 py-4 rounded-2xl font-semibold text-sm transition-all hover:opacity-80 active:scale-95 disabled:opacity-40"
            style={{
              backgroundColor: 'var(--c-error)',
              color: '#fff',
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
