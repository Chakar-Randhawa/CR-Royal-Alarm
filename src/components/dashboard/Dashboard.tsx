import { useState, useMemo, useEffect } from 'react';
import type { Alarm, FilterTab, SortMode } from '@/types';
import { defaultAlarmValues } from '@/types';
import { scheduleAlarm, cancelAlarm, getNextAlarmTime } from '@/lib/notifications';
import { getAlarms, saveAlarms } from '@/lib/storage';
import { AlarmCard } from '@/components/dashboard/AlarmCard';
import { QuickNapTiles } from '@/components/dashboard/QuickNapTiles';
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

  // 100% offline: alarms are read straight from local storage.
  function loadAlarms() {
    setLoading(true);
    try {
      setAlarms(getAlarms());
    } catch (error) {
      console.error('Failed to load local alarms', error);
      showToast('Error loading saved alarms', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function toggleAlarm(id: string, enabled: boolean) {
    try {
      const alarmsArray = getAlarms();
      const alarmIndex = alarmsArray.findIndex((a) => a.id === id);
      if (alarmIndex === -1) return;

      alarmsArray[alarmIndex] = {
        ...alarmsArray[alarmIndex],
        enabled,
        updated_at: new Date().toISOString(),
      };

      saveAlarms(alarmsArray);
      setAlarms(alarmsArray);

      const targetAlarm = alarmsArray[alarmIndex];

      if (enabled) {
        await scheduleAlarm(targetAlarm);
        if (targetAlarm.show_countdown_toast) {
          const next = getNextAlarmTime(targetAlarm);
          if (next) {
            const diffMs = next.getTime() - Date.now();
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            showToast(`Alarm set for ${hours}h ${minutes}m from now`);
          }
        }
      } else {
        await cancelAlarm(id);
      }
    } catch (error) {
      console.error('Toggle failed', error);
      showToast('Failed to switch alarm state', 'error');
    }
  }

  async function deleteAlarm(id: string) {
    try {
      await cancelAlarm(id);
      const alarmsArray = getAlarms();
      const filteredAlarms = alarmsArray.filter((a) => a.id !== id);
      saveAlarms(filteredAlarms);
      setAlarms(filteredAlarms);
      showToast('Alarm deleted', 'success');
    } catch (error) {
      console.error('Delete failed', error);
      showToast('Failed to delete alarm', 'error');
    }
  }

  async function quickNap(minutes: number) {
    try {
      const target = new Date(Date.now() + minutes * 60 * 1000);
      const uniqueId = 'nap_' + Date.now();

      const newAlarm: Alarm = {
        ...defaultAlarmValues,
        id: uniqueId,
        label: `Power Nap +${minutes}min`,
        hour: target.getHours(),
        minute: target.getMinutes(),
        days_of_week: [],
        enabled: true,
        is_one_time: true,
        snooze_duration: 5,
        show_countdown_toast: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const alarmsArray = getAlarms();
      alarmsArray.unshift(newAlarm);
      saveAlarms(alarmsArray);
      setAlarms(alarmsArray);

      await scheduleAlarm(newAlarm);
      showToast(`Power nap set for ${minutes} minutes`, 'success');
    } catch (error) {
      console.error('Quick nap failed', error);
      showToast('Failed to set power nap', 'error');
    }
  }

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
        const aTime = getNextAlarmTime(a);
        const bTime = getNextAlarmTime(b);
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

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: 'time', label: 'Sort by Time' },
    { value: 'upcoming', label: 'Sort by Next Up' },
    { value: 'label', label: 'Sort by Label' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--c-bg)' }}>
      <header className="flex items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top,44px))] pb-3">
        <div className="flex items-center gap-2">
          <AlarmClockIcon size={28} color="var(--c-primary)" />
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--c-text)' }}>
              CR Royal Alarm
            </h1>
            <p className="text-xs" style={{ color: 'var(--c-textMuted)' }}>
              {activeCount} active alarm{activeCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          data-tour="settings"
          className="p-2.5 rounded-xl transition-colors hover:opacity-70"
          style={{ backgroundColor: 'var(--c-surface)' }}
        >
          <SettingsIcon size={20} color="var(--c-text)" />
        </button>
      </header>

      <div className="px-5 pb-3" data-tour="quicknap">
        <QuickNapTiles onQuickNap={quickNap} />
      </div>

      <div className="px-5 pb-3 flex items-center gap-2">
        <div className="flex-1 flex gap-1 p-1 rounded-2xl" data-tour="filters" style={{ backgroundColor: 'var(--c-bgTertiary)' }}>
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
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative shrink-0" data-tour="sort">
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl transition-colors hover:opacity-80"
            style={{ backgroundColor: 'var(--c-bgTertiary)' }}
          >
            <SortIcon size={16} color="var(--c-textSecondary)" />
          </button>
          {sortOpen && (
            <div
              className="absolute right-0 top-full mt-1 z-40 rounded-xl overflow-hidden shadow-xl whitespace-nowrap"
              style={{ backgroundColor: 'var(--c-surface)', border: `1px solid var(--c-border)` }}
            >
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSortMode(opt.value);
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

      <div
        className="flex-1 overflow-y-auto px-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--c-border)', borderTopColor: 'var(--c-primary)' }}
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
        data-tour="fab"
        className="fixed right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 z-30"
        style={{
          bottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
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
