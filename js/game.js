/* Edventure · Game state (saved in the browser) and rules: unlocking, mastery, crossovers, stats, rewards, node drawing. */
/* ---------- state ---------- */
const KEY="edventure.v1";
function fresh(){return{example:true,profile:{name:"Maya (example)",grade:"10",interests:["Coding","Puzzles","Video games","Helping people"],subjects:{"Math":"A","English":"B","Biology":"B","Chemistry":"—","Physics":"—","Computer Studies":"A","Visual Arts":"C","Music":"—","History":"B","Business":"—","Tech / Shop":"—","Health & Phys Ed":"B","French":"C"},activities:["Coding at home","Volunteering"]},
 progress:{cs:["cs1","cs2"]},notes:{},pinned:["cs"],gems:50,earned:50,owned:["skin-aurora","orb-moon","comp-orb"],equip:{skin:"aurora",orb:"moon",title:"",comp:"orb"},custom:{},extraNodes:{},redeem:[],view:"profile",path:"cs",sel:null,chat:[],compare:["cs","cyber"],mastery:{},major:"cs",minors:[],onboarded:false,goals:null};}
let S,testGrantToast=0;
/* Test mode shows the treasure tools. It's on for localhost, Vercel preview deploys, claude.ai previews and any URL ending in #test. */
const TEST_MODE=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)||location.hostname.includes("-git-")||location.hash==="#test"||!!window.claude;
function initState(){try{S=JSON.parse(localStorage.getItem(KEY))||fresh()}catch(e){S=fresh()}S=Object.assign(fresh(),S);
 if(TEST_MODE){if(!S.testGrant){S.testGrant=1;S.gems+=5000;testGrantToast+=5000}if(!S.testGrant2){S.testGrant2=1;S.gems+=20000;testGrantToast+=20000}if(testGrantToast)save()}
 if(!S.equip.comp)S.equip.comp="orb";if(!S.owned.includes("comp-orb"))S.owned.push("comp-orb")}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=id=>document.getElementById(id);
