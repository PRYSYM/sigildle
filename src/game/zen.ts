import { PRIMITIVE_IDS } from './primitives';

// Zen / creative mode: a free-compose sigil with no win condition. Serializes to
// a tiny string (one char per slot — primitive index, or '-' for empty) so a URL
// hash like #z=3-05 reopens exactly this sigil.

const MIN_SLOTS = 2;
const MAX_SLOTS = 8;
const EMPTY = '-';

export class Zen {
  slots: (string | null)[];

  constructor(slots?: (string | null)[]) {
    this.slots =
      slots && slots.length >= MIN_SLOTS ? slots.slice(0, MAX_SLOTS) : [null, null, null, null];
  }

  get count(): number {
    return this.slots.length;
  }

  set(i: number, primId: string): void {
    if (i >= 0 && i < this.slots.length) this.slots[i] = primId;
  }

  clear(i: number): void {
    if (i >= 0 && i < this.slots.length) this.slots[i] = null;
  }

  clearAll(): void {
    this.slots = this.slots.map(() => null);
  }

  resize(n: number): void {
    const target = Math.max(MIN_SLOTS, Math.min(MAX_SLOTS, Math.floor(n)));
    if (target > this.slots.length) {
      while (this.slots.length < target) this.slots.push(null);
    } else {
      this.slots.length = target;
    }
  }

  filled(): string[] {
    return this.slots.filter((s): s is string => s !== null);
  }

  encode(): string {
    return this.slots.map((id) => (id === null ? EMPTY : String(PRIMITIVE_IDS.indexOf(id)))).join('');
  }

  static decode(s: string): Zen {
    const slots = (s || '')
      .split('')
      .slice(0, MAX_SLOTS)
      .map((ch) => {
        if (ch === EMPTY) return null;
        const n = Number(ch);
        return Number.isInteger(n) && n >= 0 && n < PRIMITIVE_IDS.length ? PRIMITIVE_IDS[n] : null;
      });
    return new Zen(slots.length >= MIN_SLOTS ? slots : undefined);
  }
}
