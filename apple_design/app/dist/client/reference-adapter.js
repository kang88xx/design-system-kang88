// Local-only adjustments: external commerce stays on Apple; preview has no telemetry.
document.addEventListener('DOMContentLoaded',()=>{
  import('/apple_design/app/dist/client/v/home/a/scripts/HpViewport-DHyTaS-L.built.js').then(({a:queries})=>{
    for(const name of ['small','medium','large','largetall','mediumtall']){
      const query=queries[name];
      matchMedia(query).addEventListener('change',event=>document.dispatchEvent(new CustomEvent('homepage:breakpointchange',{detail:{name,query,matches:event.matches}})));
    }
  });
  const nav=document.querySelector('#globalnav');
  let hoverTimer;
  document.addEventListener('keydown',event=>{if(event.key==='Escape')clearTimeout(hoverTimer);});
  nav?.addEventListener('pointerover',event=>{
    clearTimeout(hoverTimer);
    if(!matchMedia('(min-width: 834px) and (hover: hover)').matches)return;
    const link=event.target.closest('.globalnav-submenu-trigger-link');
    if(!link)return;
    hoverTimer=setTimeout(()=>{
      const item=link.closest('.globalnav-item');
      const button=item?.querySelector('.globalnav-submenu-trigger-button');
      if(link.matches(':hover')&&button?.getAttribute('aria-expanded')==='false')button.click();
    },160);
  });
  nav?.addEventListener('pointerleave',()=>{
    clearTimeout(hoverTimer);
    hoverTimer=setTimeout(()=>nav.querySelector('.globalnav-submenu-trigger-button[aria-expanded="true"]')?.click(),120);
  });
  const module=new URLSearchParams(location.search).get('module');
  if(module==='navigation'){
    document.querySelector('main')?.setAttribute('hidden','');
    document.querySelector('footer')?.setAttribute('hidden','');
    document.body.style.background='#f5f5f7';
  }
  document.querySelectorAll('a[href]').forEach(a=>{
    if(a.getAttribute('href').startsWith('/')&&!a.getAttribute('href').endsWith('.ics')) a.href='https://www.apple.com'+a.getAttribute('href');
  });
  const form=document.querySelector('.globalnav-searchfield-form');
  if(form)form.addEventListener('submit',e=>{
    e.preventDefault();const q=form.querySelector('input[type="text"],input[type="search"]')?.value;
    if(q)location.href='https://www.apple.com/us/search/'+encodeURIComponent(q);
  });
});
