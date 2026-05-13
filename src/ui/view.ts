import { PRIMITIVES, primitiveById } from '../game/primitives';
import { loadPracticeBest } from '../state/storage';
import type { Engine } from '../game/engine';
import type { Zen } from '../game/zen';
import { blueskyUrl, fmtDuration, puzzleNumber, shareText, tweetUrl } from './share';

export type Screen = 'daily' | 'practice' | 'zen';

// Pure HTML builders. The whole #app is re-rendered on every action; clicks are
// handled by delegation on data-act attributes (see main.ts).

function glyph(primId: string | null, extra = ''): string {
  if (!primId) return '';
  return `<svg viewBox="0 0 100 100" class="glyph ${extra}" aria-hidden="true">${primitiveById(primId).svg}</svg>`;
}

function layered(ids: string[], extra = ''): string {
  return `<svg viewBox="0 0 100 100" class="glyph ${extra}" aria-hidden="true">${ids
    .map((id) => primitiveById(id).svg)
    .join('')}</svg>`;
}

function cell(primId: string | null, cls = '', attrs = ''): string {
  return `<div class="cell ${cls}" ${attrs}>${glyph(primId)}</div>`;
}

export function modeBarHtml(screen: Screen, engine: Engine): string {
  const tab = (s: Screen, label: string) =>
    `<button class="tab ${screen === s ? 'on' : ''}" data-act="mode" data-mode="${s}">${label}</button>`;
  const sub =
    screen === 'practice'
      ? `<p class="mode-sub">Level ${engine.level} · ${engine.slots} symbols · ${engine.maxAttempts} tries</p>`
      : '';
  return `<div class="modebar">${tab('daily', 'Daily')}${tab('practice', 'Practice')}${tab('zen', 'Zen')}</div>${sub}`;
}

export function boardHtml(engine: Engine, selectedSlot: number, revealRow: number | null): string {
  const rows: string[] = [];

  for (let r = 0; r < engine.guesses.length; r++) {
    const g = engine.guesses[r];
    const res = engine.results[r];
    if (r === revealRow) {
      // Rendered color-less; main.ts adds the result class mid-flip.
      rows.push(
        `<div class="row" data-row="${r}">${g
          .map((p, i) => cell(p, 'pending', `data-reveal="${res[i]}"`))
          .join('')}</div>`,
      );
    } else {
      rows.push(`<div class="row" data-row="${r}">${g.map((p, i) => cell(p, res[i])).join('')}</div>`);
    }
  }

  if (engine.status === 'playing') {
    rows.push(
      `<div class="row draft">${engine.draft
        .map((p, i) => cell(p, i === selectedSlot ? 'sel' : '', `data-act="slot" data-slot="${i}"`))
        .join('')}</div>`,
    );
  }

  const used = engine.guesses.length + (engine.status === 'playing' ? 1 : 0);
  for (let r = used; r < engine.maxAttempts; r++) {
    rows.push(`<div class="row">${Array.from({ length: engine.slots }, () => cell(null)).join('')}</div>`);
  }

  return `<div class="board">${rows.join('')}</div>`;
}

export function previewHtml(engine: Engine): string {
  return `<div class="preview">${layered(
    engine.draft.filter((p): p is string => p !== null),
    'big',
  )}</div>`;
}

export function paletteHtml(): string {
  return `<div class="palette">${PRIMITIVES.map(
    (p, i) =>
      `<button class="prim" data-act="prim" data-id="${p.id}" title="${p.name} (${i + 1})" aria-label="${p.name}">${glyph(
        p.id,
      )}<span class="key">${i + 1}</span></button>`,
  ).join('')}</div>`;
}

export function actionsHtml(engine: Engine): string {
  const canForge = engine.status === 'playing' && engine.draftComplete;
  return `<div class="actions">
    <button class="btn" data-act="backspace">⌫ Backspace</button>
    <button class="btn primary" data-act="submit" ${canForge ? '' : 'disabled'}>Forge</button>
  </div>`;
}

function answerHtml(engine: Engine): string {
  return `<div class="answer">${engine.target.map((p) => glyph(p)).join('')}</div>`;
}

