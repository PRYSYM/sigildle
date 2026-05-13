import { describe, it, expect } from 'vitest';
import { evaluateGuess, isWin } from '../game/match';

describe('evaluateGuess', () => {
  it('marks an exact match all correct', () => {
    const t = ['dot', 'ring', 'bar', 'arc'];
    expect(evaluateGuess([...t], t)).toEqual(['correct', 'correct', 'correct', 'correct']);
  });

  it('marks fully wrong guess all absent', () => {
    const t = ['dot', 'ring', 'bar', 'arc'];
    expect(evaluateGuess(['cross', 'cross', 'cross', 'cross'], t)).toEqual([
      'absent', 'absent', 'absent', 'absent',
    ]);
  });

  it('marks wrong-slot symbols present', () => {
    // target dot,ring,bar,arc ; guess ring,dot,arc,bar -> all present
    expect(evaluateGuess(['ring', 'dot', 'arc', 'bar'], ['dot', 'ring', 'bar', 'arc'])).toEqual([
      'present', 'present', 'present', 'present',
    ]);
  });

  it('does not over-credit duplicates beyond what the target holds', () => {
    // target has one "dot"; guess has three dots, one in place.
    const r = evaluateGuess(['dot', 'dot', 'dot', 'ring'], ['dot', 'bar', 'cross', 'ring']);
    expect(r).toEqual(['correct', 'absent', 'absent', 'correct']);
  });

  it('credits a duplicate as present when the in-place copy is elsewhere', () => {
    // target: dot at 0 and 2 ; guess: dot at 1 and 2 -> idx2 correct, idx1 present
    const r = evaluateGuess(['ring', 'dot', 'dot', 'bar'], ['dot', 'ring', 'dot', 'cross']);
    expect(r).toEqual(['present', 'present', 'correct', 'absent']);
  });
});

describe('isWin', () => {
  it('true only when every slot is correct', () => {
    expect(isWin(['correct', 'correct', 'correct', 'correct'])).toBe(true);
    expect(isWin(['correct', 'present', 'correct', 'correct'])).toBe(false);
    expect(isWin([])).toBe(false);
  });
});
