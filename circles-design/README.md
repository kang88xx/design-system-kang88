# three circles 디자인 시스템 · Edition 01

[프로젝트 적용 가이드](system.html) · [설치·컴포넌트 문서](design-system/README.md) · [전체 카탈로그](index.html) · [Layout recipes](layout-recipes.html) · [전체 명세](DESIGN.md)

실제 프로젝트에는 **[three-circles-project-kit.zip](three-circles-project-kit.zip)**의 `design-system/` 폴더를 복사하거나 **[three-circles-system-1.0.0.tgz](three-circles-system-1.0.0.tgz)**를 로컬 npm 패키지로 설치합니다. 런타임 의존성 없이 CSS 토큰·컴포넌트·JavaScript·TypeScript 선언·실행 예제를 제공합니다.

```sh
npm install ./three-circles-system-1.0.0.tgz
```

- `.tcs` 범위의 스타일, 라이트/다크 테마, 프로젝트별 시맨틱 토큰 재정의, lowercase 타이포 규칙 토글.
- 점선 카드·2px 칩·reveal 버튼·nav 카드·리스트 행·문장형 폼·티커·다크 패널과 버튼·입력·상태·탭·아코디언·대화상자·드롭다운·로딩.
- 키보드 이동, 포커스 복귀, 초기화/정리 API와 React/Vue 연결 예제.
- 폴더 안에서 실행되는 토큰 생성기(`tools/build-tokens.py --check`가 별칭·대비를 검증). 원본 폰트·이미지·사이트 번들은 설치 키트에 포함하지 않습니다.

[three-circles-wbs.framer.website](https://three-circles-wbs.framer.website/)(Webestica의 Framer 템플릿 "three circles")를 1440/900/390px에서 실제 브라우저로 분석해 디자인 자료를 수집했습니다.

- 원본 Framer 색상 토큰 16개(ID 보존), 서체 2종(Bricolage Grotesque·Be Vietnam Pro)의 역할 16종, 3단계 브레이크포인트와 섹션 실측.
- 직접 조작하는 모션 재구성 14종(appear spring, reveal 버튼, featured 1.05 + 프로그레시브 블러, 리스트 행 썸네일, 이미지 스택, 스크롤 연동 nav 카드 확장, nav 이미지 fan, 티커 40px/s, sticky 제목, 상태 점 펄스, 밑줄 입력 포커스, 블로그 제목 hover, 모바일 메뉴, 모션 감소).
- 페이지가 참조하는 이미지 77개 전부(로고 마크, 아이콘 19, 클라이언트 로고 14, nav fan 4, 사진 33, 장식 3)와 SHA-256 매니페스트, 섹션 캡처 12장, nav 확장·hover·모바일 메뉴 캡처, 반응형 레이아웃 레시피 5종.

```sh
python3 scripts/serve.py
```

프로젝트 적용 가이드는 `http://127.0.0.1:40566/system.html`, 전체 카탈로그는 `http://127.0.0.1:40566`에서 엽니다. `index.html`을 직접 열어도 색상·타이포·컴포넌트·모션 데모가 동작합니다. 웹폰트는 Google Fonts에서 로드하며 오프라인에서는 시스템 산세리프로 대체됩니다.

## 수집 범위와 해석

`references/`에는 서빙된 HTML, 세 뷰포트의 전체 페이지 캡처, computed style JSON, hover·sticky·appear 프로브 결과, 에셋 매니페스트가 있습니다. 공개 원페이지 랜딩과 거기서 참조하는 리소스가 대상이며, 프로젝트 상세 페이지(`/project/*`), 블로그 상세, cal.com 예약 흐름은 수집하지 않았습니다.

2차 감사에서 nav 카드 확장이 hover가 아니라 보이는 섹션에 따른 스크롤 상태임을 확인해 수정했고, 티커 속도(40px/s, hover 4px/s)·이미지 fan(약 650ms)·featured 1.05 확대·프로그레시브 블러·상태 점 펄스·모바일 메뉴를 추가 측정했습니다. Framer spring의 정확한 easing은 노출되지 않아 소요 시간만 기록합니다. `tokens.json`의 `evidence` 필드와 DESIGN.md의 근거 등급 표가 각 수치의 신뢰 범위를 표시합니다.

## 재생성

```sh
node scripts/capture-live.cjs          # 3 뷰포트 캡처·computed style·섹션 스크린샷
node scripts/probe-components.cjs      # hover·폼·sticky 프로브
node scripts/probe-details.cjs         # nav 카드·티커·appear 프레임
node scripts/probe-effects.cjs         # 2차 감사: hover 30종·티커·스크롤·모바일·애니메이션
node scripts/probe-effects-2.cjs       # nav 스크롤 상태·fan 타이밍·블러/펄스 소유자
python3 scripts/collect-assets.py      # 참조 이미지 전량 수집 + 매니페스트
python3 scripts/extract-tokens.py      # tokens.json / tokens.css
python3 design-system/tools/build-tokens.py --check
python3 scripts/build-system-guide.py  # system.html
python3 scripts/build-project-kit.py   # ZIP + npm tarball
node scripts/verify-catalog.cjs        # 3 뷰포트 브라우저 검증 → references/review/
```

브라우저 스크립트는 `PLAYWRIGHT_MODULE` 환경변수로 Playwright 설치 경로를 지정할 수 있습니다(기본값은 gstack 번들). 키트 빌드에는 Node.js/npm, 생성·검증 스크립트에는 Python 3.10 이상을 사용합니다.
