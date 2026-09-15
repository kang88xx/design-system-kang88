# 폰트와 이미지 연결

키트는 원본 이미지·영상·Framer JS를 실행 시 참조하지 않습니다. 따라서 `design-system/`만 복사해도 깨진 자산 요청이 없습니다. 기본 fallback은 Arial Narrow → Arial → sans-serif입니다.

정확한 Inter Tight 글꼴을 적용하려면 추출 저장소의 `design/fonts.css`에서 `font-family: 'Inter Tight'` 선언과 연결된 `assets/fonts/` 파일을 함께 확인하고, 필요한 language subset과 weight만 프로젝트 public/fonts로 복사하세요. 원래 CSS는 상위 `../assets/` 경로를 사용하므로 새 위치에 맞게 src를 고쳐야 합니다. 폰트 파일명을 추측해 넣지 마세요.

```css
/* 아래 src는 소비 프로젝트에서 실제로 복사한 파일 경로로 변경합니다. */
@font-face {
  font-family: 'Inter Tight';
  src: url('/fonts/inter-tight-regular.woff2') format('woff2');
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}
.ods { --ods-font: 'Inter Tight', Arial, sans-serif; }
```

font-weight 500/600은 대응하는 파일 또는 실제 variable font 범위를 선언합니다. font 파일을 변환·수정하지 않아도 됩니다. 원본 파일의 라이선스와 이미지 사용 범위는 실제 적용 프로젝트에서 확인합니다.

썸네일은 `.ods-media-card__media` 안에 `img`를 넣고 `width`, `height`, `alt`를 지정합니다. 첫 화면 외 이미지는 `loading="lazy"`를 사용하세요. 장식 영상은 `muted playsinline`과 대체 정지 이미지를 제공하고, 자동 재생 여부는 사용자의 reduced-motion 설정에 맞추세요. 키트 JS가 원본 영상을 자동 재생하지는 않습니다.


## 명시적으로 요청된 프로모션 예제

`components/media/`에는 요청한 배너 원본 이미지 4장과 Inter600 Latin 폰트가 포함됩니다. `components/blog-cta.html`에는 원본 Inter Tight600 Latin 폰트가 내장되어 있습니다. 기본 `styles.css`는 이 에셋을 자동으로 불러오지 않습니다. 해당 예제를 선택해 사용할 때만 연결됩니다. 원본 관계는 media/manifest.json과 components/README.md를 확인하세요.


## 글자·서비스 예제

`components/service-media/`에는 원본 서비스 이미지4장과 Inter Tight Latin 폰트가 포함됩니다. text-reveal 독립 예제의 글자와 배경은 원본 글자 설정·이미지에 근거하며 해당 HTML/문서에 연결 내역이 있습니다. 기본 시스템 CSS는 이 미디어를 자동 로드하지 않습니다.
