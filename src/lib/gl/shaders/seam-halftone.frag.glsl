#version 300 es
precision highp float;

// Hero field: the Chromatic theme's "Chromatic Waves" (the luminance of a slowly drifting
// simplex rainbow, drawn as a dot grid) in the logo's colours, split by the torn seam.

// View geometry (device px, gl_FragCoord space) and CSS-px scale.
uniform vec2 uRes;
uniform vec2 uOffset;
uniform float uDpr;

uniform float uTime;
uniform float uCell;        // dot cell, CSS px
uniform vec4 uSeam[32];     // 128 seam x positions (fraction of width), top → bottom
uniform vec2 uMouse;        // CSS px, top-left origin
uniform float uMouseForce;  // 0..1, pointer speed
uniform float uReveal;      // 0..1 intro wave
uniform float uProgress;    // 0..1 scroll through hero

out vec4 fragColor;

// Ashima / Stefan Gustavson 3D simplex noise (MIT).
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
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

// Chromatic theme hero settings, mapped from its UI scale to shader units.
const float FREQUENCY = 1.19;
const float SPEED = 0.15;
const float GAMMA = 2.08;
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
  return ramp(vec4(0.227, 0.227, 0.227, 0.0), vec4(0.118, 0.118, 0.118, 1.0), vec4(0.227, 0.227, 0.227, 1.0), vec4(0.541, 0.541, 0.525, 1.0), vec4(PAPER, 1.0), g);
}

void main() {
  vec2 px = gl_FragCoord.xy - uOffset;
  vec2 size = uRes / uDpr;
  vec2 css = vec2(px.x, uRes.y - px.y) / uDpr;
  float aspect = size.x / size.y;

  // ── Dot grid (cells grow as the hero scrolls away) ─────────
  float cell = uCell * (1.0 + uProgress * 0.9);
  vec2 cellIdx = floor(css / cell);
  vec2 center = (cellIdx + 0.5) * cell;
  vec2 local = (css - center) / cell;
  vec2 uv = center / size;

  // Field value at the cell centre. The rainbow's luminance swings as the hue sweeps, so
  // |noise| turns into nested bands.
  vec2 fuv = (uv - 0.5) * vec2(aspect, 1.0) + 0.5;
  float hue = abs(snoise(vec3(fuv * FREQUENCY, 10.0 + uTime * SPEED)));
  float g = dot(hsv2rgb(vec3(hue, 1.0, 1.0)), vec3(0.3, 0.59, 0.11));
  g = pow(clamp(g, 1e-4, 1.0), GAMMA) + BIAS;

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
  float fibre = snoise(vec3(0.0, css.y * 0.045, 7.0)) * 0.5 + 0.5;
  float jitter = hash11(floor(css.y * 0.5));
  float w = (1.2 + 3.2 * fibre * fibre + 1.4 * jitter) * reveal;
  float edge = 1.0 - smoothstep(w - 0.8, w + 0.8, abs(dp + w * 0.5));
  // Fine hairs escaping the tear.
  float hair = step(0.965, hash11(floor(css.y * 0.8) + 11.0)) * (1.0 - smoothstep(0.0, 7.0 + 8.0 * jitter, -dp)) * step(dp, 0.0);
  edge = max(edge, hair * 0.7) * (1.0 - uProgress * 0.6);

  rgb = mix(rgb, PAPER, edge);
  alpha = mix(alpha, 1.0, edge);

  // Fade toward the section bottom so the field dissolves into the page.
  float fade = smoothstep(1.0, 0.72, css.y / size.y);
  fragColor = vec4(rgb, alpha) * fade;
}
