/* Requires an existing Playwright installation, not a project dependency. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const root = path.resolve(__dirname, '..');
const kit = fs.readFileSync(path.join(root, 'design-system/interaction-kit.js'), 'utf8');

const sampleHtml = `
  <main id="fixture">
    <section class="ri-sample" data-ri="buttons" aria-labelledby="shared-title">
      <h2 id="shared-title">Buttons</h2>
      <button type="button" data-ri-button-action aria-busy="false">Confirm <span class="ri-button-arrow" aria-hidden="true">-&gt;</span></button>
      <p data-ri-button-status role="status"></p>
    </section>
    <section class="ri-sample" data-ri="tabs" aria-labelledby="shared-title">
      <h2 id="shared-title">Tabs</h2>
      <div role="tablist" aria-label="Steps">
        <button id="shared-tab" role="tab" aria-controls="shared-panel" aria-selected="true" data-title="One">One</button>
        <button id="shared-tab" role="tab" aria-controls="shared-panel" aria-selected="false" data-title="Two">Two</button>
        <button id="shared-tab" role="tab" aria-controls="shared-panel" aria-selected="false" data-title="Three">Three</button>
        <button id="shared-tab" role="tab" aria-controls="shared-panel" aria-selected="false" data-title="Four">Four</button>
        <span data-ri-tabs-indicator></span>
      </div>
      <div id="shared-panel" role="tabpanel" aria-labelledby="shared-tab">
        <h3 data-ri-panel-title>One</h3>
        <p data-ri-panel-copy></p>
        <p data-ri-panel-kicker></p>
      </div>
    </section>
    <section class="ri-sample" data-ri="carousel" aria-labelledby="carousel-title">
      <h2 id="carousel-title">Carousel</h2>
      <div data-ri-carousel-viewport>
        <div data-ri-carousel-track>
          <figure data-ri-slide><a id="slide-link" href="#outside-target">First link</a></figure>
          <figure data-ri-slide><button type="button">Hidden button</button></figure>
          <figure data-ri-slide><input value="Hidden input"></figure>
        </div>
      </div>
      <button type="button" data-ri-prev aria-label="Previous">Previous</button>
      <button type="button" data-ri-next aria-label="Next">Next</button>
      <button type="button" data-ri-autoplay aria-pressed="false">Autoplay</button>
      <div role="tablist" aria-label="Slides">
        <button type="button" data-ri-dot role="tab" aria-label="1" aria-selected="true"></button>
        <button type="button" data-ri-dot role="tab" aria-label="2" aria-selected="false"></button>
        <button type="button" data-ri-dot role="tab" aria-label="3" aria-selected="false"></button>
      </div>
      <p data-ri-carousel-status aria-live="polite"></p>
    </section>
    <section class="ri-sample" data-ri="form" aria-labelledby="form-title">
      <h2 id="form-title">Form</h2>
      <form novalidate>
        <label for="name:field">Name</label>
        <input id="name:field" name="name" data-ri-required aria-describedby="hint:id error.id">
        <span id="hint:id">Hint</span>
        <span id="error.id"></span>
        <label for="email[field]">Email</label>
        <input id="email[field]" name="email" type="email" data-ri-required aria-describedby="email-hint email.error">
        <span id="email-hint">Email hint</span>
        <span id="email.error"></span>
        <button type="submit" aria-busy="false">Submit</button>
        <button type="reset">Reset</button>
        <p data-ri-form-status role="status"></p>
      </form>
    </section>
    <section class="ri-sample" data-ri="faq" aria-labelledby="faq-title">
      <h2 id="faq-title">FAQ</h2>
      <button type="button" data-ri-faq-button aria-expanded="false" aria-controls="faq.panel">Question</button>
      <div id="faq.panel"><button type="button">Panel action</button></div>
    </section>
    <section class="ri-sample" data-ri="theme" data-ri-storage-key="verify-theme" aria-labelledby="theme-title">
      <h2 id="theme-title">Theme</h2>
      <button type="button" data-ri-theme-choice="system" aria-pressed="true">System</button>
      <button type="button" data-ri-theme-choice="light" aria-pressed="false">Light</button>
      <button type="button" data-ri-theme-choice="dark" aria-pressed="false">Dark</button>
      <p data-ri-theme-status aria-live="polite"></p>
    </section>
    <section class="ri-sample" data-ri="navigation" aria-labelledby="nav-title">
      <h2 id="nav-title">Navigation</h2>
      <button type="button" data-ri-nav-toggle aria-expanded="false" aria-controls="nav-menu">Menu</button>
      <nav id="nav-menu" data-ri-nav-menu data-open="false">
        <button type="button" data-ri-nav-category aria-expanded="true" aria-controls="nav-sub">Section</button>
        <ul id="nav-sub">
          <li><a href="#nav-section" data-ri-nav-link data-title="Nav">Nav</a></li>
        </ul>
      </nav>
      <h3 data-ri-nav-title></h3>
      <p data-ri-nav-copy></p>
      <div data-ri-nav-preview>
        <section id="nav-section" data-ri-nav-section></section>
      </div>
    </section>
    <div id="outside-target"></div>
  </main>
`;

const css = fs.readFileSync(path.join(root, 'design-system/interaction-kit.css'), 'utf8');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${sampleHtml}<script>${kit}</script></body></html>`;

const checks = [];
const check = (name) => {
  checks.push(name);
  console.log('PASS', name);
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setContent(html, { waitUntil: 'load' });

  assert.equal(await page.locator('[data-ri]').count(), 7);
  check('all 7 interaction demos are present in the runtime fixture');

  await page.evaluate(() => window.ReferenceInteractions.mount(document));
  let ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id));
  assert.equal(new Set(ids).size, ids.length, 'initial mount produces unique IDs');
  const refsResolve = await page.evaluate(() => Array.from(document.querySelectorAll('[aria-controls],[aria-labelledby],[aria-describedby],[aria-owns],label[for],a[href^="#"]')).every(node => {
    const attr = node.hasAttribute('for') ? 'for' : node.hasAttribute('href') ? 'href' : ['aria-controls', 'aria-labelledby', 'aria-describedby', 'aria-owns'].find(name => node.hasAttribute(name));
    const raw = node.getAttribute(attr);
    const tokens = attr === 'href' ? [raw.slice(1)] : raw.split(/\s+/).filter(Boolean);
    return tokens.every(token => document.getElementById(token));
  }));
  assert.equal(refsResolve, true, 'all ID reference tokens resolve after remap');
  check('mount remaps IDs plus aria, label[for], and href references');

  await page.evaluate(() => {
    const mounted = document.querySelector('[data-ri="tabs"]');
    const clone = mounted.cloneNode(true);
    document.querySelector('#fixture').appendChild(clone);
    window.ReferenceInteractions.mount(clone);
  });
  ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id));
  assert.equal(new Set(ids).size, ids.length, 'mounted clone receives a fresh ID namespace');
  check('cloned mounted samples receive unique IDs when mounted again');

  const cleanupResult = await page.evaluate(() => {
    const root = document.createElement('div');
    root.innerHTML = `<section data-ri="faq"><button type="button" data-ri-faq-button aria-expanded="false" aria-controls="nested-panel">Nested</button><div id="nested-panel">Nested panel</div></section>`;
    document.body.appendChild(root);
    const sample = root.querySelector('[data-ri]');
    const childClean = window.ReferenceInteractions.mount(sample);
    const parentClean = window.ReferenceInteractions.mount(root);
    childClean();
    sample.querySelector('[data-ri-faq-button]').click();
    const liveAfterChildCleanup = sample.querySelector('[data-ri-faq-button]').getAttribute('aria-expanded') === 'false';
    parentClean();
    sample.querySelector('[data-ri-faq-button]').click();
    const deadAfterParentCleanup = sample.querySelector('[data-ri-faq-button]').getAttribute('aria-expanded') === 'false';
    parentClean();
    childClean();
    const remountClean = window.ReferenceInteractions.mount(root);
    sample.querySelector('[data-ri-faq-button]').click();
    const liveAfterRemount = sample.querySelector('[data-ri-faq-button]').getAttribute('aria-expanded') === 'false';
    remountClean();
    root.remove();
    return { liveAfterChildCleanup, deadAfterParentCleanup, liveAfterRemount };
  });
  assert.deepEqual(cleanupResult, { liveAfterChildCleanup: true, deadAfterParentCleanup: true, liveAfterRemount: true });
  const sameRootResult = await page.evaluate(() => {
    const root = document.createElement('div');
    root.innerHTML = `<section data-ri="faq"><button type="button" data-ri-faq-button aria-expanded="false" aria-controls="same-panel">Same</button><div id="same-panel">Same panel</div></section>`;
    document.body.appendChild(root);
    const cleanA = window.ReferenceInteractions.mount(root);
    const cleanB = window.ReferenceInteractions.mount(root);
    const sameCleanup = cleanA === cleanB;
    cleanA();
    cleanB();
    const cleanC = window.ReferenceInteractions.mount(root);
    root.querySelector('[data-ri-faq-button]').click();
    const remounted = root.querySelector('[data-ri-faq-button]').getAttribute('aria-expanded') === 'false';
    cleanC();
    root.remove();
    return { sameCleanup, remounted };
  });
  assert.deepEqual(sameRootResult, { sameCleanup: true, remounted: true });
  check('root cleanup is idempotent, remountable, and reference-counted for nested roots');

  for (const width of [720, 480, 360, 320]) {
    const island = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    island.on('pageerror', error => errors.push(error.message));
    await island.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style><style>body{margin:0}.adver-system{width:${width}px;margin:0 auto;border:1px solid transparent}</style></head><body><div class="adver-system">${sampleHtml}</div><script>${kit}</script></body></html>`, { waitUntil: 'load' });
    await island.evaluate(() => window.ReferenceInteractions.mount(document));
    await island.locator('[data-ri="navigation"] [data-ri-nav-toggle]').click();
    await island.waitForTimeout(260);
    const islandOverflow = await island.evaluate(() => Array.from(document.querySelectorAll('[data-ri]')).map((sample) => {
      const islandRoot = sample.closest('.adver-system');
      const sampleBox = sample.getBoundingClientRect();
      const islandBox = islandRoot.getBoundingClientRect();
      const overflowing = sample.scrollWidth > Math.ceil(sample.clientWidth) || sampleBox.right > islandBox.right + 1 || sampleBox.left < islandBox.left - 1;
      const offenders = Array.from(sample.querySelectorAll('*')).filter((node) => {
        const box = node.getBoundingClientRect();
        return box.width > 0 && (box.right > islandBox.right + 1 || box.left < islandBox.left - 1);
      }).slice(0, 5).map((node) => node.className || node.dataset.ri || node.tagName.toLowerCase());
      return {
        type: sample.dataset.ri,
        width: islandRoot.clientWidth,
        sampleScrollWidth: sample.scrollWidth,
        sampleClientWidth: sample.clientWidth,
        overflowing,
        offenders
      };
    }));
    const bad = islandOverflow.filter(result => result.overflowing);
    assert.deepEqual(bad, [], `narrow ${width}px island overflow: ${JSON.stringify(bad)}`);
    await island.close();
  }
  check('all 7 RI samples fit inside 720/480/360/320px islands at wide viewport');

  const carousel = page.locator('[data-ri="carousel"]');
  const carouselAlignment = await carousel.locator('[data-ri-slide]').first().evaluate((slide) => {
    const viewport = slide.closest('[data-ri-carousel-viewport]').getBoundingClientRect();
    const box = slide.getBoundingClientRect();
    return {
      margin: getComputedStyle(slide).margin,
      delta: Math.abs(box.left - viewport.left),
      widthDelta: Math.abs(box.width - viewport.width)
    };
  });
  assert.equal(carouselAlignment.margin, '0px');
  assert(carouselAlignment.delta < 1, `active slide should align with viewport left; got ${carouselAlignment.delta}`);
  assert(carouselAlignment.widthDelta < 1, `active slide should match viewport width; got ${carouselAlignment.widthDelta}`);
  assert.equal(await carousel.locator('[data-ri-slide]').nth(1).getAttribute('inert'), '');
  assert.equal(await carousel.locator('[data-ri-slide]').nth(1).locator('button').getAttribute('tabindex'), '-1');
  await carousel.locator('[data-ri-next]').press('Enter');
  assert.equal(await carousel.locator('[data-ri-carousel-status]').innerText(), '2 / 3');
  assert.equal(await carousel.locator('[data-ri-slide]').first().getAttribute('inert'), '');
  assert.equal(await carousel.locator('[data-ri-slide]').nth(1).locator('button').getAttribute('tabindex'), null);
  await carousel.locator('[data-ri-prev]').press('Space');
  assert.equal(await carousel.locator('[data-ri-carousel-status]').innerText(), '1 / 3');
  check('carousel neutralizes UA figure margin and keeps inactive slide focus targets inert');

  const tabsIndicatorResult = await page.evaluate(async () => {
    const sample = document.querySelector('[data-ri="tabs"]');
    const wrapper = document.createElement('div');
    wrapper.style.width = '620px';
    sample.parentNode.insertBefore(wrapper, sample);
    wrapper.appendChild(sample);
    const last = sample.querySelectorAll('[role="tab"]')[3];
    last.click();
    const measure = () => {
      const list = sample.querySelector('[role="tablist"]').getBoundingClientRect();
      const indicator = sample.querySelector('[data-ri-tabs-indicator]').getBoundingClientRect();
      const active = sample.querySelector('[role="tab"][aria-selected="true"]').getBoundingClientRect();
      return {
        withinList: indicator.left >= list.left - 1 && indicator.right <= list.right + 1,
        underActive: Math.abs(indicator.left - active.left) < 1 && Math.abs(indicator.width - active.width) < 1 && Math.abs(indicator.bottom - active.bottom) < 2,
        transitionDisabled: sample.querySelector('[data-ri-tabs-indicator]').hasAttribute('data-ri-no-transition')
      };
    };
    await new Promise(resolve => setTimeout(resolve, 260));
    const wide = measure();
    await window.ReferenceInteractions.setSpeed(1);
    wrapper.style.width = '375px';
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => requestAnimationFrame(resolve));
    const narrow = measure();
    wrapper.style.width = '100%';
    return { wide, narrow };
  });
  assert.equal(tabsIndicatorResult.wide.withinList, true);
  assert.equal(tabsIndicatorResult.wide.underActive, true);
  assert.equal(tabsIndicatorResult.narrow.withinList, true);
  assert.equal(tabsIndicatorResult.narrow.underActive, true);
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 800 });
    await page.evaluate(() => {
      const sample = document.querySelector('[data-ri="tabs"]');
      sample.querySelectorAll('[role="tab"]')[3].click();
    });
    await page.waitForTimeout(260);
    const viewportIndicator = await page.evaluate(() => {
      const sample = document.querySelector('[data-ri="tabs"]');
      const list = sample.querySelector('[role="tablist"]').getBoundingClientRect();
      const indicator = sample.querySelector('[data-ri-tabs-indicator]').getBoundingClientRect();
      const active = sample.querySelector('[role="tab"][aria-selected="true"]').getBoundingClientRect();
      return {
        docWidth: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
        withinList: indicator.left >= list.left - 1 && indicator.right <= list.right + 1,
        underActive: Math.abs(indicator.left - active.left) < 1 && Math.abs(indicator.width - active.width) < 1 && Math.abs(indicator.bottom - active.bottom) < 2
      };
    });
    assert(viewportIndicator.docWidth <= viewportIndicator.viewport, `tabs caused document overflow at ${width}`);
    assert.equal(viewportIndicator.withinList, true, `indicator stays inside tablist at ${width}`);
    assert.equal(viewportIndicator.underActive, true, `indicator stays under selected tab at ${width}`);
  }
  check('tabs indicator realigns without overflow on 1440/768/375 viewport and container resizing');

  await page.locator('[name="name"]').fill('');
  await page.locator('[data-ri="form"] button[type="submit"]').click();
  assert.equal(await page.locator('[name="name"]').getAttribute('aria-invalid'), 'true');
  const nameError = await page.locator('[name="name"]').evaluate((input) => {
    const ids = input.getAttribute('aria-describedby').split(/\s+/);
    return document.getElementById(ids[ids.length - 1]).textContent;
  });
  assert.match(nameError, /필수/);
  await page.locator('[name="name"]').fill('Lee');
  await page.locator('[name="email"]').fill('bad-email');
  await page.locator('[data-ri="form"] button[type="submit"]').click();
  const emailError = await page.locator('[name="email"]').evaluate((input) => {
    const ids = input.getAttribute('aria-describedby').split(/\s+/);
    return document.getElementById(ids[ids.length - 1]).textContent;
  });
  assert.match(emailError, /이메일/);
  check('form errors support multiple aria-describedby IDs and CSS-special IDs');

  const callbackResult = await page.evaluate(async () => {
    const root = document.createElement('div');
    root.innerHTML = `<section data-ri="form"><form novalidate><input name="name" data-ri-required aria-describedby="cb-error"><span id="cb-error"></span><button type="submit" aria-busy="false">Submit</button><button type="reset">Reset</button><p data-ri-form-status role="status"></p></form></section>`;
    document.body.appendChild(root);
    const calls = [];
    const signals = [];
    let resolveFirst;
    const first = new Promise(resolve => { resolveFirst = resolve; });
    const clean = window.ReferenceInteractions.mount(root, {
      onSubmit(payload) {
        calls.push({ values: payload.values, aborted: payload.signal.aborted });
        signals.push(payload.signal);
        return first;
      }
    });
    const form = root.querySelector('form');
    const input = root.querySelector('input');
    input.value = 'First';
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    const blockedDuplicate = calls.length === 1;
    form.reset();
    const abortedByReset = signals[0] && signals[0].aborted;
    resolveFirst({ message: 'stale success' });
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
    const staleIgnored = !root.querySelector('[data-ri-form-status]').textContent.includes('stale success');
    input.value = 'Second';
    const secondClean = window.ReferenceInteractions.mount(root);
    secondClean();
    const rejectionRoot = document.createElement('div');
    rejectionRoot.innerHTML = `<section data-ri="form"><form novalidate><input name="email" type="email" data-ri-required aria-describedby="reject-error"><span id="reject-error"></span><button type="submit" aria-busy="false">Submit</button><p data-ri-form-status role="status"></p></form></section>`;
    document.body.appendChild(rejectionRoot);
    const rejectClean = window.ReferenceInteractions.mount(rejectionRoot, {
      onSubmit() {
        return Promise.reject(new Error('private detail'));
      }
    });
    rejectionRoot.querySelector('input').value = 'valid@example.com';
    rejectionRoot.querySelector('form').dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
    const safeError = rejectionRoot.querySelector('[data-ri-form-status]').textContent;
    rejectClean();
    clean();
    root.remove();
    rejectionRoot.remove();
    return { blockedDuplicate, abortedByReset, staleIgnored, safeError, values: calls[0].values };
  });
  assert.deepEqual(callbackResult.values, { name: 'First' });
  assert.equal(callbackResult.blockedDuplicate, true);
  assert.equal(callbackResult.abortedByReset, true);
  assert.equal(callbackResult.staleIgnored, true);
  assert.equal(callbackResult.safeError, '요청을 완료하지 못했습니다. 잠시 후 다시 시도하세요.');
  check('form onSubmit callback blocks duplicate submits, aborts reset, ignores stale completion, and masks rejection details');

  const actionResult = await page.evaluate(async () => {
    const root = document.createElement('div');
    root.innerHTML = `<section data-ri="buttons"><button type="button" data-ri-button-action data-ri-loading-text="<img src=x onerror=alert(1)>" aria-busy="false">Original <span>-></span></button><p data-ri-button-status role="status">Idle</p></section>`;
    document.body.appendChild(root);
    const signals = [];
    let resolveSecond;
    const clean = window.ReferenceInteractions.mount(root, {
      onAction(payload) {
        signals.push(payload.signal);
        if (signals.length === 2) return new Promise(resolve => { resolveSecond = resolve; });
        return Promise.resolve({ message: 'adapter done' });
      }
    });
    const button = root.querySelector('[data-ri-button-action]');
    button.click();
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
    const restored = button.innerHTML;
    const message = root.querySelector('[data-ri-button-status]').textContent;
    button.click();
    const loadingText = button.textContent;
    const noParsedLoadingHtml = !button.querySelector('img');
    clean();
    const clearedOnCleanup = button.disabled === false && button.getAttribute('aria-busy') === 'false' && button.innerHTML === 'Original <span>-&gt;</span>';
    const abortedByCleanup = signals[1] && signals[1].aborted;
    if (resolveSecond) resolveSecond({ message: 'late done' });
    await Promise.resolve();
    root.remove();
    return { restored, message, loadingText, noParsedLoadingHtml, clearedOnCleanup, abortedByCleanup };
  });
  assert.equal(actionResult.restored, 'Original <span>-&gt;</span>');
  assert.equal(actionResult.message, 'adapter done');
  assert.equal(actionResult.loadingText.trim(), '<img src=x onerror=alert(1)>');
  assert.equal(actionResult.noParsedLoadingHtml, true);
  assert.equal(actionResult.clearedOnCleanup, true);
  assert.equal(actionResult.abortedByCleanup, true);
  check('button onAction callback restores authored content, treats data text safely, and clears pending cleanup');

  const productionResult = await page.evaluate(async () => {
    const buttonRoot = document.createElement('div');
    buttonRoot.innerHTML = `<section data-ri="buttons" data-ri-mode="production"><button type="button" data-ri-button-action aria-busy="false">Keep me</button><p data-ri-button-status role="status">Ready</p></section>`;
    document.body.appendChild(buttonRoot);
    const cleanButton = window.ReferenceInteractions.mount(buttonRoot);
    const productionButton = buttonRoot.querySelector('[data-ri-button-action]');
    productionButton.click();
    const buttonState = {
      html: productionButton.innerHTML,
      busy: productionButton.getAttribute('aria-busy'),
      status: buttonRoot.querySelector('[data-ri-button-status]').textContent
    };
    cleanButton();
    buttonRoot.remove();

    const formRoot = document.createElement('div');
    formRoot.innerHTML = `<section data-ri="form" data-ri-mode="production"><form novalidate><input name="email" type="email" data-ri-required aria-describedby="prod-error"><span id="prod-error"></span><button type="submit" aria-busy="false">Submit</button><p data-ri-form-status role="status"></p></form></section>`;
    document.body.appendChild(formRoot);
    const cleanForm = window.ReferenceInteractions.mount(formRoot);
    formRoot.querySelector('input').value = 'prod@example.com';
    formRoot.querySelector('form').dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    const formState = {
      status: formRoot.querySelector('[data-ri-form-status]').textContent,
      busy: formRoot.querySelector('button[type="submit"]').getAttribute('aria-busy')
    };
    cleanForm();
    formRoot.remove();
    return { buttonState, formState };
  });
  assert.deepEqual(productionResult.buttonState, { html: 'Keep me', busy: 'false', status: '요청 기능이 연결되지 않았습니다.' });
  assert.deepEqual(productionResult.formState, { status: '전송 기능이 연결되지 않았습니다.', busy: 'false' });
  check('production mode does not simulate success without adapters');

  const controlledInitialResult = await page.evaluate(() => {
    const adapterRoot = document.createElement('div');
    adapterRoot.innerHTML = `<section data-ri="form"><form novalidate><input name="email" type="email" value="prefill@example.com" data-ri-required aria-describedby="adapter-error"><span id="adapter-error"></span><button type="submit" aria-busy="false">Submit</button><button type="reset">Reset</button><p data-ri-form-status role="status">Authored adapter idle</p></form></section>`;
    document.body.appendChild(adapterRoot);
    const adapterClean = window.ReferenceInteractions.mount(adapterRoot, { onSubmit() { return Promise.resolve(); } });
    const adapterInitial = {
      value: adapterRoot.querySelector('input').value,
      status: adapterRoot.querySelector('[data-ri-form-status]').textContent
    };
    window.ReferenceInteractions.replay(adapterRoot);
    const adapterAfterReplay = {
      value: adapterRoot.querySelector('input').value,
      status: adapterRoot.querySelector('[data-ri-form-status]').textContent
    };
    adapterClean();
    adapterRoot.remove();

    const productionRoot = document.createElement('div');
    productionRoot.innerHTML = `<section data-ri="form" data-ri-mode="production"><form novalidate><input name="email" type="email" value="prod-prefill@example.com" data-ri-required aria-describedby="prod-prefill-error"><span id="prod-prefill-error"></span><button type="submit" aria-busy="false">Submit</button><p data-ri-form-status role="status">Authored production idle</p></form></section>`;
    document.body.appendChild(productionRoot);
    const productionClean = window.ReferenceInteractions.mount(productionRoot);
    const productionInitial = {
      value: productionRoot.querySelector('input').value,
      status: productionRoot.querySelector('[data-ri-form-status]').textContent
    };
    productionClean();
    productionRoot.remove();
    return { adapterInitial, adapterAfterReplay, productionInitial };
  });
  assert.deepEqual(controlledInitialResult.adapterInitial, { value: 'prefill@example.com', status: 'Authored adapter idle' });
  assert.deepEqual(controlledInitialResult.adapterAfterReplay, { value: 'prefill@example.com', status: 'Authored adapter idle' });
  assert.deepEqual(controlledInitialResult.productionInitial, { value: 'prod-prefill@example.com', status: 'Authored production idle' });
  check('adapter and production forms preserve prefilled values and authored initial status');

  const formCleanupResult = await page.evaluate(async () => {
    const root = document.createElement('div');
    root.innerHTML = `<section data-ri="form"><form novalidate><input name="email" type="email" value="cleanup@example.com" data-ri-required aria-describedby="cleanup-error"><span id="cleanup-error"></span><button type="submit" aria-busy="false">Submit</button><p data-ri-form-status role="status">Ready</p></form></section>`;
    document.body.appendChild(root);
    let resolveSubmit;
    const clean = window.ReferenceInteractions.mount(root, {
      onSubmit() {
        return new Promise(resolve => { resolveSubmit = resolve; });
      }
    });
    const form = root.querySelector('form');
    const submit = root.querySelector('button[type="submit"]');
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    clean();
    const cleared = submit.disabled === false && submit.getAttribute('aria-busy') === 'false';
    const remountClean = window.ReferenceInteractions.mount(root, {
      onSubmit() {
        return Promise.resolve({ message: 'remounted' });
      }
    });
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
    if (resolveSubmit) resolveSubmit({ message: 'late' });
    const remounted = root.querySelector('[data-ri-form-status]').textContent === 'remounted';
    remountClean();
    root.remove();
    return { cleared, remounted };
  });
  assert.deepEqual(formCleanupResult, { cleared: true, remounted: true });
  check('pending form cleanup clears controls and remounts cleanly');

  const detachedResult = await page.evaluate(() => {
    const root = document.createElement('div');
    root.innerHTML = `<section data-ri="form"><form novalidate><label for="detached:email">Email</label><input id="detached:email" name="email" type="email" data-ri-required aria-describedby="detached.error"><span id="detached.error"></span><button type="submit" aria-busy="false">Submit</button><p data-ri-form-status role="status"></p></form></section>`;
    const clean = window.ReferenceInteractions.mount(root);
    const input = root.querySelector('input');
    const labelFor = root.querySelector('label').getAttribute('for');
    const desc = input.getAttribute('aria-describedby');
    root.querySelector('form').dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    const error = root.querySelector(`[id="${desc}"]`).textContent;
    const refsResolved = root.querySelector(`[id="${labelFor}"]`) === input;
    clean();
    return { refsResolved, error };
  });
  assert.equal(detachedResult.refsResolved, true);
  assert.match(detachedResult.error, /필수/);
  check('detached Element roots mount with scoped ID references');

  const demoSubmitCount = await page.evaluate(async () => {
    let count = 0;
    const originalFetch = window.fetch;
    window.fetch = () => {
      count += 1;
      return Promise.reject(new Error('network should not run'));
    };
    const form = document.querySelector('[data-ri="form"] form');
    form.querySelector('[name="name"]').value = 'Demo';
    form.querySelector('[name="email"]').value = 'demo@example.com';
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));
    window.fetch = originalFetch;
    return count;
  });
  assert.equal(demoSubmitCount, 0);
  check('demo form remains local-only without an onSubmit callback');

  const faqCleanupCount = await page.evaluate(() => {
    const root = document.createElement('div');
    root.innerHTML = `<section data-ri="faq"><button type="button" data-ri-faq-button aria-expanded="false" aria-controls="leak-panel">Leak</button><div id="leak-panel">Leak panel</div></section>`;
    document.body.appendChild(root);
    const originalSetTimeout = window.setTimeout;
    const originalClearTimeout = window.clearTimeout;
    let nextId = 1;
    let clearCount = 0;
    window.setTimeout = () => nextId++;
    window.clearTimeout = () => { clearCount += 1; };
    const clean = window.ReferenceInteractions.mount(root);
    const button = root.querySelector('[data-ri-faq-button]');
    for (let i = 0; i < 12; i += 1) button.click();
    clearCount = 0;
    clean();
    window.setTimeout = originalSetTimeout;
    window.clearTimeout = originalClearTimeout;
    root.remove();
    return clearCount;
  });
  assert(faqCleanupCount <= 3, `FAQ cleanup should not accumulate one cleanup closure per click; got ${faqCleanupCount}`);
  check('FAQ rapid clicks do not accumulate cleanup closures');

  assert.deepEqual(errors, []);
  await browser.close();
  console.log(JSON.stringify({ status: 'pass', checks }, null, 2));
})().catch(async error => {
  console.error(error);
  process.exit(1);
});
