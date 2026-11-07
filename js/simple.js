/* Edventure · Simple view and "Start over".
   Simple view replaces the dense tree diagram with a clean step-by-step roadmap: a short path debrief at the top,
   then each stage as a list of objectives that expand into a plain-language debrief.
   The Simple/Detailed switch is a temporary preview toggle so the team can compare both designs. */

const viewMode=()=>S.ui?.mode==="detailed"?"detailed":"simple";
function modeSwitch(){const m=viewMode();return`<div class="modeswitch" role="group" aria-label="Skill tree view (preview toggle)"><span class="ms-tag">Preview</span><button type="button" data-mode="simple" aria-pressed="${m==="simple"}">Simple</button><button type="button" data-mode="detailed" aria-pressed="${m==="detailed"}">Detailed</button></div>`}

function viewTreeSimple(){const P=allPaths();if(!P[S.path])S.path="cs";const pid=S.path,p=P[pid];
 if(S.sel&&!p.nodes.find(n=>n.id===S.sel))S.sel=null;
 const st=n=>nodeState(pid,n);const steps=p.nodes;const doneN=steps.filter(n=>done(pid,n.id)).length;const pct=Math.round(doneN/steps.length*100);
 const next=steps.find(n=>st(n)==="mastering")||steps.find(n=>st(n)==="open"&&!n.branch)||steps.find(n=>st(n)==="open");
 const leads=[...new Set(steps.filter(n=>n.branch&&P[n.branch]).map(n=>n.branch))];
 const skills=Object.entries(p.weights||{}).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>STATS[k]);
 const order=[...new Set([...S.pinned,pid])];
 const tiers=[...new Set(steps.map(n=>Math.min(n.t,4)))].sort((a,b)=>a-b);
 const role=roleOf(pid);
 return`<div class="section simple"><div class="treehead"><div><div class="eyebrow">${role==="major"?"Your current focus":role==="minor"?"Your minor":S.pinned.includes(pid)?"On your journey":"Exploring"}</div><h2>${esc(p.name)}</h2></div><div class="head-actions"><button type="button" class="btn small" data-dst="menu">⤳ Change course</button>${modeSwitch()}</div></div>
 <div class="pathpick">${order.filter(k=>P[k]).map(k=>`<button class="chip" data-open="${k}" aria-pressed="${k===pid}">${esc(P[k].name)}</button>`).join("")}<button class="chip" data-go="paths">All paths…</button></div>
 <div class="debrief">
  <div class="db-ring" style="--pct:${pct}"><b>${pct}%</b></div>
  <div class="db-main"><div class="eyebrow">Path debrief</div><p class="db-blurb">${esc(p.blurb)}</p>
   <dl class="db-facts"><div><dt>Progress</dt><dd>${doneN} of ${steps.length} steps</dd></div><div><dt>Next step</dt><dd>${next?esc(next.title):"All done. Nice work!"}</dd></div><div><dt>Builds</dt><dd>${skills.map(esc).join(", ")}</dd></div>${leads.length?`<div><dt>Can lead to</dt><dd>${leads.map(k=>esc(P[k].name)).join(", ")}</dd></div>`:""}</dl>
   ${next?`<button class="btn primary small" data-snode="${esc(next.id)}">Go to next step</button>`:""}</div>
 </div>
 ${p.ai?`<div class="notice">Your companion grew this path with AI. Check the links before relying on them.</div>`:""}
 <ol class="stages">${tiers.map((t,i)=>`<li class="stage"><h3 class="stage-h"><span class="stage-n">${i+1}</span>${esc(TIERS[t])}</h3><div class="stage-list">${steps.filter(n=>Math.min(n.t,4)===t).map(n=>simpleCard(P,pid,p,n)).join("")}</div></li>`).join("")}</ol>
 <details class="smore"><summary>Major, minor and journey options</summary><div style="display:grid;gap:12px;padding-top:10px">${planBar(P,pid,p)}<button class="btn small" data-pin="${pid}" style="justify-self:start">${S.pinned.includes(pid)?"Unpin from journey":"Pin this path to my journey"}</button></div></details>
 </div>`}

function simpleCard(P,pid,p,n){const s=nodeState(pid,n),open=S.sel===n.id;
 const meta=s==="done"?"✓ Done":s==="mastering"?`Stage ${mlevel(pid,n)} of ${stageCount(n)}`:s==="open"?`+${nextGems(pid,n)} gems`:"Later";
 const icon=n.goal?"★ ":n.crossSrc?"⇄ ":n.branch?"→ ":n.mine?"✎ ":"";
 return`<article class="scard ${s}${open?" open":""}"><button type="button" class="scard-head" data-snode="${esc(n.id)}" aria-expanded="${open}"><span class="sdot" aria-hidden="true"></span><span class="scard-title">${icon}${esc(n.title)}</span><span class="scard-meta">${meta}</span></button>${open?simpleBody(P,pid,p,n,s):""}</article>`}

