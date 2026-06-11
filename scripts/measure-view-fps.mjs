/**
 * FPS / frame-time regression probe.
 *
 * Measures rAF-based FPS + JS heap per view, for two preview server builds,
 * then prints a comparison table.
 *
 * Usage:
 *   node scripts/measure-view-fps.mjs
 *
 * Expects:
 *   current build  → http://localhost:4173
 *   baseline build → http://localhost:4174
 *
 * Sequential — never spawns parallel Chrome instances (machine limit).
 */

import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VIEWPORT = { width: 1440, height: 900 };

const BUILDS = [
  { label: 'current',  port: 4173 },
  { label: 'baseline', port: 4174 },
];

// Views to probe  (hash='' → home)
const VIEWS = [
  { hash: '',          name: 'home'      },
  { hash: 'role',      name: 'role'      },
  { hash: 'tools',     name: 'tools'     },
  { hash: 'agent',     name: 'agent'     },
  { hash: 'takeaways', name: 'takeaways' },
];

// Timing constants (ms)
const INITIAL_SETTLE_MS   = 5000;  // wait after page load before clicking gate
const GATE_TIMEOUT_MS     = 4000;  // waitForSelector timeout for gate dismiss
const POST_GATE_SETTLE_MS = 6000;  // wait for camera + exhibits to settle
const MEASURE_WINDOW_MS   = 5000;  // rAF counting window
const NETWORK_TIMEOUT_MS  = 40000; // page.goto timeout

/**
 * Click the "Press Start" gate button (works for all views since the gate
 * always appears first). Uses the same whitespace-agnostic regex as the
 * screenshot script to handle U+2002 EN SPACE.
 *
 * Returns true if a button was found and clicked.
 */
async function clickStartGate(page) {
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) =>
      /press\s+start|enter\s+the\s+pharmacy/i.test(b.textContent ?? '')
    );
    if (btn) { btn.click(); return true; }
    return false;
  });

  if (clicked) {
    // Wait for gate dialog to vanish
    try {
      await page.waitForSelector('[role="dialog"][aria-label*="start"]', {
        hidden: true,
        timeout: GATE_TIMEOUT_MS,
      });
    } catch {
      // Gate may already be gone or selector mismatch — continue
    }
  }
  return clicked;
}

/**
 * Measure rAF FPS and JS heap over MEASURE_WINDOW_MS.
 * Returns { fps, avgFrameMs, heapMB }
 */
async function measureFPS(page) {
  const result = await page.evaluate((windowMs) => {
    return new Promise((resolve) => {
      let frameCount = 0;
      let lastTs = null;
      const frameTimes = [];
      const start = performance.now();

      function tick(ts) {
        if (lastTs !== null) {
          frameTimes.push(ts - lastTs);
        }
        lastTs = ts;
        frameCount++;

        if (performance.now() - start < windowMs) {
          requestAnimationFrame(tick);
        } else {
          const elapsed = performance.now() - start;
          const fps = frameCount / (elapsed / 1000);
          const avgFrameMs =
            frameTimes.length > 0
              ? frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
              : null;
          const heapMB =
            performance.memory
              ? +(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)
              : null;
          resolve({ fps: +fps.toFixed(1), avgFrameMs: avgFrameMs ? +avgFrameMs.toFixed(2) : null, heapMB });
        }
      }

      requestAnimationFrame(tick);
    });
  }, MEASURE_WINDOW_MS);

  return result;
}

/**
 * Probe one view on one port.
 * Returns { fps, avgFrameMs, heapMB }
 */
async function probeView(browser, port, hash, label) {
  const url = hash ? `http://localhost:${port}/#${hash}` : `http://localhost:${port}/`;
  console.log(`  [probe] ${label}/${hash || 'home'} → ${url}`);

  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error(`    [pageerror] ${e.message}`));

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: NETWORK_TIMEOUT_MS });

    // Initial settle — let GLBs stream + first frame render
    console.log(`    waiting ${INITIAL_SETTLE_MS}ms initial settle…`);
    await new Promise((r) => setTimeout(r, INITIAL_SETTLE_MS));

    // Click gate (always present on first load for each view)
    const gateClicked = await clickStartGate(page);
    if (gateClicked) {
      console.log(`    gate clicked → settling ${POST_GATE_SETTLE_MS}ms…`);
      await new Promise((r) => setTimeout(r, POST_GATE_SETTLE_MS));
    } else {
      console.log(`    no gate found (may have already dismissed)`);
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Measure
    console.log(`    measuring ${MEASURE_WINDOW_MS}ms rAF window…`);
    const metrics = await measureFPS(page);
    console.log(`    → fps=${metrics.fps} avgFrameMs=${metrics.avgFrameMs} heapMB=${metrics.heapMB}`);
    return metrics;
  } finally {
    await page.close();
  }
}

/**
 * Probe the accumulation case: current build, navigate home → role → tools →
 * agent → takeaways → home via hash changes on SAME page, then measure.
 */
