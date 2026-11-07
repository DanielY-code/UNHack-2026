/* ---------- content ----------
   Everything a designer or counselor might want to edit lives in /data as JSON:
   catalog.json (stats, interests, courses, activities), paths.json (skill trees, mastery, crossovers),
   shop.json (Treasury items), guidance.json (tooltips, compass messages), prompts.json (companion prompts). */
let STATS,SK,TIERS,GEMS,INTERESTS,SUBJECTS,GRADEPTS,ACTIVITIES,BASE_PATHS,SHOP,TIPS,COMPASS,PROMPTS;
function applyContent({catalog,paths,shop,guidance,prompts}){
 ({stats:STATS,tiers:TIERS,gems:GEMS,interests:INTERESTS,subjects:SUBJECTS,gradePoints:GRADEPTS,activities:ACTIVITIES}=catalog);
 SK=Object.keys(STATS);BASE_PATHS=paths;SHOP=shop;TIPS=guidance.tips;COMPASS=guidance.compass;PROMPTS=prompts}
async function loadContent(){const names=["catalog","paths","shop","guidance","prompts"];
 const got=await Promise.all(names.map(n=>fetch(`data/${n}.json`).then(r=>{if(!r.ok)throw new Error(`data/${n}.json (${r.status})`);return r.json()})));
 applyContent(Object.fromEntries(names.map((n,i)=>[n,got[i]])))}
