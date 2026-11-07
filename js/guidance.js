/* Edventure · Education tooltips, the Explorer's compass, majors/minors helpers. */
/* ---------- education tooltips + encouragement ---------- */
let compassI=0;
const tip=k=>TIPS[k]?`<button type="button" class="tip" data-tip="${k}" aria-label="What is ${esc(TIPS[k].title)}?">?</button>`:"";
function compassCard(){return`<div class="compass" role="note"><span class="needle" aria-hidden="true"></span><div style="min-width:0;flex:1"><div class="k">Explorer's compass</div><p id="compassText">${esc(COMPASS[compassI%COMPASS.length])}</p></div><button class="btn small" id="compassNext">Another</button><span class="tick" id="compassTick" aria-hidden="true"></span></div>`}
/* the compass turns on its own every few seconds; hovering or focusing it pauses the turn */
const COMPASS_MS=9000;let compassLast=performance.now();
function turnCompass(){const p=$("compassText");if(!p)return;compassI++;compassLast=performance.now();
 const t=$("compassTick");if(t){t.style.animation="none";void t.offsetWidth;t.style.animation=""}
 if(REDUCE){p.textContent=COMPASS[compassI%COMPASS.length];return}
 p.classList.add("fade");setTimeout(()=>{p.textContent=COMPASS[compassI%COMPASS.length];p.classList.remove("fade")},450)}
setInterval(()=>{const c=document.querySelector(".compass");if(!c||document.hidden)return;if(c.matches(":hover,:focus-within")){compassLast+=500;return}if(performance.now()-compassLast>=COMPASS_MS)turnCompass()},500);
const roleOf=k=>S.major===k?"major":S.minors.includes(k)?"minor":null;
function minorTrack(p){const core=p.nodes.filter(n=>!n.branch&&!n.crossSrc&&!n.mine);return[...core.filter(n=>n.t<=1),...core.filter(n=>n.t===2).slice(0,1)].map(n=>n.id)}
