/* Edventure · World tree: radial map of every path that re-flows as paths are added. */
/* ---------- world tree: radial layout that re-flows for any number of paths ---------- */
let WV=null; // current viewBox {x,y,w,h}, kept across renders, reset when the layout size changes
function worldLayout(){const P=allPaths();let keys=Object.keys(P);if(S.worldMine&&S.pinned.length)keys=keys.filter(k=>S.pinned.includes(k));
 const N=Math.max(keys.length,1),ring=120,minArc=92,sector=2*Math.PI/N;
 const maxT=Math.max(1,...keys.flatMap(k=>P[k].nodes.map(n=>Math.min(n.t,4))));
 // inner radius grows until every tier of every path has room for its nodes inside its slice
 let r0=150;keys.forEach(k=>{const c={};P[k].nodes.forEach(n=>{const t=Math.min(n.t,4);c[t]=(c[t]||0)+1});
  for(const[t,cnt]of Object.entries(c))r0=Math.max(r0,minArc*cnt/(sector*.82)-Number(t)*ring)});
 r0=Math.min(r0,900);const pos={},paths=[];
 keys.forEach((k,i)=>{const p=P[k],mid=-Math.PI/2+i*sector,hue=Math.round((i*360/N+170)%360);const tiers={};
  p.nodes.forEach(n=>(tiers[Math.min(n.t,4)]??=[]).push(n));
  for(const[t,list]of Object.entries(tiers)){const R=r0+Number(t)*ring;const step=Math.min(sector*.82/list.length,minArc*1.25/R);
   list.forEach((n,j)=>{const a=mid+(j-(list.length-1)/2)*step;pos[k+"|"+n.id]={x:Math.cos(a)*R,y:Math.sin(a)*R,a,k,n}})}
  paths.push({k,p,mid,hue,color:`hsl(${hue} 70% 72%)`})});
 const Rmax=r0+maxT*ring+150;return{P,keys,pos,paths,r0,ring,maxT,Rmax,sector}}
