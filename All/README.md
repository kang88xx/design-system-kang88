# Design Systems Hub

세션마다 만든 디자인 시스템을 한 곳에서 고르고 바로 여는 개인 사이트입니다.
웹사이트 / 제안서 / 공식문서 / 아이콘·일러스트 소스 네 섹션으로 구성됩니다.

## 실행

```bash
cd "/Volumes/T9/02_Source/All"
python3 serve.py
```

브라우저에서 `http://localhost:4170/All/`이 열립니다. 표준 라이브러리만 사용하며 빌드가 없습니다.
서버는 상위 폴더 `02_Source`를 루트로 서빙하므로 형제 폴더의 디자인 시스템이 그대로 열립니다.
Apple 앱(Vite 빌드)이 요청하는 절대 경로(`/assets`, `/research` 등)는 루트에 없으면
`apple_design/app/dist/client`로 폴백합니다.

## 파일

| 파일 | 역할 |
| --- | --- |
| `index.html` | 허브. 섹션별 카드, 검색·필터, 클릭 시 미리보기 뷰어(화면·문서·다운로드) |
| `systems.js` | 디자인 시스템 레지스트리. **새 세션 결과물은 여기에 항목을 추가** |
| `icons.html` | 아이콘·일러스트 브라우저 (검색, SVG 코드 복사, 다운로드, 다크 타일) |
| `build-icons.py` | 아이콘 폴더를 스캔해 `icons.js` 매니페스트 생성 |
| `doc.html` | DESIGN.md/README.md 등 마크다운 뷰어 |
| `thumbs/` | 카드 썸네일 (`<slug>.jpg` 또는 `<slug>.png`, 없으면 팔레트 그라데이션으로 대체) |
| `shell/` | **Studio Shell 공통 규격** — `SPEC.md`(규격), `shell.css`·`shell.js`(Apple 스튜디오 셸 뼈대), `skeleton.html`(DOM 순서), `inventory.py`·`console-check.sh`(변환 전후 누락·오류 검증) |
| `serve.py` | 로컬 서버 |

## 새 디자인 시스템 추가

1. `02_Source/` 아래에 폴더를 두고, `systems.js` 배열에 항목을 추가합니다.
   `kind`는 `web` / `proposal` / `docs` / `icons` 중 하나입니다. 경로는 `../폴더/파일` 형식이며 공백은 `%20`으로 씁니다.
2. 썸네일은 `thumbs/<slug>.jpg` 또는 `.png`에 저장합니다 (1440×900 캡처를 960px 폭으로 줄인 것 권장. headless chrome이면 `--force-device-scale-factor=0.6667`).
3. 아이콘 세트를 추가할 때는 `build-icons.py`의 `SETS`에 폴더를 넣고 `python3 build-icons.py`를 실행합니다.

## 단축키

- 목록: `/` 검색, 카드 클릭 → 뷰어
- 뷰어: `Esc` 닫기, `←`/`→` 이전·다음 시스템, 상단 768/390 버튼으로 반응형 폭 확인
- 주소 `#slug` 또는 `#slug/2`로 특정 시스템·화면에 바로 진입

## 뷰어 셸 규격 (Studio Shell)

모든 디자인 시스템 뷰어는 Apple 스튜디오와 같은 뼈대를 씁니다. 규격과 구현은 `shell/`에 있고, 각 시스템 폴더에는 `studio-shell.css`·`studio-shell.js`(원본 사본)와 `studio-brand.css`(브랜드 토큰 → `--as-*` 매핑)가 들어 있습니다.

- 새 세션에서 뷰어를 만들 때는 `shell/SPEC.md`와 `shell/skeleton.html`을 따르고, `shell/shell.css`·`shell.js`를 폴더에 복사해 사용합니다.
- `shell/shell.css`·`shell.js`를 고치면 각 폴더의 `studio-shell.*` 사본에도 같은 파일을 복사해 배포합니다 (사본은 수정하지 않는 것이 원칙).
- 변환·수정 뒤에는 `shell/inventory.py`(콘텍츠 누락 검사)와 `shell/console-check.sh`(JS 오류 검사)로 확인합니다.
