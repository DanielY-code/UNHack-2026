/* Edventure · World tree: one path at a time, growing like a real tree.
   The trunk rises from "You" through the path's stages; branches sprout where the path can lead somewhere else
   (built-in branches, mastery crossovers), and the crown shows related paths it could branch into.
   Following a branch refocuses the tree on that path, with breadcrumbs back. */

/* ---------- structure (pure) ---------- */
function worldFocusId(){const P=allPaths();const f=S.worldFocus;return P[f]?f:P[S.major]?S.major:S.pinned.find(k=>P[k])||(P[S.path]?S.path:Object.keys(P)[0])}
function sharedStats(a,b){return SK.filter(k=>(a.weights?.[k]||0)>=2&&(b.weights?.[k]||0)>=2)}
function branchesOf(pid){const P=allPaths(),p=P[pid];const out=[],seen=new Set();
 for(const n of p.nodes){if(!n.branch||!P[n.branch]||n.branch===pid||seen.has(n.branch))continue;seen.add(n.branch);const st=nodeState(pid,n);
  const req=n.req.map(r=>p.nodes.find(x=>x.id===r)?.title).filter(Boolean);
  out.push({to:n.branch,kind:n.crossSrc?"cross":"branch",tier:Math.min(n.t,4),node:n.id,state:st,
   how:st==="done"?"Explored":st==="open"?"Ready to explore":n.crossSrc?`Master ${n.crossSrc.title} (${mlevel(pid,n.crossSrc)} of ${stageCount(n.crossSrc)})`:`After ${req.join(" + ")}`})}
 const related=Object.entries(P).filter(([k])=>k!==pid&&!seen.has(k)).map(([k,q])=>({k,sh:sharedStats(p,q),w:SK.reduce((s,st)=>s+Math.min(p.weights?.[st]||0,q.weights?.[st]||0),0)}))
  .filter(r=>r.w>=2).sort((a,b)=>b.w-a.w).slice(0,2);
 for(const r of related)out.push({to:r.k,kind:"related",tier:null,node:null,state:"related",how:r.sh.length?`Also uses ${r.sh.map(s=>STATS[s]).join(" and ")}`:"A close neighbour"});
 return out}
function trunkOf(pid){const p=allPaths()[pid];const core=p.nodes.filter(n=>!n.branch&&!n.crossSrc);
 const tiers=[...new Set(core.map(n=>Math.min(n.t,4)))].sort((a,b)=>a-b);
 return tiers.map(t=>{const ns=core.filter(n=>Math.min(n.t,4)===t);return{tier:t,total:ns.length,done:ns.filter(n=>done(pid,n.id)).length,open:ns.some(n=>["open","mastering"].includes(nodeState(pid,n)))}})}

