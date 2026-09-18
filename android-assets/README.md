# android-assets/

The native `android/` folder is **not committed to this repo**. It is
generated fresh on every CI build by running `npx cap add android`
(this guarantees the native project always matches whatever Capacitor
version is in `package.json` — a hand-committed `android/` folder tends to
rot and break as Capacitor/Gradle/AGP versions move on).

Because of that, this folder holds the few custom native resources the
app needs (notification icon + alarm sound). The GitHub Actions workflow
(`.github/workflows/build-apk.yml`) copies these into the freshly
generated `android/app/src/main/res/` folder automatically, right after
`cap add android` and before the Gradle build — so you never have to do
this by hand.

- `drawable/ic_alarm.xml` → notification small icon (white silhouette,
  required by Android's notification icon guidelines)
- `raw/alarm_tone.wav` → the alarm notification sound, referenced as
  `alarm_tone` (no extension) in `capacitor.config.ts` and
  `src/lib/notifications.ts`

If you want to change the alarm sound, just replace
`android-assets/raw/alarm_tone.wav` with your own `.wav` file (keep the
same filename) and push — the next CI build will pick it up automatically.
