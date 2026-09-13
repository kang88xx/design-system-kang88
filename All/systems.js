// Design Systems Hub 레지스트리.
// 새 세션의 디자인 시스템을 추가하려면 아래 배열에 항목을 하나 더 넣으면 됩니다.
// 경로는 이 허브(02_Source/All/)를 기준으로 한 상대 경로입니다.
window.DESIGN_SYSTEMS = [
  {
    slug: "apple",
    name: "Apple Web Design System",
    brand: "Apple",
    origin: "apple.com",
    kind: "web",
    date: "2026-09-07",
    tagline: "공개 코드와 관찰 가능한 동작으로 만든 실행 가능한 Apple 홈페이지 디자인 시스템",
    description:
      "Apple 미국 홈페이지의 공개 코드와 관찰 가능한 동작을 기반으로 만든 로컬 디자인 시스템입니다. 실행 가능한 HTML/CSS/JS와 React 19 컴포넌트 8개, 13개 페이지 소스, 17개 페이지 모션 조사를 제공합니다.",
    palette: ["#1d1d1f", "#f5f5f7", "#0066cc", "#86868b", "#ffffff"],
    accent: "#0066cc",
    folder: "apple_design",
    entry: "../apple_design/app/dist/client/index.html",
    pages: [
      { label: "디자인 시스템 스튜디오", href: "../apple_design/app/dist/client/index.html" },
      { label: "홈페이지 재구성", href: "../apple_design/app/dist/client/homepage.html" },
      { label: "설치·사용", href: "../apple_design/app/dist/client/index.html#start" },
      { label: "소스 라이브러리", href: "../apple_design/app/dist/client/index.html#research-sources" },
      { label: "모션 라이브러리", href: "../apple_design/app/dist/client/index.html#motion" },
      { label: "아이콘 SVG", href: "../apple_design/app/dist/client/index.html#icons" },
      { label: "CSS 도형", href: "../apple_design/app/dist/client/index.html#shapes" },
      { label: "인터랙션 상태", href: "../apple_design/app/dist/client/index.html#interaction-states" },
      { label: "대체 구현", href: "../apple_design/app/dist/client/index.html#reconstructions" }
    ],
    docs: [
      { label: "DESIGN.md", href: "../apple_design/DESIGN.md" },
      { label: "README.md", href: "../apple_design/README.md" },
      { label: "HANDOFF.md", href: "../apple_design/HANDOFF.md" },
      { label: "프로젝트 통합 가이드", href: "../apple_design/docs/project-integration.md" }
    ],
    downloads: [
      { label: "React 패키지 (.tgz)", href: "../apple_design/app/dist/client/source-design-system-0.1.0.tgz" },
      { label: "모션 코드 키트", href: "../apple_design/app/dist/client/motion-code-kit.tar.gz" }
    ],
    stats: ["React 컴포넌트 8", "공개 페이지 13", "모션 조사 17 페이지"]
  },
  {
    slug: "google",
    name: "Google Product Design System Catalog",
    brand: "Google",
    origin: "Gmail · Calendar · Drive · Meet · Finance",
    kind: "docs",
    date: "2026-09-07",
    tagline: "5개 Google 제품 셸을 같은 스키마로 관찰한 카탈로그",
    description:
      "Gmail, Google Calendar, Drive, Meet, Google Finance의 실제 제품 셸을 동일한 스키마로 관찰해 정리했습니다. 개인 텍스트는 저장하지 않고 화면 구조·computed style·컴포넌트 상태·오픈소스 자산 출처만 수집합니다. Material Symbols 81개와 14종 인터랙션 샘플을 포함합니다.",
    palette: ["#0b57d0", "#d3e3fd", "#c2e7ff", "#0b8043", "#f8fafd", "#1f1f1f"],
    accent: "#0b57d0",
    folder: "google_design",
    entry: "../google_design/viewer/index.html",
    pages: [
      { label: "카탈로그 뷰어", href: "../google_design/viewer/index.html" },
      { label: "단일 HTML 아티팩트", href: "../google_design/dist/google-design-artifact.html" }
    ],
    docs: [
      { label: "DESIGN.md", href: "../google_design/DESIGN.md" },
      { label: "README.md", href: "../google_design/README.md" },
      { label: "AGENTS.md", href: "../google_design/AGENTS.md" }
    ],
    downloads: [
      { label: "소스 키트 ZIP", href: "../google_design/viewer/downloads/google-design-source-kit.zip" },
      { label: "tokens.css", href: "../google_design/data/curated/tokens.css" }
    ],
    stats: ["제품 5", "Material Symbols 81", "인터랙션 14"]
  },
  {
    slug: "toss",
    name: "Toss Design Library",
    brand: "Toss",
    origin: "toss.im",
    kind: "web",
    date: "2026-09-07",
    tagline: "소스 1,558개와 직접 조작하는 모션을 갖춘 디자인 시스템 스터디",
    description:
      "토스 공개 홈에서 수집한 소스 1,558개와 직접 조작하는 모션을 갖춘 스터디입니다. 색상·타이포·아이콘·컴포넌트·지구본 예제를 보존하고 9개 범주의 소스 탐색·복사·내보내기, 모션 실험실 6종을 제공합니다.",
    palette: ["#3182f6", "#1b64da", "#e8f3ff", "#191f28", "#4e5968", "#8b95a1"],
    accent: "#3182f6",
    folder: "toss_design",
    entry: "../toss_design/index.html",
    pages: [
      { label: "카탈로그", href: "../toss_design/index.html" },
      { label: "단일 HTML", href: "../toss_design/dist/toss-design-system.html" }
    ],
    docs: [
      { label: "DESIGN.md", href: "../toss_design/DESIGN.md" },
      { label: "README.md", href: "../toss_design/README.md" },
      { label: "소스 수집 범위", href: "../toss_design/source-coverage.md" }
    ],
    downloads: [
      { label: "소스 키트 ZIP", href: "../toss_design/dist/toss-source-kit.zip", unavailable: true },
      { label: "tokens.css", href: "../toss_design/tokens.css" },
      { label: "Figma Tokens Studio JSON", href: "../toss_design/figma/tokens-studio.json" }
    ],
    stats: ["소스 1,558", "범주 9", "모션 실험 6"]
  },
  {
    slug: "wanted",
    name: "Wanted Montage Design System",
    brand: "Wanted",
    origin: "montage.wanted.co.kr",
    kind: "docs",
    date: "2026-09-07",
    tagline: "공개 문서 264페이지를 재검증한 Montage 재사용 디자인 시스템",
    description:
      "Wanted Montage의 공개 화면·문서·자산·구현 코드를 수집한 로컬 디자인 시스템입니다. 컴포넌트 53개, 유틸리티 52개, 플랫폼별 코드 예제 580개, 테마 CSS 변수 472개, SVG 359개를 카탈로그에서 검색하고 라이트/다크로 비교합니다.",
    palette: ["#0066ff", "#3385ff", "#005eeb", "#1b1c1e", "#f7f7f8", "#ffffff"],
    accent: "#0066ff",
    folder: "wanted_design",
    entry: "../wanted_design/viewer/index.html",
    pages: [
      { label: "카탈로그 뷰어", href: "../wanted_design/viewer/index.html" },
      { label: "정적 문서 키트", href: "../wanted_design/viewer/montage-design-kit.html" }
    ],
    docs: [
      { label: "DESIGN.md", href: "../wanted_design/DESIGN.md" },
      { label: "README.md", href: "../wanted_design/README.md" },
      { label: "라이선스 메모", href: "../wanted_design/docs/LICENSE_AND_ATTRIBUTION.md" }
    ],
    downloads: [
      { label: "재사용 패키지 ZIP", href: "../wanted_design/exports/montage-reuse.zip" },
      { label: "tokens.css", href: "../wanted_design/data/curated/tokens.css" }
    ],
    stats: ["컴포넌트 53", "코드 예제 580", "SVG 359"]
  },
  {
    slug: "family",
    name: "Family Design System · Edition 04",
    brand: "Family",
    origin: "family.co",
    kind: "web",
    date: "2026-09-07",
    tagline: "런타임 의존성 없는 CSS 토큰·컴포넌트·모션 라이브러리",
    description:
      "런타임 의존성 없이 CSS 토큰·컴포넌트·JavaScript·TypeScript 선언·실행 예제를 제공합니다. 전체 소스 탐색, 앱 흐름 대체 구현, 레이아웃 레시피, 모션 라이브러리를 갖추고 npm 패키지와 프로젝트 키트로 배포합니다.",
    palette: ["#343433", "#494440", "#848281", "#fbfaf9", "#f2f0ed", "#ffffff"],
    accent: "#343433",
    folder: "family_design",
    entry: "../family_design/index.html",
    pages: [
      { label: "전체 개요", href: "../family_design/index.html" },
      { label: "프로젝트 적용 가이드", href: "../family_design/system.html" },
      { label: "전체 소스 탐색", href: "../family_design/index.html#source-library" },
      { label: "앱 흐름 대체 구현", href: "../family_design/app-reconstructions.html" },
      { label: "레이아웃 레시피", href: "../family_design/layout-recipes.html" }
    ],
    docs: [
      { label: "DESIGN.md", href: "../family_design/DESIGN.md" },
      { label: "README.md", href: "../family_design/README.md" },
      { label: "설치·컴포넌트 문서", href: "../family_design/design-system/README.md" }
    ],
    downloads: [
      { label: "프로젝트 키트 ZIP", href: "../family_design/family-project-kit.zip" },
      { label: "npm 패키지 (.tgz)", href: "../family_design/family-design-system-1.0.0.tgz" }
    ],
    stats: ["Edition 04", "TypeScript 선언", "모션 라이브러리"]
  },
  {
    slug: "adver",
    name: "X Advertising Design System",
    brand: "X Ads",
    origin: "business.x.com",
    kind: "web",
    date: "2026-09-07",
    tagline: "광고 랜딩 페이지의 소스 탐색기와 컴포넌트·모션 키트",
    description:
      "X Advertising 랜딩 페이지를 근거로 만든 소스 탐색기와 디자인 시스템입니다. 히어로·베네핏·캐러셀·FAQ·폼·포맷 등 컴포넌트, 인터랙션 키트, 모션 키트, 스타터 프로젝트를 제공합니다.",
    palette: ["#000000", "#1d9bf0", "#005fcc", "#b42318", "#f2f2f2", "#ffffff"],
    accent: "#1d9bf0",
    folder: "adver_design",
    entry: "../adver_design/index.html",
    pages: [
      { label: "디자인 규칙", href: "../adver_design/index.html" },
      { label: "프로젝트 적용", href: "../adver_design/use.html" },
      { label: "스타터", href: "../adver_design/starter/index.html" },
      { label: "소스 탐색기", href: "../adver_design/sources.html" },
      { label: "전체 페이지", href: "../adver_design/landing.html" },
      { label: "모션 실험실", href: "../adver_design/motion.html" }
    ],
    docs: [
      { label: "DESIGN.md", href: "../adver_design/DESIGN.md" },
      { label: "USAGE.md", href: "../adver_design/USAGE.md" },
      { label: "MOTION.md", href: "../adver_design/MOTION.md" },
      { label: "README.md", href: "../adver_design/README.md" }
    ],
    downloads: [
      { label: "tokens.css", href: "../adver_design/design-system/tokens.css" },
      { label: "tokens.json", href: "../adver_design/design-system/tokens.json" }
    ],
    stats: ["컴포넌트 섹션 7+", "인터랙션 키트", "모션 키트"]
  },
  {
    slug: "lusion",
    name: "Lusion Reference Design System",
    brand: "Lusion",
    origin: "lusion.co",
    kind: "web",
    date: "2026-09-07",
    tagline: "WebGL 스튜디오 사이트의 모션·컴포넌트·영상 분석 패키지",
    description:
      "Lusion의 공개 웹 리소스·화면·제작 설명을 수집한 한국어 디자인 시스템 패키지입니다. 전체 개요, 소스 탐색기, 모델 뷰어, 재구성 스튜디오, 아이콘·박스, 모션 실험실, 영상 분석과 프로젝트 키트 예제를 포함합니다.",
    palette: ["#000000", "#1a2ffb", "#c1ff00", "#ff4c41", "#f0f1fa", "#2b2e3a"],
    accent: "#1a2ffb",
    folder: "lusion_design",
    entry: "../lusion_design/index.html",
    pages: [
      { label: "전체 개요", href: "../lusion_design/index.html" },
      { label: "프로젝트 적용 화면", href: "../lusion_design/project-kit.html" },
      { label: "실제 화면 예제", href: "../lusion_design/kit/examples/index.html" },
      { label: "소스 탐색기", href: "../lusion_design/source-explorer.html" },
      { label: "재구성 스튜디오", href: "../lusion_design/reconstruction.html" },
      { label: "모델 뷰어", href: "../lusion_design/reconstruction.html#models" },
      { label: "아이콘·박스", href: "../lusion_design/components.html" },
      { label: "모션 실험실", href: "../lusion_design/motion-lab.html" },
      { label: "영상 분석", href: "../lusion_design/video-analysis.html" }
    ],
    docs: [
      { label: "DESIGN.md", href: "../lusion_design/DESIGN.md" },
      { label: "README.md", href: "../lusion_design/README.md" }
    ],
    downloads: [
      { label: "프로젝트 디자인 시스템 ZIP", href: "../lusion_design/downloads/project-design-system-1.1.0.zip" },
      { label: "npm 패키지 (.tgz)", href: "../lusion_design/downloads/local-project-design-system-1.1.0.tgz" },
      { label: "소스 시스템 v4 ZIP", href: "../lusion_design/downloads/lusion-source-system-v4.zip", unavailable: true }
    ],
    stats: ["화면 8", "모션 실험실", "영상 분석"]
  },
  {
    slug: "ark",
    name: "ARK Document Design System",
    brand: "ARK",
    origin: "회사소개서 52쪽",
    kind: "proposal",
    date: "2026-09-07",
    tagline: "회사소개서 PDF를 근거로 만든 제안서·문서 디자인 시스템",
    description:
      "ARK 회사소개서 52쪽을 근거로 만든 제안서·문서 디자인 시스템입니다. 소스 라이브러리, SVG 슬라이드 10개·PowerPoint·A4 문서 템플릿, 프롬프트 스튜디오, 52쪽 PDF 원본 탐색과 다운로드 패키지를 제공합니다.",
    palette: ["#011187", "#1a2646", "#5c66d4", "#eec12b", "#f4f4f8", "#ffffff"],
    accent: "#011187",
    folder: "Ark-pdf",
    entry: "../Ark-pdf/index.html",
    pages: [
      { label: "문서 라이브러리", href: "../Ark-pdf/index.html" },
      { label: "A4 제안서 템플릿", href: "../Ark-pdf/templates/proposal-a4.html" },
      { label: "컴포넌트 시트", href: "../Ark-pdf/templates/components.html" }
    ],
    docs: [
      { label: "DESIGN.md", href: "../Ark-pdf/DESIGN.md" },
      { label: "README.md", href: "../Ark-pdf/README.md" },
      { label: "검증 결과", href: "../Ark-pdf/docs/verification.md" }
    ],
    downloads: [
      { label: "전체 시스템 ZIP", href: "../Ark-pdf/downloads/ark-design-system.zip", unavailable: true },
      { label: "템플릿 ZIP", href: "../Ark-pdf/downloads/ark-templates.zip" },
      { label: "아이콘 키트 ZIP", href: "../Ark-pdf/downloads/ark-icon-kit.zip" },
      { label: "PowerPoint 템플릿", href: "../Ark-pdf/templates/ark-proposal.pptx" }
    ],
    stats: ["원본 52쪽", "슬라이드 10", "새 아이콘 16"]
  },
  {
    slug: "stripe-icons",
    name: "Stripe 제품 아이콘 컬렉션",
    brand: "Stripe",
    origin: "stripe.com",
    kind: "icons",
    date: "2026-09-05",
    tagline: "stripe.com 공개 페이지에서 수집한 제품·기능 아이콘 SVG 193개",
    description: "Stripe 공개 페이지에서 수집한 제품·기능 아이콘 SVG입니다. 원본 뷰어에서 검색·복사할 수 있고, 허브 아이콘 브라우저에서 다른 세트와 같은 방식으로 탐색합니다.",
    palette: ["#635bff", "#0a2540", "#f6f9fc", "#5b6b84", "#ffffff"],
    accent: "#635bff",
    folder: "Icon_Stripe",
    entry: "icons.html?set=stripe",
    pages: [
      { label: "아이콘 브라우저", href: "icons.html?set=stripe" },
      { label: "원본 뷰어", href: "../Icon_Stripe/stripe-icons.html" }
    ],
    docs: [],
    downloads: [],
    stats: ["SVG 193"]
  },
  {
    slug: "material-symbols",
    name: "Material Symbols Rounded",
    brand: "Google",
    origin: "google/material-design-icons",
    kind: "icons",
    date: "2026-09-07",
    tagline: "공식 upstream에서 가져온 Material Symbols Rounded SVG 81개",
    description: "Google 공식 upstream의 Material Symbols Rounded SVG입니다. 각 파일의 고정 commit URL, SHA-256, Apache-2.0 라이선스는 google-design의 open-source-manifest.json에 기록되어 있습니다.",
    palette: ["#0b57d0", "#1f1f1f", "#d3e3fd", "#f8fafd", "#ffffff"],
    accent: "#0b57d0",
    folder: "google_design/assets/material-symbols",
    entry: "icons.html?set=material",
    pages: [{ label: "아이콘 브라우저", href: "icons.html?set=material" }],
    docs: [{ label: "출처 매니페스트 (JSON)", href: "../google_design/data/sources/open-source-manifest.json" }],
    downloads: [],
    stats: ["SVG 81", "Apache-2.0"]
  },
  {
    slug: "montage-icons",
    name: "Wanted Montage 아이콘",
    brand: "Wanted",
    origin: "montage.wanted.co.kr",
    kind: "icons",
    date: "2026-09-07",
    tagline: "공개 문서 SVG 339개와 공개 패키지 SVG 20개, 총 359개",
    description: "Wanted Montage 공개 문서의 SVG 339개와 고정 버전 공개 패키지의 SVG 20개입니다. currentColor와 다색 아이콘의 원래 색을 유지합니다. MIT 라이선스.",
    palette: ["#0066ff", "#1b1c1e", "#3385ff", "#f7f7f8", "#ffffff"],
    accent: "#0066ff",
    folder: "wanted_design/assets/montage",
    entry: "icons.html?set=montage",
    pages: [{ label: "아이콘 브라우저", href: "icons.html?set=montage" }],
    docs: [{ label: "라이선스 메모", href: "../wanted_design/docs/LICENSE_AND_ATTRIBUTION.md" }],
    downloads: [],
    stats: ["SVG 359", "MIT"]
  },
  {
    slug: "ark-graphics",
    name: "ARK 아이콘 · 원본 그래픽",
    brand: "ARK",
    origin: "회사소개서 52쪽",
    kind: "icons",
    date: "2026-09-07",
    tagline: "새로 만든 라인 아이콘 16개와 원본에서 선별한 그래픽·일러스트 42개",
    description: "ARK 회사소개서의 선형 규칙으로 새로 만든 주제별 라인 아이콘과, 원본 52쪽에서 선별한 로고·아이콘·캐릭터·와이어프레임 영역입니다.",
    palette: ["#011187", "#1a2646", "#5c66d4", "#eec12b", "#f4f4f8"],
    accent: "#011187",
    folder: "Ark-pdf/assets/icons",
    entry: "icons.html?set=ark-icons",
    pages: [
      { label: "라인 아이콘", href: "icons.html?set=ark-icons" },
      { label: "원본 그래픽·일러스트", href: "icons.html?set=ark-graphics" }
    ],
    docs: [],
    downloads: [{ label: "아이콘 키트 ZIP", href: "../Ark-pdf/downloads/ark-icon-kit.zip" }],
    stats: ["아이콘 16", "그래픽 42"]
  },
  {
    slug: "brand-assets",
    name: "로고 · 브랜드 자산",
    brand: "Kang",
    origin: "SVG · PNG",
    kind: "icons",
    date: "2026-09-08",
    tagline: "개인 로고와 브랜드 SVG/PNG 원본",
    description: "개인 로고와 브랜드 원본 파일입니다. SVG와 PNG 폴더에 파일을 추가하고 build-icons.py를 다시 실행하면 자동으로 반영됩니다.",
    palette: ["#e4002b", "#17171a", "#ffffff", "#8a8a92"],
    accent: "#e4002b",
    folder: "SVG",
    entry: "icons.html?set=brand",
    pages: [{ label: "브랜드 자산", href: "icons.html?set=brand" }],
    docs: [],
    downloads: [],
    stats: ["SVG 2", "PNG 1"]
  }
];