/* ---------- drawing ---------- */
function worldTreeSVG(pid){const P=allPaths(),p=P[pid];const trunk=trunkOf(pid),br=branchesOf(pid);
 // Layout is computed upward from the roots (u), then flipped to SVG y. Narrow enough to fit a phone without scrolling.
 const W=520,cx=260,gap=190,arm=150,stackGap=130;
 const uOf=i=>160+i*gap,idxFor=t=>{let i=0;trunk.forEach((m,j)=>{if(m.tier<=t)i=j});return i};
 let side=1;const stack={};const placed=br.filter(b=>b.kind!=="related").map(b=>{const i=idxFor(b.tier);side=-side;const key=i+":"+side;const k=stack[key]=(stack[key]??-1)+1;
  return{...b,side,x:cx+side*arm,u:uOf(i)+58+k*stackGap,fromU:uOf(i)+k*stackGap,fromX:k?cx+side*5:cx+side*30}});
 const crownU=Math.max(uOf(trunk.length-1)+140,...placed.map(l=>l.u+110));
 const rel=br.filter(b=>b.kind==="related").map(b=>{side=-side;return{...b,side,x:cx+side*arm,u:crownU+46,fromU:crownU,fromX:cx}});
 const H=crownU+(rel.length?46+24+16:40)+16;const Y=u=>H-u;
 const leaves=[...placed,...rel].map(l=>({...l,y:Y(l.u),from:{x:l.fromX,y:Y(l.fromU)}}));
 const yOf=i=>Y(uOf(i)),rootY=Y(34),crownY=Y(crownU);
 const initials=s=>s.split(/[\s&]+/).filter(w=>/^[A-Za-z]/.test(w)).slice(0,2).map(w=>w[0].toUpperCase()).join("");
 let g=`<defs><linearGradient id="bark" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="var(--gold)"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs>`;
 // roots + trunk (the climbed part glows)
 const lastDone=trunk.reduce((a,m,i)=>m.done===m.total?i:a,-1);const climbY=lastDone<0?rootY-20:yOf(lastDone);
 g+=`<path d="M${cx} ${rootY} q-26 18 -64 22 M${cx} ${rootY} q26 18 64 22 M${cx} ${rootY} q-6 20 -20 30 M${cx} ${rootY} q6 20 20 30" stroke="var(--locked)" stroke-width="3" fill="none" stroke-linecap="round"/>`;
 g+=`<line x1="${cx}" y1="${rootY}" x2="${cx}" y2="${crownY}" stroke="var(--line)" stroke-width="10" stroke-linecap="round"/>`;
 g+=`<line class="wt-grow" x1="${cx}" y1="${rootY}" x2="${cx}" y2="${climbY}" stroke="url(#bark)" stroke-width="10" stroke-linecap="round"/>`;
 // branches
 leaves.forEach(l=>{const dash=l.kind==="related"||l.state==="locked";const col=l.state==="done"?"var(--gold)":l.kind==="related"?"var(--orb)":l.kind==="cross"?"var(--cross)":l.state==="open"?"var(--accent)":"var(--locked)";
  g+=`<path d="M${l.from.x} ${l.from.y} C${l.from.x+l.side*45} ${l.from.y-8},${l.x-l.side*75} ${l.y+6},${l.x-l.side*27} ${l.y}" fill="none" stroke="${col}" stroke-width="${dash?2:4}" ${dash?'stroke-dasharray="6 7"':""} stroke-linecap="round"/>`});
 // milestones
 trunk.forEach((m,i)=>{const y=yOf(i),r=30,f=m.total?m.done/m.total:0,full=m.done===m.total;const a=f*2*Math.PI;const ex=cx+r*Math.sin(a),ey=y-r*Math.cos(a);
  const arc=f>0&&f<1?`<path d="M${cx} ${y-r} A${r} ${r} 0 ${f>.5?1:0} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="var(--gold)" stroke-width="5" stroke-linecap="round"/>`:"";
  g+=`<g class="wt-stone ${full?"done":m.open?"open":"locked"}" data-mstone="${m.tier}" tabindex="0" role="button" aria-label="${esc(TIERS[m.tier])}: ${m.done} of ${m.total} done">
   ${m.open&&!full?`<circle class="ring" cx="${cx}" cy="${y}" r="${r}"/>`:""}<circle cx="${cx}" cy="${y}" r="${r}" fill="${full?"var(--gold)":"var(--panel-2)"}" stroke="${full?"var(--gold)":m.open?"var(--accent)":"var(--locked)"}" stroke-width="3"/>${arc}
   <text x="${cx}" y="${y+5}" text-anchor="middle" class="wt-count" fill="${full?"var(--gold-ink)":"var(--ink)"}">${full?"✓":`${m.done}/${m.total}`}</text>
   <rect x="${cx-64}" y="${y+38}" width="128" height="24" rx="12" fill="var(--panel)" stroke="var(--line)"/><text x="${cx}" y="${y+54}" text-anchor="middle" class="wt-stage">${esc(TIERS[m.tier])}</text></g>`});
 // crown + root labels
 g+=`<circle cx="${cx}" cy="${crownY}" r="9" fill="var(--orb)" opacity=".85"/><rect x="${cx-56}" y="${crownY+16}" width="112" height="24" rx="12" fill="var(--panel)" stroke="color-mix(in oklab,var(--orb) 50%,var(--line))"/><text x="${cx}" y="${crownY+32}" text-anchor="middle" class="wt-stage" style="fill:var(--orb)">Where next?</text>`;
 g+=`<circle cx="${cx}" cy="${rootY-20}" r="16" fill="var(--panel-2)" stroke="var(--accent)" stroke-width="2"/><text x="${cx}" y="${rootY-15}" text-anchor="middle" class="wt-you">You</text>`;
 // leaves
 leaves.forEach(l=>{const q=P[l.to];const prog=q.nodes.filter(n=>done(l.to,n.id)).length;const col=l.state==="done"?"var(--gold)":l.kind==="related"?"var(--orb)":l.kind==="cross"?"var(--cross)":l.state==="open"?"var(--accent)":"var(--locked)";
  const name=wrapText(q.name,15);const how=l.how.length>24?l.how.slice(0,23)+"…":l.how;
  const shape=l.kind==="cross"?`<polygon points="${[0,1,2,3,4,5].map(i=>{const a=Math.PI/3*i-Math.PI/2;return`${(l.x+Math.cos(a)*26).toFixed(1)},${(l.y+Math.sin(a)*26).toFixed(1)}`}).join(" ")}"`:`<circle cx="${l.x}" cy="${l.y}" r="24"`;
  g+=`<g class="wt-leaf ${l.kind} ${l.state}" data-focus="${esc(l.to)}" tabindex="0" role="button" aria-label="${esc(q.name)}: ${esc(l.how)}">
   ${l.state==="open"?`<circle class="ring" cx="${l.x}" cy="${l.y}" r="24" style="stroke:${col}"/>`:""}${shape} fill="${l.state==="done"?"var(--gold)":"var(--panel-2)"}" stroke="${col}" stroke-width="2.5" ${l.kind==="related"?'stroke-dasharray="4 4"':""}/>
   <text x="${l.x}" y="${l.y+5}" text-anchor="middle" class="wt-init" fill="${l.state==="done"?"var(--gold-ink)":col}">${esc(initials(q.name))}</text>
   ${name.map((t,i)=>`<text x="${l.x}" y="${l.y+46+i*19}" text-anchor="middle" class="wt-name">${esc(t)}</text>`).join("")}
   <text x="${l.x}" y="${l.y+46+name.length*19}" text-anchor="middle" class="wt-how">${esc(how)}${prog?` · ${prog} done`:""}</text></g>`});
 return`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.name)} world tree">${g}</svg>`}

