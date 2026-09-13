# Figma Variables export

이 폴더는 `tokens.css`를 Figma에서 재사용하기 위한 두 가지 JSON을 제공합니다.

- `figma-variables.json`: 컬렉션, 모드, Figma 변수 타입을 명시한 원본
- `tokens-studio.json`: Tokens Studio의 Legacy JSON 형식으로 생성한 가져오기 파일

## Tokens Studio로 가져오기

1. Figma에서 Tokens Studio 플러그인을 엽니다.
2. JSON 보기 또는 가져오기 기능에서 `tokens-studio.json`을 불러옵니다.
3. `primitives`와 `semantic`을 함께 활성화합니다.
4. 반응형 작업에서는 `responsive-desktop` 또는 `responsive-mobile` 중 하나만 활성화합니다.
5. Variables 생성 기능으로 Figma 컬렉션을 만듭니다.

Semantic 토큰은 Primitive 토큰을 별칭으로 참조합니다. 색상과 숫자를 컴포넌트에서 Primitive에 직접 연결하지 말고 Semantic 또는 Responsive 컬렉션을 사용하세요.

## 컬렉션과 모드

| Collection | Modes | Purpose |
|---|---|---|
| Primitives | Base | 색상, 간격, 반경, 타이포, 모션의 원시 값 |
| Semantic | Light | 배경, 텍스트, 액션, 상태 역할 |
| Responsive | Desktop, Mobile | 내비게이션, 여백, 미디어 반경, 제목 크기 |

Figma Variables API가 지원하는 기본 타입은 `BOOLEAN`, `COLOR`, `FLOAT`, `STRING`입니다. `px`, `ms`, `%` 같은 단위는 `figma-variables.json`의 `unit` 필드로 보존하고, Tokens Studio 파일에서는 dimension/duration/number로 변환합니다.

## 다시 생성하기

`figma-variables.json`을 수정한 뒤 다음 명령을 실행합니다.

```bash
node scripts/build-figma-tokens.mjs
```

생성기는 중복 변수, 누락된 모드 값, 지원하지 않는 타입, 깨진 별칭을 검증합니다.

## References

- [Figma Variables Plugin API](https://developers.figma.com/docs/plugins/api/figma-variables/)
- [Tokens Studio token format](https://docs.tokens.studio/manage-settings/token-format)
- [Tokens Studio JSON view](https://docs.tokens.studio/manage-tokens/token-sets/json-view)

이 내보내기는 공개 toss.im 화면을 바탕으로 한 스터디이며 공식 Toss Design System 배포본이 아닙니다.

## 2026-09-07 공개 CSS 스냅샷

`ObservedCSS / Snapshot` 컬렉션에 최신 공개 홈에서 추출한 변수 414개를 추가했습니다. px/ms/숫자는 FLOAT, hex 색상은 COLOR, 복합 CSS·변수 참조는 STRING으로 보존합니다. 기존 137개 스터디 토큰과 의미를 혼동하지 않도록 `observed/` 이름 공간을 사용합니다. 원본의 동적 변수와 모든 component state를 포함하는 공식 TDS 컬렉션은 아닙니다.

`node scripts/build-source-library.mjs`가 관찰 컬렉션을 동기화하고, `node scripts/build-figma-tokens.mjs`가 Tokens Studio 파일을 갱신합니다.
