import { MAX_ATTEMPTS } from '../game/config';

export type Status = 'playing' | 'won' | 'lost';

export interface Progress {
  lastDay: number;          // day index of the puzzle the saved state belongs to
  guesses: string[][];      // submitted guesses for that day
  status: Status;
  firstPickAt: number;      // epoch ms of the first symbol placed today (0 = not started)
  solveMs: number;          // time from first pick to a win (0 = unsolved)
  lastCountedDay: number;   // day index already folded into the stats below
  streak: number;
  maxStreak: number;
  played: number;
  wins: number;
  distribution: number[];   // [guessesUsed-1] -> count, length MAX_ATTEMPTS
}

const KEY = 'sigildle:v1';
const PRACTICE_KEY = 'sigildle:practice:v1';

export function defaultProgress(): Progress {
  return {
    lastDay: -1,
    guesses: [],
    status: 'playing',
    firstPickAt: 0,
    solveMs: 0,
    lastCountedDay: -1,
    streak: 0,
    maxStreak: 0,
    played: 0,
    wins: 0,
    distribution: new Array(MAX_ATTEMPTS).fill(0),
  };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    const base = defaultProgress();
    return {
      ...base,
      ...parsed,
      guesses: Array.isArray(parsed.guesses) ? parsed.guesses : base.guesses,
      distribution:
        Array.isArray(parsed.distribution) && parsed.distribution.length === MAX_ATTEMPTS
          ? parsed.distribution
          : base.distribution,
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable — play on without persistence */
  }
}

/** Highest practice level the player has ever cleared (0 = none). */
export function loadPracticeBest(): number {
  try {
    return Number(localStorage.getItem(PRACTICE_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function savePracticeBest(clearedLevel: number): void {
  try {
    if (clearedLevel > loadPracticeBest()) {
      localStorage.setItem(PRACTICE_KEY, String(clearedLevel));
    }
  } catch {
    /* ignore */
  }
}
