"""
Inserts the <uses-permission> tags this app needs into the freshly
generated android/app/src/main/AndroidManifest.xml.

Run from the repo root during CI, after `npx cap add android`:
    python3 android-assets/patch_manifest.py

Why a plain script instead of sed: a search for "<manifest" followed by
its first ">" finds the end of the opening tag no matter how many lines
or attributes it spans, so this can't be broken by however Capacitor
happens to format that tag in a given version.
"""

path = "android/app/src/main/AndroidManifest.xml"

PERMISSIONS = [
    "android.permission.SCHEDULE_EXACT_ALARM",
    "android.permission.USE_EXACT_ALARM",
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.WAKE_LOCK",
    "android.permission.VIBRATE",
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.ACCESS_NOTIFICATION_POLICY",
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
]


def main():
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    block_lines = [f'    <uses-permission android:name="{p}" />' for p in PERMISSIONS]
    block = "\n".join(block_lines)

    start = content.find("<manifest")
    if start == -1:
        raise SystemExit("patch_manifest.py: could not find <manifest tag")

    insert_at = content.find(">", start)
    if insert_at == -1:
        raise SystemExit("patch_manifest.py: could not find end of <manifest ...> opening tag")
    insert_at += 1

    new_content = content[:insert_at] + "\n" + block + content[insert_at:]

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)

    print("patch_manifest.py: permissions inserted successfully.")
    print(new_content)


if __name__ == "__main__":
    main()
