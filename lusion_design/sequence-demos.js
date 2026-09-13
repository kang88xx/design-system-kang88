'use strict';
(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const reel=document.querySelector('#sequence-reel');
  const scrub=document.querySelector('#reel-progress');
  function updateReel(){const progress=Number(scrub.value)/100;reel.style.width=(35+65*progress)+'%';reel.style.height=(45+55*progress)+'%';reel.style.borderRadius=(20*(1-progress))+'px';document.querySelector('#reel-progress-value').textContent=scrub.value+'%';}
  scrub.addEventListener('input',updateReel);updateReel();
  const words=['LET’S CREATE.','MAKE IT REAL.'];let word=0,rollFrame=0;const heading=document.querySelector('#ending-copy');
  const currentWord=()=>words[word];
  function renderWord(text){heading.replaceChildren(...[...text].map(ch=>{const span=document.createElement('span');span.textContent=ch;span.className=ch===' '?'space':'';return span;}));}
  renderWord(currentWord());
  function finishRoll(){cancelAnimationFrame(rollFrame);renderWord(currentWord());document.querySelector('#ending-preview').textContent=currentWord();}
  document.querySelector('#ending-replay').addEventListener('click',()=>{word=(word+1)%words.length;cancelAnimationFrame(rollFrame);if(reduced.matches){finishRoll();return;}const start=performance.now();const target=currentWord();const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';function frame(now){const t=(now-start)/950;const result=[...target].map((ch,index)=>ch===' '?' ':t>(index/target.length*.55+.35)?ch:letters[Math.floor(now/65+index*7)%letters.length]).join('');renderWord(result);if(t<1)rollFrame=requestAnimationFrame(frame);else finishRoll();}rollFrame=requestAnimationFrame(frame);});
  const panel=document.querySelector('#next-demo-panel'),activate=document.querySelector('#next-activate'),bar=document.querySelector('#next-demo-bar');let progress=0,active=false,scene=0;
  function setActive(value){active=value;activate.setAttribute('aria-pressed',String(active));activate.textContent=active?'제스처 해제':'제스처 시작';panel.dataset.active=String(active);}
  function renderNext(){bar.style.width=progress+'%';bar.parentElement.setAttribute('aria-valuenow',String(Math.round(progress)));document.querySelector('#next-percent').textContent=Math.round(progress)+'%';}
  function nextScene(){scene=(scene+1)%3;document.querySelector('#next-scene-name').textContent=['ABOUT / PREVIEW','PROJECTS / PREVIEW','CONTACT / PREVIEW'][scene];document.querySelector('#next-state').textContent='다음 장면의 로컬 미리보기로 전환했습니다.';progress=0;setActive(false);renderNext();}
  function addProgress(delta){progress=Math.max(0,Math.min(100,progress+delta));renderNext();if(progress>=100)nextScene();}
  activate.addEventListener('click',()=>{setActive(!active);if(active)panel.focus({preventScroll:true});});
  panel.addEventListener('wheel',event=>{if(!active)return;event.preventDefault();addProgress(Math.sign(event.deltaY)*12);},{passive:false});
  panel.addEventListener('keydown',event=>{if(event.key==='Escape'){setActive(false);activate.focus();return;}if(active&&['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();addProgress(event.key==='ArrowDown'?20:-20);}});
  document.querySelector('#next-step').addEventListener('click',()=>addProgress(25));document.querySelector('#next-now').addEventListener('click',nextScene);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){finishRoll();setActive(false);}});reduced.addEventListener('change',()=>{if(reduced.matches)finishRoll();});
})();
