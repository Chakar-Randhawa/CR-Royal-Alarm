import type { Alarm, AppSettings } from '@/types';

// Single source of truth for every localStorage key used across the app.
// (Previously different screens used different / mismatched keys which
// caused alarms to "disappear" when tapped from a notification — fixed here.)
export const STORAGE_KEYS = {
  ALARMS: 'cr_royal_alarms',
  THEME: 'cr_royal_theme',
  ONBOARDING_COMPLETED: 'cr_royal_onboarding_completed',
  SETTINGS: 'cr_royal_settings',
  FIRST_LAUNCH_DONE: 'cr_royal_first_launch_done',
  TOUR_COMPLETED: 'cr_royal_tour_completed',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'amoled',
  default_snooze_duration: 10,
  default_vibration_pattern: 'continuous',
  default_audio_source: 'tone_1',
  default_volume_crescendo: 'off',
  default_fade_out: 'never',
};

export function getAlarms(): Alarm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALARMS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to read alarms from local storage', e);
    return [];
  }
}

export function saveAlarms(alarms: Alarm[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(alarms));
    return true;
  } catch (e) {
    console.error('Failed to save alarms to local storage', e);
    return false;
  }
}

export function getAlarmById(id: string): Alarm | null {
  return getAlarms().find((a) => a.id === id) || null;
}

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to read settings from local storage', e);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(partial: Partial<AppSettings>): AppSettings {
  const updated = { ...getSettings(), ...partial };
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save settings to local storage', e);
  }
  return updated;
}
