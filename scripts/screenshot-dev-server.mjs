/**
 * Screenshot the live dev server using system Chrome.
 *
 * Usage:
 *   node scripts/screenshot-dev-server.mjs [output_path] [delay_ms] [hash]
 *
 *   output_path  default: plans/reports/screenshot-<timestamp>.png
 *   delay_ms     default: 4500 (wait for GLBs + first-render to settle)
 *   hash         optional — appended as http://localhost:5173/#<hash>
 *                e.g. "role", "agent", "tools", "takeaways" for deep links.
 *                Omit (or pass empty string) for the home view.
 *
 * Assumes the dev server is already running at http://localhost:5173.
 * Also clicks "Press Start" automatically so we capture the home scene,
 * not the start gate.
 */

import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VIEWPORT = { width: 1440, height: 900 };

const [, , argOutput, argDelay, argHash] = process.argv;

const defaultName = `screenshot-${new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '_')
  .slice(0, 19)}.png`;
const outputPath = resolve(argOutput ?? `plans/reports/${defaultName}`);
const delayMs = Number(argDelay ?? 4500);
// Optional deep-link hash: appended as /#<hash> when provided and non-empty.
// SHOT_BASE_URL lets parallel agents point at dev servers on other ports.
const BASE_URL = process.env.SHOT_BASE_URL ?? 'http://localhost:5173';
const targetUrl = argHash && argHash.trim() ? `${BASE_URL}/#${argHash.trim()}` : BASE_URL;

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

  console.log(`[shot] navigating to ${targetUrl}…`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  console.log(`[shot] waiting ${delayMs}ms for GLBs and first-render…`);
  await new Promise((r) => setTimeout(r, delayMs));

  // Click "Press Start" (the gate button) if it's still up, then wait for the
  // gate dialog element to unmount entirely so the screenshot isn't dimmed
  // by the gate scrim.
  try {
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      // Note: the button uses U+2002 EN SPACE between words — use \s+ instead of
      // a literal space so the match is whitespace-agnostic.
      const start = buttons.find((b) => /press\s+start|enter\s+the\s+pharmacy/i.test(b.textContent ?? ''));
      if (start) {
        start.click();
        return true;
      }
      return false;
    });
    if (clicked) {
      console.log(`[shot] clicked start gate; waiting for it to unmount…`);
      // Wait up to 4s for the gate's [role=dialog] to be removed from the DOM.
      try {
        await page.waitForSelector('[role="dialog"][aria-label*="start"]', {
          hidden: true,
          timeout: 4000,
        });
      } catch {
        // Gate may already be gone or selector mismatch — keep going.
      }
      // Extra settle time for any post-gate scene transition + GLB load.
      // Chapter deep-links need longer: the camera damps at 3.2 s smooth-time,
      // so ~5500ms gives the rig time to fully arrive at the chapter vantage.
      // Home view (no hash) only needs the gate CSS fadeout — 2500ms is enough.
      const postGateMs = argHash && argHash.trim() ? 5500 : 2500;
      await new Promise((r) => setTimeout(r, postGateMs));
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
