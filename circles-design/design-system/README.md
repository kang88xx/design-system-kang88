# three circles System 1.0.0

프로젝트에 가져다 쓰는 CSS 토큰, 컴포넌트 스타일, 네이티브 JavaScript 인터랙션입니다. 외부 런타임 패키지, 원본 폰트 파일, 이미지, 원본 사이트 번들 없이 동작합니다.

## 빠른 시작

### 폴더 복사

`design-system/` 폴더를 프로젝트의 정적 파일 위치로 복사합니다.

```html
<link rel="stylesheet" href="./design-system/styles.css">
<div class="tcs" id="project-ui" data-tcs-theme="light">
  <button class="tcs-button" data-variant="reveal" type="button">book a call</button>
</div>
<script type="module">
  import { initThreeCirclesSystem } from './design-system/index.js';
  const ui = initThreeCirclesSystem(document.querySelector('#project-ui'));
  // 이 화면을 제거하기 직전에 호출합니다.
  // ui.destroy();
</script>
```

CSS만 사용하는 버튼·칩·카드·리스트 행·폼에는 JavaScript 초기화가 필요하지 않습니다. `examples/starter.html`은 실제 컴포넌트를 조합한 스튜디오 랜딩 예제입니다. ES 모듈 예제는 HTTP 서버에서 엽니다.

```sh
cd design-system
python3 -m http.server 8000
# http://127.0.0.1:8000/examples/starter.html
```

### 웹폰트

원본은 Bricolage Grotesque(제목)와 Be Vietnam Pro(본문)를 씁니다. 키트는 이름만 참조하므로 프로젝트에서 직접 로드합니다. 로드하지 않으면 시스템 산세리프로 대체됩니다.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700&family=Be+Vietnam+Pro:wght@400;500;600&family=Anonymous+Pro&display=swap">
```

### 로컬 패키지 설치

```sh
npm install ./three-circles-system-1.0.0.tgz
```

```js
import '@three-circles/system/styles.css';
import { initThreeCirclesSystem } from '@three-circles/system';
const ui = initThreeCirclesSystem(document.querySelector('#project-ui'));
```

패키지 폴더에서 `npm pack`으로 같은 형식의 아카이브를 다시 만들 수 있습니다. 공개 배포는 범위에 없어 `private: true`입니다.

## 컴포넌트 규약

| 구성 | 클래스 / 속성 | 동작·상태 |
| --- | --- | --- |
| 범위·테마 | `.tcs`, `data-tcs-theme="light\|dark"` | 스타일 적용 범위, 기본 라이트. 제목·본문·버튼은 `--tcs-font-transform`(기본 lowercase) |
| 타이포 | `.tcs-hero`, `.tcs-statement`, `.tcs-eyebrow`, `.tcs-mark`, h1–h4 | Bricolage Grotesque 역할. `data-case="none"`으로 소문자 변환 제외 |
| 버튼 | `.tcs-button`, `data-variant`, `data-size` | primary(기본), reveal(원형 hover 노출), accent(butter), secondary, ghost, danger; sm/md/lg |
| 버튼 상태 | `disabled`, `aria-busy="true"` | 로딩 중 행동 방지는 소비자가 disabled도 설정 |
| 칩 | `.tcs-chip`, `data-tone="accent\|pill\|pill-dark"` | 2px 라벨, butter 강조, 100px pill |
| 상태 점 | `.tcs-status-dot` | 초록 점 + 2050ms 펄스 링 2개(모션 감소 시 정지) |
| 입력 | `.tcs-field`, `.tcs-input`, `.tcs-select`, `.tcs-textarea`, `data-style="underline"` | 기본 박스형 / 점선 밑줄형, `aria-invalid`, 도움말·오류 연결 |
| 문장형 폼 | `.tcs-sentence` | 라벨 텍스트와 밑줄 입력이 한 문장으로 흐르는 배치 |
| 카드 | `.tcs-card`, `data-elevated` | 1px 점선 테두리, 6px 라운드, 20px 패딩 |
| 다크 패널 | `.tcs-panel[data-tone="dark"]` | ink 배경 footer/CTA. 내부 입력은 반투명 + 모노 폰트 |
| nav 카드 | `.tcs-nav-card`, `-top`, `-number`, `-body`, `-fan`, `-box`, `-list`, `-path`, `data-tone="soft"`, `data-size="sm"`, `data-open` | 42px butter 행, 번호 배지. **aria-current/data-open일 때만** 설명 확장(원본은 보이는 섹션에 따라 확장, hover 아님). hover는 이미지 fan만 움직임. `sm`은 모바일 172×28 변형 |
| 스크롤스파이 | `[data-tcs-scrollspy]` 안의 `a[href="#id"]` | 보이는 섹션의 링크에 `aria-current="true"`, `tcs:sectionchange` 이벤트. rootMargin은 속성값으로 조정 |
| 메뉴 버튼·스크림 | `.tcs-menu-button > i i`, `aria-expanded`, `.tcs-scrim` | 20×2 두 줄 → X(±45°), ink 70% 오버레이 |
| 미디어 hover | `.tcs-media-hover > img` | 잘린 프레임 안에서 1.05 확대 |
| 프로그레시브 블러 | `.tcs-progressive-blur > i×8`, `--tcs-blur-height` | 8겹 backdrop blur(0.78→100px) + 12.5% 밴드 마스크 |
| 소셜 | `.tcs-social > a > img` | hover 시 opacity .7 |
| 리스트 행 | `.tcs-list-row`, `-title`, `-thumb`, `-meta`, `-end` | 점선 구분, hover 시 썸네일 1→90px |
| 티커 | `.tcs-ticker > .tcs-ticker-track`, `--tcs-ticker-duration` | 원본 40px/s(트랙폭/40 = 약 59s), gap 60. hover/`data-paused`/모션 감소 시 정지(원본은 hover 시 1/10 속도) |
| 등장 | `.tcs-appear` | 30px fade-up(1.2s). 모션 감소 시 없음 |
| 배치 | `.tcs-stack`, `.tcs-cluster`, `.tcs-grid` | 내용·간격·반응형 배치 |
| 상태 | `.tcs-badge`, `.tcs-alert`, `data-tone` | neutral/success/warning/danger |
| 로딩 | `.tcs-skeleton`, `.tcs-spinner` | 모션 감소 반영 |
| 탭 | `[data-tcs-tabs]`, tablist/tab/tabpanel | 화살표·Home/End 이동, Enter/Space 활성화 |
| 아코디언 | `[data-tcs-accordion]`, details/summary | `data-exclusive="true"`일 때 한 항목만 열기 |
| 대화상자 | `.tcs-dialog`, 네이티브 dialog | 열기·닫기·Escape·포커스 복귀 |
| 드롭다운 | `[data-tcs-dropdown]` | 클릭·Escape·영역 밖 클릭·포커스 이탈 닫기 |

### 리스트 행

```html
<a class="tcs-list-row" href="/project/art-by-liora">
  <span class="tcs-list-row-title">art by liora</span>
  <span class="tcs-list-row-thumb"><img src="thumb.jpg" alt=""></span>
  <span class="tcs-list-row-meta">portfolio website, artist</span>
  <span class="tcs-list-row-end">2024</span>
