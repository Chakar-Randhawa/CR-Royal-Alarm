import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface PickedAudio {
  /** Playable URI (Capacitor-converted file:// URI, or a blob: URL on web) */
  uri: string;
  /** Original file name, for display */
  name: string;
  /** Full duration of the picked file, in seconds */
  duration: number;
  /** Raw persisted path (Filesystem-relative), used only for later deletion */
  storagePath: string | null;
}

const CUSTOM_AUDIO_DIR = 'cr_royal_custom_audio';

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip the "data:audio/xxx;base64," prefix — Filesystem.writeFile wants raw base64
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readAudioDuration(objectUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      resolve(isFinite(audio.duration) ? audio.duration : 0);
    };
    audio.onerror = () => resolve(0);
    audio.src = objectUrl;
  });
}

/**
 * Opens the device's native gallery / file picker (via a standard HTML file
 * input, which Capacitor's WebView delegates to the real Android/iOS system
 * picker) so the user can choose any song from their phone as an alarm tone.
 * The picked file is copied into the app's private, persistent storage via
 * the Filesystem plugin so it survives app restarts — nothing is uploaded
 * anywhere, it never leaves the device.
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

        if (Capacitor.isNativePlatform()) {
          const base64 = await readFileAsBase64(file);
          const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const path = `${CUSTOM_AUDIO_DIR}/${safeName}`;

          await Filesystem.mkdir({ path: CUSTOM_AUDIO_DIR, directory: Directory.Data, recursive: true }).catch(() => {
            // already exists — fine
          });

          await Filesystem.writeFile({
            path,
            data: base64,
            directory: Directory.Data,
          });

          const uriResult = await Filesystem.getUri({ path, directory: Directory.Data });
          const playableUri = Capacitor.convertFileSrc(uriResult.uri);

          URL.revokeObjectURL(objectUrl);
          resolve({ uri: playableUri, name: file.name, duration, storagePath: path });
        } else {
          // Web preview fallback: no persistent native storage, use the
          // blob URL directly (works for the current session only).
          resolve({ uri: objectUrl, name: file.name, duration, storagePath: null });
        }
      } catch (e) {
        console.error('Failed to pick/persist audio file', e);
        resolve(null);
      }
    };

    document.body.appendChild(input);
    input.click();
  });
}

export async function deleteCustomAudio(storagePath: string | null): Promise<void> {
  if (!storagePath) return;
  try {
    await Filesystem.deleteFile({ path: storagePath, directory: Directory.Data });
  } catch {
    // already gone / not on native platform — ignore
  }
}
