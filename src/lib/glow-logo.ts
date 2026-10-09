/**
 * <glow-logo> - an SVG logo with a living fire glow behind it. No dependencies.
 *
 *   <glow-logo src="/ostaver.svg" alt="OSTAVER"></glow-logo>
 *   <glow-logo alt="OSTAVER"><svg viewBox="0 0 600 240">...</svg></glow-logo>   (inline SVG)
 *
 * The SVG is the primary layer: a crisp <img> on top. Behind it a WebGL2 canvas draws the glow:
 * the logo's alpha is blurred into a halo, pushed around by a warped fBM noise field so it licks
 * upward like flames, and the noise is the black & white intensity that a 3-colour ramp turns into fire.
 * The logo needs real transparency (the mask is its alpha channel).
 *
 * Attributes (all optional, all live):
 *   src          URL of the SVG. Must be same-origin, or CORS-enabled + `crossorigin="anonymous"`.
 *   alt          accessible name for the logo
 *   intensity    glow strength                  default 1
 *   spread       glow reach, x logo height      default 0.5
 *   lift         how hard flames lick upward    default 1
 *   speed        animation speed                default 1
 *   quality      glow render resolution 0.25-1  default 0.5 (fraction of CSS px)
 *
 * CSS custom properties, the colour ramp from dark edge to hot core:
 *   --glow-outer  --glow-mid  --glow-core        default #5c0700  #ff5a14  #ffe2a8
 *   Pure black & white: #333 / #bbb / #fff.
 *
 * Size it with CSS (`glow-logo { width: 600px }`). The glow bleeds past the element's box without
 * taking layout space; if that causes a scrollbar, put the logo in a container with `overflow: clip`.
 *
 * Honours prefers-reduced-motion (renders one still frame), pauses while off-screen or in a hidden tab,
 * and falls back to a CSS drop-shadow when WebGL2 is unavailable. SSR-safe: importing this file on the
 * server does nothing; the element registers itself in the browser.
 *
 * Noise: "Base warp fBM", adapted (see GLSL below).
 */

type NumericAttr = 'intensity' | 'spread' | 'lift' | 'speed' | 'quality';
type RGB = [number, number, number];

const DEFAULTS: Record<NumericAttr, number> = { intensity: 1, spread: 0.5, lift: 1, speed: 1, quality: 0.5 };
const NUMERIC = Object.keys(DEFAULTS) as NumericAttr[];
const DEFAULT_RAMP = { outer: '#5c0700', mid: '#ff5a14', core: '#ffe2a8' };

const UNIFORMS = [
  'uMask', 'uRes', 'uTime', 'uLogoH', 'uBleed', 'uSpread', 'uIntensity', 'uLift', 'uOuter', 'uMid', 'uCore',
] as const;
type UniformName = (typeof UNIFORMS)[number];

