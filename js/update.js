/* Edventure · "Something changed?" path updates.
   A student describes a recent event or change of heart in their own words. The companion (or, without AI, a simple
   keyword reader) suggests which paths to keep, pause, add or grow, plus a small first step. Applying the update
   reshapes their journey without ever deleting progress. Top-level code only defines functions, so tests can load it. */

/* ---------- offline reader: used when the AI companion isn't connected ---------- */
const UPD_PATH_WORDS={cs:["computer science","coding","code","programming","program","software","app"],cyber:["cyber","hacking","hack","security"],data:["data","statistic","stats","spreadsheet","analytics"],
 health:["health","medicine","medical","doctor","nurse","biology","patient","hospital","anatomy"],eng:["engineer","build","building","construct","model","models","machine","robot","cad","3d","bridge","physics","hands-on","hands on"],
 design:["design","art","drawing","draw","visual","ux","graphic","creative"],law:["law","legal","debate","justice","policy","rights","argue"],biz:["business","startup","money","marketing","sell","entrepreneur","leading","manage"]};
const UPD_STAT_WORDS={logic:["problem solving","problem-solving","puzzle","logic","math","maths","calculus"],tech:["computer","coding","code","programming","tech","software"],science:["science","biology","chemistry","physics","experiment"],
 creativity:["creative","art","design","draw","music","writing"],charisma:["talking","present","debate","lead","people skills","speaking"],empathy:["helping","help people","care","caring","kids","community"],craft:["build","building","construct","hands","making","model","models","fix"]};
const UPD_GROW_WORDS={"Architecture":["model","construct","architect","building design","buildings"],"Industrial Design":["prototype","product design","models"],"Psychology":["psychology","mind","behaviour","behavior","mental health"],
 "Environmental Science":["environment","climate","nature","sustainab"],"Game Design":["game design","video game","games"],"Education":["teach","tutor","teacher"],"Film & Media":["film","video editing","media","youtube"],"Trades & Construction":["carpentry","electrician","plumb","trades","welding"]};
