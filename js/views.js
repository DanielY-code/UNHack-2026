/* Edventure · Screens: Character, Career paths, Skill tree, Compare, Treasury. */
/* ---------- render ---------- */
let lastView=null;
function setView(v){S.view=v;save();render()}
function render(){
 document.body.dataset.skin=S.equip.skin;document.body.dataset.orb=S.equip.orb;document.body.dataset.titlefx=S.equip.title==="Legend of the Skill Tree"?"1":"0";
 $("hudName").textContent=S.profile.name||"Adventurer";
 const lv=level();$("hudLv").textContent=lv;$("hudXp").style.width=((S.earned%120)/120*100)+"%";
 $("hudTitle").textContent=(S.equip.title||["Novice","Apprentice","Explorer","Adept","Expert"][Math.min(4,Math.floor((lv-1)/2))])+" · "+(S.profile.grade==="First year"?"First year":"Grade "+S.profile.grade);
 countGems(S.gems);applyCompanion();
 document.querySelectorAll("nav.tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.view===S.view));
 const m=$("main");
 m.innerHTML=S.view==="profile"?viewProfile():S.view==="paths"?viewPaths():S.view==="tree"?viewTree():S.view==="compare"?viewCompare():S.view==="world"?viewWorld():viewShop();
 if(lastView!==S.view){m.firstElementChild?.classList.add("enter");lastView=S.view}
 bind();fx.setMode(FXMODE[S.equip.skin]||"stars");
 $("growBranchLbl").textContent=S.view==="tree"&&allPaths()[S.path]?`Branch it from ${allPaths()[S.path].name}`:"Branch it from the tree I'm viewing";
}

function radar(t,b){const cx=110,cy=110,r=82,n=SK.length;const pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/n;return[cx+Math.cos(a)*r*v/99,cy+Math.sin(a)*r*v/99]};
 let g="";[25,50,75,99].forEach(l=>{g+=`<polygon points="${SK.map((k,i)=>pt(i,l).join(",")).join(" ")}" fill="none" stroke="var(--line)" stroke-width="1"/>`});
 SK.forEach((k,i)=>{const[x,y]=pt(i,99);const[lx,ly]=pt(i,118);g+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/><text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="var(--muted)" font-family="var(--f-display)" letter-spacing="1">${STATS[k].slice(0,4).toUpperCase()}</text>`});
 g+=`<polygon points="${SK.map((k,i)=>pt(i,t[k]).join(",")).join(" ")}" fill="color-mix(in oklab,var(--gold) 25%,transparent)" stroke="var(--gold)" stroke-width="1.5"/>`;
 g+=`<polygon points="${SK.map((k,i)=>pt(i,b[k]).join(",")).join(" ")}" fill="color-mix(in oklab,var(--accent) 28%,transparent)" stroke="var(--accent)" stroke-width="2"/>`;
 return`<svg viewBox="-10 -10 240 240" role="img" aria-label="Stat radar">${g}</svg>`}

function viewProfile(){const{b,e,t}=totalStats();const p=S.profile;const P=allPaths();
 const ranked=Object.entries(P).map(([k,x])=>[k,x,fit(x,t)]).sort((a,c)=>c[2]-a[2]).slice(0,3);
 return`<div class="section">
 ${S.example?`<div class="banner"><span>You're looking at an example student. Take the quiz to roll your own stats and build your skill trees.</span><button class="btn small gold" id="clearEx">Take the quiz</button></div>`:""}
 <div><div class="eyebrow">Character creation</div><h2>Who are you so far?</h2><p class="muted" style="max-width:62ch;margin:6px 0 0">Your interests, courses and activities become your starting stats. Finishing objectives on a skill tree adds more on top (shown in gold).</p></div>
 <div class="grid-2">
  <div class="panel" style="display:grid;gap:16px">
   <div style="display:grid;grid-template-columns:minmax(0,1fr) 120px;gap:12px">
    <label class="fl" for="pName">Name<input type="text" id="pName" value="${esc(p.name)}"></label>
    <label class="fl" for="pGrade">Grade<select id="pGrade">${QUIZ.grades.map(g=>`<option value="${esc(g)}" ${g===p.grade?"selected":""}>${esc(g)}</option>`).join("")}</select></label>
   </div>
   <div class="fl">Interests<div class="chips">${Object.keys(INTERESTS).map(i=>`<button class="chip" data-int="${esc(i)}" aria-pressed="${p.interests.includes(i)}">${esc(i)}</button>`).join("")}</div></div>
   <div class="fl">Courses taken and your usual grade<div class="subj">${Object.keys(SUBJECTS).map(s=>`<label for="sub-${s.replace(/\W/g,"")}">${esc(s)}<select id="sub-${s.replace(/\W/g,"")}" data-sub="${esc(s)}">${Object.keys(GRADEPTS).map(g=>`<option ${p.subjects[s]===g?"selected":""}>${g}</option>`).join("")}</select></label>`).join("")}</div></div>
   <div class="fl">Activities and experience<div class="chips">${Object.keys(ACTIVITIES).map(a=>`<button class="chip" data-act="${esc(a)}" aria-pressed="${p.activities.includes(a)}">${esc(a)}</button>`).join("")}</div></div>
  </div>
  <div style="display:grid;gap:18px;align-content:start">
   <div class="panel"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><h3 style="display:flex;align-items:center">Character sheet${tip("stats")}</h3><div class="legend"><span><i style="background:var(--accent)"></i>From your past</span><span><i style="background:var(--gold)"></i>Earned in Edventure</span></div></div>
    <div class="sheet" style="margin-top:12px"><div>${radar(t,b)}</div><div style="display:grid;gap:8px">${SK.map(k=>`<div class="statrow"><span>${STATS[k]}</span><div class="bar"><i class="earned" style="width:${t[k]}%"></i><i style="width:${b[k]}%"></i></div><b>${t[k]}</b></div>`).join("")}</div></div>
   </div>
   ${goalsPanel()}
   ${updatesPanel()}
   <div class="panel plan"><div style="display:flex;align-items:center"><h3>Degree plan</h3>${tip("major")}</div>
    <label class="fl" for="pMajor"><span>Intended major</span><select id="pMajor"><option value="">Still exploring</option>${Object.entries(P).map(([k,x])=>`<option value="${k}" ${S.major===k?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label>
    <div class="fl"><span style="display:flex;align-items:center">Minors (up to 2)${tip("minor")}</span><div class="chips">${Object.entries(P).filter(([k])=>k!==S.major).map(([k,x])=>`<button class="chip" data-minor="${k}" aria-pressed="${S.minors.includes(k)}" ${!S.minors.includes(k)&&S.minors.length>=2?"disabled":""}>${esc(x.name)}</button>`).join("")}</div></div>
    ${S.minors.map(k=>{const x=P[k];if(!x)return"";const tr=minorTrack(x),d=tr.filter(id=>done(k,id)).length;return`<div style="display:grid;gap:4px"><div class="line" style="justify-content:space-between;font-size:13px"><span>${esc(x.name)} minor</span><span class="muted">${d}/${tr.length}${d===tr.length?" · Complete":""}</span></div><div class="prog"><i style="width:${d/tr.length*100}%"></i></div></div>`}).join("")}
    <p class="muted" style="margin:0;font-size:13px">Plans change, and that's normal.${tip("switch")} Try pairing your major with a minor in something completely different.${tip("breadth")}</p>
   </div>
   <div class="panel"><h3>Paths that fit your stats</h3><div style="display:grid;gap:10px;margin-top:12px">${ranked.map(([k,x,f])=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div style="min-width:0"><b style="font-family:var(--f-display)">${esc(x.name)}</b><div class="muted" style="font-size:13px">${esc(x.blurb)}</div></div><button class="btn small" data-open="${k}">${f}% · Preview</button></div>`).join("")}</div></div>
   <div><button class="btn small danger" data-startover>↺ Start over from the quiz</button></div>
  </div>
 </div></div>`}

function destLine(){const cd=currentDest();return`<div class="dst-line">${cd?`<span>◎ <b>${esc(cd.dest.name)}</b> <span class="muted">via ${esc(routeLabel(cd.dest,cd.route))}</span></span><button class="btn small" data-go="world">View route</button>`:`<span class="muted">No destination yet.</span><button class="btn small" data-dst="new">Choose a destination</button>`}</div>`}
function goalsPanel(){const G=S.goals;const P=allPaths();
 const nodes=Object.entries(S.extraNodes).flatMap(([k,list])=>(list||[]).filter(n=>n.goal).map(n=>({k,n})));
 if(!G)return`<div class="panel" style="display:grid;gap:10px"><h3>Your goals</h3>${destLine()}<p class="muted" style="margin:0;font-size:14px">Take the quiz to set goals. Edventure turns them into objectives in your skill trees.</p><button class="btn small primary" data-quiz style="justify-self:start">Take the quiz</button></div>`;
 const labels=G.ids.map(id=>QUIZ.goals.find(g=>g.id===id)?.label).filter(Boolean);
 return`<div class="panel" style="display:grid;gap:10px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><h3 style="display:flex;align-items:center">Your goals${tip("goal")}</h3><button class="btn small" data-quiz>Retake quiz</button></div>
  ${destLine()}
  ${labels.length?`<div class="chips">${labels.map(l=>`<span class="chip" style="cursor:default">${esc(l)}</span>`).join("")}</div>`:""}
  ${G.text?`<div style="font-size:14px">“${esc(G.text)}”</div>`:""}
  ${G.timeframe?`<div class="muted" style="font-size:13px">Timeframe: ${esc(G.timeframe)}</div>`:""}
  ${nodes.length?`<div style="display:grid;gap:6px">${nodes.map(({k,n})=>`<button class="btn small" data-goto="${k}|${esc(n.id)}" style="justify-self:start;text-align:left">${done(k,n.id)?"✓":"★"} ${esc(n.title)} · ${esc(P[k]?.name||"")}</button>`).join("")}</div>`:""}
 </div>`}

function updatesPanel(){const P=allPaths();const U=S.updates||[];
 return`<div class="panel" style="display:grid;gap:10px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><h3>Path updates</h3><button class="btn small" data-update>Something changed?</button></div>
  ${U.length?U.slice(0,3).map(u=>`<div class="upd-log"><div class="muted" style="font-size:12px;font-family:var(--f-mono)">${esc(u.date)}</div><div style="font-size:14px">“${esc(u.text.length>140?u.text.slice(0,138)+"…":u.text)}”</div>
   <div class="chips" style="gap:6px">${u.added.map(k=>`<span class="tag" style="color:var(--gold);border-color:var(--gold)">+ ${esc(P[k]?.name||k)}</span>`).join("")}${(u.grown||[]).map(k=>`<span class="tag ai">+ ${esc(P[k]?.name||k)}</span>`).join("")}${u.paused.map(k=>`<span class="tag">Paused ${esc(P[k]?.name||k)}</span>`).join("")}</div>
   ${u.step&&P[u.step.pid]?.nodes.some(n=>n.id===u.step.id)?`<button class="btn small" data-goto="${u.step.pid}|${esc(u.step.id)}" style="justify-self:start">${done(u.step.pid,u.step.id)?"✓":"★"} First step</button>`:""}</div>`).join(""):`<p class="muted" style="margin:0;font-size:14px">When something changes, like a tough grade, a new interest or a summer job, tell your companion and your trees will adapt. Your updates are logged here.</p>`}
 </div>`}

function viewPaths(){const{t}=totalStats();const P=allPaths();
 const entries=Object.entries(P).sort((a,b)=>fit(b[1],t)-fit(a[1],t));
 return`<div class="section"><div><div class="eyebrow">World map</div><h2>Career paths</h2><p class="muted" style="max-width:62ch;margin:6px 0 0">Preview any tree before you commit time to it. Match %${tip("match")} compares a path's key stats with yours. Ask ${esc(compName())} to grow a path that isn't here yet.</p></div>
 ${updateCard()}
 ${compassCard()}
 <div class="cards">${entries.map(([k,p])=>{const f=fit(p,t);const d=(S.progress[k]||[]).length;const branches=p.nodes.filter(n=>n.branch&&P[n.branch]).map(n=>P[n.branch].name);
  return`<article class="pcard"><div class="top"><div><h3>${esc(p.name)}</h3><div class="row" style="margin-top:6px">${roleOf(k)==="major"?`<span class="tag major">Major</span>`:roleOf(k)==="minor"?`<span class="tag minor">Minor</span>`:""}${S.pinned.includes(k)?`<span class="tag">On my journey</span>`:""}${S.pathNotes?.[k]?.tag==="new"&&S.pinned.includes(k)?`<span class="tag" style="color:var(--gold);border-color:var(--gold)">New interest</span>`:""}${(S.paused||[]).includes(k)?`<span class="tag">Paused</span>`:""}${p.ai?`<span class="tag ai">AI-grown</span>`:""}</div></div><span class="fit ${f>=75?"hi":""}">${f}% match</span></div>
  <p class="muted" style="margin:0;font-size:14px">${esc(p.blurb)}</p>
  <div style="display:grid;gap:6px;align-content:end"><div class="row" style="justify-content:space-between;font-size:12px"><span class="muted">${d} / ${p.nodes.length} objectives</span><span class="muted">${Object.keys(p.weights||{}).map(s=>STATS[s]).filter(Boolean).join(" · ")}</span></div><div class="prog"><i style="width:${p.nodes.length?d/p.nodes.length*100:0}%"></i></div>${branches.length?`<div class="branchline">Branches to: ${branches.map(esc).join(", ")}</div>`:""}</div>
  <div class="row"><button class="btn small primary" data-open="${k}">Open tree</button><button class="btn small" data-pin="${k}">${S.pinned.includes(k)?"Unpin":"Pin to journey"}</button><button class="btn small" data-cmpadd="${k}">${S.compare.includes(k)?"In compare ✓":"Compare"}</button>${roleOf(k)?"":`<button class="btn small" data-addminor="${k}" ${S.minors.length>=2?"disabled":""}>Add as minor</button>`}</div></article>`}).join("")}</div></div>`}

function viewCompare(){const P=allPaths();const{t}=totalStats();S.compare=S.compare.filter(k=>P[k]);
 const sel=S.compare;const n=sel.length;
 const picker=`<div class="chips">${Object.entries(P).map(([k,p])=>`<button class="chip" data-cmp="${k}" aria-pressed="${sel.includes(k)}" ${!sel.includes(k)&&n>=3?"disabled":""}>${esc(p.name)}</button>`).join("")}</div>`;
 const head=`<div><div class="eyebrow">Side by side</div><h2 style="display:flex;align-items:center">Compare trees${tip("switch")}</h2><p class="muted" style="max-width:62ch;margin:6px 0 0">Pick two or three paths to see how they differ in the stats they demand, what you'd do each year, and where they share ground or branch into each other.</p></div>`;
 if(n<2)return`<div class="section">${head}${picker}<div class="notice">Pick at least two paths to compare.</div></div>`;
 const cols=`grid-template-columns:150px repeat(${n},minmax(200px,1fr));--cmpw:${150+n*210}px`;
 const ps=sel.map(k=>[k,P[k]]);
 const row=(label,cells,last)=>`<div class="rh ${last?"last":""}">${label}</div>${cells.map(c=>`<div class="${last?"last":""}">${c}</div>`).join("")}`;
 // stats demanded
 const statRows=SK.filter(s=>ps.some(([,p])=>(p.weights||{})[s])).map(s=>row(`${STATS[s]}<div class="you" style="margin-top:6px;text-transform:none;letter-spacing:0"><div class="bar"><i style="width:${t[s]}%"></i></div><span>${t[s]}</span></div>`,ps.map(([,p])=>{const w=(p.weights||{})[s]||0;return`<div class="pips" aria-label="${w} of 3">${[1,2,3].map(i=>`<i class="${i<=w?"on":""}"></i>`).join("")}<span class="muted" style="font-size:12px;margin-left:4px">${["Not needed","Helpful","Important","Core"][w]}</span></div>`})));
 // tiers
 const tiersUsed=[...new Set(ps.flatMap(([,p])=>p.nodes.map(x=>Math.min(x.t,4))))].sort((a,b)=>a-b);
 const tierRows=tiersUsed.map((tier,i)=>row(TIERS[tier],ps.map(([k,p])=>p.nodes.filter(x=>Math.min(x.t,4)===tier).map(x=>{const st=nodeState(k,x);return`<div class="tnode ${st} ${x.branch?"br":""}"><span class="dot"></span><span>${x.branch?"→ ":""}${esc(x.title)}</span></div>`}).join("")||`<span class="muted">—</span>`),i===tiersUsed.length-1));
 const summary=[
  row("Your match",ps.map(([,p])=>{const f=fit(p,t);return`<span class="fit ${f>=75?"hi":""}">${f}%</span>`})),
  row("Progress",ps.map(([k,p])=>{const d=(S.progress[k]||[]).length;return`<div style="display:grid;gap:6px"><span class="muted" style="font-size:13px">${d} of ${p.nodes.length} objectives</span><div class="prog"><i style="width:${d/p.nodes.length*100}%"></i></div></div>`})),
  row("Treasure",ps.map(([k,p])=>`<span class="price"><span class="gem" style="width:9px;height:9px"></span>${p.nodes.filter(x=>!done(k,x.id)).reduce((a,x)=>a+gemsFor(x),0)} left to earn</span>`)),
  row("Branches to",ps.map(([,p])=>{const b=p.nodes.filter(x=>x.branch&&P[x.branch]).map(x=>P[x.branch].name);return b.length?b.map(esc).join(", "):`<span class="muted">None yet</span>`}))
 ].join("");
 const names=`<div class="rh"></div>${ps.map(([k,p])=>`<div style="display:grid;gap:8px;align-content:start"><b style="font-family:var(--f-display);font-size:17px">${esc(p.name)}</b><button class="mini" data-open="${k}" aria-label="Open ${esc(p.name)} tree">${treeSVG(k,p).replace(/ tabindex="0" role="button"/g,"")}</button><div class="row" style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn small primary" data-open="${k}">Open</button><button class="btn small" data-pin="${k}">${S.pinned.includes(k)?"Unpin":"Pin"}</button></div></div>`).join("")}`;
 // shared ground
 const links=[];ps.forEach(([k,p])=>p.nodes.forEach(x=>{if(x.branch&&sel.includes(x.branch)&&x.branch!==k)links.push(`${esc(p.name)} → ${esc(P[x.branch].name)} via “${esc(x.title)}”`)}));
 const urlMap={};ps.forEach(([k,p])=>p.nodes.forEach(x=>(x.res||[]).forEach(r=>{(urlMap[r.url]??={name:r.name,url:r.url,in:new Set()}).in.add(p.name)})));
 const sharedRes=Object.values(urlMap).filter(r=>r.in.size>1);
 const top2=p=>Object.entries(p.weights||{}).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([s])=>s);
 const common=SK.filter(s=>ps.every(([,p])=>top2(p).includes(s)));
 const transfer=ps.flatMap(([k,p])=>(S.progress[k]||[]).length?[`${(S.progress[k]||[]).length} objective${(S.progress[k]||[]).length>1?"s":""} done in ${esc(p.name)}`]:[]);
 return`<div class="section">${head}${picker}
 <div class="cmp-scroll"><div class="cmp" style="${cols}">${names}${summary}</div></div>
 <div><h3>Stats each path leans on</h3><p class="muted" style="margin:4px 0 10px;font-size:14px">Gold bars are your current stats. Pips show how much each path relies on that stat.</p>
 <div class="cmp-scroll"><div class="cmp" style="${cols}">${statRows}</div></div></div>
 <div><h3>Year by year</h3><p class="muted" style="margin:4px 0 10px;font-size:14px">What you'd be working on at each stage. Gold dots are done, outlined teal dots are ready now, diamonds branch to another tree.</p>
 <div class="cmp-scroll"><div class="cmp" style="${cols}">${tierRows}</div></div></div>
 <div class="shared">
  <div class="panel"><h3>Where they connect</h3>${links.length?`<ul>${links.map(l=>`<li>${l}</li>`).join("")}</ul>`:`<p class="muted" style="margin:6px 0 0;font-size:14px">No direct branch between these trees. Ask ${esc(compName())} to grow one if you want a bridge.</p>`}</div>
  <div class="panel"><h3>Shared ground</h3><ul>${common.length?`<li>Both lean on ${common.map(s=>STATS[s]).join(" and ")}, so effort on one helps the other.</li>`:`<li>Their core stats barely overlap, so these are genuinely different directions.</li>`}${sharedRes.map(r=>`<li>Shared resource: <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a></li>`).join("")}${transfer.map(x=>`<li>${x}</li>`).join("")}</ul></div>
  <div class="panel"><h3>Still deciding?</h3><p class="muted" style="margin:6px 0 10px;font-size:14px">${esc(compName())} can weigh these against your profile and suggest a first step that keeps both doors open.</p><button class="btn primary" id="cmpAsk">Ask ${esc(compName())} to compare</button></div>
 </div></div>`}

function wrapText(s,max=15){const w=s.split(" ");const lines=[""];for(const x of w){if((lines[lines.length-1]+" "+x).trim().length>max&&lines[lines.length-1])lines.push(x);else lines[lines.length-1]=(lines[lines.length-1]+" "+x).trim()}if(lines.length>2){lines.length=2;lines[1]=lines[1].slice(0,max-1)+"…"}return lines}
function treeSVG(pid,p){const tiers={};p.nodes.forEach(n=>(tiers[n.t]??=[]).push(n));const keys=Object.keys(tiers).map(Number).sort((a,b)=>a-b);
 const maxN=Math.max(...keys.map(k=>tiers[k].length));const W=Math.max(640,maxN*165);const dy=165,y0=80;const pos={};
 keys.forEach((k,row)=>tiers[k].forEach((n,i)=>pos[n.id]={x:W*(i+1)/(tiers[k].length+1),y:y0+row*dy,row}));
 const H=y0+(keys.length-1)*dy+100;let edges="",nodes="",lbls="";
 keys.forEach((k,row)=>lbls+=`<text class="tierlbl" x="14" y="${y0+row*dy-46}">${esc(TIERS[Math.min(k,4)])}</text><line x1="14" x2="${W-14}" y1="${y0+row*dy-38}" y2="${y0+row*dy-38}" stroke="var(--line)" stroke-dasharray="2 6"/>`);
 p.nodes.forEach(n=>n.req.forEach(r=>{const a=pos[r],b=pos[n.id];if(!a||!b)return;const st=done(pid,r)&&done(pid,n.id)?"done":done(pid,r)?"open":"locked";
  let c=st==="done"?"var(--gold)":st==="open"?"var(--accent)":"var(--locked)";const xc=n.crossSrc&&!done(pid,n.id);if(xc)c=mastered(pid,n.crossSrc)?"var(--cross)":"color-mix(in oklab,var(--cross) 45%,var(--locked))";const my=(a.y+b.y)/2;
  edges+=`<path d="M${a.x} ${a.y+76} C${a.x} ${my+24},${b.x} ${my-10},${b.x} ${b.y-34}" fill="none" stroke="${c}" stroke-width="${st==="locked"&&!xc?1.5:2.5}" ${st==="locked"||xc?'stroke-dasharray="4 5"':""}/>`}));
 p.nodes.forEach(n=>{const{x,y}=pos[n.id];const sel=S.sel===n.id;const G=nodeGfx(x,y,27,pid,n,true);const st=G.st;
  const L=wrapText((n.crossSrc?"⇄ ":n.branch?"→ ":n.goal?"★ ":n.mine?"✎ ":"")+n.title);const mt=roleOf(pid)==="minor"&&minorTrack(p).includes(n.id);
  nodes+=`<g class="node ${st} ${sel?"sel":""}" data-node="${esc(n.id)}" tabindex="0" role="button" aria-label="${esc(n.title)}, ${st}">${mt?`<text x="${x}" y="${y-40}" text-anchor="middle" font-family="var(--f-display)" font-size="10" letter-spacing="1.5" fill="var(--orb)">MINOR</text>`:""}${G.html}${L.map((l,i)=>`<text class="lbl" x="${x}" y="${y+50+i*16}" text-anchor="middle">${esc(l)}</text>`).join("")}</g>`});
 return`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.name)} skill tree">${lbls}${edges}${nodes}</svg>`}

function viewTree(){if(viewMode()==="simple")return viewTreeSimple();const P=allPaths();if(!P[S.path])S.path="cs";const p=P[S.path];const pid=S.path;
 if(!S.sel||!p.nodes.find(n=>n.id===S.sel))S.sel=(p.nodes.find(n=>nodeState(pid,n)==="open")||p.nodes[0]).id;
 const n=p.nodes.find(x=>x.id===S.sel);const st=nodeState(pid,n);const tgt=n.branch&&P[n.branch];
 const reqNames=n.req.map(r=>p.nodes.find(x=>x.id===r)?.title).filter(Boolean);
 const order=[...new Set([...S.pinned,pid])];
 return`<div class="section"><div class="treehead"><div><div class="eyebrow">${roleOf(pid)==="major"?"Your intended major":roleOf(pid)==="minor"?"Your minor":S.pinned.includes(pid)?"On your journey":"Preview mode"}</div><h2>${esc(p.name)}</h2></div>
 <div class="pathpick">${order.filter(k=>P[k]).map(k=>`<button class="chip" data-open="${k}" aria-pressed="${k===pid}">${esc(P[k].name)}</button>`).join("")}<button class="chip" data-go="paths">All paths…</button></div>${modeSwitch()}</div>
 ${p.ai?`<div class="notice">Your companion grew this tree with AI. Check each resource link before relying on it.</div>`:""}
 ${planBar(P,pid,p)}
 <div class="tree-layout"><div class="treebox">${treeSVG(pid,p)}</div>
 <aside class="panel detail" aria-live="polite">
  <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span class="eyebrow" style="display:flex;align-items:center">${esc(TIERS[Math.min(n.t,4)])}${tip("tiers")}</span><span class="status ${st}">${statusLabel(pid,n,st)}</span></div>
  ${roleOf(pid)==="minor"&&minorTrack(p).includes(n.id)?`<div><span class="tag minor">Minor track</span>${tip("minortrack")}</div>`:""}${n.goal?`<div><span class="tag" style="color:var(--gold);border-color:var(--gold)">Your goal</span>${tip("goal")}</div>`:n.mine?`<div><span class="tag" style="color:var(--accent);border-color:var(--accent)">Your idea</span>${tip("idea")}</div>`:""}
  <h3 style="font-size:21px">${esc(n.title)}</h3>
  <div class="kv"><h4>What you learn</h4><div>${esc(n.learn)}</div></div>
  ${n.mastery?`<div class="kv"><h4 style="display:flex;align-items:center">Mastery stages${tip("mastery")}</h4>${ladder(pid,n)}</div>`:`<div class="kv"><h4>Current objective</h4><div class="objective">${esc(n.objective)}</div></div>`}${crossBlock(P,p,pid,n)}
  <div class="kv"><h4>Rewards</h4><div class="rewards"><span><span class="gem" style="width:8px;height:8px"></span> ${nextGems(pid,n)} gems${n.mastery&&!mastered(pid,n)?" this stage":""}</span>${Object.entries(statReward(p,n)).map(([k,v])=>`<span>+${v} ${STATS[k]}</span>`).join("")}</div></div>
  ${n.res?.length?`<div class="kv"><h4>Free resources</h4><ul class="res">${n.res.map(r=>`<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}<span>${esc(new URL(r.url).hostname.replace("www.",""))} ↗</span></a></li>`).join("")}</ul></div>`:""}
  ${tgt?`<div class="kv"><h4 style="display:flex;align-items:center">Branch${tip("branch")}</h4><div>${n.crossSrc?"This crossover opens":"This node opens"} the <b>${esc(tgt.name)}</b> tree. Specializations can shift as you learn, just like switching from one program to another.</div><button class="btn small" data-open="${n.branch}" style="justify-self:start;margin-top:6px">Preview ${esc(tgt.name)} →</button></div>`:""}
  ${st==="locked"?`<div class="muted" style="font-size:14px">${lockText(pid,n,reqNames)}${tip("prereq")}</div>`:""}
  ${st==="open"||st==="mastering"?`<div class="kv"><label class="fl" for="reflect">${n.mastery?`${STAGE_NAMES[mlevel(pid,n)]} stage: what did you make or learn?`:"What did you make or learn? (a sentence or two)"}</label><textarea id="reflect" placeholder="e.g. My guessing game works and I learned how while-loops stop."></textarea><button class="btn gold" id="claim">${n.mastery?`Claim ${STAGE_NAMES[mlevel(pid,n)]} stage`:"Complete objective & claim treasure"}</button><div class="muted" id="claimMsg" style="font-size:13px"></div></div>`:""}
  ${(st==="done"||st==="mastering")&&S.notes[pid+":"+n.id]?`<div class="kv"><h4>Your note</h4><div class="muted" style="font-style:italic">“${esc(S.notes[pid+":"+n.id])}”</div></div>`:""}
  ${n.mine&&st!=="done"&&st!=="mastering"?`<button class="btn small" id="delIdea" style="justify-self:start">Remove my objective</button>`:""}
  <details class="idea"><summary>✎ Add your own objective after this one</summary>
   <label class="fl" for="ideaTitle">Short name<input type="text" id="ideaTitle" maxlength="40" placeholder="e.g. Build a weather station"></label>
   <label class="fl" for="ideaObj">What will you do?<textarea id="ideaObj" maxlength="300" placeholder="Something concrete you can finish and look back on."></textarea></label>
   <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn small primary" id="ideaAdd">Add to tree</button><span class="muted" id="ideaMsg" style="font-size:12px"></span></div>
  </details>
  <button class="btn small" data-pin="${pid}" style="justify-self:start">${S.pinned.includes(pid)?"Unpin from journey":"Pin this path to my journey"}</button>
 </aside></div>
 ${compassCard()}</div>`}
function planBar(P,pid,p){const r=roleOf(pid);const maj=S.major&&P[S.major];
 if(r==="major")return`<div class="planbar"><span class="tag major">Intended major</span><span class="muted" style="font-size:14px">Curious about something else? Add a minor or explore freely.${tip("minor")}</span></div>`;
 const carry=(()=>{if(!maj)return"";const{e}=totalStats();const earned=SK.filter(k=>e[k]>0).sort((a,b)=>e[b]-e[a]).slice(0,3);
  const top=x=>Object.entries(x.weights||{}).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>k);const shared=top(maj).filter(k=>top(p).includes(k));
  const doneCount=(S.progress[S.major]||[]).length;const links=maj.nodes.filter(n=>n.branch===pid).map(n=>n.title);
  return`<div class="switchbox" id="switchBox" hidden><div style="display:flex;align-items:center"><h3>What comes with you</h3>${tip("transfer")}</div><ul>
   <li>All ${doneCount} objective${doneCount===1?"":"s"} you finished in ${esc(maj.name)} stay done, and so do their stats.</li>
   ${earned.length?`<li>Your earned ${earned.map(k=>STATS[k]).join(", ")} carry straight over.</li>`:""}
   ${shared.length?`<li>Both paths lean on ${shared.map(k=>STATS[k]).join(" and ")}, so you're not starting from zero.</li>`:`<li>This is a real change of direction. That takes courage, and your broader skills come with you.</li>`}
   ${links.length?`<li>${esc(maj.name)} already branches here through “${esc(links[0])}”.</li>`:""}
   <li>At university, talk to an academic advisor${tip("advisor")} to see which credits transfer.</li></ul>
   <label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" id="keepMinor" checked> Keep ${esc(maj.name)} as a minor</label>
   <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" id="switchYes">Make ${esc(p.name)} my major</button><button class="btn" id="switchNo">Not yet</button></div></div>`})();
 return`<div class="planbar">${r==="minor"?`<span class="tag minor">Minor</span><span class="muted" style="font-size:14px">${minorTrack(p).filter(id=>done(pid,id)).length}/${minorTrack(p).length} minor-track objectives</span>`:""}
  ${maj?`<button class="btn small" id="switchOpen">Thinking of switching your major here?</button>${tip("switch")}`:`<button class="btn small primary" id="setMajor">Make this my intended major</button>${tip("major")}`}
  ${r!=="minor"?`<button class="btn small" data-addminor="${pid}" ${S.minors.length>=2?"disabled":""}>Add as minor</button>`:`<button class="btn small" data-dropminor="${pid}">Drop minor</button>`}
 </div>${carry}`}

/* ---------- treasury ---------- */
function viewShop(){const groups=[["comp",null,"Companions"],["skin",0,"Classic themes"],["skin",1,"Animated themes"],["orb",null,"Orb skins"],["title",null,"Titles"],["gift",null,"Real-life rewards"]];
 return`<div class="section"><div style="display:flex;justify-content:space-between;align-items:end;gap:12px;flex-wrap:wrap"><div><div class="eyebrow">Treasury</div><h2>Spend your treasure</h2></div><div class="chip-stat" style="font-size:18px"><span class="gem"></span><b>${S.gems}</b>&nbsp;gems</div></div>
 ${TEST_MODE?`<div class="panel testbox"><div style="min-width:0"><span class="tag">Testing</span> <b style="font-family:var(--f-display)">Prototype test tools</b><div class="muted" style="font-size:13px">Add treasure or reset purchases to try every theme. Remove before real students use the app.</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn small gold" data-test="1000">+1,000 gems</button><button class="btn small gold" data-test="5000">+5,000 gems</button><button class="btn small gold" data-test="20000">+20,000 gems</button><button class="btn small" id="tReset">Reset purchases</button></div></div>`:""}
 ${groups.map(([g,an,label])=>`<div style="display:grid;gap:10px"><h3>${label}</h3>${an===1?`<div class="muted" style="font-size:14px;margin-top:-4px">Moving backgrounds and effects that cost more treasure.</div>`:""}${g==="comp"?`<div class="muted" style="font-size:14px;margin-top:-4px">Swap the orb for a different guide. Each one has its own personality when you chat.</div>`:""}${g==="gift"?`<div class="notice">Gift cards are requests: a parent, teacher or sponsor approves and sends the card. This prototype records the request only.</div>`:""}<div class="shop">${SHOP.filter(i=>i.kind===g&&(an===null||!!i.anim===!!an)).map(item).join("")}</div></div>`).join("")}
 ${S.redeem.length?`<div class="panel"><h3>Reward requests</h3><div style="overflow-x:auto;margin-top:8px"><table class="red"><thead><tr><th>Reward</th><th>Requested</th><th>Status</th></tr></thead><tbody>${S.redeem.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.date)}</td><td>${esc(r.status)}</td></tr>`).join("")}</tbody></table></div></div>`:""}
 </div>`}
function item(i){const owned=S.owned.includes(i.id);const eq=(i.kind==="comp"&&(S.equip.comp||"orb")===i.val)||(i.kind==="skin"&&S.equip.skin===i.val)||(i.kind==="orb"&&S.equip.orb===i.val)||(i.kind==="title"&&S.equip.title===i.val);
 let btn;if(i.kind==="gift")btn=`<button class="btn small gold" data-buy="${i.id}" ${S.gems<i.cost?"disabled":""}>${S.gems<i.cost?`Need ${i.cost-S.gems} more`:"Request"}</button>`;
 else if(owned)btn=`<button class="btn small ${eq?"primary":""}" data-equip="${i.id}">${eq?"Equipped":"Equip"}</button>`;
 else btn=`<button class="btn small gold" data-buy="${i.id}" ${S.gems<i.cost?"disabled":""}>${S.gems<i.cost?`Need ${i.cost-S.gems} more`:"Buy"}</button>`;
 return`<div class="item">${i.kind==="comp"?`<div class="swatch comp-sw">${COMPANIONS[i.val].svg||`<span class="orb" style="position:static;width:44px;height:44px;display:block;animation:bob 3s ease-in-out infinite"></span>`}</div>`:i.anim?`<div class="swatch fx-${i.val==="Legend of the Skill Tree"?"legend":i.val}"></div>`:i.sw?`<div class="swatch" style="background:${i.sw}"></div>`:`<div class="swatch" style="display:grid;place-items:center;font-family:var(--f-display);font-size:13px;background:var(--panel-2)">${i.kind==="gift"?"Gift card":esc(i.val)}</div>`}<b style="font-family:var(--f-display)">${esc(i.name)}${i.anim?` <span class="tag anim">Animated</span>`:""}</b><div class="muted" style="font-size:13px">${esc(i.desc)}</div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="price"><span class="gem" style="width:9px;height:9px"></span>${i.cost||"Free"}</span>${btn}</div></div>`}
