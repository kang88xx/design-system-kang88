"""Compose the visual motion/source library into the token catalog."""
import pathlib,json,re,html
ROOT=pathlib.Path(__file__).resolve().parents[1]
MEDIA_META={
 'send':('Send','지갑에서 전송 화면으로','보낼 토큰·NFT를 선택한 뒤 수신 대상을 고르는 흐름. 카드 전환, 목록 이동, 선택 피드백을 원본 영상으로 확인합니다.','#fm-send-receive-swap','전송'),
 'receive':('Receive','내 주소를 한 장의 카드로','QR 코드와 주소 카드가 중심에 나타나는 짧은 흐름. 배경 전환과 QR 패널의 등장·정착을 확인합니다.',' #fm-send-receive-swap','전송'),
 'swap':('Swap','금액에서 교환으로','금액 입력과 토큰 선택이 전환되는 흐름. 숫자의 시각적 강조와 입력 패널의 변화를 확인합니다.','#fm-send-receive-swap','전송'),
 'nft':('Collectibles','미디어가 주인공인 NFT','NFT 미디어를 보여주면서 재생 진행과 원형 컨트롤이 함께 변합니다. 네이티브 컨트롤 재구성도 아래에서 조작할 수 있습니다.','#fm-nft-progress-star','탐색'),
 'watch':('Watch wallets','지갑을 감시 목록에 추가','대상 지갑 화면과 토큰 리스트가 등장하는 흐름. 상단 정보, 목록, 잔액의 계층을 확인합니다.','#fm-wallet-assets','탐색'),
 'activity':('Activity','한눈에 읽히는 거래 내역','활동 내역의 타임라인과 아이콘, 작은 메타 정보가 함께 보입니다. 목록 안에서 정보가 나타나는 리듬을 확인합니다.','#fm-activity-addition','탐색'),
 'onboarding':('Onboarding','첫 지갑을 만드는 과정','여러 장의 지갑 카드와 시작 단계를 연결하는 흐름. 앞뒤 레이어, 확인 체크, 스프링 정착을 관찰합니다.','#fm-wallet-grouping','관리'),
 'missioncontrol':('Mission Control','지갑을 한곳에서 관리','색상으로 구분된 지갑 카드가 그리드에 나타납니다. 카드 배치, 선택 강조, 공간 전환을 확인합니다.','#fm-wallet-grouping','관리'),
 'dragdropdone':('Drag & drop','옮기고 놓으면 정리 끝','목록 항목을 끌어 재정렬하는 동작. 들어 올림, 빈자리 이동, 놓은 뒤 정착을 원본으로 보고 직접 조작도 비교할 수 있습니다.','#fm-wallet-drag-reorder','관리')}
