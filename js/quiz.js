/* Edventure · Onboarding quiz: profile, scenario questions, goals and direction.
   Results recommend paths, then fill the student's journey, major and trees with their own goal objectives.
   Questions, goals and options live in data/quiz.json. Top-level code only defines functions, so tests can load this file. */

/* ---------- scoring (pure) ---------- */
function quizPathAffinity(answers){const a={};for(const q of QUIZ.questions){const o=q.options[answers?.[q.id]];if(!o)continue;for(const[k,v]of Object.entries(o.paths||{}))a[k]=(a[k]||0)+v}return a}
function profileFromDraft(D){return{name:D.name.trim(),grade:D.grade,interests:[...D.interests],subjects:{...D.subjects},activities:[...D.activities],quiz:{answers:{...D.answers}}}}
function scorePaths(D){const t=baseStats(profileFromDraft(D));const aff=quizPathAffinity(D.answers);const maxAff=Math.max(1,...Object.values(aff));const P=allPaths();
 return Object.entries(P).map(([k,p])=>{const f=fit(p,t),a=(aff[k]||0)/maxAff*100;let score=Math.round(.45*f+.55*a)+(D.program===k?25:0);score=Math.min(100,score);
  const why=[];if(D.program===k)why.push("You already have this program in mind");
  for(const q of QUIZ.questions){const o=q.options[D.answers[q.id]];if(o&&(o.paths?.[k]||0)>=2)why.push(`You chose “${o.label}”`)}
  const strong=Object.entries(p.weights||{}).sort((x,y)=>y[1]-x[1]).slice(0,2).map(([s])=>s).filter(s=>t[s]>=30);
  if(strong.length)why.push(`It uses your ${strong.map(s=>STATS[s]).join(" and ")}`);
  return{id:k,name:p.name,score,why:why.slice(0,3)}}).sort((a,b)=>b.score-a.score)}

/* ---------- applying results (pure state changes) ---------- */
function applyQuiz(D,chosen){const P=allPaths();chosen=chosen.filter(k=>P[k]);if(!chosen.length)return;
 if(S.example){S.progress={};S.notes={};S.mastery={};S.pinned=[];S.minors=[];S.extraNodes={};S.example=false}
 S.profile=profileFromDraft(D);if(!S.profile.name)S.profile.name="Adventurer";
 S.goals={ids:[...D.goals],timeframe:D.timeframe,text:D.text.trim(),certainty:D.certainty,program:D.program||""};
 S.pinned=[...new Set([...chosen,...S.pinned.filter(k=>(S.progress[k]||[]).length)])];
 S.major=D.program&&P[D.program]?D.program:D.certainty==="set"?chosen[0]:null;S.minors=S.minors.filter(k=>k!==S.major);
 const ranked=scorePaths(D).map(r=>r.id);S.compare=[...new Set([...chosen,...ranked])].slice(0,Math.max(2,Math.min(3,chosen.length)));
 // remove unfinished goal objectives from an earlier quiz, then plant the new ones
 for(const k of Object.keys(S.extraNodes))S.extraNodes[k]=S.extraNodes[k].filter(n=>!n.goal||(S.progress[k]||[]).includes(n.id));
 const goalDefs=QUIZ.goals.filter(g=>D.goals.includes(g.id));
 chosen.slice(0,2).forEach(pid=>{const p=allPaths()[pid];const core=p.nodes.filter(n=>!n.branch&&!n.crossSrc&&!n.mine);
  const anchor=core.find(n=>n.t===1)||core[0];const list=(S.extraNodes[pid]??=[]);const has=id=>list.some(n=>n.id===id);
  goalDefs.forEach(g=>{const id=`goal-${g.id}-${pid}`;if(!has(id))list.push({id,t:2,title:g.title,objective:g.objective,learn:g.learn,res:[],req:[anchor.id],mine:true,goal:g.id})});
  if(pid===chosen[0]&&S.goals.text){const id=`goal-own-${pid}`;if(!has(id))list.push({id,t:0,title:S.goals.text.length>34?S.goals.text.slice(0,33)+"…":S.goals.text,objective:S.goals.text,learn:"This is your own goal. Break it into small steps and come back to claim it when you've done it.",res:[],req:[],mine:true,goal:"own"})}});
 S.onboarded=true;S.path=chosen[0];S.sel=null;S.worldFocus=chosen[0];S.worldTrail=[];save()}

