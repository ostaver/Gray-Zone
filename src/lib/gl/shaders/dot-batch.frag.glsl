#version 300 es
precision mediump float;

in vec4 vColor;
in float vRadius;
in float vSquash;

out vec4 fragColor;

void main() {
  // Distance from the point centre in device px, the y axis stretched by the squash so a dot
  // can narrow into an ellipse (an eye opening). 1px anti-aliased rim; premultiplied out.
  vec2 p = (gl_PointCoord - 0.5) * (2.0 * vRadius + 2.0);
  p.y /= max(vSquash, 0.02);
  float a = clamp(vRadius - length(p) + 0.5, 0.0, 1.0) * vColor.a;
  if (a <= 0.0) discard;
  fragColor = vec4(vColor.rgb * a, a);
}
