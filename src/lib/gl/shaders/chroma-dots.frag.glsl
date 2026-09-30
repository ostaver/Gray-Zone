#version 300 es
precision highp float;

// Chromatic Waves dot pass: each cell draws one dot whose radius and colour follow the
// field value. Output is premultiplied.

uniform sampler2D uField;   // one texel per cell (chroma-field.frag.glsl)
uniform vec2 uOrigin;       // grid origin, device px
uniform float uCell;        // cell, device px
uniform vec4 uPalette[5];   // rgb + alpha, darkest → brightest

out vec4 fragColor;

void main() {
  vec2 p = (gl_FragCoord.xy - uOrigin) / uCell;
  ivec2 cell = clamp(ivec2(floor(p)), ivec2(0), textureSize(uField, 0) - 1);
  float g = texelFetch(uField, cell, 0).r;

  float dist = length(fract(p) - 0.5);
  float r = g * 0.5;
  float aa = fwidth(dist) + 1e-4;
  float mark = 1.0 - smoothstep(r - aa, r + aa, dist);

  float s = g * 4.0;
  int seg = min(int(s), 3);
  vec4 c = mix(uPalette[seg], uPalette[seg + 1], s - float(seg));
  float a = mark * c.a;
  fragColor = vec4(c.rgb * a, a);
}
