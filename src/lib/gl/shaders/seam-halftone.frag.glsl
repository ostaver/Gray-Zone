#version 300 es
precision highp float;

// Hero field: the Chromatic theme's "Chromatic Waves" (the luminance of a slowly drifting
// simplex rainbow, drawn as a dot grid) in the logo's colours, split by the torn seam.
// The noise itself is evaluated once per cell by seam-field.frag into `uField`.

// View geometry (device px, gl_FragCoord space) and CSS-px scale.
uniform vec2 uRes;
uniform vec2 uOffset;
uniform float uDpr;

uniform sampler2D uField;   // per-cell field, texel (column, row from top); see seam-field.frag
uniform float uCell;        // current dot cell, CSS px (grows as the hero scrolls away)
uniform vec4 uSeam[32];     // 128 seam x positions (fraction of width), top → bottom
uniform vec2 uMouse;        // CSS px, top-left origin
uniform float uMouseForce;  // 0..1, pointer speed
uniform float uReveal;      // 0..1 intro wave
uniform float uProgress;    // 0..1 scroll through hero
uniform float uWhiteZone;   // 0 = black zone, 1 = white zone

out vec4 fragColor;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

// 1D gradient noise, roughly -1..1: the tear's fibre only varies along its length.
float gnoise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  float g0 = hash11(i) * 2.0 - 1.0;
  float g1 = hash11(i + 1.0) * 2.0 - 1.0;
  return mix(g0 * f, g1 * (f - 1.0), u) * 2.0;
}

// One entry of the packed seam array. Component select via mask: dynamic vector indexing
// is emulated (slowly) on several GPU drivers.
float seamSample(int i) {
  vec4 v = uSeam[i >> 2];
  return dot(v, vec4(equal(ivec4(i & 3), ivec4(0, 1, 2, 3))));
}

// Seam x (fraction of width) at vertical position y (0 = top), linearly interpolated.
float seamAt(float y) {
  float f = clamp(y, 0.0, 1.0) * 127.0;
  int i = int(floor(f));
  return mix(seamSample(i), seamSample(min(i + 1, 127)), fract(f));
}

float disc(vec2 p, float r, float aa) {
  return 1.0 - smoothstep(r - aa, r + aa, length(p));
}

const vec3 PAPER = vec3(0.937, 0.925, 0.902);
const vec3 RED = vec3(0.890, 0.149, 0.122);

// Chromatic theme hero setting, mapped from its UI scale to shader units.
const float BIAS = -0.1;

// Five-stop ramp, darkest (transparent) → brightest; branchless piecewise-linear.
vec4 ramp(vec4 a, vec4 b, vec4 c, vec4 d, vec4 e, float g) {
  float s = g * 4.0;
  vec4 col = mix(a, b, clamp(s, 0.0, 1.0));
  col = mix(col, c, clamp(s - 1.0, 0.0, 1.0));
  col = mix(col, d, clamp(s - 2.0, 0.0, 1.0));
  return mix(col, e, clamp(s - 3.0, 0.0, 1.0));
}
// The logo's halves: red on the honest side; black with cream lettering in the gray zone.
vec4 honest(float g) {
  return ramp(vec4(RED, 0.0), vec4(0.227, 0.031, 0.024, 1.0), vec4(0.478, 0.063, 0.047, 1.0), vec4(0.722, 0.102, 0.078, 1.0), vec4(RED, 1.0), g);
}
vec4 grayZone(float g) {
  return ramp(
    vec4(0.227, 0.227, 0.227, 0.0),
    vec4(mix(vec3(0.118), vec3(0.78, 0.78, 0.76), uWhiteZone), 1.0),
    vec4(mix(vec3(0.227), vec3(0.541, 0.541, 0.525), uWhiteZone), 1.0),
    vec4(mix(vec3(0.541, 0.541, 0.525), vec3(0.227), uWhiteZone), 1.0),
    vec4(mix(PAPER, vec3(0.039), uWhiteZone), 1.0),
    g
  );
}

void main() {
  vec2 px = gl_FragCoord.xy - uOffset;
  vec2 size = uRes / uDpr;
  vec2 css = vec2(px.x, uRes.y - px.y) / uDpr;
  float aspect = size.x / size.y;

  // ── Dot grid ───────────────────────────────────────────────
  float cell = uCell;
  vec2 cellIdx = floor(css / cell);
  vec2 center = (cellIdx + 0.5) * cell;
  vec2 local = (css - center) / cell;
  vec2 uv = center / size;

  float g = texelFetch(uField, ivec2(cellIdx), 0).r + BIAS;

  // Pointer lens: dots swell where you look, harder when you move fast.
  vec2 dm = center - uMouse;
  float lens = exp(-dot(dm, dm) / (2.0 * 150.0 * 150.0));
  g += lens * (0.16 + 0.3 * uMouseForce);

  // Vignette, and the intro: the field develops in a wave expanding from the centre.
  float rd = length((uv - 0.5) * vec2(aspect, 1.0));
  float reveal = smoothstep(rd, rd + 0.35, uReveal * 1.45);
  float vignette = 1.0 - smoothstep(0.35, 1.0, length(uv - 0.5) * 1.41421);
  g = clamp(g, 0.0, 1.0) * reveal * vignette;
  float radius = g * 0.5;

  // Signed distance to the tear, per pixel: dots on the line are torn in two, like the logo.
  float dp = css.x - seamAt(css.y / size.y) * size.x;
  float side = smoothstep(-0.75, 0.75, dp);

  // Chromatic split: channels drift apart horizontally near the tear.
  float band = exp(-abs(dp) / (cell * 2.5));
  float shift = band * (0.28 + 0.2 * uMouseForce);
  float aa = 0.9 / (cell * uDpr);
  float mR = disc(local + vec2(shift, 0.0), radius, aa);
  float mG = disc(local, radius, aa);
  float mB = disc(local - vec2(shift, 0.0), radius, aa);

  vec4 col = mix(honest(g), grayZone(g), side);
  // Lens tint: in the gray zone, looking closely reveals a trace of red.
  col.rgb = mix(col.rgb, RED, lens * side * 0.35);

  vec3 rgb = col.rgb * col.a * vec3(mR, mG, mB);
  float alpha = max(max(mR, mG), mB) * col.a;

  // Gray side sits in the shadow of the torn paper.
  float shadow = exp(-max(dp, 0.0) / 22.0) * step(0.0, dp) * 0.6;
  rgb *= 1.0 - shadow;

  // ── Torn paper edge (per pixel, not halftoned) ──────────────
  float fibre = gnoise(css.y * 0.045 + 7.0) * 0.5 + 0.5;
  float jitter = hash11(floor(css.y * 0.5));
  float w = (1.2 + 3.2 * fibre * fibre + 1.4 * jitter) * reveal;
  float edge = 1.0 - smoothstep(w - 0.8, w + 0.8, abs(dp + w * 0.5));
  // Fine hairs escaping the tear.
  float hair = step(0.965, hash11(floor(css.y * 0.8) + 11.0)) * (1.0 - smoothstep(0.0, 7.0 + 8.0 * jitter, -dp)) * step(dp, 0.0);
  edge = max(edge, hair * 0.7) * (1.0 - uProgress * 0.6);

  rgb = mix(rgb, mix(PAPER, vec3(0.38), uWhiteZone), edge);
  alpha = mix(alpha, 1.0, edge);

  // Fade toward the section bottom so the field dissolves into the page.
  float fade = 1.0 - smoothstep(0.72, 1.0, css.y / size.y);
  fragColor = vec4(rgb, alpha) * fade;
}