function simpleBody(P,pid,p,n,s){const req=n.req.map(r=>p.nodes.find(x=>x.id===r)?.title).filter(Boolean);const note=S.notes[pid+":"+n.id];
 const line=(label,html)=>`<p><span class="lbl">${label}</span>${html}</p>`;
 return`<div class="scard-body">
  ${n.learn?line("You'll learn",esc(n.learn)):""}
  ${line(n.mastery?`Your task · ${esc(STAGE_NAMES[Math.min(mlevel(pid,n),stageCount(n)-1)])}`:"Your task",esc(curObjective(pid,n)))}
  ${n.mastery&&n.cross&&P[n.cross.to]?`<p class="muted small">${mastered(pid,n)?`Mastered! You can now cross over into ${esc(P[n.cross.to].name)}.`:`Finish all ${stageCount(n)} stages to unlock a jump into ${esc(P[n.cross.to].name)}.`}</p>`:""}
  ${n.crossSrc?`<p class="muted small">A crossover you unlocked by mastering ${esc(n.crossSrc.title)}.</p>`:""}
  ${n.res?.length?line("Start here",n.res.slice(0,2).map(r=>`<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)} ↗</a>`).join(" · ")):""}
  ${s==="locked"?(n.crossSrc?`<p class="muted small">Master ${esc(n.crossSrc.title)} first to unlock this crossover.</p>`:`<div class="scard-early"><p class="muted small">Suggested after ${req.map(esc).join(" and ")}, but there's no wrong order.</p><button type="button" class="btn small" data-early="${esc(pid)}|${esc(n.id)}">Start it now anyway</button></div>`):""}
  ${n.branch&&P[n.branch]?`<button type="button" class="btn small" data-open="${n.branch}" style="justify-self:start">Explore ${esc(P[n.branch].name)} →</button>`:""}
  ${s==="open"||s==="mastering"?`<div class="scard-claim"><label class="fl" for="reflect">When you've done it, tell us in a sentence</label><textarea id="reflect" rows="2" placeholder="What did you make or learn?"></textarea><div class="scard-actions"><button class="btn gold" id="claim">${n.mastery?`Claim ${esc(STAGE_NAMES[mlevel(pid,n)])} stage`:"Mark as done"}</button><span class="muted" id="claimMsg" style="font-size:13px"></span></div></div>`:""}
  ${note&&s!=="open"?line("Your note",`<i>“${esc(note)}”</i>`):""}
  <button type="button" class="linkbtn" data-mode="detailed">See this in the detailed view</button>
 </div>`}

/* ---------- start over ---------- */
function confirmDialog({title,body,ok,danger,onOk}){let el=$("cfm");if(!el){el=document.createElement("div");el.id="cfm";el.setAttribute("role","alertdialog");el.setAttribute("aria-modal","true");document.body.append(el)}
 el.innerHTML=`<div class="qz-card" style="width:min(460px,100%)"><div class="qz-body"><h2 id="cfmTitle" style="font-size:22px">${esc(title)}</h2><p class="muted">${esc(body)}</p></div><div class="qz-nav"><span style="flex:1"></span><button type="button" class="btn" id="cfmNo">Cancel</button><button type="button" class="btn ${danger?"danger":"primary"}" id="cfmOk">${esc(ok)}</button></div></div>`;
 el.setAttribute("aria-labelledby","cfmTitle");el.hidden=false;const close=()=>{el.hidden=true};
 $("cfmNo").onclick=close;$("cfmOk").onclick=()=>{close();onOk()};el.onkeydown=e=>{if(e.key==="Escape")close()};$("cfmNo").focus()}
function startOver(){confirmDialog({title:"Start over?",body:"This clears your profile, progress, goals, treasure and purchases, then restarts the starting quiz. It can't be undone.",ok:"Start over",danger:true,onOk:()=>{
 const mode=S.ui?.mode;S=fresh();if(mode)S.ui={mode};
 if(TEST_MODE){S.testGrant=1;S.testGrant2=1;S.gems+=25000}
 S.chat=[];$("orbLog").innerHTML="";$("orbPanel").hidden=true;window.scrollTo(0,0);save();render();openQuiz()}})}
