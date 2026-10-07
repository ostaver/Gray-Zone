/**
 * A vertical torn line in a `w`×`h` viewBox: `steps` segments, each nudged sideways by
 * deterministic jitter, so the tear is identical on every build.
 */
export function tornPath(w: number, h: number, steps: number, seed: number): string {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
    const x = w / 2 + (s - Math.floor(s) - 0.5) * w;
    return `${i ? 'L' : 'M'}${x.toFixed(2)} ${((i / steps) * h).toFixed(2)}`;
  }).join(' ');
}
