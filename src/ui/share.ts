import { MAX_ATTEMPTS, PUZZLE_EPOCH_DAY, SITE_URL } from '../game/config';
import { dayNumber } from '../game/rng';
import type { SlotResult } from '../game/match';

const EMOJI: Record<SlotResult, string> = {
  correct: '🟪', // sigil violet
  present: '🟨',
  absent: '⬛',
};

export function resultsToEmoji(rows: SlotResult[][]): string {
  return rows.map((r) => r.map((s) => EMOJI[s]).join('')).join('\n');
}

export function puzzleNumber(d: Date = new Date()): number {
  return dayNumber(d) - PUZZLE_EPOCH_DAY;
}

export function fmtDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  return `${m}:${String(total % 60).padStart(2, '0')}`;
}

export function shareText(
  rows: SlotResult[][],
  won: boolean,
  d: Date = new Date(),
  solveMs = 0,
): string {
  const score = won ? `${rows.length}/${MAX_ATTEMPTS}` : `X/${MAX_ATTEMPTS}`;
  const time = won && solveMs > 0 ? ` ⏱${fmtDuration(solveMs)}` : '';
  return `Sigildle #${puzzleNumber(d)} ${score}${time}\n\n${resultsToEmoji(rows)}\n\n${SITE_URL}`;
}

// Prefilled compose windows — work with no auth flow, just open and post.
export function tweetUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function blueskyUrl(text: string): string {
  return `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`;
}
