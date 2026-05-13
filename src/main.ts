import './styles.css';
import { Engine } from './game/engine';
import { PRIMITIVES } from './game/primitives';
import { Zen } from './game/zen';
import { loadPracticeBest, savePracticeBest } from './state/storage';
import { shareText } from './ui/share';
import { downloadPng, downloadSvg } from './ui/export';
import { initSound, isSoundOn, sfx, toggleSound } from './ui/sound';
import {
  actionsHtml,
  boardHtml,
  endHtml,
  modeBarHtml,
  paletteHtml,
  previewHtml,
  statsHtml,
  zenHtml,
  type Screen,
} from './ui/view';

let screen: Screen = 'daily';
let engine = Engine.daily();
let zen = new Zen();
let selectedSlot = 0;
let revealRow: number | null = null; // row currently being flipped open
let locked = false; // input disabled during reveal
let countdownTimer: number | undefined;

const app = document.getElementById('app')!;
const helpDialog = document.getElementById('help') as HTMLDialogElement;
const statsDialog = document.getElementById('stats') as HTMLDialogElement;
const statsBody = document.getElementById('stats-body')!;
const muteBtn = document.getElementById('mute-btn')!;

const STEP_MS = 230; // delay between consecutive tile flips
const FLIP_MS = 480; // duration of one tile flip (keep in sync with CSS)
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const slotCount = () => (screen === 'zen' ? zen.count : engine.slots);
const slotAt = (i: number) => (screen === 'zen' ? zen.slots[i] : engine.draft[i]);

// --- rendering --------------------------------------------------------------

function nextEmptySlot(from: number): number {
  const n = slotCount();
  for (let i = 1; i <= n; i++) {
    const idx = (from + i) % n;
    if (slotAt(idx) === null) return idx;
  }
  return (from + 1) % n;
}

function render(): void {
  if (selectedSlot >= slotCount()) selectedSlot = 0;
  const bar = modeBarHtml(screen, engine);

  if (screen === 'zen') {
    app.innerHTML = bar + zenHtml(zen, selectedSlot);
    syncHash();
    stopCountdown();
    return;
  }

  if (engine.status === 'playing') {
    if (engine.draft[selectedSlot] !== null && !engine.draftComplete) {
      selectedSlot = nextEmptySlot(selectedSlot);
    }
    app.innerHTML =
      bar + boardHtml(engine, selectedSlot, revealRow) + previewHtml(engine) + paletteHtml() + actionsHtml(engine);
    stopCountdown();
  } else {
    app.innerHTML = bar + boardHtml(engine, selectedSlot, revealRow) + endHtml(engine);
    if (engine.mode === 'daily') startCountdown();
    else stopCountdown();
  }
}

function syncHash(): void {
  const target = screen === 'zen' ? `#z=${zen.encode()}` : location.pathname + location.search;
  history.replaceState(null, '', target);
}

// --- reveal animation -------------------------------------------------------

function playReveal(rowIndex: number, done: () => void): void {
  const finish = () => {
    revealRow = null;
    locked = false;
    render();
    if (engine.status === 'won') {
      app.querySelector(`.row[data-row="${rowIndex}"]`)?.classList.add('win');
      sfx.win();
    } else {
      sfx.lose();
    }
    done();
  };

  if (reducedMotion()) {
    finish();
    return;
  }

  locked = true;
  revealRow = rowIndex;
  render(); // the row is drawn color-less; we add result classes mid-flip

  const row = app.querySelector<HTMLElement>(`.row[data-row="${rowIndex}"]`);
  const cells = row ? Array.from(row.querySelectorAll<HTMLElement>('.cell')) : [];
  if (cells.length === 0) {
    finish();
    return;
  }

  cells.forEach((cellEl, i) => {
    setTimeout(() => {
      cellEl.classList.add('flip');
      sfx.tile(i);
      setTimeout(() => {
        const r = cellEl.dataset.reveal;
        if (r) {
          cellEl.classList.remove('pending');
          cellEl.classList.add(r);
        }
      }, FLIP_MS / 2);
    }, i * STEP_MS);
  });

  setTimeout(finish, (cells.length - 1) * STEP_MS + FLIP_MS + 80);
}

