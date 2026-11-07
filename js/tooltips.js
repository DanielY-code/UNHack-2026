/* Edventure · Tooltip bubble behaviour for the ? buttons. */
/* ---------- tooltips ---------- */
const tb=$("tipBubble");let tipFor=null;
function showTip(btn){const d=TIPS[btn.dataset.tip];if(!d)return;tb.innerHTML=`<b>${esc(d.title)}</b>${esc(d.body)}`;tb.hidden=false;tipFor=btn;btn.setAttribute("aria-expanded","true");
 const r=btn.getBoundingClientRect(),w=tb.offsetWidth,h=tb.offsetHeight;let x=Math.max(12,Math.min(innerWidth-w-12,r.left+r.width/2-w/2));let y=r.top-h-8;if(y<70)y=r.bottom+8;tb.style.left=x+"px";tb.style.top=y+"px"}
function hideTip(){if(tipFor)tipFor.setAttribute("aria-expanded","false");tb.hidden=true;tipFor=null}
document.addEventListener("pointerover",e=>{const b=e.target.closest?.(".tip");if(b&&e.pointerType!=="touch")showTip(b)});
document.addEventListener("pointerout",e=>{const b=e.target.closest?.(".tip");if(b&&e.pointerType!=="touch"&&!b.contains(e.relatedTarget))hideTip()});
document.addEventListener("focusin",e=>{if(e.target.classList?.contains("tip"))showTip(e.target)});
document.addEventListener("focusout",e=>{if(e.target.classList?.contains("tip"))hideTip()});
document.addEventListener("click",e=>{const b=e.target.closest?.(".tip");if(b){e.preventDefault();e.stopPropagation();tipFor===b&&!tb.hidden?hideTip():showTip(b)}else if(!tb.hidden)hideTip()},true);
addEventListener("scroll",hideTip,{passive:true,capture:true});
