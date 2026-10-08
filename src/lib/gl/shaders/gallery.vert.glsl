#version 300 es
// Gallery (views/arcGallery.ts): one screen's quad, placed and tilted on the arc. Everything is in
// CSS px from the view's centre (y up), so no camera or model matrices are needed.
in vec3 position; // unit quad, -0.5..0.5
in vec2 uv;

uniform vec2 uView;   // view size
uniform vec2 uCentre; // the screen's centre
uniform vec2 uSize;   // the screen's size
uniform float uAngle;

out vec2 vUv;

void main() {
  vUv = uv;
  float c = cos(uAngle);
  float s = sin(uAngle);
  vec2 p = mat2(c, s, -s, c) * (position.xy * uSize) + uCentre;
  gl_Position = vec4(p / (uView * 0.5), 0.0, 1.0);
}
