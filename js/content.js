/* ---------- content ----------
   Everything a designer or counselor might want to edit lives in /data as JSON:
   catalog.json (stats, interests, courses, activities), paths.json (skill trees, mastery, crossovers),
   shop.json (Treasury items), guidance.json (tooltips, compass messages), prompts.json (companion prompts), quiz.json (onboarding quiz), destinations.json (career goals and their routes). */
let STATS,SK,TIERS,GEMS,INTERESTS,SUBJECTS,GRADEPTS,ACTIVITIES,BASE_PATHS,SHOP,TIPS,COMPASS,PROMPTS,QUIZ,DESTS;
function applyContent({catalog,paths,shop,guidance,prompts,quiz,destinations}){
 ({stats:STATS,tiers:TIERS,gems:GEMS,interests:INTERESTS,subjects:SUBJECTS,gradePoints:GRADEPTS,activities:ACTIVITIES}=catalog);
 SK=Object.keys(STATS);BASE_PATHS=paths;SHOP=shop;TIPS=guidance.tips;COMPASS=guidance.compass;PROMPTS=prompts;QUIZ=quiz;DESTS=destinations}
async function loadContent(){if(window.__CONTENT__)return applyContent(window.__CONTENT__); // single-file builds embed the content
 const names=["catalog","paths","shop","guidance","prompts","quiz","destinations"];
 const got=await Promise.all(names.map(n=>fetch(`data/${n}.json`).then(r=>{if(!r.ok)throw new Error(`data/${n}.json (${r.status})`);return r.json()})));
 applyContent(Object.fromEntries(names.map((n,i)=>[n,got[i]])))}