function worldSVG(L){const{P,pos,paths,r0,ring,maxT,Rmax,sector}=L;let g="";
 // tier rings
 for(let t=0;t<=maxT;t++){const R=r0+t*ring;g+=`<circle cx="0" cy="0" r="${R}" fill="none" stroke="var(--line)" stroke-dasharray="2 7"/><text class="ringlbl" x="0" y="${-R-10}" text-anchor="middle">${esc(TIERS[t])}</text>`}
 // path slices + spokes
 paths.forEach(({k,p,mid,color})=>{const a0=mid-sector/2,a1=mid+sector/2,Ro=r0+maxT*ring+60;
  if(paths.length>1)g+=`<path d="M0 0 L${Math.cos(a0)*Ro} ${Math.sin(a0)*Ro} A${Ro} ${Ro} 0 ${sector>Math.PI?1:0} 1 ${Math.cos(a1)*Ro} ${Math.sin(a1)*Ro} Z" fill="${color}" fill-opacity=".045" stroke="var(--line)" stroke-opacity=".5"/>`;
  p.nodes.filter(n=>!n.req.length).forEach(n=>{const q=pos[k+"|"+n.id];if(q)g+=`<line x1="${Math.cos(q.a)*58}" y1="${Math.sin(q.a)*58}" x2="${q.x}" y2="${q.y}" stroke="${color}" stroke-width="2" stroke-opacity=".7"/>`})});
 // edges inside a path
 paths.forEach(({k,p})=>p.nodes.forEach(n=>n.req.forEach(r=>{const a=pos[k+"|"+r],b=pos[k+"|"+n.id];if(!a||!b)return;
  const st=done(k,r)&&done(k,n.id)?"done":done(k,r)?"open":"locked";const c=n.crossSrc&&!done(k,n.id)?"var(--cross)":st==="done"?"var(--gold)":st==="open"?"var(--accent)":"var(--locked)";
  const ra=Math.hypot(a.x,a.y)+ring/2,ma=(a.a+b.a)/2;
  g+=`<path d="M${a.x} ${a.y} Q${Math.cos(ma)*ra} ${Math.sin(ma)*ra} ${b.x} ${b.y}" fill="none" stroke="${c}" stroke-width="${st==="locked"?1.4:2.4}" ${st==="locked"?'stroke-dasharray="4 5"':""}/>`})));
 // cross-path branch edges, bowed toward the centre
 paths.forEach(({k,p,color})=>p.nodes.filter(n=>n.branch).forEach(n=>{const a=pos[k+"|"+n.id];const tp=P[n.branch];if(!a||!tp)return;const root=tp.nodes.find(x=>!x.req.length);const b=root&&pos[n.branch+"|"+root.id];if(!b)return;
  const c=done(k,n.id)?"var(--gold)":n.crossSrc?"var(--cross)":"var(--orb)";g+=`<path d="M${a.x} ${a.y} Q${(a.x+b.x)*.12} ${(a.y+b.y)*.12} ${b.x} ${b.y}" fill="none" stroke="${c}" stroke-width="1.8" stroke-dasharray="7 6" opacity=".75"><title>${esc(p.name)} → ${esc(tp.name)}</title></path>`}));
 // nodes
 Object.values(pos).forEach(({x,y,k,n})=>{const r=18;const G=nodeGfx(x,y,r,k,n,false);const st=G.st;
  const L2=wrapText(n.title,14);
  g+=`<g class="node ${st}" data-node="${esc(n.id)}" data-pid="${esc(k)}" tabindex="0" role="button" aria-label="${esc(P[k].name)}: ${esc(n.title)}, ${st}">${G.html}${L2.map((l,i)=>`<text class="lbl" x="${x}" y="${y+r+15+i*13}" text-anchor="middle">${esc(l)}</text>`).join("")}</g>`});
 // path name labels at the outer edge
 paths.forEach(({k,p,mid,color})=>{const R=r0+maxT*ring+92;const x=Math.cos(mid)*R,y=Math.sin(mid)*R;const anchor=Math.abs(Math.cos(mid))<.3?"middle":Math.cos(mid)>0?"start":"end";
  const d=(S.progress[k]||[]).length;g+=`<text class="plbl" data-open="${k}" x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}">${esc(p.name)}<tspan x="${x}" dy="17" font-size="11" font-family="var(--f-mono)" fill="var(--muted)" font-weight="500">${d}/${p.nodes.length}${P[k].ai?" · AI-grown":""}</tspan></text>`});
 // hub
 const nm=(S.profile.name||"You").split(" ")[0];
 g+=`<circle cx="0" cy="0" r="54" fill="var(--panel-2)" stroke="var(--accent)" stroke-width="2"/><circle cx="0" cy="0" r="62" fill="none" stroke="var(--accent)" stroke-opacity=".35"/><text x="0" y="-4" text-anchor="middle" font-family="var(--f-display)" font-weight="700" font-size="15" fill="var(--ink)">${esc(nm.slice(0,12))}</text><text x="0" y="15" text-anchor="middle" font-family="var(--f-mono)" font-size="11" fill="var(--muted)">LV ${level()}</text>`;
 return`<svg id="worldSvg" viewBox="${-Rmax} ${-Rmax} ${Rmax*2} ${Rmax*2}" data-r="${Rmax}" role="img" aria-label="World tree of all career paths">${g}</svg>`}
