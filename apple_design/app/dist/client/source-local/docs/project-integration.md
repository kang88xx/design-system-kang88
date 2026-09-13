# 프로젝트에 디자인 시스템 사용하기

`@local/source-design-system@0.1.0`은 이 저장소에서 직접 작성한 React 19 컴포넌트 패키지입니다. 브라우저에 배포된 원본을 조사하는 소스 라이브러리와 별도로 사용할 수 있습니다.

## 설치

앱의 **Use in a project** 화면에서 `source-design-system-0.1.0.tgz`를 다운로드한 뒤 대상 프로젝트에서 설치합니다.

```sh
npm install ./source-design-system-0.1.0.tgz
```

대상 앱에 React 19와 React DOM 19가 필요합니다. TypeScript 프로젝트는 일반적인 React 설정에 맞게 React 19 타입을 사용합니다. 라이브러리 자체는 런타임 의존성을 추가하지 않고 React를 peer dependency로 참조합니다.

```jsx
import { Button, TextField, Dialog } from '@local/source-design-system';
import '@local/source-design-system/styles.css';
```

CSS는 앱 진입점에서 한 번 불러옵니다. 패키지의 JavaScript는 ESM이며 컴포넌트 진입점에 `use client`가 포함되어 있습니다. 서버 렌더링은 가능하고 브라우저 전용 효과는 마운트 이후 실행합니다. Next.js 등 프레임워크별 빌드 전체를 검증한 것은 아닙니다.

## 포함 항목

| 컴포넌트 | 주요 계약 |
| --- | --- |
| Button | `variant`, `size`, `disabled`, `loading`; native button/link props와 DOM ref. 기본 `type="button"`; 폼 제출에는 `type="submit"`. |
| TextField | `label`, `hint`, `error`; native input props와 ref. `onChange`는 native React change event. 오류 설명과 label/input id를 자동 연결. |
| Toggle | `checked` 또는 `defaultChecked`, `onChange(boolean)`; `name`, `value`, `required`, `disabled`, id/ref로 native form 참여. |
| SegmentedControl | `options`, `value` 또는 `defaultValue`, `onChange(value)`; disabled option 건너뛰기, 방향키·Home·End. 선택 그룹으로 `radiogroup`을 사용하며 탭 패널 컴포넌트가 아님. |
| Accordion | `items`의 `id`, `title`, `content`, `defaultOpen`; native details/summary. |
| ProductTile | `title`, `subtitle`, `image`, `imageAlt`, `headingLevel`, `ctaLabel`, `secondaryCtaLabel`; 기본 이미지는 장식용 alt이며 의미 있는 사진에는 imageAlt 지정. |
| Carousel | `items`, `autoPlay`, `interval`, `label`, `labels`; 화면 밖·탭 숨김·hover·focus·reduced motion에서는 자동 재생 정지. 빈 items는 렌더링하지 않음. |
| Dialog | controlled `open`, `onOpenChange`, `title`, `description`, `footer`, `initialFocusRef`; native modal, Escape·배경 클릭·닫기 버튼, 포커스 복귀. |

선택 컨트롤과 토글은 controlled 또는 uncontrolled 중 하나를 선택해 사용합니다. Carousel은 기존 호환성을 위해 기본 자동 재생을 유지하므로 프로젝트에서는 의도에 맞게 `autoPlay={false}`를 명시할 수 있습니다. 1초 미만·비정상 interval은 5초로 보정됩니다.

## 폼과 모달 예제

```jsx
import { useState } from 'react';
import { Button, TextField, Dialog } from '@local/source-design-system';

export function Settings() {
  const [name, setName] = useState('My project');
  const [open, setOpen] = useState(false);
  const error = name.trim() ? '' : '이름을 입력하세요.';
  return (
    <>
      <form onSubmit={event => {
        event.preventDefault();
        if (!error) setOpen(true);
      }}>
        <TextField label="프로젝트 이름" name="projectName" required
          value={name} error={error}
          onChange={event => setName(event.target.value)} />
        <Button type="submit">확인</Button>
      </form>
      <Dialog open={open} onOpenChange={setOpen} title="설정 확인">
        {name}
      </Dialog>
    </>
  );
}
```

Dialog의 기본 Escape 동작을 막으려면 native `onCancel`에서 `event.preventDefault()`를 호출합니다. 외부 상태로 `open`을 갱신하는 controlled 컴포넌트이므로 `onOpenChange`에서 부모 상태를 갱신해야 합니다. 구매·인증·저장 API는 소비 프로젝트에서 연결합니다.

## 테마·토큰

기본 폰트는 `system-ui`이며 패키지에 외부 폰트나 브랜드 이미지가 포함되지 않습니다. 다크 테마는 컨테이너에 적용합니다.

```jsx
<section data-ds-theme="dark">...</section>
```

```css
.my-product {
  --apple-blue: #185adb;
  --apple-blue-hover: #1349b5;
  --apple-radius-card: 12px;
  --apple-font-text: system-ui, sans-serif;
}
```

`--apple-*` 이름은 기존 코드 호환성을 위한 로컬 토큰 이름이며 내부 디자인 토큰을 의미하지 않습니다. `tokens.json`이 기준이고 `npm run tokens:build`로 CSS를 생성합니다. `npm run tokens:check`는 불일치를 검출합니다. breakpoint의 CSS 변수는 일반 `@media` 조건에 쓸 수 없으므로 토큰 JSON의 숫자나 명시적인 미디어 쿼리를 사용합니다.

기본 light/dark의 본문·보조 텍스트·오류·링크·버튼 색상 조합은 4.5:1 대비를 검사합니다. 소비 프로젝트의 이미지·색상 재정의·문구 길이는 실제 콘텐츠로 확인해야 합니다. 컴포넌트 CSS는 `.ds-*` 범위에만 적용되며 host 페이지의 body·heading·list reset을 포함하지 않습니다.

## 유지보수·검증

```sh
cd app
npm run tokens:check
npm test
npm run build:library
node scripts/verify-library-browser.mjs
npm run build
npm run test:sites
```

패키지는 `app/library/dist`에서 만들며 `app/public/source-design-system-0.1.0.tgz`로 출력합니다. `build:library` 후 새로운 tgz를 소비 프로젝트에 설치하면 됩니다. 자동 레지스트리 배포는 구성하지 않았습니다. 패키지는 이 저장소 소유자의 로컬 사용을 위한 UNLICENSED 상태이며 제3자 원본의 사용 권한을 부여하는 라이선스를 포함하지 않습니다.

지원·검증 기준은 React 19, 최신 Chromium, 320/390/768/1440px, 키보드, native form, SSR, 독립 소비 앱입니다. native dialog를 지원하지 않는 구형 브라우저용 polyfill은 포함하지 않습니다.
