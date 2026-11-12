// Whole fights, start to finish, in a browser: node tests/fullfight.mjs   (Playwright + Chromium; serves the repo itself)
// A scripted player drives the chase (steers at the storm, boosts when told), the test aimer (gunner.js bot) works the
// turret at two skills, the bus is driven to the ring and DOROTHY deployed, the harpoon and the kill shot fired on a lock.
// It prints what the results screen would: time, hull, accuracy, crits, near misses, the grade and its hint, and the share
// rows. GRADE in config.js is calibrated from this; the checks keep the grades in order (sharp above sloppy).
// RUNS=n seeds per storm and skill (default 2). DAILY=YYYY-MM-DD plays that day's Daily Storm twice and compares.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8000 + Math.floor(Math.random() * 900), URL = `http://127.0.0.1:${PORT}/`;
const RUNS = +(process.env.RUNS || 2);
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const fails = []; let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails.push(msg); console.log('  FAIL', msg); } };

export async function fight(page, { id, skill, seed, daily }) {
  return page.evaluate(async ({ id, skill, seed, daily }) => {
    const { STORMS } = await import('/src/config.js'); const { grade } = await import('/src/grade.js');
    let x = seed >>> 0; const R = Math.random; Math.random = () => { x = (x + 0x6d2b79f5) >>> 0; let t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const G = window.__G, frame = () => new Promise((r) => requestAnimationFrame(() => r()));
    G.bot = true; G.botLag = skill === 'sloppy' ? 0.55 : 0; G.tetherSeed = undefined;
    if (daily) G.startDaily('practice', daily); else G.startMission(STORMS.find((s) => s.id === id));
    G.fast = 6; const m = G.mission, s = m.storm, trail = { jukes: [], attacks: [] };
    const jr = m.rj, ra = m.ra; m.rj = () => { const v = jr(); trail.jukes.push(+v.toFixed(6)); return v; }; m.ra = () => { const v = ra(); trail.attacks.push(+v.toFixed(6)); return v; };
    const axes0 = G.input.axes, steer = (r, tx, tz) => { const dx = tx - r.x, dz = tz - r.z, l = Math.hypot(dx, dz) || 1, hx = Math.sin(r.heading), hz = Math.cos(r.heading); return Math.max(-1, Math.min(1, (hx * dz / l - hz * dx / l) * 3)); };
    G.input.axes = () => {
      const r = m.rig; if (m.view !== 'drive') return { steer: 0, throttle: 0 };
      if (m.phase === 'rip' && m.home) { const d = m.ringDist - m.dropR; return { steer: steer(r, s.ax, s.az), throttle: d > 30 ? 1 : 0.55 }; }
      return { steer: steer(r, s.x + s.vx * 1.2, s.z + s.vz * 1.2), throttle: 1 };
    };
    try {
      while (!m.result && m.time < 300) {
        if (m.view === 'drive' && /BOOST/.test(m.coachLine()) && m.rig.boostCharge >= 1 && m.rig.boost()) G.audio.boost();
        if (m.phase === 'rip' && m.dropped) m.act();
        await frame();
      }
      for (let i = 0; i < 4; i++) await frame();
    } finally { G.input.axes = axes0; G.bot = false; G.botLag = 0; G.fast = 1; Math.random = R; }
    const res = m.result; if (!res) return { timeout: true, phase: m.phase, time: m.time };
    const g = grade(res), st = res.stats;
    return { won: res.won, time: +res.time.toFixed(1), hull: Math.round(res.hull), hullMax: res.hullMax, acc: st.rounds ? +(st.fired / st.rounds).toFixed(2) : 0, rounds: st.rounds, crits: st.crits, close: st.close, letter: g.letter, score: g.score, hint: g.hint, rows: res.rows, storm: res.storm.id, trail: { jukes: trail.jukes.slice(0, 12), attacks: trail.attacks.slice(0, 24) } };
  }, { id, skill, seed, daily });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await new Promise((r) => setTimeout(r, 600));
    const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
    const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(URL); await page.waitForFunction(() => window.__G && window.__G.ui && document.getElementById('loading').hidden, null, { timeout: 60000 });
    const rows = [];
    for (const id of (process.env.ONLY || 'pete,agnes,sisters').split(',')) for (const skill of ['sharp', 'sloppy']) for (let seed = 1; seed <= RUNS; seed++) {
      const F = await fight(page, { id, skill, seed }); rows.push({ id, skill, ...F });
      const r = F.rows ? Object.entries(F.rows).map(([k, v]) => `${k} ${v.join('')}`).join(' ') : '';
      console.log(`${id.padEnd(8)} ${skill.padEnd(6)} ${seed}: ${F.won ? 'won ' : 'LOST'} ${String(F.time).padStart(6)} s  hull ${String(F.hull).padStart(3)}/${F.hullMax}  acc ${F.acc}  crits ${String(F.crits).padStart(4)}  close ${F.close}  -> ${F.letter || '-'} (${F.score})  "${F.hint}"  ${r}`);
      ok(!F.timeout, `${id}/${skill}/${seed}: the fight did not finish (${F.phase} at ${F.time})`);
    }
    for (const id of ['pete', 'agnes', 'sisters']) {
      const sc = (k) => rows.filter((r) => r.id === id && r.skill === k && r.won).map((r) => r.score), mean = (a) => a.reduce((p, q) => p + q, 0) / (a.length || 1);
      if (sc('sharp').length && sc('sloppy').length) ok(mean(sc('sharp')) > mean(sc('sloppy')), `${id}: a sharp gunner does not grade above a sloppy one`);
    }
    if (process.env.DAILY) { // the same day, twice, with different frame-rate noise in between: the same storm, the same decisions
      const a = await fight(page, { daily: process.env.DAILY, seed: 1, skill: 'sharp' }), b = await fight(page, { daily: process.env.DAILY, seed: 2, skill: 'sloppy' });
      console.log('daily', process.env.DAILY, a.storm, b.storm, JSON.stringify(a.trail.jukes.slice(0, 5)), JSON.stringify(b.trail.jukes.slice(0, 5)));
    }
    ok(errors.length === 0, `page errors: ${errors.join(' | ')}`);
    await browser.close();
  } finally { server.kill(); }
  console.log(`\n${checks - fails.length}/${checks} checks passed`);
  process.exit(fails.length ? 1 : 0);
}