function viewWorld(){const L=worldLayout();const P=L.P;const total=Object.values(P).reduce((a,p)=>a+p.nodes.length,0);const doneN=Object.values(S.progress).reduce((a,x)=>a+x.length,0);
 return`<div class="section"><div style="display:flex;justify-content:space-between;align-items:end;gap:12px;flex-wrap:wrap"><div><div class="eyebrow">Every path at once</div><h2>World tree</h2><p class="muted" style="max-width:62ch;margin:6px 0 0">You're at the centre. Each slice is a career path, each ring a stage of school, and dashed glowing lines show where one path branches into another. New paths your companion grows slot in automatically.</p></div>
 <div class="chip-stat" style="font-size:14px">${L.keys.length} paths · ${doneN}/${total} objectives</div></div>
 <div class="wlegend"><span><i style="background:var(--gold);border-color:var(--gold)"></i>Complete</span><span><i style="border-color:var(--accent)"></i>Ready now</span><span><i></i>Locked</span><span><i style="border-radius:2px;transform:rotate(45deg);border-color:var(--orb)"></i>Branch to another path${tip("branch")}</span><span><i style="border-color:var(--gold);border-style:dashed"></i>Mastery (3 stages)</span><span><i style="border-color:var(--cross);border-radius:3px"></i>Crossover to a new field${tip("crossover")}</span>
 <label style="display:flex;gap:6px;align-items:center;margin-left:auto"><input type="checkbox" id="worldMine" ${S.worldMine?"checked":""} ${S.pinned.length?"":"disabled"}> Only paths on my journey</label></div>
 <div class="worldbox">${worldSVG(L)}<div class="zoom"><button class="btn" id="zIn" aria-label="Zoom in">+</button><button class="btn" id="zOut" aria-label="Zoom out">−</button><button class="btn" id="zFit" aria-label="Fit everything" style="font-size:12px">Fit</button></div></div>
 <p class="muted" style="font-size:13px;margin:0">Drag to pan, scroll or use + / − to zoom. Hover a node for its objective, click a path name to open its tree.</p></div>`}
function bindWorld(){const svg=$("worldSvg");if(!svg)return;const R=Number(svg.dataset.r);
 if(!WV||WV.r!==R)WV={x:-R,y:-R,w:2*R,h:2*R,r:R};
 const apply=()=>svg.setAttribute("viewBox",`${WV.x} ${WV.y} ${WV.w} ${WV.h}`);apply();
 const zoom=(f,cx,cy)=>{const nw=Math.min(4*R,Math.max(R*.25,WV.w*f));const s=nw/WV.w;
  if(cx==null){cx=WV.x+WV.w/2;cy=WV.y+WV.h/2}WV.x=cx-(cx-WV.x)*s;WV.y=cy-(cy-WV.y)*s;WV.w=nw;WV.h=WV.h*s;apply();hideCard(true)};
 const toSvg=(e)=>{const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;return pt.matrixTransform(svg.getScreenCTM().inverse())};
 svg.addEventListener("wheel",e=>{e.preventDefault();const p=toSvg(e);zoom(e.deltaY>0?1.15:1/1.15,p.x,p.y)},{passive:false});
 let drag=null;svg.addEventListener("pointerdown",e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,vx:WV.x,vy:WV.y,moved:false,id:e.pointerId}});
 svg.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<5)return;
  if(!drag.moved){drag.moved=true;svg.setPointerCapture(drag.id);svg.classList.add("dragging");hideCard(true)}const k=WV.w/svg.getBoundingClientRect().width;WV.x=drag.vx-dx*k;WV.y=drag.vy-dy*k;apply()});
 const end=()=>{if(drag?.moved){svg.classList.remove("dragging");window._wDragged=Date.now()}drag=null};svg.addEventListener("pointerup",end);svg.addEventListener("pointercancel",end);
 $("zIn").onclick=()=>zoom(1/1.3);$("zOut").onclick=()=>zoom(1.3);$("zFit").onclick=()=>{WV={x:-R,y:-R,w:2*R,h:2*R,r:R};apply()};
 const wm=$("worldMine");if(wm)wm.onchange=()=>{S.worldMine=wm.checked;WV=null;save();render()};
 // clicking a world node opens its tree at that node (ignored right after a drag)
 svg.querySelectorAll(".node").forEach(g=>{const go=()=>{if(Date.now()-(window._wDragged||0)<250)return;if(canHover&&hcPinned)return;hideCard(true);S.path=g.dataset.pid;S.sel=g.dataset.node;setView("tree")};g.onclick=go;g.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();go()}}});
 svg.querySelectorAll(".plbl").forEach(t=>t.onclick=()=>{if(Date.now()-(window._wDragged||0)<250)return;hideCard(true);S.path=t.dataset.open;S.sel=null;setView("tree")});}
