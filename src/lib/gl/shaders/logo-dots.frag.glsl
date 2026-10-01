precision mediump float;

varying vec3 vColor;
varying float vRadius;

void main() {
  // Distance from the point centre in device px; 1px anti-aliased rim. Premultiplied out.
  float d = length(gl_PointCoord - 0.5) * (2.0 * vRadius + 2.0);
  float a = clamp(vRadius - d + 0.5, 0.0, 1.0);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(vColor * a, a);
}
