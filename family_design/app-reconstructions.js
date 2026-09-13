(() => {
  'use strict';
  const flows = [
    {id:'send',name:'Send',evidence:'원본의 대상 선택 → 자산 선택 → 확인 순서를 참고했습니다. 토큰 금액 입력과 완료 상태는 대체 동작입니다.'},
    {id:'receive',name:'Receive',evidence:'원본의 이름·주소·QR 카드와 공유 동작을 참고했습니다. QR은 임의로 생성하지 않고 원본 영상에서 확인할 수 있게 남겼습니다.'},
    {id:'swap',name:'Swap',evidence:'원본의 금액 입력 → 교환 자산 → 확인 화면 순서를 참고했습니다. 환율은 고정된 예제 값입니다.'},
    {id:'nft',name:'Collectibles',evidence:'원본 미디어와 즐겨찾기 동작을 참고했습니다. 개별 NFT 원본 파일 대신 수집된 Collectibles 홍보 이미지를 사용합니다.'},
    {id:'watch',name:'Watch wallets',evidence:'원본의 관찰할 지갑 → 자산 목록 전환을 참고했습니다. 주소 조회와 잔액은 네트워크 없이 데모 값으로 대체합니다.'},
    {id:'activity',name:'Activity',evidence:'원본의 거래 내역 목록과 정보 위계를 참고했습니다. 추가·분류 필터는 관찰 기반 대체 상태입니다.'},
    {id:'onboarding',name:'Onboarding',evidence:'원본의 Import / Restore / Watch 선택 구조를 참고했습니다. 비밀 복구 문구와 개인 키 입력은 샘플 완료 동작으로 대체합니다.'},
    {id:'missioncontrol',name:'Mission Control',evidence:'원본의 지갑 카드 그리드와 선택·그룹화 동작을 참고했습니다. 그룹 이름과 잔액은 데모 데이터입니다.'},
    {id:'dragdropdone',name:'Drag & drop',evidence:'원본의 목록 재정렬을 참고했습니다. 데스크톱 드래그와 터치·키보드용 위/아래 버튼을 함께 제공합니다.'}
  ];
  const screen=document.querySelector('#flow-screen'),video=document.querySelector('#flow-original'),nav=document.querySelector('#flow-nav');
  const announcement=document.querySelector('#flow-announcement');
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let current,state,dragged;
  const say=text=>{announcement.textContent=text;};
  const primary=(text,action)=>`<button class="phone-primary" ${action?`type="button" data-action="${action}"`:'type="submit"'}>${text}</button>`;
  const card=(title,detail)=>`<div class="phone-card"><strong>${escape(title)}</strong><small>${escape(detail)}</small></div>`;
  const error='<p id="flow-error" class="phone-error" role="alert"></p>';
  function render(focus=false){
    screen.classList.toggle('light',['onboarding','missioncontrol'].includes(current.id));
    let body='';
    if(current.id==='send'||current.id==='swap'){
      const swap=current.id==='swap';
      if(state.step===0)body=`<form id="flow-form"><label for="flow-recipient">${swap?'받을 토큰':'받는 사람 (데모)'}</label>${swap?`<select id="flow-recipient"><option ${state.recipient==='DAI'?'selected':''}>DAI</option><option ${state.recipient==='USDC'?'selected':''}>USDC</option></select>`:`<input id="flow-recipient" placeholder="예: demo.eth" value="${escape(state.recipient||'')}" autocomplete="off">`}<label for="flow-amount">보낼 ETH · 데모 잔액 2 ETH</label><input id="flow-amount" type="number" inputmode="decimal" min="0.0001" max="2" step="any" value="${escape(state.amount||'0.01')}" required>${card('Ethereum','데모 네트워크 · 자산 이동 없음')}${error}${primary('Continue')}</form>`;
      else if(state.step===1)body=`<p>${swap?'Confirm swap':'Confirm transaction'}</p><div class="phone-amount">${escape(state.amount)} ETH</div>${card(swap?`Receive ${(Number(state.amount)*2000).toFixed(2)} ${state.recipient}`:`To ${state.recipient}`,swap?'고정 예제 환율 1 ETH = 2,000 · 시세 아님':'사용자가 지정한 데모 수신 대상')}${card('Normal','예상 시간·수수료 확인 영역 · 시뮬레이션')}${primary('Confirm · 데모 완료','confirm')}<button class="phone-secondary" data-action="back">← 수정</button>`;
      else body=`<div class="phone-amount">${swap?'Swap':'Send'} preview<br>complete.</div><p>완료 화면까지의 대체 흐름입니다. 자산은 이동하지 않았습니다.</p>${primary('다시 시작','reset')}`;
    } else if(current.id==='receive'){
      body=`<h4>Demo wallet</h4><p>주소 카드 · Ethereum</p>${card('family-demo.eth','0x000000000000000000000000000000000000dEaD')}<p>디자인 검토용 샘플 주소입니다. 실제 입금에 사용하지 마세요. 원본 QR의 형태와 움직임은 좌측 영상에서 볼 수 있습니다.</p>${primary('샘플 주소 복사','copy')}<p>Share Address의 로컬 대체 동작</p>`;
    } else if(current.id==='nft'){
      body=`<img class="phone-asset" src="references/v2-source/assets/promo-collectibles.png" alt="Family 원본 Collectibles 홍보 이미지">${card('Collectibles','원본 홍보 이미지 · 개별 NFT 매체가 아님')}<button class="phone-primary" data-action="favorite" aria-pressed="${state.favorite}">${state.favorite?'즐겨찾기에 저장됨':'즐겨찾기 추가'}</button><button class="phone-secondary" data-action="details">${state.details?'정보 접기':'미디어 정보 보기'}</button>${state.details?'<p>실제 NFT 영상과 진행 컨트롤은 좌측 원본 영상에서 확인할 수 있습니다. 즐겨찾기는 현재 페이지 메모리에만 유지됩니다.</p>':''}`;
    } else if(current.id==='watch'){
      body=state.step===0?`<form id="flow-form"><p>Watch Any Wallet</p><label for="flow-recipient">주소 또는 ENS (데모)</label><input id="flow-recipient" placeholder="예: family-demo.eth" autocomplete="off">${error}${primary('데모 지갑 보기')}</form>`:`${card(state.recipient,'View-only · 샘플 자산')}<div class="phone-amount">$4,260.00</div>${card('Ethereum','2 ETH · $4,000.00')}${card('Dai','260 DAI · $260.00')}<p>실시간 조회 결과가 아닌 시각적 정보 위계 예제입니다.</p>${primary('다른 주소 보기','reset')}`;
    } else if(current.id==='activity'){
      const rows=state.activities.filter(x=>state.filter==='all'||x.type===state.filter);
      body=`<label for="activity-filter">거래 분류</label><select id="activity-filter"><option value="all" ${state.filter==='all'?'selected':''}>전체</option><option value="received" ${state.filter==='received'?'selected':''}>받음</option><option value="sent" ${state.filter==='sent'?'selected':''}>보냄</option></select><ul class="phone-list">${rows.map(x=>`<li><span>${x.type==='received'?'Received':'Sent'}<br><small>${x.time} · 데모</small></span><strong>${x.type==='received'?'+':'−'}${x.amount} ETH</strong></li>`).join('')}</ul>${primary('새 수신 내역 추가','add')}<p>선택한 분류에 맞춰 내역이 표시됩니다. 최대 8개까지 유지합니다.</p>`;
    } else if(current.id==='onboarding'){
      body=state.step===0?`<img class="phone-asset" src="references/v2-source/assets/promo-wallet.jpg" alt="Family 원본 지갑 홍보 이미지"><h4>Add an Existing Wallet</h4><p>시작 방식을 선택하세요. 실제 인증 정보는 입력하지 않습니다.</p>${['Import','Restore','Watch'].map(x=>`<button class="phone-primary" data-action="onboard" data-value="${x}">${x}</button>`).join('')}`:state.step===1?`${card(state.method,'선택한 시작 방식')}<p>${state.method==='Watch'?'관찰용 샘플 지갑을 추가합니다.':'비공개 인증 절차는 샘플 지갑 추가로 대체합니다. 복구 문구·개인 키를 요구하지 않습니다.'}</p>${primary('샘플 지갑 추가','confirm')}<button class="phone-secondary" data-action="back">← 다시 선택</button>`:`<img class="phone-asset" src="references/v2-source/previews/shape-20.svg" alt="추출한 Family 지갑 도형"><h4>Demo wallet added</h4><p>${escape(state.method)} 선택 → 로컬 확인 → 완료</p>${primary('다시 시작','reset')}`;
    } else if(current.id==='missioncontrol'){
      body=`<p>관리할 지갑을 선택한 뒤 그룹을 바꿔보세요.</p><div class="phone-wallets">${['Personal','Savings','Collectibles','Watching'].map((x,i)=>`<button data-action="wallet" data-index="${i}" aria-pressed="${state.selected.includes(i)}">${x}<small><br>${i+1} wallet</small></button>`).join('')}</div><label for="wallet-group">선택한 지갑의 그룹</label><select id="wallet-group"><option>Personal</option><option>Savings</option><option>Watching</option></select>${primary('선택한 지갑 그룹화','group')}${error}${state.group?card(state.group,`${state.selected.length}개 지갑 · 현재 화면에서만 변경`):''}`;
    } else {
      body=`<p>항목을 끌거나 위·아래 버튼으로 순서를 바꿔보세요.</p><ul class="phone-list" id="reorder-list">${state.order.map((x,i)=>`<li draggable="true" data-index="${i}"><span>${escape(x)}</span><div><button data-action="move" data-index="${i}" data-offset="-1" aria-label="${x} 위로 이동" ${i===0?'disabled':''}>↑</button> <button data-action="move" data-index="${i}" data-offset="1" aria-label="${x} 아래로 이동" ${i===state.order.length-1?'disabled':''}>↓</button></div></li>`).join('')}</ul><p>변경된 순서는 이 데모에만 적용됩니다.</p>${primary('원래 순서로','reset')}`;
    }
    screen.innerHTML=`<div class="phone-top"><span>9:41</span><span>LOCAL DEMO</span></div><h3>${current.name}</h3>${body}`;
    if(focus)screen.focus({preventScroll:true});
  }
  function reset(){state={step:0,favorite:false,details:false,filter:'all',activities:[{type:'received',amount:'0.02',time:'Today'},{type:'sent',amount:'0.01',time:'Yesterday'}],selected:[],order:['Ethereum','Dai','USD Coin','Collectibles']};render();say('처음 상태로 돌아왔습니다.');}
  function select(id,updateUrl=true){
    current=flows.find(x=>x.id===id)||flows[0];video.pause();video.src=`references/v2-source/videos/${current.id}.mp4`;video.poster=`references/v2-source/videos/${current.id}-poster.jpg`;video.load();
    document.querySelector('#original-download').href=video.getAttribute('src');document.querySelector('#original-caption').textContent=`${current.name} · Family에서 공개한 원본 MP4`;
    document.querySelector('#flow-evidence').textContent=current.evidence;
    nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.flow===current.id)));
    if(updateUrl)history.replaceState(null,'',`#${current.id}`);reset();say(`${current.name} 흐름을 선택했습니다.`);
  }
  nav.innerHTML=flows.map(x=>`<button data-flow="${x.id}" aria-pressed="false">${x.name}</button>`).join('');
  nav.addEventListener('click',e=>{const b=e.target.closest('[data-flow]');if(b)select(b.dataset.flow);});
  screen.addEventListener('submit',e=>{
    e.preventDefault();const recipient=screen.querySelector('#flow-recipient')?.value.trim();const amount=screen.querySelector('#flow-amount')?.value;
    if(!recipient||recipient.length>120){screen.querySelector('#flow-error').textContent='데모 대상 또는 주소를 1–120자로 입력해 주세요.';screen.querySelector('#flow-recipient').focus();return;}
    if(current.id!=='watch'&&(!Number.isFinite(Number(amount))||Number(amount)<.0001||Number(amount)>2)){screen.querySelector('#flow-error').textContent='0.0001–2 ETH 사이의 데모 금액을 입력해 주세요.';return;}
    state.recipient=recipient;state.amount=amount;state.step=1;render(true);say('입력한 내용의 확인 화면입니다.');
  });
  async function copyAddress(){const address='0x000000000000000000000000000000000000dEaD';try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(address);else{const field=document.createElement('textarea');field.value=address;screen.append(field);field.select();const copied=document.execCommand('copy');field.remove();if(!copied)throw Error('clipboard');}say('디자인 검토용 샘플 주소를 복사했습니다. 실제 입금용이 아닙니다.');}catch{say(`복사할 샘플 주소: ${address}`);}}
  function move(from,to){if(from<0||to<0||from>=state.order.length||to>=state.order.length||from===to)return;const item=state.order.splice(from,1)[0];state.order.splice(to,0,item);render();const buttons=screen.querySelectorAll(`[data-action="move"][data-index="${to}"]`);([...buttons].find(x=>!x.disabled)||screen).focus({preventScroll:true});say(`${item} 항목이 ${to+1}번째로 이동했습니다.`);}
  screen.addEventListener('click',e=>{
    const button=e.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;
    if(action==='reset'){reset();screen.focus();return;}
    if(action==='copy'){copyAddress();return;}
    if(action==='move'){move(Number(button.dataset.index),Number(button.dataset.index)+Number(button.dataset.offset));return;}
    if(action==='confirm'){state.step=2;render(true);say('로컬 대체 흐름을 완료했습니다.');return;}
    if(action==='back'){state.step=0;render(true);return;}
    if(action==='favorite'){state.favorite=!state.favorite;render();screen.querySelector('[data-action="favorite"]').focus();say(state.favorite?'즐겨찾기에 추가했습니다.':'즐겨찾기를 해제했습니다.');return;}
    if(action==='details'){state.details=!state.details;render();screen.querySelector('[data-action="details"]').focus();return;}
    if(action==='add'){state.activities.unshift({type:'received',amount:'0.05',time:'Just now'});state.activities=state.activities.slice(0,8);render();screen.querySelector('[data-action="add"]').focus();say('수신 내역을 추가했습니다. 현재 필터가 보냄이면 전체 또는 받음으로 바꿔 확인하세요.');return;}
    if(action==='onboard'){state.method=button.dataset.value;state.step=1;render(true);return;}
    if(action==='wallet'){const index=Number(button.dataset.index);state.selected=state.selected.includes(index)?state.selected.filter(x=>x!==index):[...state.selected,index];state.group=null;render();screen.querySelector(`[data-action="wallet"][data-index="${index}"]`).focus();say(`${state.selected.length}개 지갑을 선택했습니다.`);return;}
    if(action==='group'){if(!state.selected.length){screen.querySelector('#flow-error').textContent='그룹화할 지갑을 먼저 선택해 주세요.';return;}state.group=screen.querySelector('#wallet-group').value;render();screen.querySelector('#wallet-group').value=state.group;screen.querySelector('[data-action="group"]').focus();say(`${state.selected.length}개 지갑을 ${state.group} 그룹으로 표시했습니다.`);}
  });
  screen.addEventListener('change',e=>{if(e.target.id==='activity-filter'){state.filter=e.target.value;render();screen.querySelector('#activity-filter').focus();say('거래 분류를 변경했습니다.');}});
  screen.addEventListener('dragstart',e=>{const row=e.target.closest('[draggable]');if(!row)return;dragged=Number(row.dataset.index);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(dragged));});
  screen.addEventListener('dragover',e=>{if(e.target.closest('[draggable]'))e.preventDefault();});
  screen.addEventListener('drop',e=>{const row=e.target.closest('[draggable]');if(!row||!Number.isInteger(dragged))return;e.preventDefault();move(dragged,Number(row.dataset.index));dragged=undefined;});
  screen.addEventListener('dragend',()=>{dragged=undefined;});
  document.querySelector('#flow-reset').addEventListener('click',reset);
  window.addEventListener('hashchange',()=>select(location.hash.slice(1),false));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
  select(location.hash.slice(1),false);
})();
