import type { VibrationPattern } from '@/types';

let currentOscillator: OscillatorNode | null = null;
let currentGain: GainNode | null = null;
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let crescendoTimer: ReturnType<typeof setInterval> | null = null;
let fadeOutTimer: ReturnType<typeof setInterval> | null = null;
let toneChangeInterval: ReturnType<typeof setInterval> | null = null;

let customAudioEl: HTMLAudioElement | null = null;
let customAudioSourceNode: MediaElementAudioSourceNode | null = null;
let customAudioLoopHandler: (() => void) | null = null;

const toneFrequencies: Record<string, number[]> = {
  tone_1: [523.25, 659.25, 783.99],
  tone_2: [440, 554.37, 659.25],
  tone_3: [392, 493.88, 587.33],
  tone_4: [349.23, 440, 523.25],
  tone_5: [293.66, 369.99, 440],
  tone_6: [523.25, 587.33, 659.25, 698.46],
};

function ensureAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function ensureAnalyser(ctx: AudioContext): AnalyserNode {
  if (!analyser || analyser.context !== ctx) {
    analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.75;
  }
  return analyser;
}

/**
 * Real-time frequency data (0-255 per bin) driving the ringing screen's
 * equalizer visualizer. Returns null when nothing is playing yet.
 */
export function getAnalyserData(): Uint8Array | null {
  if (!analyser) return null;
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  return data;
}

export function playAlarmTone(
  toneId: string,
  volume: number = 1.0,
  crescendo: string = 'off',
  vibrateOverride: boolean = false
): void {
  stopAlarmTone();

  const ctx = ensureAudioContext();
  const freqs = toneFrequencies[toneId] || toneFrequencies.tone_1;
  const analyserNode = ensureAnalyser(ctx);

  currentGain = ctx.createGain();
  const startVolume = crescendo !== 'off' ? Math.max(0.05, 0.1 * volume) : volume;
  currentGain.gain.value = startVolume;
  currentGain.connect(analyserNode);
  analyserNode.connect(ctx.destination);

  currentOscillator = ctx.createOscillator();
  currentOscillator.type = 'sine';
  currentOscillator.frequency.value = freqs[0];
  currentOscillator.connect(currentGain);
  currentOscillator.start();

  let freqIndex = 0;
  toneChangeInterval = setInterval(() => {
    if (currentOscillator && ctx) {
      freqIndex = (freqIndex + 1) % freqs.length;
      currentOscillator.frequency.setValueAtTime(freqs[freqIndex], ctx.currentTime);
    }
  }, 800);

  if (crescendo !== 'off') {
    const durationMs = parseInt(crescendo, 10) * 1000;
    const steps = Math.max(1, durationMs / 200);
    const volumeStep = (volume - startVolume) / steps;
    let stepCount = 0;
    crescendoTimer = setInterval(() => {
      stepCount++;
      if (currentGain && ctx) {
        const newVol = Math.min(startVolume + volumeStep * stepCount, volume);
        currentGain.gain.setValueAtTime(newVol, ctx.currentTime);
      }
      if (stepCount >= steps && crescendoTimer) {
        clearInterval(crescendoTimer);
        crescendoTimer = null;
      }
    }, 200);
  }

  if (vibrateOverride && currentGain) {
    currentGain.gain.value = Math.min(currentGain.gain.value * 1.5, 1.0);
  }
}

export function stopAlarmTone(): void {
  if (crescendoTimer) {
    clearInterval(crescendoTimer);
    crescendoTimer = null;
  }
  if (fadeOutTimer) {
    clearInterval(fadeOutTimer);
    fadeOutTimer = null;
  }
  if (toneChangeInterval) {
    clearInterval(toneChangeInterval);
    toneChangeInterval = null;
  }
  if (currentOscillator) {
    try {
      currentOscillator.stop();
    } catch {
      // already stopped
    }
    currentOscillator.disconnect();
    currentOscillator = null;
  }
  if (currentGain) {
    currentGain.disconnect();
    currentGain = null;
  }
}

/**
 * Plays a user-picked song, looping only the first `clipLength` seconds of
 * it (so a 3-minute song can still be used as a short, repeating alarm
 * clip) until stopCustomAudio() is called.
 */
