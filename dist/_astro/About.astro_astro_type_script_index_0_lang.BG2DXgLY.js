import{a as e,i as t,n,t as r}from"./gsap.BXPkAgYx.js";import{t as i}from"./reveal.D7rpJtqI.js";import{i as a,r as o,t as s}from"./Mesh.CGvkqT3f.js";import{n as c,t as l}from"./stage.D7zUf1OV.js";import{i as u,n as d,r as f,t as p}from"./seam-field.frag.D9bWeYpc.js";import{t as m}from"./colour.BxHHUILU.js";import{r as h}from"./zone.BsKkgWEL.js";var g=`#version 300 es\r
precision highp float;\r
\r
// About section: the logo disc as a halftone print that turns with scroll. Red disc, the dark\r
// half on the gray-zone side of the tear, and the wordmark split across the tear, all in the\r
// disc's own (rotated) frame. Dot sizes breathe with the hero's noise field (seam-field.frag,\r
// one texel per dot cell, the disc centre at texel \`uFieldHalf\`).\r
\r
// View geometry (device px, gl_FragCoord space) and CSS-px scale.\r
uniform vec2 uRes;\r
uniform vec2 uOffset;\r
uniform float uDpr;\r
\r
uniform sampler2D uField;\r
uniform float uFieldHalf;\r
uniform float uCell;        // dot cell, CSS px\r
uniform float uRadius;      // disc radius, CSS px\r
uniform sampler2D uLetters; // wordmark coverage in .a; the square around the disc, top row first\r
uniform float uAngle;       // radians, clockwise on screen\r
uniform vec2 uMouse;        // CSS px, view top-left origin\r
uniform float uReveal;      // 0..1, the disc develops from its centre\r
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
// 1D gradient noise, roughly -1..1 (as in seam-halftone.frag).\r
float gnoise(float x) {\r
  float i = floor(x);\r
  float f = fract(x);\r
  float u = f * f * (3.0 - 2.0 * f);\r
  float g0 = hash11(i) * 2.0 - 1.0;\r
  float g1 = hash11(i + 1.0) * 2.0 - 1.0;\r
  return mix(g0 * f, g1 * (f - 1.0), u) * 2.0;\r
}\r
\r
float disc(vec2 p, float r, float aa) {\r
  return 1.0 - smoothstep(r - aa, r + aa, length(p));\r
}\r
\r
// The tear's x offset (CSS px) at height y in the disc frame: ripped by hand, not ruled.\r
float tearAt(float y) {\r
  return (gnoise(y * 0.045 + 3.0) * 0.6 + gnoise(y * 0.19 + 9.0) * 0.25) * uCell * 0.55;\r
}\r
\r
const vec3 PAPER = vec3(0.937, 0.925, 0.902);\r
const vec3 RED = vec3(0.890, 0.149, 0.122);\r
const vec3 RED_DEEP = vec3(0.620, 0.082, 0.063);\r
const vec3 INK = vec3(0.039);\r
const vec3 DARK_LO = vec3(0.075);\r
const vec3 DARK_HI = vec3(0.19);\r
\r
// The dark half's radius as a fraction of the disc (the logo: 12.4 of 16).\r
const float INNER = 0.775;\r
\r
void main() {\r
  vec2 px = gl_FragCoord.xy - uOffset;\r
  vec2 size = uRes / uDpr;\r
  vec2 css = vec2(px.x, uRes.y - px.y) / uDpr;\r
  vec2 mid = size * 0.5;\r
  float cs = cos(uAngle);\r
  float sn = sin(uAngle);\r
\r
  // Into the disc's frame (y down): the grid, the tear and the letters all turn together.\r
  vec2 p = css - mid;\r
  vec2 q = vec2(cs * p.x + sn * p.y, -sn * p.x + cs * p.y);\r
\r
  // ── Dots ───────────────────────────────────────────────────\r
  vec2 cellIdx = floor(q / uCell);\r
  vec2 center = (cellIdx + 0.5) * uCell;\r
  vec2 local = (q - center) / uCell;\r
  float rc = length(center) / uRadius;\r
  ivec2 texel = clamp(ivec2(cellIdx + uFieldHalf), ivec2(0), textureSize(uField, 0) - 1);\r
  float g = texelFetch(uField, texel, 0).r;\r
\r
  // Pointer lens, in screen space: dots swell where you look.\r
  vec2 dm = vec2(cs * center.x - sn * center.y, sn * center.x + cs * center.y) + mid - uMouse;\r
  float lens = exp(-dot(dm, dm) / (2.0 * 70.0 * 70.0));\r
\r
  // Develops from the centre on first view; the rim dissolves into ever smaller dots.\r
  float reveal = smoothstep(rc, rc + 0.35, uReveal * 1.4);\r
  float rim = 1.0 - smoothstep(0.74, 1.0, rc);\r
  // Dense enough that the disc reads as solid colour with a print texture; past 0.5 the dots\r
  // meet their neighbours and the noise shows as slow waves of merging.\r
  float radius = (0.42 + 0.2 * g + 0.14 * lens) * rim * reveal;\r
\r
  // Signed distance to the tear per pixel: dots on the line are torn in two, like the logo.\r
  float dp = q.x - tearAt(q.y);\r
  float side = smoothstep(-0.6, 0.6, dp);\r
  // Which half a dot belongs to is decided per cell, so the dark half's rim stays whole dots.\r
  float darkCell = step(0.0, center.x - tearAt(center.y)) * step(rc, INNER);\r
\r
  vec3 honest = mix(RED_DEEP, RED, smoothstep(0.0, 0.8, g + lens * 0.4));\r
  vec3 dark = mix(DARK_LO, DARK_HI, g);\r
  // Looking closely into the dark half reveals a trace of red, as in the hero's gray zone.\r
  dark = mix(dark, RED, lens * 0.3);\r
  vec3 col = mix(honest, mix(honest, dark, darkCell), side);\r
\r
  // Chromatic split: channels drift apart near the tear.\r
  float band = exp(-abs(dp) / (uCell * 2.0));\r
  float shift = band * 0.24;\r
  float aa = 0.9 / (uCell * uDpr);\r
  float mR = disc(local + vec2(shift, 0.0), radius, aa);\r
  float mG = disc(local, radius, aa);\r
  float mB = disc(local - vec2(shift, 0.0), radius, aa);\r
  vec3 rgb = col * vec3(mR, mG, mB);\r
  float alpha = max(max(mR, mG), mB);\r
\r
  // The dark side sits in the shadow of the torn paper.\r
  rgb *= 1.0 - exp(-max(dp, 0.0) / 9.0) * step(0.0, dp) * 0.55;\r
\r
  // The dark half is solid ink under its dots, as in the logo. Invisible on the black zone's\r
  // ink page; on the white zone it keeps the half dark and the paper letters legible.\r
  float rq = length(q);\r
  float base = side * (1.0 - smoothstep(INNER * uRadius - 0.75, INNER * uRadius + 0.75, rq)) * smoothstep(rq / uRadius, rq / uRadius + 0.35, uReveal * 1.4);\r
  rgb += INK * base * (1.0 - alpha);\r
  alpha += base * (1.0 - alpha);\r
\r
  // ── Wordmark: solid ink on the red, paper on the dark ──────\r
  float letters = texture(uLetters, q / (2.0 * uRadius) + 0.5).a * smoothstep(0.55, 1.0, uReveal);\r
  rgb = mix(rgb, mix(INK, PAPER, side), letters);\r
  alpha = mix(alpha, 1.0, letters);\r
\r
  // ── Torn paper edge (per pixel), overshooting the rim a touch, like the logo ──\r
  float fibre = gnoise(q.y * 0.07 + 7.0) * 0.5 + 0.5;\r
  float jitter = hash11(floor(q.y * 0.5));\r
  float w = 0.9 + 2.2 * fibre * fibre + 0.8 * jitter;\r
  float edge = 1.0 - smoothstep(w - 0.7, w + 0.7, abs(dp + w * 0.5));\r
  edge *= (1.0 - smoothstep(1.0, 1.05, abs(q.y) / uRadius)) * smoothstep(0.2, 0.7, uReveal);\r
  rgb = mix(rgb, PAPER, edge);\r
  alpha = mix(alpha, 1.0, edge);\r
\r
  fragColor = vec4(rgb, alpha);\r
}\r
`,_=1024,v=`"Oswald Variable"`;function y(e,t){let n=e.getContext(`2d`),r=e.width;n.clearRect(0,0,r,r),n.fillStyle=`#fff`,n.textBaseline=`alphabetic`,n.font=`700 100px ${v}`;let i=Math.max(...t.map(e=>n.measureText(e).width)),a=n.measureText(t.join(``)).actualBoundingBoxAscent;n.font=`700 ${Math.min(r*.5/i,r*.33/(a*t.length*1.12))*100}px ${v}`;let o=n.measureText(t.join(``)).actualBoundingBoxAscent,s=o*.12,c=r/2-(t.length*o+(t.length-1)*s)/2+o;for(let e of t){let t=[...e],i=t.slice(0,Math.ceil(t.length/2)).join(``);n.fillText(e,r/2-n.measureText(i).width,c),c+=o+s}}function b(e,t){let{gl:n,renderer:r}=e,i=new f(n),a=new u(n,{width:1,height:1,depth:!1,minFilter:n.NEAREST,magFilter:n.NEAREST}),l=new o(n,{vertex:d,fragment:p,depthTest:!1,depthWrite:!1,uniforms:{uSize:{value:[1,1]},uCell:{value:t.cell},uTime:{value:0}}}),m=new s(n,{geometry:i,program:l}),h=new c(n,{generateMipmaps:!1,flipY:!1,minFilter:n.LINEAR,magFilter:n.LINEAR}),b=document.createElement(`canvas`);b.width=b.height=_,document.fonts.load(`700 100px ${v}`,t.lines.join(``)).then(()=>{y(b,t.lines),h.image=b,h.needsUpdate=!0});let x=new o(n,{vertex:d,fragment:g,depthTest:!1,depthWrite:!1,uniforms:{uRes:{value:[1,1]},uOffset:{value:[0,0]},uDpr:{value:1},uField:{value:a.texture},uFieldHalf:{value:0},uCell:{value:t.cell},uRadius:{value:1},uLetters:{value:h},uAngle:{value:0},uMouse:{value:[-1e4,-1e4]},uReveal:{value:0}}}),S=new s(n,{geometry:i,program:x}),C=l.uniforms,w=x.uniforms,T=0;return{el:t.el,fps:t.fps,render(e){let{state:i}=t;i.still||(T=e.time);let o=e.width/e.dpr,s=e.height/e.dpr,c=Math.min(o,s)/2*t.radius,l=Math.ceil(c*2/t.cell)+2;a.setSize(l,l),C.uSize.value=[l*t.cell,l*t.cell],C.uTime.value=T,r.bindFramebuffer(a),n.disable(n.SCISSOR_TEST),n.viewport(0,0,l,l),Object.assign(r.state.viewport,{x:0,y:0,width:l,height:l}),m.draw(),e.bindScreen(),w.uRes.value=[e.width,e.height],w.uOffset.value=[e.x,e.y],w.uDpr.value=e.dpr,w.uFieldHalf.value=Math.floor(l/2),w.uRadius.value=c,w.uAngle.value=i.angle,w.uMouse.value=[i.mouse.x,i.mouse.y],w.uReveal.value=i.reveal,S.draw()},dispose(){x.remove(),l.remove(),i.remove(),n.deleteFramebuffer(a.buffer),n.deleteTexture(a.texture.texture),n.deleteTexture(h.texture)}}}var x=`#version 300 es\r
// One point per dot, positioned and coloured on the CPU each frame (see views/dotBatch.ts).\r
in vec2 aPos;    // CSS px from the view's top-left (y down)\r
in vec2 aShape;  // radius (CSS px), vertical squash (1 = circle, 0 = a closed slit)\r
in vec4 aColor;  // rgb, alpha (straight)\r
\r
uniform vec2 uSize; // view size, CSS px\r
uniform float uDpr;\r
\r
out vec4 vColor;\r
out float vRadius; // device px\r
out float vSquash;\r
\r
void main() {\r
  vRadius = aShape.x * uDpr;\r
  vSquash = aShape.y;\r
  vColor = aColor;\r
  gl_Position = vec4((aPos / uSize * 2.0 - 1.0) * vec2(1.0, -1.0), 0.0, 1.0);\r
  gl_PointSize = vRadius > 0.0 ? 2.0 * vRadius + 2.0 : 0.0;\r
}\r
`,S=`#version 300 es\r
precision mediump float;\r
\r
in vec4 vColor;\r
in float vRadius;\r
in float vSquash;\r
\r
out vec4 fragColor;\r
\r
void main() {\r
  // Distance from the point centre in device px, the y axis stretched by the squash so a dot\r
  // can narrow into an ellipse (an eye opening). 1px anti-aliased rim; premultiplied out.\r
  vec2 p = (gl_PointCoord - 0.5) * (2.0 * vRadius + 2.0);\r
  p.y /= max(vSquash, 0.02);\r
  float a = clamp(vRadius - length(p) + 0.5, 0.0, 1.0) * vColor.a;\r
  if (a <= 0.0) discard;\r
  fragColor = vec4(vColor.rgb * a, a);\r
}\r
`;function C(e,t){let{gl:n}=e,r=new Float32Array(t.capacity*2),i=new Float32Array(t.capacity*2),c=new Float32Array(t.capacity*4),l=new a(n,{aPos:{size:2,data:r,usage:n.DYNAMIC_DRAW},aShape:{size:2,data:i,usage:n.DYNAMIC_DRAW},aColor:{size:4,data:c,usage:n.DYNAMIC_DRAW}}),u=new o(n,{vertex:x,fragment:S,transparent:!0,depthTest:!1,depthWrite:!1,uniforms:{uSize:{value:[1,1]},uDpr:{value:1}}}),d=new s(n,{mode:n.POINTS,geometry:l,program:u}),f=0,p={dot(e,n,a,o,s=1,l=1){f>=t.capacity||a<=0||s<=0||(r[f*2]=e,r[f*2+1]=n,i[f*2]=a,i[f*2+1]=l,c.set(o,f*4),c[f*4+3]=s,f++)}};return{el:t.el,fps:t.fps,render(e){f=0,t.fill(p,e),f!==0&&(l.attributes.aPos.needsUpdate=!0,l.attributes.aShape.needsUpdate=!0,l.attributes.aColor.needsUpdate=!0,l.setDrawRange(0,f),u.uniforms.uSize.value=[e.width/e.dpr,e.height/e.dpr],u.uniforms.uDpr.value=e.dpr,d.draw())},dispose(){u.remove(),l.remove()}}}var w=.08,T=.84,E=.13,D=2,O=1/25,k=.55,A=1400,j=[[14,17,19,21,25,17,14],[4,12,4,4,4,4,14],[14,17,1,2,4,8,31],[31,2,4,2,1,17,14],[2,6,10,18,31,2,2],[31,16,30,1,1,17,14],[6,8,16,30,17,17,14],[31,1,2,4,8,8,8],[14,17,17,14,17,17,14],[14,17,17,15,1,2,12]],M=25,N=`http://www.w3.org/2000/svg`,P=`ab-eye-clip`,F=`<defs><clipPath id="${P}"><path d="M0 10A12.5 12.5 0 0 1 20 10A12.5 12.5 0 0 1 0 10Z"/></clipPath></defs>`,I=`<g class="ab__eye-lid"><g clip-path="url(#${P})"><g class="ab__eye-iris"><circle cx="10" cy="10" r="4.5"/><path d="M11.93 8.41A2.5 2.5 0 0 1 8.41 11.93"/></g></g><path d="M.63 10A12 12 0 0 1 19.37 10A12 12 0 0 1 .63 10Z"/></g>`,L=2.8,R=1.1;function z(e,t,n){let r=document.createElementNS(N,`svg`);return r.setAttribute(`viewBox`,t),n&&r.setAttribute(`class`,n),r.innerHTML=e,r}var B=(e,t,n)=>{let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)},V=[0,0,0];function H(e,t,n){for(let r=0;r<3;r++)V[r]=e[r]+(t[r]-e[r])*n;return V}function U(e){let t=Math.sin(e*127.1+311.7)*43758.5453;return t-Math.floor(t)}function W(e){return Math.sin(e*.09)*.6+Math.sin(e*.23+1.7)*.3+Math.sin(e*.57+4.1)*.1}function G(){let e=getComputedStyle(document.documentElement);return{red:m(e,`--red`),deep:m(e,`--red-deep`),paper:m(e,`--paper`),ash:m(e,`--ash`)}}function K(e){let i=l();if(!i)return;let a=n.matches,o=window.matchMedia(`(min-width: 900px)`),s=e.querySelector(`[data-trade-pin]`),c=t=>e.querySelector(`[data-trade-art="${t}"]`),u={integrity:c(`integrity`),reputation:c(`reputation`),time:c(`time`),money:c(`money`)},d=u.integrity.dataset.word??``,f=e.querySelector(`[data-trade-day]`),p=G();h(()=>p=G());let m=[],g=[],_={left:0,right:0,top:0,bottom:0,eat:1},v={x:0,y:0,pitch:1},y=new Float32Array(175),b=(e,t)=>{let n=e.getBoundingClientRect();return{x:n.left-t.left,y:n.top-t.top,w:n.width,h:n.height}},x=()=>{let e=s.getBoundingClientRect(),t=b(u.integrity,e),n=b(u.reputation,e),r=b(u.time,e),i=b(u.money,e);if(t.w<10||t.h<10)return;let a=document.createElement(`canvas`);a.width=Math.ceil(t.w),a.height=Math.ceil(t.h);let o=a.getContext(`2d`,{willReadFrequently:!0}),c=getComputedStyle(u.integrity).getPropertyValue(`--font-display`).trim()||`sans-serif`;o.font=`700 100px ${c}`;let l=o.measureText(d),f=l.actualBoundingBoxAscent/100,p=Math.min(t.h*.92/f,t.w*.995/(l.width/100));o.font=`700 ${p}px ${c}`,o.fillStyle=`#fff`,o.textBaseline=`alphabetic`;let h=f*p,y=(t.h+h)/2;o.fillText(d,0,y);let x=o.measureText(d).width,S=o.getImageData(0,0,a.width,a.height).data,C=Math.max(3.5,Math.min(8,p/16)),T=e=>{let t=[];for(let n=e/2;n<a.height;n+=e)for(let r=e/2;r<a.width;r+=e)S[(Math.floor(n)*a.width+Math.floor(r))*4+3]>140&&t.push({x:r,y:n});return t},E=T(C);for(;E.length>A;)C*=1.12,E=T(C);_={left:t.x,right:t.x+x,top:t.y+y-h,bottom:t.y+y,eat:x*.86},m=E.map(({x:e,y:n},r)=>{let i=t.x+e,a=t.y+n,o=(_.right-i)/_.eat;return{hx:i,hy:a,sx:0,sy:0,r:C*.43,cr:C*.43,t:o>1?2:w+o*.76+W(a)*.02+U(r)*.01,hop:30+U(r+7)*90,shade:U(r+13),seed:U(r+29)*100}});let D=m.filter(e=>e.t<=1).sort((e,t)=>e.t-t.t),O=i.w*.92,k=i.h*.9,j=Math.sqrt(O*k/1.75/Math.max(1,D.length*.866))*.97,N=Math.max(1.4,Math.min(C*.9,j*.46)),P=i.x+i.w/2,L=i.y+i.h-N,R=k/(O/2),B=[];for(let e=0;;e++){let t=e*j*.866;if(t>k)break;let n=O/2*(1-t/k)**.75,r=e%2?j/2:0;for(let e=-Math.floor(n/j)*j+r;e<=n;e+=j){let n=B.length;B.push({x:P+e+(U(n*3+1)-.5)*j*.3,y:L-t+(U(n*3+2)-.5)*j*.25,key:t+Math.abs(e)*R})}}B.sort((e,t)=>e.key-t.key),D.forEach((e,t)=>{let n=B[t];e.sx=n?n.x:-1,e.sy=n?n.y:-1,n&&(e.cr=N)});let V=Math.max(3,Math.min(8,Math.round(n.w/72))),H=Math.max(2,Math.min(4,Math.round(n.h/64))),G=n.w/V,K=n.h/H,q=Math.min(G*.78,K*1.3);g=Array.from({length:V*H},(e,t)=>t).sort((e,t)=>U(e+101)-U(t+101)).map((e,t)=>{let r=(e%V+.5+(U(e+3)-.5)*.35)*G,i=(Math.floor(e/V)+.5+(U(e+5)-.5)*.3)*K,a=q*(.8+U(e+9)*.35),o=z(I,`0 5 20 10`,`ab__eye`);return o.style.cssText=`left: ${r-a/2}px; top: ${i-a/4}px; width: ${a}px; height: ${a/2}px; stroke-width: ${a/20}px`,{x:n.x+r,y:n.y+i,at:.1+t/(V*H)*.72,period:3.5+U(e+11)*4,phase:U(e+17)*8,el:o,lid:o.querySelector(`.ab__eye-lid`),iris:o.querySelector(`.ab__eye-iris`),shown:``}}),u.reputation.replaceChildren(z(F,`0 0 0 0`,`ab__eye-defs`),...g.map(e=>e.el));let J=Math.min(r.w/M,r.h/7.6);v={x:r.x,y:r.y+(r.h-J*7)/2,pitch:J}},S=a?k:0,N=S,P=0,V=480,K=1,q={x:-1e4,y:-1e4,on:!1};a||(t.create({trigger:e,start:()=>o.matches?`top top`:`top bottom`,end:()=>o.matches?`bottom bottom`:`bottom top`,onUpdate:e=>{S=e.progress,P=Math.max(P,Math.abs(e.getVelocity()))}}),s.addEventListener(`pointermove`,e=>{let t=s.getBoundingClientRect();q.x=e.clientX-t.left,q.y=e.clientY-t.top,q.on=e.pointerType===`mouse`}),s.addEventListener(`pointerleave`,()=>q.on=!1));let J=(e,t,n)=>{let{red:r,deep:i,paper:o,ash:s}=p;a||(N+=(S-N)*Math.min(1,n*7),P*=Math.exp(-n*2.5),V+=n*(D+P*O));let c=N,l=Math.min(c,T),u=e=>_.right-(l-w-W(e)*.02)/.76*_.eat,d=(_.top+_.bottom)/2,h=q.on?q:{x:Math.min(_.right,u(d)),y:d};for(let e of g){let n=B(e.at,e.at+.05,c),r=a?1:(t+e.phase)%e.period/.16,i=r<1?Math.sin(r*Math.PI):0,o=.08+.92*n*(1-i),s=h.x-e.x,l=h.y-e.y,u=Math.hypot(s,l)||1,d=Math.min(1,u/160),f=s/u*d*L,p=l/u*d*R,m=`${o.toFixed(3)} ${n.toFixed(3)} ${f.toFixed(2)} ${p.toFixed(2)}`;m!==e.shown&&(e.shown=m,e.el.style.opacity=String(.35+.65*n),e.lid.setAttribute(`transform`,`translate(0 ${10*(1-o)}) scale(1 ${o})`),e.iris.setAttribute(`transform`,`translate(${f} ${p})`),e.iris.style.opacity=String(n))}let b=Math.floor(V),x=1+Math.floor(b/1440);f&&x!==K&&(K=x,f.textContent=String(x));let C=Math.floor(b/60)%24,k=b%60,A=[j[Math.floor(C/10)],j[C%10],null,j[Math.floor(k/10)],j[k%10]],M=t%1<.5,F=0,I=a?1:Math.min(1,n*12);for(let t of A){let n=t?5:1;for(let i=0;i<n;i++)for(let n=0;n<7;n++){let a=t?t[n]>>4-i&1:+(n===2||n===4),c=(F+i)*7+n;y[c]+=(a-y[c])*I;let l=y[c],u=v.x+(F+i+.5)*v.pitch,d=v.y+(n+.5)*v.pitch,f=!t&&a&&M?r:H(s,o,l);e.dot(u,d,v.pitch*(.11+.31*l),f,.45+.55*l)}F+=n+1}for(let n of m){let l=(c-n.t)/E;if(l<=0){let o=n.hx,s=n.hy,c=1+E/.035*l;if(c>0&&!a&&(o+=Math.sin(t*41+n.seed)*c*1.3,s+=Math.cos(t*37+n.seed)*c*1.3),q.on){let e=o-q.x,t=s-q.y,n=Math.hypot(e,t);if(n<70&&n>0){let r=(1-n/70)**2*14;o+=e/n*r,s+=t/n*r}}e.dot(o,s,n.r*(1-Math.max(0,c)*.15),H(i,r,.55+n.shade*.45));continue}if(n.sx<0){let t=Math.min(1,l);e.dot(n.hx,n.hy+t*t*120,n.r*(1-t),r,1-t);continue}let u=Math.min(1,l),d=n.hx+(n.sx-n.hx)*(u*(2-u)),f=n.hy+(n.sy-n.hy)*u*u-n.hop*4*u*(1-u),p=u<1?H(r,o,B(.25,1,u)):H(s,o,.55+n.shade*.45);e.dot(d,f,n.r+(n.cr-n.r)*u,p)}};i.add(C(i,{el:e.querySelector(`[data-trade-gl]`),capacity:1575,fps:r.matches?30:60,fill:(e,t)=>J(e,t.time,t.delta)})),x(),e.dataset.live=``,new ResizeObserver(x).observe(s),document.fonts.load(`700 100px ${getComputedStyle(u.integrity).getPropertyValue(`--font-display`).trim()}`,d).then(x)}function q(t){let r=n.matches;if(J(t.querySelector(`[data-orb]`),r),K(t.querySelector(`[data-trade]`)),r)return;let a=t.querySelector(`[data-ab-statement]`),o=e.timeline({scrollTrigger:{trigger:a,start:`top 78%`,end:`bottom 40%`,scrub:.6}});a.querySelectorAll(`.ab__w-lit`).forEach((e,t)=>{o.fromTo(e,{xPercent:-101},{xPercent:0,ease:`none`,duration:1},t*.4).fromTo(e.firstElementChild,{xPercent:101},{xPercent:0,ease:`none`,duration:1},t*.4)}),i([...t.querySelectorAll(`[data-ab-print]`)])}function J(n,i){let a=l();if(!a)return;let o={angle:0,mouse:{x:-1e4,y:-1e4},reveal:+!!i,still:i};if(a.add(b(a,{el:n.querySelector(`[data-orb-gl]`),cell:r.matches?8:9,radius:.8,fps:r.matches?30:60,lines:JSON.parse(n.dataset.lines??`[]`),state:o})),i)return;n.addEventListener(`pointermove`,e=>{let t=n.getBoundingClientRect();o.mouse.x=e.clientX-t.left,o.mouse.y=e.clientY-t.top}),n.addEventListener(`pointerleave`,()=>o.mouse.x=o.mouse.y=-1e4),t.create({trigger:n,start:`top 82%`,once:!0,onEnter:()=>void e.to(o,{reveal:1,duration:2.4,ease:`power2.out`})});let s=-.45;t.create({trigger:n.parentElement,start:`top bottom`,end:`bottom top`,onUpdate:e=>s=-.45+e.progress*.9});let c=!1;new IntersectionObserver(([e])=>c=e.isIntersecting).observe(n),e.ticker.add(e=>{c&&(o.angle+=(s+Math.sin(e*.5)*.05-o.angle)*.08)})}var Y=document.querySelector(`[data-about]`);Y&&q(Y);