SCENES=[
 ('hero','Hero & navigation','0–3초',1,'가운데 제목과 양옆 장식, 대기자 등록 폼. 장식 드래그·등장·흔들림과 nav 패널을 각각 구현했습니다.','hero-entry-shapes','hero'),
 ('bento','Explore · five cards','4–7초',3,'Easy / Secure / Fast / Powerful / Fun. 단순 레이아웃뿐 아니라 2초 간격의 내부 상태 변화를 개별 썸네일로 제공합니다.','backup-success','bento'),
 ('transfer','Send · Receive · Swap','8–11초',5,'3열의 폰 미디어와 아래 캡션. 원본 3개 영상과 전송·수신·교환 아이콘 동작을 함께 제공합니다.','send-receive-swap','app'),
 ('features','Feature copy grid','10–13초',6,'기능명과 짧은 설명으로 이루어진 2열 텍스트 블록. 낮은 대비 배경과 촘촘한 본문 위계가 특징입니다.','layout-features','static'),
 ('nft','The best way to experience NFTs','13–17초',8,'좌측 폰, 우측 골드 라벨·제목·지원 포맷 목록. 영상과 재생/즐겨찾기 컨트롤 재구성을 함께 제공합니다.','nft-progress-star','app'),
 ('watch','Watch the wallets you care about','17–19초',10,'Watch 기능을 설명하는 교차 배치. green 체크 리스트, 간결한 설명과 토큰 화면이 대응됩니다.','wallet-assets','app'),
 ('activity','Easy-to-read activity','19–21초',11,'새 거래가 더해지는 리스트, 날짜·아바타·상태 강조. 폰 원본과 작은 활동 목록 예시를 모두 제공합니다.','activity-addition','app'),
 ('security','Relentless protection. Restful ease.','21–23초',12,'구름과 파란 자물쇠 일러스트. 현재 사이트의 보안 마스코트 SVG도 별도로 보존했습니다.','padlock-security','illustration'),
 ('management','Effortless onboarding. Masterful management.','24–27초',14,'온보딩 / Mission Control / 드래그 정리의 3열 구성. 원본 세 영상과 실제로 움직일 수 있는 그룹·재정렬 컨트롤이 있습니다.','wallet-drag-reorder','app'),
 ('articles','The latest from Family','27–29초',15,'2열 이미지 카드에 메타 정보와 설명을 붙입니다. 이미지에만 1.02배 hover를 적용하는 원본 규칙을 시연합니다.','article-hover','content'),
 ('details','Details that matter','29–38초',17,'Monitor / Protect / Organise / See Clearly 네 가지. 거래 카드 겹침, 보호 배지, 토큰 수치, 그룹 표시를 개별 상태 루프로 구현했습니다.','transaction-toast','details'),
 ('testimonials','Friends of Family','39–42초',21,'후기 카드 레일과 양끝의 fade mask. 120초 선형 반복을 재현하고 일시정지와 모션 감소 설정을 제공합니다.','testimonial-rail','content'),
 ('faq','Frequently Asked Questions','43–45초',23,'질문을 누르면 한 항목만 열리는 아코디언. +/−, 답변 높이와 투명도가 서로 다른 spring으로 변합니다.','faq-accordion','content'),
 ('footer','Explore Family · footer','45–46.85초',23,'마지막 CTA와 잘린 장식 그래픽. viewport 진입 시 시작하는 도형별 stagger를 추가 구현했습니다.','footer-reveal','hero')]

def media_section():
 media=json.loads((ROOT/'references/v2-source/media-library.json').read_text())['videos']
 cards=[]
 for i,v in enumerate(media):
  name,title,desc,target,group=MEDIA_META[v['name']];target=target.strip()
  cards.append(f'''<article class="film-card" data-film="{v['name']}" data-film-group="{group}"><div class="film-stage"><video muted playsinline preload="none" poster="{v['poster']}" data-src="{v['local']}" aria-label="{name} 원본 데모"></video><span class="film-index">0{i+1} / {group}</span><button class="film-play" aria-label="{name} 재생" data-film-play><span>▶</span><small>재생</small></button><span class="film-duration">{v['durationSeconds']:.2f}s</span></div><div class="film-content"><div class="film-title"><h3>{name}</h3><span class="badge">원본 MP4</span></div><strong>{title}</strong><p>{desc}</p><img class="film-storyboard" loading="lazy" src="{v['storyboard']}" alt="{name}의 시작·중간·끝 프레임"><div class="film-actions"><button data-film-open="{v['name']}">확대 · 슬로 모션 ↗</button><a href="app-reconstructions.html#{v['name']}">직접 조작 ↗</a><a href="{v['source']}" target="_blank" rel="noreferrer">원본 ↗</a></div></div></article>''')
 return '''<section id="app-demos"><div class="section-label">02 / ORIGINAL PRODUCT FILMS</div><div class="section-heading"><div><h2>Inside the wallet.</h2><p>목록으로만 있던 9개의 앱 동작을 실제 영상으로 담았습니다.<br>썸네일에서 재생하거나 크게 열어 프레임을 천천히 살펴보세요.</p></div><span class="count-bubble">09</span></div><div class="film-filter" role="group" aria-label="앱 영상 분류"><button class="selected" data-film-filter="all" aria-pressed="true">전체 9</button><button data-film-filter="전송" aria-pressed="false">전송 · 수신 · 교환</button><button data-film-filter="탐색" aria-pressed="false">NFT · 탐색</button><button data-film-filter="관리" aria-pressed="false">온보딩 · 관리</button><button id="pause-films">모두 일시정지 Ⅱ</button></div><div class="film-grid">'''+''.join(cards)+'''</div><p class="caption">원본 영상과 직접 조작하는 HTML 데모는 다른 자료입니다. 위 영상은 실제 화면의 시각적 움직임을 보존하며, 인터랙티브 재구성은 Motion playground에서 볼 수 있습니다.</p></section>'''

