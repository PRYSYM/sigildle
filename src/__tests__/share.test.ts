import { describe, it, expect } from 'vitest';
import { resultsToEmoji, shareText, puzzleNumber, tweetUrl, blueskyUrl, fmtDuration } from '../ui/share';

describe('resultsToEmoji', () => {
  it('maps slot results to a grid', () => {
    const grid = resultsToEmoji([
      ['correct', 'present', 'absent', 'absent'],
      ['correct', 'correct', 'correct', 'correct'],
    ]);
    expect(grid).toBe('🟪🟨⬛⬛\n🟪🟪🟪🟪');
  });
});

describe('shareText', () => {
  it('includes the puzzle number and score on a win', () => {
    const d = new Date(2026, 4, 14, 12, 0, 0);
    const text = shareText(
      [
        ['absent', 'absent', 'absent', 'absent'],
        ['correct', 'correct', 'correct', 'correct'],
      ],
      true,
      d,
    );
    expect(text.startsWith(`Sigildle #${puzzleNumber(d)} 2/6`)).toBe(true);
    expect(text).toContain('🟪🟪🟪🟪');
  });

  it('shows X/6 on a loss', () => {
    const d = new Date(2026, 4, 14, 12, 0, 0);
    const rows = Array.from({ length: 6 }, () => ['absent', 'absent', 'absent', 'absent'] as const);
    const text = shareText(rows.map((r) => [...r]), false, d);
    expect(text).toContain('X/6');
  });
});

describe('fmtDuration', () => {
  it('formats m:ss', () => {
    expect(fmtDuration(0)).toBe('0:00');
    expect(fmtDuration(9_000)).toBe('0:09');
    expect(fmtDuration(134_000)).toBe('2:14');
    expect(fmtDuration(-5)).toBe('0:00');
  });
});

describe('shareText with a solve time', () => {
  it('appends the stopwatch only on a timed win', () => {
    const d = new Date(2026, 4, 14, 12, 0, 0);
    const win = [['correct', 'correct', 'correct', 'correct']] as const;
    expect(shareText(win.map((r) => [...r]), true, d, 134_000)).toContain('⏱2:14');
    expect(shareText(win.map((r) => [...r]), true, d, 0)).not.toContain('⏱');
  });
});

describe('intent urls', () => {
  it('build prefilled compose links with the text encoded', () => {
    const text = 'Sigildle #1 2/6\n\n🟪🟪🟪🟪';
    expect(tweetUrl(text)).toBe(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    );
    expect(blueskyUrl(text)).toBe(
      `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`,
    );
  });
});
