# Interaction Inventory

이 문서는 `https://www.reaticindustry.com/` 공개 캡처(4개 페이지, 데스크톱 1440×900 · 모바일 390×844 → Wix 모바일 캔버스 320)에서 관찰된 DOM/CSS/스크린샷 근거와 로컬 재구성 결정을 분리한다. Wix 편집기 내부 데이터, 폼 제출 백엔드, 비공개 자산 접근은 가정하지 않는다.

## Evidence Scope

- 관찰한 파일: `evidence/source/home.html`, `about.html`, `contact.html`, `portfolio.html`, `mobile.html`, `computed-styles.json`, `component-measurements.json`, `static-extraction.json`, `screenshots/*` (전체·첫 화면·섹션 46장·호버 8장).
- 메타데이터: title `리틱인더스트리 | 무에서 유를 창조하는 모션그래픽 프로덕션`, generator `Wix.com Website Builder` (Thunderbolt renderer), `lang="ko"`.
- 관찰된 Wix 컴포넌트 클래스: `wixui-header`, `wixui-dropdown-menu`, `wixui-section`, `wixui-column-strip`, `wixui-rich-text`, `wixui-video-box`, `wixui-button`, `wixui-image`, `wixui-vector-image`, `wixui-vertical-line`, `wixui-horizontal-line`, `wixui-anchor-menu`, `wixui-text-input`, `wixui-text-box`, `wixui-dropdown`, `wixui-date-picker`, `wixui-checkbox`, `wixui-rich-text-box`, `wixui-footer`, Pro Gallery (`data-hook="item-container"`).
- 스크린샷 크기: desktop 1440×900, full 1440×9252 (home) / 10753 (about) / 6232 (contact) / 8310 (portfolio); mobile 320×3464 / 10554 / 2770 등.

## Observed Global Structure

- 모든 페이지: `header#SITE_HEADER` → `section#comp-kj9svnyb`(헤더 스트립, 흰 라디얼 그라디언트 메쉬) → 페이지 섹션 → `footer#SITE_FOOTER`(48px).
- 헤더 76px `position: relative`(비고정). Wix `--shd: 0 1px 4px rgba(0,0,0,.6)` 선언, `--boxShadowToggleOn-shd: none`으로 꺼짐.
- 로컬 재구성: Wix `comp-*` id를 API로 삼지 않고 `Header`, `NavMenu`, `Button`, `TextField`, `Select`, `Checkbox`, `Card`, `GalleryTile`, `Gallery`, `AnchorDots`, `ScrollHint`, `CtaStrip`, `Footer`, `EnterMotion`으로 모델링한다.

## Header And Nav

