# Style excerpts from the served HTML

Verbatim declarations from `live-source.html` (2026-09-14). Framer inlines most styles as CSS custom properties on elements.

## Color tokens (published as declared)

```css
--token-0450188b-3ecc-4a39-9edd-7102407eda8f: #1c1b18;   /* ink */
--token-be18f120-c2cd-41d8-8ade-84c674958b3c: #1c1b18b3; /* ink 70% */
--token-1c55fc30-4320-4f32-8f75-56c602e30f91: #675e50;   /* taupe */
--token-d10d7d5c-1c4f-4f9d-802c-1a10cef2fa55: #b7b0a5;   /* stone */
--token-24930864-085b-4c5c-af6f-277c40aa379f: #fffdea;   /* cream */
--token-c4544943-9092-4c7e-9493-6af223e856e1: #fff5d4;   /* vanilla */
--token-2f572e33-78c1-4b19-bc82-6ad0c1be7f4f: #ffe479;   /* butter */
--token-5a2343b2-0b00-4609-afac-848df22f1a83: #fbefc7;   /* sand */
--token-a7f33d28-d966-4dbd-b5d5-6af910b70d60: #fda;      /* peach */
--token-a9e7605e-42b7-40f1-8350-a918b77c9dd3: #f06231;   /* flame */
--token-ec2e7588-845a-476b-8a6d-d0a6fee7bd17: #c5e7ff;   /* sky */
--token-e2b67d50-477c-49ba-bb4f-88e5e41f6eca: #bcf09c;   /* lime */
--token-6c9b9e36-e9be-4eeb-af62-8e866aa96281: #fff;
--token-8170220a-bffe-454a-a96d-383dd13e1f61: #ffffff1a;
--token-5aa2b161-4cfe-483c-983e-a23364520822: #000;
--token-d3ba510f-2e62-4f56-bb1c-c6b2aea5870c: #fff0;
```

## Body text style (most frequent inline declaration)

```css
--framer-font-family: "Be Vietnam Pro", "Be Vietnam Pro Placeholder", sans-serif;
--framer-font-size: 14px;            /* or 16px */
--framer-font-weight: 400;
--framer-letter-spacing: 0em;
--framer-line-height: 1.2em;
--framer-text-transform: lowercase;
--framer-text-color: var(--token-1c55fc30-…, #675e50);
```

## Dashed frame (84 boxes) and divider (27 rows)

```css
--border-bottom-width: 1px; --border-color: var(--token-d10d7d5c-…, rgb(183,176,165));
--border-left-width: 1px; --border-right-width: 1px; --border-style: dashed; --border-top-width: 1px;
/* divider variant */
--border-bottom-width: 1px; --border-left-width: 0px; --border-right-width: 0px; --border-top-width: 0px;
```

## Contact form input

```css
--framer-input-border-style: dashed;
--framer-input-border-bottom-width: 1px;  /* other sides 0 */
--framer-input-border-color: var(--token-d10d7d5c-…, #b7b0a5);
--framer-input-focused-border-color: var(--token-1c55fc30-…, #675e50);
--framer-input-focused-border-width: 0px 0px 1px 0px;
--framer-input-focused-transition: all .45s cubic-bezier(.44,0,.56,1) 0s;
--framer-input-font-size: 16px; --framer-input-padding: 0px;
--framer-input-placeholder-color: var(--token-1c55fc30-…, #675e50);
```

## Footer email input

```css
--framer-input-background: var(--token-8170220a-…, rgba(255,255,255,0.1));
--framer-input-border-color: var(--token-1c55fc30-…, rgb(103,94,80));
--framer-input-border-*-width: 1px; --framer-input-border-radius-*: 6px;
--framer-input-font-color: var(--token-6c9b9e36-…, rgb(255,255,255));
--framer-input-placeholder-color: var(--token-d10d7d5c-…, rgb(183,176,165));
--framer-input-icon-color: rgb(153,153,153);
```

## Transitions (computed)

```css
color 0.3s cubic-bezier(0.44, 0, 0.56, 1);
background 0.45s cubic-bezier(0.44, 0, 0.56, 1), box-shadow 0.45s cubic-bezier(0.44, 0, 0.56, 1);
```

## Appear animation manifest (`__framer__appearAnimationsContent`)

```json
{"24rqjw":{"default":{"initial":{"opacity":0.001,"y":30},
 "animate":{"opacity":1,"y":0,"transition":{"type":"spring","stiffness":80,"damping":30,"mass":1,"delay":0.05}}}}}
```

## Breakpoints (`__framer__breakpoints`)

```json
[{"mediaQuery":"(min-width: 1200px)"},{"mediaQuery":"(min-width: 810px) and (max-width: 1199.98px)"},{"mediaQuery":"(max-width: 809.98px)"}]
```
