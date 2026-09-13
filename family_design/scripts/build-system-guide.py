"""Publish the independent starter as a guide in the source catalog."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
page=(ROOT/'design-system/examples/starter.html').read_text()
page=page.replace('href="../','href="design-system/')
page=page.replace('href="starter.css"','href="design-system/examples/starter.css"')
page=page.replace('src="starter.js"','src="design-system/examples/starter.js"')
page=page.replace('<header class="demo-header">','<header class="demo-header"><a class="demo-catalog-link" href="index.html">← 전체 라이브러리</a>',1)
page=page.replace('<div class="demo-features">','<div class="demo-package-links"><a class="fds-button" href="family-project-kit.zip" download>프로젝트 키트 ZIP ↓</a><a class="fds-button" data-variant="secondary" href="family-design-system-1.0.0.tgz" download>npm 설치용 패키지 ↓</a><a class="fds-button" data-variant="ghost" href="design-system/README.md">적용 가이드 ↗</a></div><div class="demo-features">',1)

# ---- Studio shell (Apple 포맷) 적용: ../All/shell/SPEC.md ----
import re, sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
import catalog_v3 as studio_shell

BRAND_STYLE = """<style>
/* Studio shell — system.html 브랜드 매핑. fds 토큰을 --as-* 로 연결해 다크 테마까지 따라간다. */
.as-studio{
 --as-font-display:var(--fds-font-display);--as-font-text:var(--fds-font-body);--as-font-mono:var(--fds-font-mono);
 --as-ink:var(--fds-text);--as-ink-2:var(--fds-text-muted);--as-ink-3:var(--fds-text-muted);
 --as-muted:var(--fds-text-muted);--as-faint:var(--fds-text-subtle);--as-faint-2:var(--fds-text-subtle);
 --as-line:var(--fds-border);--as-line-strong:var(--fds-border);
 --as-accent:var(--fds-primary);--as-accent-hover:var(--fds-primary);--as-accent-active:var(--fds-primary);
 --as-on-accent:var(--fds-on-primary);--as-bg:var(--fds-bg);--as-surface:var(--fds-surface-muted);
 --as-sidebar-bg:var(--fds-bg-muted);--as-nav-hover:var(--fds-surface-muted);
 --as-nav-active-bg:var(--fds-surface-muted);--as-nav-active-ink:var(--fds-text);
 --as-status:var(--fds-success);--as-toast-bg:var(--fds-text);--as-toast-ink:var(--fds-bg);
}
.as-studio .as-brand-badge{border-color:var(--fds-border)}\n/* shell.css의 .as-studio a{color:inherit} 가 기본 버튼 글자색을 덮지 않도록 */\n.as-studio a.fds-button:not([data-variant]){color:var(--fds-on-primary)}
.as-studio .demo-main{max-width:1400px;margin:0 auto;padding:43px 48px 40px}
.as-studio .demo-intro{padding-block:0 48px}
.as-studio .demo-header{max-width:none;margin:0;padding:0;min-height:0;border-bottom:0;justify-content:flex-end;flex-wrap:wrap;gap:16px;font-size:12px}
.as-studio .demo-header .demo-brand{font-size:14px}
.as-studio .as-section-heading h2{font-size:36px;letter-spacing:-1.2px}
.as-studio .demo-footer{margin-top:34px;padding:26px 0;border-top:1px solid var(--as-line)}
.as-studio .as-topbar-tools #theme-toggle{min-block-size:34px;height:34px;padding:0 12px;font-size:11px;font-weight:400;border-radius:var(--as-radius)}
@media(max-width:1200px){.as-studio .demo-main{padding:35px 30px 40px}}
@media(max-width:900px){.as-studio .demo-main{padding:30px 22px 40px}}
@media(max-width:640px){.as-studio .demo-main{padding:29px 20px 40px}.as-studio .demo-intro{grid-template-columns:1fr}}
</style>"""

page = page.replace('<link rel="stylesheet" href="design-system/styles.css">',
                    '<link rel="stylesheet" href="studio-shell.css"><link rel="stylesheet" href="design-system/styles.css">', 1)
page = page.replace('</head>', '<link rel="stylesheet" href="studio-brand.css">' + BRAND_STYLE + '</head>', 1)

header = re.search(r'<header class="demo-header">.*?</header>', page, flags=re.S).group(0)
page = page.replace(header, '', 1)
toggle = re.search(r'<button[^>]*id="theme-toggle"[^>]*>.*?</button>', header, flags=re.S).group(0)
header = header.replace(toggle, '', 1)

page = page.replace('<a class="demo-skip" href="#demo-main">',
                    studio_shell.page_shell_open('system.html', '프로젝트에 적용하기', '#demo-main', toggle)
                    + '<a class="demo-skip" href="#demo-main">', 1)
page = page.replace('<main id="demo-main" class="demo-main">',
                    '<main id="demo-main" tabindex="-1" class="demo-main as-workspace as-page-system">'
                    '<div class="as-section-heading"><div>'
                    '<span class="as-eyebrow">LIBRARY / 02</span><h2>프로젝트에 적용하기</h2></div>'
                    + header + '</div>', 1)
page = page.replace('<footer class="demo-footer">', '<footer class="demo-footer as-studio-footer">', 1)
page = page.replace('</main>', '</main></div>', 1)
page = page.replace('<script type="module" src="design-system/examples/starter.js"></script>',
                    '<div class="as-toast" role="status"></div></div>'
                    '<script src="studio-shell.js"></script>'
                    '<script type="module" src="design-system/examples/starter.js"></script>', 1)

(ROOT/'system.html').write_text(page)
print('Built system.html from independent package starter')
