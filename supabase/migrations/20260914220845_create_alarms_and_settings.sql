/*
# Create alarms and app_settings tables for Alarmio Pro

## Overview
Creates the core data persistence layer for a mobile alarm application. Single-tenant (no auth) — all data is local to the device/app instance.

## New Tables

### alarms
Stores all alarm configurations with 30+ cognitive settings per alarm.
- id (uuid, PK)
- label (text, alarm name)
- hour (int 0-23, alarm hour)
- minute (int 0-59, alarm minute)
- days_of_week (int[] 0-6, days of week, empty = one-time)
- enabled (bool, alarm on/off)
- mission_type (text: none/math/shake/scanner)
- math_difficulty (text: easy/medium/hard)
- math_count (int: 3/5/7)
- math_anti_cheat (bool)
- shake_intensity (text: gentle/moderate/vigorous)
- shake_count (int: 20-100)
- scanner_flashlight (bool)
- scanner_skip_pin (text)
- snooze_limit (int: 0=unlimited, 1/2/3)
- snooze_escalate (bool)
- snooze_shake_bypass (bool)
- snooze_duration (int, minutes)
- audio_source (text, built-in tone id)
- audio_custom_url (text, custom URL)
- audio_local_path (text, local file path)
- volume_crescendo (text: off/15s/30s/60s/120s)
- vibrate_override (bool)
- fade_out (text: never/5min/10min/15min)
- vibration_pattern (text: continuous/heartbeat/rapid/sos/none)
- show_countdown_toast (bool)
- post_dismiss_tts (bool)
- holiday_skip (bool)
- holiday_dates (text[], ISO dates to skip)
- is_one_time (bool, auto-delete after firing)
- created_at (timestamptz)
- updated_at (timestamptz)

### app_settings
Stores global app configuration (theme, onboarding state, defaults).
- id (uuid, PK)
- theme (text: amoled/nordic/midnight/forest/crimson)
- onboarding_completed (bool)
- default_snooze_duration (int)
- default_vibration_pattern (text)
- default_audio_source (text)
- default_volume_crescendo (text)
- default_fade_out (text)

## Security
- RLS enabled on both tables.
- Single-tenant no-auth app: anon + authenticated have full CRUD access.
*/

CREATE TABLE IF NOT EXISTS alarms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT 'Alarm',
  hour integer NOT NULL DEFAULT 7,
  minute integer NOT NULL DEFAULT 0,
  days_of_week integer[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  mission_type text NOT NULL DEFAULT 'none',
  math_difficulty text NOT NULL DEFAULT 'easy',
  math_count integer NOT NULL DEFAULT 3,
  math_anti_cheat boolean NOT NULL DEFAULT false,
  shake_intensity text NOT NULL DEFAULT 'moderate',
  shake_count integer NOT NULL DEFAULT 20,
  scanner_flashlight boolean NOT NULL DEFAULT false,
  scanner_skip_pin text NOT NULL DEFAULT '',
  snooze_limit integer NOT NULL DEFAULT 0,
  snooze_escalate boolean NOT NULL DEFAULT false,
  snooze_shake_bypass boolean NOT NULL DEFAULT false,
  snooze_duration integer NOT NULL DEFAULT 10,
  audio_source text NOT NULL DEFAULT 'tone_1',
  audio_custom_url text NOT NULL DEFAULT '',
  audio_local_path text NOT NULL DEFAULT '',
  volume_crescendo text NOT NULL DEFAULT 'off',
  vibrate_override boolean NOT NULL DEFAULT false,
  fade_out text NOT NULL DEFAULT 'never',
  vibration_pattern text NOT NULL DEFAULT 'continuous',
  show_countdown_toast boolean NOT NULL DEFAULT false,
  post_dismiss_tts boolean NOT NULL DEFAULT false,
  holiday_skip boolean NOT NULL DEFAULT false,
  holiday_dates text[] NOT NULL DEFAULT '{}',
  is_one_time boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_alarms" ON alarms;
CREATE POLICY "anon_select_alarms" ON alarms FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_alarms" ON alarms;
CREATE POLICY "anon_insert_alarms" ON alarms FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_alarms" ON alarms;
CREATE POLICY "anon_update_alarms" ON alarms FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_alarms" ON alarms;
CREATE POLICY "anon_delete_alarms" ON alarms FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme text NOT NULL DEFAULT 'amoled',
  onboarding_completed boolean NOT NULL DEFAULT false,
  default_snooze_duration integer NOT NULL DEFAULT 10,
  default_vibration_pattern text NOT NULL DEFAULT 'continuous',
  default_audio_source text NOT NULL DEFAULT 'tone_1',
  default_volume_crescendo text NOT NULL DEFAULT 'off',
  default_fade_out text NOT NULL DEFAULT 'never',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON app_settings;
CREATE POLICY "anon_select_settings" ON app_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON app_settings;
CREATE POLICY "anon_insert_settings" ON app_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON app_settings;
CREATE POLICY "anon_update_settings" ON app_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON app_settings;
CREATE POLICY "anon_delete_settings" ON app_settings FOR DELETE
  TO anon, authenticated USING (true);

-- Seed a default settings row
INSERT INTO app_settings (theme, onboarding_completed)
SELECT 'amoled', false
WHERE NOT EXISTS (SELECT 1 FROM app_settings);
