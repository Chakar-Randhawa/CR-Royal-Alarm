import type { Alarm } from '@/types';
import { DAYS_OF_WEEK, ALARM_TONES } from '@/types';
import { formatTime, formatCountdown, getNextAlarmTime } from '@/lib/notifications';
import { Toggle } from '@/components/ui/Toggle';
import {
  CalculatorIcon,
  ShakeIcon,
  ScanIcon,
  ClockIcon,
  TrashIcon,
  EditIcon,
  HeadphonesIcon,
} from '@/components/icons/AlarmIcons';

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (alarm: Alarm) => void;
  onDelete: (id: string) => void;
}

export function AlarmCard({ alarm, onToggle, onEdit, onDelete }: AlarmCardProps) {
  const activeDays = Array.isArray(alarm?.days_of_week) ? alarm.days_of_week : [];

  const nextTime = alarm && alarm.enabled ? getNextAlarmTime(alarm) : null;
  const countdown = nextTime ? formatCountdown(nextTime) : '';

  function getMissionIcon() {
    if (!alarm) return null;
    switch (alarm.mission_type) {
      case 'math':
        return <CalculatorIcon size={14} color="var(--c-textSecondary)" />;
      case 'shake':
        return <ShakeIcon size={14} color="var(--c-textSecondary)" />;
      case 'scanner':
        return <ScanIcon size={14} color="var(--c-textSecondary)" />;
      default:
        return null;
    }
  }

  function getDayLabel() {
    if (!alarm) return 'Once';
    if (alarm.is_one_time) return 'One-time';
    if (activeDays.length === 0) return 'Once';
    if (activeDays.length === 7) return 'Every day';

    if (activeDays.length === 5 && [1, 2, 3, 4, 5].every((d) => activeDays.includes(d))) {
      return 'Weekdays';
    }

    if (activeDays.length === 2 && activeDays.includes(0) && activeDays.includes(6)) {
      return 'Weekends';
    }

    return [...activeDays]
      .sort((a, b) => a - b)
      .map((d) => DAYS_OF_WEEK[d] || '')
      .filter(Boolean)
      .join(', ');
  }

  function getAudioLabel() {
    if (!alarm) return null;
    if (alarm.audio_source === 'custom') {
      return alarm.audio_custom_name || 'Custom song';
    }
    const tone = ALARM_TONES.find((t) => t.id === alarm.audio_source);
    return tone ? tone.name : null;
  }

  if (!alarm) return null;

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-200 animate-in"
      style={{
        backgroundColor: alarm.enabled ? 'var(--c-surface)' : 'var(--c-bgTertiary)',
        border: `1px solid var(--c-border)`,
        opacity: alarm.enabled ? 1 : 0.6,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums tracking-tight" style={{ color: 'var(--c-text)' }}>
              {formatTime(alarm.hour || 0, alarm.minute || 0)}
            </span>
            {alarm.enabled && countdown && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--c-bgTertiary)', color: 'var(--c-accent)' }}
              >
                {countdown}
              </span>
            )}
          </div>
          <p className="text-sm mt-1 truncate" style={{ color: 'var(--c-textSecondary)' }}>
            {alarm.label || 'Alarm'}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="text-xs px-2 py-1 rounded-md"
              style={{ backgroundColor: 'var(--c-bgTertiary)', color: 'var(--c-textMuted)' }}
            >
              {getDayLabel()}
            </span>
            {getMissionIcon() && (
              <span
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md capitalize"
                style={{ backgroundColor: 'var(--c-bgTertiary)', color: 'var(--c-textSecondary)' }}
              >
                {getMissionIcon()}
                {alarm.mission_type}
              </span>
            )}
            {alarm.is_one_time && (
              <span
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
                style={{ backgroundColor: 'var(--c-bgTertiary)', color: 'var(--c-warning)' }}
              >
                <ClockIcon size={12} color="var(--c-warning)" />
                Auto-delete
              </span>
            )}
            {getAudioLabel() && (
              <span
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md max-w-[140px] truncate"
                style={{ backgroundColor: 'var(--c-bgTertiary)', color: 'var(--c-textSecondary)' }}
              >
                {alarm.audio_source === 'custom' ? (
                  <span>🎵</span>
                ) : (
                  <HeadphonesIcon size={12} color="var(--c-textSecondary)" />
                )}
                <span className="truncate">{getAudioLabel()}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Toggle checked={!!alarm.enabled} onChange={(v) => onToggle(alarm.id, v)} />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onEdit(alarm)}
              className="p-2 rounded-lg transition-colors hover:opacity-70"
              style={{ backgroundColor: 'var(--c-bgTertiary)' }}
            >
              <EditIcon size={16} color="var(--c-textSecondary)" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(alarm.id)}
              className="p-2 rounded-lg transition-colors hover:opacity-70"
              style={{ backgroundColor: 'var(--c-error)' }}
            >
              <TrashIcon size={16} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