function shareHtml(engine: Engine): string {
  const text = shareText(engine.results, engine.status === 'won', new Date(), engine.solveMs);
  const canNative =
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    window.matchMedia('(pointer: coarse)').matches;
  const native = canNative ? `<button class="btn" data-act="native-share">Share…</button>` : '';
  return `<div class="share">
    <div class="actions">
      <button class="btn primary" data-act="copy">Copy result</button>
      ${native}
    </div>
    <div class="share-links">
      <a class="btn small" href="${tweetUrl(text)}" target="_blank" rel="noopener noreferrer">Post on 𝕏</a>
      <a class="btn small" href="${blueskyUrl(text)}" target="_blank" rel="noopener noreferrer">Bluesky</a>
    </div>
  </div>`;
}

export function endHtml(engine: Engine): string {
  const won = engine.status === 'won';

  if (engine.mode === 'practice') {
    const best = loadPracticeBest();
    return `<div class="end">
      <p class="end-msg">${won ? `Level ${engine.level} cleared.` : 'Out of tries.'}</p>
      ${won ? '' : `<p class="end-sub">The sigil</p>${answerHtml(engine)}`}
      ${best ? `<p class="best">Best cleared: level ${best}</p>` : ''}
      <div class="actions"><button class="btn primary" data-act="next">${won ? 'Next level' : 'Try again'}</button></div>
    </div>`;
  }

  const trophy = won
    ? `<div class="trophy">
        ${layered(engine.target, 'trophy-glyph')}
        <p class="trophy-line">Sigildle #${puzzleNumber()} · ${engine.tries}/${engine.maxAttempts}${
          engine.solveMs > 0 ? ` · ⏱${fmtDuration(engine.solveMs)}` : ''
        }</p>
      </div>`
    : `<p class="end-msg">Out of tries.</p><p class="end-sub">Today's sigil</p>${answerHtml(engine)}`;

  return `<div class="end">
    ${trophy}
    ${shareHtml(engine)}
    <p class="countdown" id="countdown" aria-live="polite"></p>
  </div>`;
}

export function zenHtml(zen: Zen, selectedSlot: number): string {
  const cells = zen.slots
    .map((p, i) => cell(p, i === selectedSlot ? 'sel' : '', `data-act="slot" data-slot="${i}"`))
    .join('');
  return `<div class="zen">
    <div class="zen-stage">${layered(zen.filled(), 'zen-glyph')}</div>
    <div class="row draft">${cells}</div>
    <div class="actions">
      <button class="btn small" data-act="zen-sub" ${zen.count <= 2 ? 'disabled' : ''}>− slot</button>
      <button class="btn small" data-act="zen-add" ${zen.count >= 8 ? 'disabled' : ''}>+ slot</button>
      <button class="btn small" data-act="zen-clear">Clear all</button>
    </div>
    ${paletteHtml()}
    <div class="actions">
      <button class="btn primary" data-act="zen-link">Copy link</button>
      <button class="btn small" data-act="zen-png">PNG</button>
      <button class="btn small" data-act="zen-svg">SVG</button>
    </div>
    <p class="mode-sub">Forge a sigil for the fun of it. The link reopens exactly this one.</p>
  </div>`;
}

export function statsHtml(engine: Engine): string {
  const p = engine.progress;
  const winPct = p.played ? Math.round((p.wins / p.played) * 100) : 0;
  const max = Math.max(1, ...p.distribution);
  const highlight = engine.mode === 'daily' && engine.status === 'won' ? engine.tries - 1 : -1;
  const bars = p.distribution
    .map((n, i) => {
      const w = Math.round((n / max) * 100);
      return `<div class="dist-row"><span class="dist-i">${i + 1}</span><div class="dist-bar ${
        i === highlight ? 'hi' : ''
      }" style="width:${Math.max(w, n ? 8 : 4)}%">${n}</div></div>`;
    })
    .join('');
  const todayTime =
    engine.mode === 'daily' && p.solveMs > 0 ? `<p class="best">Today solved in ${fmtDuration(p.solveMs)}</p>` : '';
  return `<div class="stat-grid">
      <div><b>${p.played}</b><span>Played</span></div>
      <div><b>${winPct}</b><span>Win %</span></div>
      <div><b>${p.streak}</b><span>Streak</span></div>
      <div><b>${p.maxStreak}</b><span>Max</span></div>
    </div>
    ${todayTime}
    <h3>Guess distribution</h3>
    <div class="dist">${bars}</div>`;
}
