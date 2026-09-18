# CR Royal Alarm

A 100% offline Android alarm clock built with React + TypeScript + Capacitor.
No backend, no account, no internet required — every alarm, setting and
theme choice lives entirely in the device's local storage.

## What was fixed in this build

The original code had several bugs that would have broken the app on a
real device. All of these are fixed in this repo:

- **Notification tap did nothing** — `App.tsx` read alarms from a
  `localStorage` key (`alarms`) that nothing else ever wrote to; the rest
  of the app used `alarms_pro_list`. Every read/write now goes through a
  single `src/lib/storage.ts` helper with one consistent key.
- **Alarm creation screen crashed** — `AlarmEditor.tsx` had an `<input>`
  tag that was never closed (`/>`) before its parent `</div>`, which is
  invalid JSX and would fail to compile.
- **Dashboard screen crashed** — `Dashboard.tsx` declared `loadAlarms()`
  twice and had a broken/incomplete sort-dropdown block (a `<button>`
  used without ever being opened).
- **Toasts silently failed** — `showToast(message, type)` was called
  with two arguments in several places, but the original `Toast.tsx`
  only accepted one. It now supports `'default' | 'success' | 'error'`.
- **Delete button icon was invisible** — the trash icon color matched
  its own red background exactly.
- **Notification sound never played** — the sound resource was
  referenced as `alarm_tone.wav` (with extension); Android's
  `LocalNotifications` channel config expects the bare resource name
  (`alarm_tone`, no extension) to find `res/raw/alarm_tone.wav`.
- **Shake mission was fake** — there was only a manual "Simulate Shake"
  button. `AlarmTrigger.tsx` now also listens to the real
  `devicemotion` sensor (with the iOS 13+ permission prompt handled),
  so shaking the actual phone works; the simulate button stays as a
  fallback for testing in a browser.
- **Supabase removed entirely** — `SettingsPanel.tsx` no longer talks to
  any backend; every setting is read/written through
  `src/lib/storage.ts`. The `@supabase/supabase-js` dependency and
  `src/lib/supabase.ts` are gone.
- Rebranded from "Alarmio Pro" throughout to **CR Royal Alarm**
  (app name, package id `com.crroyal.alarm`, splash screen, notification
  titles, About screen).

## Project structure

```
src/
  components/
    dashboard/     Dashboard, AlarmCard, QuickNapTiles
    editor/        AlarmEditor (create/edit alarm + all mission/audio settings)
    onboarding/    First-run permission walkthrough
    settings/      Theme + default alarm settings screen
    trigger/       Full-screen ringing UI with math/shake/scanner missions
    ui/            Modal, Dropdown, Slider, Toggle, Toast
    icons/         Inline SVG icon set
  contexts/        ThemeContext (5 built-in themes)
  lib/
    storage.ts     Single source of truth for all localStorage reads/writes
    notifications.ts  Capacitor LocalNotifications scheduling
    audio.ts       Web Audio alarm tones, vibration patterns, TTS briefing
    themes.ts      Theme color definitions
  types/           Shared TypeScript types
android-assets/    Custom notification icon + alarm sound (copied into the
                   native project automatically during the CI build)
.github/workflows/build-apk.yml   Builds the APK automatically on GitHub
```

The `android/` native folder is **not** committed — see
`android-assets/README.md` for why, and how it's generated automatically.

## Running it locally (optional, for development)

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Alarm scheduling / vibration / native
notifications only work on an actual Android device or emulator (via
Capacitor) — the web preview is just for UI work.

## Getting this onto GitHub

From inside this folder:

```bash
git init
git add .
git commit -m "CR Royal Alarm - initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If the repo already has commits (e.g. it was created with a README),
pull first: `git pull origin main --allow-unrelated-histories`, resolve
any conflicts, then push.

## Getting the APK — no Codemagic, just GitHub

Everything needed to build the APK lives in
`.github/workflows/build-apk.yml`. As soon as you push to `main`,
GitHub itself builds the app on its own servers. You don't need to
install Android Studio, Java, or anything else locally.

**To download the APK:**

1. Go to your repo on github.com
2. Click the **Actions** tab
3. Click the most recent **"Build Android APK"** run (it starts
   automatically a few seconds after your push — look for the small
   yellow/green dot next to your latest commit)
4. Wait for it to finish (5–10 minutes the first time)
5. Scroll down to **Artifacts** at the bottom of that run's page
6. Click **cr-royal-alarm-debug-apk** to download a `.zip`
7. Unzip it — inside is `app-debug.apk`
8. Copy it to your phone (USB, email to yourself, Google Drive, etc.)
   and open it to install. You'll need to allow "Install unknown apps"
   for whichever app you used to open it (Android will prompt you the
   first time).

That debug APK is fully installable and functional — Android's default
debug signing key is used automatically, which is fine for personal use
and testing. It just isn't suitable for publishing to the Play Store.

**If you also want a signed release APK** (needed for Play Store, or if
you just want a "production" build), add these four repo secrets under
**Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Your `.jks`/`.keystore` file, base64-encoded (`base64 -w0 your.keystore` on Linux/macOS) |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password |
| `ANDROID_KEY_ALIAS` | The key alias inside the keystore |
| `ANDROID_KEY_PASSWORD` | The key's password |

Once those exist, the workflow automatically also builds and uploads a
**cr-royal-alarm-release-apk** artifact on every push. If you don't have
a keystore yet, create one once with:

```bash
keytool -genkeypair -v -keystore release.keystore -alias cr_royal_alarm \
  -keyalg RSA -keysize 2048 -validity 10000
```

(keep this file and its passwords somewhere safe — you'll need the exact
same keystore for every future update once the app is on the Play Store)

## Manually re-running a build

Go to the **Actions** tab → **Build Android APK** → **Run workflow**
(top right) any time you want a fresh APK without pushing a new commit.

## Notes on what's simulated vs. real

- **Math mission**: fully real — generates and checks equations.
- **Shake mission**: real device-motion detection on a real phone;
  falls back to a manual button in a browser (no motion sensor there).
- **Scanner mission**: UI only (a real camera-based barcode scanner
  needs a native plugin like `@capacitor-community/barcode-scanning`,
  which isn't wired in — the "Simulate Scan" button stands in for it so
  you can still complete the mission and dismiss the alarm).
- **Flashlight-in-scanner-mode toggle**: stored as a preference but not
  wired to an actual flashlight plugin.