/* ---------- quiz screens ---------- */
let QD=null;
function newDraft(){const fromExample=S.example;const p=S.profile;
 return{step:0,name:fromExample?"":p.name,grade:fromExample?"11":(p.grade||"11"),interests:fromExample?[]:[...p.interests],
  subjects:fromExample?Object.fromEntries(Object.keys(SUBJECTS).map(k=>[k,"—"])):{...p.subjects},activities:fromExample?[]:[...p.activities],
  answers:fromExample?{}:{...(p.quiz?.answers||{})},goals:[...(S.goals?.ids||[])],timeframe:S.goals?.timeframe||"",text:S.goals?.text||"",
  certainty:S.goals?.certainty||"",program:S.goals?.program||"",picks:null}}
function quizSteps(){return["welcome","about","interests","courses","activities",...QUIZ.questions.map((q,i)=>"q"+i),"goals","direction","results"]}
function openQuiz(){QD=newDraft();let el=$("quiz");if(!el){el=document.createElement("div");el.id="quiz";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-label","Edventure quiz");document.body.append(el)}
 el.hidden=false;document.body.style.overflow="hidden";drawQuiz()}
function closeQuiz(){const el=$("quiz");if(el)el.hidden=true;document.body.style.overflow="";QD=null}
function chips(list,sel,attr){return`<div class="chips">${list.map(x=>`<button type="button" class="chip" ${attr}="${esc(x)}" aria-pressed="${sel.includes(x)}">${esc(x)}</button>`).join("")}</div>`}
function drawQuiz(){const el=$("quiz");const steps=quizSteps();const id=steps[QD.step];const n=steps.length;const D=QD;let body="",next="Next",canSkip=false;
 if(id==="welcome"){body=`<div class="qz-hero"><div class="qz-orb" aria-hidden="true"></div><div class="eyebrow">A quick quest before your quest</div><h2>Begin your Edventure</h2>
   <p>Answer a few questions about who you are, what you enjoy and what you want to achieve. Edventure will roll your stats, recommend career paths and build your skill trees around your goals.</p><p class="muted">About 3 minutes. Nothing here is permanent: your path can change any time, and it's never too late to start.</p></div>`;next="Start the quiz"}
 else if(id==="about"){body=`<div class="eyebrow">Step 1 · About you</div><h2>Who's adventuring?</h2>
   <div class="qz-row"><label class="fl" for="qzName">First name or nickname<input type="text" id="qzName" maxlength="30" value="${esc(D.name)}" placeholder="e.g. Sam"></label>
   <label class="fl" for="qzGrade">Where are you now?<select id="qzGrade">${QUIZ.grades.map(g=>`<option value="${esc(g)}" ${g===D.grade?"selected":""}>${/^\d+$/.test(g)?"Grade "+esc(g):g==="First year"?"First year university":esc(g)}</option>`).join("")}</select></label></div>`}
 else if(id==="interests"){body=`<div class="eyebrow">Step 2 · Interests</div><h2>What are you into?</h2><p class="muted">Pick as many as you like.</p>${chips(Object.keys(INTERESTS),D.interests,"data-qint")}`;canSkip=true}
 else if(id==="courses"){body=`<div class="eyebrow">Step 3 · Courses</div><h2>Courses you've taken</h2><p class="muted">Choose your usual grade, or leave “—” if you haven't taken it.</p><div class="subj">${Object.keys(SUBJECTS).map(s=>`<label for="qs-${s.replace(/\W/g,"")}">${esc(s)}<select id="qs-${s.replace(/\W/g,"")}" data-qsub="${esc(s)}">${Object.keys(GRADEPTS).map(g=>`<option ${D.subjects[s]===g?"selected":""}>${g}</option>`).join("")}</select></label>`).join("")}</div>`;canSkip=true}
 else if(id==="activities"){body=`<div class="eyebrow">Step 4 · Experience</div><h2>What do you do outside class?</h2>${chips(Object.keys(ACTIVITIES),D.activities,"data-qact")}`;canSkip=true}
 else if(id.startsWith("q")){const qi=Number(id.slice(1)),q=QUIZ.questions[qi];body=`<div class="eyebrow">Question ${qi+1} of ${QUIZ.questions.length}</div><h2>${esc(q.prompt)}</h2><div class="qz-opts">${q.options.map((o,i)=>`<button type="button" class="qz-opt" data-qopt="${i}" aria-pressed="${D.answers[q.id]===i}"><span class="qz-key">${"ABCD"[i]||i+1}</span>${esc(o.label)}</button>`).join("")}</div>`;canSkip=true}
 else if(id==="goals"){body=`<div class="eyebrow">Step 5 · Goals</div><h2>What do you want to accomplish?</h2><p class="muted">Pick up to 3. They'll become objectives in your skill trees.</p>
   <div class="qz-goals">${QUIZ.goals.map(g=>`<button type="button" class="qz-opt" data-qgoal="${g.id}" aria-pressed="${D.goals.includes(g.id)}" ${!D.goals.includes(g.id)&&D.goals.length>=3?"disabled":""}>${esc(g.label)}</button>`).join("")}</div>
   <div class="fl" style="margin-top:16px">When do you want to make progress?${chips(QUIZ.timeframes,[D.timeframe],"data-qtime")}</div>
   <label class="fl" for="qzText" style="margin-top:14px">Anything specific you want to achieve? (optional)<input type="text" id="qzText" maxlength="120" value="${esc(D.text)}" placeholder="e.g. Make a game with my friends, get into a co-op program"></label>`}
 else if(id==="direction"){body=`<div class="eyebrow">Step 6 · Direction</div><h2>How sure are you about your direction?</h2><p class="muted">There's no wrong answer, and you can change it any time. Plenty of students change their plans, some more than once.</p>
   <div class="qz-opts">${QUIZ.certainty.map(c=>`<button type="button" class="qz-opt" data-qcert="${c.id}" aria-pressed="${D.certainty===c.id}"><b>${esc(c.label)}</b><span class="muted" style="display:block;font-size:13px">${esc(c.desc)}</span></button>`).join("")}</div>
   <label class="fl" for="qzProg" style="margin-top:16px">Already have a program in mind?<select id="qzProg"><option value="">Not yet</option>${Object.entries(allPaths()).map(([k,p])=>`<option value="${k}" ${D.program===k?"selected":""}>${esc(p.name)}</option>`).join("")}</select></label>`;next="See my paths"}
 else if(id==="results"){const R=scorePaths(D);const pin=(QUIZ.certainty.find(c=>c.id===D.certainty)||QUIZ.certainty[1]).pin;if(!D.picks)D.picks=R.slice(0,pin).map(r=>r.id);
  body=`<div class="eyebrow">Your results</div><h2>Paths that fit you${D.name?`, ${esc(D.name.trim())}`:""}</h2><p class="muted">These are recommendations, not a verdict. Tick the paths to add to your journey; you can explore every other path any time.</p>
   <div class="qz-results">${R.map((r,i)=>`<label class="qz-res ${D.picks.includes(r.id)?"on":""}"><input type="checkbox" data-qpick="${r.id}" ${D.picks.includes(r.id)?"checked":""}><div class="qz-res-main"><div class="qz-res-top"><b>${esc(r.name)}</b>${i===0?`<span class="tag major">Top match</span>`:""}<span class="qz-score">${r.score}%</span></div><div class="prog"><i style="width:${r.score}%"></i></div>${r.why.length?`<ul>${r.why.map(w=>`<li>${esc(w)}</li>`).join("")}</ul>`:""}</div></label>`).join("")}</div>
   ${D.goals.length||D.text?`<p class="muted" style="font-size:14px">Your goals will be added as ★ objectives in your top ${Math.min(2,D.picks.length)||1} tree${Math.min(2,D.picks.length)===1?"":"s"}.</p>`:""}`;next="Build my skill trees"}
 el.innerHTML=`<div class="qz-card"><div class="qz-top"><div class="qz-progress" aria-label="Step ${D.step+1} of ${n}"><i style="width:${(D.step)/(n-1)*100}%"></i></div>${id==="welcome"?"":`<button type="button" class="btn small" id="qzClose">Close</button>`}</div>
  <div class="qz-body">${body}</div>
  <div class="qz-nav">${D.step>0?`<button type="button" class="btn" id="qzBack">Back</button>`:`<button type="button" class="btn" id="qzSkipAll">Skip and look around</button>`}<span style="flex:1"></span>${canSkip?`<button type="button" class="btn" id="qzSkip">Skip</button>`:""}<button type="button" class="btn primary" id="qzNext">${next}</button><span class="muted" id="qzMsg" style="font-size:13px;width:100%;text-align:right"></span></div></div>`;
 bindQuiz(id);el.querySelector(".qz-body h2")?.setAttribute("tabindex","-1");el.querySelector(".qz-body h2")?.focus({preventScroll:true})}
function quizGo(d){QD.step=Math.max(0,Math.min(quizSteps().length-1,QD.step+d));$("quiz").querySelector(".qz-card").scrollTop=0;drawQuiz()}
function bindQuiz(id){const el=$("quiz"),D=QD;const on=(s,f)=>el.querySelectorAll(s).forEach(b=>b.onclick=()=>f(b));
 const nm=$("qzName");if(nm)nm.oninput=()=>D.name=nm.value;const gr=$("qzGrade");if(gr)gr.onchange=()=>D.grade=gr.value;
 const tx=$("qzText");if(tx)tx.oninput=()=>D.text=tx.value;const pr=$("qzProg");if(pr)pr.onchange=()=>{D.program=pr.value;D.picks=null};
 const tog=(arr,v)=>arr.includes(v)?arr.filter(x=>x!==v):[...arr,v];
 on("[data-qint]",b=>{D.interests=tog(D.interests,b.dataset.qint);drawQuiz()});
 on("[data-qact]",b=>{D.activities=tog(D.activities,b.dataset.qact);drawQuiz()});
 el.querySelectorAll("[data-qsub]").forEach(s=>s.onchange=()=>D.subjects[s.dataset.qsub]=s.value);
 on("[data-qopt]",b=>{const q=QUIZ.questions[Number(id.slice(1))];D.answers[q.id]=Number(b.dataset.qopt);D.picks=null;
  el.querySelectorAll("[data-qopt]").forEach(x=>x.setAttribute("aria-pressed",x===b));setTimeout(()=>{if(QD&&quizSteps()[QD.step]===id)quizGo(1)},REDUCE?0:260)});
 on("[data-qgoal]",b=>{const g=b.dataset.qgoal;if(!D.goals.includes(g)&&D.goals.length>=3)return;D.goals=tog(D.goals,g);drawQuiz()});
 on("[data-qtime]",b=>{D.timeframe=D.timeframe===b.dataset.qtime?"":b.dataset.qtime;drawQuiz()});
 on("[data-qcert]",b=>{D.certainty=b.dataset.qcert;D.picks=null;drawQuiz()});
 el.querySelectorAll("[data-qpick]").forEach(c=>c.onchange=()=>{D.picks=c.checked?[...D.picks,c.dataset.qpick]:D.picks.filter(x=>x!==c.dataset.qpick);c.closest(".qz-res").classList.toggle("on",c.checked)});
 const back=$("qzBack");if(back)back.onclick=()=>quizGo(-1);
 const sk=$("qzSkip");if(sk)sk.onclick=()=>quizGo(1);
 const close=$("qzClose");if(close)close.onclick=()=>{if(!S.onboarded){S.onboarded=true;save()}closeQuiz();render()};
 const skipAll=$("qzSkipAll");if(skipAll)skipAll.onclick=()=>{S.onboarded=true;save();closeQuiz();render();toast("You can take the quiz any time from the Character tab")};
 $("qzNext").onclick=()=>{if(id==="results"){if(!D.picks.length){$("qzMsg").textContent="Pick at least one path to start your journey.";return}
   applyQuiz(D,D.picks);closeQuiz();S.view="world";save();render();banner("YOUR TREES ARE READY",`${D.picks.length} path${D.picks.length>1?"s":""} added to your journey`,"var(--accent)");burst({x:innerWidth/2,y:innerHeight/2},30);return}
  quizGo(1)};
 el.onkeydown=e=>{if(e.key==="Escape"&&id!=="welcome")$("qzClose")?.click();if(id.startsWith("q")&&/^[a-d]$/i.test(e.key)&&e.target.tagName!=="INPUT"){el.querySelector(`[data-qopt="${"abcd".indexOf(e.key.toLowerCase())}"]`)?.click()}}}
