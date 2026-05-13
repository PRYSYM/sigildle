// Tiny deterministic PRNG: xmur3 to hash a string seed, mulberry32 to stream.
// Same seed -> same sequence, on every device, no server needed.

export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

export function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRng(seed: string): () => number {
  const next = xmur3(seed);
  return mulberry32(next());
}

// Days since the Unix epoch, in the player's local timezone.
export function dayNumber(d: Date = new Date()): number {
  const localMs = d.getTime() - d.getTimezoneOffset() * 60_000;
  return Math.floor(localMs / 86_400_000);
}

export function dailySeed(d: Date = new Date()): string {
  return `sigildle:${dayNumber(d)}`;
}
