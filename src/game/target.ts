import { SLOTS } from './config';
import { PRIMITIVE_IDS } from './primitives';
import { dailySeed, seededRng } from './rng';

// Today's sigil: SLOTS primitives, repeats allowed, fully determined by the seed.
export function targetForSeed(seed: string): string[] {
  const rng = seededRng(seed);
  const out: string[] = [];
  for (let i = 0; i < SLOTS; i++) {
    out.push(PRIMITIVE_IDS[Math.floor(rng() * PRIMITIVE_IDS.length)]);
  }
  return out;
}

export function dailyTarget(d: Date = new Date()): string[] {
  return targetForSeed(dailySeed(d));
}

// Practice sigils are not seeded — a fresh draw each round.
export function randomTarget(slots: number, allowRepeats: boolean): string[] {
  if (allowRepeats) {
    return Array.from(
      { length: slots },
      () => PRIMITIVE_IDS[Math.floor(Math.random() * PRIMITIVE_IDS.length)],
    );
  }
  const pool = [...PRIMITIVE_IDS];
  const out: string[] = [];
  for (let i = 0; i < slots && pool.length > 0; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}
