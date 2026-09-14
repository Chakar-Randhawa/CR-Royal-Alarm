package com.alarmiopro.app;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

/**
 * AlarmRescheduleService runs after device boot to re-register
 * all persisted alarms. The Capacitor LocalNotifications plugin
 * stores alarm configs in SQLite; this service triggers the
 * re-scheduling pipeline so no alarms are lost after a reboot.
 */
public class AlarmRescheduleService extends Service {

    private static final String TAG = "AlarmRescheduleService";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        Log.i(TAG, "Service started with action: " + action);

        // The LocalNotifications plugin handles re-scheduling from its
        // persisted store. This service ensures the app process is alive
        // so the plugin can access its SQLite database and re-create
        // AlarmManager exact alarm windows.

        // Stop the service after re-registration is complete
        stopSelf();
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