function withCross(nodes){const out=[...nodes];nodes.forEach(n=>{if(n.mastery&&n.cross)out.push({id:n.id+"-x",t:Math.min(n.t+1,4),title:n.cross.title,branch:n.cross.to,crossSrc:n,learn:n.cross.learn,objective:n.cross.objective,res:n.cross.res||[],req:[n.id]})});return out}
function allPaths(){const out={};for(const[k,p]of Object.entries(BASE_PATHS))out[k]={...p,nodes:withCross([...p.nodes,...(S.extraNodes[k]||[])])};for(const[k,p]of Object.entries(S.custom))out[k]={...p,nodes:withCross([...p.nodes,...(S.extraNodes[k]||[])]),ai:true};return out}
function done(pid,nid){return(S.progress[pid]||[]).includes(nid)}
function nodeState(pid,n){if(done(pid,n.id))return n.mastery&&!mastered(pid,n)?"mastering":"done";if(n.crossSrc)return mastered(pid,n.crossSrc)?"open":"locked";return n.req.every(r=>done(pid,r))?"open":"locked"}
const STAGE_NAMES=["Practitioner","Expert","Master"];
const stageCount=n=>n.mastery?1+n.mastery.length:1;
function mlevel(pid,n){return done(pid,n.id)?(n.mastery?Math.min(stageCount(n),S.mastery[pid+":"+n.id]||1):1):0}
function mastered(pid,n){return mlevel(pid,n)>=stageCount(n)}
function stageGems(n,stage){return Math.round(gemsFor(n)*(1+.5*(stage-1)))}
function nextGems(pid,n){return stageGems(n,Math.min(stageCount(n),mlevel(pid,n)+1))}
function statusLabel(pid,n,st){return st==="done"?(n.mastery?"Mastered":"Complete"):st==="mastering"?`Stage ${mlevel(pid,n)} of ${stageCount(n)}`:st==="open"?(n.crossSrc?"Crossover open":"Available"):"Locked"}
function curObjective(pid,n){if(!n.mastery)return n.objective;const i=Math.min(mlevel(pid,n),stageCount(n)-1);return i===0?n.objective:n.mastery[i-1]}
function ladder(pid,n){const lv=mlevel(pid,n);return`<ol class="ladder">${[n.objective,...n.mastery].map((o,i)=>`<li class="${i<lv?"got":i===lv?"now":""}"><b>${STAGE_NAMES[i]||"Stage "+(i+1)}</b><span>${esc(o)}</span></li>`).join("")}</ol>`}
function lockText(pid,n,reqNames){return n.crossSrc?`Unlocks when you master ${esc(n.crossSrc.title)} (${mlevel(pid,n.crossSrc)} of ${stageCount(n.crossSrc)} stages done)`:`Unlocks after: ${reqNames.map(esc).join(", ")}`}
function crossBlock(P,p,pid,n){if(n.mastery&&n.cross&&P[n.cross.to]){const m=mastered(pid,n);return`<div class="crossbox"><h4 style="display:flex;align-items:center">Crossover${tip("crossover")}</h4><div>${m?`Unlocked. You can branch into <b>${esc(P[n.cross.to].name)}</b> through <i>${esc(n.cross.title)}</i>.`:`Master all ${stageCount(n)} stages to unlock a crossover into <b>${esc(P[n.cross.to].name)}</b>: <i>${esc(n.cross.title)}</i>. It's a different field built on what you've proven here.`}</div></div>`}
 if(n.crossSrc&&P[n.branch])return`<div class="crossbox"><h4 style="display:flex;align-items:center">Crossover${tip("crossover")}</h4><div>Unlocked by mastering <b>${esc(n.crossSrc.title)}</b>. Skills from ${esc(p.name)} carry straight into ${esc(P[n.branch].name)}, the way an engineer can move into patent law.</div></div>`;return""}
function nodeGfx(x,y,r,pid,n,big){const st=nodeState(pid,n);const cross=!!n.crossSrc;const acc=cross?"var(--cross)":"var(--accent)";
 const fill=st==="done"?"var(--gold)":st==="locked"?"var(--panel)":"var(--panel-2)";
 const stroke=st==="done"||st==="mastering"?"var(--gold)":st==="open"?acc:cross?"color-mix(in oklab,var(--cross) 45%,var(--locked))":"var(--locked)";
 const R=r+3;let pts=null;
 if(cross)pts=[0,1,2,3,4,5].map(i=>{const a=Math.PI/3*i-Math.PI/2;return`${(x+Math.cos(a)*R).toFixed(1)},${(y+Math.sin(a)*R).toFixed(1)}`}).join(" ");
 else if(n.branch)pts=`${x},${y-R} ${x+R},${y} ${x},${y+R} ${x-R},${y}`;
 const el=(cls,extra)=>pts?`<polygon class="${cls}" points="${pts}" ${extra}/>`:`<circle class="${cls}" cx="${x}" cy="${y}" r="${r}" ${extra}/>`;
 const shape=el("core",`fill="${fill}" stroke="${stroke}" stroke-width="2"${n.mine?' stroke-dasharray="5 4"':""}`);
 const ring=st==="open"||st==="mastering"?el("ring",`style="stroke:${st==="mastering"?"var(--gold)":acc}"`):"";
 const fs=big?14:11;let glyph="";
 if(st==="done"){const k=big?1:.7;glyph=`<path d="M${x-9*k} ${y} l${6*k} ${7*k} l${12*k} ${-14*k}" fill="none" stroke="var(--gold-ink)" stroke-width="${big?3.5:3}" stroke-linecap="round" stroke-linejoin="round"/>`}
 else if(st==="mastering")glyph=`<text x="${x}" y="${y+fs/3+1}" text-anchor="middle" font-family="var(--f-mono)" font-size="${fs}" font-weight="700" fill="var(--gold)">${mlevel(pid,n)}/${stageCount(n)}</text>`;
 else if(st==="open")glyph=`<text x="${x}" y="${y+fs/3+1}" text-anchor="middle" font-family="var(--f-mono)" font-size="${fs}" font-weight="700" fill="var(--gold)">${nextGems(pid,n)}</text>`;
 else if(big)glyph=`<rect x="${x-7}" y="${y-2}" width="14" height="11" rx="2" fill="var(--locked)"/><path d="M${x-4} ${y-2} v-4 a4 4 0 0 1 8 0 v4" fill="none" stroke="var(--locked)" stroke-width="2.2"/>`;
 let segs="";if(n.mastery){const k=stageCount(n),lv=mlevel(pid,n),Rs=r+7,gp=.22;for(let i=0;i<k;i++){const a0=-Math.PI/2+i*2*Math.PI/k+gp/2,a1=-Math.PI/2+(i+1)*2*Math.PI/k-gp/2;
  segs+=`<path d="M${(x+Math.cos(a0)*Rs).toFixed(1)} ${(y+Math.sin(a0)*Rs).toFixed(1)} A${Rs} ${Rs} 0 0 1 ${(x+Math.cos(a1)*Rs).toFixed(1)} ${(y+Math.sin(a1)*Rs).toFixed(1)}" fill="none" stroke="${i<lv?"var(--gold)":"var(--locked)"}" stroke-width="${big?4:3}" stroke-linecap="round"/>`}}
 return{st,html:ring+segs+shape+glyph}}
