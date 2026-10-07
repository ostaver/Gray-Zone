#version 300 es
precision highp float;

// About section: the logo disc as a halftone print that turns with scroll. Red disc, the dark
// half on the gray-zone side of the tear, and the wordmark split across the tear, all in the
// disc's own (rotated) frame. Dot sizes breathe with the hero's noise field (seam-field.frag,
// one texel per dot cell, the disc centre at texel `uFieldHalf`).

// View geometry (device px, gl_FragCoord space) and CSS-px scale.
uniform vec2 uRes;
uniform vec2 uOffset;
uniform float uDpr;

uniform sampler2D uField;
uniform float uFieldHalf;
uniform float uCell;        // dot cell, CSS px
uniform float uRadius;      // disc radius, CSS px
uniform sampler2D uLetters; // wordmark coverage in .a; the square around the disc, top row first
uniform float uAngle;       // radians, clockwise on screen
uniform vec2 uMouse;        // CSS px, view top-left origin
uniform float uReveal;      // 0..1, the disc develops from its centre

out vec4 fragColor;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

// 1D gradient noise, roughly -1..1 (as in seam-halftone.frag).
float gnoise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  float g0 = hash11(i) * 2.0 - 1.0;
  float g1 = hash11(i + 1.0) * 2.0 - 1.0;
  return mix(g0 * f, g1 * (f - 1.0), u) * 2.0;
}

float disc(vec2 p, float r, float aa) {
  return 1.0 - smoothstep(r - aa, r + aa, length(p));
}

// The tear's x offset (CSS px) at height y in the disc frame: ripped by hand, not ruled.
float tearAt(float y) {
  return (gnoise(y * 0.045 + 3.0) * 0.6 + gnoise(y * 0.19 + 9.0) * 0.25) * uCell * 0.55;
}

const vec3 PAPER = vec3(0.937, 0.925, 0.902);
const vec3 RED = vec3(0.890, 0.149, 0.122);
const vec3 RED_DEEP = vec3(0.620, 0.082, 0.063);
const vec3 INK = vec3(0.039);
const vec3 DARK_LO = vec3(0.075);
const vec3 DARK_HI = vec3(0.19);

// The dark half's radius as a fraction of the disc (the logo: 12.4 of 16).
const float INNER = 0.775;

void main() {
  vec2 px = gl_FragCoord.xy - uOffset;
  vec2 size = uRes / uDpr;
  vec2 css = vec2(px.x, uRes.y - px.y) / uDpr;
  vec2 mid = size * 0.5;
  float cs = cos(uAngle);
  float sn = sin(uAngle);

  // Into the disc's frame (y down): the grid, the tear and the letters all turn together.
  vec2 p = css - mid;
  vec2 q = vec2(cs * p.x + sn * p.y, -sn * p.x + cs * p.y);

  // ── Dots ───────────────────────────────────────────────────
  vec2 cellIdx = floor(q / uCell);
  vec2 center = (cellIdx + 0.5) * uCell;
  vec2 local = (q - center) / uCell;
  float rc = length(center) / uRadius;
  ivec2 texel = clamp(ivec2(cellIdx + uFieldHalf), ivec2(0), textureSize(uField, 0) - 1);
  float g = texelFetch(uField, texel, 0).r;

  // Pointer lens, in screen space: dots swell where you look.
  vec2 dm = vec2(cs * center.x - sn * center.y, sn * center.x + cs * center.y) + mid - uMouse;
  float lens = exp(-dot(dm, dm) / (2.0 * 70.0 * 70.0));

  // Develops from the centre on first view; the rim dissolves into ever smaller dots.
  float reveal = smoothstep(rc, rc + 0.35, uReveal * 1.4);
  float rim = 1.0 - smoothstep(0.74, 1.0, rc);
  // Dense enough that the disc reads as solid colour with a print texture; past 0.5 the dots
  // meet their neighbours and the noise shows as slow waves of merging.
  float radius = (0.42 + 0.2 * g + 0.14 * lens) * rim * reveal;

  // Signed distance to the tear per pixel: dots on the line are torn in two, like the logo.
  float dp = q.x - tearAt(q.y);
  float side = smoothstep(-0.6, 0.6, dp);
  // Which half a dot belongs to is decided per cell, so the dark half's rim stays whole dots.
  float darkCell = step(0.0, center.x - tearAt(center.y)) * step(rc, INNER);

  vec3 honest = mix(RED_DEEP, RED, smoothstep(0.0, 0.8, g + lens * 0.4));
  vec3 dark = mix(DARK_LO, DARK_HI, g);
  // Looking closely into the dark half reveals a trace of red, as in the hero's gray zone.
  dark = mix(dark, RED, lens * 0.3);
  vec3 col = mix(honest, mix(honest, dark, darkCell), side);

  // Chromatic split: channels drift apart near the tear.
  float band = exp(-abs(dp) / (uCell * 2.0));
  float shift = band * 0.24;
  float aa = 0.9 / (uCell * uDpr);
  float mR = disc(local + vec2(shift, 0.0), radius, aa);
  float mG = disc(local, radius, aa);
  float mB = disc(local - vec2(shift, 0.0), radius, aa);
  vec3 rgb = col * vec3(mR, mG, mB);
  float alpha = max(max(mR, mG), mB);

  // The dark side sits in the shadow of the torn paper.
  rgb *= 1.0 - exp(-max(dp, 0.0) / 9.0) * step(0.0, dp) * 0.55;

  // The dark half is solid ink under its dots, as in the logo. Invisible on the black zone's
  // ink page; on the white zone it keeps the half dark and the paper letters legible.
  float rq = length(q);
  float base = side * (1.0 - smoothstep(INNER * uRadius - 0.75, INNER * uRadius + 0.75, rq)) * smoothstep(rq / uRadius, rq / uRadius + 0.35, uReveal * 1.4);
  rgb += INK * base * (1.0 - alpha);
  alpha += base * (1.0 - alpha);

  // ── Wordmark: solid ink on the red, paper on the dark ──────
  float letters = texture(uLetters, q / (2.0 * uRadius) + 0.5).a * smoothstep(0.55, 1.0, uReveal);
  rgb = mix(rgb, mix(INK, PAPER, side), letters);
  alpha = mix(alpha, 1.0, letters);

  // ── Torn paper edge (per pixel), overshooting the rim a touch, like the logo ──
  float fibre = gnoise(q.y * 0.07 + 7.0) * 0.5 + 0.5;
  float jitter = hash11(floor(q.y * 0.5));
  float w = 0.9 + 2.2 * fibre * fibre + 0.8 * jitter;
  float edge = 1.0 - smoothstep(w - 0.7, w + 0.7, abs(dp + w * 0.5));
  edge *= (1.0 - smoothstep(1.0, 1.05, abs(q.y) / uRadius)) * smoothstep(0.2, 0.7, uReveal);
  rgb = mix(rgb, PAPER, edge);
  alpha = mix(alpha, 1.0, edge);

  fragColor = vec4(rgb, alpha);
}
