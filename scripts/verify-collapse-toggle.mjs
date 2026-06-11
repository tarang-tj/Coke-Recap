// Click the start gate, deep-link to the given view hash, click the collapse
// toggle, screenshot. Usage:
//   node scripts/verify-collapse-toggle.mjs [hash] [output-prefix]
// Defaults: hash = 'role', output-prefix = 'plans/reports/lvl13-verify-role'
// Env: SHOT_BASE_URL — overrides the base URL (default http://localhost:5173)
import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const hash       = process.argv[2] ?? 'role';
const outPrefix  = process.argv[3]
  ? path.resolve(ROOT, process.argv[3])
  : path.resolve(ROOT, `plans/reports/lvl13-verify-${hash}`);
const baseUrl    = process.env.SHOT_BASE_URL ?? 'http://localhost:5173';

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
  await page.goto(`${baseUrl}/#${hash}`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 4500));
  await page.evaluate(() => {
    const start = Array.from(document.querySelectorAll('button')).find((b) =>
      /press\s+start|enter\s+the\s+pharmacy/i.test(b.textContent ?? ''),
    );
    start?.click();
  });
  await new Promise((r) => setTimeout(r, 6000));

  // Expanded screenshot (before collapsing)
  await page.screenshot({ path: `${outPrefix}-expanded.png` });
  console.log(`expanded → ${outPrefix}-expanded.png`);

  // Find + click the collapse toggle
  const found = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-expanded]');
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    btn.click();
    return { label: btn.getAttribute('aria-label'), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  });
  console.log('toggle:', JSON.stringify(found));
  await new Promise((r) => setTimeout(r, 1800));

  // Collapsed screenshot
  await page.screenshot({ path: `${outPrefix}-collapsed.png` });
  console.log(`collapsed → ${outPrefix}-collapsed.png`);

  // Re-expand to confirm round-trip
  const expanded = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-expanded]');
    btn?.click();
    return btn?.getAttribute('aria-expanded');
  });
  await new Promise((r) => setTimeout(r, 1000));
  const state = await page.evaluate(() => document.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded'));
  console.log('after re-expand aria-expanded =', state, '(was', expanded, 'at click time)');
  await page.screenshot({ path: `${outPrefix}-reexpanded.png` });
  console.log(`reexpanded → ${outPrefix}-reexpanded.png`);
  console.log('DONE');
} finally {
  await browser.close();
}
