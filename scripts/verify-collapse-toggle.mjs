// Click the start gate, deep-link to role, click the collapse toggle, screenshot.
import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 1440, height: 900 },
});
try {
  const page = await browser.newPage();
  page.on('pageerror', (err) => console.log(`[pageerror] ${err.message}`));
  await page.goto('http://localhost:5173/#role', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 4500));
  await page.evaluate(() => {
    const start = Array.from(document.querySelectorAll('button')).find((b) =>
      /press\s+start|enter\s+the\s+pharmacy/i.test(b.textContent ?? ''),
    );
    start?.click();
  });
  await new Promise((r) => setTimeout(r, 6000));
  // Find + click the collapse toggle
  const found = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-expanded]');
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    btn.click();
    return { label: btn.getAttribute('aria-label'), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  });
  console.log('toggle:', JSON.stringify(found));
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: '/Users/tarangjammalamadaka/dev/Coke-Recap/plans/reports/lvl13-verify-role-collapsed.png' });
  // Re-expand to confirm round-trip
  const expanded = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-expanded]');
    btn?.click();
    return btn?.getAttribute('aria-expanded');
  });
  await new Promise((r) => setTimeout(r, 800));
  const state = await page.evaluate(() => document.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded'));
  console.log('after re-expand aria-expanded =', state, '(was', expanded, 'at click time)');
  await page.screenshot({ path: '/Users/tarangjammalamadaka/dev/Coke-Recap/plans/reports/lvl13-verify-role-reexpanded.png' });
  console.log('DONE');
} finally {
  await browser.close();
}
