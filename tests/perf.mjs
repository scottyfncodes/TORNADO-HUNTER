// The low-detail tier holds its frame rate: node tests/perf.mjs   (Playwright + Chromium; serves the repo itself)
// Headless Chromium renders in software, which the game detects and puts on its low tier (G.low): a fair worst case.
// It measures the frame rate the game itself reports (window.__game.fps) through an ordinary chase, and through the
// grain elevator coming down, at real speed (no fast-forward). The check: the set piece costs no more than 15% of it.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8000 + Math.floor(Math.random() * 900), URL = `http://127.0.0.1:${PORT}/`;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
let failed = false;
try {
  await new Promise((r) => setTimeout(r, 600));
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  await page.goto(URL); await page.waitForFunction(() => window.__G && window.__G.ui && document.getElementById('loading').hidden, null, { timeout: 60000 });
  const R = await page.evaluate(async () => {
    const { STORMS, SETPIECE } = await import('/src/config.js'); const G = window.__G, frame = () => new Promise((r) => requestAnimationFrame(r)), wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const sample = async (secs, cond = () => true) => { const v = []; const t0 = performance.now(); let last = -1; while (performance.now() - t0 < secs * 1000 && cond()) { await frame(); const f = window.__game.fps; if (f !== last) { v.push(f); last = f; } } v.sort((a, b) => a - b); return { median: v[v.length >> 1] || 0, low: v[0] || 0, n: v.length }; };
    const drive = (m) => () => { const r = m.rig, sp = m.sp; if (!sp || !sp.O) return { steer: 0, throttle: 1 }; const P = sp.frame(r), want = (sp.tip + sp.half) / 2, tx = r.x + sp.F.x * 40 + sp.N.x * (want - P.u), tz = r.z + sp.F.z * 40 + sp.N.z * (want - P.u), dx = tx - r.x, dz = tz - r.z, l = Math.hypot(dx, dz), hx = Math.sin(r.heading), hz = Math.cos(r.heading); return { steer: Math.max(-1, Math.min(1, (hx * dz / l - hz * dx / l) * 3)), throttle: 1 }; };
    const axes0 = G.input.axes;
    G.setpiece = 'never'; G.startMission(STORMS[0]); G.input.axes = drive(G.mission); await wait(1500); const plain = await sample(6);
    G.setpiece = 'force'; G.startMission(STORMS[0]); const m = G.mission; G.input.axes = drive(m); m.time = SETPIECE.after + 0.5; await wait(500);
    while (m.sp.state === 'armed' || m.sp.state === 'idle') await frame();
    const piece = await sample(8, () => m.sp.state === 'creak' || m.sp.state === 'fall' || (m.sp.state === 'done' && m.sp.doneT < 3));
    G.input.axes = axes0; G.setpiece = undefined; return { low: !!G.low, detail: G.quality.detail, scale: G.quality.scale, plain, piece };
  });
  console.log(JSON.stringify(R));
  const ok = R.low && R.piece.median >= R.plain.median * 0.85;
  console.log(ok ? 'the low tier holds its frame rate through the elevator' : 'FAIL: the elevator costs more than 15% of the frame rate'); failed = !ok;
  await browser.close();
} finally { server.kill(); }
process.exit(failed ? 1 : 0);
