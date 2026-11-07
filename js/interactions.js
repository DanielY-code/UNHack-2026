/* Edventure · Event wiring for each render, plus claiming objectives. */
/* ---------- events ---------- */
let pendingBuy=null;
function toast(t){const el=$("toast");el.textContent=t;el.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>el.hidden=true,2600)}
function bind(){const m=$("main");
 m.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{S.path=b.dataset.open;S.sel=null;setView("tree")});
 m.querySelectorAll("[data-cmp]").forEach(b=>b.onclick=()=>{const k=b.dataset.cmp;S.compare=S.compare.includes(k)?S.compare.filter(x=>x!==k):[...S.compare,k].slice(-3);save();render()});
 m.querySelectorAll("[data-cmpadd]").forEach(b=>b.onclick=()=>{const k=b.dataset.cmpadd;if(!S.compare.includes(k))S.compare=[...S.compare,k].slice(-3);setView("compare")});
 const ca=$("cmpAsk");if(ca)ca.onclick=()=>{const P=allPaths();const names=S.compare.map(k=>P[k].name);$("orbPanel").hidden=false;greet();ask(`Compare ${names.join(" vs ")} for me. Which fits my profile better, what's the biggest difference in day-to-day work, and what's one thing I could do this month that helps with ${names.length>2?"all of them":"both"}?`)};
 m.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>setView(b.dataset.go));
 m.querySelectorAll("[data-pin]").forEach(b=>b.onclick=()=>{const k=b.dataset.pin;S.pinned=S.pinned.includes(k)?S.pinned.filter(x=>x!==k):[...S.pinned,k];save();render()});
 m.querySelectorAll(".node").forEach(g=>{const f=()=>{if(canHover&&hcPinned)return;hideCard(true);S.sel=g.dataset.node;save();render()};g.onclick=f;g.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();f()}}});
 const nm=$("pName");if(nm){nm.oninput=()=>{S.profile.name=nm.value;S.example=false;save();$("hudName").textContent=nm.value||"Adventurer"};nm.onchange=()=>render()}
 const gr=$("pGrade");if(gr)gr.onchange=()=>{S.profile.grade=gr.value;S.example=false;save();render()};
 m.querySelectorAll("[data-int]").forEach(b=>b.onclick=()=>{const i=b.dataset.int,a=S.profile.interests;S.profile.interests=a.includes(i)?a.filter(x=>x!==i):[...a,i];S.example=false;save();render()});
 m.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>{const i=b.dataset.act,a=S.profile.activities;S.profile.activities=a.includes(i)?a.filter(x=>x!==i):[...a,i];S.example=false;save();render()});
 m.querySelectorAll("[data-sub]").forEach(s=>s.onchange=()=>{S.profile.subjects[s.dataset.sub]=s.value;S.example=false;save();render()});
 const ce=$("clearEx");if(ce)ce.onclick=()=>{const f=fresh();S.profile={name:"",grade:"10",interests:[],subjects:Object.fromEntries(Object.keys(SUBJECTS).map(k=>[k,"—"])),activities:[]};S.progress={};S.pinned=[];S.gems=0;S.earned=0;S.notes={};S.example=false;save();render();$("pName")?.focus()};
 const ra=$("resetAll");if(ra)ra.onclick=()=>{$("resetConfirm").innerHTML=`<button class="btn small" id="resetYes" style="border-color:var(--rose);color:var(--rose)">Yes, erase my progress</button>`;$("resetYes").onclick=()=>{S=fresh();save();render()}};
 const cl=$("claim");if(cl)cl.onclick=()=>{const txt=$("reflect").value.trim();if(txt.length<15){$("claimMsg").textContent="Write at least a sentence about what you did — it's your proof of progress.";return}claimNode(S.path,S.sel,txt)};
 bindHover(m);
 const cn=$("compassNext");if(cn)cn.onclick=turnCompass;compassLast=performance.now();
 const pm=$("pMajor");if(pm)pm.onchange=()=>{S.major=pm.value||null;S.minors=S.minors.filter(k=>k!==S.major);save();render()};
 m.querySelectorAll("[data-minor]").forEach(b=>b.onclick=()=>{const k=b.dataset.minor;S.minors=S.minors.includes(k)?S.minors.filter(x=>x!==k):[...S.minors,k].slice(0,2);save();render()});
 m.querySelectorAll("[data-addminor]").forEach(b=>b.onclick=()=>{const k=b.dataset.addminor;if(S.minors.length>=2||S.minors.includes(k))return;S.minors.push(k);if(!S.pinned.includes(k))S.pinned.push(k);const pt=lastPt;save();render();burst(pt,12);toast(`${allPaths()[k].name} added as a minor`)});
 m.querySelectorAll("[data-dropminor]").forEach(b=>b.onclick=()=>{S.minors=S.minors.filter(x=>x!==b.dataset.dropminor);save();render()});
 const sm=$("setMajor");if(sm)sm.onclick=()=>{S.major=S.path;S.minors=S.minors.filter(k=>k!==S.major);const pt=lastPt;save();render();burst(pt,16);banner("MAJOR CHOSEN",allPaths()[S.major].name,"var(--accent)")};
 const so=$("switchOpen");if(so)so.onclick=()=>{$("switchBox").hidden=!$("switchBox").hidden};
 const sn=$("switchNo");if(sn)sn.onclick=()=>{$("switchBox").hidden=true;toast("No rush. Keep exploring.")};
 const sy=$("switchYes");if(sy)sy.onclick=()=>{const old=S.major;const keep=$("keepMinor").checked;S.major=S.path;S.minors=S.minors.filter(k=>k!==S.major);if(keep&&old&&!S.minors.includes(old)){S.minors=[old,...S.minors].slice(0,2)}save();render();
  banner("NEW DIRECTION",`${allPaths()[S.major].name} is your major${keep&&old?` · ${allPaths()[old].name} is now a minor`:""}`,"var(--accent)")};
 const ia=$("ideaAdd");if(ia)ia.onclick=()=>{const t=$("ideaTitle").value.trim(),o=$("ideaObj").value.trim();if(t.length<3||o.length<10){$("ideaMsg").textContent="Give it a name and a sentence about what you'll do.";return}
  const P=allPaths(),p=P[S.path],n=p.nodes.find(x=>x.id===S.sel);const id="u"+Date.now().toString(36);
  (S.extraNodes[S.path]??=[]).push({id,t:Math.min(n.t+1,4),title:t,objective:o,learn:"Your own idea. You decided this matters, and following your curiosity is what real learning looks like.",res:[],req:[n.id],mine:true});
  S.sel=id;const pt=lastPt;save();render();burst(pt,16);toast("Your idea is on the tree")};
 const di=$("delIdea");if(di)di.onclick=()=>{const id=S.sel;S.extraNodes[S.path]=(S.extraNodes[S.path]||[]).filter(x=>x.id!==id).map(x=>({...x,req:x.req.filter(r=>r!==id)}));S.sel=null;save();render();toast("Objective removed")};
 bindWorld();
 m.querySelectorAll("[data-equip]").forEach(b=>b.onclick=()=>{const i=SHOP.find(x=>x.id===b.dataset.equip);if(i.kind==="title")S.equip.title=S.equip.title===i.val?"":i.val;else S.equip[i.kind]=i.val;const pt=lastPt;save();render();burst(pt,10)});
 m.querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>{const i=SHOP.find(x=>x.id===b.dataset.buy);
  if(pendingBuy!==i.id){pendingBuy=i.id;b.textContent=`Confirm ${i.cost}?`;return}pendingBuy=null;if(S.gems<i.cost)return;S.gems-=i.cost;
  if(i.kind==="gift"){S.redeem.unshift({name:i.name,date:new Date().toLocaleDateString(),status:"Waiting for adult approval"});toast("Request recorded")}
  else{S.owned.push(i.id);if(i.kind==="title")S.equip.title=i.val;else S.equip[i.kind]=i.val;toast(`${i.name} unlocked`)}const pt=lastPt;save();render();burst(pt,22);if(i.kind==="comp")banner("NEW COMPANION",`${COMPANIONS[i.val].name} joins your party`,"var(--accent)");else if(i.anim)banner(i.kind==="skin"?"THEME UNLOCKED":"UNLOCKED",i.name,"var(--accent)")});
 m.querySelectorAll("[data-test]").forEach(b=>b.onclick=()=>{const n=Number(b.dataset.test);const pt=lastPt;S.gems+=n;save();flyGems(pt,n);render();toast(`+${n.toLocaleString()} test gems`)});
 const tr=$("tReset");if(tr)tr.onclick=()=>{S.owned=["skin-aurora","orb-moon","comp-orb"];S.equip={skin:"aurora",orb:"moon",title:"",comp:"orb"};S.redeem=[];$("orbLog").innerHTML="";save();render();toast("Purchases reset")};
}
function claimNode(pid,nid,txt){const P=allPaths(),p=P[pid],n=p.nodes.find(x=>x.id===nid);if(!n)return;const key=pid+":"+n.id;let stage;
 if(done(pid,nid)){if(!n.mastery||mastered(pid,n))return;stage=mlevel(pid,n)+1;S.mastery[key]=stage;S.notes[key+"#"+stage]=txt}
 else{if(nodeState(pid,n)!=="open")return;(S.progress[pid]??=[]).push(n.id);S.notes[key]=txt;stage=1;if(n.mastery)S.mastery[key]=1}
 if(!S.pinned.includes(pid))S.pinned.push(pid);const g=stageGems(n,stage);S.gems+=g;const before=level();S.earned+=g;
 if(n.branch&&P[n.branch]&&!S.pinned.includes(n.branch))S.pinned.push(n.branch);
 const nowM=n.mastery&&stage===stageCount(n);
 if(pid===S.path){if(n.mastery&&!nowM)S.sel=n.id;else if(nowM&&n.cross)S.sel=n.id+"-x";else{const nx=p.nodes.find(x=>nodeState(pid,x)==="open");S.sel=nx?nx.id:n.id}}
 const pt=lastPt;save();hideCard(true);render();flyGems(pt,g);burst(pt,nowM?30:14);
 if(nowM)banner("MASTERED",n.cross&&P[n.cross.to]?`Crossover unlocked → ${P[n.cross.to].name}`:n.title,"var(--cross)");else if(level()>before)banner(`LEVEL ${level()}`,"Level up!","var(--gold)");
 toast(nowM&&n.cross&&P[n.cross.to]?`Mastered! Crossover to ${P[n.cross.to].name} unlocked · +${g} gems`:`+${g} gems${n.mastery?` · ${STAGE_NAMES[stage-1]} reached`:""}${level()>before?` · Level up! LV ${level()}`:""}`)}
