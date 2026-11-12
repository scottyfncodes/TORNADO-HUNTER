// The first 60 seconds, played in a real browser: node tests/firstminute.mjs  (Playwright + Chromium; serves the repo itself)
// GAME_DESIGN.md section 2 promises a beat every few seconds. This plays the opening of every storm with a scripted player
// and records when each beat actually lands, and every callout, so two that land on top of each other show up.
//   The driver follows the coach line: steers at the storm, boosts when it is told to, never dodges.
//   The gunner is the test aimer (gunner.js bot) at two skills: sharp (on the seam) and sloppy (lags the target).
// Options: AUDIT=1 prints the full timeline. The checks are the windows in the design table, with a little slack.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8000 + Math.floor(Math.random() * 900), URL = `http://127.0.0.1:${PORT}/`;
const VERBOSE = !!process.env.AUDIT;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const fails = []; let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails.push(msg); console.log('  FAIL', msg); } };

async function opening(page, { id, skill, seed, coach }) {
  return page.evaluate(async ({ id, skill, seed, coach }) => {
    const { STORMS } = await import('/src/config.js');
    // the same random numbers every run, so a change in the timeline is a change in the game
    let x = seed >>> 0; Math.random = () => { x = (x + 0x6d2b79f5) >>> 0; let t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const G = window.__G, def = STORMS.find((s) => s.id === id);
    G.bot = true; G.botLag = skill === 'sloppy' ? 0.55 : 0; G.startMission(def, { coach }); G.fast = 4;
    const m = G.mission, frame = () => new Promise((r) => requestAnimationFrame(() => r()));
    const T = {}, calls = [], first = (k) => { if (T[k] === undefined) T[k] = +m.time.toFixed(2); };
    // every callout, and how long it was actually on screen (a beat cut short comes back, so its time adds up)
    const call = m.call.bind(m); m.call = (...a) => { const n = calls.length; call(...a); const c = m.callout && m.callout.text === a[0] && !m.callout.logged ? m.callout : m.callQ.find((q) => q.text === a[0] && !q.logged); if (c) { c.logged = true; c.i = n; } calls.push({ t: +m.time.toFixed(2), text: a[0], dur: a[2] ?? 1.5, pri: c ? c.pri : (a[3] ?? 1), up: 0, dropped: !c, ref: c }); };
    const upd = m.update.bind(m); m.update = (dt, ...rest) => { upd(dt, ...rest); if (m.calloutT > 0 && m.callout && m.callout.i !== undefined) calls[m.callout.i].up += dt; };
    const close = m.closeCall.bind(m); m.closeCall = () => { first('nearMiss'); return close(); };
    const thr = m.throwAt.bind(m); m.throwAt = (...a) => { first('wreckage'); return thr(...a); };
    const drop = m.dropHazard.bind(m); m.dropHazard = (z, how) => { if (z.ranging && T.ranging === undefined) T.ranging = `${how} ${Math.hypot(z.h.x - m.rig.x, z.h.z - m.rig.z).toFixed(1)} m`; return drop(z, how); };
    const hurt = m.hurt.bind(m); m.hurt = (n, k) => { const d = hurt(n, k); if (d) first('hit'); return d; };
    // the player at the wheel: aim at where the storm is going, boost when the coach says so
    const axes0 = G.input.axes;
    G.input.axes = () => {
      const r = m.rig, s = m.storm; if (m.view !== 'drive') return { steer: 0, throttle: 0 };
      const tx = s.x + s.vx * 1.2 - r.x, tz = s.z + s.vz * 1.2 - r.z, l = Math.hypot(tx, tz) || 1, hx = Math.sin(r.heading), hz = Math.cos(r.heading);
      return { steer: Math.max(-1, Math.min(1, (hx * tz / l - hz * tx / l) * 3)), throttle: 1 };
    };
    try {
      while (m.time < 60 && !m.result) {
        const line = m.coachLine();
        if (m.view === 'drive' && /BOOST/.test(line) && m.rig.boostCharge >= 1) G.input.__press?.('boost');
        if (m.rig.boostT > 0) first('boost');
        if (m.inZone) first('zone');
        if (m.view === 'gun') first('guns');
        if (m.firing > 0 || m.gn.shotT > 0) first('fire');
        if (m.stats.snaps > 0) first('band');
        if (G.weather.spell > 0) first('hail');
        if (m.wind || m.windWait > 0) first('crosswind');
        await frame();
      }
    } finally { G.input.axes = axes0; G.bot = false; G.botLag = 0; }
    // callouts that were replaced before they had been up long enough to read (0.6 s, or their own length if shorter)
    // a threat or a beat that was never readable: on screen less than 0.6 s (or its own length) in all. Chatter may be dropped.
    const stacked = calls.filter((c, i) => c.pri >= 2 && !(c.ref && c.ref.moot) && c.t < m.time - 2 && c.up < Math.min(0.6, c.dur) - 0.02).map((c) => `${c.text} @${c.t} up ${c.up.toFixed(2)} s`);
    for (const c of calls) delete c.ref;
    return { T, calls, stacked, end: { time: +m.time.toFixed(1), hull: Math.round(m.rig.hull), phase: m.phase, snaps: m.stats.snaps, shot: m.stats.shot, close: m.stats.close, hits: m.stats.hits } };
  }, { id, skill, seed, coach });
}

try {
  await new Promise((r) => setTimeout(r, 600));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL); await page.waitForFunction(() => window.__G && window.__G.ui && document.getElementById('loading').hidden, null, { timeout: 60000 });
  // a boost press, the way the button makes one
  await page.evaluate(() => { const b = document.getElementById('btn-boost'); window.__G.input.__press = () => { b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', pointerId: 77 })); b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch', pointerId: 77 })); }; });
  const rows = [];
  for (const id of (process.env.ONLY || 'pete,agnes,sisters').split(',')) for (const skill of ['sharp', 'sloppy']) for (const seed of [1, 2, 3]) {
    const R = await opening(page, { id, skill, seed, coach: id === 'pete' && seed === 1 });
    rows.push({ id, skill, seed, ...R });
    const t = (k) => (R.T[k] === undefined ? '  -  ' : String(R.T[k]).padStart(5));
    console.log(`${id.padEnd(8)} ${skill.padEnd(6)} seed ${seed}: boost ${t('boost')} | wreckage ${t('wreckage')} | zone ${t('zone')} | guns ${t('guns')} | near miss ${t('nearMiss')} | first hit ${t('hit')} | band ${t('band')} | hail ${t('hail')} | ranging ${R.T.ranging} | hull ${R.end.hull} | stacked ${R.stacked.length}`);
    if (VERBOSE) { for (const c of R.calls) console.log(`      ${String(c.t).padStart(6)}  p${c.pri} up ${c.up.toFixed(2)}  ${c.text}`); for (const s of R.stacked) console.log('      STACKED', s); }
    const tag = `${id}/${skill}/${seed}`;
    // the design table, section 2: the windows a player should feel, with a little slack
    ok(R.T.boost !== undefined && R.T.boost <= 3, `${tag}: first boost at ${R.T.boost} (want 0 to 3 s)`);
    ok(R.T.wreckage !== undefined && R.T.wreckage >= 2.5 && R.T.wreckage <= 7, `${tag}: first wreckage at ${R.T.wreckage} (want 3 to 7 s)`);
    ok(R.T.zone !== undefined && R.T.zone <= 9, `${tag}: first zone entry at ${R.T.zone} (want 5 to 7 s, 9 at most)`);
    ok(R.T.nearMiss !== undefined && R.T.nearMiss <= 20 || R.T.hit !== undefined && R.T.hit <= 20, `${tag}: no near miss or hit in the first 20 s`);
    if (skill === 'sharp') ok(R.T.band !== undefined && R.T.band <= 30, `${tag}: first band ripped at ${R.T.band} (want 19 to 23 s for a sharp gunner, 30 at most)`);
    ok(R.stacked.length === 0, `${tag}: callouts on top of each other: ${R.stacked.join('; ')}`);
  }
  ok(errors.length === 0, `page errors: ${errors.join(' | ')}`);
  // medians per storm, for the design doc
  const med = (a) => { const v = a.filter((x) => x !== undefined).sort((p, q) => p - q); return v.length ? v[(v.length - 1) >> 1] : undefined; };
  console.log('\nmedians (seconds into the mission):');
  for (const id of ['pete', 'agnes', 'sisters']) {
    const R = rows.filter((r) => r.id === id), sharp = R.filter((r) => r.skill === 'sharp'), sl = R.filter((r) => r.skill === 'sloppy');
    console.log(`  ${id.padEnd(8)} boost ${med(R.map((r) => r.T.boost))}, wreckage ${med(R.map((r) => r.T.wreckage))}, near miss ${med(R.map((r) => r.T.nearMiss))}, zone ${med(R.map((r) => r.T.zone))}, band ${med(sharp.map((r) => r.T.band))} sharp / ${med(sl.map((r) => r.T.band))} sloppy`);
  }
  await browser.close();
} finally { server.kill(); }
console.log(`\n${checks - fails.length}/${checks} checks passed`);
process.exit(fails.length ? 1 : 0);
