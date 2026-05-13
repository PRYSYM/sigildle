import { describe, it, expect } from 'vitest';
import { Zen } from '../game/zen';
import { PRIMITIVE_IDS } from '../game/primitives';

describe('Zen', () => {
  it('starts with four empty slots', () => {
    const z = new Zen();
    expect(z.count).toBe(4);
    expect(z.filled()).toEqual([]);
  });

  it('places and clears symbols', () => {
    const z = new Zen();
    z.set(0, PRIMITIVE_IDS[2]);
    z.set(3, PRIMITIVE_IDS[5]);
    expect(z.filled()).toEqual([PRIMITIVE_IDS[2], PRIMITIVE_IDS[5]]);
    z.clear(0);
    expect(z.filled()).toEqual([PRIMITIVE_IDS[5]]);
  });

  it('resizes within [2, 8] and keeps existing slots', () => {
    const z = new Zen();
    z.set(1, PRIMITIVE_IDS[0]);
    z.resize(6);
    expect(z.count).toBe(6);
    expect(z.slots[1]).toBe(PRIMITIVE_IDS[0]);
    z.resize(2);
    expect(z.count).toBe(2);
    z.resize(99);
    expect(z.count).toBe(8);
    z.resize(0);
    expect(z.count).toBe(2);
  });

  it('round-trips through encode/decode', () => {
    const z = new Zen();
    z.resize(5);
    z.set(0, PRIMITIVE_IDS[7]);
    z.set(2, PRIMITIVE_IDS[1]);
    z.set(4, PRIMITIVE_IDS[3]);
    const code = z.encode();
    const back = Zen.decode(code);
    expect(back.count).toBe(5);
    expect(back.slots).toEqual(z.slots);
  });

  it('decodes junk safely', () => {
    const z = Zen.decode('9z!');
    expect(z.count).toBeGreaterThanOrEqual(2);
    expect(z.slots.every((s) => s === null || PRIMITIVE_IDS.includes(s))).toBe(true);
  });
});
