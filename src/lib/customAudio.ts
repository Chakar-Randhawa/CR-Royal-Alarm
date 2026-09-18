// Custom alarm songs are stored as raw Blobs in IndexedDB — a standard
// browser API available in every Capacitor WebView with no extra native
// plugin (and therefore no plugin-version risk in the build). This is
// what actually persists the song across app restarts; playback later
// creates a fresh blob: object URL from the stored Blob on demand.

const DB_NAME = 'cr_royal_audio_db';
const STORE_NAME = 'custom_audio';
const DB_VERSION = 1;

export interface PickedAudio {
  /** IndexedDB key — store this in the alarm as audio_local_path */
  key: string;
  /** Original file name, for display */
  name: string;
  /** Full duration of the picked file, in seconds */
  duration: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function readAudioDuration(objectUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => resolve(isFinite(audio.duration) ? audio.duration : 0);
    audio.onerror = () => resolve(0);
    audio.src = objectUrl;
  });
}

/**
 * Opens the device's native gallery / file picker (a standard HTML file
 * input — Capacitor's WebView delegates this to the real Android system
 * picker) so the user can choose any song from their phone as an alarm
 * tone. The picked file is saved into IndexedDB so it's never re-requested
 * from the gallery and survives app restarts — nothing leaves the device.
 */
export function pickAudioFile(): Promise<PickedAudio | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.style.display = 'none';

    input.onchange = async () => {
      const file = input.files && input.files[0];
      document.body.removeChild(input);
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const objectUrl = URL.createObjectURL(file);
        const duration = await readAudioDuration(objectUrl);
        URL.revokeObjectURL(objectUrl);

        const key = `song_${Date.now()}`;
        const db = await openDb();
        await new Promise<void>((res, rej) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).put(file, key);
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        });

        resolve({ key, name: file.name, duration });
      } catch (e) {
        console.error('Failed to pick/persist audio file', e);
        resolve(null);
      }
    };

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Looks up a previously picked song by its IndexedDB key and returns a
 * fresh, playable blob: URL for it. Call revokeCustomAudioUrl() with the
 * result once playback stops to free memory.
 */
export async function getCustomAudioUrl(key: string): Promise<string | null> {
  try {
    const db = await openDb();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    if (!blob) return null;
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error('Failed to read custom audio from storage', e);
    return null;
  }
}

export function revokeCustomAudioUrl(url: string | null): void {
  if (url) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // already revoked
    }
  }
}

export async function deleteCustomAudio(key: string | null): Promise<void> {
  if (!key) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // already gone — ignore
  }
}
