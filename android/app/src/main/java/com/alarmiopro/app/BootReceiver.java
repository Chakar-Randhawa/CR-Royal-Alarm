package com.alarmiopro.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * BootReceiver listens for BOOT_COMPLETED and re-registers all
 * stored alarms via the Capacitor LocalNotifications plugin after
 * a device reboot. This ensures alarms survive hard reboots.
 */
public class BootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (action == null) return;

        if (action.equals(Intent.ACTION_BOOT_COMPLETED) ||
            action.equals("android.intent.action.QUICKBOOT_POWERON") ||
            action.equals("com.htc.intent.action.QUICKBOOT_POWERON")) {

            Log.i("AlarmioBootReceiver", "Boot completed - re-registering alarms");

            // The Capacitor LocalNotifications plugin persists scheduled
            // notifications in its own SQLite database. On boot, we trigger
            // a re-schedule by starting a background service that reads the
            // stored alarm configurations and re-creates the exact alarm
            // windows via AlarmManager.
            Intent rescheduleIntent = new Intent(context, AlarmRescheduleService.class);
            rescheduleIntent.setAction("REREGISTER_ALARMS");

            // Use foreground service on Android O+
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(rescheduleIntent);
            } else {
                context.startService(rescheduleIntent);
            }
        }
    }
}