const VERT = `#version 300 es
void main() {
  // one oversized triangle covering the viewport, no vertex buffers needed
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uMask;   // logo alpha, mip-mapped, padded so the glow has room to bleed
uniform vec2  uRes;        // canvas size, px
uniform float uTime;
uniform float uLogoH;      // logo height, px
uniform float uBleed;      // padding around the logo, px
uniform float uSpread, uIntensity, uLift;
uniform vec3  uOuter, uMid, uCore;
out vec4 fragColor;

// ---- "Base warp fBM" (iTime became uTime; the main time term drifts upward instead of diagonally)
float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }

float noise(vec2 p) {
  vec2 ip = floor(p);
  vec2 u = fract(p);
  u = u * u * (3.0 - 2.0 * u);
  float res = mix(
    mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
    mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
  return res * res;
}

const mat2 mtx = mat2(0.80, 0.60, -0.60, 0.80);

float fbm(vec2 p) {
  float f = 0.0;
  f += 0.500000 * noise(p - vec2(0.15, 1.0) * uTime); p = mtx * p * 2.02;
  f += 0.031250 * noise(p);                           p = mtx * p * 2.01;
  f += 0.250000 * noise(p);                           p = mtx * p * 2.03;
  f += 0.125000 * noise(p);                           p = mtx * p * 2.01;
  f += 0.062500 * noise(p);                           p = mtx * p * 2.04;
  f += 0.015625 * noise(p + sin(uTime));
  return f / 0.96875;
}
// ----------------------------------------------------------------------------------------------

// Smooth blur of the logo alpha: a golden-angle spiral of taps, each read from the mip level that
// matches its distance, so a few taps give a clean, band-free falloff.
float blurMask(vec2 uv, vec2 off, float radius) {
  const int N = 26;
  float acc = 0.0, wsum = 0.0;
  for (int i = 0; i < N; i++) {
    float t = (float(i) + 0.5) / float(N);
    float r = radius * sqrt(t);
    float ang = float(i) * 2.39996323;
    vec2 d = r * vec2(cos(ang), sin(ang));
    float w = 1.0 - t;
    acc += w * textureLod(uMask, uv + (off + d) / uRes, log2(1.0 + r * 0.6)).a;
    wsum += w;
  }
  return acc / wsum;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = vec2(uv.x * uRes.x / uRes.y, uv.y) * 2.4;

  // pattern(p) = fbm(p + fbm(p + fbm(p))), with the two inner passes kept as the warp
  float a = fbm(p);
  float b = fbm(p + a);
  float n = fbm(p + b);                       // the black & white field

  float R = uLogoH * uSpread;
  // sample the logo from below and off to the side -> glow is dragged up and sways
  vec2 off = vec2((b - 0.4) * 1.2, -(0.25 + 0.9 * a)) * uLift * R * 0.4;

  float rim  = blurMask(uv, off * 0.3, R * 0.14);    // hot, tight, hugs the letters
  float halo = blurMask(uv, off,       R * 1.1);     // wide, soft, ragged by the noise
  // the rim stays mostly lit (ember outline); the halo is what the noise makes flare and die back
  float heat = 0.8 * rim * (0.7 + 0.6 * n) + 1.4 * halo * (0.3 + 1.1 * n);

  // Room to burn: 1 on the logo, 0 by the canvas edge, with rounded contours around the logo box.
  // It cools the heat itself (not just the alpha), so a hot glow burns out like a flame instead of
  // filling the canvas and showing its rectangle.
  vec2 q = max(abs(gl_FragCoord.xy - 0.5 * uRes) - (0.5 * uRes - uBleed), 0.0);
  float room = 1.0 - smoothstep(0.5, 1.0, length(q) / uBleed);

  float v = heat * uIntensity * room;
  float t = smoothstep(0.05, 1.25, v);

  vec3 col = t < 0.5 ? mix(uOuter, uMid, t * 2.0) : mix(uMid, uCore, (t - 0.5) * 2.0);

  float alpha = smoothstep(0.02, 0.4, t);

  fragColor = vec4(col * alpha, alpha);       // premultiplied
}`;

