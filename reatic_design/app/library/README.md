# @local/reatic-design-system

리틱인더스트리 공개 홈페이지 관찰값으로 재구성한 React 19 컴포넌트 · CSS 토큰 · 모션 프리셋 패키지입니다. 원본 이미지·영상·폰트 파일은 포함하지 않습니다.

```sh
npm install ./reatic-design-system-0.1.0.tgz
```

```jsx
import { Header, Button, TextField, CtaStrip, EnterMotion } from "@local/reatic-design-system";
import "@local/reatic-design-system/styles.css";

export function Page() {
  return (
    <>
      <Header items={[{ href: "/about", label: "리틱인더스트리" }, { href: "/portfolio", label: "포트폴리오" }, { href: "/contact", label: "작업 의뢰" }]} current="/about" />
      <EnterMotion preset="fold" as="h1" className="rt-text rt-text--h3-alt">우리는</EnterMotion>
      <TextField label="먼저, 회사명을 입력해주세요." placeholder="회사명을 입력해주세요." />
      <Button variant="submit" type="submit">제출</Button>
      <CtaStrip href="/contact" />
    </>
  );
}
```

`styles.css`는 `tokens.css` + `motion.css` + `components.css`를 합친 파일입니다. 토큰은 CSS 커스텀 프로퍼티라 소비 앱에서 덮어쓸 수 있습니다.

```css
:root { --rt-color-accent: #ffb000; --rt-radius-pill: 999px; }
[data-rt-theme="dark"] { --rt-color-bg: #000; }
```

한글 서체는 소비 앱에서 Noto Sans KR(300/400/700/900)을 로드해야 원본 인상이 재현됩니다. Work Sans는 Latin 디스플레이용이며 Google Fonts에서 받을 수 있습니다.
