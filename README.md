# design-system-kang88

세션마다 만든 디자인 시스템 뷰어를 한 곳에서 보는 **Design Systems Hub**의 배포 사본입니다.
사이트: https://design.system.kang88.io/ (→ `/All/`). 원본 작업 폴더는 로컬 `02_Source/` 이고, 이 저장소는 `All/deploy/build-site.sh` 가 만든 산출물입니다. 직접 편집하지 말고 원본을 고친 뒤 다시 빌드·푸시하세요.

## 구성
- `All/` — 허브(레지스트리 `systems.js`, 아이콘 브라우저, 문서 뷰어)와 뷰어 공통 셸 규격 `All/shell/`
- `apple_design/`, `google_design/`, `toss_design/`, `wanted_design/`, `family_design/`, `lusion_design/`, `adver_design/`, `reatic_design/`, `stripe_design/`, `opalhaus-design/`, `circles-design/`, `Ark-pdf/` — 각 디자인 시스템 뷰어. 모두 Apple 스튜디오 셸(Studio Shell) 뼈대를 공유합니다.
- `Icon_Stripe/`, `SVG/`, `PNG/` — 아이콘·브랜드 자산 세트

Apple 뷰어(Vite 빌드)의 루트 절대 경로는 배포 사본에서 `/apple_design/app/dist/client/` 접두어로 재작성돼 있습니다.

## 배포에서 제외된 것 (GitHub Pages 한도: 사이트 1GB, 파일 100MB)
원본 증거·대용량 아카이브는 로컬에만 있습니다. 해당 링크는 사이트에서 열리지 않습니다.
- Apple: `app/public/`(dist 중복), `research/runtime-motion/`, `research/inline/`, `research/pages/`, `research/runtime-sources/`, `research/runtime-dom/`, `research/motion-replay.json`
- 50MB 초과 아카이브: Apple `research-source-kit.tar.gz`, Toss `dist/toss-source-kit.zip`, Wanted `assets/montage/source/*.tar.gz`
- Toss: `dist/snippets/` · Wanted: `exports/montage-reference-assets.zip` · Family: `family-design-system.zip`, `references/v3-source/`
- Lusion: `downloads/lusion-source-system-v3/v4.zip`, `sources/readable/`, `sources/assets/` 중 lusion.co 폰트·이미지와 프로젝트 썸네일(`home.webp`)만 포함
- ARK: `downloads/ark-design-system.zip`, `downloads/ark-source-archive.zip`, `source/images/`
- Family·Adver가 화면에서 쓰는 `references/` 하위만 포함, 그 외 모든 `references/`, `evidence/`, `captures/`, `screenshots/`, `backups/`, `test-results/`, `*-private/`, `node_modules/`, `.git/`
- Reatic: `evidence/source/`, `app/public/source/fonts/`(유료 폰트 원본) · Stripe: `data/raw/`(원본 캡처, 문서 예시 키 포함) · `captures/` 중 effects·motion·illustrations·viewer 스크린샷 세트와 pages 전체 화면(접힌 화면 썸네일 `*-fold.png`만 포함)
- Opalhaus: 전체 보관본 `opalhaus-design-system.zip`(265MB), 스톡 영상 `assets/videos/`, 계측 JSON 덤프 `evidence/*.json`, 문서 전용 캡처 `evidence/text-services/`, 150KB 초과 소스 이미지(소스 브라우저 데이터에서만 참조되는 것). 제외된 이미지·영상은 사본에서 원본 CDN URL(framerusercontent.com, videos.pexels.com)로 대체돼 화면에는 그대로 보입니다.
- 허브 미등록 폴더 `logo/`, `design/`, 초안 `reatic-design/`, 루트 ZIP
