/* A consumer integration example. Replace the callback with your own API client. */
(() => {
  const registry = window.AdverComponents.components;
  const host = document.querySelector('#components');
  const choice = document.querySelector('#component-choice');
  const status = document.querySelector('#starter-status');
  const instances = new Map();
  let serial = 0;
  let paused = false;
  registry.forEach(item => {
    const option = document.createElement('option');option.value=item.id;option.textContent=item.title;choice.append(option);
  });
  function localAdapter({signal}) {
    return new Promise((resolve,reject) => {
      const abort = () => {clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};
      const timer = setTimeout(() => {signal.removeEventListener('abort',abort);resolve({message:'콜백 연결을 확인했습니다. 이 예제는 네트워크 요청을 보내지 않습니다.'});},400);
      if (signal.aborted) abort(); else signal.addEventListener('abort',abort,{once:true});
    });
  }
  function add(id) {
    const item=registry.find(entry=>entry.id===id);
    if (!item) return;
    const card=document.createElement('article');card.className='starter-component';card.dataset.instance=String(++serial);
    const heading=document.createElement('header');const title=document.createElement('h2');title.textContent=`${item.title} · ${serial}`;
    const remove=document.createElement('button');remove.type='button';remove.className='starter-remove';remove.textContent='제거 ×';remove.setAttribute('aria-label',`${item.title} ${serial} 제거`);
    heading.append(title,remove);card.append(heading);
    const target=document.createElement('div');target.innerHTML=item.html;card.append(target);host.append(card);
    const cleanMotion=ReferenceMotion.mount(target);
    const cleanInteraction=ReferenceInteractions.mount(target,{onSubmit:localAdapter,onAction:localAdapter});
    const cleanup=()=>{cleanMotion();cleanInteraction();instances.delete(card);};
    instances.set(card,cleanup);
    remove.addEventListener('click',()=>{cleanup();card.remove();document.querySelector('#add-component').focus();status.textContent=`${item.title}을 제거하고 연결된 작업을 해제했습니다.`;});
    status.textContent=`${instances.size}개 컴포넌트가 연결되어 있습니다. 폼·버튼의 콜백은 로컬 예제입니다.`;
  }
  document.querySelector('#add-component').addEventListener('click',()=>add(choice.value));
  document.querySelector('#theme-choice').addEventListener('change',e=>{host.dataset.theme=e.target.value;});
  document.querySelector('#brand-choice').addEventListener('change',e=>{host.dataset.brand=e.target.value;});
  document.querySelector('#pause-motion').addEventListener('click',e=>{paused=!paused;ReferenceMotion.setPaused(paused);ReferenceInteractions.setPaused(paused);e.currentTarget.setAttribute('aria-pressed',String(paused));e.currentTarget.textContent=paused?'모션 재생':'모션 일시정지';});
  ['tabs','faq','form'].forEach(add);
  addEventListener('pagehide',event=>{if(!event.persisted)instances.forEach(cleanup=>cleanup());});
})();