</a>
```

### 문장형 폼

```html
<form class="tcs-card tcs-stack">
  <p class="tcs-sentence">my name is
    <input class="tcs-input" data-style="underline" name="name" aria-label="name" required>
    , my email address is
    <input class="tcs-input" data-style="underline" type="email" name="email" aria-label="email" required>
  </p>
  <button class="tcs-button" data-variant="reveal" type="submit">send a message</button>
</form>
```

실제 폼 제출·비즈니스 검증·저장은 소비 프로젝트가 담당합니다.

### 탭·대화상자

탭은 `[data-tcs-tabs]` 안의 `role="tab"` 버튼과 `aria-controls`로 연결한 패널을 사용합니다. 대화상자는 `data-tcs-dialog-open="id"` 버튼과 `.tcs-dialog` 네이티브 dialog를 같은 초기화 root 안에 둡니다. 세부 규약은 Family 키트와 동일한 API이며, 이벤트 이름만 `tcs:tabchange`, `tcs:dialogchange`입니다.

## 테마와 토큰

`tokens.json`이 기준이고 `tokens.css`는 생성 결과입니다. 원본 16개 색상은 `--tcs-source-color-*`로 보존하고, 텍스트·상태·포커스 대비를 위해 조정한 시맨틱 색상은 `--tcs-*` 역할로 구분합니다.

```css
.my-project.tcs {
  --tcs-accent: #d9481c;
  --tcs-font-transform: none;   /* 소문자 규칙 해제 */
}
```

```sh
cd design-system
python3 tools/build-tokens.py          # tokens.json 수정 후 CSS 갱신
python3 tools/build-tokens.py --check  # 생성 상태·별칭·대비 검증
```

## React / Vue

DOM 수명 주기를 연결하는 패턴만 제공합니다. 마운트 후 `initThreeCirclesSystem(root)`를 호출하고 언마운트 전에 `destroy()`를 호출합니다. 모듈 import는 DOM에 접근하지 않으므로 서버 환경에서도 안전합니다.

```tsx
useEffect(() => { const ui = initThreeCirclesSystem(root.current!); return () => ui.destroy(); }, []);
```

## 검증 범위

`scripts/verify-catalog.cjs`가 카탈로그·적용 가이드·이 예제를 라이트/다크, 키보드, 탭·대화상자 동작, 320/390/768/1440px 배치를 실제 Chromium에서 검사합니다. 결과 캡처는 `references/review/`에 있습니다. 접근성 검사는 점검한 항목의 증거이며 모든 제품 흐름의 인증을 의미하지 않습니다.
