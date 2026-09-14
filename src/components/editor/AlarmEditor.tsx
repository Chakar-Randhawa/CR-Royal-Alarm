import { useState, useEffect } from 'react';
import type { Alarm, MissionType, MathDifficulty, ShakeIntensity, VibrationPattern, VolumeCrescendo, FadeOut } from '@/types';
import { defaultAlarmValues, DAYS_OF_WEEK, ALARM_TONES } from '@/types';
import { supabase } from '@/lib/supabase';
import { scheduleAlarm, cancelAlarm } from '@/lib/notifications';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { Slider } from '@/components/ui/Slider';
import { Dropdown } from '@/components/ui/Dropdown';
import {
  CalculatorIcon,
  ShakeIcon,
  ScanIcon,
  VolumeIcon,
  VibrateIcon,
  ClockIcon,
  CalendarIcon,
  HeadphonesIcon,
  PowerIcon,
  SparklesIcon,
  RefreshIcon,
} from '@/components/icons/AlarmIcons';

interface AlarmEditorProps {
  open: boolean;
  alarm: Alarm | null;
  onClose: () => void;
  onSaved: () => void;
}

type SectionKey = 'schedule' | 'mission' | 'snooze' | 'audio' | 'interface';

export function AlarmEditor({ open, alarm, onClose, onSaved }: AlarmEditorProps) {
  const [form, setForm] = useState<Alarm | (typeof defaultAlarmValues & { id?: string })>(defaultAlarmValues);
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

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDay(day: number) {
    const current = form.days_of_week as number[];
    update('days_of_week', current.includes(day) ? current.filter((d) => d !== day) : [...current, day]);
  }

  async function save() {
    setSaving(true);
    const payload = { ...form } as Record<string, unknown>;
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    payload.updated_at = new Date().toISOString();

    if (alarm) {
      const { error } = await supabase.from('alarms').update(payload).eq('id', alarm.id);
      if (!error) {
        await cancelAlarm(alarm.id);
        if (form.enabled) {
          await scheduleAlarm({ ...form, id: alarm.id } as Alarm);
        }
      }
    } else {
      const { data, error } = await supabase
        .from('alarms')
        .insert(payload)
        .select()
        .single();
      if (!error && data) {
        if (form.enabled) {
          await scheduleAlarm(data as Alarm);
        }
      }
    }

    setSaving(false);
    onSaved();
    onClose();
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
            value={form.label as string}
            onChange={(e) => update('label', e.target.value)}
            placeholder="Alarm name"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              backgroundColor: 'var(--c-surface)',
              border: `1px solid var(--c-border)`,
              color: 'var(--c-text)',
            }}
          />
        </div>

        {/* Time Picker */}
        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--c-text)' }}>
            Time
          </label>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 rounded-2xl p-4 flex items-center justify-center"
              style={{
                backgroundColor: 'var(--c-surface)',
                border: `1px solid var(--c-border)`,
              }}
            >
              <input
                type="number"
                min={0}
                max={23}
                value={form.hour as number}
                onChange={(e) =>
                  update('hour', Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))
                }
                className="w-16 bg-transparent text-center text-4xl font-bold tabular-nums outline-none"
                style={{ color: 'var(--c-text)' }}
              />
              <span className="text-4xl font-bold mx-1" style={{ color: 'var(--c-textMuted)' }}>:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={form.minute as number}
                onChange={(e) =>
                  update('minute', Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))
                }
                className="w-16 bg-transparent text-center text-4xl font-bold tabular-nums outline-none"
                style={{ color: 'var(--c-text)' }}
              />
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
              const active = (form.days_of_week as number[]).includes(i);
              return (
                <button
                  key={i}
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
            {(form.days_of_week as number[]).length === 0 ? 'One-time alarm' : `${(form.days_of_week as number[]).length} day(s) selected`}
          </p>
        </div>

        {/* One-time toggle */}
        <Toggle
          checked={form.is_one_time as boolean}
          onChange={(v) => update('is_one_time', v)}
          label="One-time alarm"
          description="Auto-delete after firing"
        />

        {/* Section toggles */}
        <div className="space-y-2">
          {sections.map((section) => (
            <div key={section.key}>
              <button
                onClick={() =>
                  setActiveSection(activeSection === section.key ? null : section.key)
                }
                className="flex items-center justify-between w-full p-3.5 rounded-xl transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'var(--c-surface)',
                  border: `1px solid var(--c-border)`,
                }}
              >
                <div className="flex items-center gap-3">
                  {section.icon}
                  <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                    {section.label}
                  </span>
                </div>
                <span
                  className="text-xs"
                  style={{ color: 'var(--c-textMuted)' }}
                >
                  {activeSection === section.key ? 'Hide' : 'Show'}
                </span>
              </button>

              {activeSection === section.key && (
                <div
                  className="mt-2 p-4 rounded-xl space-y-4"
                  style={{
                    backgroundColor: 'var(--c-bgTertiary)',
                    border: `1px solid var(--c-border)`,
                  }}
                >
                  {section.key === 'mission' && (
                    <MissionSection form={form} update={update} missionTypes={missionTypes} />
                  )}
                  {section.key === 'snooze' && (
                    <SnoozeSection form={form} update={update} />
                  )}
                  {section.key === 'audio' && (
                    <AudioSection form={form} update={update} />
                  )}
                  {section.key === 'schedule' && (
                    <ScheduleSection form={form} update={update} />
                  )}
                  {section.key === 'interface' && (
                    <InterfaceSection form={form} update={update} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save button */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          style={{
            backgroundColor: 'var(--c-primary)',
            color: 'var(--c-primaryText)',
          }}
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
          {missionTypes.map((m) => (
            <button
              key={m.value}
              onClick={() => update('mission_type', m.value)}
              className="flex flex-col items-center gap-1 py-3 rounded-xl transition-all"
              style={{
                backgroundColor: form.mission_type === m.value ? 'var(--c-primary)' : 'var(--c-surface)',
                color: form.mission_type === m.value ? 'var(--c-primaryText)' : 'var(--c-text)',
                border: `1px solid ${form.mission_type === m.value ? 'var(--c-primary)' : 'var(--c-border)'}`,
              }}
            >
              {m.icon}
              <span className="text-xs font-medium">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {form.mission_type === 'math' && (
        <>
          <Dropdown
            label="Difficulty"
            value={form.math_difficulty}
            options={[
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
            onChange={(v) => update('math_difficulty', v as MathDifficulty)}
          />
          <Dropdown
            label="Equation Count"
            value={String(form.math_count)}
            options={[
              { value: '3', label: '3 equations' },
              { value: '5', label: '5 equations' },
              { value: '7', label: '7 equations' },
            ]}
            onChange={(v) => update('math_count', parseInt(v))}
          />
          <Toggle
            checked={form.math_anti_cheat}
            onChange={(v) => update('math_anti_cheat', v)}
            label="Anti-Cheat Block Paste"
            description="Prevents pasting answers into the input pad"
          />
        </>
      )}

      {form.mission_type === 'shake' && (
        <>
          <Dropdown
            label="Shake Intensity"
            value={form.shake_intensity}
            options={[
              { value: 'gentle', label: 'Gentle' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'vigorous', label: 'Vigorous' },
            ]}
            onChange={(v) => update('shake_intensity', v as ShakeIntensity)}
          />
          <Slider
            label="Total Shakes Required"
            value={form.shake_count}
            min={20}
            max={100}
            step={5}
            onChange={(v) => update('shake_count', v)}
            formatValue={(v) => `${v} shakes`}
          />
        </>
      )}

      {form.mission_type === 'scanner' && (
        <>
          <Toggle
            checked={form.scanner_flashlight}
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
              value={form.scanner_skip_pin}
              onChange={(e) => update('scanner_skip_pin', e.target.value)}
              placeholder="Enter 4-6 digit PIN"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: 'var(--c-surface)',
                border: `1px solid var(--c-border)`,
                color: 'var(--c-text)',
              }}
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--c-surface)',
              border: `1px solid var(--c-border)`,
              color: 'var(--c-text)',
            }}
          >
            <ScanIcon size={18} color="var(--c-primary)" />
            Register New Barcode
          </button>
        </>
      )}
    </>
  );
}

function SnoozeSection({
  form,
  update,
}: {
  form: any;
  update: (key: string, value: any) => void;
}) {
  return (
    <>
      <Dropdown
        label="Snooze Limit (Max snoozes)"
        value={String(form.snooze_limit)}
        options={[
          { value: '0', label: 'Unlimited' },
          { value: '1', label: '1 snooze' },
          { value: '2', label: '2 snoozes' },
          { value: '3', label: '3 snoozes' },
        ]}
        onChange={(v) => update('snooze_limit', parseInt(v))}
      />
      <Slider
        label="Snooze Duration"
        value={form.snooze_duration}
        min={1}
        max={30}
        step={1}
        onChange={(v) => update('snooze_duration', v)}
        formatValue={(v) => `${v} min`}
      />
      <Toggle
        checked={form.snooze_escalate}
        onChange={(v) => update('snooze_escalate', v)}
        label="Smart Escalate Snooze"
        description="Each snooze cuts duration in half (10m → 5m → 2m)"
      />
      <Toggle
        checked={form.snooze_shake_bypass}
        onChange={(v) => update('snooze_shake_bypass', v)}
        label="Snooze Shake Bypass"
        description="Must shake phone 5 times before snooze button activates"
      />
    </>
  );
}

function AudioSection({
  form,
  update,
}: {
  form: any;
  update: (key: string, value: any) => void;
}) {
  return (
    <>
      <div>
        <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--c-text)' }}>
          Alarm Tone
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ALARM_TONES.map((tone) => (
            <button
              key={tone.id}
              onClick={() => update('audio_source', tone.id)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
              style={{
                backgroundColor: form.audio_source === tone.id ? 'var(--c-primary)' : 'var(--c-surface)',
                color: form.audio_source === tone.id ? 'var(--c-primaryText)' : 'var(--c-text)',
                border: `1px solid ${form.audio_source === tone.id ? 'var(--c-primary)' : 'var(--c-border)'}`,
              }}
            >
              <HeadphonesIcon size={14} color={form.audio_source === tone.id ? 'var(--c-primaryText)' : 'var(--c-textSecondary)'} />
              {tone.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--c-text)' }}>
          Custom Spotify Track URL
        </label>
        <input
          type="text"
          value={form.audio_custom_url}
          onChange={(e) => update('audio_custom_url', e.target.value)}
          placeholder="https://open.spotify.com/track/..."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: 'var(--c-surface)',
            border: `1px solid var(--c-border)`,
            color: 'var(--c-text)',
          }}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--c-text)' }}>
          Custom Local Audio File
        </label>
        <button
          className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm transition-colors hover:opacity-80"
          style={{
            backgroundColor: 'var(--c-surface)',
            border: `1px solid var(--c-border)`,
            color: form.audio_local_path ? 'var(--c-text)' : 'var(--c-textMuted)',
          }}
        >
          <HeadphonesIcon size={18} color="var(--c-textSecondary)" />
          {form.audio_local_path || 'Browse local audio files...'}
        </button>
      </div>

      <Dropdown
        label="Volume Crescendo"
        value={form.volume_crescendo}
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
        checked={form.vibrate_override}
        onChange={(v) => update('vibrate_override', v)}
        label="Play in Silent/Vibrate Mode"
        description="Overrides system mute via STREAM_ALARM"
      />

      <Dropdown
        label="Auto Fade-out"
        value={form.fade_out}
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
        value={form.vibration_pattern}
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

function ScheduleSection({
  form,
  update,
}: {
  form: any;
  update: (key: string, value: any) => void;
}) {
  return (
    <>
      <Toggle
        checked={form.holiday_skip}
        onChange={(v) => update('holiday_skip', v)}
        label="Holiday/Calendar Skip"
        description="Automatically bypass alarms on selected dates"
      />
      {form.holiday_skip && (
        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--c-text)' }}>
            Skip Dates
          </label>
          <input
            type="date"
            onChange={(e) => {
              const dates = [...(form.holiday_dates || []), e.target.value];
              update('holiday_dates', dates);
              e.target.value = '';
            }}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              backgroundColor: 'var(--c-surface)',
              border: `1px solid var(--c-border)`,
              color: 'var(--c-text)',
            }}
          />
          {(form.holiday_dates || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {(form.holiday_dates || []).map((date: string, i: number) => (
                <span
                  key={i}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
                  style={{
                    backgroundColor: 'var(--c-surface)',
                    color: 'var(--c-textSecondary)',
                  }}
                >
                  {date}
                  <button
                    onClick={() => {
                      const dates = (form.holiday_dates || []).filter((_: string, idx: number) => idx !== i);
                      update('holiday_dates', dates);
                    }}
                    className="ml-1"
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
        checked={false}
        onChange={() => {}}
        label="Power Off / Reset Protection"
        description="Auto re-registers alarms after device reboot (enabled by default via native storage)"
        disabled
      />
    </>
  );
}

function InterfaceSection({
  form,
  update,
}: {
  form: any;
  update: (key: string, value: any) => void;
}) {
  return (
    <>
      <Toggle
        checked={form.show_countdown_toast}
        onChange={(v) => update('show_countdown_toast', v)}
        label="Show Time Left Countdown Toast"
        description='Displays "Alarm set for X hours and Y minutes from now"'
      />
      <Toggle
        checked={form.post_dismiss_tts}
        onChange={(v) => update('post_dismiss_tts', v)}
        label="Post-Dismiss AI-Style Briefing"
        description="Text-to-Speech reads greeting, time, weather, and motivational quote"
      />
    </>
  );
}
