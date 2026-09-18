# android-assets/

The native `android/` folder is **not committed to this repo**. It is
generated fresh on every CI build by running `npx cap add android`
(this guarantees the native project always matches whatever Capacitor
version is in `package.json` — a hand-committed `android/` folder tends to
rot and break as Capacitor/Gradle/AGP versions move on).

Because of that, this folder holds every custom native piece the app
needs. The GitHub Actions workflow (`.github/workflows/build-apk.yml`)
copies/patches these into the freshly generated Android project
automatically, right after `cap add android` and before the Gradle build.

- **`drawable/ic_alarm.xml`** — notification small icon (white silhouette,
  required by Android's notification icon guidelines)
- **`raw/alarm_tone.wav`** — the alarm notification sound, referenced as
  `alarm_tone` (no extension) in `capacitor.config.ts` and
  `src/lib/notifications.ts`. Replace this file (same name) to change the
  sound.
- **`java/com/crroyal/alarm/NativeSettingsPlugin.java`** — a small custom
  Capacitor plugin giving the app real access to three Android Settings
  screens that have no web API and no core Capacitor plugin:
  "Display over other apps" (overlay permission), battery-optimization
  exemption, and exact-alarm scheduling permission (Android 12+). Used by
  `src/lib/nativeSettings.ts`.
- **`java/com/crroyal/alarm/MainActivity.java`** — overrides the
  auto-generated `MainActivity` to register `NativeSettingsPlugin` (custom
  local plugins that aren't npm packages must be registered manually).

If you rename the package id in `capacitor.config.ts` (`appId`), update the
`package com.crroyal.alarm;` line in both Java files and the folder path
`java/com/crroyal/alarm/` to match, and update the copy paths in the
GitHub Actions workflow accordingly.
