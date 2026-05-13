import { primitiveById } from '../game/primitives';

// Render a sigil to a standalone SVG, and download it as SVG or PNG.

const BG = '#0e0e12';
const FG = '#8b5cf6';

export function sigilSvg(slots: (string | null)[], px = 512): string {
  const layers = slots
    .filter((s): s is string => s !== null)
    .map((id) => primitiveById(id).svg)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${px}" height="${px}"><rect width="100" height="100" rx="14" fill="${BG}"/><g color="${FG}" fill="${FG}">${layers}</g></svg>`;
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadSvg(slots: (string | null)[], name = 'sigil.svg'): void {
  download(new Blob([sigilSvg(slots)], { type: 'image/svg+xml;charset=utf-8' }), name);
}

export function downloadPng(slots: (string | null)[], name = 'sigil.png', px = 512): void {
  const svg = sigilSvg(slots, px);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = px;
    canvas.height = px;
    const c2d = canvas.getContext('2d');
    if (!c2d) return;
    c2d.drawImage(img, 0, 0, px, px);
    canvas.toBlob((b) => {
      if (b) download(b, name);
    }, 'image/png');
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