async function probeAccumulation(browser, port) {
  const baseUrl = `http://localhost:${port}/`;
  console.log(`\n[probe:accumulation] starting at ${baseUrl}`);

  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error(`  [pageerror] ${e.message}`));

  try {
    // Load home
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: NETWORK_TIMEOUT_MS });
    await new Promise((r) => setTimeout(r, INITIAL_SETTLE_MS));

    // Click start gate
    const gateClicked = await clickStartGate(page);
    if (gateClicked) {
      await new Promise((r) => setTimeout(r, POST_GATE_SETTLE_MS));
    }

    // Navigate through all chapters via hash on the same page
    const sequence = ['role', 'tools', 'agent', 'takeaways', ''];
    for (const hash of sequence) {
      const target = hash ? `${baseUrl}#${hash}` : baseUrl;
      console.log(`  → navigate to ${target}`);
      await page.evaluate((h) => { window.location.hash = h; }, hash);
      // Wait for camera/scene settle per chapter
      await new Promise((r) => setTimeout(r, 3000));
    }

    // Extra settle back on home with all exhibits having been visited
    console.log(`  → back on home, settling 4s…`);
    await new Promise((r) => setTimeout(r, 4000));

    console.log(`  measuring ${MEASURE_WINDOW_MS}ms rAF window…`);
    const metrics = await measureFPS(page);
    console.log(`  → fps=${metrics.fps} avgFrameMs=${metrics.avgFrameMs} heapMB=${metrics.heapMB}`);
    return metrics;
  } finally {
    await page.close();
  }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

console.log('Launching Chrome…');
const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: VIEWPORT,
});

/** @type {Record<string, Record<string, {fps:number,avgFrameMs:number|null,heapMB:number|null}>>} */
const results = {};

try {
  for (const build of BUILDS) {
    results[build.label] = {};
    console.log(`\n=== BUILD: ${build.label.toUpperCase()} (port ${build.port}) ===`);

    for (const view of VIEWS) {
      const metrics = await probeView(browser, build.port, view.hash, build.label);
      results[build.label][view.name] = metrics;
    }
  }

  // Accumulation probe (current only)
  console.log('\n=== ACCUMULATION PROBE (current only) ===');
  const accumMetrics = await probeAccumulation(browser, BUILDS[0].port);
  results['current']['home_after_tour'] = accumMetrics;

} finally {
  await browser.close();
}

// ── OUTPUT TABLE ──────────────────────────────────────────────────────────────

console.log('\n\n════════════════════════════════════════════════════════════════════');
console.log('  FPS REGRESSION MEASUREMENT REPORT');
console.log('  baseline = commit 18554d6 | current = HEAD (polish-pass-10 + analytics)');
console.log('════════════════════════════════════════════════════════════════════\n');

// Per-view table
const views = [...VIEWS.map((v) => v.name), 'home_after_tour'];
const COL_W = 12;
const pad = (s, w = COL_W) => String(s).padStart(w);
const lpad = (s, w = COL_W) => String(s).padEnd(w);

console.log(
  lpad('view', 18) +
  pad('base fps') +
  pad('cur fps') +
  pad('delta fps') +
  pad('base ms/f') +
  pad('cur ms/f') +
  pad('delta ms') +
  pad('base heap') +
  pad('cur heap') +
  pad('heap Δ')
);
console.log('─'.repeat(18 + COL_W * 9));

for (const viewName of views) {
  const base = results['baseline']?.[viewName];
  const cur  = results['current']?.[viewName];

  const baseFps  = base?.fps   ?? '-';
  const curFps   = cur?.fps    ?? '-';
  const deltaFps = (base && cur) ? +(cur.fps - base.fps).toFixed(1) : '-';

  const baseMs   = base?.avgFrameMs ?? '-';
  const curMs    = cur?.avgFrameMs  ?? '-';
  const deltaMs  = (base?.avgFrameMs && cur?.avgFrameMs)
    ? +(cur.avgFrameMs - base.avgFrameMs).toFixed(2)
    : '-';

  const baseHeap = base?.heapMB ?? '-';
  const curHeap  = cur?.heapMB  ?? '-';
  const deltaHeap = (base?.heapMB != null && cur?.heapMB != null)
    ? +(cur.heapMB - base.heapMB).toFixed(1)
    : '-';

  const tag = typeof deltaFps === 'number' && deltaFps < -5 ? '  ◄ REGRESSED' :
              typeof deltaFps === 'number' && deltaFps > 5  ? '  ◄ improved'  : '';

  console.log(
    lpad(viewName, 18) +
    pad(baseFps) +
    pad(curFps) +
    pad(deltaFps) +
    pad(baseMs) +
    pad(curMs) +
    pad(deltaMs) +
    pad(baseHeap) +
    pad(curHeap) +
    pad(deltaHeap) +
    tag
  );
}

console.log('\nRaw JSON results:');
console.log(JSON.stringify(results, null, 2));

console.log('\nDone.');
