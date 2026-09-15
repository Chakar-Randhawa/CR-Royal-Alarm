import { useState, useMemo, useEffect } from 'react';
import type { Alarm, FilterTab, SortMode } from '@/types';
import { scheduleAlarm, cancelAlarm } from '@/lib/notifications';
import { AlarmCard } from '@/components/dashboard/AlarmCard';
import { QuickNapTiles } from '@/components/dashboard/QuickNapTiles';
import { Dropdown } from '@/components/ui/Dropdown';
import { showToast } from '@/components/ui/Toast';
import { PlusIcon, SortIcon, SettingsIcon, AlarmClockIcon } from '@/components/icons/AlarmIcons';

interface DashboardProps {
  onAddAlarm: () => void;
  onEditAlarm: (alarm: Alarm) => void;
  onOpenSettings: () => void;
}

export function Dashboard({ onAddAlarm, onEditAlarm, onOpenSettings }: DashboardProps) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [sortMode, setSortMode] = useState<SortMode>('upcoming');
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    loadAlarms();
  }, []);

  // 100% OFFLINE LOCAL STORAGE ALARMS LOADER
  function loadAlarms() {
    try {
      setLoading(true);
      const savedAlarms = localStorage.getItem('alarms_pro_list');
      if (savedAlarms) {
        setAlarms(JSON.parse(savedAlarms));
      } else {
        setAlarms([]);
      }
    } catch (error) {
      console.error("Failed to parse local storage offline alarms array", error);
      showToast("Error loading saved alarms", "error");
    } finally {
      setLoading(false); // Force dismiss dashboard loading overlay immediately
    }
  }

    // 100% OFFLINE DATA FETCHING
  function loadAlarms() {
    try {
      setLoading(true);
      const savedAlarms = localStorage.getItem('alarms_pro_list');
      if (savedAlarms) {
        setAlarms(JSON.parse(savedAlarms));
      } else {
        setAlarms([]);
      }
    } catch (error) {
      console.error("Local load failed:", error);
      showToast("Error loading saved alarms", "error");
    } finally {
      setLoading(false);
    }
  }

  // OFFLINE ALARM TOGGLE MANAGEMENT
  async function toggleAlarm(id: string, enabled: boolean) {
    try {
      const savedAlarms = localStorage.getItem('alarms_pro_list');
      if (!savedAlarms) return;

      let alarmsArray: Alarm[] = JSON.parse(savedAlarms);
      const alarmIndex = alarmsArray.findIndex((a) => a.id === id);
      if (alarmIndex === -1) return;

      // Update state internally
      alarmsArray[alarmIndex].enabled = enabled;
      alarmsArray[alarmIndex].updated_at = new Date().toISOString();

      // Commit to local disk database instantly
      localStorage.setItem('alarms_pro_list', JSON.stringify(alarmsArray));
      setAlarms(alarmsArray);

      const targetAlarm = alarmsArray[alarmIndex];

      if (enabled) {
        await scheduleAlarm({ ...targetAlarm, enabled });
        if (targetAlarm.show_countdown_toast) {
          const next = getNextTime(targetAlarm);
          if (next) {
            const diffMs = next.getTime() - Date.now();
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            showToast(`Alarm set for ${hours} hours and ${minutes} minutes from now`);
          }
        }
      } else {
        await cancelAlarm(id);
      }
    } catch (error) {
      console.error("Local toggle crash:", error);
      showToast("Failed to switch alarm state", "error");
    }
  }

  function getNextTime(alarm: Alarm): Date | null {
    const now = new Date();
    if (alarm.days_of_week && alarm.days_of_week.length > 0 && !alarm.is_one_time) {
      let earliest: Date | null = null;
      for (const day of alarm.days_of_week) {
        const target = new Date();
        target.setHours(alarm.hour, alarm.minute, 0, 0);
        const currentDay = target.getDay();
        let diff = day - currentDay;
        if (diff < 0) diff += 7;
        if (diff === 0 && target.getTime() <= now.getTime()) diff = 7;
        target.setDate(target.getDate() + diff);
        if (!earliest || target.getTime() < earliest.getTime()) earliest = target;
      }
      return earliest;
    }
    const target = new Date();
    target.setHours(alarm.hour, alarm.minute, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    return target;
  }

  // 100% LOCAL DELETE ENGINE
  async function deleteAlarm(id: string) {
    try {
      await cancelAlarm(id);
      const savedAlarms = localStorage.getItem('alarms_pro_list');
      if (savedAlarms) {
        const alarmsArray: Alarm[] = JSON.parse(savedAlarms);
        const filteredAlarms = alarmsArray.filter((a) => a.id !== id);
        localStorage.setItem('alarms_pro_list', JSON.stringify(filteredAlarms));
        setAlarms(filteredAlarms);
        showToast("Alarm deleted successfully");
      }
    } catch (error) {
      console.error("Local delete failed:", error);
    }
  }

  // OFFLINE POWER-NAP GENERATOR
  async function quickNap(minutes: number) {
    try {
      const target = new Date(Date.now() + minutes * 60 * 1000);
      const uniqueId = 'nap_' + Date.now();
      
      const newAlarm: Alarm = {
        id: uniqueId,
        label: `Power Nap +${minutes}min`,
        hour: target.getHours(),
        minute: target.getMinutes(),
        days_of_week: [],
        enabled: true,
        is_one_time: true,
        mission_type: 'none',
        snooze_duration: 5,
        audio_source: 'tone_1',
        volume_crescendo: 'off',
        vibrate_override: false,
        fade_out: 'never',
        vibration_pattern: 'continuous',
        show_countdown_toast: true,
        post_dismiss_tts: false,
        holiday_skip: false,
        holiday_dates: [],
        math_difficulty: 'easy',
        math_count: 3,
        math_anti_cheat: false,
        shake_intensity: 'moderate',
        shake_count: 20,
        scanner_flashlight: false,
        scanner_skip_pin: '',
        snooze_limit: 0,
        snooze_escalate: false,
        snooze_shake_bypass: false,
        audio_custom_url: '',
        audio_local_path: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const savedAlarms = localStorage.getItem('alarms_pro_list');
      const alarmsArray: Alarm[] = savedAlarms ? JSON.parse(savedAlarms) : [];
      alarmsArray.unshift(newAlarm); // Put quick nap at the top of the dashboard
      
      localStorage.setItem('alarms_pro_list', JSON.stringify(alarmsArray));
      setAlarms(alarmsArray);
      
      await scheduleAlarm(newAlarm);
      showToast(`Power Nap set for ${minutes} minutes`);
    } catch (error) {
      console.error("Quick nap failed:", error);
    }
  }
// This closes the quickNap function safely from our previous block step

 const filteredAlarms = useMemo(() => {
    let result = [...alarms];

    if (filter === 'active') {
      result = result.filter((a) => a.enabled);
    } else if (filter === 'weekday') {
      result = result.filter(
        (a) =>
          a.days_of_week &&
          a.days_of_week.length > 0 &&
          [1, 2, 3, 4, 5].some((d) => a.days_of_week.includes(d))
      );
    } else if (filter === 'weekend') {
      result = result.filter(
        (a) =>
          a.days_of_week &&
          a.days_of_week.length > 0 &&
          (a.days_of_week.includes(0) || a.days_of_week.includes(6))
      );
    }

    if (sortMode === 'time') {
      result.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
    } else if (sortMode === 'upcoming') {
      result.sort((a, b) => {
        const aTime = getNextTime(a);
        const bTime = getNextTime(b);
        if (!aTime || !bTime) return 0;
        return aTime.getTime() - bTime.getTime();
      });
    } else if (sortMode === 'label') {
      result.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
    }

    return result;
  }, [alarms, filter, sortMode]);

  const activeCount = alarms.filter((a) => a.enabled).length;

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'weekday', label: 'Weekdays' },
    { id: 'weekend', label: 'Weekends' },
  ];

  const sortOptions = [
    { value: 'time', label: 'Sort by Time' },
    { value: 'upcoming', label: 'Sort by Next Up' },
    { value: 'label', label: 'Sort by Label' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--c-bg)' }}
    >
      <header
        className="flex items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top,44px))] pb-3"
      >
        <div className="flex items-center gap-2">
          <AlarmClockIcon size={28} color="var(--c-primary)" />
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--c-text)' }}>
              Alarmio Pro
            </h1>
            <p className="text-xs" style={{ color: 'var(--c-textMuted)' }}>
              {activeCount} active alarm{activeCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl transition-colors hover:opacity-70"
          style={{ backgroundColor: 'var(--c-surface)' }}
        >
          <SettingsIcon size={20} color="var(--c-text)" />
        </button>
      </header>

      <div className="px-5 pb-3">
        <QuickNapTiles onQuickNap={quickNap} />
      </div>

      <div className="px-5 pb-3">
        <div
          className="flex gap-1 p-1 rounded-2xl"
          style={{ backgroundColor: 'var(--c-bgTertiary)' }}
        >
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                backgroundColor: filter === tab.id ? 'var(--c-surface)' : 'transparent',
                color: filter === tab.id ? 'var(--c-text)' : 'var(--c-textMuted)',
              }}
          >
            <SortIcon size={14} color="var(--c-textSecondary)" />
            {sortOptions.find((o) => o.value === sortMode)?.label}
          </button>
          {sortOpen && (
            <div
              className="absolute right-0 top-full mt-1 z-40 rounded-xl overflow-hidden shadow-xl"
              style={{
                backgroundColor: 'var(--c-surface)',
                border: `1px solid var(--c-border)`,
              }}
            >
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSortMode(opt.value as SortMode);
                    setSortOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2.5 text-xs transition-colors hover:opacity-70"
                  style={{
                    color: sortMode === opt.value ? 'var(--c-primary)' : 'var(--c-text)',
                    backgroundColor: sortMode === opt.value ? 'var(--c-bgTertiary)' : 'transparent',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{
                borderColor: 'var(--c-border)',
                borderTopColor: 'var(--c-primary)',
              }}
            />
          </div>
        ) : filteredAlarms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlarmClockIcon size={48} color="var(--c-textMuted)" />
            <p className="text-sm mt-4" style={{ color: 'var(--c-textMuted)' }}>
              No alarms yet. Tap + to create one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlarms.map((alarm) => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                onToggle={toggleAlarm}
                onEdit={onEditAlarm}
                onDelete={deleteAlarm}
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onAddAlarm}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 z-30"
        style={{
          backgroundColor: 'var(--c-primary)',
          color: 'var(--c-primaryText)',
          boxShadow: `0 8px 24px var(--c-shadow)`,
        }}
      >
        <PlusIcon size={28} color="var(--c-primaryText)" />
      </button>
    </div>
  );
}
