"""Keep unavailable private structures mapped to inspectable local substitutes."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
motion=json.loads((ROOT/'motion-data.json').read_text())
flows={
'send':('대상·금액 입력 → 확인 → 완료','토큰 금액 입력·검증·완료는 대체 상태. 원본 NFT 선택 화면 전체를 복구한 것은 아님.'),
'receive':('샘플 주소 카드 → 주소 복사','QR 원본은 영상에서 보존. 대체 화면에서는 샘플 주소 복사로 대체.'),
'swap':('자산·금액 입력 → 교환 예상 → 확인 → 완료','환율 고정 데모. 견적 엔진·서버는 원본 소스 아님.'),
'nft':('미디어 표시 → 즐겨찾기 → 정보 펼침','개별 NFT 에셋 대신 원본 홍보 이미지 사용. 전체 네이티브 뷰어 아님.'),
'watch':('주소 입력 → 읽기 전용 자산 목록','조회·잔액은 로컬 데모.'),
'activity':('거래 내역 → 분류 → 새 내역 추가','실시간 거래 피드 대신 메모리 내 예제.'),
'onboarding':('Import / Restore / Watch → 로컬 확인 → 완료','비밀 인증 절차 대신 샘플 완료. 입력할 비밀 정보 없음.'),
'missioncontrol':('지갑 카드 선택 → 그룹 지정 → 완료','현재 페이지 메모리에만 적용하는 그룹화 예제.'),
'dragdropdone':('자산 목록 → 드래그 또는 위/아래 이동 → 재정렬','키보드/터치 버튼을 보완한 DOM 재구성.')}
items=[{'id':x['id'],'type':'motion-component','status':'reconstructed','preview':'index.html#fm-'+x['id'],'implementationPaths':['motion-library.js','motion-library.css'],'evidencePaths':['motion-source-tokens.json','references/v2-research/motion-source-report.md'],'observedEvidence':x['source'],'behavior':x['descriptionKo'],'limitation':'공개 수치·관찰 기반 DOM/SVG renderer. 원본 앱 또는 원본 Framer 컴포넌트 소스가 아님.'} for x in motion]
items += [{'id':'app-'+name,'type':'private-app-flow','status':'reconstructed','preview':'app-reconstructions.html#'+name,'implementationPaths':['app-reconstructions.html','app-reconstructions.js','app-reconstructions.css'],'evidencePaths':[f'references/v2-source/videos/{name}.mp4',f'references/v2-source/previews/{name}-storyboard.jpg'],'observedEvidence':'원본 앱 영상','behavior':description,'limitation':limitation} for name,(description,limitation) in flows.items()]
items.append({'id':'responsive-layouts','type':'layout','status':'reconstructed','preview':'layout-recipes.html','implementationPaths':['layout-recipes.html'],'evidencePaths':['references/live-desktop.json','references/live-mobile.json','source-coverage.json'],'behavior':'Bento / Split / Phones / Feature grid / Sticky details 다섯 반응형 레시피','limitation':'원본 CSS/관찰값을 적용한 독립 HTML 레이아웃 예제.'})
for item in items:
 for path in item['implementationPaths']+item['evidencePaths']:
  if not (ROOT/path).is_file():raise FileNotFoundError(path)
result={'version':3,'scope':'Public Family landing design + observed nine app films; unavailable private original code replaced explicitly','counts':{'motionComponents':len(motion),'appFlows':len(flows),'layoutRecipes':5},'items':items}
(ROOT/'reconstruction-map.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(f'Reconstruction mapping: {len(motion)} motion components, {len(flows)} app flows, 5 layout recipes')
