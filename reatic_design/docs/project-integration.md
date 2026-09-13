# 프로젝트에 디자인 시스템 사용하기

`@local/reatic-design-system@0.1.0`은 이 저장소에서 직접 작성한 React 19 컴포넌트 · CSS 토큰 · 모션 프리셋 패키지입니다. 원본 조사 자료(`evidence/`, `app/public/source`)와 별도로 사용할 수 있고 원본 이미지·영상·폰트를 포함하지 않습니다.

## 설치

```sh
npm install ./app/public/reatic-design-system-0.1.0.tgz
```

대상 앱에 React 19와 React DOM 19가 필요합니다. 라이브러리는 런타임 의존성을 추가하지 않고 React를 peer dependency로 참조합니다.

```jsx
import { Header, Button, TextField, CtaStrip } from '@local/reatic-design-system';
import '@local/reatic-design-system/styles.css';
```

`styles.css`는 `tokens.css + motion.css + components.css`입니다. 따로 쓰려면 `@local/reatic-design-system/tokens.css` 등으로 개별 import 합니다. JavaScript는 ESM이며 진입점에 `use client`가 있습니다. 서버 렌더링은 가능하고 IntersectionObserver 등 브라우저 API는 마운트 이후에만 실행됩니다.

한글 서체는 소비 앱에서 로드합니다. 원본 인상을 재현하려면 Noto Sans KR 300/400/700/900과 Work Sans 400/600(Google Fonts)을 `<head>`에 추가하세요. Avenir·DIN Next는 Wix 라이선스 폰트라 포함하지 않으며 토큰의 폴백(Nunito Sans, Barlow)이 대신 쓰입니다.

## 포함 항목

| 컴포넌트 | 주요 계약 |
| --- | --- |
| Logo | `inverse`, `size`, `title`. 인라인 SVG 삼각형(polygon 500,245 783,733 217,733 · stroke 32). |
| Header | `items`, `current`, `shadow`, `line`, `logoHref`; 76px, 로고 64, 3열 그리드. `children`은 우측 슬롯. |
| NavMenu | `items[{href,label}]`, `current` → `aria-current="page"`; 항목 141px, 1px 구분선, hover #f3f3f3, 선택 #ff4040(모바일 #926402). |
| Button | `variant: cta \| secondary \| submit`, `href`(링크 렌더), `arrow`, `loading`, `disabled`; native button/anchor props와 ref. 기본 `type="button"`. |
| TextField | `label`, `hint`, `error`, `variant: underline \| box`, `multiline`; native input/textarea props와 ref. label/hint/error id 자동 연결, `aria-invalid`, `role="alert"`. |
| Select | `label`, `options[{value,label,disabled}]`, `placeholder`; native select props와 ref. 2px 테두리, 46px. |
| Checkbox | `label`; native checkbox props와 ref. 13px 사각. |
| Card | `word`, `caption` 또는 `image`, `imageAlt`; r40 `#f3f3f3` 780×440 비율. |
| GalleryTile / Gallery | `href`, `image` 또는 `video`, `alt`, `label`, `loading`; 16:9, 링크면 새 창. `Gallery`는 `items[]`가 비면 렌더링하지 않음. |
| AnchorDots | `targets[{id,label}]`, `current`, `onLight`; 우측 고정, 750px 이하 숨김. |
| ScrollHint | `text`, `up`, `inverse`. |
| CtaStrip | `eyebrow`, `title`, `ctaLabel`, `href`; 470px 검정 스트립. |
| Footer | `text`(줄바꿈 `\n`). |
| EnterMotion / useEnterMotion / useReducedMotion | `preset`, `as`, `threshold`, `once`; 프리셋 목록은 `docs/motion-usage.md`. |

## 폼 예제

```jsx
import { useState } from 'react';
import { TextField, Select, Checkbox, Button } from '@local/reatic-design-system';

export function Brief() {
  const [company, setCompany] = useState('');
  const [sent, setSent] = useState(false);
  const error = company.trim() ? '' : '회사명을 입력해주세요.';
  return (
    <form style={{ background: '#000', padding: 48 }} onSubmit={(e) => { e.preventDefault(); if (!error) setSent(true); }}>
      <TextField label="먼저, 회사명을 입력해주세요." name="company" required value={company} error={company && error}
        placeholder="회사명을 입력해주세요. 회사가 아닌 개인으로 의뢰하실 경우 성함을 입력해주세요." onChange={(e) => setCompany(e.target.value)} />
      <Select label="사용처가 어떻게 되시나요?" name="usage" placeholder="사용처를 선택해주세요" options={[{ value: 'ad', label: '광고' }, { value: 'tv', label: '방송' }]} />
      <Checkbox label="아직 정해진 일정이 없습니다." name="noDue" />
      <Button variant="submit" type="submit" loading={sent}>제출</Button>
    </form>
  );
}
```

폼 전송·이메일 발송은 소비 프로젝트에서 연결합니다. 필드 컴포넌트는 어두운 바탕(`#f3f3f3` 선)을 기본으로 하므로 밝은 바탕에서는 `--rt-color-border-on-strip`과 `--rt-color-text-on-strip`을 재정의합니다(`app/public/reconstruction/contact.html`의 `.q--light` 참고).

## 테마 · 토큰

`tokens.json`이 단일 원본이고 `node app/scripts/generate-tokens.mjs`가 `tokens.css`를 생성합니다(`--check`로 동기화 검사). 다크 테마는 `[data-rt-theme="dark"]` 스코프에 적용합니다. 컴포넌트 CSS는 호스트 문서를 reset하지 않으며 모든 클래스는 `rt-` 접두사를 씁니다.

```css
:root { --rt-color-accent: #ffb000; --rt-layout-content-column: 1080px; }
```

## 검증

```sh
node app/scripts/generate-tokens.mjs --check
node app/scripts/build-library.mjs      # JSX 문법 검사 + tgz 패킹
node --test app/tests/*.test.mjs
node scripts/verify.mjs                 # 브라우저 검증 (스튜디오 · 재구성 · 문서 템플릿)
```
