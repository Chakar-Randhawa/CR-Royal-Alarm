import { useState, useEffect } from 'react';
import type { Alarm, MissionType, MathDifficulty, ShakeIntensity, VibrationPattern, VolumeCrescendo, FadeOut } from '@/types';
import { defaultAlarmValues, DAYS_OF_WEEK, ALARM_TONES } from '@/types';
import { scheduleAlarm, cancelAlarm, getNextAlarmTime, formatTime } from '@/lib/notifications';
import { getAlarms, saveAlarms } from '@/lib/storage';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { Slider } from '@/components/ui/Slider';
import { Dropdown } from '@/components/ui/Dropdown';
import { showToast } from '@/components/ui/Toast';
import { pickAudioFile, deleteCustomAudio } from '@/lib/customAudio';
import {
  CalculatorIcon,
  ShakeIcon,
  ScanIcon,
  VolumeIcon,
  ClockIcon,
  HeadphonesIcon,
  SparklesIcon,
  RefreshIcon,
  ChevronDownIcon,
} from '@/components/icons/AlarmIcons';

interface AlarmEditorProps {
  open: boolean;
  alarm: Alarm | null;
  onClose: () => void;
  onSaved: () => void;
}

type SectionKey = 'schedule' | 'mission' | 'snooze' | 'audio' | 'interface';
type FormState = Alarm | (typeof defaultAlarmValues & { id?: string });

