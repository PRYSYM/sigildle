// Wordle-style scoring over a fixed-length sequence of primitive ids.

export type SlotResult = 'correct' | 'present' | 'absent';

export function evaluateGuess(guess: string[], target: string[]): SlotResult[] {
  const n = target.length;
  const result: SlotResult[] = new Array(n).fill('absent');
  const pool: Record<string, number> = {};

  // First pass: exact hits, and tally the rest of the target.
  for (let i = 0; i < n; i++) {
    if (guess[i] === target[i]) {
      result[i] = 'correct';
    } else {
      pool[target[i]] = (pool[target[i]] ?? 0) + 1;
    }
  }
  // Second pass: right symbol, wrong slot — consume from the pool left to right.
  for (let i = 0; i < n; i++) {
    if (result[i] === 'correct') continue;
    const g = guess[i];
    if ((pool[g] ?? 0) > 0) {
      result[i] = 'present';
      pool[g]--;
    }
  }
  return result;
}

export function isWin(result: SlotResult[]): boolean {
  return result.length > 0 && result.every((r) => r === 'correct');
}
