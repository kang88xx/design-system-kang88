# @local/source-design-system

Locally authored React 19 components and CSS tokens for the source design system prototype.

Install the packed archive from this repository:

```sh
npm install ./source-design-system-0.1.0.tgz
```

Import the package CSS once near the root of the consuming app:

```js
import "@local/source-design-system/styles.css";
```

Use components from the ESM entry:

```jsx
import React from "react";
import { Button, ProductTile } from "@local/source-design-system";

export function Example() {
  return (
    <main>
      <Button>Continue</Button>
      <ProductTile title="Studio preview" subtitle="Reusable local component" />
    </main>
  );
}
```

Theme tokens are CSS custom properties and can be overridden by the consuming app:

```css
:root {
  --apple-blue: #0057d9;
  --apple-radius-card: 6px;
}
```

This package targets React 19. Captured research files, Apple assets, fonts, screenshots, source manifests, and external Apple APIs remain separate from this reusable package.
