const { chromium } = require('playwright-extra');
const StealthPlugin = require('playwright-extra-plugin-stealth');
chromium.use(StealthPlugin());

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process']
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' });
  await page.goto('https://www.coupang.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  const title = await page.title();
  const structure = await page.evaluate(() => {
    const els = document.querySelectorAll('h1,h2,h3,nav a,button,[class*="tab"],[class*="category"],[class*="banner"]');
    return Array.from(els)
      .map(e => e.tagName + ': ' + e.textContent.trim().slice(0, 120))
      .filter(t => t.length > 10)
      .slice(0, 100)
      .join('\n');
  });
  console.log('TITLE:', title);
  console.log('---STRUCTURE---');
  console.log(structure);
  await browser.close();
})().catch(e => console.error('ERR:', e.message));
