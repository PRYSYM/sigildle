import { describe, it, expect } from 'vitest';
import { seededRng, dayNumber } from '../game/rng';
import { targetForSeed, dailyTarget } from '../game/target';
import { PRIMITIVE_IDS } from '../game/primitives';
import { SLOTS } from '../game/config';

describe('seededRng', () => {
  it('is deterministic for the same seed', () => {
    const a = seededRng('hello');
    const b = seededRng('hello');
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('differs across seeds', () => {
    const a = seededRng('seed-a')();
    const b = seededRng('seed-b')();
    expect(a).not.toEqual(b);
  });

  it('stays in [0, 1)', () => {
    const r = seededRng('x');
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('dayNumber', () => {
  it('increases by one across a day', () => {
    const d1 = new Date(2026, 4, 12, 10, 0, 0);
    const d2 = new Date(2026, 4, 13, 10, 0, 0);
    expect(dayNumber(d2) - dayNumber(d1)).toBe(1);
  });
});

describe('targets', () => {
  it('has length SLOTS and only valid primitive ids', () => {
    const t = targetForSeed('sigildle:1234');
    expect(t).toHaveLength(SLOTS);
    for (const id of t) expect(PRIMITIVE_IDS).toContain(id);
  });

  it('is stable for a given day', () => {
    const d = new Date(2026, 4, 12, 9, 0, 0);
    expect(dailyTarget(d)).toEqual(dailyTarget(d));
  });
});
