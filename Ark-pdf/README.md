# ARK Document Design System

ARK 회사소개서 **52쪽**을 근거로 만든 제안서·문서 디자인 시스템입니다. 원본 PDF는 수정하지 않았습니다.

## 시작하기

`python3 start.py`로 실행하면 브라우저가 열리고 다운로드까지 사용할 수 있습니다. 별도 빌드·계정·인터넷 연결은 필요하지 않습니다. `index.html`을 직접 열어도 탐색과 프롬프트 구성이 가능합니다. 다만 `file://`에서는 브라우저가 다운로드 대신 파일을 열 수 있어, 자동 다운로드에는 아래 로컬 실행을 권장합니다.

```bash
python3 start.py
```

브라우저에서 `http://localhost:8765`를 엽니다.

- **소스 라이브러리**: 원본 이미지·그래픽과 새 아이콘 검색 → 미리보기 → 형식별 다운로드.
- **문서 템플릿**: 10개 SVG 슬라이드, 편집 가능한 PowerPoint, 4쪽 A4 문서. A4 HTML에서 문구를 직접 편집하고 저장하거나 PDF로 인쇄할 수 있습니다.
- **프롬프트 스튜디오**: 계열·주제·사용 맥락·색상·형식을 입력해 프롬프트를 복사합니다. 참고 SVG를 생성 도구에 함께 첨부하세요. 이 도구는 프롬프트를 조합하며 AI API를 호출하지 않습니다.
- **PDF 원본 탐색**: 52쪽의 미리보기, 페이지 SVG, 텍스트/도형 JSON과 원본 페이지 링크.
- **다운로드**: 전체 시스템, 원본 아카이브, 템플릿, 아이콘 패키지.

## 파일 구성

| 경로 | 내용 |
| --- | --- |
| `DESIGN.md` | 근거, 디자인 결정, 적용 제약 |
| `tokens.json`, `tokens.css` | 출처가 있는 색상과 정규화된 간격·타이포그래피 |
| `data/source-manifest.json` | 모든 추출 자산의 경로, 출처 페이지, 메타데이터 |
| `source/pages/` | 52쪽 전체 SVG. 글자는 외형 보존을 위해 윤곽선 처리 |
| `source/text/` | 페이지별 원문, 텍스트 span, 위치, 크기, 글꼴, 색상 |
| `source/geometry/` | 페이지별 최상위 drawing geometry; Form 내부 벡터는 페이지 SVG 참조 |
| `source/images/` | 중복 제거 이미지 원본 및 브라우저 호환 PNG |
| `source/fonts/` | PDF 내장 글꼴 서브셋 보존본 |
| `source/graphics/` | 원본 로고·아이콘·캐릭터·와이어프레임 등의 선별 영역 |
| `assets/icons/` | 같은 선형 규칙으로 새로 만든 16개 주제. 원본 추출물 아님 |
| `templates/` | 편집 가능한 SVG/PPTX/A4 문서/컴포넌트 시트 |
| `prompts/` | 계열별 가이드와 집→금괴 등의 주제별 레시피 |
| `downloads/` | 배포용 ZIP 패키지 |
| `docs/verification.md` | 실행 검증 결과와 확인 범위 |

## 원본과 확장의 구분

원본 주요 색상은 코발트 `#011187`, 네이비 `#061A58`, 페이퍼 `#F4F4F8`입니다. 서체는 주로 Gotham Book/Medium/Light이며, 기존 페이지에 있던 Pretendard/Geist는 원본 서체가 아닙니다. 현재 웹과 새 템플릿은 시스템 산세리프/한글 대체 글꼴을 사용합니다.

원본 선형 아이콘은 블루 그라데이션이 특징입니다. 새 아이콘에는 원본을 참고한 그라데이션 버전과 인쇄용 단색 버전을 제공합니다. 48×48 / 3-unit 규칙은 원본을 재사용하기 위한 정규화 제안입니다. 원본 아이콘의 정확한 모양은 `source/graphics/`에 보존됩니다.

새 템플릿의 문구와 숫자는 예시입니다. 실무에 사용할 때 고객명, 주장, 지표, 근거, 날짜를 교체하세요. PDF 속 과거 시장 수치는 현재 사실로 검증한 자료가 아닙니다.

PDF는 최종 출력물이므로 Keynote의 편집 그룹, 숨겨진 객체, 편집 이력까지 복원할 수는 없습니다. 일부 선별 SVG/PNG에는 원본 배경이 포함됩니다. `geometry` 레코드 개수는 PDF 내부 모든 객체의 총수가 아닙니다. 더 깊은 Form XObject 벡터는 전체 페이지 SVG에 함께 보존됩니다.

폰트 서브셋은 전체 문자와 상업 사용권을 포함한 설치용 글꼴이 아닙니다. 제3자 로고·사진 또한 새 사용권을 부여하는 패키지가 아닌 출처 보존 자료입니다.

## 재현

최종 사용에는 Python 패키지가 필요 없습니다. 원본 추출을 다시 실행할 때만 Python 환경에 PyMuPDF와 Pillow가 필요합니다. 검증에는 Playwright와 Chromium을 사용했습니다.

```bash
# 추출 도구가 설치된 Python 환경에서 실행
python scripts/extract_pdf.py
python3 scripts/build_tokens.py
python3 scripts/build_templates.py
python3 scripts/build_system.py
python3 tests/validate_system.py
python3 tests/validate_pptx.py templates/ark-proposal.pptx
```

`build_system.py`는 브라우저용 정적 JS 데이터와 ZIP을 재생성합니다. 아이콘/프롬프트 원본은 각 SVG와 JSON/Markdown이며 번들 전에 수정합니다.

## 적용 순서

1. 제안 목적에 맞는 PPTX/SVG/A4 템플릿을 고릅니다.
2. 소스 라이브러리에서 필요한 이미지와 그래픽을 내려받습니다.
3. 새 소재는 같은 그래픽 계열의 참고 소스와 프롬프트를 함께 사용합니다.
4. 24/48/96px 아이콘 가독성, 텍스트 대비, 여백, 데이터 근거를 검수합니다.
5. 최종 PPTX는 사용하는 PowerPoint 환경에서 글꼴 대체와 줄바꿈을 확인합니다.

로컬 원본 HTML/CSS의 작업 전 사본은 `.omx/artifacts/baseline/`에 보존했습니다.
