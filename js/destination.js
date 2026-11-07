/* Edventure · Destinations: career goals with more than one route.
   A student follows a route (a path, or a path that branches into another) toward a destination such as
   "Software Developer". If they hit a roadblock they can switch to another route to the same goal; they can also aim
   their current path at a new goal, or start a new program entirely. Content lives in data/destinations.json.
   Top-level code only defines functions, so tests can load this file. */

/* ---------- lookups (pure) ---------- */
const destById=id=>DESTS.destinations.find(d=>d.id===id);
const routeById=(d,id)=>d?.routes.find(r=>r.id===id);
const routePid=(d,r)=>r.kind==="steps"?`route-${d.id}-${r.id}`:r.path;
function currentDest(){const d=destById(S.dest?.id);const r=routeById(d,S.dest?.route);if(!d||!r)return null;const pid=routePid(d,r);return allPaths()[pid]?{dest:d,route:r,pid}:null}
function routeLabel(d,r){const P=allPaths();return r.kind==="steps"?r.label:r.via?`${P[r.path]?.name} → ${P[r.via]?.name}`:P[r.path]?.name||r.label}
/* destinations this path can lead to (directly, or through one of its branches) */
function destinationsFrom(pid){const out=[];for(const d of DESTS.destinations)for(const r of d.routes){if(r.kind==="path"&&r.path===pid)out.push({dest:d,route:r})}
 const cd=currentDest();if(pid.startsWith("route-")&&cd&&cd.pid===pid)out.push({dest:cd.dest,route:cd.route});
 return out.filter((x,i,a)=>a.findIndex(y=>y.dest.id===x.dest.id)===i)}
function alternateRoutes(reasons=[]){const cd=currentDest();if(!cd)return[];
 return cd.dest.routes.filter(r=>r.id!==cd.route.id).map(r=>({r,match:r.goodFor.filter(g=>reasons.includes(g)).length})).sort((a,b)=>b.match-a.match||(reasons.length?b.r.goodFor.length-a.r.goodFor.length:0)).map(x=>x.r)}

/* ---------- applying (pure state changes) ---------- */
function ensureRoutePath(d,r){if(r.kind!=="steps")return r.path;const pid=routePid(d,r);
 if(!S.custom[pid]){const field=BASE_PATHS[d.field]||allPaths()[d.field];
  S.custom[pid]={name:r.label,blurb:r.why,weights:{...(field?.weights||{logic:1})},route:{dest:d.id},
   nodes:r.steps.map((s,i)=>({id:`${pid}-s${i+1}`,t:Math.min(i,3),title:s.title,objective:s.objective,learn:s.learn,res:s.res||[],req:i?[`${pid}-s${i}`]:[]}))}}
 return pid}
function applyDestination(destId,routeId,{mode="goal",keepOld=true}={}){const d=destById(destId),r=routeById(d,routeId);if(!d||!r)return null;
 const before=currentDest();const old=mode==="goal"?null:(before?.pid||S.major||null);
 const pid=ensureRoutePath(d,r);const date=new Date().toISOString().slice(0,10);
 S.paused=(S.paused||[]).filter(k=>k!==pid);if(!S.pinned.includes(pid))S.pinned.push(pid);
 if(mode==="new"||(mode==="roadblock"&&(!S.major||S.major===old)))S.major=pid;
 if(old&&old!==pid){if(keepOld){S.minors=[old,...S.minors.filter(k=>k!==old)].filter(k=>k!==S.major).slice(0,2)}
  else{S.pinned=S.pinned.filter(k=>k!==old);S.paused=[...new Set([...(S.paused||[]),old])];(S.pathNotes??={})[old]={tag:"paused",note:`Paused when you switched to ${r.label}.`,date}}}
 S.minors=S.minors.filter(k=>k!==S.major);
 (S.pathNotes??={})[pid]={tag:"new",note:`Route to ${d.name}`,date};
 S.dest={id:d.id,route:r.id,since:date};S.destLog=[{date,mode,dest:d.id,route:r.id,from:old},...(S.destLog||[])].slice(0,12);
 S.worldFocus=pid;S.worldTrail=[];S.path=pid;S.sel=null;save();return{dest:d,route:r,pid}}

