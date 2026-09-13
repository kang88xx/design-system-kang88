# Toss Design Library

토스 공개 홈에서 수집한 소스 1,558개와 직접 조작하는 모션을 갖춘 디자인 시스템 스터디입니다. 기존 색상·타이포·아이콘·컴포넌트·지구본 예제를 보존하고 소스 탐색·복사·내보내기를 추가했습니다. 공식 TDS 배포판은 아닙니다.

```bash
python3 -m http.server 8120 --bind 127.0.0.1
```

[미리보기](http://127.0.0.1:8120/)에서 9개 범주를 검색하고, 카드를 열어 코드 복사·파일 다운로드·출처 확인을 할 수 있습니다. 키보드 `/`로 검색, 방향키로 범주 전환, Escape로 상세 보기와 메뉴를 닫습니다.

- 원본 모션: 3개 프레임 시퀀스 그룹의 스크럽·재생·속도 조절과 원본 영상 15개.
- 모션 실험실: 스크롤 진행, 순차 등장, 확인 패널, 선택 상태, 아코디언, 처리→완료의 독립 재현 6종. 모션 줄이기 설정과 화면 이탈 시 동작을 처리합니다.
- 소스 키트: [`dist/toss-source-kit.zip`](dist/toss-source-kit.zip). 압축을 풀어 루트에서 정적 서버를 실행합니다. 원본 공개 자료, 토큰, 자산, 1,558개 개별 코드 파일과 검증 스크립트를 포함합니다.
- 단일 HTML: [`dist/toss-design-system.html`](dist/toss-design-system.html). 별도 서버 없이 열 수 있도록 코드·데이터·로컬 미디어를 포함한 큰 파일입니다. 폰트·영상 및 원본 사이트 링크에는 네트워크가 필요합니다.
- 원시 변수: [`dist/toss-observed-tokens.css`](dist/toss-observed-tokens.css), 정리한 토큰: `tokens.css`, Figma용: `figma/tokens-studio.json`.

수집은 2026-09-07 KST에 1440×1000·390×844 화면에서 수행했습니다. 공개 미디어 503개 중 477개를 로컬 스터디 사본으로 보관했습니다. 영상 15개·폰트 10개는 원본 링크로, HTTP 403 이미지 1개는 실패 기록으로 남겼습니다. 원본 자산 권리와 수집 한계, 재수집 절차는 [source-coverage.md](source-coverage.md)를 참고하세요.

`원본 관찰`과 `유사 재현`을 구분합니다. 원본 선택자나 동적 CSS 변수가 필요한 항목은 상세 설명과 코드 주석에 의존성을 표시합니다. 복사한 로컬 미디어 코드는 `assets/source/` 폴더와 함께 사용합니다.

## 검증

```bash
node scripts/test-live-catalog.mjs
node scripts/test-source-library.mjs
node scripts/test-system.mjs
```

브라우저 검증은 위 정적 서버와 기존 Playwright·Chromium 설치가 필요합니다. 다른 서버는 `TEST_URL`로 지정합니다. 데이터 무결성, 자산 SHA-256, 토큰 동기화, 1440/768/390px 레이아웃, 검색·필터·분할 렌더링·키보드·dialog·복사·다운로드·모션 감소·오프라인 자산을 확인합니다. 결과와 화면은 `evidence/qa/`에 저장합니다.

주요 파일은 `DESIGN.md`(설계 기준), `live-catalog.js`/`catalog.css`(탐색기), `source-media.js`/`source-media.css`(원본 모션), `motion-lab.js`/`motion-lab.css`(재현 실험실), `scripts/build-source-library.mjs`(데이터 생성), `scripts/build-package.mjs`(키트·단일 HTML 생성)입니다.
