// The interface bar, measured in a browser: node tests/layout.mjs   (Playwright + Chromium; serves the repo itself)
// At 667x375, 844x390 and 390x844, on a touch screen, every screen and HUD state this build adds or changes:
//   every button at least 44 px each way, no text under 12 px, nothing off the screen, and the HUD's plates, coach line,
//   callout and pad never overlap. SHOTS=<folder> saves a screenshot of each (2x JPEG, for people to look at). STATES=a,b picks the states.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8000 + Math.floor(Math.random() * 900), URL = `http://127.0.0.1:${PORT}/`;
const SHOTS = process.env.SHOTS || '';
const SIZES = [[667, 375], [844, 390], [390, 844]];
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const fails = []; let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails.push(msg); console.log('  FAIL', msg); } };

// each state: a name, and a function run in the page that puts the game there (and returns once it is)
export const STATES = {
  title: async () => { const G = window.__G; if (G.mission) G.toHQ(); G.ui.show('title'); },
  drive: async () => { // at the wheel, a seat-change reason on the coach line, a callout up
    const G = window.__G, { STORMS } = await import('/src/config.js'); G.startMission(STORMS[0]); const m = G.mission;
    for (let i = 0; i < 10; i++) await new Promise((r) => requestAnimationFrame(r));
    m.note('THE LINE WENT: YOUR WHEEL AGAIN'); m.call('GET CLEAR  ·  +2 ROCKETS', 'bad', 9, 3); m.bark = { name: 'Winch Okafor', text: 'Cable is greased. Do not embarrass it.' }; m.barkT = 9;
  },
  gun: async () => { // on the gun, put there by the game: the reason and the way back
    const G = window.__G, { STORMS } = await import('/src/config.js'); G.startMission(STORMS[2]); const m = G.mission;
    for (let i = 0; i < 10; i++) await new Promise((r) => requestAnimationFrame(r));
    m.enterGun('auto'); m.bark = { name: 'June Bug', text: 'Guns are hot. Nobody tell my mom.' }; m.barkT = 9; m.seatNote.at = m.time - 2; m.call('DEBRIS FIELD', 'bad', 9, 3);
  },
  skip: async () => { // the DOROTHY ride, already seen: TAP TO SKIP
    const G = window.__G, { STORMS } = await import('/src/config.js'); G.save.s.seen = { dorothy: true, kill: true };
    G.tetherSeed = 3; G.startMission(STORMS[0]); G.fast = 6; const m = G.mission, s = m.storm, frame = () => new Promise((r) => requestAnimationFrame(r));
    while (s.bandsLeft > 1) { while (m.phase !== 'chase') await frame(); m.damageStorm(m.hp + 1, { x: s.x, y: 40, z: s.z }); }
    while (m.phase !== 'chase') await frame(); m.damageStorm(m.hp + 1, { x: s.x, y: 40, z: s.z });
    while (m.phase !== 'rip') { if (m.phase === 'stagger' && !m.harpoonBusy) m.fireHarpoon(); await frame(); }
    m.rig.place(s.ax + m.dropR + 2, s.az, -Math.PI / 2, G.world); while (!m.dropped) await frame();
    G.fast = 1; m.act(); for (let i = 0; i < 40; i++) await frame(); G.fx.stopT = 1e9;
  },
};

