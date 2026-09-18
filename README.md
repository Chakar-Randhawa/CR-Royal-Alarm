# CR Royal Alarm

A 100% offline Android alarm clock built with React + TypeScript + Capacitor.
No backend, no account, no internet required — every alarm, setting and
theme choice lives entirely in the device's local storage.

## What was fixed / added in this build

### Bug fixes
- **Notification tap did nothing** — `App.tsx` read alarms from a
  `localStorage` key (`alarms`) that nothing else ever wrote to; the rest
  of the app used `alarms_pro_list`. Every read/write now goes through a
  single `src/lib/storage.ts` helper with one consistent key.
- **Alarm creation screen crashed** — `AlarmEditor.tsx` had an `<input>`
  tag that was never closed (`/>`) before its parent `</div>`, which is
  invalid JSX and would fail to compile.
- **Dashboard screen crashed** — `Dashboard.tsx` declared `loadAlarms()`
  twice and had a broken/incomplete sort-dropdown block.
- **Toasts silently failed** — `showToast(message, type)` now properly
  supports `'default' | 'success' | 'error'`.
- **Delete button icon was invisible** — the trash icon color matched
  its own red background exactly.
- **Notification sound never played** — fixed the Android sound resource
  reference (bare name, no extension).
- **Supabase removed entirely** — every setting/alarm is 100% local now.
- **"Display Over Apps" / "Battery Unrestricted" were fake** — tapping
  them used to just flip a green checkmark with no real effect. They now
  open the actual Android Settings screens via a small custom native
  plugin (see "Real permissions" below) and re-check automatically when
  you return to the app.

### New features
- **Real overlay / battery / exact-alarm permissions** — a custom native
  Capacitor plugin (`android-assets/java/.../NativeSettingsPlugin.java`)
  opens the genuine Android Settings screens for these three permissions,
  which have no web API. Status is re-checked automatically whenever the
  app regains focus (e.g. coming back from Settings).
- **Custom song as alarm tone** — pick any song from your phone's gallery
  (tap "Choose a song from your gallery" in the alarm editor's Audio
  section). Pick how much of it to use as the ringing clip (5s up to the
  full length, default 30s) — it loops seamlessly until dismissed. The
  file is copied into the app's private storage via the Filesystem
  plugin, so it's never re-requested from the gallery and survives
  restarts.
- **Real audio-reactive ringing screen** — the equalizer bars on the
  ringing screen are driven by a live Web Audio `AnalyserNode` reading
  the actual audio that's playing (tone or custom song) — not a canned
  animation.
- **Premium first-launch experience** — the very first time the app is
  ever opened, it shows an elaborate animated splash (icon reveal → name
  → "Founder By Chakar Randhawa" tagline) before onboarding. Every later
  launch uses a quick, lightweight splash instead.
- **Guided first-run tour** — right after onboarding, a real coach-mark
  overlay highlights the actual dashboard buttons (add alarm, quick nap,
  filters, sort, settings) one at a time with Next / Skip Tour, shown
  only once.
- **Android navigation-bar overlap fixed** — the floating "+" button,
  toasts, and full-screen sheets now use `env(safe-area-inset-bottom)`
  correctly, so content no longer collides with Android's 3-button
  navigation bar (this only showed up on button-nav devices — gesture-nav
  devices were already fine, since Capacitor forwards real system-bar
  insets as CSS environment variables).
- Rebranded from "Alarmio Pro" to **CR Royal Alarm** throughout.

### Round 2 fixes (based on real-device testing feedback)
- **App icon was still the Capacitor default** — never actually wired in.
  Now generated at every Android density (legacy + adaptive icon with
  proper safe-zone padding) from the gold crown/clock artwork and copied
  into the build automatically. See `android-assets/README.md`.
- **No AM/PM in the time picker** — the old picker was a bare 24-hour
  number field, which is exactly what caused the "picked Friday, got '6
  days'" confusion: it's easy to enter the wrong hour with no AM/PM to
  cross-check against. The editor now has a proper 12-hour stepper (tap
  arrows or type) with an AM/PM toggle, **plus a live "Next rings ... at
  ..." preview** right under the day selector so you can verify the exact
  day and time before saving — no more guessing from a bare countdown
  number.
  - To be clear on timezones: the app was already using the phone's own
    system clock for everything (JavaScript's `Date` always reflects the
    device's local time zone automatically) — install it in Lahore and
    it uses Lahore time, install it in Sydney and it uses Sydney time,
    with no manual timezone setting anywhere. There was no timezone bug;
    the missing AM/PM indicator was the actual problem.
- **Custom gallery song was buried** — it lived inside a collapsed "Audio
  & Vibration" section. It's now its own always-visible card right on the
  main New/Edit Alarm screen, and the alarm's dashboard card shows a
  small 🎵 badge naming whichever tone/song is set.
- **Subtle intentional loading polish** — the dashboard now shows a brief
  skeleton-card placeholder for ~450ms on first open (instead of popping
  instantly), for a more native, settled-in feel. Kept short on purpose.

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
git remote add origin https://github.com/Chakar-Randhawa/CR-Royal-Alarm.git
git push -u origin main
```

If the repo already has commits (e.g. it was created with a README),
pull first: `git pull origin main --allow-unrelated-histories`, resolve
any conflicts, then push.

### Round 3: build reliability fixes
A previous version of this repo caused real build failures. Root causes,
now fixed:
- **Guessed package versions** — `@capacitor/filesystem` and `@capacitor/android`
  had been added to `package.json` with version numbers that were never
  verified against the real npm registry. Both are removed:
  `@capacitor/android` is installed fresh at build time (like the other
  Capacitor native tooling) instead of being pinned, and the custom-song
  feature was rewritten to use the browser's built-in IndexedDB instead of
  the Filesystem plugin — zero extra dependency, zero version risk.
- **A fragile multi-line `sed` command** patched `AndroidManifest.xml` to
  add permissions; multi-line `sed -i '/pattern/a\` blocks are notoriously
  easy to get subtly wrong across shells/sed versions. Replaced with
  `android-assets/patch_manifest.py`, a small, tested Python script that
  does a plain, unambiguous text insertion.
- If you were using a hand-simplified workflow with `npx cap init "Alarmio Pro" "com.alarmio.pro"`
  in it: **remove that line** if you add it back — it silently overwrites
  the correct `capacitor.config.ts` (which already has the right
  `com.crroyal.alarm` / "CR Royal Alarm") with the old placeholder name,
  so the build succeeds but produces a wrongly-branded app. `cap add android`
  alone (no `cap init`) is enough since the config file already exists.

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
- **Overlay / battery / exact-alarm permissions**: fully real — backed by
  the custom native plugin, not simulated.
- **Custom gallery song as alarm tone**: fully real — real file picker,
  real persistent storage, real looping playback.
- **Scanner mission**: UI only (a real camera-based barcode scanner
  needs a native plugin like `@capacitor-community/barcode-scanning`,
  which isn't wired in — the "Simulate Scan" button stands in for it so
  you can still complete the mission and dismiss the alarm).
- **Flashlight-in-scanner-mode toggle**: stored as a preference but not
  wired to an actual flashlight plugin.