def atlas_section():
 cards=[]
 for i,(slug,title,time,frame,desc,target,group) in enumerate(SCENES):
  img='references/v2-review/footer-reference.png' if slug=='footer' else f'references/frames/frame-{frame:03d}.png'
  cards.append(f'''<article class="scene-card"><a href="{img}" target="_blank"><div class="scene-image"><img src="{img}" alt="원본 영상의 {html.escape(title)} 구간" loading="lazy"><span>{time}</span></div></a><div class="scene-copy"><span class="scene-number">{i+1:02d} / {group.upper()}</span><h3>{title}</h3><p>{desc}</p><button data-preview-target="{target}">대응하는 구현 보기 ↗</button></div></article>''')
 coverage=[{'id':x[0],'title':x[1],'videoRange':x[2],'frame':x[3],'description':x[4],'previewId':x[5],'group':x[6]} for x in SCENES]
 (ROOT/'source-coverage.json').write_text(json.dumps({'version':2,'scope':'All 14 major visual groups visible in provided recording; implementation versus original media labeled','sections':coverage},ensure_ascii=False,indent=2)+'\n')
 return '''<section id="scene-atlas"><div class="section-label">03 / COMPLETE SCENE ATLAS</div><div class="section-heading"><div><h2>Every scene, accounted for.</h2><p>원본 영상의 처음부터 끝까지 14개 영역을 대조했습니다.<br>각 원본 썸네일에서 관련 구현으로 바로 이동할 수 있습니다.</p></div><span class="count-bubble">14</span></div><div class="scene-grid">'''+''.join(cards)+'''</div></section>'''

def asset_section():
 shapes=[('19','Flower'),('20','Wallet'),('25','Shield'),('26','Arrow'),('27','Heart'),('29','Gear'),('30','Ethereum'),('50','Flower Blue'),('54','Bee'),('55','Scallop'),('58','Grid'),('62','Lock')]
 cards=''.join(f'<a class="asset-tile" href="references/v2-source/previews/shape-{n}.svg" download><img src="references/v2-source/previews/shape-{n}.svg" alt="{label}" loading="lazy"><span>{label} <small>SVG ↓</small></span></a>' for n,label in shapes)
 illustrations=''.join(f'<a class="illustration-tile" href="references/v2-source/previews/svg-{n}.svg" download><img src="references/v2-source/previews/svg-{n}.svg" alt="{label}" loading="lazy"><span>{label} · SVG ↓</span></a>' for n,label in [('042','Security mascot · 현재 사이트'),('088','Footer scene · 현재 사이트')])
 return '''<section id="asset-library"><div class="section-label">04 / ORIGINAL SHAPES & ASSETS</div><h2>The little things, included.</h2><p>원본 DOM의 SVG 94개와 Hero 도형 그룹 69개를 확보했습니다. 대표 도형은 바로 다운로드하고, 전체 자료는 소스 패키지에서 볼 수 있습니다.</p><div class="asset-grid">'''+cards+'''</div><div class="illustration-grid">'''+illustrations+'''</div><p class="caption">영상의 과거 일러스트와 현재 사이트의 마스코트는 구분했습니다. 색상 변수가 빠져 검게 보이지 않도록, 다운로드용 SVG에는 원본 fallback 색상도 포함했습니다.</p></section>'''