// --- actions ----------------------------------------------------------------

function place(primId: string): void {
  if (screen === 'zen') {
    zen.set(selectedSlot, primId);
  } else {
    engine.pick(selectedSlot, primId);
  }
  selectedSlot = nextEmptySlot(selectedSlot);
  sfx.place();
  render();
}

function backspace(): void {
  if (screen === 'zen') {
    if (zen.slots[selectedSlot] !== null) zen.clear(selectedSlot);
    else
      for (let i = zen.count - 1; i >= 0; i--)
        if (zen.slots[i] !== null) {
          zen.clear(i);
          selectedSlot = i;
          break;
        }
  } else {
    if (engine.draft[selectedSlot] !== null) engine.clearSlot(selectedSlot);
    else
      for (let i = engine.slots - 1; i >= 0; i--)
        if (engine.draft[i] !== null) {
          engine.clearSlot(i);
          selectedSlot = i;
          break;
        }
  }
  sfx.back();
  render();
}

function submit(): void {
  if (locked || screen === 'zen' || engine.status !== 'playing') return;
  const before = engine.guesses.length;
  engine.submit();
  if (engine.guesses.length === before) {
    render(); // draft incomplete — nothing committed
    return;
  }
  const rowIdx = engine.guesses.length - 1;
  const finished = engine.justFinished;
  playReveal(rowIdx, () => {
    if (!finished) return;
    if (engine.mode === 'practice' && engine.status === 'won') savePracticeBest(engine.level);
    if (engine.mode === 'daily') setTimeout(openStats, 250);
  });
}

function setScreen(next: Screen): void {
  if (locked || next === screen) return;
  sfx.ui();
  screen = next;
  selectedSlot = 0;
  revealRow = null;
  if (next === 'daily') engine = Engine.daily();
  else if (next === 'practice') engine = Engine.practice(1);
  render();
}

function nextPractice(): void {
  if (locked || screen !== 'practice') return;
  const lvl = engine.status === 'won' ? engine.level + 1 : engine.level;
  engine = Engine.practice(lvl);
  selectedSlot = 0;
  revealRow = null;
  sfx.ui();
  render();
}

function openStats(): void {
  statsBody.innerHTML = statsHtml(engine);
  if (screen === 'practice') {
    const best = loadPracticeBest();
    statsBody.innerHTML += `<h3>Practice</h3><p class="best">Best level cleared: ${best || '—'}</p>`;
  }
  statsDialog.showModal();
}

async function copyResult(): Promise<void> {
  const text = shareText(engine.results, engine.status === 'won', new Date(), engine.solveMs);
  sfx.ui();
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied — paste it anywhere');
  } catch {
    window.prompt('Copy your result:', text);
  }
}

async function nativeShare(): Promise<void> {
  const text = shareText(engine.results, engine.status === 'won', new Date(), engine.solveMs);
  try {
    await navigator.share({ text });
  } catch {
    /* user cancelled or unsupported */
  }
}

async function copyZenLink(): Promise<void> {
  syncHash();
  sfx.ui();
  try {
    await navigator.clipboard.writeText(location.href);
    toast('Link copied — it reopens this sigil');
  } catch {
    window.prompt('Copy this link:', location.href);
  }
}

function toast(msg: string): void {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 1800);
}

// --- countdown to next daily ------------------------------------------------

