import{i as e}from"./Mesh.CGvkqT3f.js";import{n as t}from"./stage.D7zUf1OV.js";var n=class{constructor(e,{width:n=e.canvas.width,height:r=e.canvas.height,target:i=e.FRAMEBUFFER,color:a=1,depth:o=!0,stencil:s=!1,depthTexture:c=!1,wrapS:l=e.CLAMP_TO_EDGE,wrapT:u=e.CLAMP_TO_EDGE,wrapR:d=e.CLAMP_TO_EDGE,minFilter:f=e.LINEAR,magFilter:p=f,type:m=e.UNSIGNED_BYTE,format:h=e.RGBA,internalFormat:g=h,unpackAlignment:_,premultiplyAlpha:v}={}){this.gl=e,this.width=n,this.height=r,this.depth=o,this.stencil=s,this.buffer=this.gl.createFramebuffer(),this.target=i,this.gl.renderer.bindFramebuffer(this),this.textures=[];let y=[];for(let i=0;i<a;i++)this.textures.push(new t(e,{width:n,height:r,wrapS:l,wrapT:u,wrapR:d,minFilter:f,magFilter:p,type:m,format:h,internalFormat:g,unpackAlignment:_,premultiplyAlpha:v,flipY:!1,generateMipmaps:!1})),this.textures[i].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+i,this.gl.TEXTURE_2D,this.textures[i].texture,0),y.push(this.gl.COLOR_ATTACHMENT0+i);y.length>1&&this.gl.renderer.drawBuffers(y),this.texture=this.textures[0],c&&(this.gl.renderer.isWebgl2||this.gl.renderer.getExtension(`WEBGL_depth_texture`))?(this.depthTexture=new t(e,{width:n,height:r,minFilter:this.gl.NEAREST,magFilter:this.gl.NEAREST,format:this.stencil?this.gl.DEPTH_STENCIL:this.gl.DEPTH_COMPONENT,internalFormat:e.renderer.isWebgl2?this.stencil?this.gl.DEPTH24_STENCIL8:this.gl.DEPTH_COMPONENT16:this.gl.DEPTH_COMPONENT,type:this.stencil?this.gl.UNSIGNED_INT_24_8:this.gl.UNSIGNED_INT}),this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.stencil?this.gl.DEPTH_STENCIL_ATTACHMENT:this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(o&&!s&&(this.depthBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,n,r),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.RENDERBUFFER,this.depthBuffer)),s&&!o&&(this.stencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,n,r),this.gl.framebufferRenderbuffer(this.target,this.gl.STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.stencilBuffer)),o&&s&&(this.depthStencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,n,r),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.depthStencilBuffer))),this.gl.renderer.bindFramebuffer({target:this.target})}setSize(e,t){if(this.width!==e||this.height!==t){this.width=e,this.height=t,this.gl.renderer.bindFramebuffer(this);for(let n=0;n<this.textures.length;n++)this.textures[n].width=e,this.textures[n].height=t,this.textures[n].needsUpdate=!0,this.textures[n].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+n,this.gl.TEXTURE_2D,this.textures[n].texture,0);this.depthTexture?(this.depthTexture.width=e,this.depthTexture.height=t,this.depthTexture.needsUpdate=!0,this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(this.depthBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,e,t)),this.stencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,e,t)),this.depthStencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,e,t))),this.gl.renderer.bindFramebuffer({target:this.target})}}},r=class extends e{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}},i=`#version 300 es\r
in vec2 position;\r
in vec2 uv;\r
out vec2 vUv;\r
\r
void main() {\r
  vUv = uv;\r
  gl_Position = vec4(position, 0.0, 1.0);\r
}\r
`,a=`#version 300 es\r
precision highp float;\r
\r
// Field pass for the hero halftone (and the About orb): one texel per dot cell (texel (i, j) = cell column i,\r
// row j from the top). Every pixel of a cell shares the value at the cell centre, so the\r
// noise is evaluated once per cell here instead of once per pixel in seam-halftone.frag.\r
\r
uniform vec2 uSize;   // view size, CSS px\r
uniform float uCell;  // current dot cell, CSS px\r
uniform float uTime;\r
\r
out vec4 fragColor;\r
\r
// Ashima / Stefan Gustavson 3D simplex noise (MIT).\r
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }\r
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }\r
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }\r
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }\r
float snoise(vec3 v) {\r
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);\r
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);\r
  vec3 i = floor(v + dot(v, C.yyy));\r
  vec3 x0 = v - i + dot(i, C.xxx);\r
  vec3 g = step(x0.yzx, x0.xyz);\r
  vec3 l = 1.0 - g;\r
  vec3 i1 = min(g.xyz, l.zxy);\r
  vec3 i2 = max(g.xyz, l.zxy);\r
  vec3 x1 = x0 - i1 + C.xxx;\r
  vec3 x2 = x0 - i2 + C.yyy;\r
  vec3 x3 = x0 - D.yyy;\r
  i = mod289(i);\r
  vec4 p = permute(permute(permute(\r
    i.z + vec4(0.0, i1.z, i2.z, 1.0))\r
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))\r
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));\r
  float n_ = 0.142857142857;\r
  vec3 ns = n_ * D.wyz - D.xzx;\r
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);\r
  vec4 x_ = floor(j * ns.z);\r
  vec4 y_ = floor(j - 7.0 * x_);\r
  vec4 x = x_ * ns.x + ns.yyyy;\r
  vec4 y = y_ * ns.x + ns.yyyy;\r
  vec4 h = 1.0 - abs(x) - abs(y);\r
  vec4 b0 = vec4(x.xy, y.xy);\r
  vec4 b1 = vec4(x.zw, y.zw);\r
  vec4 s0 = floor(b0) * 2.0 + 1.0;\r
  vec4 s1 = floor(b1) * 2.0 + 1.0;\r
  vec4 sh = -step(h, vec4(0.0));\r
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;\r
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;\r
  vec3 p0 = vec3(a0.xy, h.x);\r
  vec3 p1 = vec3(a0.zw, h.y);\r
  vec3 p2 = vec3(a1.xy, h.z);\r
  vec3 p3 = vec3(a1.zw, h.w);\r
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));\r
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;\r
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);\r
  m = m * m;\r
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));\r
}\r
\r
vec3 hsv2rgb(vec3 c) {\r
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\r
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\r
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\r
}\r
\r
// Chromatic theme hero settings, mapped from its UI scale to shader units.\r
const float FREQUENCY = 1.19;\r
const float SPEED = 0.15;\r
const float GAMMA = 2.08;\r
\r
void main() {\r
  vec2 center = (floor(gl_FragCoord.xy) + 0.5) * uCell;\r
  vec2 uv = center / uSize;\r
  float aspect = uSize.x / uSize.y;\r
\r
  // The rainbow's luminance swings as the hue sweeps, so |noise| turns into nested bands.\r
  vec2 fuv = (uv - 0.5) * vec2(aspect, 1.0) + 0.5;\r
  float hue = abs(snoise(vec3(fuv * FREQUENCY, 10.0 + uTime * SPEED)));\r
  float g = dot(hsv2rgb(vec3(hue, 1.0, 1.0)), vec3(0.3, 0.59, 0.11));\r
  fragColor = vec4(pow(clamp(g, 1e-4, 1.0), GAMMA), 0.0, 0.0, 1.0);\r
}\r
`;export{n as i,i as n,r,a as t};