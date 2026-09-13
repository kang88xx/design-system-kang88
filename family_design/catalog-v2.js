(() => {
  'use strict';
  const messageOrigin=location.protocol==='file:'?'*':location.origin;
  const library = window.FamilyMotionLibrary;
  const reduced = () => document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (library) { library.mount(document.querySelector('#motion-library')); library.setReduced(reduced()); }
  else document.querySelector('#motion-library').innerHTML='<p class="fm-status-note">라이브러리 파일을 불러올 수 없습니다. 페이지를 새로고침해 주세요.</p>';
  const filmCards=[...document.querySelectorAll('.film-card')];
  const dialog=document.querySelector('#film-dialog'),expanded=document.querySelector('#film-expanded');
  const notice = text => { if (typeof notify === 'function') notify(text); };
  function pauseFilms(except){for(const card of filmCards){const video=card.querySelector('video');if(video!==except)video.pause();}}
  function load(video){if(!video.getAttribute('src')){video.src=video.dataset.src;video.load();}}
  async function playFilm(card,explicit=true){const video=card.querySelector('video');if(!explicit&&reduced())return;pauseFilms(video);load(video);if(video.ended)video.currentTime=0;try{await video.play();}catch{if(explicit)notice('재생을 시작하지 못했습니다. 확대 창에서 다시 재생해 주세요.');}}
  for(const card of filmCards){
    const video=card.querySelector('video'),button=card.querySelector('[data-film-play]');
    const label=card.querySelector('h3').textContent;
    video.addEventListener('play',()=>{card.classList.add('is-playing');button.setAttribute('aria-label',`${label} 일시정지`);button.querySelector('span').textContent='Ⅱ';button.querySelector('small').textContent='일시정지';});
    const showPaused=()=>{card.classList.remove('is-playing');button.setAttribute('aria-label',`${label} 재생`);button.querySelector('span').textContent='▶';button.querySelector('small').textContent='재생';};
    video.addEventListener('pause',showPaused);video.addEventListener('ended',showPaused);
    button.addEventListener('click',()=>video.paused?playFilm(card):video.pause());
    card.querySelector('.film-stage').addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')playFilm(card,false);});
    card.querySelector('.film-stage').addEventListener('pointerleave',()=>video.pause());
    card.querySelector('[data-film-open]').addEventListener('click',()=>openFilm(card));
  }
  function openFilm(card){
    pauseFilms();
    const small=card.querySelector('video');expanded.src=small.dataset.src;expanded.poster=small.poster;expanded.playbackRate=1;document.querySelector('#film-speed').value='1';
    document.querySelector('#film-dialog-title').textContent=card.querySelector('h3').textContent;
    document.querySelector('#film-dialog-subtitle').textContent=card.querySelector('.film-content>strong').textContent;
    document.querySelector('#film-dialog-description').textContent=card.querySelector('.film-content>p').textContent;
    document.querySelector('#film-dialog-storyboard').src=card.querySelector('.film-storyboard').src;
    document.querySelector('#film-download').href=small.dataset.src;
    document.querySelector('#film-original').href=card.querySelector('.film-actions a').href;
    dialog.showModal();document.querySelector('#film-close').focus();expanded.load();
    if(!reduced())expanded.play().catch(()=>{});
  }
  document.querySelector('#film-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{expanded.pause();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  document.querySelector('#film-speed').addEventListener('change',event=>{expanded.playbackRate=Number(event.target.value);});
  function step(amount){expanded.pause();if(Number.isFinite(expanded.duration))expanded.currentTime=Math.min(expanded.duration,Math.max(0,expanded.currentTime+amount/30));}
  document.querySelector('#film-prev-frame').addEventListener('click',()=>step(-1));document.querySelector('#film-next-frame').addEventListener('click',()=>step(1));
  document.querySelector('#film-restart').addEventListener('click',()=>{expanded.currentTime=0;expanded.play().catch(()=>notice('재생 버튼을 다시 눌러 주세요.'));});
  document.querySelector('#pause-films').addEventListener('click',()=>{pauseFilms();notice('앱 영상 재생을 멈췄습니다.');});
  for(const button of document.querySelectorAll('[data-film-filter]'))button.addEventListener('click',()=>{pauseFilms();const group=button.dataset.filmFilter;document.querySelectorAll('[data-film-filter]').forEach(b=>{const active=b===button;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});filmCards.forEach(c=>c.hidden=group!=='all'&&c.dataset.filmGroup!==group);});
  const mediaObserver=new IntersectionObserver(entries=>{for(const e of entries)if(!e.isIntersecting)e.target.querySelector('video').pause();},{threshold:.1});filmCards.forEach(c=>mediaObserver.observe(c));
  document.addEventListener('click',event=>{const button=event.target.closest('[data-tool="reduced"]');if(button&&typeof setReduced==='function')setReduced(button.getAttribute('aria-pressed')==='true');});
  const motionObserver=new MutationObserver(()=>{library?.setReduced(reduced());if(reduced()){pauseFilms();expanded.pause();}});motionObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseFilms();expanded.pause();library?.pauseAll();}});
  for(const button of document.querySelectorAll('[data-preview-target]'))button.addEventListener('click',()=>{
    const target=button.dataset.previewTarget;
    if(target==='layout-features'){const recipe=document.querySelector('#layout-features');recipe.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});const frame=recipe.querySelector('iframe');const choose=()=>frame.contentWindow.postMessage({type:'family-recipe',name:'features'},messageOrigin);if(frame.contentDocument?.readyState==='complete')choose();else frame.addEventListener('load',choose,{once:true});return;}
    if(library?.reveal){library.reveal(target);return;}
    // IDs are resolved against the library's metadata, not a separate component store.
    const aliases={ 'hero-intro':'hero', 'buttons':'button','secure-backup':'backup','send-receive-swap':'icons','nft-media':'nft','wallet-assets':'assets','activity-list':'activity','security-lock':'security','wallet-reorder':'reorder','article-hover':'article','transaction-toast':'transaction','testimonial-rail':'testimonial','footer-reveal':'footer' };
    const term=aliases[target]||target;
    const search=document.querySelector('#motion-library input[type="search"]');if(search){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));}
    let card=document.getElementById(`fm-${target}`)||document.querySelector(`#motion-library [data-id="${target}"]`)||[...document.querySelectorAll('#motion-library article')].find(e=>(e.id+' '+e.dataset.id+' '+e.textContent).toLowerCase().includes(term));
    (card||document.querySelector('#motion')).scrollIntoView({behavior:reduced()?'instant':'smooth',block:'center'});
    if(card){card.classList.add('fm-highlight');setTimeout(()=>card.classList.remove('fm-highlight'),2200);}
  });
  const recipeFrame=document.querySelector('#layout-features iframe');if(recipeFrame){const updateRecipe=(hidden=false)=>recipeFrame.contentWindow?.postMessage({type:'family-reduced',value:hidden||reduced()},messageOrigin);new IntersectionObserver(entries=>updateRecipe(!entries[0].isIntersecting),{threshold:.05}).observe(recipeFrame);recipeFrame.addEventListener('load',()=>updateRecipe(true));new MutationObserver(()=>updateRecipe()).observe(document.documentElement,{attributes:true,attributeFilter:['class']});}
  window.FamilyCatalogV2={pauseFilms,openFilm:name=>{const card=filmCards.find(c=>c.dataset.film===name);if(card)openFilm(card);}};
})();