export function AlarmEditor({ open, alarm, onClose, onSaved }: AlarmEditorProps) {
  const [form, setForm] = useState<FormState>(defaultAlarmValues);
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (alarm) {
      setForm(alarm);
    } else {
      setForm(defaultAlarmValues);
    }
    setActiveSection(null);
  }, [alarm, open]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDay(day: number) {
    const current = (form.days_of_week as number[]) || [];
    update(
      'days_of_week',
      (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]) as FormState['days_of_week']
    );
  }

  // 100% offline save: alarms live entirely in local storage.
  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const alarmsArray = getAlarms();

      if (alarm && alarm.id) {
        const updatedAlarm: Alarm = {
          ...(form as Alarm),
          id: alarm.id,
          updated_at: new Date().toISOString(),
        };

        const updatedList = alarmsArray.map((a) => (a.id === alarm.id ? updatedAlarm : a));
        saveAlarms(updatedList);

        await cancelAlarm(alarm.id);
        if (updatedAlarm.enabled) {
          await scheduleAlarm(updatedAlarm);
        }
        showToast('Alarm updated', 'success');
      } else {
        const uniqueId = 'alarm_' + Date.now();
        const newAlarm: Alarm = {
          ...(form as Alarm),
          id: uniqueId,
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        alarmsArray.unshift(newAlarm);
        saveAlarms(alarmsArray);

        await scheduleAlarm(newAlarm);
        showToast('Alarm created', 'success');
      }
    } catch (error) {
      console.error('Local storage save operation failed:', error);
      showToast('Failed to save alarm', 'error');
    } finally {
      setSaving(false);
      onSaved();
      onClose();
    }
  }

  const sections: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
    { key: 'schedule', label: 'Schedule & Days', icon: <ClockIcon size={18} color="var(--c-textSecondary)" /> },
    { key: 'mission', label: 'Mission Challenge', icon: <CalculatorIcon size={18} color="var(--c-textSecondary)" /> },
    { key: 'snooze', label: 'Snooze Controls', icon: <RefreshIcon size={18} color="var(--c-textSecondary)" /> },
    { key: 'audio', label: 'Audio & Vibration', icon: <VolumeIcon size={18} color="var(--c-textSecondary)" /> },
    { key: 'interface', label: 'Interface & Logic', icon: <SparklesIcon size={18} color="var(--c-textSecondary)" /> },
  ];

  const missionTypes: { value: MissionType; label: string; icon: React.ReactNode }[] = [
    { value: 'none', label: 'None', icon: <ClockIcon size={16} color="var(--c-text)" /> },
    { value: 'math', label: 'Math', icon: <CalculatorIcon size={16} color="var(--c-text)" /> },
    { value: 'shake', label: 'Shake', icon: <ShakeIcon size={16} color="var(--c-text)" /> },
    { value: 'scanner', label: 'Scanner', icon: <ScanIcon size={16} color="var(--c-text)" /> },
  ];

  return (
    <Modal open={open} onClose={onClose} title={alarm ? 'Edit Alarm' : 'New Alarm'} fullScreen>
      <div className="space-y-5">
        {/* Label */}
        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--c-text)' }}>
            Label
          </label>
          <input
            type="text"
            value={(form.label as string) || ''}
            onChange={(e) => update('label', e.target.value as FormState['label'])}
            placeholder="Alarm name"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'var(--c-surface)', border: `1px solid var(--c-border)`, color: 'var(--c-text)' }}
          />
        </div>

        {/* Time Picker */}
        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--c-text)' }}>
            Time
          </label>
          <div
            className="rounded-2xl p-5 flex items-center justify-center gap-4"
            style={{ backgroundColor: 'var(--c-surface)', border: `1px solid var(--c-border)` }}
          >
            <TimeStepper
              value={to12Hour(form.hour !== undefined ? form.hour : 7)}
              onChange={(h12) => update('hour', from12Hour(h12, isPM(form.hour !== undefined ? form.hour : 7)) as FormState['hour'])}
              min={1}
              max={12}
              pad={false}
            />
            <span className="text-4xl font-bold" style={{ color: 'var(--c-textMuted)' }}>
              :
            </span>
            <TimeStepper
              value={form.minute !== undefined ? form.minute : 0}
              onChange={(m) => update('minute', m as FormState['minute'])}
              min={0}
              max={59}
              pad
            />
            <div className="flex flex-col gap-1.5 ml-1">
              {(['AM', 'PM'] as const).map((period) => {
                const active = isPM(form.hour !== undefined ? form.hour : 7) === (period === 'PM');
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() =>
                      update(
                        'hour',
                        from12Hour(to12Hour(form.hour !== undefined ? form.hour : 7), period === 'PM') as FormState['hour']
                      )
                    }
                    className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      backgroundColor: active ? 'var(--c-primary)' : 'var(--c-bgTertiary)',
                      color: active ? 'var(--c-primaryText)' : 'var(--c-textMuted)',
                    }}
                  >
                    {period}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Repeat Days */}
        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--c-text)' }}>
            Repeat
          </label>
          <div className="flex gap-1.5">
            {DAYS_OF_WEEK.map((day, i) => {
              const active = Array.isArray(form.days_of_week) && (form.days_of_week as number[]).includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: active ? 'var(--c-primary)' : 'var(--c-surface)',
                    color: active ? 'var(--c-primaryText)' : 'var(--c-textMuted)',
                    border: `1px solid ${active ? 'var(--c-primary)' : 'var(--c-border)'}`,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--c-textMuted)' }}>
            {!Array.isArray(form.days_of_week) || (form.days_of_week as number[]).length === 0
              ? 'One-time alarm'
              : `${(form.days_of_week as number[]).length} day(s) selected`}
          </p>
        </div>

        {/* One-time toggle */}
        <Toggle
          checked={!!form.is_one_time}
          onChange={(v) => update('is_one_time', v as FormState['is_one_time'])}
          label="One-time alarm"
          description="Auto-delete after firing"
        />

        {/* Live "next fire" preview — lets you verify the day/time math
            before saving, instead of guessing from a bare countdown. */}
        <NextFirePreview form={form} />

        {/* Custom song — prominent, always visible (not buried in a
            collapsible section) */}
        <CustomSongPicker form={form} update={(k, v) => update(k as keyof FormState, v)} />

        {/* Collapsible sections */}
        <div className="space-y-2">
          {sections.map((section) => (
            <div key={section.key}>
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === section.key ? null : section.key)}
                className="flex items-center justify-between w-full p-3.5 rounded-xl transition-colors hover:opacity-80"
                style={{ backgroundColor: 'var(--c-surface)', border: `1px solid var(--c-border)` }}
              >
                <div className="flex items-center gap-3">
                  {section.icon}
                  <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                    {section.label}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--c-textMuted)' }}>
                  {activeSection === section.key ? 'Hide' : 'Show'}
                </span>
              </button>

              {activeSection === section.key && (
                <div
                  className="mt-2 p-4 rounded-xl space-y-4"
                  style={{ backgroundColor: 'var(--c-bgTertiary)', border: `1px solid var(--c-border)` }}
                >
                  {section.key === 'mission' && (
                    <MissionSection form={form} update={(k, v) => update(k as keyof FormState, v)} missionTypes={missionTypes} />
                  )}
                  {section.key === 'snooze' && <SnoozeSection form={form} update={(k, v) => update(k as keyof FormState, v)} />}
                  {section.key === 'audio' && <AudioSection form={form} update={(k, v) => update(k as keyof FormState, v)} />}
                  {section.key === 'schedule' && <ScheduleSection form={form} update={(k, v) => update(k as keyof FormState, v)} />}
                  {section.key === 'interface' && <InterfaceSection form={form} update={(k, v) => update(k as keyof FormState, v)} />}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          style={{ backgroundColor: 'var(--c-primary)', color: 'var(--c-primaryText)' }}
        >
          {saving ? 'Saving...' : alarm ? 'Update Alarm' : 'Create Alarm'}
        </button>
      </div>
    </Modal>
  );
}

function MissionSection({
  form,
  update,
  missionTypes,
}: {
  form: any;
  update: (key: string, value: any) => void;
  missionTypes: { value: MissionType; label: string; icon: React.ReactNode }[];
}) {
  return (
    <>
      <div>
        <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--c-text)' }}>
          Mission Type
        </label>
        <div className="grid grid-cols-4 gap-2">
          {missionTypes.map((m) => {
            const isSelected = form && form.mission_type === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => update('mission_type', m.value)}
                className="flex flex-col items-center gap-1 py-3 rounded-xl transition-all"
                style={{
                  backgroundColor: isSelected ? 'var(--c-primary)' : 'var(--c-surface)',
                  color: isSelected ? 'var(--c-primaryText)' : 'var(--c-text)',
                  border: `1px solid ${isSelected ? 'var(--c-primary)' : 'var(--c-border)'}`,
                }}
              >
                {m.icon}
                <span className="text-xs font-medium">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {form && form.mission_type === 'math' && (
        <>
          <Dropdown
            label="Difficulty"
            value={form.math_difficulty || 'easy'}
            options={[
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
            onChange={(v) => update('math_difficulty', v as MathDifficulty)}
          />
          <Dropdown
            label="Equation Count"
            value={String(form.math_count || 3)}
            options={[
              { value: '3', label: '3 equations' },
              { value: '5', label: '5 equations' },
              { value: '7', label: '7 equations' },
            ]}
            onChange={(v) => update('math_count', parseInt(v) || 3)}
          />
          <Toggle
            checked={!!form.math_anti_cheat}
            onChange={(v) => update('math_anti_cheat', v)}
            label="Anti-Cheat Block Paste"
            description="Prevents pasting answers into the input pad"
          />
        </>
      )}

      {form && form.mission_type === 'shake' && (
        <>
          <Dropdown
            label="Shake Intensity"
            value={form.shake_intensity || 'moderate'}
            options={[
              { value: 'gentle', label: 'Gentle' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'vigorous', label: 'Vigorous' },
            ]}
            onChange={(v) => update('shake_intensity', v as ShakeIntensity)}
          />
          <Slider
            label="Total Shakes Required"
            value={typeof form.shake_count === 'number' ? form.shake_count : 20}
            min={20}
            max={100}
            step={5}
            onChange={(v) => update('shake_count', v)}
            formatValue={(v) => `${v} shakes`}
          />
        </>
      )}

      {form && form.mission_type === 'scanner' && (
        <>
          <Toggle
            checked={!!form.scanner_flashlight}
            onChange={(v) => update('scanner_flashlight', v)}
            label="Flashlight Auto-on in Low Light"
            description="Turns on flash when scanning in dark environments"
          />
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--c-text)' }}>
              Manual Skip PIN (Backup Fallback)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={(form.scanner_skip_pin as string) || ''}
              onChange={(e) => update('scanner_skip_pin', e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 4-6 digit PIN"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'var(--c-surface)', border: `1px solid var(--c-border)`, color: 'var(--c-text)' }}
            />
          </div>
        </>
      )}
    </>
  );
}

function SnoozeSection({ form, update }: { form: any; update: (key: string, value: any) => void }) {
  return (
    <>
      <Dropdown
        label="Snooze Limit (Max snoozes)"
        value={String(form && form.snooze_limit !== undefined ? form.snooze_limit : '0')}
        options={[
          { value: '0', label: 'Unlimited' },
          { value: '1', label: '1 snooze' },
          { value: '2', label: '2 snoozes' },
          { value: '3', label: '3 snoozes' },
        ]}
        onChange={(v) => update('snooze_limit', parseInt(v) || 0)}
      />
      <Slider
        label="Snooze Duration"
        value={form && typeof form.snooze_duration === 'number' ? form.snooze_duration : 5}
        min={1}
        max={30}
        step={1}
        onChange={(v) => update('snooze_duration', v)}
        formatValue={(v) => `${v} min`}
      />
      <Toggle
        checked={!!(form && form.snooze_escalate)}
        onChange={(v) => update('snooze_escalate', v)}
        label="Smart Escalate Snooze"
        description="Each snooze cuts duration in half (10m → 5m → 2m)"
      />
      <Toggle
        checked={!!(form && form.snooze_shake_bypass)}
        onChange={(v) => update('snooze_shake_bypass', v)}
        label="Snooze Shake Bypass"
        description="Must shake phone 5 times before snooze button activates"
      />
    </>
  );
}

function AudioSection({ form, update }: { form: any; update: (key: string, value: any) => void }) {
  const isCustomSelected = form && form.audio_source === 'custom';

  return (
    <>
      <div>
        <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--c-text)' }}>
          Built-in Alarm Tone
        </label>
        {isCustomSelected && (
          <p className="text-xs mb-2" style={{ color: 'var(--c-textMuted)' }}>
            Currently using your custom song (see "Custom Song" above). Pick a tone below to switch back.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {ALARM_TONES.map((tone) => {
            const isToneSelected = form && form.audio_source === tone.id;
            return (
              <button
                key={tone.id}
                type="button"
                onClick={() => update('audio_source', tone.id)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  backgroundColor: isToneSelected ? 'var(--c-primary)' : 'var(--c-surface)',
                  color: isToneSelected ? 'var(--c-primaryText)' : 'var(--c-text)',
                  border: `1px solid ${isToneSelected ? 'var(--c-primary)' : 'var(--c-border)'}`,
                }}
              >
                <HeadphonesIcon size={14} color={isToneSelected ? 'var(--c-primaryText)' : 'var(--c-textSecondary)'} />
                {tone.name}
              </button>
            );
          })}
        </div>
      </div>

      <Dropdown
        label="Volume Crescendo"
        value={form && form.volume_crescendo ? form.volume_crescendo : 'off'}
        options={[
          { value: 'off', label: 'Off' },
          { value: '15s', label: '15 seconds' },
          { value: '30s', label: '30 seconds' },
          { value: '60s', label: '60 seconds' },
          { value: '120s', label: '120 seconds' },
        ]}
        onChange={(v) => update('volume_crescendo', v as VolumeCrescendo)}
      />

      <Toggle
        checked={!!(form && form.vibrate_override)}
        onChange={(v) => update('vibrate_override', v)}
        label="Play in Silent/Vibrate Mode"
        description="Attempts to play the alarm even if the phone is muted"
      />

      <Dropdown
        label="Auto Fade-out"
        value={form && form.fade_out ? form.fade_out : 'never'}
        options={[
          { value: 'never', label: 'Never' },
          { value: '5min', label: '5 minutes' },
          { value: '10min', label: '10 minutes' },
          { value: '15min', label: '15 minutes' },
        ]}
        onChange={(v) => update('fade_out', v as FadeOut)}
      />

      <Dropdown
        label="Vibration Pattern"
        value={form && form.vibration_pattern ? form.vibration_pattern : 'continuous'}
        options={[
          { value: 'continuous', label: 'Continuous' },
          { value: 'heartbeat', label: 'Heartbeat' },
          { value: 'rapid', label: 'Rapid Pulse' },
          { value: 'sos', label: 'S.O.S Morse' },
          { value: 'none', label: 'None' },
        ]}
        onChange={(v) => update('vibration_pattern', v as VibrationPattern)}
      />
    </>
  );
}

function ScheduleSection({ form, update }: { form: any; update: (key: string, value: any) => void }) {
  return (
    <>
      <Toggle
        checked={!!(form && form.holiday_skip)}
        onChange={(v) => update('holiday_skip', v)}
        label="Holiday/Calendar Skip"
        description="Automatically bypass alarms on selected dates"
      />
      {form && form.holiday_skip && (
        <div className="space-y-2 animate-in">
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--c-text)' }}>
            Skip Dates
          </label>
          <input
            type="date"
            onChange={(e) => {
              if (!e.target.value) return;
              const currentDates = form && Array.isArray(form.holiday_dates) ? form.holiday_dates : [];
              const dates = [...currentDates, e.target.value];
              update('holiday_dates', dates);
              e.target.value = '';
            }}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'var(--c-surface)', border: `1px solid var(--c-border)`, color: 'var(--c-text)' }}
          />
          {form && Array.isArray(form.holiday_dates) && form.holiday_dates.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 animate-in">
              {form.holiday_dates.map((date: string, i: number) => (
                <span
                  key={i}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border"
                  style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)', color: 'var(--c-textSecondary)' }}
                >
                  {date}
                  <button
                    type="button"
                    onClick={() => {
                      const currentDates = Array.isArray(form.holiday_dates) ? form.holiday_dates : [];
                      const dates = currentDates.filter((_: string, idx: number) => idx !== i);
                      update('holiday_dates', dates);
                    }}
                    className="ml-1 font-bold text-sm hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <Toggle
        checked={true}
        onChange={() => {}}
        label="Power Off / Reset Protection"
        description="Auto re-registers alarms after device reboot (Enabled natively)"
        disabled
      />
    </>
  );
}

function InterfaceSection({ form, update }: { form: any; update: (key: string, value: any) => void }) {
  return (
    <>
      <Toggle
        checked={!!(form && form.show_countdown_toast)}
        onChange={(v) => update('show_countdown_toast', v)}
        label="Show Time Left Countdown Toast"
        description='Displays "Alarm set for X hours and Y minutes from now"'
      />
      <Toggle
        checked={!!(form && form.post_dismiss_tts)}
        onChange={(v) => update('post_dismiss_tts', v)}
        label="Post-Dismiss Voice Briefing"
        description="Text-to-speech reads a greeting, time, date and motivational quote"
      />
    </>
  );
}

// ---- 12-hour time helpers -------------------------------------------------

function to12Hour(hour24: number): number {
  const h = ((hour24 % 24) + 24) % 24;
  const h12 = h % 12;
  return h12 === 0 ? 12 : h12;
}

function isPM(hour24: number): boolean {
  return ((hour24 % 24) + 24) % 24 >= 12;
}

function from12Hour(hour12: number, pm: boolean): number {
  const base = hour12 % 12; // 12 -> 0
  return pm ? base + 12 : base;
}

function TimeStepper({
  value,
  onChange,
  min,
  max,
  pad,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  pad: boolean;
}) {
  function step(delta: number) {
    let next = value + delta;
    if (next > max) next = min;
    if (next < min) next = max;
    onChange(next);
  }

  const display = pad ? value.toString().padStart(2, '0') : String(value);

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => step(1)}
        className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
        aria-label="Increase"
      >
        <ChevronDownIcon size={20} color="var(--c-textMuted)" className="rotate-180" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const raw = parseInt(e.target.value, 10);
          if (isNaN(raw)) return;
          onChange(Math.max(min, Math.min(max, raw)));
        }}
        className="w-16 bg-transparent text-center text-4xl font-bold tabular-nums outline-none"
        style={{ color: 'var(--c-text)' }}
      />
      <span className="sr-only">{display}</span>
      <button
        type="button"
        onClick={() => step(-1)}
        className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
        aria-label="Decrease"
      >
        <ChevronDownIcon size={20} color="var(--c-textMuted)" />
      </button>
    </div>
  );
}

// ---- Next-fire preview ------------------------------------------------------

function NextFirePreview({ form }: { form: any }) {
  if (!form || form.hour === undefined || form.minute === undefined) return null;

  const alarmLike = {
    hour: form.hour,
    minute: form.minute,
    days_of_week: Array.isArray(form.days_of_week) ? form.days_of_week : [],
    is_one_time: !!form.is_one_time,
  };

  const next = getNextAlarmTime(alarmLike);
  if (!next) return null;

  const dayLabel = next.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  const timeLabel = formatTime(form.hour, form.minute);
  const isToday = next.toDateString() === new Date().toDateString();

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-2.5"
      style={{ backgroundColor: 'var(--c-bgTertiary)', border: `1px solid var(--c-border)` }}
    >
      <ClockIcon size={16} color="var(--c-accent)" />
      <p className="text-xs" style={{ color: 'var(--c-textSecondary)' }}>
        Next rings <strong style={{ color: 'var(--c-text)' }}>{isToday ? 'today' : dayLabel}</strong> at{' '}
        <strong style={{ color: 'var(--c-text)' }}>{timeLabel}</strong> (your device's local time)
      </p>
    </div>
  );
}

// ---- Prominent custom-song picker (always visible, not buried in a
// collapsible section) --------------------------------------------------------

function CustomSongPicker({ form, update }: { form: any; update: (key: string, value: any) => void }) {
  const [picking, setPicking] = useState(false);
  const isCustomSelected = form && form.audio_source === 'custom';
  const maxClip = form && form.audio_custom_duration ? Math.min(180, Math.round(form.audio_custom_duration)) : 180;

  async function handlePickSong() {
    setPicking(true);
    try {
      const picked = await pickAudioFile();
      if (!picked) {
        setPicking(false);
        return;
      }
      if (form && form.audio_source === 'custom' && form.audio_custom_storage_path) {
        await deleteCustomAudio(form.audio_custom_storage_path);
      }
      update('audio_source', 'custom');
      update('audio_local_path', picked.uri);
      update('audio_custom_name', picked.name);
      update('audio_custom_duration', picked.duration);
      update('audio_custom_storage_path', picked.storagePath || '');
      update('audio_clip_length', Math.min(30, Math.max(5, Math.round(picked.duration))));
      showToast('Song added as alarm tone', 'success');
    } catch (e) {
      console.error('Song pick failed', e);
      showToast('Could not read that file', 'error');
    } finally {
      setPicking(false);
    }
  }

  function handleClear() {
    update('audio_source', 'tone_1');
  }

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        backgroundColor: isCustomSelected ? 'var(--c-bgTertiary)' : 'var(--c-surface)',
        border: `1.5px dashed ${isCustomSelected ? 'var(--c-primary)' : 'var(--c-border)'}`,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <SparklesIcon size={16} color="var(--c-primary)" />
        <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
          Custom Song
        </p>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--c-textMuted)' }}>
        Use any song from your phone as this alarm's ringtone.
      </p>

      <button
        type="button"
        onClick={handlePickSong}
        disabled={picking}
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-full disabled:opacity-60"
        style={{
          backgroundColor: isCustomSelected ? 'var(--c-primary)' : 'var(--c-bgTertiary)',
          color: isCustomSelected ? 'var(--c-primaryText)' : 'var(--c-text)',
        }}
      >
        {picking ? 'Opening gallery...' : isCustomSelected && form.audio_custom_name ? `🎵 ${form.audio_custom_name}` : '🎵 Choose a song from your gallery'}
      </button>

      {isCustomSelected && (
        <div className="mt-3 animate-in">
          <Slider
            label="Clip length used when ringing"
            value={typeof form.audio_clip_length === 'number' ? form.audio_clip_length : 30}
            min={5}
            max={Math.max(5, maxClip)}
            step={5}
            onChange={(v) => update('audio_clip_length', v)}
            formatValue={(v) => (v >= 60 ? `${Math.floor(v / 60)}m ${v % 60}s` : `${v}s`)}
          />
          <p className="text-xs mt-1.5 mb-2" style={{ color: 'var(--c-textMuted)' }}>
            Only the first {form.audio_clip_length || 30}s plays, looping until dismissed.
          </p>
          <button type="button" onClick={handleClear} className="text-xs underline" style={{ color: 'var(--c-textMuted)' }}>
            Use a built-in tone instead
          </button>
        </div>
      )}
    </div>
  );
}
