export type ThemeId = 'amoled' | 'nordic' | 'midnight' | 'forest' | 'crimson';

export type MissionType = 'none' | 'math' | 'shake' | 'scanner';
export type MathDifficulty = 'easy' | 'medium' | 'hard';
export type ShakeIntensity = 'gentle' | 'moderate' | 'vigorous';
export type VibrationPattern = 'continuous' | 'heartbeat' | 'rapid' | 'sos' | 'none';
export type VolumeCrescendo = 'off' | '15s' | '30s' | '60s' | '120s';
export type FadeOut = 'never' | '5min' | '10min' | '15min';
export type SortMode = 'time' | 'upcoming' | 'label';
export type FilterTab = 'all' | 'active' | 'weekday' | 'weekend';

export interface Alarm {
  id: string;
  label: string;
  hour: number;
  minute: number;
  days_of_week: number[];
  enabled: boolean;
  mission_type: MissionType;
  math_difficulty: MathDifficulty;
  math_count: number;
  math_anti_cheat: boolean;
  shake_intensity: ShakeIntensity;
  shake_count: number;
  scanner_flashlight: boolean;
  scanner_skip_pin: string;
  snooze_limit: number;
  snooze_escalate: boolean;
  snooze_shake_bypass: boolean;
  snooze_duration: number;
  audio_source: string;
  audio_custom_url: string;
  audio_local_path: string;
  volume_crescendo: VolumeCrescendo;
  vibrate_override: boolean;
  fade_out: FadeOut;
  vibration_pattern: VibrationPattern;
  show_countdown_toast: boolean;
  post_dismiss_tts: boolean;
  holiday_skip: boolean;
  holiday_dates: string[];
  is_one_time: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  theme: ThemeId;
  default_snooze_duration: number;
  default_vibration_pattern: VibrationPattern;
  default_audio_source: string;
  default_volume_crescendo: VolumeCrescendo;
  default_fade_out: FadeOut;
}

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  primaryText: string;
  accent: string;
  accentHover: string;
  success: string;
  warning: string;
  error: string;
  errorHover: string;
  shadow: string;
  ring: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  colors: ThemeColors;
}

export const defaultAlarmValues = {
  label: 'Alarm',
  hour: 7,
  minute: 0,
  days_of_week: [] as number[],
  enabled: true,
  mission_type: 'none' as MissionType,
  math_difficulty: 'easy' as MathDifficulty,
  math_count: 3,
  math_anti_cheat: false,
  shake_intensity: 'moderate' as ShakeIntensity,
  shake_count: 20,
  scanner_flashlight: false,
  scanner_skip_pin: '',
  snooze_limit: 0,
  snooze_escalate: false,
  snooze_shake_bypass: false,
  snooze_duration: 10,
  audio_source: 'tone_1',
  audio_custom_url: '',
  audio_local_path: '',
  volume_crescendo: 'off' as VolumeCrescendo,
  vibrate_override: false,
  fade_out: 'never' as FadeOut,
  vibration_pattern: 'continuous' as VibrationPattern,
  show_countdown_toast: false,
  post_dismiss_tts: false,
  holiday_skip: false,
  holiday_dates: [] as string[],
  is_one_time: false,
};

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const FULL_DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const ALARM_TONES = [
  { id: 'tone_1', name: 'Aurora Bell' },
  { id: 'tone_2', name: 'Crystal Dawn' },
  { id: 'tone_3', name: 'Gentle Tide' },
  { id: 'tone_4', name: 'Mountain Echo' },
  { id: 'tone_5', name: 'Pulse Wave' },
  { id: 'tone_6', name: 'Serenity' },
];
