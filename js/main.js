/* Edventure · Boot sequence. */
/* ---------- boot ---------- */
(async()=>{
 try{await loadContent()}catch(e){$("main").innerHTML=`<div class="section"><div class="notice">Edventure couldn't load its content: ${esc(e.message)}. Make sure the /data folder is deployed, and open the site through a web server rather than as a local file.</div></div>`;return}
 initState();compassI=Math.floor(Math.random()*COMPASS.length);AI.init();render();
 if(!S.onboarded)setTimeout(openQuiz,300);
 $("orbUpdate").onclick=()=>openUpdate();
 if(testGrantToast)setTimeout(()=>{toast(`Test treasure added: +${testGrantToast.toLocaleString()} gems`);flyGems({x:innerWidth/2,y:innerHeight/2},testGrantToast)},700);
})();
