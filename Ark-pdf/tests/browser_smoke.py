#!/usr/bin/env python3
"""Behavioral browser tests. Requires Playwright and an installed Chromium."""
import functools,json,os,threading
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'.omx/artifacts/verification';OUT.mkdir(parents=True,exist_ok=True)
EXE=os.environ.get('ARK_CHROMIUM','/home/kang/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome')
checks=[]
def check(ok,label):
    if not ok:raise AssertionError(label)
    checks.append(label)
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=EXE,headless=True,args=['--no-sandbox'])
    ctx=browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True)
    page=ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((ROOT/'index.html').as_uri())
    check(page.locator('.error-banner').count()==0,'Offline file browsing loads without requests')
    base=f'http://127.0.0.1:{server.server_port}/index.html'
    page.goto(base)
    check(page.locator('.error-banner').count()==0,'All local data bundles load')
    routes=['overview','foundation','assets','layouts','components','prompts','source','downloads']
    for width in [1440,1024,768,390,320]:
        page.set_viewport_size({'width':width,'height':900})
        for route in routes:
            page.goto(base+'#'+route);page.wait_for_timeout(30)
            check(page.locator('.panel:visible').count()==1,f'Only active panel at {width}/{route}')
            check(page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),f'No horizontal overflow at {width}/{route}')
            check(page.locator(f'[data-route="{route}"]').get_attribute('aria-current')=='page',f'Current navigation {width}/{route}')
    page.set_viewport_size({'width':1440,'height':1000});page.goto(base+'#assets')
    page.locator('[data-filter="icons"]').click();check(page.locator('.asset-card').count()==16,'Icon filter yields 16 subjects')
    page.locator('#asset-search').fill('gold');check(page.locator('.asset-card').count()==1,'Asset semantic search')
    page.locator('.asset-card').click();check(page.locator('#asset-dialog').is_visible(),'Asset dialog opens')
    check('Gold' in page.locator('#dialog-title').inner_text(),'Dialog identifies selected icon')
    with page.expect_download() as download:page.locator('#dialog-links a').first.click()
    check(download.value.suggested_filename.endswith('.svg'),'SVG download works')
    check(download.value.failure() is None,'SVG download completed')
    page.keyboard.press('Escape');check(not page.locator('#asset-dialog').is_visible(),'Escape closes dialog')
    check(page.evaluate("document.activeElement.classList.contains('asset-card')"),'Focus restored to asset trigger')
    page.locator('#asset-search').fill('no-matching-source-xyz');check(page.locator('#asset-empty').is_visible(),'Empty state visible')
    page.locator('#asset-reset').click();check(page.locator('.asset-card').count()==32,'Reset restores first asset batch')
    page.locator('#asset-more').click();check(page.locator('.asset-card').count()==64,'Load more yields next source batch')
    page.goto(base+'#source');check(page.locator('.source-card').count()==52,'52-page atlas')
    page.locator('#source-search').fill('119.9');check(page.locator('.source-card').count()>=1,'Source search searches full PDF text')
    page.locator('#source-search').fill('');page.locator('#source-category').select_option('divider');check(page.locator('.source-card').count()==8,'8 section dividers classified')
    page.locator('.source-card').first.click();check(page.locator('#dialog-links a[download]').count()==4,'Page exposes SVG/JPG/text/geometry')
    page.keyboard.press('Escape')
    page.goto(base+'#prompts');check('금괴' in page.locator('#prompt-result').input_value(),'Default house-to-gold prompt')
    check('#5C66D4' in page.locator('#prompt-result').input_value(),'Prompt uses canonical sampled gradient')
    page.locator('#prompt-subject').fill('태양광 자산 저장소');page.locator('#prompt-context').fill('에너지 제안서에 사용');page.locator('#prompt-form button[type=submit]').click()
    result=page.locator('#prompt-result').input_value();check('태양광 자산 저장소' in result and '에너지 제안서' in result,'Custom subject and context composed')
    page.locator('#prompt-tone').select_option('mono');check('인쇄용 단색 확장' in page.locator('#prompt-result').input_value(),'Mono is explicit print extension')
    page.locator('#prompt-language').select_option('en');check('TASK\n' in page.locator('#prompt-result').input_value(),'English instructions generated')
    page.locator('#prompt-output').select_option('png');check('transparent PNG' in page.locator('#prompt-result').input_value(),'PNG output instructions generated')
    for family in ['solid','mascot','wireframe','volume','layout','outline']:
        page.locator('#prompt-family').select_option(family)
        check(len(page.locator('#prompt-result').input_value())>500,f'{family} family produces complete prompt')
        check(page.locator('#prompt-tone').is_disabled()==(family not in ['solid','outline']),f'Tone applies to appropriate family {family}')
    with page.expect_download() as download:page.locator('#prompt-download').click()
    check(download.value.suggested_filename=='ark-creation-prompt.txt' and download.value.failure() is None,'Prompt text download works')
    page.locator('#prompt-copy').click();page.wait_for_function("document.getElementById('toast').textContent.includes('복사')");check('복사' in page.locator('#toast').inner_text(),'Clipboard gives feedback')
    page.locator('[data-use-recipe="icon-medical"]').click();check('Medical' in page.locator('#prompt-subject').input_value(),'Recipe applies to workbench')
    page.locator('#prompt-subject').fill('   ');page.locator('#prompt-form button[type=submit]').click();check(page.locator('#prompt-subject').evaluate('(el)=>!el.validity.valid'),'Whitespace-only subject rejected')
    page.goto(base+'#overview');page.locator('#overview-title').click();page.keyboard.press('/');page.wait_for_timeout(100);check(page.locator('#asset-search').evaluate('(el)=>document.activeElement===el'),'Slash shortcut focuses asset search')
    page.goto(base+'#layouts');check(page.locator('.layout-card').count()==10,'Ten editable slide templates displayed')
    with page.expect_download() as download:page.locator('#panel-layouts a[href="templates/ark-proposal.pptx"]').click()
    check(download.value.failure() is None,'PPTX download works')
    for route in ['overview','assets','layouts','prompts','foundation','source']:
        page.goto(base+'#'+route);page.evaluate("document.querySelectorAll('img').forEach(i=>i.loading='eager')");page.wait_for_function("[...document.querySelectorAll('.panel:not([hidden]) img')].every(i=>i.complete && i.naturalWidth>0)");page.wait_for_timeout(100);page.screenshot(path=str(OUT/f'{route}-desktop.png'),full_page=True)
    for route in ['overview','assets','prompts','layouts']:
        page.set_viewport_size({'width':390,'height':844});page.goto(base+'#'+route);page.wait_for_timeout(100);page.screenshot(path=str(OUT/f'{route}-mobile.png'),full_page=True)
    check(not errors,f'No browser exceptions: {errors}')
    report={'passed':len(checks),'checks':checks,'browserErrors':errors,'viewports':[1440,1024,768,390,320],'transport':'file:// load + loopback HTTP interactions/downloads'}
    (OUT/'browser-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(f'PASS: {len(checks)} browser assertions. No browser exceptions.')
    browser.close()
server.shutdown()
