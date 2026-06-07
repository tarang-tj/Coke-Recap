/**
 * Screenshot the live dev server using system Chrome.
 *
 * Usage:
 *   node scripts/screenshot-dev-server.mjs [output_path] [delay_ms]
 *
 *   output_path  default: plans/reports/screenshot-<timestamp>.png
 *   delay_ms     default: 4500 (wait for GLBs + first-render to settle)
 *
 * Assumes the dev server is already running at http://localhost:5173.
 * Also clicks "Press Start" automatically so we capture the home scene,
 * not the start gate.
 */

import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:5173';
const VIEWPORT = { width: 1440, height: 900 };

const [, , argOutput, argDelay] = process.argv;

const defaultName = `screenshot-${new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '_')
  .slice(0, 19)}.png`;
const outputPath = resolve(argOutput ?? `plans/reports/${defaultName}`);
const delayMs = Number(argDelay ?? 4500);

await mkdir(dirname(outputPath), { recursive: true });

console.log(`[shot] launching Chrome…`);
const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: VIEWPORT,
});

try {
  const page = await browser.newPage();
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[browser:${type}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => console.log(`[browser:pageerror] ${err.message}`));

  console.log(`[shot] navigating to ${URL}…`);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });

  console.log(`[shot] waiting ${delayMs}ms for GLBs and first-render…`);
  await new Promise((r) => setTimeout(r, delayMs));

  // Click "Press Start" (the gate button) if it's still up. Bypass the click
  // if the button isn't present — the gate may already be down.
  try {
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const start = buttons.find((b) => /press start|enter the pharmacy/i.test(b.textContent ?? ''));
      if (start) {
        start.click();
        return true;
      }
      return false;
    });
    if (clicked) {
      console.log(`[shot] clicked start gate; waiting another 1500ms for scene transition…`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  } catch (e) {
    console.log(`[shot] start-gate click skipped: ${e.message}`);
  }

  console.log(`[shot] capturing screenshot to ${outputPath}`);
  await page.screenshot({ path: outputPath, type: 'png' });
  console.log(`[shot] DONE`);
} finally {
  await browser.close();
}