def enhance(page):
 page=page.replace('<link rel="stylesheet" href="catalog.css">','<link rel="stylesheet" href="catalog.css"><link rel="stylesheet" href="catalog-v2.css"><link rel="stylesheet" href="motion-library.css">')
 page=page.replace('<script src="catalog.js"></script>','<script src="motion-library.js"></script><script src="catalog.js"></script><script src="catalog-v2.js"></script>')
 page=page.replace('REFERENCE EXTRACTION / 01','VISUAL SYSTEM / EDITION 02').replace('근거 기반 추출','SOURCE + RECONSTRUCTION')
 page=page.replace('친근한 그래픽, 차분한 인터페이스.<br>Family의 시각 언어를 재사용 가능한 규칙으로.','보기만 했던 디테일을, 직접 움직여보세요.<br>원본 소스와 영상으로 완성한 Family 인터랙션 라이브러리.')
 page=re.sub(r'<div class="intro-stickers".*?</div>','<div class="intro-stickers v2-shapes" aria-hidden="true"><img src="references/v2-source/previews/shape-19.svg" alt=""><img src="references/v2-source/previews/shape-26.svg" alt=""><img src="references/v2-source/previews/shape-27.svg" alt=""></div>',page)
 page=page.replace('<span>49 color variables</span><span>3 type families</span><span>46.85s reference</span><span>Desktop + Mobile</span>','<a href="#motion">22 interactive previews ↗</a><a href="#app-demos">9 original product films ↗</a><a href="#scene-atlas">14 reference scenes ↗</a><a href="#colors">49 color tokens ↗</a>')
 page=page.replace('이 페이지는 추출 결과를 보여주는 문서입니다. 브랜드 원본 화면은 아래 증거에서 확인하세요. 컴포넌트 데모의 마크업·상태 처리 및 문서 레이아웃은 재구성했습니다.','공개 코드에서 찾은 실제 모션 수치와 원본 영상을 바탕으로 재구성했습니다. 각 카드에서 직접 조작하고, 동작 설명과 구현 코드까지 확인할 수 있습니다.')
 nav='''<nav aria-label="문서 목차"><a href="#overview">Overview <span>↗</span></a><a href="#motion">01 · Motion playground <span>LIVE</span></a><a href="#app-demos">02 · Product films <span>09</span></a><a href="#scene-atlas">03 · Scene atlas <span>14</span></a><a href="#asset-library">04 · Shapes & assets</a><a href="#colors">05 · Colors <span>49</span></a><a href="#type">06 · Typography</a><a href="#layout">07 · Layout & shape</a><a href="#components">08 · Controls</a><a href="#evidence">09 · Sources</a><a href="#handoff">10 · Handoff</a></nav>'''
 page=re.sub(r'<nav aria-label="문서 목차">.*?</nav>',nav,page,flags=re.S)
 motion='''<section id="motion"><div class="section-label">01 / MOTION PLAYGROUND</div><div class="section-heading"><div><h2>Not just a screenshot.</h2><p>드래그하고, 누르고, 재생해 보세요.<br>작은 디테일 하나하나를 움직이는 썸네일로 만들었습니다.</p></div><button id="motion-toggle" class="family-button secondary compact" aria-pressed="false">모션 줄이기</button></div><div class="v2-evidence-key"><span><i class="key-source"></i>원본 수치 · 공개 코드에서 확인</span><span><i class="key-rebuild"></i>재구성 · HTML/SVG로 직접 조작</span><span>카드를 누르거나 ‘재생’으로 움직임을 확인하세요.</span></div><div id="motion-library"></div></section>'''
 sections={m.group(1):m.group(0) for m in re.finditer(r'<section id="([^"]+)"[^>]*>.*?</section>',page,re.S)}
 prefix=page[:page.index('<section id="overview"')];suffix=page[page.rindex('</section>')+len('</section>'):]
 sections['motion']=motion
 sections['handoff']=sections['handoff'].replace('<div class="downloads">','<div class="downloads"><a href="family-design-system.zip" download>전체 소스 패키지 <span>↓</span></a><a href="motion-source-tokens.json" download>Source motion tokens <span>↓</span></a><a href="motion-data.json" download>Interactive preview specs <span>↓</span></a><a href="source-coverage.json" download>Scene coverage map <span>↓</span></a>')
 sections['evidence']=sections['evidence'].replace('<div class="section-label">01 / REFERENCE</div>','<div class="section-label">09 / REFERENCE & RESEARCH</div>').replace('<h2>관찰과 추정을 분리합니다.</h2>','<h2>See where it comes from.</h2>').replace('<a href="references/contact-sheet.png">','<a href="references/v2-research/motion-source-report.md">공개 JS에서 복구한 모션 수치 ↗</a><a href="references/v2-source/coverage-source.md">원본 영상·SVG 소스 인벤토리 ↗</a><a href="references/contact-sheet.png">')
 sections['layout']=sections['layout'].replace('</section>', '<div id="layout-features" class="recipe-preview"><div class="recipe-heading"><h3>Responsive layout recipes</h3><a href="layout-recipes.html" target="_blank">별도 화면에서 열기 ↗</a></div><p>탭을 바꾸며 Bento, split, 3열 폰, 설명 그리드, sticky Details를 실제 HTML로 확인하세요.</p><iframe src="layout-recipes.html" title="Family 반응형 레이아웃 레시피 5종" loading="lazy"></iframe></div></section>')
 for sid,num in [('colors','05'),('type','06'),('layout','07'),('components','08'),('handoff','10')]:sections[sid]=re.sub(r'(<div class="section-label">)\d{2}',r'\g<1>'+num,sections[sid],count=1)
 page=prefix+sections['overview']+motion+media_section()+atlas_section()+asset_section()+''.join(sections[x] for x in ['colors','type','layout','components','evidence','handoff'])+suffix
 # Full-size film inspector; native dialog provides focus trapping and Escape.
 dialog='''<dialog id="film-dialog" aria-labelledby="film-dialog-title"><div class="film-dialog-top"><div><span class="section-label">ORIGINAL MOTION / FRAME INSPECTOR</span><h2 id="film-dialog-title">Product film</h2></div><button id="film-close" aria-label="영상 확대 창 닫기">✕</button></div><div class="film-dialog-body"><div class="film-cinema"><video id="film-expanded" controls muted playsinline preload="none"></video></div><div class="film-inspector"><span class="badge">원본 영상</span><h3 id="film-dialog-subtitle"></h3><p id="film-dialog-description"></p><label for="film-speed">재생 속도</label><select id="film-speed"><option value="0.25">0.25× · 정밀 관찰</option><option value="0.5">0.5× · 느리게</option><option value="1" selected>1× · 원본</option><option value="1.5">1.5× · 빠르게</option></select><div class="film-step-controls"><button id="film-prev-frame">← 이전 프레임</button><button id="film-next-frame">다음 프레임 →</button></div><p class="caption">프레임 버튼은 1/30초 단위 관찰용 seek입니다. 원본 프레임레이트와 별개로 비교 간격을 고정했습니다.</p><button id="film-restart" class="family-button">처음부터 재생 ↺</button><a id="film-download" download>원본 MP4 다운로드 ↓</a><img id="film-dialog-storyboard" alt="원본 영상의 세 시점 비교"><a id="film-original" target="_blank" rel="noreferrer">Family 원본 주소 ↗</a></div></div></dialog>'''
 page=page.replace('<div id="toast"',dialog+'<div id="toast"')
 return page
