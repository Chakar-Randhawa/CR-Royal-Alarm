import { LocalNotifications } from '@capacitor/local-notifications';
import { KeepAwake } from '@capacitor-community/keep-awake';
import type { Alarm } from '@/types';

export const ALARM_CHANNEL_ID = 'cr_royal_alarm_channel';
const APP_NAME = 'CR Royal Alarm';

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'granted') return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleAlarm(alarm: Alarm): Promise<number | null> {
  try {
    const now = new Date();
    const target = new Date();
    target.setHours(alarm.hour, alarm.minute, 0, 0);

    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    const notifications: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = [];

    if (alarm.days_of_week.length > 0 && !alarm.is_one_time) {
      for (const day of alarm.days_of_week) {
        const dayDate = new Date(target);
        const currentDay = dayDate.getDay();
        let diff = day - currentDay;
        if (diff < 0) diff += 7;
        if (diff === 0 && dayDate.getTime() <= now.getTime()) diff = 7;
        dayDate.setDate(dayDate.getDate() + diff);

        notifications.push({
          id: hashId(alarm.id + '_' + day),
          title: APP_NAME,
          body: alarm.label,
          schedule: {
            at: dayDate,
            repeats: true,
            every: 'week' as const,
          },
          extra: { alarmId: alarm.id, missionType: alarm.mission_type },
          smallIcon: 'ic_alarm',
          largeIcon: 'ic_alarm',
          channelId: ALARM_CHANNEL_ID,
        });
      }
    } else {
      notifications.push({
        id: hashId(alarm.id),
        title: APP_NAME,
        body: alarm.label,
        schedule: { at: target },
        extra: { alarmId: alarm.id, missionType: alarm.mission_type },
        smallIcon: 'ic_alarm',
        largeIcon: 'ic_alarm',
        channelId: ALARM_CHANNEL_ID,
      });
    }

    if (notifications.length === 0) return null;

    await LocalNotifications.schedule({ notifications });
    return notifications[0].id;
  } catch (e) {
    console.error('Failed to schedule alarm', e);
    return null;
  }
}

export async function cancelAlarm(alarmId: string): Promise<void> {
  try {
    const pending = await LocalNotifications.getPending();
    const ids = pending.notifications
      .filter((n) => n.extra?.alarmId === alarmId)
      .map((n) => n.id);
    if (ids.length > 0) {
      await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
    }
  } catch {
    // no pending notifications / not on native platform, ignore
  }
}

export async function cancelAllAlarms(): Promise<void> {
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }
  } catch {
    // no-op
  }
}

export async function createAlarmChannel(): Promise<void> {
  try {
    await LocalNotifications.createChannel({
      id: ALARM_CHANNEL_ID,
      name: 'CR Royal Alarms',
      description: 'High-priority alarm notifications',
      importance: 5,
      visibility: 1,
      sound: 'alarm_tone', // resource name only, no extension (android/res/raw/alarm_tone.wav)
      vibration: true,
    });
  } catch {
    // no-op (web preview / unsupported platform)
  }
}

export async function keepScreenAwake(): Promise<void> {
  try {
    await KeepAwake.keepAwake();
  } catch {
    // no-op
  }
}

export async function allowSleep(): Promise<void> {
  try {
    await KeepAwake.allowSleep();
  } catch {
    // no-op
  }
}

function hashId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getNextAlarmTime(alarm: Alarm): Date | null {
  const now = new Date();

  if (alarm.days_of_week.length > 0 && !alarm.is_one_time) {
    let earliest: Date | null = null;
    for (const day of alarm.days_of_week) {
      const target = new Date();
      target.setHours(alarm.hour, alarm.minute, 0, 0);
      const currentDay = target.getDay();
      let diff = day - currentDay;
      if (diff < 0) diff += 7;
      if (diff === 0 && target.getTime() <= now.getTime()) diff = 7;
      target.setDate(target.getDate() + diff);
      if (!earliest || target.getTime() < earliest.getTime()) {
        earliest = target;
      }
    }
    return earliest;
  }

  const target = new Date();
  target.setHours(alarm.hour, alarm.minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

export function formatCountdown(target: Date): string {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'Now';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}
