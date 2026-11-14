// Whole fights, start to finish, in a browser: node tests/fullfight.mjs   (Playwright + Chromium; serves the repo itself)
// A scripted player drives the chase (steers at the storm, boosts when told), the test aimer (gunner.js bot) works the
// turret at two skills, the bus is driven to the ring and DOROTHY deployed, the harpoon and the kill shot fired on a lock.
// Gunners: sharp (never off the seam); thumb (fitted to fights played through real touch input on the live 2.10 build:
// sights 3.5 degrees off what they track, 0.4 s to swing onto a new target, off the trigger some of the time, rockets for
// armour: Pete in about 70 s at 70% accuracy, as those fights were); novice (rougher: 5 degrees, 0.5 s, and never touches
// the rockets; it shoots almost no wreckage down, so it measures what the storm does to a player who only works the seam);
// sloppy (the 2.7 model: sights wander 12 m; kept for comparison). AIM=deg,delay,rest overrides thumb and novice;
// TUNE=name:value,... overrides FEEL numbers for the run.
// The driver follows the coach line and runs from the debris wall; it does not dodge. SKILLS=sharp,novice ONLY=pete pick.
// It prints what the results screen would: time, hull, accuracy, crits, near misses, the grade and its hint, and the share
// rows. GRADE in config.js is calibrated from this; the checks keep the grades in order (sharp above sloppy).
// RIGS=mule,bulldog,whippet plays each fight on each rig, same seeds (default the Mule alone), and checks the crit share the grade
// reads does not depend on the gun's rate of fire. RUNS=n seeds per storm and skill (default 2). DAILY=YYYY-MM-DD plays that day's Daily Storm twice and compares.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8000 + Math.floor(Math.random() * 900), URL = `http://127.0.0.1:${PORT}/`;
const RIGS = (process.env.RIGS || 'mule').split(','), RUNS = +(process.env.RUNS || 2), SKILLS = (process.env.SKILLS || 'sharp,thumb,novice').split(','), FAST = +(process.env.FAST || 6);
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const AIM = { thumb: { deg: 3.5, delay: 0.4, rest: -0.7 }, novice: { deg: 5, delay: 0.5, rest: -0.6 } }; // degrees off, seconds to swing onto a new target, how often it is off the trigger (-1 never, 1 always)
if (process.env.AIM) { const [deg, delay, rest] = process.env.AIM.split(',').map(Number); AIM.thumb = AIM.novice = { deg, delay, rest }; }
const TUNE = Object.fromEntries((process.env.TUNE || '').split(',').filter(Boolean).map((kv) => { const [k, v] = kv.split(':'); return [k, +v]; })); // TUNE=gunnerMercy:4,wreckHpBig:110 tries FEEL numbers without editing config.js
const CRIT_SPREAD = 1.5; // the most one rig's mean crit share may be over another's, the same gunner on the same seeds (measured up to 1.4 on two seeds: the guns spray differently, the Bulldog most; the count it replaced ran 2.5 to 3 times)
const fails = []; let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails.push(msg); console.log('  FAIL', msg); } };