const NEG=/\b(not|don'?t|do not|didn'?t|never|hate|dislike|failed|fail|failing|struggl\w*|bored|boring|no longer|stopped|quit|tired of|can'?t stand)\b/i;
function heuristicUpdate(text){const P=allPaths(),journey=S.pinned.filter(k=>P[k]);
 const clauses=text.toLowerCase().split(/[.!?;,]|\bbut\b|\band\b|\bhowever\b/).map(c=>c.trim()).filter(Boolean);
 const pos={},neg={},more=new Set(),less=new Set(),grow=new Set();
 for(const c of clauses){const bad=NEG.test(c);
  for(const[k,words]of Object.entries(UPD_PATH_WORDS))if(P[k]&&words.some(w=>c.includes(w)))(bad?neg:pos)[k]=((bad?neg:pos)[k]||0)+1;
  const cs=c.replace(/computer science/g,"computing"); // "computer science" shouldn't count as the Science stat
  for(const[k,words]of Object.entries(UPD_STAT_WORDS))if(words.some(w=>cs.includes(w)))(bad?less:more).add(k);
  if(!bad)for(const[name,words]of Object.entries(UPD_GROW_WORDS))if(words.some(w=>c.includes(w))&&!Object.values(P).some(p=>p.name.toLowerCase()===name.toLowerCase()))grow.add(name)}
 for(const k of more)less.delete(k);
 const score=k=>{const w=P[k].weights||{};let s=(pos[k]||0)*3-(neg[k]||0)*4;for(const st of more)s+=w[st]||0;for(const st of less)s-=w[st]||0;return s};
 const pause=journey.filter(k=>neg[k]&&!pos[k]).map(k=>({id:k,note:"It's okay to step back. Your progress here stays saved, and you can resume any time."}));
 const keep=journey.filter(k=>!pause.some(p=>p.id===k)).map(k=>({id:k,note:score(k)>0?"This still lines up with what you enjoy.":"Keep it open while you test new directions."}));
 const add=Object.keys(P).filter(k=>!journey.includes(k)&&score(k)>0).sort((a,b)=>score(b)-score(a)).slice(0,2).map(k=>({id:k,why:`It leans on ${Object.entries(P[k].weights||{}).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([s])=>STATS[s]).join(" and ")}, which matches what you said you enjoy.`}));
 const target=add[0]?.id||keep[0]?.id;const first=target&&P[target].nodes.find(n=>!n.req.length&&!n.mine);
 const fmt=set=>[...set].map(s=>STATS[s]).join(" and ");
 const summary=`Thanks for sharing that. ${neg.cs||NEG.test(text)?"A tough result or a change of heart is useful information, not a failure. ":""}${more.size?`It sounds like you're drawn to ${fmt(more)}${less.size?` more than ${fmt(less)}`:""}. `:""}Here are some paths to try, and nothing you've already done is lost.`;
 return{summary,signals:{more:[...more],less:[...less]},keep,pause,add,grow:[...grow].slice(0,2).map(name=>({name,why:"It matches the kind of work you described."})),
  firstStep:first?{pathId:target,title:`Try: ${first.title}`.slice(0,40),objective:`Spend an hour this week on “${first.objective}” and write down whether you enjoyed it.`}:null,offline:true}}

/* ---------- cleaning AI output so it can only touch real paths ---------- */
function sanitizeUpdate(raw){const P=allPaths(),journey=S.pinned.filter(k=>P[k]);const t=(v,n)=>String(v??"").trim().slice(0,n);
 const seen=new Set();const pick=(list,ok,max,field)=>(Array.isArray(list)?list:[]).filter(x=>x&&ok(x.id)&&!seen.has(x.id)&&seen.add(x.id)).slice(0,max).map(x=>({id:x.id,[field]:t(x[field],240)}));
 const pause=pick(raw?.pause,k=>journey.includes(k),4,"note");const keep=pick(raw?.keep,k=>journey.includes(k),6,"note");const add=pick(raw?.add,k=>P[k]&&!journey.includes(k),3,"why");
 const names=new Set(Object.values(P).map(p=>p.name.toLowerCase()));
 const grow=(Array.isArray(raw?.grow)?raw.grow:[]).map(g=>({name:t(g?.name,40),why:t(g?.why,200)})).filter(g=>g.name&&!names.has(g.name.toLowerCase())).slice(0,2);
 const sig=l=>(Array.isArray(l)?l:[]).filter(k=>SK.includes(k)).slice(0,3);
 let fs=raw?.firstStep;fs=fs&&P[fs.pathId]&&t(fs.objective,300)?{pathId:fs.pathId,title:t(fs.title,40)||"First step",objective:t(fs.objective,300)}:null;
 return{summary:t(raw?.summary,600)||"Thanks for sharing. Here are some ways your journey could adapt.",signals:{more:sig(raw?.signals?.more),less:sig(raw?.signals?.less)},keep,pause,add,grow,firstStep:fs}}

/* ---------- applying an update (pure state changes) ---------- */
function applyUpdate(U,text,choice){const P=allPaths();const date=new Date().toISOString().slice(0,10);
 const pause=U.pause.filter(x=>choice.pause.includes(x.id)),add=U.add.filter(x=>choice.add.includes(x.id));
 S.paused=[...new Set([...(S.paused||[]),...pause.map(x=>x.id)])].filter(k=>!add.some(a=>a.id===k));
 S.pinned=[...new Set([...S.pinned.filter(k=>!S.paused.includes(k)),...add.map(x=>x.id)])];
 if(S.paused.includes(S.major))S.major=null;S.minors=S.minors.filter(k=>!S.paused.includes(k));
 S.pathNotes??={};
 pause.forEach(x=>S.pathNotes[x.id]={tag:"paused",note:x.note,date});add.forEach(x=>S.pathNotes[x.id]={tag:"new",note:x.why,date});
 let stepId=null;
 if(choice.firstStep&&U.firstStep&&P[U.firstStep.pathId]){const pid=U.firstStep.pathId;stepId="step-"+Date.now().toString(36);
  (S.extraNodes[pid]??=[]).push({id:stepId,t:0,title:U.firstStep.title,objective:U.firstStep.objective,learn:"A first step from your path update. Small experiments are the fastest way to learn what you enjoy.",res:[],req:[],mine:true,goal:"update"});
  if(!S.pinned.includes(pid))S.pinned.push(pid)}
 const first=add[0]?.id||(U.firstStep&&P[U.firstStep.pathId]?U.firstStep.pathId:null);
 S.compare=[...new Set([...add.map(x=>x.id),...S.pinned])].filter(k=>P[k]).slice(0,3);
 S.updates=[{date,text:text.slice(0,600),summary:U.summary,added:add.map(x=>x.id),paused:pause.map(x=>x.id),grown:[],step:stepId?{pid:U.firstStep.pathId,id:stepId}:null},...(S.updates||[])].slice(0,10);
 if(first){S.path=first;S.sel=stepId&&U.firstStep.pathId===first?stepId:null}
 S.worldMine=true;save();return S.updates[0]}

/* ---------- screens ---------- */
let UPD=null;
const UPD_EXAMPLES=["I failed my Computer Science course, and I realised I don't enjoy problem solving. I like constructing models. What could I try?",
 "I volunteered at a hospital this summer and loved helping patients, but I'm not sure I want to be a doctor.",
 "I joined the debate team and I'm really good at it. I didn't expect that!"];
function openUpdate(prefill=""){UPD={step:"write",text:prefill,U:null,choice:null,err:""};let el=$("upd");
 if(!el){el=document.createElement("div");el.id="upd";el.className="qz-overlay";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-label","Update my path");document.body.append(el)}
 el.hidden=false;document.body.style.overflow="hidden";$("orbPanel").hidden=true;drawUpdate()}
function closeUpdate(){const el=$("upd");if(el)el.hidden=true;document.body.style.overflow="";UPD=null}
function updCompanion(){const c=comp();return`<div class="upd-who">${c.svg?`<span class="upd-face">${c.svg}</span>`:`<span class="qz-orb" style="width:40px;height:40px"></span>`}<b>${esc(c.name)}</b></div>`}
function drawUpdate(){const el=$("upd"),D=UPD,P=allPaths();let body="",nav="";
 if(D.step==="write"){body=`<div class="eyebrow">Something changed?</div><h2>What's new with you?</h2>
   <p class="muted">A tough grade, a new hobby, a summer job, a change of heart: tell ${esc(compName())} what happened and how you feel about it. Your trees will adapt, and nothing you've done is lost.</p>
   <label class="fl" for="updText">In your own words<textarea id="updText" maxlength="1000" rows="5" placeholder="e.g. I failed my Computer Science course and realised I don't enjoy problem solving. I like constructing models. What could I try?">${esc(D.text)}</textarea></label>
   <div class="fl">Need a starting point?<div class="chips">${UPD_EXAMPLES.map((x,i)=>`<button type="button" class="chip" data-updex="${i}">${esc(x.length>58?x.slice(0,56)+"…":x)}</button>`).join("")}</div></div>
   ${AI.configured===false?`<div class="notice">The AI companion isn't connected, so Edventure will use a simpler keyword reading of what you write.</div>`:""}
   ${D.err?`<div class="notice" style="border-color:var(--rose);color:var(--rose)">${esc(D.err)}</div>`:""}`;
  nav=`<button type="button" class="btn" id="updCancel">Cancel</button><span style="flex:1"></span><button type="button" class="btn primary" id="updGo">Update my trees</button>`}
 else if(D.step==="thinking"){body=`<div class="upd-thinking">${updCompanion()}<h2>Thinking it through…</h2><p class="muted">${esc(compName())} is reading what you shared and looking across every path.</p><div class="qz-progress upd-spin"><i></i></div></div>`}
 else if(D.step==="result"){const U=D.U,C=D.choice;const name=k=>esc(P[k]?.name||k);
  const row=(kind,id,text,checked,label,off)=>`<label class="qz-res ${checked?"on":""}" ${off?'style="opacity:.6;cursor:not-allowed"':""}><input type="checkbox" data-upd="${kind}" value="${esc(id)}" ${checked?"checked":""} ${off?"disabled":""}><div class="qz-res-main"><div class="qz-res-top"><b>${label}</b></div>${text?`<div class="muted" style="font-size:14px">${esc(text)}</div>`:""}</div></label>`;
  body=`<div class="eyebrow">Your path update</div>
   <div class="upd-summary">${updCompanion()}<p>${esc(U.summary)}</p></div>
   ${U.signals.more.length||U.signals.less.length?`<div class="chips">${U.signals.more.map(s=>`<span class="chip upd-up">↑ ${esc(STATS[s])}</span>`).join("")}${U.signals.less.map(s=>`<span class="chip upd-down">↓ ${esc(STATS[s])}</span>`).join("")}</div>`:""}
   ${U.add.length?`<h3>Try next</h3><div class="qz-results">${U.add.map(x=>row("add",x.id,x.why,C.add.includes(x.id),`${name(x.id)} <span class="tag" style="color:var(--gold);border-color:var(--gold)">Add to journey</span>`)).join("")}</div>`:""}
   ${U.grow.length?`<h3>New trees to grow</h3><div class="qz-results">${U.grow.map(g=>row("grow",g.name,g.why+(AI.configured===false?" (needs the AI companion)":""),C.grow.includes(g.name),`${esc(g.name)} <span class="tag ai">Grow with AI</span>`,AI.configured===false)).join("")}</div>`:""}
   ${U.pause.length?`<h3>Pause for now</h3><p class="muted" style="font-size:13px;margin:0">Paused paths leave your journey but keep every objective you finished. Pin them again any time.</p><div class="qz-results">${U.pause.map(x=>row("pause",x.id,x.note,C.pause.includes(x.id),`${name(x.id)}${S.major===x.id?` <span class="tag major">Your major</span>`:""}`)).join("")}</div>`:""}
   ${U.keep.length?`<h3>Keep exploring</h3><div class="upd-keep">${U.keep.map(x=>`<div><b>${name(x.id)}</b>${x.note?` <span class="muted">· ${esc(x.note)}</span>`:""}</div>`).join("")}</div>`:""}
   ${U.firstStep?`<h3>A first step</h3><div class="qz-results">${row("step","1",U.firstStep.objective,C.firstStep,`★ ${esc(U.firstStep.title)} <span class="muted" style="font-weight:400;font-size:13px">in ${name(U.firstStep.pathId)}</span>`)}</div>`:""}
   ${!U.add.length&&!U.grow.length&&!U.pause.length&&!U.firstStep?`<div class="notice">No changes to suggest yet. Try adding a little more about what you enjoy or want to avoid.</div>`:""}
   ${U.offline?`<p class="muted" style="font-size:12px;margin:0">Suggested by Edventure's keyword reader. Connect the AI companion for a more personal reading.</p>`:""}`;
  nav=`<button type="button" class="btn" id="updBack">Edit what I wrote</button><span style="flex:1"></span><button type="button" class="btn primary" id="updApply">Apply changes</button>`}
 el.innerHTML=`<div class="qz-card"><div class="qz-top"><div style="flex:1"></div><button type="button" class="btn small" id="updClose">Close</button></div><div class="qz-body">${body}</div>${nav?`<div class="qz-nav">${nav}</div>`:""}</div>`;
 bindUpdate()}
async function runUpdate(){const text=UPD.text.trim();if(text.length<12){UPD.err="Tell me a little more, at least a sentence, so I can help.";return drawUpdate()}
 UPD.err="";UPD.step="thinking";drawUpdate();let U;
 try{U=AI.configured===false?heuristicUpdate(text):sanitizeUpdate(await AI.reflect(text))}
 catch(e){U={...heuristicUpdate(text)};if(e.code&&e.code!=="not_configured")U.summary=aiError(e,"read that fully")+" Here's a quick keyword reading instead. "+U.summary}
 if(!UPD)return;UPD.U=U;UPD.choice={add:U.add.map(x=>x.id),pause:U.pause.map(x=>x.id),grow:AI.configured===false?[]:U.grow.map(g=>g.name),firstStep:!!U.firstStep};UPD.step="result";drawUpdate()}
async function finishUpdate(){const{U,choice,text}=UPD;const rec=applyUpdate(U,text,choice);closeUpdate();S.view="world";save();render();
 banner("PATH UPDATED",[rec.added.length&&`${rec.added.length} added`,rec.paused.length&&`${rec.paused.length} paused`,choice.grow.length&&`${choice.grow.length} growing`].filter(Boolean).join(" · ")||"Your journey is up to date","var(--accent)");
 for(const name of choice.grow){toast(`Growing a ${name} tree…`);
  try{const j=await AI.grow(name,Object.keys(allPaths()));const id=addPath(j,name,null);rec.grown.push(id);S.pathNotes[id]={tag:"new",note:U.grow.find(g=>g.name===name)?.why||"",date:rec.date};save();render();toast(`${allPaths()[id].name} tree is ready`)}
  catch(e){toast(aiError(e,`grow ${name}`))}}}
function bindUpdate(){const el=$("upd"),D=UPD;const ta=$("updText");if(ta){ta.oninput=()=>D.text=ta.value;if(D.step==="write")setTimeout(()=>ta.focus(),30)}
 el.querySelectorAll("[data-updex]").forEach(b=>b.onclick=()=>{D.text=UPD_EXAMPLES[Number(b.dataset.updex)];drawUpdate()});
 el.querySelectorAll("[data-upd]").forEach(c=>c.onchange=()=>{const k=c.dataset.upd,v=c.value;if(k==="step")D.choice.firstStep=c.checked;else D.choice[k]=c.checked?[...D.choice[k],v]:D.choice[k].filter(x=>x!==v);c.closest(".qz-res").classList.toggle("on",c.checked)});
 const go=$("updGo");if(go)go.onclick=runUpdate;const back=$("updBack");if(back)back.onclick=()=>{D.step="write";drawUpdate()};
 const ap=$("updApply");if(ap)ap.onclick=finishUpdate;
 for(const id of["updClose","updCancel"]){const b=$(id);if(b)b.onclick=closeUpdate}
 el.onkeydown=e=>{if(e.key==="Escape")closeUpdate();if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)&&D.step==="write")runUpdate()}}
function updateCard(){const last=S.updates?.[0];return`<div class="panel upd-card"><div style="min-width:0;flex:1"><div class="eyebrow">Something changed?</div><h3>Update your path</h3><p class="muted" style="margin:4px 0 0;font-size:14px">Failed a course, found a new passion, changed your mind? Tell ${esc(compName())} what happened and your trees will adapt.${last?` Last update: ${esc(last.date)}.`:""}</p></div><button class="btn primary" data-update>Update my path</button></div>`}
