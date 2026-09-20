import { registerPlugin } from '@capacitor/core';

export interface NativeSettingsPlugin {
  isOverlayGranted(): Promise<{ granted: boolean }>;
  openOverlaySettings(): Promise<void>;
  isBatteryUnrestricted(): Promise<{ unrestricted: boolean }>;
  openBatterySettings(): Promise<void>;
  isExactAlarmGranted(): Promise<{ granted: boolean }>;
  openExactAlarmSettings(): Promise<void>;
  setStatusBarStyle(options: { lightBackground: boolean }): Promise<void>;
}

// Backed by android-assets/java/.../NativeSettingsPlugin.java, wired into
// the native project automatically by the GitHub Actions build. On the web
// (dev preview) these calls aren't implemented, so every function below
// fails safe: checks resolve to "not granted", requests are no-ops.
const NativeSettings = registerPlugin<NativeSettingsPlugin>('NativeSettings');

export async function checkOverlayPermission(): Promise<boolean> {
  try {
    const res = await NativeSettings.isOverlayGranted();
    return !!res.granted;
  } catch {
    return false;
  }
}

export async function requestOverlayPermission(): Promise<void> {
  try {
    await NativeSettings.openOverlaySettings();
  } catch {
    // web preview / unsupported platform — nothing to open
  }
}

export async function checkBatteryUnrestricted(): Promise<boolean> {
  try {
    const res = await NativeSettings.isBatteryUnrestricted();
    return !!res.unrestricted;
  } catch {
    return false;
  }
}

export async function requestBatteryUnrestricted(): Promise<void> {
  try {
    await NativeSettings.openBatterySettings();
  } catch {
    // no-op
  }
}

export async function checkExactAlarmPermission(): Promise<boolean> {
  try {
    const res = await NativeSettings.isExactAlarmGranted();
    return !!res.granted;
  } catch {
    return false;
  }
}

export async function requestExactAlarmPermission(): Promise<void> {
  try {
    await NativeSettings.openExactAlarmSettings();
  } catch {
    // no-op
  }
}

/**
 * Keeps the status bar / navigation bar icon color legible against
 * whichever theme is now showing through the transparent system bars.
 * Pass true when the current theme's background is light (Nordic).
 */
export async function setNativeStatusBarStyle(lightBackground: boolean): Promise<void> {
  try {
    await NativeSettings.setStatusBarStyle({ lightBackground });
  } catch {
    // web preview / unsupported platform — no-op
  }
}
