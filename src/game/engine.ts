import { MAX_ATTEMPTS, SLOTS } from './config';
import { evaluateGuess, isWin, type SlotResult } from './match';
import { dayNumber } from './rng';
import { dailyTarget, randomTarget } from './target';
import {
  defaultProgress,
  loadProgress,
  saveProgress,
  type Progress,
  type Status,
} from '../state/storage';

// Orchestrates one round: the secret, the in-progress draft, submitted guesses,
// and (daily only) persisted stats. Two flavors via static factories:
//   Engine.daily()       — seeded-by-date, resumes from localStorage, tracks stats
//   Engine.practice(lvl)  — fresh random sigil, scaling difficulty, no persistence

export type Mode = 'daily' | 'practice';

/** Practice difficulty: L1 = 3 symbols, L2 = 4, L3 = 5, L4+ = 6. */
export function practiceSlots(level: number): number {
  return Math.min(3 + Math.max(0, level - 1), 6);
}

interface EngineInit {
  mode: Mode;
  slots: number;
  maxAttempts: number;
  target: string[];
  day: number;
  level: number;
  progress: Progress;
}

export class Engine {
  readonly mode: Mode;
  readonly slots: number;
  readonly maxAttempts: number;
  readonly target: string[];
  readonly day: number; // daily mode only
  readonly level: number; // practice mode only (>= 1)
  draft: (string | null)[];
  guesses: string[][] = [];
  results: SlotResult[][] = [];
  status: Status = 'playing';
  /** True only on the submit that ended the round (for UI side effects). */
  justFinished = false;
  /** Daily mode: persisted progress. Practice mode: a throwaway object. */
  progress: Progress;

  private constructor(init: EngineInit) {
    this.mode = init.mode;
    this.slots = init.slots;
    this.maxAttempts = init.maxAttempts;
    this.target = init.target;
    this.day = init.day;
    this.level = init.level;
    this.progress = init.progress;
    this.draft = new Array(this.slots).fill(null);
  }

  static daily(now: Date = new Date()): Engine {
    const day = dayNumber(now);
    const e = new Engine({
      mode: 'daily',
      slots: SLOTS,
      maxAttempts: MAX_ATTEMPTS,
      target: dailyTarget(now),
      day,
      level: 0,
      progress: loadProgress(),
    });
    if (e.progress.lastDay === day) {
      e.guesses = e.progress.guesses.map((g) => [...g]);
      e.results = e.guesses.map((g) => evaluateGuess(g, e.target));
      e.status = e.progress.status;
    } else {
      e.progress.lastDay = day;
      e.progress.guesses = [];
      e.progress.status = 'playing';
      saveProgress(e.progress);
    }
    return e;
  }

  static practice(level: number): Engine {
    const lv = Math.max(1, Math.floor(level));
    const slots = practiceSlots(lv);
    return new Engine({
      mode: 'practice',
      slots,
      maxAttempts: slots + 2,
      target: randomTarget(slots, lv >= 3), // repeats allowed from L3
      day: 0,
      level: lv,
      progress: defaultProgress(),
    });
  }

  get attemptsLeft(): number {
    return this.maxAttempts - this.guesses.length;
  }

  get draftComplete(): boolean {
    return this.draft.every((x) => x !== null);
  }

  get tries(): number {
    return this.guesses.length;
  }

  /** Time from first symbol placed to a win, in ms (0 if not solved). */
  get solveMs(): number {
    return this.progress.solveMs;
  }

  pick(slot: number, primId: string): void {
    if (this.status !== 'playing' || slot < 0 || slot >= this.slots) return;
    this.draft[slot] = primId;
    if (this.mode === 'daily' && this.progress.firstPickAt === 0) {
      this.progress.firstPickAt = Date.now();
      saveProgress(this.progress);
    }
  }

  clearSlot(slot: number): void {
    if (this.status !== 'playing' || slot < 0 || slot >= this.slots) return;
    this.draft[slot] = null;
  }

  submit(): SlotResult[] | null {
    this.justFinished = false;
    if (this.status !== 'playing' || !this.draftComplete) return null;

    const guess = this.draft.slice() as string[];
    const res = evaluateGuess(guess, this.target);
    this.guesses.push(guess);
    this.results.push(res);
    this.draft = new Array(this.slots).fill(null);

    if (isWin(res)) this.status = 'won';
    else if (this.guesses.length >= this.maxAttempts) this.status = 'lost';

    if (this.status !== 'playing') {
      this.justFinished = true;
      if (this.mode === 'daily') {
        if (this.status === 'won' && this.progress.firstPickAt > 0 && this.progress.solveMs === 0) {
          this.progress.solveMs = Date.now() - this.progress.firstPickAt;
        }
        this.countResult();
      }
    }
    if (this.mode === 'daily') this.persist();
    return res;
  }

  private countResult(): void {
    const p = this.progress;
    if (p.lastCountedDay === this.day) return;
    const prevCounted = p.lastCountedDay;
    p.played++;
    if (this.status === 'won') {
      p.wins++;
      p.distribution[this.guesses.length - 1]++;
      p.streak = prevCounted === this.day - 1 ? p.streak + 1 : 1;
    } else {
      p.streak = 0;
    }
    p.maxStreak = Math.max(p.maxStreak, p.streak);
    p.lastCountedDay = this.day;
  }

  private persist(): void {
    const p = this.progress;
    p.lastDay = this.day;
    p.guesses = this.guesses.map((g) => [...g]);
    p.status = this.status;
    saveProgress(p);
  }
}
