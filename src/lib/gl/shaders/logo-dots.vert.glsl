// Preloader logo: one point per halftone dot. Fly-in, turn and zoom all happen here, so a
// frame is a single draw call. GLSL ES 1.00 so WebGL1-only devices get it too.
attribute vec2 aStart;   // scatter position, CSS px from the viewport centre (y down)
attribute vec2 aTarget;  // resting position in the logo
attribute float aRadius; // CSS px
attribute float aDelay;
attribute vec3 aColor;

uniform vec2 uRes;       // viewport, CSS px
uniform float uDpr;
uniform float uAssemble;
uniform vec2 uSpin;      // cos, sin of the rotation
uniform float uZoom;
uniform float uScatter;  // 0..1, outward burst: every dot leaves along its own radius, centre first

varying vec3 vColor;
varying float vRadius;   // device px

void main() {
  float t = clamp((uAssemble - aDelay) / 0.6, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - t, 4.0);
  vec2 p = mix(aStart, aTarget, e);
  // Burst: radial, so the turn does not change its direction. The reach covers the half
  // diagonal plus a per-dot margin, which leaves every dot past the screen edge at 1.
  float s = clamp(uScatter * 1.35 - aDelay * 0.6, 0.0, 1.0);
  float reach = length(uRes) * 0.5 * (1.0 + 0.5 * fract(aDelay * 37.0));
  vec2 dir = dot(p, p) > 0.25 ? normalize(p) : normalize(aStart);
  p += dir * (s * s * reach / uZoom);
  p = vec2(p.x * uSpin.x - p.y * uSpin.y, p.x * uSpin.y + p.y * uSpin.x) * uZoom;
  // Dots grow only with √zoom while the gaps grow with zoom: a zoomed logo thins out.
  float r = aRadius * e * sqrt(uZoom) * uDpr;
  vRadius = r;
  vColor = aColor;
  gl_Position = vec4(p / (uRes * 0.5) * vec2(1.0, -1.0), 0.0, 1.0);
  gl_PointSize = r > 0.0 ? 2.0 * r + 2.0 : 0.0;
}
