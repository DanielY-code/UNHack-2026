/* Edventure · Foundation: everything a student has already done follows them to every new tree.
   Courses they've taken and objectives finished on other paths become a "foundation" (the World tree's roots).
   Related work lights up and gives "head starts" on steps in the new path; unrelated work is greyed out but stays,
   in case a later choice connects it. Relatedness comes from skill tags worked out from each objective's text
   using the keyword list in data/catalog.json (skills, courseSkills). Top-level code only defines functions. */

/* ---------- skill tags (pure) ---------- */
let SKILL_RX=null;const SKILL_CACHE=new Map();
function skillRx(){return SKILL_RX??=Object.entries(SKILLS).map(([k,s])=>[k,s.words.map(w=>{const whole=w.endsWith("!");const t=(whole?w.slice(0,-1):w).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp("\\b"+t+(whole?"\\b":""),"i")})])}
function nodeSkills(n){if(Array.isArray(n.skills))return n.skills;let text=[n.title,n.learn,n.objective].join(" ").toLowerCase();for(const ph of SKILL_IGNORE||[])text=text.split(ph).join(" ");const key=n.id+"|"+text.length;
 if(!SKILL_CACHE.has(key))SKILL_CACHE.set(key,skillRx().filter(([,rs])=>rs.some(r=>r.test(text))).map(([k])=>k));return SKILL_CACHE.get(key)}
/* phrases in catalog.skillIgnore (like "data structures") are removed before tagging */
const skillLabel=k=>SKILLS[k]?.label||k;
/* "soft" skills (writing, communication) show up almost everywhere, so they never create a connection on their own */
const coreTags=tags=>tags.filter(t=>!SKILLS[t]?.soft);
const connects=(a,b)=>{const B=new Set(coreTags(b));return coreTags(a).some(t=>B.has(t))};

/* ---------- foundation (pure) ---------- */
function foundationItems(){const P=allPaths(),items=[];
 for(const[s,g]of Object.entries(S.profile.subjects||{}))if(g&&g!=="—")items.push({id:"course:"+s,kind:"course",label:s,grade:g,from:"Course",tags:COURSE_SKILLS[s]||[]});
 for(const[k,ids]of Object.entries(S.progress))if(P[k])for(const id of ids){const n=P[k].nodes.find(x=>x.id===id);if(n&&!n.branch&&!n.crossSrc)items.push({id:k+":"+id,kind:"objective",label:n.title,from:P[k].name,pid:k,tags:nodeSkills(n)})}
 return items}
/* foundation as seen from one path: what connects (and to which steps) and what doesn't yet */
function foundationFor(pid){const p=allPaths()[pid];const steps=p.nodes.filter(n=>!n.branch);
 return foundationItems().filter(it=>it.pid!==pid).map(it=>{const linked=steps.filter(n=>connects(nodeSkills(n),it.tags)),helps=linked.filter(n=>!done(pid,n.id));
  const shared=[...new Set(linked.flatMap(n=>coreTags(nodeSkills(n)).filter(t=>it.tags.includes(t))))];return{...it,helps:(helps.length?helps:linked).map(n=>n.id),shared,related:linked.length>0}})
  .sort((a,b)=>b.related-a.related||(a.kind==="course")-(b.kind==="course"))}
/* earlier work that gives a head start on one step: finished objectives elsewhere, or strong (A/B) courses */
function headStart(pid,n){if(!n||done(pid,n.id)||n.branch||n.crossSrc)return[];const tags=nodeSkills(n);if(!tags.length)return[];
 return foundationItems().filter(it=>it.pid!==pid&&(it.kind==="objective"||["A","B"].includes(it.grade))&&connects(it.tags,tags))}
function carryNote(items){return"Carried over from earlier work: "+items.slice(0,4).map(i=>i.kind==="course"?`${i.label} (${i.grade})`:`${i.label} (${i.from})`).join(", ")}

/* ---------- rendering ---------- */
function foundationChips(pid){const P=allPaths(),F=foundationFor(pid);const steps=id=>P[pid].nodes.find(n=>n.id===id)?.title;
 const chip=it=>`<span class="fchip ${it.related?"rel":"dim"}" title="${esc(it.related?`Helps with: ${it.helps.map(steps).join(", ")}`:"Not connected to this path yet. It stays here in case a later choice connects it.")}"><b>${esc(it.label)}</b><small>${it.kind==="course"?`Course · ${esc(it.grade)}`:esc(it.from)}${it.related?` · ${esc(it.shared.slice(0,2).map(skillLabel).join(", "))}`:""}</small></span>`;
 const courses=F.filter(i=>i.kind==="course"),objs=F.filter(i=>i.kind==="objective");
 return{F,html:F.length?`${objs.length?`<div class="fgroup"><div class="fgroup-h">Done on other paths</div><div class="fchips">${objs.map(chip).join("")}</div></div>`:""}${courses.length?`<div class="fgroup"><div class="fgroup-h">Courses taken</div><div class="fchips">${courses.map(chip).join("")}</div></div>`:""}`:""}}
function foundationPanel(pid,{title="Your foundation",compact=false}={}){const{F,html}=foundationChips(pid);const rel=F.filter(i=>i.related).length;
 if(!F.length)return compact?"":`<div class="panel fpanel"><h3>${title}</h3><p class="muted small">Courses from your profile and objectives you finish on other paths will appear here, and follow you to every new path.</p></div>`;
 return`<div class="panel fpanel"><div class="fpanel-top"><h3>${title}</h3><span class="muted small">${rel} of ${F.length} connect to this path</span></div>${html}
  <p class="muted small" style="margin:0">Glowing items connect to steps here. Greyed items aren't used on this path yet, but they stay in case a later choice connects them.</p></div>`}
function headStartBlock(pid,n){const hs=headStart(pid,n);if(!hs.length)return"";
 return`<div class="hs-box"><span class="lbl">Head start</span><p>You've already done related work: ${hs.slice(0,3).map(i=>`<b>${esc(i.label)}</b> <span class="muted">(${esc(i.kind==="course"?`course, ${i.grade}`:i.from)})</span>`).join(", ")}${hs.length>3?` and ${hs.length-3} more`:""}.</p>
  <button type="button" class="btn small" data-carry="${esc(pid)}|${esc(n.id)}">Count my earlier work</button></div>`}
