# Sources

- 사이트: https://stripe.com/ (en-US, 2026-09-10, Chromium 1234 / Playwright 1.63, 1440×900 + 390×844)
- 페이지 목록: `data/curated/pages.json` (path, system, title, h1, 스크린샷 경로)
- 스타일시트: `data/raw/crawl-index.json` → `assets/stripe/css/` (파일명 = URL 슬러그)
  - HDS: `b.stripecdn.com/mkt-ssr-statics/assets/_next/static/css/*.css`
  - 레거시: `b.stripecdn.com/mkt-statics-srv/assets/v1-<Component>-<hash>.css`
  - 기타: `docs-statics-srv` (Sail), `stripesessions.com`, `js.stripe.com/v3` (Checkout)
- 폰트: `b.stripecdn.com/mkt-ssr-statics/assets/_next/static/media/Sohne.cb178166.woff2`, `SourceCodePro-Medium.f5ba3e6a.woff2`
- 이미지: `images.stripeassets.com` (Contentful), `b.stripecdn.com/.../media/*`
- 심층 수집 원본: `data/raw/effects/<page>.json`, `_assets-manifest.json`, `component-captures.json`
- 아이콘: `/Volumes/T9/02_Source/Icon_Stripe` (2026-07-15, 58페이지 순회 추출) → `assets/stripe/icons/`

재검증: `node scripts/validate.mjs` 는 라이브 stripe.com의 버튼·헤딩·헤더 computed style을 다시 읽어 `data/curated` 값과 대조하고 결과를 `data/curated/validation.json`에 남긴다.
