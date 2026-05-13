// Tiny Web Audio synth — no asset files, stays static and ~0 bytes of payload.
// The AudioContext is created lazily inside a user gesture (browser requirement).

const MUTE_KEY = 'sigildle:mute';

let ctx: AudioContext | null = null;
let enabled = true;

export function initSound(): void {
  try {
    enabled = localStorage.getItem(MUTE_KEY) !== '1';
  } catch {
    /* default on */
  }
}

export function isSoundOn(): boolean {
  return enabled;
}

export function toggleSound(): boolean {
  enabled = !enabled;
  try {
    localStorage.setItem(MUTE_KEY, enabled ? '0' : '1');
  } catch {
    /* ignore */
  }
  if (enabled) tone(660, 0.06, 'sine', 0, 0.05);
  return enabled;
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = 'square',
  when = 0,
  gain = 0.06,
): void {
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  place: () => tone(880, 0.05, 'square', 0, 0.05),
  back: () => tone(300, 0.07, 'square', 0, 0.05),
  tile: (i: number) => tone(440 + i * 90, 0.06, 'triangle', 0, 0.045),
  win: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.18, 'triangle', i * 0.09, 0.06)),
  lose: () => {
    tone(330, 0.18, 'sawtooth', 0, 0.045);
    tone(247, 0.3, 'sawtooth', 0.12, 0.045);
  },
  ui: () => tone(660, 0.04, 'sine', 0, 0.04),
};