/* ---------- destination card on the World tree ---------- */
function destCard(pid){const P=allPaths(),cd=currentDest();
 if(!cd)return`<div class="panel dst-card"><div class="dst-flag" aria-hidden="true">◎</div><div class="dst-main"><div class="eyebrow">Destination</div><h3>Where do you want this to lead?</h3><p class="muted">Pick a goal, like a career, and Edventure shows the routes that reach it, including backup routes if one gets blocked.</p>
  <div class="dst-actions"><button class="btn primary small" data-dst="goal">Choose a goal from ${esc(P[pid].name)}</button><button class="btn small" data-dst="new">Start a new program</button></div></div></div>`;
 const rp=P[cd.pid];const paused=(S.paused||[]).includes(cd.pid)||!S.pinned.includes(cd.pid);const onRoute=pid===cd.pid||pid===cd.route.via;
 const doneN=rp.nodes.filter(n=>done(cd.pid,n.id)).length;
 return`<div class="panel dst-card ${paused?"warn":""}"><div class="dst-flag" aria-hidden="true">◎</div><div class="dst-main"><div class="eyebrow">Your destination</div><h3>${esc(cd.dest.name)}</h3>
  <p class="dst-route"><span class="muted">Current route:</span> ${esc(routeLabel(cd.dest,cd.route))}${cd.route.kind==="steps"?` <span class="tag">Own steps</span>`:""}</p>
  ${paused?`<p class="dst-note">This route is paused. Pick another route to the same goal, or resume it.</p>`:onRoute?`<p class="muted" style="margin:0;font-size:14px">${doneN} of ${rp.nodes.length} steps done on this route.${cd.route.via&&pid===cd.pid?` Head for the <b>${esc(P[cd.route.via].name)}</b> branch marked ◎.`:""}</p>`
   :`<p class="muted" style="margin:0;font-size:14px">You're exploring ${esc(P[pid].name)}. Your route runs through ${esc(rp.name)}. <button class="linkbtn" data-wfocus="${cd.pid}">Back to my route</button></p>`}
  <div class="dst-actions"><button class="btn small ${paused?"primary":""}" data-dst="roadblock">Hit a roadblock?</button><button class="btn small" data-dst="goal">New goal from this path</button><button class="btn small" data-dst="new">Start a new program</button></div></div></div>`}

/* ---------- picker screens ---------- */
let DST=null;
function openDest(mode){DST={mode,reasons:[],q:"",keepOld:true};let el=$("dst");
 if(!el){el=document.createElement("div");el.id="dst";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");document.body.append(el)}
 el.setAttribute("aria-label",mode==="menu"?"Change course":mode==="roadblock"?"Other routes":mode==="goal"?"Choose a goal":"Start a new program");el.hidden=false;document.body.style.overflow="hidden";drawDest()}
function closeDest(){const el=$("dst");if(el)el.hidden=true;document.body.style.overflow="";DST=null}
function drawDest(){const el=$("dst"),D=DST,P=allPaths(),cd=currentDest(),pid=worldFocusId();let body="";
 const oldName=cd?P[cd.pid]?.name:P[S.major]?.name;
 const keep=oldName&&D.mode!=="goal"?`<label class="dst-keep"><input type="checkbox" id="dstKeep" ${D.keepOld?"checked":""}> Keep ${esc(oldName)} as a minor <span class="muted">(otherwise it's paused, with all progress saved)</span></label>`:"";
 const kind=(d,r)=>r.kind==="steps"?`<span class="tag">New route · own steps</span>`:r.via?`<span class="tag" style="color:var(--cross);border-color:var(--cross)">Via a branch</span>`:`<span class="tag">Program</span>`;
 if(D.mode==="menu"){const opt=(attr,title,text,ok=true)=>ok?`<button type="button" class="cc-opt" ${attr}><b>${title}</b><span>${text}</span></button>`:"";
  body=`<div class="eyebrow">Change course</div><h2>It's never too late</h2><p class="muted">Your path isn't set. Pick what fits where you are right now. Everything you've done stays with you.</p>
   <div class="cc-list">${opt('data-ccmode="update"',"Something changed","A tough grade, a new interest, a change of heart. Tell your companion and your trees adapt.")}
   ${opt('data-dstmode="roadblock"',"Same goal, different route",cd?`Find another way to become a ${esc(cd.dest.name)}.`:"",!!cd)}
   ${opt('data-dstmode="goal"',`New goal from ${esc(P[pid].name)}`,"Keep your path and aim it somewhere new, through one of its branches.")}
   ${opt('data-dstmode="new"',"Start a new program","Switch fields completely. Your old path can stay as a minor.")}
   ${opt('data-ccmode="quiz"',"Retake the quiz","Answer the questions again as the person you are now.")}</div>`}
 else if(D.mode==="roadblock"){const alts=alternateRoutes(D.reasons);
  body=`<div class="eyebrow">Same goal, another way</div><h2>Other routes to ${esc(cd.dest.name)}</h2><p class="muted">Roadblocks are normal. What's getting in the way? Routes that help most move to the top.</p>
   <div class="chips">${DESTS.reasons.map(x=>`<button type="button" class="chip" data-reason="${x.id}" aria-pressed="${D.reasons.includes(x.id)}" title="${esc(x.hint)}">${esc(x.label)}</button>`).join("")}</div>
   <div class="dst-list">${alts.length?alts.map(r=>{const fit=r.goodFor.filter(g=>D.reasons.includes(g));return`<div class="dst-item ${fit.length?"match":""}"><div class="dst-item-top"><b>${esc(routeLabel(cd.dest,r))}</b>${kind(cd.dest,r)}</div><p>${esc(r.why)}</p>
    ${fit.length?`<div class="dst-fit">Helps with: ${fit.map(g=>esc(DESTS.reasons.find(x=>x.id===g).label.toLowerCase())).join(", ")}</div>`:""}
    <button class="btn small primary" data-take="${cd.dest.id}|${r.id}">Take this route</button></div>`}).join(""):`<div class="notice">There's only one route to this goal so far. Try a new goal from your path, or ask your companion to suggest one.</div>`}</div>${keep}`}
 else if(D.mode==="goal"){const list=destinationsFrom(pid).filter(x=>x.dest.id!==cd?.dest.id);
  body=`<div class="eyebrow">Keep your path, change the goal</div><h2>Where can ${esc(P[pid].name)} take you?</h2><p class="muted">These goals are reachable from the path you're on, directly or through one of its branches.</p>
   <div class="dst-list">${list.length?list.map(({dest,route})=>`<div class="dst-item"><div class="dst-item-top"><b>${esc(dest.name)}</b>${route.via?`<span class="tag" style="color:var(--cross);border-color:var(--cross)">via ${esc(P[route.via].name)}</span>`:`<span class="tag">This path</span>`}</div><p>${esc(dest.blurb)}</p><p class="muted small">${route.via?`Follow your ${esc(P[route.via].name)} branch.`:esc(route.why)}</p><button class="btn small primary" data-take="${dest.id}|${route.id}" data-tmode="goal">Set as my goal</button></div>`).join("")
    :`<div class="notice">No goals are linked to this path yet. Start a new program instead, or ask your companion.</div>`}</div>
   <button class="linkbtn" data-dstmode="new">Or start a completely new program →</button>`}
 else{const q=D.q.trim().toLowerCase();const groups={};for(const d of DESTS.destinations){if(q&&!(d.name+" "+d.blurb+" "+(P[d.field]?.name||"")).toLowerCase().includes(q))continue;(groups[d.field]??=[]).push(d)}
  body=`<div class="eyebrow">Start fresh</div><h2>Start a new program</h2><p class="muted">Pick any goal, even in a completely different field, like agriculture to political science. Everything you've finished stays on your record.</p>
   <label class="fl" for="dstQ">Search goals<input type="text" id="dstQ" value="${esc(D.q)}" placeholder="e.g. nurse, policy, farm, design"></label>
   <div class="dst-list">${Object.entries(groups).map(([f,ds])=>`<div class="dst-group"><div class="eyebrow" style="color:var(--muted)">${esc(P[f]?.name||f)}</div>${ds.map(d=>{const main=d.routes[0];return`<div class="dst-item ${cd?.dest.id===d.id?"match":""}"><div class="dst-item-top"><b>${esc(d.name)}</b>${cd?.dest.id===d.id?`<span class="tag major">Current goal</span>`:""}</div><p>${esc(d.blurb)}</p><p class="muted small">Start with: ${esc(routeLabel(d,main))}${d.routes.length>1?` · ${d.routes.length-1} backup route${d.routes.length>2?"s":""}`:""}</p><button class="btn small primary" data-take="${d.id}|${main.id}" data-tmode="new">Start this program</button></div>`}).join("")}</div>`).join("")||`<div class="notice">No goals match that search.</div>`}</div>
   ${keep}
   <div class="dst-grow"><label class="fl" for="dstGrow">Not listed? Grow a new program with your companion</label><div style="display:flex;gap:8px"><input type="text" id="dstGrow" placeholder="e.g. Agriculture, Political science, Architecture"><button class="btn gold" id="dstGrowBtn">Grow</button></div></div>`}
 el.innerHTML=`<div class="qz-card"><div class="qz-top"><div style="flex:1"></div><button type="button" class="btn small" id="dstClose">Close</button></div><div class="qz-body">${body}</div></div>`;bindDest()}
function bindDest(){const el=$("dst"),D=DST;$("dstClose").onclick=closeDest;el.onkeydown=e=>{if(e.key==="Escape")closeDest()};
 el.querySelectorAll("[data-reason]").forEach(b=>b.onclick=()=>{const r=b.dataset.reason;D.reasons=D.reasons.includes(r)?D.reasons.filter(x=>x!==r):[...D.reasons,r];drawDest()});
 el.querySelectorAll("[data-dstmode]").forEach(b=>b.onclick=()=>{D.mode=b.dataset.dstmode;drawDest()});
 el.querySelectorAll("[data-ccmode]").forEach(b=>b.onclick=()=>{const m=b.dataset.ccmode;closeDest();m==="update"?openUpdate():openQuiz()});
 const k=$("dstKeep");if(k)k.onchange=()=>D.keepOld=k.checked;
 const q=$("dstQ");if(q){q.oninput=()=>{D.q=q.value;const pos=q.selectionStart;drawDest();const n=$("dstQ");n.focus();n.setSelectionRange(pos,pos)}}
 const gb=$("dstGrowBtn");if(gb)gb.onclick=()=>{const v=$("dstGrow").value.trim();if(!v)return;closeDest();$("orbPanel").hidden=false;greet();grow(v)};
 el.querySelectorAll("[data-take]").forEach(b=>b.onclick=()=>{const[did,rid]=b.dataset.take.split("|");const mode=b.dataset.tmode||D.mode;const res=applyDestination(did,rid,{mode,keepOld:D.keepOld});closeDest();if(!res)return;S.view="world";save();render();
  banner(mode==="roadblock"?"NEW ROUTE":mode==="goal"?"NEW GOAL":"NEW PROGRAM",mode==="roadblock"?`${res.route.label} → ${res.dest.name}`:res.dest.name,"var(--accent)");burst({x:innerWidth/2,y:innerHeight/2},24)})}
