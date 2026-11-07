/* Edventure · Game feel: animated theme backgrounds, flying gems, sparks, banners. */
/* ---------- game FX: animated backgrounds, flying gems, bursts, banners ---------- */
const FXMODE={"aurora-live":"aurora",starfall:"meteors",forge:"embers",arcade:"grid",pixel:"pixel"};
const REDUCE=matchMedia("(prefers-reduced-motion: reduce)").matches;
let lastPt={x:innerWidth/2,y:innerHeight/2};
addEventListener("pointerdown",e=>{lastPt={x:e.clientX,y:e.clientY}},{capture:true});
addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){const r=document.activeElement?.getBoundingClientRect?.();if(r&&r.width)lastPt={x:r.left+r.width/2,y:r.top+r.height/2}}},{capture:true});
const fx=(()=>{const cv=$("fxCanvas"),ctx=cv.getContext("2d");let W=0,H=0,mode="",parts=[],stars=[],raf=0,acc="#6fe3d6";
 const rgba=(h,a)=>{h=h.replace("#","");if(h.length===3)h=[...h].map(c=>c+c).join("");const n=parseInt(h,16);return`rgba(${n>>16&255},${n>>8&255},${n&255},${a})`};
 function size(){W=cv.width=innerWidth;H=cv.height=innerHeight;stars=Array.from({length:Math.round(W*H/14000)},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.3+.3,p:Math.random()*6.28,s:.4+Math.random()*1.6}))}
 function drawStars(t,square,maxY=H){ctx.fillStyle="#fff";for(const s of stars){if(s.y>maxY)continue;const a=.22+.4*Math.sin(t*.001*s.s+s.p);if(square){if(a<.32)continue;ctx.globalAlpha=.85;ctx.fillRect(Math.round(s.x/4)*4,Math.round(s.y/4)*4,3,3)}else if(a>0){ctx.globalAlpha=a;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.283);ctx.fill()}}ctx.globalAlpha=1}
 function aurora(t){const cols=["#7dffc4","#6fb8ff","#c08bff"];for(let i=0;i<3;i++){const base=H*(.12+i*.09);ctx.beginPath();ctx.moveTo(0,base);
  for(let x=0;x<=W+20;x+=20){ctx.lineTo(x,base+Math.sin(x*.0035+t*.00035*(i+1)+i*2)*44+Math.sin(x*.011+t*.0006)*14)}ctx.lineTo(W,base+300);ctx.lineTo(0,base+300);ctx.closePath();
  const g=ctx.createLinearGradient(0,base-50,0,base+300);g.addColorStop(0,rgba(cols[i],0));g.addColorStop(.25,rgba(cols[i],.16));g.addColorStop(1,rgba(cols[i],0));ctx.fillStyle=g;ctx.fill()}}
 function embers(){if(parts.length<90&&Math.random()<.6)parts.push({x:Math.random()*W,y:H+8,vy:-(.4+Math.random()*1.3),life:0,max:260+Math.random()*320,r:.8+Math.random()*2.2,s:Math.random()*6});
  const g=ctx.createLinearGradient(0,H*.7,0,H);g.addColorStop(0,"rgba(255,122,61,0)");g.addColorStop(1,"rgba(255,122,61,.12)");ctx.fillStyle=g;ctx.fillRect(0,H*.7,W,H*.3);
  parts=parts.filter(p=>{p.life++;p.y+=p.vy;p.x+=Math.sin(p.life*.03+p.s)*.45;const a=Math.max(0,1-p.life/p.max);if(a<=0||p.y<-10)return false;
   ctx.fillStyle=rgba(p.r>2?"#ffcf5a":"#ff7a3d",a*.18);ctx.beginPath();ctx.arc(p.x,p.y,p.r*3.5,0,6.283);ctx.fill();ctx.fillStyle=rgba(p.r>2?"#ffe49a":"#ff9a5c",a);ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill();return true})}
 function meteors(){if(Math.random()<.012&&parts.length<4)parts.push({x:W*(.3+Math.random()*.9),y:-20,vx:-(6+Math.random()*4),vy:3.5+Math.random()*2.5,len:90+Math.random()*90,life:0});
  parts=parts.filter(p=>{p.life++;p.x+=p.vx;p.y+=p.vy;const sp=Math.hypot(p.vx,p.vy),tx=p.x-p.vx/sp*p.len,ty=p.y-p.vy/sp*p.len;
   const g=ctx.createLinearGradient(p.x,p.y,tx,ty);g.addColorStop(0,"rgba(255,255,255,.95)");g.addColorStop(.3,rgba(acc,.5));g.addColorStop(1,rgba(acc,0));ctx.strokeStyle=g;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(tx,ty);ctx.stroke();
   ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(p.x,p.y,1.8,0,6.283);ctx.fill();return p.y<H+40&&p.x>-200})}
 function grid(t){const hz=H*.64;drawStars(t,false,hz-10);
  const sun=ctx.createLinearGradient(0,hz-150,0,hz);sun.addColorStop(0,"rgba(255,211,77,.32)");sun.addColorStop(1,rgba(acc,.28));ctx.fillStyle=sun;ctx.beginPath();ctx.arc(W/2,hz,130,Math.PI,0);ctx.fill();
  ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--void").trim()||"#0a0718";for(let k=0;k<6;k++){ctx.fillRect(W/2-140,hz-12-k*14-(t*.01%14),280,3+k*.6)}
  ctx.strokeStyle=rgba(acc,.35);ctx.lineWidth=1;for(let i=-24;i<=24;i++){ctx.beginPath();ctx.moveTo(W/2+i*8,hz);ctx.lineTo(W/2+i*W/9,H);ctx.stroke()}
  const off=(t*.00045)%1;for(let k=0;k<16;k++){const z=(k+off)/16;const y=hz+(H-hz)*z*z;ctx.globalAlpha=Math.min(1,z*2.2);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}ctx.globalAlpha=1;
  const g=ctx.createLinearGradient(0,hz-4,0,hz+30);g.addColorStop(0,rgba(acc,.5));g.addColorStop(1,rgba(acc,0));ctx.fillStyle=g;ctx.fillRect(0,hz-2,W,32)}
 function pixel(t){drawStars(t,true);if(Math.random()<.02&&parts.length<6)parts.push({x:Math.random()*W,y:H+10,life:0});
  ctx.fillStyle="#ffd34d";parts=parts.filter(p=>{p.life++;p.y-=1.2;const w=Math.abs(Math.round(Math.cos(p.life*.08)*3))*2+2;ctx.globalAlpha=.55;ctx.fillRect(Math.round(p.x/2)*2-w/2,Math.round(p.y/2)*2,w,8);ctx.globalAlpha=1;return p.y>-10})}
 function frame(t){ctx.clearRect(0,0,W,H);
  if(mode==="aurora"){drawStars(t);aurora(t)}else if(mode==="embers")embers();else if(mode==="meteors"){drawStars(t);meteors()}else if(mode==="grid")grid(t);else if(mode==="pixel")pixel(t);else drawStars(t);
  if(!REDUCE)raf=requestAnimationFrame(frame)}
 function setMode(m){acc=(getComputedStyle(document.body).getPropertyValue("--accent").trim())||acc;if(m===mode)return;mode=m;parts=[];cancelAnimationFrame(raf);if(document.hidden)return;REDUCE?frame(0):raf=requestAnimationFrame(frame)}
 addEventListener("resize",()=>{size();if(REDUCE)frame(0)});
 document.addEventListener("visibilitychange",()=>{cancelAnimationFrame(raf);if(!document.hidden&&!REDUCE)raf=requestAnimationFrame(frame)});
 size();return{setMode,get mode(){return mode}}})();
