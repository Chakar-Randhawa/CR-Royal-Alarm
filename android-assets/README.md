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

- **`mipmap-*/ic_launcher.png`, `ic_launcher_round.png`,
  `ic_launcher_foreground.png`** + **`mipmap-anydpi-v26/*.xml`** +
  **`values/ic_launcher_colors.xml`** — the real CR Royal Alarm app icon
  (generated from the gold crown/clock artwork), at every Android density,
  as both a legacy square/round icon and a proper adaptive icon (the
  foreground is scaled to 70% with transparent padding so nothing gets
  clipped by any launcher's mask shape — circle, squircle, rounded square,
  teardrop). `playstore/ic_launcher_playstore.png` is the 512×512 listing
  image for the Play Store, not used by the app itself.
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

## Changing the app icon later

Replace the source artwork and regenerate every density in one go
(requires Node + the `sharp` package):

```bash
npm install sharp --no-save
node -e "
const sharp = require('sharp');
// ... resize your new PNG into mipmap-mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi
// at 48/72/96/144/192px for ic_launcher.png, and into a 70%-scaled,
// transparently-padded square at 108/162/216/324/432px for
// ic_launcher_foreground.png. See git history of this file for the
// exact script used to generate the current icons.
"
```

If you rename the package id in `capacitor.config.ts` (`appId`), update the
`package com.crroyal.alarm;` line in both Java files and the folder path
`java/com/crroyal/alarm/` to match, and update the copy paths in the
GitHub Actions workflow accordingly.
