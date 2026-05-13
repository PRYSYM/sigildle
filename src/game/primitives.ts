// The invented visual alphabet for Sigildle. Each primitive renders inside a
// 0 0 100 100 SVG viewBox and inherits color via currentColor. Order matters:
// keyboard keys 1..N map to this array.

export interface Primitive {
  id: string;
  name: string;
  svg: string; // inner SVG markup
}

const S = 'fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"';

export const PRIMITIVES: Primitive[] = [
  { id: 'dot',      name: 'Dot',      svg: `<circle cx="50" cy="50" r="15" fill="currentColor"/>` },
  { id: 'ring',     name: 'Ring',     svg: `<circle cx="50" cy="50" r="28" ${S}/>` },
  { id: 'bar',      name: 'Bar',      svg: `<line x1="20" y1="50" x2="80" y2="50" ${S}/>` },
  { id: 'pillar',   name: 'Pillar',   svg: `<line x1="50" y1="20" x2="50" y2="80" ${S}/>` },
  { id: 'arc',      name: 'Arc',      svg: `<path d="M24 74 A 38 38 0 0 1 76 26" ${S}/>` },
  { id: 'chevron',  name: 'Chevron',  svg: `<path d="M34 24 L 70 50 L 34 76" ${S}/>` },
  { id: 'cross',    name: 'Cross',    svg: `<line x1="50" y1="18" x2="50" y2="82" ${S}/><line x1="18" y1="50" x2="82" y2="50" ${S}/>` },
  { id: 'triangle', name: 'Triangle', svg: `<path d="M50 22 L 80 76 L 20 76 Z" fill="currentColor"/>` },
];

export const PRIMITIVE_IDS: string[] = PRIMITIVES.map((p) => p.id);

export function primitiveById(id: string): Primitive {
  const p = PRIMITIVES.find((x) => x.id === id);
  if (!p) throw new Error(`unknown primitive: ${id}`);
  return p;
}