// runs in the page: measure what is on screen now
function audit() {
  const W = innerWidth, H = innerHeight, out = { small: [], tiny: [], off: [], overlap: [] };
  const vis = (e) => { if (!e || e.hidden || e.closest('[hidden]')) return false; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  // ancestors faded out (the cinematic fades the pad and the side plates) do not count as on screen
  const shown = (e) => { for (let p = e; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || p.hidden) return false; } return vis(e); };
  for (const b of document.querySelectorAll('button, [role=tab], .pad-btn')) {
    if (!shown(b)) continue; const r = b.getBoundingClientRect(), name = b.id || b.className || b.textContent.trim().slice(0, 20);
    if (r.width < 44 - 0.5 || r.height < 44 - 0.5) out.small.push(`${name} ${Math.round(r.width)}x${Math.round(r.height)}`);
    if (r.left < -0.5 || r.top < -0.5 || r.right > W + 0.5 || r.bottom > H + 0.5) {
      const sc = b.closest('.hq-body, .panel'); if (!sc || sc.scrollHeight <= sc.clientHeight) out.off.push(`${name} at ${Math.round(r.left)},${Math.round(r.top)}`); // inside a scrolling panel is fine
    }
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const e = n.parentElement; if (!n.textContent.trim() || !e || !shown(e) || e.closest('noscript, #loading')) continue;
    const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 12 - 0.01) out.tiny.push(`${e.id || e.className || e.tagName} "${n.textContent.trim().slice(0, 24)}" ${fs}px`);
    const r = e.getBoundingClientRect(); if (r.width && (r.left < -1 || r.right > W + 1)) out.off.push(`text "${n.textContent.trim().slice(0, 24)}" ${Math.round(r.left)}..${Math.round(r.right)}`);
  }
  // the HUD: none of these may overlap each other
  const ids = ['hud-hull', 'hud-speed', 'hud-storm', 'btn-pause', 'hud-coach', 'hud-callout', 'hud-bark', 'btn-boost', 'btn-action', 'btn-fire', 'btn-swap', 'btn-drive'];
  const boxes = ids.map((id) => { const e = document.getElementById(id); return e && shown(e) && !document.getElementById('hud').hidden ? [id, e.getBoundingClientRect()] : null; }).filter(Boolean);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const [a, A] = boxes[i], [b, B] = boxes[j], x = Math.min(A.right, B.right) - Math.max(A.left, B.left), y = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
    if (x > 1 && y > 1) out.overlap.push(`${a} / ${b} (${Math.round(x)}x${Math.round(y)})`);
  }
  return out;
}

export async function run(states = Object.keys(STATES), shots = SHOTS) {
  const browser = await chromium.launch();
  for (const [w, h] of SIZES) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: shots ? 2 : 1, hasTouch: true, isMobile: true });
    const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(URL); await page.waitForFunction(() => window.__G && window.__G.ui && document.getElementById('loading').hidden, null, { timeout: 60000 });
    for (const name of states) {
      await page.evaluate(`(${STATES[name].toString()})()`);
      if (name !== 'title' && name !== 'skip') await page.touchscreen.tap(Math.round(w * 0.2), Math.round(h * 0.62)); // a thumb on the glass: the game knows it is on a phone
      await page.waitForTimeout(350);
      const A = await page.evaluate(audit), tag = `${name} ${w}x${h}`;
      ok(!A.small.length, `${tag}: touch targets under 44 px: ${A.small.join(', ')}`);
      ok(!A.tiny.length, `${tag}: text under 12 px: ${A.tiny.join(', ')}`);
      ok(!A.off.length, `${tag}: off the screen: ${A.off.join(', ')}`);
      ok(!A.overlap.length, `${tag}: HUD overlaps: ${A.overlap.join(', ')}`);
      console.log(`${tag.padEnd(22)} ${A.small.length + A.tiny.length + A.off.length + A.overlap.length ? 'issues' : 'clean'}`);
      if (shots) { fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, `${name}-${w}x${h}.jpg`), type: 'jpeg', quality: 80 }); }
      await page.evaluate(() => { const G = window.__G; G.fx.stopT = 0; G.fast = 1; });
    }
    ok(errors.length === 0, `${w}x${h}: page errors: ${errors.join(' | ')}`);
    await page.close();
  }
  await browser.close();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { await new Promise((r) => setTimeout(r, 600)); await run((process.env.STATES || '').split(',').filter(Boolean).length ? process.env.STATES.split(',') : undefined); }
  finally { server.kill(); }
  console.log(`\n${checks - fails.length}/${checks} checks passed`);
  process.exit(fails.length ? 1 : 0);
}
