precision mediump float;

varying vec3 vColor;
varying float vRadius;
varying float vGlow;

void main() {
  // The halo ends within the point sprite, leaving the rest of the canvas transparent.
  float d = length(gl_PointCoord - 0.5) * (2.0 * (vRadius + vGlow) + 2.0);
  float core = clamp(vRadius - d + 0.5, 0.0, 1.0);
  float halo = (1.0 - smoothstep(vRadius, vRadius + vGlow + 0.5, d)) * 0.18 * step(0.01, vGlow);
  float a = max(core, halo);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(vColor * a, a);
}