// Built lazily so that merely importing this module (SSR, build tools) never touches the DOM.
let template: HTMLTemplateElement | undefined;
function getTemplate(): HTMLTemplateElement {
  if (!template) {
    template = document.createElement('template');
    template.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          isolation: isolate;
          --glow-outer: ${DEFAULT_RAMP.outer};
          --glow-mid: ${DEFAULT_RAMP.mid};
          --glow-core: ${DEFAULT_RAMP.core};
        }
        canvas { position: absolute; z-index: -1; pointer-events: none; }
        slot { display: none; }
        :host([live]) slot { display: contents; }
        :host([live]) img { display: none; }
        img { display: block; width: 100%; height: auto; user-select: none; -webkit-user-drag: none; }
        :host([data-fallback]) canvas { display: none; }
        :host([data-fallback]) img { filter: drop-shadow(0 0 0.35em var(--glow-mid)); }
      </style>
      <canvas part="glow"></canvas>
      <img part="logo" alt="" decoding="async">
      <slot></slot>`;
  }
  return template;
}

// any CSS colour -> [r, g, b] in 0..1, resolved by the browser through a 1px canvas
let swatch: CanvasRenderingContext2D | null | undefined;
function toRGB(css: string, fallback: string): RGB {
  if (swatch === undefined) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    swatch = c.getContext('2d', { willReadFrequently: true });
  }
  if (!swatch) return [1, 1, 1];
  swatch.clearRect(0, 0, 1, 1);
  swatch.fillStyle = fallback;
  swatch.fillStyle = css.trim() || fallback;
  swatch.fillRect(0, 0, 1, 1);
  const d = swatch.getImageData(0, 0, 1, 1).data;
  return [(d[0] ?? 255) / 255, (d[1] ?? 255) / 255, (d[2] ?? 255) / 255];
}

// On the server there is no HTMLElement; extend an empty stand-in so the module still evaluates.
const Base: typeof HTMLElement =
  typeof HTMLElement === 'undefined' ? (class {} as unknown as typeof HTMLElement) : HTMLElement;

interface Geometry { w: number; h: number; logoH: number; bleed: number; scale: number; bleedCss: number }

export class GlowLogo extends Base {
  static get observedAttributes(): string[] {
    return ['src', 'alt', 'crossorigin', 'live', ...NUMERIC];
  }

  declare intensity: number;
  declare spread: number;
  declare lift: number;
  declare speed: number;
  declare quality: number;

  private imgEl!: HTMLImageElement;
  private canvasEl!: HTMLCanvasElement;
  private slotEl!: HTMLSlotElement;
  private cfg: Record<NumericAttr, number> = { ...DEFAULTS };
  private colors: [RGB, RGB, RGB] = [[0.36, 0.03, 0], [1, 0.35, 0.08], [1, 0.89, 0.66]];
  private time = 12;                       // start mid-flame so the first (or only) frame looks good
  private last = 0;
  private raf = 0;
  private visible = true;
  private geo: Geometry | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private tex: WebGLTexture | null = null;
  private u = {} as Record<UniformName, WebGLUniformLocation | null>;
  private mask: CanvasRenderingContext2D | null = null;
  private signature = '';
  private ro?: ResizeObserver;
  private io?: IntersectionObserver;
  private mo?: MutationObserver;
  private motion?: MediaQueryList;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(getTemplate().content.cloneNode(true));
    this.imgEl = root.querySelector('img')!;
    this.canvasEl = root.querySelector('canvas')!;
    this.slotEl = root.querySelector('slot')!;
    this.slotEl.addEventListener('slotchange', () => (this.hasAttribute('live') ? this.layout() : this.applySource()));
    this.imgEl.addEventListener('load', () => this.layout());
  }

  connectedCallback(): void {
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.motion.addEventListener('change', this.kick);

    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(this);

    this.io = new IntersectionObserver((entries) => {
      this.visible = entries[entries.length - 1]?.isIntersecting ?? true;
      this.kick();
    });
    this.io.observe(this);

    // re-read the colour ramp when style / class change on the host
    this.mo = new MutationObserver(() => this.refresh());
    this.mo.observe(this, { attributes: true, attributeFilter: ['style', 'class'] });

    document.addEventListener('visibilitychange', this.kick);
    this.canvasEl.addEventListener('webglcontextlost', this.onContextLost);
    this.canvasEl.addEventListener('webglcontextrestored', this.onContextRestored);

    this.imgEl.alt = this.getAttribute('alt') ?? '';
    this.applySource();
    if (!this.initGL()) this.setAttribute('data-fallback', '');
    this.refresh();
  }

  disconnectedCallback(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.ro?.disconnect();
    this.io?.disconnect();
    this.mo?.disconnect();
    this.motion?.removeEventListener('change', this.kick);
    document.removeEventListener('visibilitychange', this.kick);
    this.canvasEl.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvasEl.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.releaseGL();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name === 'live') return this.layout();
    if (name === 'src' || name === 'crossorigin') return this.applySource();
    if (name === 'alt') { this.imgEl.alt = value ?? ''; return; }
    const key = name as NumericAttr;
    const n = parseFloat(value ?? '');
    this.cfg[key] = Number.isFinite(n) ? n : DEFAULTS[key];
    if (key === 'spread' || key === 'quality') this.layout();
    else this.kick();
  }

  /** True when WebGL2 or the SVG could not be used and the plain drop-shadow fallback is showing. */
  get fallback(): boolean {
    return this.hasAttribute('data-fallback');
  }

  /** Re-read --glow-outer / --glow-mid / --glow-core. Runs automatically when the host's style or class changes;
   *  call it yourself if the colours change through an ancestor. */
  refresh(): void {
    const cs = getComputedStyle(this);
    this.colors = [
      toRGB(cs.getPropertyValue('--glow-outer'), DEFAULT_RAMP.outer),
      toRGB(cs.getPropertyValue('--glow-mid'), DEFAULT_RAMP.mid),
      toRGB(cs.getPropertyValue('--glow-core'), DEFAULT_RAMP.core),
    ];
    this.kick();
  }

  // `src` wins; otherwise use an inline <svg> child. That goes through a data: URL, which is never
  // cross-origin, so it also works when a page is opened straight from disk (file://).
  private applySource(): void {
    if (this.hasAttribute('live')) return;
    const cors = this.getAttribute('crossorigin');
    this.imgEl.crossOrigin = cors === null ? null : cors === 'use-credentials' ? 'use-credentials' : 'anonymous';

    let url = this.getAttribute('src');
    if (!url) {
      const svg = this.slotEl.assignedElements().find((e) => e.localName === 'svg');
      if (!svg) return;
      url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
    }
    if (this.imgEl.getAttribute('src') !== url) this.imgEl.setAttribute('src', url);
  }

  private initGL(): boolean {
    const gl = this.canvasEl.getContext('webgl2', {
      alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power',
    });
    if (!gl) return false;

    const compile = (type: number, source: string): WebGLShader => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader error');
      return shader;
    };
    try {
      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link error');
      this.prog = prog;
    } catch (err) {
      console.warn('<glow-logo> shader failed, using fallback:', err);
      return false;
    }

    for (const name of UNIFORMS) this.u[name] = gl.getUniformLocation(this.prog, name);
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.gl = gl;
    return true;
  }

  private releaseGL(): void {
    if (this.gl) {
      this.gl.deleteTexture(this.tex);
      this.gl.deleteProgram(this.prog);
    }
    this.gl = null;
    this.prog = null;
    this.tex = null;
  }

  private onContextLost = (e: Event): void => {
    e.preventDefault();
    this.gl = null;
  };

  private onContextRestored = (): void => {
    if (this.initGL()) this.layout();
  };

  // Size the canvas (logo box + bleed on every side), then rasterise the logo into the mask texture.
  private layout(): void {
    const gl = this.gl;
    const W = this.offsetWidth;
    const H = this.offsetHeight;
    const live = this.hasAttribute('live');
    if (!gl || !W || !H) return;
    if (!live && (!this.imgEl.getAttribute('src') || !this.imgEl.complete)) return;

    // wide enough for the halo plus its upward lick, so `room` tapers the glow rather than clipping it
    const bleed = Math.round(H * this.cfg.spread * 1.8);
    const cssW = W + 2 * bleed;
    const cssH = H + 2 * bleed;
    let s = Math.min(1, Math.max(0.25, this.cfg.quality));
    s = Math.min(s, Math.sqrt(1.5e6 / (cssW * cssH)));           // cap the pixel count
    const w = Math.max(1, Math.round(cssW * s));
    const h = Math.max(1, Math.round(cssH * s));

    const st = this.canvasEl.style;
    st.left = st.top = `${-bleed}px`;
    st.width = `${cssW}px`;
    st.height = `${cssH}px`;
    this.canvasEl.width = w;
    this.canvasEl.height = h;

    this.mask ??= document.createElement('canvas').getContext('2d');
    if (!this.mask) return;
    this.mask.canvas.width = w;
    this.mask.canvas.height = h;

    this.geo = { w, h, logoH: H * s, bleed: bleed * s, scale: s, bleedCss: bleed };
    if (!this.uploadMask()) return;
    this.kick();
  }

  // LIVE MODE: the logo is the slotted <img> children. Their current CSS transform / opacity (as animated by
  // GSAP, WAAPI, CSS...) is composited into the mask, so the glow follows letters that move and rotate.
  private layers(): HTMLImageElement[] {
    return this.slotEl.assignedElements().filter((e): e is HTMLImageElement => e instanceof HTMLImageElement);
  }

  private layerSignature(layers: HTMLImageElement[]): string {
    let sig = '';
    for (const el of layers) {
      const cs = getComputedStyle(el);
      sig += `${el.offsetLeft},${el.offsetTop},${el.offsetWidth},${el.offsetHeight},${cs.transform},${cs.opacity},${cs.visibility},${el.complete ? 1 : 0};`;
    }
    return sig;
  }

  private paintLayers(m: CanvasRenderingContext2D, g: Geometry, layers: HTMLImageElement[]): void {
    for (const el of layers) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const [ox = 0, oy = 0] = cs.transformOrigin.split(' ').map(parseFloat);
      const M = cs.transform === 'none' ? new DOMMatrix() : new DOMMatrix(cs.transform);
      m.setTransform(g.scale, 0, 0, g.scale, g.bleedCss * g.scale, g.bleedCss * g.scale);
      m.translate(el.offsetLeft + ox, el.offsetTop + oy);
      m.transform(M.a, M.b, M.c, M.d, M.e, M.f);
      m.translate(-ox, -oy);
      m.globalAlpha = Number(cs.opacity);
      m.drawImage(el, 0, 0, el.offsetWidth, el.offsetHeight);
    }
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalAlpha = 1;
  }

  // draw the logo into the mask canvas and upload it as the (mip-mapped) texture
  private uploadMask(): boolean {
    const gl = this.gl;
    const g = this.geo;
    const m = this.mask;
    if (!gl || !g || !m) return false;
    try {
      m.setTransform(1, 0, 0, 1, 0, 0);
      m.clearRect(0, 0, g.w, g.h);
      if (this.hasAttribute('live')) {
        const layers = this.layers();
        this.signature = this.layerSignature(layers);
        this.paintLayers(m, g, layers);
      } else {
        m.drawImage(this.imgEl, g.bleedCss * g.scale, g.bleedCss * g.scale, this.offsetWidth * g.scale, this.offsetHeight * g.scale);
      }
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, m.canvas);
      gl.generateMipmap(gl.TEXTURE_2D);
    } catch (err) {
      console.warn('<glow-logo> cannot read the SVG, using fallback:', err);
      this.setAttribute('data-fallback', '');
      this.releaseGL();
      return false;
    }
    return true;
  }

  // make sure a frame gets drawn, and keep looping while there is something to animate
  private kick = (): void => {
    if (this.raf || !this.gl || !this.geo) return;
    this.last = 0;
    this.raf = requestAnimationFrame(this.onFrame);
  };

  private onFrame = (now: number): void => {
    this.raf = 0;
    if (!this.gl || !this.geo) return;
    const live = this.hasAttribute('live');
    const still = this.motion?.matches ?? false;
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
    this.last = now;
    if (!still) this.time += dt * this.cfg.speed * 0.35;
    if (live && this.layerSignature(this.layers()) !== this.signature && !this.uploadMask()) return;
    this.draw();
    // in live mode keep polling the letters even under reduced motion (only the fire time stands still)
    if ((!still || live) && this.visible && !document.hidden) this.raf = requestAnimationFrame(this.onFrame);
  };

  private draw(): void {
    const gl = this.gl;
    const g = this.geo;
    if (!gl || !g || !this.prog) return;
    const { u, cfg } = this;
    gl.viewport(0, 0, g.w, g.h);
    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(u.uMask, 0);
    gl.uniform2f(u.uRes, g.w, g.h);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uLogoH, g.logoH);
    gl.uniform1f(u.uBleed, g.bleed);
    gl.uniform1f(u.uSpread, cfg.spread);
    gl.uniform1f(u.uIntensity, cfg.intensity);
    gl.uniform1f(u.uLift, cfg.lift);
    gl.uniform3fv(u.uOuter, this.colors[0]);
    gl.uniform3fv(u.uMid, this.colors[1]);
    gl.uniform3fv(u.uCore, this.colors[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

// element.intensity = 1.4 etc. (reflected to attributes)
for (const key of NUMERIC) {
  Object.defineProperty(GlowLogo.prototype, key, {
    get(this: GlowLogo) { return this.getAttribute(key) === null ? DEFAULTS[key] : Number(this.getAttribute(key)); },
    set(this: GlowLogo, v: number) { this.setAttribute(key, String(v)); },
  });
}

/** Register the element. Called automatically on import in the browser; call it yourself to use another tag name. */
export function defineGlowLogo(tag = 'glow-logo'): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, GlowLogo);
}

defineGlowLogo();

declare global {
  interface HTMLElementTagNameMap {
    'glow-logo': GlowLogo;
  }
}