function viewWorld(){const P=allPaths();const pid=worldFocusId();S.worldFocus=pid;const p=P[pid];const br=branchesOf(pid);
 const trail=(S.worldTrail||[]).filter(k=>P[k]&&k!==pid);const picks=[...new Set([S.major,...S.pinned,pid].filter(k=>P[k]))];
 const kindTag={branch:`<span class="tag">Branch</span>`,cross:`<span class="tag" style="color:var(--cross);border-color:var(--cross)">Crossover</span>`,related:`<span class="tag ai">Could branch</span>`};
 const doneN=p.nodes.filter(n=>done(pid,n.id)).length;
 return`<div class="section wt"><div class="treehead"><div><div class="eyebrow">World tree${roleOf(pid)==="major"?" · your major":""}</div><h2>Where ${esc(p.name)} can take you</h2></div>
  <div class="pathpick">${picks.map(k=>`<button class="chip" data-wfocus="${k}" aria-pressed="${k===pid}">${esc(P[k].name)}</button>`).join("")}<button class="chip" data-go="paths">All paths…</button></div></div>
 ${trail.length?`<nav class="wt-trail" aria-label="Paths you came from">${trail.map(k=>`<button class="linkbtn" data-trail="${k}">${esc(P[k].name)}</button><span aria-hidden="true">›</span>`).join("")}<b>${esc(p.name)}</b></nav>`:""}
 <p class="muted" style="margin:0;max-width:62ch">Climb from the roots through each stage of <b>${esc(p.name)}</b>. Branches show where it can lead; tap one to follow it and see where <i>that</i> path goes.</p>
 <div class="wt-layout"><div class="branchbox">${worldTreeSVG(pid)}</div>
  <aside class="panel wt-list"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><h3>Branches from here</h3><span class="muted" style="font-family:var(--f-mono);font-size:12px">${doneN}/${p.nodes.length} done</span></div>
   ${br.length?br.map(b=>`<div class="wt-card ${b.state}"><div class="wt-card-top"><b>${esc(P[b.to].name)}</b>${kindTag[b.kind]}</div><div class="muted" style="font-size:13px">${esc(b.how)}</div><div class="wt-card-actions"><button class="btn small primary" data-focus="${b.to}">Follow branch</button><button class="btn small" data-open="${b.to}">See steps</button></div></div>`).join(""):`<p class="muted" style="margin:0;font-size:14px">No branches yet. Ask your companion to grow one.</p>`}
   <button class="btn small" data-open="${pid}" style="justify-self:start">Open ${esc(p.name)} steps</button>
   <div class="wlegend" style="margin:0"><span><i style="background:var(--gold);border-color:var(--gold)"></i>Done</span><span><i style="border-color:var(--accent)"></i>Ready</span><span><i></i>Locked</span><span><i style="border-color:var(--cross);border-radius:3px"></i>Crossover</span><span><i style="border-color:var(--orb);border-style:dashed"></i>Could branch</span></div>
  </aside></div></div>`}

function bindWorld(){const root=document.querySelector(".wt");if(!root)return;
 const focus=(k,fromTrail)=>{const cur=worldFocusId();if(k===cur)return;S.worldTrail=fromTrail?(S.worldTrail||[]).slice(0,Math.max(0,(S.worldTrail||[]).indexOf(k))):[...(S.worldTrail||[]).filter(x=>x!==k),cur].slice(-5);S.worldFocus=k;save();render();window.scrollTo({top:0,behavior:REDUCE?"auto":"smooth"})};
 root.querySelectorAll("[data-focus]").forEach(el=>{el.onclick=()=>focus(el.dataset.focus);el.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();focus(el.dataset.focus)}}});
 root.querySelectorAll("[data-trail]").forEach(b=>b.onclick=()=>focus(b.dataset.trail,true));
 root.querySelectorAll("[data-wfocus]").forEach(b=>b.onclick=()=>{S.worldTrail=[];S.worldFocus=b.dataset.wfocus;save();render()});
 root.querySelectorAll("[data-mstone]").forEach(el=>{const go=()=>{const pid=worldFocusId(),t=Number(el.dataset.mstone);const p=allPaths()[pid];const ns=p.nodes.filter(n=>Math.min(n.t,4)===t&&!n.branch);
   const pick=ns.find(n=>["open","mastering"].includes(nodeState(pid,n)))||ns[0];S.path=pid;S.sel=pick?.id||null;setView("tree")};
  el.onclick=go;el.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go()}}})}
