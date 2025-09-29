const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('file:///mnt/c/arc_web/index.html');
  const result = await page.evaluate(() => {
    const toggle = document.querySelector('.menu-toggle');
    const overlay = document.querySelector('[data-circular-nav]');
    return {
      toggleExists: !!toggle,
      overlayExists: !!overlay,
      overlayHidden: overlay ? overlay.hidden : null,
      overlayClasses: overlay ? Array.from(overlay.classList) : null,
    };
  });
  console.log(result);
  await browser.close();
})();