export async function fight(page, { id, skill, seed, daily, rig = 'mule', fast = FAST }) {
  return page.evaluate(async ({ id, skill, seed, daily, rig, fast, AIM, TUNE }) => {
    const { STORMS, FEEL } = await import('/src/config.js'); const { grade } = await import('/src/grade.js'); Object.assign(FEEL, TUNE); window.__G.save.s.loadout.rig = rig;
    let x = seed >>> 0; const R = Math.random; Math.random = () => { x = (x + 0x6d2b79f5) >>> 0; let t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const G = window.__G, frame = () => new Promise((r) => requestAnimationFrame(() => r()));
    G.bot = true; G.botLag = skill === 'sloppy' ? 0.55 : 0; G.botAim = AIM[skill] || null; G.botGunOnly = skill === 'novice'; G.tetherSeed = undefined; G.setpiece = 'never'; // (set pieces are their own test)
    if (daily) G.startDaily('practice', daily); else G.startMission(STORMS.find((s) => s.id === id));
    G.fast = fast; const m = G.mission, s = m.storm, trail = { jukes: [], attacks: [] };
    const jr = m.rj, ra = m.ra; m.rj = () => { const v = jr(); trail.jukes.push(+v.toFixed(6)); return v; }; m.ra = () => { const v = ra(); trail.attacks.push(+v.toFixed(6)); return v; };
    const axes0 = G.input.axes, steer = (r, tx, tz) => { const dx = tx - r.x, dz = tz - r.z, l = Math.hypot(dx, dz) || 1, hx = Math.sin(r.heading), hz = Math.cos(r.heading); return Math.max(-1, Math.min(1, (hx * dz / l - hz * dx / l) * 3)); };
    G.input.axes = () => {
      const r = m.rig; if (m.view !== 'drive') return { steer: 0, throttle: 0 };
      if (m.phase === 'rip' && m.home) { const d = m.ringDist - m.dropR; return { steer: steer(r, s.ax, s.az), throttle: d > 30 ? 1 : 0.55 }; }
      if (m.surge) return { steer: steer(r, r.x + (r.x - m.surge.x), r.z + (r.z - m.surge.z)), throttle: 1 }; // OUTRUN THE WALL
      return { steer: steer(r, s.x + s.vx * 1.2, s.z + s.vz * 1.2), throttle: 1 };
    };
    try {
      while (!m.result && m.time < 300) {
        if (m.view === 'drive' && /BOOST/.test(m.coachLine()) && m.rig.boostCharge >= 1 && m.rig.boost()) G.audio.boost();
        if (m.phase === 'rip' && m.dropped) m.act();
        await frame();
      }
      for (let i = 0; i < 4; i++) await frame();
    } finally { G.input.axes = axes0; G.bot = false; G.botLag = 0; G.botAim = null; G.botGunOnly = false; G.setpiece = undefined; G.fast = 1; Math.random = R; }
    const res = m.result; if (!res) return { timeout: true, phase: m.phase, time: m.time };
    const g = grade(res), st = res.stats;
    return { won: res.won, hits: st.hits, shot: st.shot, time: +res.time.toFixed(1), hull: Math.round(res.hull), hullMax: res.hullMax, acc: st.rounds ? +(st.fired / st.rounds).toFixed(2) : 0, rounds: st.rounds, crits: st.crits, crit: st.rounds ? +(st.crits / st.rounds).toFixed(3) : 0, close: st.close, letter: g.letter, score: g.score, hint: g.hint, rows: res.rows, storm: res.storm.id, trail: { jukes: trail.jukes.slice(0, 12), attacks: trail.attacks.slice(0, 24) } };
  }, { id, skill, seed, daily, rig, fast, AIM, TUNE });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await new Promise((r) => setTimeout(r, 600));
    const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
    const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(URL); await page.waitForFunction(() => window.__G && window.__G.ui && document.getElementById('loading').hidden, null, { timeout: 60000 });
    const rows = [];
    for (const id of (process.env.ONLY || 'pete,agnes,sisters').split(',')) for (const skill of SKILLS) for (const rig of RIGS) for (let seed = 1; seed <= RUNS; seed++) {
      const F = await fight(page, { id, skill, seed, rig }); rows.push({ id, skill, rig, ...F });
      const r = F.rows ? Object.entries(F.rows).map(([k, v]) => `${k} ${v.join('')}`).join(' ') : '';
      console.log(`${id.padEnd(8)} ${skill.padEnd(6)} ${RIGS.length > 1 ? rig.padEnd(8) : ''}${seed}: ${F.won ? 'won ' : 'LOST'} ${String(F.time).padStart(6)} s  hull ${String(F.hull).padStart(3)}/${F.hullMax}  acc ${F.acc}  crits ${String(F.crits).padStart(4)} (${Math.round(F.crit * 100)}%)  close ${F.close}  hits ${F.hits} shot ${F.shot}  -> ${F.letter || '-'} (${F.score})  "${F.hint}"  ${r}`);
      ok(!F.timeout, `${id}/${skill}/${seed}: the fight did not finish (${F.phase} at ${F.time})`);
    }
    // the table the tuning is read from: wins, and the median hull left in a win, per storm and gunner
    console.log('');
    for (const id of ['pete', 'agnes', 'sisters']) for (const k of SKILLS) { const R = rows.filter((r) => r.id === id && r.skill === k); if (!R.length) continue; const W = R.filter((r) => r.won), h = W.map((r) => r.hull).sort((a, b) => a - b), t = W.map((r) => r.time).sort((a, b) => a - b); console.log(`  ${id.padEnd(8)} ${k.padEnd(6)} won ${W.length}/${R.length}  median hull ${h.length ? h[h.length >> 1] : '-'}  median time ${t.length ? t[t.length >> 1] : '-'}  grades ${R.map((r) => r.letter || 'x').join('')}  hits ${R.map((r) => r.hits).join(',')}`); }
    for (const id of ['pete', 'agnes', 'sisters']) {
      const sc = (k) => rows.filter((r) => r.id === id && r.skill === k && r.won).map((r) => r.score), mean = (a) => a.reduce((p, q) => p + q, 0) / (a.length || 1);
      const low = SKILLS.find((k) => k !== 'sharp'); if (low && sc('sharp').length && sc(low).length) ok(mean(sc('sharp')) > mean(sc(low)), `${id}: a sharp gunner does not grade above a ${low} one`);
    }
    // the same gunner on every rig: the crit share the grade reads comes out about the same, where the count it read until 2.13
    // ran about 1.4 times the Mule's on the Bulldog and half of it on the Whippet
    if (RIGS.length > 1) for (const id of ['pete', 'agnes', 'sisters']) for (const k of SKILLS) {
      const mean = (rig, f) => { const R = rows.filter((r) => r.id === id && r.skill === k && r.rig === rig && r.rounds); return R.length ? R.reduce((p, r) => p + f(r), 0) / R.length : null; };
      const share = RIGS.map((g) => mean(g, (r) => r.crit)), count = RIGS.map((g) => mean(g, (r) => r.crits)); if (share.some((v) => v === null)) continue;
      console.log(`${id.padEnd(8)} ${k.padEnd(6)} crit share ${RIGS.map((g, i) => `${g} ${(share[i] * 100).toFixed(1)}%`).join('  ')}   (count ${RIGS.map((g, i) => `${g} ${Math.round(count[i])}`).join('  ')})`);
      ok(Math.max(...share) / Math.max(1e-6, Math.min(...share)) < CRIT_SPREAD, `${id}/${k}: the crit share depends on the rig (${share.map((v) => (v * 100).toFixed(1) + '%').join(' / ')})`);
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
