const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  url: 'https://example.com/',
  pretendToBeVisual: true,
});

// Inject window.__ARTICLES__ script already in HTML; main.js expects DOMContentLoaded.
const scriptContent = fs.readFileSync(path.join(__dirname, 'assets/js/main.js'), 'utf8');
const scriptEl = dom.window.document.createElement('script');
scriptEl.textContent = scriptContent;
dom.window.document.body.appendChild(scriptEl);

function waitForLoad() {
  return new Promise((resolve) => {
    if (dom.window.document.readyState === 'complete' || dom.window.document.readyState === 'interactive') {
      resolve();
      return;
    }
    dom.window.addEventListener('DOMContentLoaded', resolve);
  });
}

(async () => {
  await waitForLoad();
  const toggle = dom.window.document.querySelector('.menu-toggle');
  const overlay = dom.window.document.querySelector('[data-circular-nav]');
  console.log('initial', {
    expanded: toggle.getAttribute('aria-expanded'),
    hidden: overlay.hidden,
    classes: overlay.className,
  });

  toggle.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
  await new Promise((r) => dom.window.requestAnimationFrame(r));
  await new Promise((r) => setTimeout(r, 0));

  console.log('after click', {
    expanded: toggle.getAttribute('aria-expanded'),
    hidden: overlay.hidden,
    classes: overlay.className,
    ariaHidden: overlay.getAttribute('aria-hidden'),
    hasNavOpen: dom.window.document.body.classList.contains('nav-open'),
  });

  dom.window.setTimeout(() => {
    process.exit(0);
  }, 20);
})();
