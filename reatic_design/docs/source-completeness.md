# Source completeness

Scope: reaticindustry.com 공개 페이지 4개(홈 · about · portfolio · contact)와 모바일 UA로 받은 홈 HTML 1개. 2026-09-13 KST 스냅샷이며 Wix 런타임 번들(parastorage)이나 편집기 데이터의 전수 수집이 아니다.

`evidence/completeness.json`이 그룹별 파일 수, 참조 대비 누락, 비고를 기록하고, `evidence/source-index.json`이 인덱스된 모든 파일의 경로·크기·SHA-256을 담는다. 인덱스와 보고서 자신은 해시 목록에서 제외한다.

## 무엇을 확보했나

| 그룹 | 내용 | 확보 |
|---|---|---|
| source-html | 원본 HTML 5 (desktop 4 + mobile 1) | 5 / 5 |
| source-data | computed-styles · component-measurements · static-extraction | 3 |
| source-screenshots | 전체·첫 화면(데스크톱/모바일) 16, 섹션 46, 호버 8, 자산 프리뷰 1 | 67 |
| source-images | HTML이 참조한 static.wixstatic.com 이미지 원본 | 74 / 74 |
| source-fonts | @font-face woff2 (Work Sans, Montserrat, Avenir, DIN Next, Helvetica W01, Proxima Nova, Noto Sans KR 업로드본) | 55 / 55 |
| media-videos | 배경 영상 720p mp4 | 7 / 7 |
| assets | 로고 5, 아이콘 SVG 4, 클라이언트 로고 25, 프리뷰 13 | 47 |

참조 대비 누락 이미지 0, 누락 영상 0(`scripts/build-source-index.mjs` 결과). 영상은 720p만 저장했고 1080p/480p/360p 렌디션은 원본 서버에 있다. 포트폴리오 YouTube 5건은 외부 링크로 남긴다.

## 확보하지 않은 것

- Wix Thunderbolt 런타임 JS/CSS 번들(`static.parastorage.com`). 저장된 HTML에 인라인 테마 CSS와 컴포넌트 마크업이 있어 스타일 값 추출에는 충분했다.
- 폼 제출 백엔드, 리치텍스트 에디터 런타임, Pro Gallery의 무한 스크롤 이후 항목(27개 관측 후 33개 이미지까지 로드 확인).
- 클라이언트 로고 32개 중 7개는 1080² PNG가 아닌 다른 형식·크기로 제공되어 `assets/clients`에는 25개만 들어 있다(원본 파일은 `source/images`에 모두 있음).
- Wix 유료 폰트(Avenir, DIN Next, Helvetica W01, Proxima Nova)는 woff2를 보관하지만 재배포 라이선스가 없어 패키지·문서 템플릿에는 포함하지 않고 Google Fonts 폴백을 지정했다.

## 재수집

```bash
node scripts/capture-source.mjs
node scripts/extract-static.mjs
node scripts/measure-components.mjs
node scripts/download-assets.mjs
node scripts/build-source-index.mjs
```

`capture-source.mjs`는 현재 환경의 Playwright 설치를 `scripts/browser-runtime.mjs`에서 찾는다. 다른 환경에서는 `PLAYWRIGHT_MODULE` 환경변수로 `playwright/index.mjs` 경로를 지정한다. 재수집 시 원본이 바뀌면 계산값·스크린샷이 달라지므로 `evidence/verification.json`과 `design-qa.md`의 수치를 함께 갱신한다.
