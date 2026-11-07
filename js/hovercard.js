/* Edventure · Interactive card beside a skill node on hover or focus. */
/* ---------- hover card next to objectives ---------- */
const hc=$("hcard");let hcTimer=null,hcNode=null,hcPinned=false;
const canHover=matchMedia("(hover:hover) and (pointer:fine)").matches;
function hideCard(force){if(hcPinned&&!force)return;hc.hidden=true;hcPinned=false;document.querySelectorAll(".node.hov").forEach(g=>g.classList.remove("hov"));hcNode=null}
function scheduleHide(){clearTimeout(hcTimer);hcTimer=setTimeout(()=>hideCard(),220)}
function showCard(g){clearTimeout(hcTimer);if(hcNode===g&&!hc.hidden)return;hcPinned=false;
 const pid=g.closest("[data-pid]")?.dataset.pid||S.path;const P=allPaths();const p=P[pid];const n=p?.nodes.find(x=>x.id===g.dataset.node);if(!n)return;
 document.querySelectorAll(".node.hov").forEach(x=>x.classList.remove("hov"));g.classList.add("hov");hcNode=g;
 const st=nodeState(pid,n);const tgt=n.branch&&P[n.branch];const reqNames=n.req.map(r=>p.nodes.find(x=>x.id===r)?.title).filter(Boolean);
 hc.innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span class="eyebrow">${esc(TIERS[Math.min(n.t,4)])}</span><span class="status ${st}">${statusLabel(pid,n,st)}</span></div>
 <h4>${esc(n.title)}</h4>
 ${n.mastery?`<div class="crossnote" style="color:var(--gold)">${mastered(pid,n)?"Mastered":`Stage ${mlevel(pid,n)+1} of ${stageCount(n)} · ${STAGE_NAMES[mlevel(pid,n)]}`}</div>`:""}<div class="objective">${esc(curObjective(pid,n))}</div>
 ${n.mastery&&n.cross&&P[n.cross.to]?`<div class="crossnote">${mastered(pid,n)?"Crossover unlocked":"Master it to unlock a crossover"} → ${esc(P[n.cross.to].name)}</div>`:""}${n.crossSrc?`<div class="crossnote">Crossover from mastering ${esc(n.crossSrc.title)}</div>`:""}
 ${viewMode()==="simple"?`<div class="rewards"><span><span class="gem" style="width:8px;height:8px"></span> ${nextGems(pid,n)} gems</span></div>`:`<div class="rewards"><span><span class="gem" style="width:8px;height:8px"></span> ${nextGems(pid,n)} gems${n.mastery&&!mastered(pid,n)?" this stage":""}</span>${Object.entries(statReward(p,n)).map(([k,v])=>`<span>+${v} ${STATS[k]}</span>`).join("")}</div>`}
 ${viewMode()!=="simple"&&n.res?.length?`<ul class="res">${n.res.slice(0,2).map(r=>`<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}<span>↗</span></a></li>`).join("")}</ul>`:""}
 ${st==="locked"?`<div class="muted" style="font-size:13px">${lockText(pid,n,reqNames)}</div>`:""}
 ${(st==="done"||st==="mastering")&&S.notes[pid+":"+n.id]?`<div class="muted" style="font-size:13px;font-style:italic">“${esc(S.notes[pid+":"+n.id])}”</div>`:""}
 <div id="hcForm" hidden style="display:grid;gap:6px"><label class="fl" for="hcReflect">What did you make or learn?</label><textarea id="hcReflect" style="min-height:56px"></textarea><div class="muted" id="hcMsg" style="font-size:12px"></div></div>
 <div class="acts">${st==="open"||st==="mastering"?`<button class="btn small gold" id="hcDone">${n.mastery?"Claim "+STAGE_NAMES[mlevel(pid,n)]:"Complete"}</button>`:""}${tgt?`<button class="btn small" id="hcBranch">Preview ${esc(tgt.name)} →</button>`:""}<button class="btn small" id="hcMore">Full details</button></div>`;
 hc.hidden=false;
 const r=g.getBoundingClientRect(),W=hc.offsetWidth,H=hc.offsetHeight,gap=14;
 let side="right",x=r.right+gap;if(x+W>innerWidth-12){side="left";x=r.left-gap-W}if(x<12){x=Math.max(12,Math.min(innerWidth-W-12,r.left));side=""}
 let y=r.top+r.height/2-34;y=Math.max(70,Math.min(innerHeight-H-12,y));
 hc.style.left=x+"px";hc.style.top=y+"px";hc.className="hcard "+side;hc.style.setProperty("--ay",Math.max(12,Math.min(H-24,r.top+r.height/2-y-6))+"px");
 const d=$("hcDone");if(d)d.onclick=()=>{const f=$("hcForm");if(f.hidden){f.hidden=false;hcPinned=true;d.textContent="Claim treasure";$("hcReflect").focus();return}
  const txt=$("hcReflect").value.trim();if(txt.length<15){$("hcMsg").textContent="Write at least a sentence about what you did.";return}claimNode(pid,n.id,txt)};
 const b=$("hcBranch");if(b)b.onclick=()=>{hideCard(true);S.path=n.branch;S.sel=null;setView("tree")};
 $("hcMore").onclick=()=>{hideCard(true);S.path=pid;S.sel=n.id;setView("tree")};}
function bindHover(root){root.querySelectorAll(".node").forEach(g=>{
 if(canHover){g.addEventListener("mouseenter",()=>showCard(g));g.addEventListener("mouseleave",scheduleHide)}
 g.addEventListener("focus",()=>showCard(g));g.addEventListener("blur",()=>setTimeout(()=>{if(!hc.contains(document.activeElement))scheduleHide()},0))})}
hc.addEventListener("mouseenter",()=>clearTimeout(hcTimer));hc.addEventListener("mouseleave",scheduleHide);
hc.addEventListener("focusout",e=>{if(!hc.contains(e.relatedTarget)&&!hcPinned)scheduleHide()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!hc.hidden){const g=hcNode;hideCard(true);g?.focus()}});
document.addEventListener("pointerdown",e=>{if(!hc.hidden&&!hc.contains(e.target)&&!e.target.closest(".node"))hideCard(true)});
addEventListener("scroll",()=>{if(!hcPinned)hideCard()},{passive:true,capture:true});
addEventListener("resize",()=>hideCard(true));
document.querySelectorAll("nav.tabs button").forEach(b=>b.onclick=()=>{hideCard(true);setView(b.dataset.view)});
