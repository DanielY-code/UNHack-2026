/* Edventure · Companion chat panel and AI-grown paths. */
/* ---------- companion chat ---------- */
/* AI adapter: inside a claude.ai artifact it uses the built-in runtime; on the web it calls this app's /api/companion function,
   which holds the Anthropic API key on the server and builds the prompts from data/prompts.json. */
const fill=(t,v)=>t.replace(/\{\{(\w+)\}\}/g,(_,k)=>v[k]??"");
const AI={mode:"api",sample:null,configured:null,
 async init(){try{this.sample=await window.claude?.use?.("sample")}catch(e){}
  if(this.sample){this.mode="artifact";this.configured=true;return}
  try{const r=await fetch("api/companion");const j=await r.json();this.configured=!!j.configured}catch(e){this.configured=false}},
 async chat(turns,{signal,onText}={}){if(this.configured===false)throw{code:"not_configured"}
  if(this.mode==="artifact")return(await this.sample([{role:"user",content:RULES()},...turns],{cache:false,modelTier:"quick",signal,onText})).text;
  const r=await apiPost({kind:"chat",companion:S.equip.comp||"orb",context:context(),messages:turns},signal);onText?.({text:r.text});return r.text},
 async grow(topic,pathIds){if(this.configured===false)throw{code:"not_configured"}
  if(this.mode==="artifact")return this.sample.json(fill(PROMPTS.grow,{topic,pathIds:pathIds.join(", "),context:context()}),{modelTier:"default"});
  return(await apiPost({kind:"grow",topic,pathIds,context:context()})).path},
 async reflect(text){if(this.configured===false)throw{code:"not_configured"}
  const P=allPaths(),pathIds=Object.keys(P),journey=S.pinned.filter(k=>P[k]),pathNames=pathIds.map(k=>`${k}=${P[k].name}`).join("; ");
  if(this.mode==="artifact")return this.sample.json(fill(PROMPTS.reflect,{text,context:context(),pathIds:pathIds.join(", "),journey:journey.join(", ")||"none",pathNames}),{modelTier:"default"});
  return(await apiPost({kind:"reflect",text,pathIds,journey,pathNames,context:context()})).update}};
async function apiPost(body,signal){let res;try{res=await fetch("api/companion",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),signal})}catch(e){throw{code:e.name==="AbortError"?"aborted":"offline"}}
 const j=await res.json().catch(()=>({}));if(!res.ok)throw{code:j.code||"server_error",message:j.error};return j}
function aiError(e,doing){return e.code==="not_granted"?`You chose not to let me use Claude, so I can't ${doing}. The trees still work without me.`
 :e.code==="rate_limited"?"I'm a bit tired from all the questions. Try again in a few minutes."
 :e.code==="not_configured"?`My connection to Claude isn't set up yet, so I can't ${doing}. (The site owner needs to add an ANTHROPIC_API_KEY.)`
 :e.code==="offline"?"I can't reach the server. Check your internet connection and try again."
 :e.code==="invalid_json"?"The tree came out tangled. Try growing it again.":`Something interrupted me, so I couldn't ${doing}. Try again in a moment.`}
const log=$("orbLog");
function addMsg(who,text,extra=""){const d=document.createElement("div");d.className="msg "+(who==="me"?"me":"orbm");d.textContent=text;if(extra)d.insertAdjacentHTML("beforeend",extra);log.append(d);log.scrollTop=log.scrollHeight;return d}
function greet(){if(log.childElementCount)return;S.chat.slice(-8).forEach(t=>addMsg(t.role==="user"?"me":"orb",t.content));
 if(!log.childElementCount)addMsg("orb",`Hi ${S.profile.name?S.profile.name.split(" ")[0]:"there"}! ${comp().hello}. I can explain any path, suggest what to try next, or grow a brand-new skill tree for a career you're curious about.`)}
