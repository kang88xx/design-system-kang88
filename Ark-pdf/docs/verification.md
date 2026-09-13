# 검증 범위와 재현

검증일: 2026-09-07. 대상은 로컬 디자인 시스템, PDF 추출 자산, 생성 템플릿입니다.

## 확인된 결과

| 항목 | 결과 |
| --- | --- |
| 원본 PDF | SHA-256 일치, 52쪽 전체 인덱싱 |
| 추출 | 이미지 79개, 폰트 서브셋 16개, 선별 그래픽 29개, 최상위 도형 레코드 1,867개 |
| 원본 보존 | 페이지별 SVG / 텍스트 / 도형 JSON, 이미지 native / 전체 PNG, 원본 출처 경로 존재 |
| 이미지 탐색 성능 | 전체 PNG 약 220MB 보존 + 카드용 max640px 썸네일 약 4.94MB |
| 아이콘 | 16개 주제 × 그라데이션/단색 = 32개 독립형 SVG |
| 브라우저 기능 | 163개 행동 검증 통과, 브라우저 예외 0 |
| 반응형 | 320 / 390 / 768 / 1024 / 1440px에서 8개 화면의 가로 넘침 없음 |
| 실제 기능 | 검색, 필터, 더 보기, 원본 전체 텍스트 검색, 미리보기, Escape/포커스 복원, / 검색 단축키, SVG/PPTX/TXT 다운로드, 프롬프트 입력·계열·색상·언어·형식 전환 확인 |
| A4 문서 | 편집 저장·새로고침 복원, 다른 폴더로 HTML 내보내기와 스타일 유지, PDF 출력 4쪽, A4 크기 확인 |
| 슬라이드 | SVG 10개는 텍스트·벡터 편집 가능. PPTX 10개는 텍스트 런 93개와 네이티브 도형 포함 |
| PPTX 구조 | 관계 경로, 색 매핑, 테마, bold 속성, 비음수 도형 크기, 슬라이드 규격, 고유 shape ID에 대한 별도 검증 통과 |
| 코드 | JavaScript 문법, Python 컴파일, JSON/XML 파싱 확인 |

다운로드 ZIP은 모든 편집 후 `scripts/build_system.py`로 재생성하고, `tests/validate_system.py --archives`로 CRC·SHA-256·내부 파일과 현재 작업 파일의 일치 여부를 검사하는 방식으로 배포합니다. 전체 ZIP 내부의 `data/downloads.json`에는 동봉된 세 하위 ZIP의 체크섬을 기록합니다. ZIP 자체의 최종 체크섬은 자기 파일 안에 넣을 수 없어 작업 폴더의 인벤토리에 별도 기록합니다.

## 재현 명령

```bash
python3 tests/validate_system.py
python3 tests/validate_pptx.py templates/ark-proposal.pptx
node --check app.js

# Playwright가 설치된 Python 환경에서 실행
ARK_CHROMIUM=/path/to/chromium python tests/browser_smoke.py

# 최종 패키지 갱신과 파일 내용 대조
python3 scripts/build_system.py
python3 tests/validate_system.py --archives
```

검증 환경의 브라우저는 headless Chromium이며, 외부 인터넷이 없는 `file://` 열기와 loopback HTTP 실행을 나눠 확인했습니다. 파일을 직접 여는 환경에서는 브라우저가 `download` 속성을 무시할 수 있으므로, 자동 파일 다운로드에는 `python3 start.py` 실행을 사용합니다. 직접 열기에서는 새 탭에서 파일 저장 안내를 제공합니다.

## 근거 파일

- `.omx/artifacts/verification/browser-results.json`
- `.omx/artifacts/verification/a4-results.json`
- `.omx/artifacts/verification/*-desktop.png`, `*-mobile.png`
- `.omx/artifacts/verification/a4-export.pdf`
- `.omx/state/design-system/ralph-progress.json`
- `templates/contact-sheet.png`, `source/graphics-contact-sheet.png`

스크린샷/실행 로그는 작업 폴더의 검증 자료입니다. 배포 ZIP에는 재현 가능한 테스트와 원본·템플릿 컨택시트를 포함합니다.

## 확인하지 못한 범위

Microsoft PowerPoint, Keynote, LibreOffice 자체에서의 실제 렌더링은 이 환경에서 실행하지 못했습니다. PPTX 검증은 OpenXML 패키지와 명시된 구조 규칙에 대한 검증이며, 전체 OOXML XSD 적합성 인증이나 애플리케이션 렌더링 보증은 아닙니다. SVG 미리보기와 PPTX의 글꼴 대체·줄바꿈은 사용 환경에 따라 달라질 수 있습니다.

PDF 내장 서브셋 외의 전체 상용 글꼴, PDF에 없는 편집 레이어·숨겨진 요소는 복원 대상에 포함되지 않습니다. 원본 아이콘의 그라데이션 외형은 추출 SVG에 보존하며, 신규 SVG의 그라데이션 stop은 크롭에서 샘플링한 근삿값입니다. 투명 PNG 일부는 밝은 배경을 제거한 파생본으로 별도 표시합니다.

PPTX 구조 보완은 [Microsoft의 슬라이드 마스터 문서](https://learn.microsoft.com/en-us/office/open-xml/presentation/working-with-slide-masters)와 [공식 Open XML SDK 예제](https://github.com/dotnet/Open-XML-SDK/blob/main/samples/common/PowerPointUtils.cs)를 참고했습니다.
