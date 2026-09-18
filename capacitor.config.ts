import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.crroyal.alarm',
  appName: 'CR Royal Alarm',
  webDir: 'dist',
  android: {
    // NOTE: this array is documentation only — Capacitor does not inject
    // arbitrary permissions from it. The GitHub Actions workflow patches
    // the real AndroidManifest.xml with these permissions after
    // `cap add android` (see .github/workflows/build-apk.yml).
    allowMixedContent: false,
    backgroundColor: '#000000',
    permissions: [
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.USE_EXACT_ALARM',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.WAKE_LOCK',
      'android.permission.VIBRATE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.ACCESS_NOTIFICATION_POLICY',
      'android.permission.POST_NOTIFICATIONS',
    ],
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_alarm',
      iconColor: '#dc2626',
      sound: 'alarm_tone',
    },
  },
};

export default config;
