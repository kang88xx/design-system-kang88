# Montage foundations

## Principles

- Extensibility: 컴포넌트의 확장성을 유지하는 구조
- Consistency: 일관된 사용자 경험
- Efficiency: 일관된 품질로 제품 개발 효율 향상

## Typography

기본 글꼴은 한국어, 영어, 일본어를 지원하는 Pretendard JP입니다. 사이트 전역에는 Wanted Sans 변수도 정의되어 있습니다.

| Style | Size | Line height | Ratio | Letter spacing |
| --- | --- | --- | --- | --- |
| Display 1 | 56px | 72px | 1.286 | -0.0319em |
| Display 2 | 40px | 52px | 1.3 | -0.0282em |
| Display 3 | 36px | 48px | 1.334 | -0.027em |
| Title 1 | 32px | 44px | 1.375 | -0.0253em |
| Title 2 | 28px | 38px | 1.358 | -0.0236em |
| Title 3 | 24px | 32px | 1.334 | -0.023em |
| Heading 1 | 22px | 30px | 1.364 | -0.0194em |
| Heading 2 | 20px | 28px | 1.4 | -0.012em |
| Headline 1 | 18px | 26px | 1.444 | -0.002em |
| Headline 2 | 17px | 26px | 1.412 | 0em |
| Body 1/Normal | 16px | 24px | 1.5 | 0.0057em |
| Body 1/Reading | 16px | 26px | 1.625 | 0.0057em |
| Body 2/Normal | 15px | 22px | 1.467 | 0.0096em |
| Body 2/Reading | 15px | 24px | 1.6 | 0.0096em |
| Label 1/Normal | 14px | 20px | 1.429 | 0.0145em |
| Label 1/Reading | 14px | 22px | 1.571 | 0.0145em |
| Label 2 | 13px | 18px | 1.385 | 0.0194em |
| Caption 1 | 12px | 16px | 1.334 | 0.0252em |
| Caption 2 | 11px | 14px | 1.273 | 0.0311em |

## Grid

- 8px 기반 체계, 권장 간격은 4px 배수
- 시각 보정은 기본 2px, 불가피할 때 1px
- Gutter 20px
- Mobile 2 columns, Tablet 3 columns, Desktop 12 columns

정확한 아트보드와 브레이크포인트 표는 `data/curated/grid.json`에 있습니다.

## Color and elevation

- 136 semantic tokens
- 332 atomic tokens
- elevation/shadow tokens 포함
- 전체 라이트/다크 값은 `data/curated/colors.json`과 `tokens.css`에 있습니다.

## Icons

- 339 reusable 24×24 SVG vectors
- 전체 메타데이터: `data/curated/icon-vectors.json`
- 개별 SVG 파일: `assets/montage/icons/`
- 아이콘은 문서 UI의 공개 이름과 inline SVG에서 추출했으며 `currentColor`를 유지합니다.