export function playCustomAudio(
  uri: string,
  clipLength: number,
  volume: number = 1.0,
  crescendo: string = 'off'
): void {
  stopCustomAudio();
  stopAlarmTone();

  const ctx = ensureAudioContext();
  const analyserNode = ensureAnalyser(ctx);

  customAudioEl = new Audio(uri);
  customAudioEl.crossOrigin = 'anonymous';
  customAudioEl.loop = false;

  currentGain = ctx.createGain();
  const startVolume = crescendo !== 'off' ? Math.max(0.05, 0.1 * volume) : volume;
  currentGain.gain.value = startVolume;
  currentGain.connect(analyserNode);
  analyserNode.connect(ctx.destination);

  try {
    customAudioSourceNode = ctx.createMediaElementSource(customAudioEl);
    customAudioSourceNode.connect(currentGain);
  } catch (e) {
    console.error('Failed to route custom audio through Web Audio graph', e);
  }

  const safeClipLength = clipLength > 0 ? clipLength : 30;
  customAudioLoopHandler = () => {
    if (customAudioEl && customAudioEl.currentTime >= safeClipLength) {
      customAudioEl.currentTime = 0;
      customAudioEl.play().catch(() => {});
    }
  };
  customAudioEl.addEventListener('timeupdate', customAudioLoopHandler);
  customAudioEl.addEventListener('ended', () => {
    if (customAudioEl) {
      customAudioEl.currentTime = 0;
      customAudioEl.play().catch(() => {});
    }
  });

  customAudioEl.play().catch((e) => console.error('Custom audio playback blocked', e));

  if (crescendo !== 'off') {
    const durationMs = parseInt(crescendo, 10) * 1000;
    const steps = Math.max(1, durationMs / 200);
    const volumeStep = (volume - startVolume) / steps;
    let stepCount = 0;
    crescendoTimer = setInterval(() => {
      stepCount++;
      if (currentGain && ctx) {
        const newVol = Math.min(startVolume + volumeStep * stepCount, volume);
        currentGain.gain.setValueAtTime(newVol, ctx.currentTime);
      }
      if (stepCount >= steps && crescendoTimer) {
        clearInterval(crescendoTimer);
        crescendoTimer = null;
      }
    }, 200);
  }
}

export function stopCustomAudio(): void {
  if (customAudioEl) {
    if (customAudioLoopHandler) {
      customAudioEl.removeEventListener('timeupdate', customAudioLoopHandler);
      customAudioLoopHandler = null;
    }
    customAudioEl.pause();
    customAudioEl.currentTime = 0;
    customAudioEl = null;
  }
  if (customAudioSourceNode) {
    customAudioSourceNode.disconnect();
    customAudioSourceNode = null;
  }
  if (currentGain) {
    currentGain.disconnect();
    currentGain = null;
  }
  if (crescendoTimer) {
    clearInterval(crescendoTimer);
    crescendoTimer = null;
  }
}

export function startFadeOut(duration: string): void {
  const ms = duration === '5min' ? 300000 : duration === '10min' ? 600000 : 900000;
  const steps = ms / 200;
  const startVal = currentGain?.gain.value ?? 1;
  const step = startVal / steps;
  let count = 0;
  fadeOutTimer = setInterval(() => {
    count++;
    if (currentGain && audioContext) {
      const newVol = Math.max(startVal - step * count, 0);
      currentGain.gain.setValueAtTime(newVol, audioContext.currentTime);
    }
    if (count >= steps) {
      stopAlarmTone();
      stopCustomAudio();
    }
  }, 200);
}

const VIBRATION_PATTERNS: Record<Exclude<VibrationPattern, 'none'>, number[]> = {
  continuous: [400, 200],
  heartbeat: [100, 50, 100, 600],
  rapid: [80, 80],
  sos: [100, 50, 100, 50, 100, 200, 300, 50, 300, 50, 300, 600],
};

export function vibratePattern(pattern: VibrationPattern): ReturnType<typeof setInterval> | null {
  if (pattern === 'none' || !('vibrate' in navigator)) return null;

  const p = VIBRATION_PATTERNS[pattern] || VIBRATION_PATTERNS.continuous;
  const cycleDuration = p.reduce((a, b) => a + b, 0) || 400;

  navigator.vibrate(p);
  return setInterval(() => navigator.vibrate(p), cycleDuration);
}

export function stopVibration(timer: ReturnType<typeof setInterval> | null): void {
  if (timer) clearInterval(timer);
  if ('vibrate' in navigator) navigator.vibrate(0);
}

export function speakBriefing(): void {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    const greetings = [
      'Good morning! Here is your daily briefing.',
      'Rise and shine! Time to start your day.',
      'Hello! Hope you slept well.',
    ];
    const quotes = [
      'Today is a great day to accomplish something meaningful.',
      'Every morning is a chance to begin again.',
      'The secret of getting ahead is getting started.',
      'Believe you can and you are halfway there.',
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    const text = `${greeting} The time is ${timeStr}, ${dateStr}. ${quote}`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    synth.speak(utterance);
  } catch {
    // speech synthesis not available, fail silently
  }
}
