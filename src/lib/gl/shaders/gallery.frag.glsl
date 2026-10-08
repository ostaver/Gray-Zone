#version 300 es
precision highp float;

// Gallery: a screen on the arc. Away from the centre it settles back into the page, quieter and
// less saturated; centred, it is shown as is. Corners are rounded and every edge anti-aliased
// here, since the stage draws without MSAA. Output is premultiplied.

uniform sampler2D uMap;
uniform float uLoaded; // 0..1, fades the screen in once its texture has arrived
uniform float uFocus;  // 1 centred .. 0 a screen or more away
uniform vec2 uSize;    // the screen's size, CSS px
uniform float uRadius; // corner radius, CSS px
uniform vec3 uInk;     // page surface

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec3 rgb = texture(uMap, vUv).rgb;
  float gray = dot(rgb, vec3(0.299, 0.587, 0.114));
  rgb = mix(vec3(gray), rgb, mix(0.2, 1.0, uFocus));
  rgb = mix(uInk, rgb, uLoaded * mix(0.38, 1.0, uFocus));

  vec2 p = (vUv - 0.5) * uSize;
  vec2 q = abs(p) - (uSize * 0.5 - uRadius);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  float a = clamp(0.5 - d / fwidth(d), 0.0, 1.0);
  fragColor = vec4(rgb * a, a);
}
