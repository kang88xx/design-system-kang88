const root = document.documentElement;
const body = document.body;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const navLinks = [...document.querySelectorAll('.side-nav nav a')];
const sections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const menuToggle = document.querySelector('[data-menu-toggle]');
const navPanel = document.querySelector('[data-nav-panel]');
const campaignSteps = [
  {
    kicker: '01 / Objective',
    title: 'Choose the outcome that matters first.',
    copy: 'Awareness, traffic, or conversion goals shape the audience, creative, budget, and measurement path.'
  },
  {
    kicker: '02 / Targeting',
    title: 'Define who should see the message.',
    copy: 'Audience context and intent narrow the campaign so each impression has a clearer job.'
  },
  {
    kicker: '03 / Creative',
    title: 'Create a compact ad that reads quickly.',
    copy: 'The ad preview uses code-drawn panels because the private original manager interface is not available.'
  },
  {
    kicker: '04 / Launch',
    title: 'Launch, read the result, and optimize.',
    copy: 'The final step brings budget, placement, and learning into a single launch path.'
  }
];

function setTheme(theme) {
  const systemDark = matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  body.dataset.theme = resolved;
  try { localStorage.setItem('adver-landing-theme', theme); } catch { /* Theme remains usable without storage. */ }
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
  });
  document.querySelector('[data-theme-cycle]')?.setAttribute('aria-pressed', String(resolved === 'dark'));
}

function initTheme() {
  let saved = 'system';
  try { saved = localStorage.getItem('adver-landing-theme') || 'system'; } catch {}
  setTheme(['light', 'dark', 'system'].includes(saved) ? saved : 'system');
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.addEventListener('click', () => setTheme(button.dataset.themeChoice));
  });
  document.querySelector('[data-theme-cycle]')?.addEventListener('click', () => {
    setTheme(body.dataset.theme === 'dark' ? 'light' : 'dark');
  });
}

function initNavigation() {
  menuToggle?.addEventListener('click', () => {
    const open = navPanel.dataset.open !== 'true';
    navPanel.dataset.open = String(open);
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navPanel.dataset.open === 'true') {
      navPanel.dataset.open = 'false';
      menuToggle?.setAttribute('aria-expanded', 'false');
      menuToggle?.focus();
    }
  });
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navPanel.dataset.open = 'false';
      menuToggle?.setAttribute('aria-expanded', 'false');
    });
  });
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach(link => {
      link.setAttribute('aria-current', link.getAttribute('href') === `#${visible.target.id}` ? 'page' : 'false');
    });
  }, {rootMargin: '-20% 0px -60% 0px', threshold: [0.1, 0.3, 0.6]});
  sections.forEach(section => observer.observe(section));
}

function selectCampaign(index, focus = false) {
  const tabs = [...document.querySelectorAll('[data-tab-index]')];
  const step = campaignSteps[index];
  tabs.forEach((tab, tabIndex) => {
    const active = tabIndex === index;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  document.querySelector('#campaign-panel').setAttribute('aria-labelledby', tabs[index].id);
  document.querySelector('[data-campaign-kicker]').textContent = step.kicker;
  document.querySelector('[data-campaign-title]').textContent = step.title;
  document.querySelector('[data-campaign-copy]').textContent = step.copy;
  if (focus) tabs[index].focus();
}

function initCampaignTabs() {
  const tabs = [...document.querySelectorAll('[data-tab-index]')];
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectCampaign(index));
    tab.addEventListener('keydown', event => {
      const next = {ArrowRight:(index + 1) % tabs.length, ArrowLeft:(index + tabs.length - 1) % tabs.length, Home:0, End:tabs.length - 1}[event.key];
      if (next !== undefined) {
        event.preventDefault();
        selectCampaign(next, true);
      }
    });
  });
}

function initCounters() {
  if (reduceMotion.matches) {
    document.querySelectorAll('[data-count-to]').forEach(node => {
      node.textContent = `${node.dataset.countTo}${node.dataset.suffix || ''}`;
    });
    return;
  }
  const counters = [...document.querySelectorAll('[data-count-to]')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.counted === 'true') return;
      entry.target.dataset.counted = 'true';
      const target = Number(entry.target.dataset.countTo);
      const suffix = entry.target.dataset.suffix || '';
      const start = performance.now();
      const duration = 900;
      function tick(now) {
        if (reduceMotion.matches) {entry.target.textContent = `${entry.target.dataset.countTo}${suffix}`; return;}
        const progress = Math.min((now - start) / duration, 1);
        const decimals = (entry.target.dataset.countTo.split('.')[1] || '').length;
        const value = decimals ? (target * progress).toFixed(decimals) : Math.round(target * progress);
        entry.target.textContent = `${value}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, {threshold: 0.45});
  counters.forEach(counter => observer.observe(counter));
}

function initForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const status = form.querySelector('.form-status');
  form.addEventListener('submit', event => {
    event.preventDefault();
    let valid = true;
    [...form.elements].forEach(field => {
      if (!field.matches('input,textarea,select')) return;
      const error = field.closest('label')?.querySelector('small');
      field.removeAttribute('aria-invalid');
      if (error) error.textContent = '';
      if (field.required && !field.value.trim()) {
        valid = false;
        field.setAttribute('aria-invalid', 'true');
        if (error) error.textContent = '필수 입력입니다.';
      } else if (field.type === 'email' && field.value && !field.validity.valid) {
        valid = false;
        field.setAttribute('aria-invalid', 'true');
        if (error) error.textContent = '이메일 형식을 확인하세요.';
      }
    });
    if (!valid) {
      status.textContent = '필수 항목을 확인하세요.';
      form.querySelector('[aria-invalid=true]')?.focus();
      return;
    }
    const submit = form.querySelector('[type=submit]');
    submit.setAttribute('aria-busy', 'true');
    status.textContent = '로컬 데모 제출을 확인하는 중입니다.';
    setTimeout(() => {
      submit.setAttribute('aria-busy', 'false');
      status.textContent = '확인되었습니다. 실제 네트워크 요청은 발생하지 않았습니다.';
    }, reduceMotion.matches ? 0 : 450);
  });
}

initTheme();
initNavigation();
initCampaignTabs();
initCounters();
initForm();
