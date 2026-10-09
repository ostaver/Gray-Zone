import{a as e,i as t,n,r,t as i}from"./gsap.BXPkAgYx.js";import{r as a,t as o}from"./Mesh.CGvkqT3f.js";import{t as s}from"./stage.D7zUf1OV.js";import{i as c,n as l,r as u,t as d}from"./seam-field.frag.D9bWeYpc.js";import{i as f,t as p}from"./lifecycle.CVzH-n48.js";import{i as m,n as h,r as g,t as _}from"./zone.BsKkgWEL.js";import{t as v}from"./magnetic.BE5U7AJe.js";import{t as y}from"./platform.5cNBRVwX.js";var b=`#version 300 es\r
precision highp float;\r
\r
// Hero field: the Chromatic theme's "Chromatic Waves" (the luminance of a slowly drifting\r
// simplex rainbow, drawn as a dot grid) in the logo's colours, split by the torn seam.\r
// The noise itself is evaluated once per cell by seam-field.frag into \`uField\`.\r
\r
// View geometry (device px, gl_FragCoord space) and CSS-px scale.\r
uniform vec2 uRes;\r
uniform vec2 uOffset;\r
uniform float uDpr;\r
\r
uniform sampler2D uField;   // per-cell field, texel (column, row from top); see seam-field.frag\r
uniform float uCell;        // current dot cell, CSS px (grows as the hero scrolls away)\r
uniform vec4 uSeam[32];     // 128 seam x positions (fraction of width), top → bottom\r
uniform vec2 uMouse;        // CSS px, top-left origin\r
uniform float uMouseForce;  // 0..1, pointer speed\r
uniform float uReveal;      // 0..1 intro wave\r
uniform float uProgress;    // 0..1 scroll through hero\r
uniform float uWhiteZone;   // 0 = black zone, 1 = white zone\r
\r
out vec4 fragColor;\r
\r
float hash11(float p) {\r
  p = fract(p * 0.1031);\r
  p *= p + 33.33;\r
  p *= p + p;\r
  return fract(p);\r
}\r
\r
// 1D gradient noise, roughly -1..1: the tear's fibre only varies along its length.\r
float gnoise(float x) {\r
  float i = floor(x);\r
  float f = fract(x);\r
  float u = f * f * (3.0 - 2.0 * f);\r
  float g0 = hash11(i) * 2.0 - 1.0;\r
  float g1 = hash11(i + 1.0) * 2.0 - 1.0;\r
  return mix(g0 * f, g1 * (f - 1.0), u) * 2.0;\r
}\r
\r
// One entry of the packed seam array. Component select via mask: dynamic vector indexing\r
// is emulated (slowly) on several GPU drivers.\r
float seamSample(int i) {\r
  vec4 v = uSeam[i >> 2];\r
  return dot(v, vec4(equal(ivec4(i & 3), ivec4(0, 1, 2, 3))));\r
}\r
\r
// Seam x (fraction of width) at vertical position y (0 = top), linearly interpolated.\r
float seamAt(float y) {\r
  float f = clamp(y, 0.0, 1.0) * 127.0;\r
  int i = int(floor(f));\r
  return mix(seamSample(i), seamSample(min(i + 1, 127)), fract(f));\r
}\r
\r
float disc(vec2 p, float r, float aa) {\r
  return 1.0 - smoothstep(r - aa, r + aa, length(p));\r
}\r
\r
const vec3 PAPER = vec3(0.937, 0.925, 0.902);\r
const vec3 RED = vec3(0.890, 0.149, 0.122);\r
\r
// Chromatic theme hero setting, mapped from its UI scale to shader units.\r
const float BIAS = -0.1;\r
\r
// Five-stop ramp, darkest (transparent) → brightest; branchless piecewise-linear.\r
vec4 ramp(vec4 a, vec4 b, vec4 c, vec4 d, vec4 e, float g) {\r
  float s = g * 4.0;\r
  vec4 col = mix(a, b, clamp(s, 0.0, 1.0));\r
  col = mix(col, c, clamp(s - 1.0, 0.0, 1.0));\r
  col = mix(col, d, clamp(s - 2.0, 0.0, 1.0));\r
  return mix(col, e, clamp(s - 3.0, 0.0, 1.0));\r
}\r
// The logo's halves: red on the honest side; black with cream lettering in the gray zone.\r
vec4 honest(float g) {\r
  return ramp(vec4(RED, 0.0), vec4(0.227, 0.031, 0.024, 1.0), vec4(0.478, 0.063, 0.047, 1.0), vec4(0.722, 0.102, 0.078, 1.0), vec4(RED, 1.0), g);\r
}\r
vec4 grayZone(float g) {\r
  return ramp(\r
    vec4(0.227, 0.227, 0.227, 0.0),\r
    vec4(mix(vec3(0.118), vec3(0.78, 0.78, 0.76), uWhiteZone), 1.0),\r
    vec4(mix(vec3(0.227), vec3(0.541, 0.541, 0.525), uWhiteZone), 1.0),\r
    vec4(mix(vec3(0.541, 0.541, 0.525), vec3(0.227), uWhiteZone), 1.0),\r
    vec4(mix(PAPER, vec3(0.039), uWhiteZone), 1.0),\r
    g\r
  );\r
}\r
\r
void main() {\r
  vec2 px = gl_FragCoord.xy - uOffset;\r
  vec2 size = uRes / uDpr;\r
  vec2 css = vec2(px.x, uRes.y - px.y) / uDpr;\r
  float aspect = size.x / size.y;\r
\r
  // ── Dot grid ───────────────────────────────────────────────\r
  float cell = uCell;\r
  vec2 cellIdx = floor(css / cell);\r
  vec2 center = (cellIdx + 0.5) * cell;\r
  vec2 local = (css - center) / cell;\r
  vec2 uv = center / size;\r
\r
  float g = texelFetch(uField, ivec2(cellIdx), 0).r + BIAS;\r
\r
  // Pointer lens: dots swell where you look, harder when you move fast.\r
  vec2 dm = center - uMouse;\r
  float lens = exp(-dot(dm, dm) / (2.0 * 150.0 * 150.0));\r
  g += lens * (0.16 + 0.3 * uMouseForce);\r
\r
  // Vignette, and the intro: the field develops in a wave expanding from the centre.\r
  float rd = length((uv - 0.5) * vec2(aspect, 1.0));\r
  float reveal = smoothstep(rd, rd + 0.35, uReveal * 1.45);\r
  float vignette = 1.0 - smoothstep(0.35, 1.0, length(uv - 0.5) * 1.41421);\r
  g = clamp(g, 0.0, 1.0) * reveal * vignette;\r
  float radius = g * 0.5;\r
\r
  // Signed distance to the tear, per pixel: dots on the line are torn in two, like the logo.\r
  float dp = css.x - seamAt(css.y / size.y) * size.x;\r
  float side = smoothstep(-0.75, 0.75, dp);\r
\r
  // Chromatic split: channels drift apart horizontally near the tear.\r
  float band = exp(-abs(dp) / (cell * 2.5));\r
  float shift = band * (0.28 + 0.2 * uMouseForce);\r
  float aa = 0.9 / (cell * uDpr);\r
  float mR = disc(local + vec2(shift, 0.0), radius, aa);\r
  float mG = disc(local, radius, aa);\r
  float mB = disc(local - vec2(shift, 0.0), radius, aa);\r
\r
  vec4 col = mix(honest(g), grayZone(g), side);\r
  // Lens tint: in the gray zone, looking closely reveals a trace of red.\r
  col.rgb = mix(col.rgb, RED, lens * side * 0.35);\r
\r
  vec3 rgb = col.rgb * col.a * vec3(mR, mG, mB);\r
  float alpha = max(max(mR, mG), mB) * col.a;\r
\r
  // Gray side sits in the shadow of the torn paper.\r
  float shadow = exp(-max(dp, 0.0) / 22.0) * step(0.0, dp) * 0.6;\r
  rgb *= 1.0 - shadow;\r
\r
  // ── Torn paper edge (per pixel, not halftoned) ──────────────\r
  float fibre = gnoise(css.y * 0.045 + 7.0) * 0.5 + 0.5;\r
  float jitter = hash11(floor(css.y * 0.5));\r
  float w = (1.2 + 3.2 * fibre * fibre + 1.4 * jitter) * reveal;\r
  float edge = 1.0 - smoothstep(w - 0.8, w + 0.8, abs(dp + w * 0.5));\r
  // Fine hairs escaping the tear.\r
  float hair = step(0.965, hash11(floor(css.y * 0.8) + 11.0)) * (1.0 - smoothstep(0.0, 7.0 + 8.0 * jitter, -dp)) * step(dp, 0.0);\r
  edge = max(edge, hair * 0.7) * (1.0 - uProgress * 0.6);\r
\r
  rgb = mix(rgb, mix(PAPER, vec3(0.38), uWhiteZone), edge);\r
  alpha = mix(alpha, 1.0, edge);\r
\r
  // Fade toward the section bottom so the field dissolves into the page.\r
  float fade = 1.0 - smoothstep(0.72, 1.0, css.y / size.y);\r
  fragColor = vec4(rgb, alpha) * fade;\r
}\r
`;function x(e,t){let{gl:n,renderer:r}=e,i=Array.from(t.state.seam),s=new u(n),f=new c(n,{width:1,height:1,depth:!1,minFilter:n.NEAREST,magFilter:n.NEAREST}),p=new a(n,{vertex:l,fragment:d,depthTest:!1,depthWrite:!1,uniforms:{uSize:{value:[1,1]},uCell:{value:t.cell},uTime:{value:0}}}),m=new o(n,{geometry:s,program:p}),h=new a(n,{vertex:l,fragment:b,depthTest:!1,depthWrite:!1,uniforms:{uRes:{value:[1,1]},uOffset:{value:[0,0]},uDpr:{value:1},uField:{value:f.texture},uCell:{value:t.cell},uSeam:{value:i},uMouse:{value:[-1e4,-1e4]},uMouseForce:{value:0},uReveal:{value:0},uProgress:{value:0},uWhiteZone:{value:t.state.whiteZone}}}),g=new o(n,{geometry:s,program:h}),_=p.uniforms,v=h.uniforms,y=0;return{el:t.el,fps:t.fps,render(e){let{state:a}=t;a.still||(y=e.time);let o=e.width/e.dpr,s=e.height/e.dpr,c=t.cell*(1+a.progress*.9);f.setSize(Math.ceil(o/t.cell)+1,Math.ceil(s/t.cell)+1);let l=Math.min(f.width,Math.ceil(o/c)+1),u=Math.min(f.height,Math.ceil(s/c)+1);_.uSize.value=[o,s],_.uCell.value=c,_.uTime.value=y,r.bindFramebuffer(f),n.disable(n.SCISSOR_TEST),n.viewport(0,0,l,u),Object.assign(r.state.viewport,{x:0,y:0,width:l,height:u}),m.draw(),e.bindScreen(),v.uRes.value=[e.width,e.height],v.uOffset.value=[e.x,e.y],v.uDpr.value=e.dpr,v.uCell.value=c;for(let e=0;e<i.length;e++)i[e]=a.seam[e];v.uMouse.value=[a.mouse.x,a.mouse.y],v.uMouseForce.value=a.mouseForce,v.uReveal.value=a.reveal,v.uProgress.value=a.progress,v.uWhiteZone.value=a.whiteZone,g.draw()},dispose(){h.remove(),p.remove(),s.remove(),n.deleteFramebuffer(f.buffer),n.deleteTexture(f.texture.texture)}}}var ee=class{xs=new Float32Array(128);split=.5;velocity=0;profile=new Float32Array(128);bend=0;bendY=.5;constructor(e=7){let t=e,n=()=>(t=t*16807%2147483647,(t-1)/2147483646),r=0,i=0;for(let e=0;e<128;e++)n()<.12&&(i=(n()-.5)*.012),i*=.85,r+=i+(n()-.5)*.006,r*=.94,this.profile[e]=r;for(let e=0;e<2;e++)for(let e=1;e<127;e++)this.profile[e]=(this.profile[e-1]+this.profile[e]*2+this.profile[e+1])/4;let a=this.profile.reduce((e,t)=>e+t,0)/128;for(let e=0;e<128;e++)this.profile[e]-=a}update({time:e,dt:t,target:n,pointer:r,progress:i,still:a}){let o=Math.min(t,1/30);this.velocity+=((n-this.split)*38-this.velocity*11)*o,this.split+=this.velocity*o;let s=r?Math.max(-.14,Math.min(.14,(r.x-this.split)*.45)):0;this.bend+=(s-this.bend)*Math.min(1,o*6),r&&(this.bendY+=(r.y-this.bendY)*Math.min(1,o*8));let c=-(i**2.4)*.95,l=a?0:e;for(let e=0;e<128;e++){let t=e/127,n=(t-this.bendY)/.22,r=Math.sin(t*9+l*1.1)*.004+Math.sin(t*23-l*.7)*.002;this.xs[e]=this.split+c+this.profile[e]+r+this.bend*Math.exp(-n*n)}return this.xs}at(e){let t=Math.min(1,Math.max(0,e))*127,n=Math.floor(t),r=Math.min(n+1,127);return this.xs[n]+(this.xs[r]-this.xs[n])*(t-n)}clipPolygon(e,t,n,r){let i=[],a=1e4,o=e===`left`?-1e4:a,s=[],c=[];for(let e=0;e<=32;e++){let i=e/32*(t.height+80)-40,a=this.at((t.top+i*t.sy)/r)*n;s.push(((a-t.left)/t.sx).toFixed(1)),c.push(i)}return i.push(`${o}px -10000px`,`${s[0]}px -10000px`),s.forEach((e,t)=>i.push(`${e}px ${c[t].toFixed(1)}px`)),i.push(`${s[32]}px ${a}px`,`${o}px ${a}px`),`polygon(${i.join(`,`)})`}};function S(e,t){let n=Math.sin(e*127.1+t*311.7)*43758.5453;return n-Math.floor(n)}function C(e,t){let n=e;return[n.offsetLeft+n.offsetWidth/2-t.offsetWidth/2,n.offsetTop+n.offsetHeight/2-t.offsetHeight/2]}function w(e,t,n){let[r,i]=C(e,t),a=Math.atan2(i,r)+(S(n,1)-.5)*.6,o=Math.hypot(window.innerWidth,window.innerHeight)*(.7+S(n,2)*.35);return{x:Math.cos(a)*o,y:Math.sin(a)*o,rotation:(S(n,3)-.5)*300}}function T(a){let o=a.querySelector(`[data-hero-pin]`),c=a.querySelector(`[data-hero-gl]`),l=[...a.querySelectorAll(`[data-seam-clip]`)],u=a.querySelector(`[data-side="honest"]`),d=a.querySelector(`[data-side="gray"]`),b=n.matches,S=window.matchMedia(`(max-height: 520px) and (orientation: landscape)`),T=new AbortController,E=!0;a.dataset.live=``;let D=new ee,O={seam:D.xs,mouse:{x:-1e4,y:-1e4},mouseForce:0,reveal:+!!b,progress:0,whiteZone:+(_()===`white`),still:b},k=[u,d];k.forEach(e=>e.setAttribute(`aria-pressed`,String(e.dataset.zone===_()))),k.forEach(e=>{e.addEventListener(`click`,()=>void m(e.dataset.zone===`white`?`white`:`black`,e),{signal:T.signal})});let te=g(e=>{O.whiteZone=+(e===`white`),k.forEach(t=>t.setAttribute(`aria-pressed`,String(t.dataset.zone===e))),N?.draw()}),ne=h(e=>{e?a.setAttribute(`aria-busy`,`true`):a.removeAttribute(`aria-busy`),k.forEach(t=>e?t.setAttribute(`aria-disabled`,`true`):t.removeAttribute(`aria-disabled`))}),A=D.split,j=null,M=b,N=s(),P;N&&(P=N.add(x(N,{el:c,cell:i.matches?13:16,fps:i.matches?30:60,state:O})));let F=a.querySelector(`.hero__title`),I=1,L=1,R=0,z=0,B=parseFloat(getComputedStyle(o).paddingInlineStart);window.addEventListener(`resize`,()=>{B=parseFloat(getComputedStyle(o).paddingInlineStart)},{signal:T.signal});let V=l.map(()=>({shown:!1,left:0,top:0,width:1,height:1,sx:1,sy:1})),H=()=>{let e=o.getBoundingClientRect();I=e.width,L=e.height;let t=F.getBoundingClientRect();R=t.top-e.top,z=t.height,l.forEach((t,n)=>{let r=V[n];if(r.shown=t.offsetWidth>0,!r.shown)return;let i=t.getBoundingClientRect();r.width=t.offsetWidth,r.height=t.offsetHeight||1,r.left=i.left-e.left,r.top=i.top-e.top,r.sx=i.width/r.width||1,r.sy=i.height/r.height||1})},U={x:0,y:0,t:0},W=0;o.addEventListener(`pointermove`,e=>{if(e.target instanceof Element&&e.target.closest(`button[data-zone]`))return;let t=o.getBoundingClientRect(),n=e.clientX-t.left,r=e.clientY-t.top,i=performance.now(),a=Math.max(1,i-U.t);W=Math.max(W,Math.hypot(n-U.x,r-U.y)/a),U={x:n,y:r,t:i},O.mouse.x=n,O.mouse.y=r,j={x:n/t.width,y:r/t.height}},{signal:T.signal}),o.addEventListener(`pointerleave`,()=>{j=null,O.mouse.x=O.mouse.y=-1e4},{signal:T.signal});let G=!0,K=new IntersectionObserver(([e])=>G=e.isIntersecting);K.observe(a);let q=0,J=e=>{let t=q?e-q:1/60;if(q=e,!G)return;M&&(A=b?.5:j?.1+j.x*.8:.5+Math.sin(e*.35)*.07+Math.sin(e*.13)*.04),W*=.9,O.mouseForce+=(Math.min(1,W/2.2)-O.mouseForce)*.12,D.update({time:e,dt:t,target:A,pointer:b?null:j,progress:O.progress,still:b}),H();let n=S.matches,r=u.offsetWidth,i=d.offsetWidth,a=n?0:Math.max(u.offsetHeight,d.offsetHeight);for(let e=0;e<l.length;e++){if(!V[e].shown)continue;let t=l[e].dataset.seamClip===`left`?`left`:`right`;l[e].style.clipPath=D.clipPolygon(t,V[e],I,L)}let o=n?R+z/2:Math.max(a/2,R-a/2-B/4),s,c;if(n)s=B,c=I-B-i;else{let e=Math.min(18,Math.max(0,(I-2*B-r-i)/2)),t=D.at(o/L)*I,n=Math.max(B+r+e,Math.min(I-B-i-e,t));s=n-r-e,c=n+e}u.style.transform=`translate3d(${s}px, ${o}px, 0) translateY(-50%)`,d.style.transform=`translate3d(${c}px, ${o}px, 0) translateY(-50%)`};e.ticker.add(J);let re=a.querySelectorAll(`[data-hero-fade]`),Y=b?[]:[...a.querySelectorAll(`.hero__layer`)].map(e=>r.create(e.querySelectorAll(`.hero__line`),{type:`chars`})),X=e.matchMedia();b||X.add(`(min-width: 761px) and (min-height: 521px)`,()=>{t.create({trigger:a,start:`top top`,end:`bottom bottom`,scrub:!0,onUpdate:e=>{O.progress=e.progress}});let n=e.timeline({scrollTrigger:{trigger:a,start:`top top`,end:`bottom bottom`,scrub:.6,invalidateOnRefresh:!0}}).to(F,{yPercent:-18,scale:.92,duration:.85,ease:`none`},0).to([...a.querySelectorAll(`.hero__lead, .hero__facts`)],{opacity:0,y:-40,ease:`power1.in`,duration:.4},0),r=Y[0].chars.map((e,t)=>({i:t,d:Math.hypot(...C(e,F))})).sort((e,t)=>e.d-t.d),i=new Map(r.map(({i:e},t)=>[e,t/Math.max(1,r.length-1)]));return Y.forEach(({chars:e})=>e.forEach((e,t)=>{let r=()=>w(e,F,t);n.to(e,{x:()=>r().x,y:()=>r().y,rotation:()=>r().rotation,duration:.55,ease:`power2.in`},.05+(i.get(t)??0)*.15)})),()=>{O.progress=0}});let Z=a.querySelector(`[data-os-label]`),Q=y();Z&&Q&&(Z.textContent=`· ${Z.dataset[Q]}`),a.querySelectorAll(`[data-magnetic]`).forEach(e=>v(e,.3));let $;if(f(()=>{E=!1,T.abort(),K.disconnect(),e.ticker.remove(J),X.revert(),$?.kill(),Y.forEach(e=>e.revert()),te(),ne(),P?.()}),b)return;let ie=Y.flatMap(e=>e.chars);e.set(ie,{yPercent:115}),e.set(a.querySelector(`.hero__scroll`),{opacity:0}),p.then(()=>{if(!E)return;let t=Y.map(e=>e.chars),n=$=e.timeline({onComplete:()=>F.classList.add(`is-free`)});n.to(O,{reveal:1,duration:2.4,ease:`power2.out`},0),t.forEach(e=>n.to(e,{yPercent:0,duration:1.5,stagger:.045},.15)),n.add(()=>{M=!0,A=.5},.1),n.to(re,{opacity:1,y:0,duration:.35,stagger:.04},0),n.to([u,d],{opacity:1,duration:.35},0)})}var E=document.querySelector(`[data-hero]`);E&&T(E);