Observed public values:
- 로고 `img` 64×64 @ (16, 6), alt `리틱인더스트리_로고디자인`, `a[href="/"]`.
- 메뉴 `#comp-kj9sx3ul` 변수: `--fnt: font_8`(Avenir 35 Light 16px/1.4), `--txt: color_15`(#000), `--txth: color_36`(#f3f3f3), `--txts: 255,64,64`(#ff4040), `--sep: color_40`(#8a8a8a), `--pad: 5px`, `--trans: color 0.4s ease 0s`.
- 항목 3개 각 141–142px, x=507/650/792, 좌측 1px 구분선. 텍스트: 리틱인더스트리(/about) · 포트폴리오(/portfolio) · 작업 의뢰(/contact).
- 호버 캡처(`hover-home-nav.png`): 첫 항목 글자가 옅어져 거의 보이지 않음. 현재 페이지는 `#ff4040`(about/contact/portfolio 캡처 확인).
- 모바일: 내비 22px Avenir, 선택 색 `rgb(146,100,2)`(#926402). 헤더 rect 0×0으로 측정(Wix 모바일 메뉴는 접힘 상태).

Local reconstruction:
- `.rt-nav__link` hover `#f3f3f3` 0.4s, `[aria-current="page"]` `#ff4040`, 750px 이하 22px + `#926402`. 키보드 포커스는 원본에 없어 앰버 2px 아웃라인을 추가한다.

## Home Sections

Observed public values (1440):
- 히어로 `video` 1920×800 autoplay muted loop, 섹션 952px.
- "우리는 / 무에서 유를 / 창조해냅니다." 3개 `h2` 42px Noto Sans KR Bold, x=117, 섹션 안쪽 여백 115/96. 진입: `motion-fadeIn 1200ms quad-out + motion-foldIn 1200ms back-out`, delay 1 / 700 / 1400ms.
- 여백 섹션 1521px, 하단 372px 위치에 "계속 스크롤하세요 :)" 15px `#e3e3e3` + 셰브론(16×9, fill #e3e3e3, rotate 180). 진입: fadeIn 1400 sine-in + blurIn 2000 linear(6px).
- 카드 슬라이더 543px: `#f3f3f3` 라운드 카드 2장 노출, "None" Work Sans + 12px 캡션, 우측 셰브론 21×36 버튼.
- 리드 섹션 1164px: 제목 31px, 본문 31/37.2 `#8a8a8a` + 검정 볼드, 중앙 900×450 영상. 안쪽 여백 189/228, x=269.
- 풀블리드 영상 921px ×2, 2단 분할 533(우측 영상 721) / 894(좌측 영상 719), CTA 470 검정, 푸터 48.

Local reconstruction: `app/public/reconstruction/home.html` — 섹션 높이·여백·순서를 토큰(`--rt-section-*`)으로 재현, 영상은 `app/public/media/*.mp4`(720p).

## About Sections

Observed: 히어로 961 중앙 로고 GIF(1920×1080), 흰 섹션 2643(38/100/105px, 세로선 2×416 x=718, 대각선 140×780 ×2), 검정 섹션 6961("여러분은" 100px Noto Sans KR Black + fold-side(rotateY 90°), 보조 버튼 142×40 `#282626` ×2, "끝납니다" 260px, "0회" 16px `#eea302`), 하단 가로선 568×13.
Local: `about.html` — 대각선 두 개는 `revealIn` 세로선 하나로 단순화(원본 대각선 좌표 x=459/831, y=5198 보존).

## Portfolio Sections

Observed: 검정 히어로 961(42px `#414141` + 흰 볼드), 도입 268(56px + Avenir 16), Pro Gallery 컨테이너 x=60 폭 1320, 타일 651×366(16:9), gapX/gapY 20, 27개 관측(스크롤 로드 후 33 이미지), 컨테이너 transition `transform 0.8s cubic-bezier(0.13,0.78,0.53,0.92)`, `itemClick: "link"` / `"nothing"`, 링크 대상 YouTube 5건. 클라이언트 150px 셀 8열(x=122…1318), 제목 26px. 모바일: 타일 321×178 1열 gap 16.
Local: `portfolio.html` — 수집 이미지 25장을 같은 순서로 타일 배치, 처음 5개는 원본과 같이 YouTube 링크. 클라이언트 25개(원본 32개 중 1080² PNG로 확보된 것).

## Contact Form

Observed public values:
- 페이지 배경 `#pageBackground_zg1v8` `position: fixed` 영상(1920×1080), 단일 섹션 6108, 안쪽 여백 312/246.
- 앵커 메뉴 `.wixui-anchor-menu__item` 7개, 11×12, x=1369, y 347부터 32px 간격.
- 회사명 `input` 502×37, 배경 투명, 테두리 없음, 포커스 `box-shadow: 0 2px 0 0 #f3f3f3`, 글자 13px Noto Sans KR DemiLight `#f3f3f3`.
- 사용처 `select` 304×46, `2px solid #f3f3f3`, 14px Noto Sans KR Bold, 패딩 0 48 0 18.
- 레퍼런스 `textarea` 720×106, `2px solid #f3f3f3`, Avenir 15px, 패딩 11.25 10 3 16.
- 날짜 `input` 260×42 (래퍼 하단 2px #f3f3f3), 체크박스 13×13 ×2, 이메일/전화 298×37 ×2.
- 예산 슬라이더: 트랙 702×2 `rgba(243,243,243,.11)` r8, 썸 22×22, 툴팁.
- 기타: 리치텍스트 에디터(툴바 "Normal Text" 등), 제출 `button` 221×40 검정 `2px solid #f3f3f3` r2, 호버 `rgba(243,243,243,.29)` + 테두리 `#eea302`.
- 오류 문구: "누락된 입력란이 있거나 오류가 발생했습니다 :(" / "재시도 하거나 contact@reaticindustry.com 으로 직접 의뢰 부탁드립니다!".

Local reconstruction: `contact.html` — 같은 7블록, 앵커 도트 IntersectionObserver 스파이, 필수값 검사 후 로컬 성공/오류 상태. 실제 전송·이메일 발송은 재현하지 않는다. 리치텍스트 에디터는 textarea로 대체(툴바 미재현).

## Mobile

Observed: Wix 모바일 캔버스 320, 사방 20px, 히어로 문장 34/32px, 제목 31px, 알림 섹션 431px "혹시 지금 모바일로 보고 계신가요? 리틱인더스트리 홈페이지는 PC버전으로 제작되었습니다." 19px.
Local: 750px 이하에서 단일 컬럼, 앵커 도트 숨김, 타이포 clamp 축소. PC 전용 안내는 재현하지 않고 실제 반응형 레이아웃을 제공한다.

## Not Observed / Out Of Scope

- Wix 폼 제출 엔드포인트, 이메일 자동화, 리치텍스트 에디터 내부 상태.
- 슬라이더 자동 전환 시간(관측 시 정지 상태), 갤러리 무한 스크롤 여부.
- 페이지 전환 애니메이션은 CSS 선언(out-in .35s, slide .6s)만 확인, 실제 적용 여부는 라우팅 로그 미수집.
