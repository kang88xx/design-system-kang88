# 검증 결과

2026-09-06 KST. 이 검증은 수집 패키지와 로컬 열람기를 대상으로 하며 원본 웹사이트의 전체 기능/접근성 검증이 아니다.

## 최종 수집

- 공개 HTML 22페이지: 홈·소개·목록 + 프로젝트 상세 19개.
- 유효 공개 에셋 394개, 합계 **160,122,862 bytes (152.70 MiB)**. HTML 페이지와 스크린샷을 제외한 에셋 크기.
- WebP 238개, PNG 17개, JPEG 3개, SVG 18개, MP4 28개, OGG 16개, WOFF/WOFF2 12개. 기타 배포 3D/애니메이션 데이터·EXR·코드·메타데이터 포함.
- 원본 사이트맵 URL `https://lusion.co/sitemap-index.xml`은 HTTP 200이지만 HTML을 반환했다. XML 수집 성공으로 간주하지 않았다. 연결 페이지를 따라가며 경로를 수집했다.
- 초기에 HTML `<base href="/">`를 반영하지 않아 발생한 `/projects/assets/meta/*` 9개 중복/오류 경로와, 셰이더 문자열을 URL로 오인한 경로는 제외했다. collector의 base 처리와 확장자 검증을 수정했다. 잘못 응답한 원문은 `rejected-project-relative-responses/`에 남겨 수집 실패 분석 근거를 보존했다.
- 파일 해시/크기 검사는 [package-checks.json](package-checks.json)을 기준으로 한다. 무결성은 수집 당시의 파일을 증명하며 라이선스/출처 진위 보증과 다르다.

## 브라우저 검증

[자동 검증 결과](catalog-checks.json), [데스크톱](../screenshots/catalog-desktop.png), [모바일](../screenshots/catalog-mobile.png), [모바일 에셋 탐색](../screenshots/catalog-mobile-assets.png).

16개 항목을 통과했다: 프로젝트 19개 표시, 프롬프트 7개 표시, 12개 단위 에셋 페이지, MP4 28개 필터, 경로 검색, 빈 결과, 다음 페이지, 색상 클립보드 복사, 프롬프트 복사, 390px 문서 폭/에셋 구역 overflow 없음, reduced-motion CSS, 자동 영상 재생 없음, file:// 열람, 페이지 JS 오류 없음, 실패한 로컬 응답 없음.

컬러·프롬프트 복사는 실제 클립보드 읽기 결과로 확인했다. 영상은 사용자 재생 컨트롤을 제공하고 `preload=none`을 사용한다. 영상 전체 프레임의 육안 검수는 수행하지 않았다.

## 미디어 검사

[media-metadata.json](media-metadata.json)에 이미지 258개, 영상 28개, 오디오 16개 **총 302개**의 디코딩/메타데이터 확인을 기록했다. 최종 오류 0개. SVG·폰트·EXR·사용자 정의 버퍼는 이 미디어 디코딩 검사의 범위 밖이다.

릴 미리보기의 실제 메타데이터:

| 파일 | 크기 | 재생 시간 | 파일 크기 |
| --- | --- | --- | --- |
| desktop.mp4 | 1920×960 | 약 11.517초 | 4,980,580 bytes |
| mobile.mp4 | 720×960 | 약 11.517초 | 2,267,388 bytes |

이 두 파일은 짧은 루프 미리보기다. 별도 Vimeo 전체 영상의 길이나 해상도를 뜻하지 않는다.

## 원본 캡처 해석

- `home-desktop.png`, `home-mobile.png`: 히어로 장면은 보이나 제목/헤더 등장 애니메이션이 끝나기 전 부분이 있다.
- `home-ready.png`: 두 번째 패스 히어로 캡처. `html.is-ready`는 자산 준비 신호이며 모든 텍스트 애니메이션의 완료를 보증하지 않는다.
- `home-scroll-1~5.png`: 휠 입력 후 연속 상태. 가상 스크롤과 소프트웨어 렌더링 때문에 wheel delta와 실제 화면 이동 거리가 일치하지 않는다.
- `home-full.png`: Playwright fullPage API로 만든 파일이지만 원본의 fixed canvas/virtual scroll 때문에 사이트 전체 장면 캡처를 뜻하지 않는다.
- `_projects.png`, `_projects_porsche_dream_machine.png`: 목록 및 작품 상세 레이아웃 확인.
- `_about.png`, `about-ready.png`: 로더/전환과 About 3D 장면이 포함된 캡처다. 정착한 전체 About 화면이라고 주장하지 않는다.
- `menu-open.png`: 메뉴 DOM click으로 연 뒤 관측한 상태. 자동화의 실제 포인터 클릭 안정성 검사는 타임아웃이 발생했으며, 이 캡처가 키보드·포인터 접근성 통과를 뜻하지 않는다.
- `home-deep-scroll.png`: 이름과 달리 실제 캡처 위치는 릴 구간이다. 터널/푸터 전체의 시각 검증 근거가 아니다. 그 구역은 소스·자산 근거로 설명했다.

## 남은 한계

비공개 소스·DCC 씬·원본 영상 편집 파일·실제 생성형 프롬프트는 확인되지 않았다. 외부 Labs 전체와 클라이언트 사이트, Vimeo 스트림, 모든 뷰포트/브라우저/GPU 상태를 수집하지 않았다. 공식 사이트의 폼 제출·뉴스레터·메일 발송은 실행하지 않았다. `.buf` 파일은 해시와 보존 상태를 확인했으며 모든 바이너리의 의미를 독립적으로 복원하지 않았다.