$("orbBtn").onclick=()=>{const p=$("orbPanel");p.hidden=!p.hidden;if(!p.hidden){greet();if(AI.configured===false&&!greet.warned){greet.warned=1;addMsg("orb",aiError({code:"not_configured"},"chat or grow new paths")+" You can still explore and complete every built-in tree.")}$("orbInput").focus()}};
$("orbClose").onclick=()=>$("orbPanel").hidden=true;
function context(){const{t}=totalStats();const P=allPaths();const p=S.profile;
 const comp=Object.entries(S.progress).flatMap(([k,ids])=>ids.map(id=>P[k]?.nodes.find(n=>n.id===id)?.title).filter(Boolean));
 return`Student: ${p.name||"unnamed"}, grade ${p.grade}. Interests: ${p.interests.join(", ")||"none listed"}. Courses & grades: ${Object.entries(p.subjects).filter(([,g])=>g!=="—").map(([s,g])=>s+" "+g).join(", ")||"none"}. Activities: ${p.activities.join(", ")||"none"}.
Stats (0-99): ${SK.map(k=>STATS[k]+" "+t[k]).join(", ")}.
Paths on their map: ${Object.values(P).map(x=>x.name).join(", ")}. Pinned: ${S.pinned.map(k=>P[k]?.name).filter(Boolean).join(", ")||"none"}.
Intended major: ${P[S.major]?.name||"still exploring"}. Minors: ${S.minors.map(k=>P[k]?.name).filter(Boolean).join(", ")||"none"}. Goals: ${(S.goals?.ids||[]).map(id=>QUIZ.goals.find(g=>g.id===id)?.label).filter(Boolean).join("; ")||"none set"}${S.goals?.text?` (in their words: "${S.goals.text}")`:""}${S.goals?.timeframe?`, timeframe: ${S.goals.timeframe}`:""}. Completed objectives: ${comp.join("; ")||"none yet"}. Currently viewing: ${P[S.path]?.name||"none"}.${S.updates?.[0]?` Latest update they shared: "${S.updates[0].text.slice(0,200)}"`:""}`}
const RULES=()=>fill(PROMPTS.chat,{persona:PROMPTS.personas[S.equip.comp]||PROMPTS.personas.orb,context:context()});
let ctl=null;
async function ask(q){if(!q.trim())return;addMsg("me",q);S.chat.push({role:"user",content:q});
 const bubble=addMsg("orb","Thinking…");
 $("orbSend").disabled=true;ctl=new AbortController();
 try{const turns=S.chat.slice(-10);while(turns[0]?.role!=="user")turns.shift();
  const text=await AI.chat(turns,{signal:ctl.signal,onText:({text})=>{bubble.textContent=text.replace(/\[\[ADD:[^\]]*\]\]?/g,"").trim()||"…"}});
  const mm=text.match(/\[\[ADD:\s*(.+?)\]\]/);const clean=text.replace(/\[\[ADD:[^\]]*\]\]/g,"").trim();bubble.textContent=clean;S.chat.push({role:"assistant",content:clean});
  if(mm){const name=mm[1].trim();const b=document.createElement("button");b.className="btn small gold";b.style.marginTop="8px";b.style.display="block";b.textContent=`Grow a "${name}" path`;b.onclick=()=>{b.disabled=true;grow(name)};bubble.append(b)}
 }catch(e){bubble.textContent=e.text||aiError(e,"answer that");S.chat.pop()}
 finally{$("orbSend").disabled=false;save()}}
$("orbForm").onsubmit=e=>{e.preventDefault();const v=$("orbInput").value;$("orbInput").value="";ask(v)};
document.querySelectorAll("#orbQuick [data-q]").forEach(b=>b.onclick=()=>ask(b.dataset.q));
$("growBtn").onclick=()=>{const v=$("growInput").value.trim();if(v){$("growInput").value="";grow(v)}};

async function grow(topic){const P=allPaths();const fromId=$("growBranch").checked&&S.view==="tree"?S.path:null;
 const bubble=addMsg("orb",`Growing a ${topic} skill tree… (this can take up to a minute)`);
 $("growBtn").disabled=true;
 try{const j=await AI.grow(topic,Object.keys(P));const id=addPath(j,topic,fromId);
  bubble.textContent=`Your ${allPaths()[id].name} tree is ready${fromId?` and branches from ${P[fromId].name}`:""}. Check the resource links before relying on them.`;
  const b=document.createElement("button");b.className="btn small primary";b.style.marginTop="8px";b.style.display="block";b.textContent="Open it";b.onclick=()=>{S.path=id;S.sel=null;setView("tree")};bubble.append(b);
 }catch(e){bubble.textContent=aiError(e,"grow that tree")}
 finally{$("growBtn").disabled=false}}
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,24)||"path"}
function addPath(j,topic,fromId){const P=allPaths();let id="x-"+slug(j.name||topic);while(P[id])id+="2";
 const w={};for(const k of SK){const v=Number(j.weights?.[k]);if(v>0)w[k]=Math.min(3,Math.round(v))}if(!Object.keys(w).length)w.logic=1;
 const raw=Array.isArray(j.nodes)?j.nodes.slice(0,10):[];const ids=new Set(raw.map(n=>String(n.id)));
 const nodes=raw.map((n,i)=>({id:id+"-"+String(n.id||i).replace(/\W/g,""),t:Math.max(0,Math.min(4,Math.round(Number(n.t)||0))),title:String(n.title||"Objective").slice(0,40),learn:String(n.learn||""),objective:String(n.objective||""),
  req:(Array.isArray(n.req)?n.req:[]).map(String).filter(r=>ids.has(r)&&r!==String(n.id)).map(r=>id+"-"+r.replace(/\W/g,"")),
  res:(Array.isArray(n.res)?n.res:[]).filter(r=>/^https:\/\//.test(r?.url||"")).slice(0,3).map(r=>({name:String(r.name||r.url).slice(0,60),url:String(r.url)})),
  ...(n.branch&&P[n.branch]?{branch:String(n.branch)}:{})}));
 const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));nodes.forEach(n=>n.req=n.req.filter(r=>byId[r]&&byId[r].t<n.t));
 if(!nodes.length)throw{code:"invalid_json"};
 S.custom[id]={name:String(j.name||topic).slice(0,40),blurb:String(j.blurb||""),weights:w,nodes};
 if(fromId&&P[fromId]){const src=P[fromId];const maxT=Math.max(...src.nodes.map(n=>n.t));const anchor=src.nodes.filter(n=>!n.branch&&n.t===Math.max(1,maxT-1))[0]||src.nodes[0];
  (S.extraNodes[fromId]??=[]).push({id:fromId+"-to-"+id,t:maxT,title:S.custom[id].name,branch:id,learn:`A specialization that grows out of ${src.name}. You were curious, so your companion added this branch.`,objective:`Open the ${S.custom[id].name} tree, read its first objective, and write down why it interests you.`,res:nodes[0].res||[],req:[anchor.id]})}
 if(!S.pinned.includes(id))S.pinned.push(id);save();render();return id}
