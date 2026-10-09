import{a as e}from"./gsap.BXPkAgYx.js";import{i as t,n,r,t as i}from"./Mesh.CGvkqT3f.js";import{a,i as o,n as s,o as c,r as l}from"./lifecycle.CVzH-n48.js";import{n as u}from"./scroll.DT5ir1uQ.js";var d=`// Preloader logo: one point per halftone dot. Fly-in, turn and zoom all happen here, so a\r
// frame is a single draw call. GLSL ES 1.00 so WebGL1-only devices get it too.\r
attribute vec2 aStart;   // scatter position, CSS px from the viewport centre (y down)\r
attribute vec2 aTarget;  // resting position in the logo\r
attribute float aRadius; // CSS px\r
attribute float aDelay;\r
attribute vec3 aColor;\r
\r
uniform vec2 uRes;       // viewport, CSS px\r
uniform float uDpr;\r
uniform float uAssemble;\r
uniform vec2 uSpin;      // cos, sin of the rotation\r
uniform float uZoom;\r
uniform float uScatter;  // 0..1, outward burst: every dot leaves along its own radius, centre first\r
\r
varying vec3 vColor;\r
varying float vRadius;   // device px\r
\r
void main() {\r
  float t = clamp((uAssemble - aDelay) / 0.6, 0.0, 1.0);\r
  float e = 1.0 - pow(1.0 - t, 4.0);\r
  vec2 p = mix(aStart, aTarget, e);\r
  // Burst: radial, so the turn does not change its direction. The reach covers the half\r
  // diagonal plus a per-dot margin, which leaves every dot past the screen edge at 1.\r
  float s = clamp(uScatter * 1.35 - aDelay * 0.6, 0.0, 1.0);\r
  float reach = length(uRes) * 0.5 * (1.0 + 0.5 * fract(aDelay * 37.0));\r
  vec2 dir = dot(p, p) > 0.25 ? normalize(p) : normalize(aStart);\r
  p += dir * (s * s * reach / uZoom);\r
  p = vec2(p.x * uSpin.x - p.y * uSpin.y, p.x * uSpin.y + p.y * uSpin.x) * uZoom;\r
  // Dots grow only with √zoom while the gaps grow with zoom: a zoomed logo thins out.\r
  float r = aRadius * e * sqrt(uZoom) * uDpr;\r
  vRadius = r;\r
  vColor = aColor;\r
  gl_Position = vec4(p / (uRes * 0.5) * vec2(1.0, -1.0), 0.0, 1.0);\r
  gl_PointSize = r > 0.0 ? 2.0 * r + 2.0 : 0.0;\r
}\r
`,f=`precision mediump float;\r
\r
varying vec3 vColor;\r
varying float vRadius;\r
\r
void main() {\r
  // Distance from the point centre in device px; 1px anti-aliased rim. Premultiplied out.\r
  float d = length(gl_PointCoord - 0.5) * (2.0 * vRadius + 2.0);\r
  float a = clamp(vRadius - d + 0.5, 0.0, 1.0);\r
  if (a <= 0.0) discard;\r
  gl_FragColor = vec4(vColor * a, a);\r
}\r
`,p=`#efece6`,m=`#e3261f`,h=`#3a3a3a`,g={[p]:[.937,.925,.902],[m]:[.89,.149,.122],[h]:[.227,.227,.227]},_=class{canvas;logo;assemble=0;rotation=0;zoom=1;scatter=0;size=0;cell=0;dots=[];w=0;h=0;dpr=1;seed=Math.random()*4294967296>>>0;drawn={assemble:NaN,rotation:NaN,zoom:NaN,scatter:NaN};gl;ctx;constructor(e,t){if(this.canvas=e,this.logo=t,this.gl=v(e),this.ctx=this.gl?null:e.getContext(`2d`),!this.gl&&!this.ctx)throw Error(`no canvas context`);this.layout()}layout(){let e=Math.min(window.devicePixelRatio||1,2);this.dpr=e,this.w=window.innerWidth,this.h=window.innerHeight,this.gl?(this.gl.renderer.dpr=e,this.gl.renderer.setSize(this.w,this.h)):(this.canvas.width=Math.round(this.w*e),this.canvas.height=Math.round(this.h*e)),this.drawn.assemble=NaN;let t=Math.min(this.w*.6,this.h*.38,360);this.size=t;let n=Math.round(Math.max(36,Math.min(60,t/5.5))),r=t/n;this.cell=r;let i=document.createElement(`canvas`);i.width=i.height=n;let a=i.getContext(`2d`,{willReadFrequently:!0});if(!a)return;a.drawImage(this.logo,0,0,n,n);let{data:o}=a.getImageData(0,0,n,n),s=-t/2,c=[];for(let e=0;e<n;e++)for(let i=0;i<n;i++){let a=(e*n+i)*4;if(o[a+3]/255<.5)continue;let l=o[a]/255,u=o[a+1]/255,d=o[a+2]/255,f=.299*l+.587*u+.114*d,g=f>.62?p:l>.35&&l>u*1.8?m:h,_=s+(i+.5)*r,v=s+(e+.5)*r,b=y(this.seed,i,e,0)*Math.PI*2,x=Math.max(this.w,this.h)*(.35+y(this.seed,i,e,1)*.5);c.push({tx:_,ty:v,sx:Math.cos(b)*x,sy:Math.sin(b)*x,r:r*(g===h?.34:.42)*(.75+f*.35),color:g,delay:Math.hypot(_,v)/t*.45+y(this.seed,i,e,2)*.12})}this.dots=c,this.gl&&this.upload(this.gl,c)}draw(){let{drawn:e}=this;if(e.assemble===this.assemble&&e.rotation===this.rotation&&e.zoom===this.zoom&&e.scatter===this.scatter)return;e.assemble=this.assemble,e.rotation=this.rotation,e.zoom=this.zoom,e.scatter=this.scatter;let t=this.rotation*Math.PI/180;if(this.gl){let{renderer:e,program:n,mesh:r}=this.gl,i=n.uniforms;i.uRes.value=[this.w,this.h],i.uDpr.value=this.dpr,i.uAssemble.value=this.assemble,i.uSpin.value=[Math.cos(t),Math.sin(t)],i.uZoom.value=this.zoom,i.uScatter.value=this.scatter,r&&e.render({scene:r,clear:!0});return}let n=this.ctx,r=this.dpr*this.zoom;n.setTransform(1,0,0,1,0,0),n.clearRect(0,0,this.canvas.width,this.canvas.height),n.setTransform(Math.cos(t)*r,Math.sin(t)*r,-Math.sin(t)*r,Math.cos(t)*r,this.dpr*this.w/2,this.dpr*this.h/2);let i=1/Math.sqrt(this.zoom),a=Math.hypot(this.w,this.h)*.5;for(let e of this.dots){let t=1-(1-Math.min(1,Math.max(0,(this.assemble-e.delay)/.6)))**4;if(t<=0)continue;let r=e.sx+(e.tx-e.sx)*t,o=e.sy+(e.ty-e.sy)*t,s=Math.min(1,Math.max(0,this.scatter*1.35-e.delay*.6));if(s>0){let t=a*(1+.5*(e.delay*37%1)),n=Math.hypot(r,o),[i,c]=n>.5?[r/n,o/n]:[e.sx/Math.hypot(e.sx,e.sy),e.sy/Math.hypot(e.sx,e.sy)],l=s*s*t/this.zoom;r+=i*l,o+=c*l}n.fillStyle=e.color,n.beginPath(),n.arc(r,o,e.r*t*i,0,Math.PI*2),n.fill()}}dispose(){this.gl?.renderer.gl.getExtension(`WEBGL_lose_context`)?.loseContext()}upload(e,n){let r=n.length,a=new Float32Array(r*2),o=new Float32Array(r*2),s=new Float32Array(r),c=new Float32Array(r),l=new Float32Array(r*3);n.forEach((e,t)=>{a.set([e.sx,e.sy],t*2),o.set([e.tx,e.ty],t*2),s[t]=e.r,c[t]=e.delay,l.set(g[e.color],t*3)}),e.mesh?.geometry.remove();let u=new t(e.renderer.gl,{aStart:{size:2,data:a},aTarget:{size:2,data:o},aRadius:{size:1,data:s},aDelay:{size:1,data:c},aColor:{size:3,data:l}});e.mesh=new i(e.renderer.gl,{mode:e.renderer.gl.POINTS,geometry:u,program:e.program})}};function v(e){let t;try{t=new n({canvas:e,alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,powerPreference:`high-performance`})}catch{return null}if(!t.gl)return null;let i=new r(t.gl,{vertex:d,fragment:f,transparent:!0,depthTest:!1,depthWrite:!1,uniforms:{uRes:{value:[1,1]},uDpr:{value:1},uAssemble:{value:0},uSpin:{value:[1,0]},uZoom:{value:1},uScatter:{value:0}}});return t.gl.clearColor(0,0,0,0),{renderer:t,program:i,mesh:null}}function y(e,t,n,r){let i=e^Math.imul(t,668265261)^Math.imul(n,374761393)^Math.imul(r,2654435769);return i=Math.imul(i^i>>>15,2246822507),i=Math.imul(i^i>>>13,3266489909),((i^i>>>16)>>>0)/4294967296}var b=document.querySelector(`[data-preloader]`);if(!b||!b.hasAttribute(`data-blocking`))b?.remove(),a();else{u(!0);let t=!0,n=!1,r=null,i=0,d=null,f=b.querySelector(`canvas`),p=b.querySelector(`.pre__bar`),m=[...p.children],h=()=>{r?.layout(),r&&(b.style.setProperty(`--logo`,`${r.size}px`),b.style.setProperty(`--cell`,`${r.cell}px`))},g=()=>{t&&(t=!1,u(!1))},v=()=>{r?.draw(),p.style.setProperty(`--p`,String(s()*m.length))},y=()=>{n||(clearTimeout(i),n=!0,d?.kill(),e.ticker.remove(v),e.killTweensOf(m),r&&e.killTweensOf(r),r?.dispose(),window.removeEventListener(`resize`,h),window.removeEventListener(`grayzone:preload-skip`,y),window.removeEventListener(`grayzone:ready`,g),b.remove(),g())};window.addEventListener(`grayzone:preload-skip`,y),window.addEventListener(`grayzone:ready`,g),i=window.setTimeout(()=>{y(),a()},5500);let x=()=>{clearTimeout(i),y()};o(x),(async()=>{c(document.fonts.ready);let t=new Image;t.src=b.dataset.logo??``,c(t.decode().catch(()=>{})),await l(3500),!n&&(r=t.naturalWidth?new _(f,t):null,h(),window.addEventListener(`resize`,h),e.ticker.add(v),r&&(r.assemble=1.5),d=e.timeline({onComplete:x}),d.to(m,{opacity:0,scale:0,duration:.35,stagger:{each:.015,from:`edges`}},0),r&&d.to(r,{rotation:360,zoom:6.5,duration:1.8,ease:`sine.inOut`},0).to(r,{scatter:1,duration:1.1,ease:`none`},.6),d.to(b.querySelector(`.pre__veil`),{opacity:0,duration:.8},.15).add(a,.65))})().catch(e=>{console.error(`[preloader]`,e),x(),a()})}