function gemsFor(n){return n.branch?25:GEMS[Math.min(n.t,4)]}
function statReward(p,n){const r={};const w=Object.entries(p.weights||{}).sort((a,b)=>b[1]-a[1]).slice(0,2);w.forEach(([k],i)=>r[k]=(i?1:2)+(n.t>=2?1:0));return r}

/* ---------- stats ---------- */
function quizStatBonus(quiz){const s={};for(const q of QUIZ?.questions||[]){const o=q.options[quiz?.answers?.[q.id]];if(o)for(const[k,v]of Object.entries(o.stats||{}))s[k]=(s[k]||0)+v}return s}
function baseStats(p=S.profile){const s={};SK.forEach(k=>s[k]=8);
 for(const[k,v]of Object.entries(quizStatBonus(p.quiz)))if(k in s)s[k]+=v*4;
 p.interests.forEach(i=>{for(const[k,v]of Object.entries(INTERESTS[i]||{}))s[k]+=v*7});
 for(const[sub,g]of Object.entries(p.subjects)){for(const[k,v]of Object.entries(SUBJECTS[sub]||{}))s[k]+=v*(GRADEPTS[g]||0)}
 p.activities.forEach(a=>{for(const[k,v]of Object.entries(ACTIVITIES[a]||{}))s[k]+=v*7});
 SK.forEach(k=>s[k]=Math.min(80,Math.round(s[k])));return s}
function earnedStats(){const s={};SK.forEach(k=>s[k]=0);const P=allPaths();
 for(const[pid,ids]of Object.entries(S.progress)){const p=P[pid];if(!p)continue;ids.forEach(id=>{const n=p.nodes.find(x=>x.id===id);if(!n)return;const lv=n.mastery?mlevel(pid,n):1;for(const[k,v]of Object.entries(statReward(p,n)))s[k]+=v*lv})}return s}
function totalStats(){const b=baseStats(),e=earnedStats(),t={};SK.forEach(k=>t[k]=Math.min(99,b[k]+e[k]));return{b,e,t}}
function fit(p,t){const w=p.weights||{};let num=0,den=0;for(const[k,v]of Object.entries(w)){num+=(t[k]||0)*v;den+=v}const mx=Math.max(...SK.map(k=>t[k]),1);return den?Math.round(100*num/den/mx):0}
function level(){return 1+Math.floor(S.earned/120)}
