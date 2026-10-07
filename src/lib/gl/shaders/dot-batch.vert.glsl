#version 300 es
// One point per dot, positioned and coloured on the CPU each frame (see views/dotBatch.ts).
in vec2 aPos;    // CSS px from the view's top-left (y down)
in vec2 aShape;  // radius (CSS px), vertical squash (1 = circle, 0 = a closed slit)
in vec4 aColor;  // rgb, alpha (straight)

uniform vec2 uSize; // view size, CSS px
uniform float uDpr;

out vec4 vColor;
out float vRadius; // device px
out float vSquash;

void main() {
  vRadius = aShape.x * uDpr;
  vSquash = aShape.y;
  vColor = aColor;
  gl_Position = vec4((aPos / uSize * 2.0 - 1.0) * vec2(1.0, -1.0), 0.0, 1.0);
  gl_PointSize = vRadius > 0.0 ? 2.0 * vRadius + 2.0 : 0.0;
}
