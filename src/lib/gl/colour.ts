import type { RGB } from './views/dotBatch';

/** A hex colour token (`--red`, `--paper`…) as 0..1 RGB, for shader uniforms. */
export function readColour(style: CSSStyleDeclaration, name: string): RGB {
  const hex = style.getPropertyValue(name).trim().replace('#', '');
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