let shownGems=null,countRaf=0;
function countGems(v){const el=$("hudGems");if(shownGems===null||REDUCE){shownGems=v;el.textContent=v;return}if(v===shownGems)return;
 const from=shownGems,t0=performance.now(),d=Math.min(1200,350+Math.abs(v-from)/4);shownGems=v;cancelAnimationFrame(countRaf);
 const step=t=>{const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);el.textContent=Math.round(from+(v-from)*e);if(k<1)countRaf=requestAnimationFrame(step)};countRaf=requestAnimationFrame(step);
 el.classList.remove("bump");void el.offsetWidth;el.classList.add("bump")}
function flyGems(from,amount){if(REDUCE||!from)return;const tr=$("hudGems").getBoundingClientRect();const tx=tr.left+tr.width/2,ty=tr.top+tr.height/2;const n=Math.max(4,Math.min(16,Math.round(amount/8)));
 for(let i=0;i<n;i++){const d=document.createElement("div");d.className="flygem";document.body.append(d);const sx=from.x+(Math.random()-.5)*40,sy=from.y+(Math.random()-.5)*30;const mx=sx+(Math.random()-.5)*160,my=sy-60-Math.random()*90;
  d.animate([{transform:`translate(${sx}px,${sy}px) rotate(45deg) scale(.4)`,opacity:0},{transform:`translate(${mx}px,${my}px) rotate(200deg) scale(1.2)`,opacity:1,offset:.35},{transform:`translate(${tx}px,${ty}px) rotate(405deg) scale(.5)`,opacity:.9}],{duration:750+i*45,easing:"cubic-bezier(.5,0,.75,1)"}).onfinish=()=>{d.remove();if(i===n-1){const el=$("hudGems");el.classList.remove("bump");void el.offsetWidth;el.classList.add("bump")}}}}
function burst(at,n=16){if(REDUCE||!at)return;const cols=["var(--gold)","var(--accent)","var(--orb)","#ffffff","var(--cross)"];
 for(let i=0;i<n;i++){const d=document.createElement("div");d.className="spark";d.style.background=cols[i%cols.length];document.body.append(d);const a=Math.random()*6.283,r=50+Math.random()*90;
  d.animate([{transform:`translate(${at.x}px,${at.y}px) rotate(0) scale(1)`,opacity:1},{transform:`translate(${at.x+Math.cos(a)*r}px,${at.y+Math.sin(a)*r+40}px) rotate(${Math.random()*540}deg) scale(.3)`,opacity:0}],{duration:650+Math.random()*450,easing:"cubic-bezier(.2,.7,.4,1)"}).onfinish=()=>d.remove()}}
let bannerT=0;function banner(title,sub,color){const el=$("lvlup");el.style.setProperty("--burst",color);el.innerHTML=`<div class="rays"></div><div class="txt"><b>${esc(title)}</b><small>${esc(sub)}</small></div>`;el.hidden=false;clearTimeout(bannerT);bannerT=setTimeout(()=>el.hidden=true,2300)}