function msToNextMidnight(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

function startCountdown(): void {
  stopCountdown();
  const pad = (n: number) => String(n).padStart(2, '0');
  const tick = () => {
    const el = document.getElementById('countdown');
    if (!el) return stopCountdown();
    let ms = msToNextMidnight();
    if (ms <= 0) {
      el.textContent = 'New sigil ready — refresh.';
      return stopCountdown();
    }
    const h = Math.floor(ms / 3_600_000);
    ms -= h * 3_600_000;
    const m = Math.floor(ms / 60_000);
    ms -= m * 60_000;
    const s = Math.floor(ms / 1000);
    el.textContent = `Next sigil in ${pad(h)}:${pad(m)}:${pad(s)}`;
  };
  tick();
  countdownTimer = window.setInterval(tick, 1000);
}

function stopCountdown(): void {
  if (countdownTimer !== undefined) {
    clearInterval(countdownTimer);
    countdownTimer = undefined;
  }
}

// --- events -----------------------------------------------------------------

app.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!el) return;
  switch (el.dataset.act) {
    case 'mode':
      setScreen(el.dataset.mode as Screen);
      return;
    case 'next':
      nextPractice();
      return;
    case 'copy':
      void copyResult();
      return;
    case 'native-share':
      void nativeShare();
      return;
    case 'zen-link':
      void copyZenLink();
      return;
    case 'zen-png':
      sfx.ui();
      downloadPng(zen.slots);
      return;
    case 'zen-svg':
      sfx.ui();
      downloadSvg(zen.slots);
      return;
  }
  if (locked) return;
  switch (el.dataset.act) {
    case 'slot':
      selectedSlot = Number(el.dataset.slot);
      render();
      break;
    case 'prim':
      place(el.dataset.id!);
      break;
    case 'backspace':
      backspace();
      break;
    case 'submit':
      submit();
      break;
    case 'zen-add':
      zen.resize(zen.count + 1);
      sfx.place();
      render();
      break;
    case 'zen-sub':
      zen.resize(zen.count - 1);
      if (selectedSlot >= zen.count) selectedSlot = zen.count - 1;
      sfx.back();
      render();
      break;
    case 'zen-clear':
      zen.clearAll();
      sfx.back();
      render();
      break;
  }
});

document.addEventListener('keydown', (e) => {
  if (helpDialog.open || statsDialog.open || locked) return;

  if (screen === 'zen') {
    if (e.key >= '1' && e.key <= String(PRIMITIVES.length)) place(PRIMITIVES[Number(e.key) - 1].id);
    else if (e.key === 'ArrowRight') {
      selectedSlot = (selectedSlot + 1) % zen.count;
      render();
    } else if (e.key === 'ArrowLeft') {
      selectedSlot = (selectedSlot + zen.count - 1) % zen.count;
      render();
    } else if (e.key === 'Backspace' || e.key === 'Delete') backspace();
    return;
  }

  if (engine.status !== 'playing') {
    if (e.key === 'Enter' && engine.mode === 'practice') nextPractice();
    return;
  }
  if (e.key >= '1' && e.key <= String(PRIMITIVES.length)) place(PRIMITIVES[Number(e.key) - 1].id);
  else if (e.key === 'ArrowRight') {
    selectedSlot = (selectedSlot + 1) % engine.slots;
    render();
  } else if (e.key === 'ArrowLeft') {
    selectedSlot = (selectedSlot + engine.slots - 1) % engine.slots;
    render();
  } else if (e.key === 'Backspace' || e.key === 'Delete') backspace();
  else if (e.key === 'Enter') submit();
});

// --- header buttons + boot --------------------------------------------------

initSound();
function paintMute(): void {
  muteBtn.textContent = isSoundOn() ? '🔊' : '🔇';
  muteBtn.setAttribute('aria-label', isSoundOn() ? 'Mute sound' : 'Unmute sound');
}
paintMute();
muteBtn.addEventListener('click', () => {
  toggleSound();
  paintMute();
});

document.getElementById('help-btn')!.addEventListener('click', () => helpDialog.showModal());
document.getElementById('stats-btn')!.addEventListener('click', openStats);

// Open straight into a shared zen sigil if the URL carries one.
if (/^#z=/.test(location.hash)) {
  zen = Zen.decode(decodeURIComponent(location.hash.slice(3)));
  screen = 'zen';
}

// First-ever visit to the daily: show the rules.
if (
  screen === 'daily' &&
  engine.progress.played === 0 &&
  engine.guesses.length === 0 &&
  engine.status === 'playing'
) {
  helpDialog.showModal();
}

render();
