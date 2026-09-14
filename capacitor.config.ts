import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alarmiopro.app',
  appName: 'Alarmio Pro',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    backgroundColor: '#000000',
    permissions: [
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.USE_EXACT_ALARM',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.WAKE_LOCK',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.ACCESS_NOTIFICATION_POLICY',
    ],
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_alarm',
      iconColor: '#ffffff',
      sound: 'alarm_tone.wav',
    },
  },
};

export default config;
