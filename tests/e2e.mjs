// The finale, played in a real browser: node tests/e2e.mjs  (needs Playwright with Chromium; serves the repo itself)
// For each storm: shed the outer bands, harpoon, drive Doc's bus to the ring past the lunges, set DOROTHY down, DEPLOY,
// and fire Sparks' kill shot. Two drivers: an attentive one that steps out of the way of a telegraphed lunge, and a naive
// one that drives straight at the ring whatever the storm does. Plus: the line running out, driving into the wall, and a wreck.
// Deterministic tether seeds (G.tetherSeed). This proves the systems work together; it does not prove the Sisters feel fair.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8000 + Math.floor(Math.random() * 900), URL = `http://127.0.0.1:${PORT}/`;
const SHOTS = process.env.SHOTS || ''; // a folder to save phone screenshots of a violent windup into

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const fails = []; let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails.push(msg); console.log('  FAIL', msg); } };

// runs in the page: plays one storm's finale and returns what happened
async function finale(page, { id, seed, driver, scenario = 'full' }) {
  return page.evaluate(async ({ id, seed, driver, scenario }) => {
    const { STORMS, FEEL, TETHER } = await import('/src/config.js');
    const G = window.__G, def = STORMS.find((s) => s.id === id);
    G.tetherSeed = seed; G.startMission(def); G.fast = 6;
    const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
    const until = async (cond, secs, what) => { const t0 = G.mission.time; while (!cond()) { if (G.mission.time - t0 > secs) throw new Error(`timed out (${secs} s of game time): ${what}`); await frame(); } };
    const m = G.mission, s = m.storm, log = { id, seed, driver, scenario, hits: [], lunges: [], windups: [], maxOff: 0, maxStep: 0, radius: 0, teleShown: 0, threatened: 0 };
    // ---- the fight up to the harpoon: bands shot off by the test, not by aim ----
    while (s.bandsLeft > 1) { await until(() => m.phase === 'chase', 30, 'back to the chase'); m.damageStorm(m.hp + 1, { x: s.x, y: 40, z: s.z }); }
    await until(() => m.phase === 'chase', 30, 'the last band'); m.damageStorm(m.hp + 1, { x: s.x, y: 40, z: s.z });
    log.stagger = m.phase === 'stagger' && m.gn.seatId === 'harpoon';
    await until(() => { if (m.phase === 'stagger' && !m.harpoonBusy) m.fireHarpoon(); return m.phase === 'rip'; }, 12, 'the harpoon to land');
    G.fast = 2;
    log.hooked = { bus: !!m.home && m.rig.def.id === 'bus', tether: !!m.tether, seed: m.tetherSeed, hookT: m.hookT };
    log.radius = m.tether.radius; log.wall = m.dropR - FEEL.dropMargin + TETHER.hitPad;
    // ---- record every step on the line ----
    const orig = m.update.bind(m); let px = s.x - s.ax, pz = s.z - s.az, dropAt = null;
    m.update = (dt, t, axes, input) => {
      const was = m.phase; orig(dt, t, axes, input); const te = m.tether;
      if (was === 'rip' && log.hooked.mph === undefined && m.phaseT >= 1.5) log.hooked.mph = m.stormMph; // its ground speed once the line has bitten
      if (te && was === 'rip') {
        const ox = s.x - s.ax, oz = s.z - s.az; log.maxOff = Math.max(log.maxOff, Math.hypot(ox, oz)); log.maxStep = Math.max(log.maxStep, Math.hypot(ox - px, oz - pz)); px = ox; pz = oz;
        if (te.ev === 'windup' && te.tier > 0) { log.windups.push({ t: m.time, tier: te.tier, dur: te.stepDur, reach: te.reaches(m.tc) }); if (te.reaches(m.tc)) log.threatened++; }
        if (te.ev === 'lunge' && te.tier > 0) { const w = log.windups[log.windups.length - 1]; log.lunges.push({ t: m.time, tier: te.tier, warned: w ? m.time - w.t : 0, same: !!w && w.tier === te.tier }); }
        if (te.winding && G.fx.tele.some((e) => e.on && e.r > 20)) log.teleShown++;
      } else { px = s.x - s.ax; pz = s.z - s.az; }
      if (m.dropped && dropAt === null) { dropAt = m.time; log.immuneAtDrop = m.rig.immune; }
    };
    const hurt = m.hurt.bind(m);
    m.hurt = (n, key) => { const r = m.rig, did = hurt(n, key); if (did) { let sat = 1e9; for (const st of m.sats) if (!st.dead) sat = Math.min(sat, Math.hypot(r.x - st.storm.x, r.z - st.storm.z)); log.hits.push({ t: m.time, phase: m.phase, n, funnel: Math.hypot(r.x - s.x, r.z - s.z) - (m.dropR - FEEL.dropMargin), sat, sinceDrop: dropAt === null ? null : m.time - dropAt, lunging: !!(m.tether && m.tether.dangerous) }); } return did; };
    // ---- the player at the wheel of Doc's bus ----
    const axes0 = G.input.axes, steerTo = (r, x, z) => { const dx = x - r.x, dz = z - r.z, l = Math.hypot(dx, dz) || 1, hx = Math.sin(r.heading), hz = Math.cos(r.heading); return Math.max(-1, Math.min(1, (hx * dz / l - hz * dx / l) * 3)); };
    G.input.axes = () => {
      const r = m.rig; if (m.phase !== 'rip' || !m.home) return { steer: 0, throttle: 0 };
      if (driver === 'idle') return { steer: 0, throttle: 0 };
      if (driver === 'wall') return { steer: steerTo(r, s.x, s.z), throttle: 1 }; // straight into the funnel, DOROTHY or not
      const te = m.tether, d = m.ringDist - m.dropR;
      if (driver === 'attentive' && te && te.dangerous && te.reaches(m.tc)) { // it is winding up at me: get off its line
        const tx = s.ax + te.targetX(), tz = s.az + te.targetZ(), ax = r.x - tx, az = r.z - tz, l = Math.hypot(ax, az) || 1, side = (ax * te.dz - az * te.dx) >= 0 ? 1 : -1;
        return { steer: steerTo(r, r.x + ax / l * 30 + te.dz * side * 30, r.z + az / l * 30 - te.dx * side * 30), throttle: 1 };
      }
      return { steer: steerTo(r, s.ax, s.az), throttle: d > 30 ? 1 : 0.55 };
    };
    try {
      if (scenario === 'expire') {
        await until(() => m.phase !== 'rip', 25, 'the line to run out');
        return { ...log, after: { phase: m.phase, line: m.line, tether: m.tether, tug: s.tug, hp: m.hp / m.stageMax, hookRecover: FEEL.hookRecover } };
      }
      if (scenario === 'wall') {
        await until(() => m.phase !== 'rip' || (m.dropped && m.time - (dropAt || m.time) > 4), 25, 'four seconds in the wall');
        return { ...log, phaseAfter: m.phase, hull: m.rig.hull };
      }
      await until(() => m.dropped || m.phase !== 'rip', 25, 'DOROTHY to be set down');
      log.dropped = m.dropped; log.leftAtDrop = m.hookT; log.braked = Math.hypot(m.rig.vx, m.rig.vz);
      log.drum = m.dropped && m.dorothy.visible && Math.abs(m.ringDist - m.dropR) < 12 && Math.hypot(m.dorothy.position.x - s.ax, m.dorothy.position.z - s.az) < m.dropR + 6; // she is on the ground, on the ring
      if (!m.dropped) return { ...log, phaseAfter: m.phase };
      for (let i = 0; i < 3; i++) await frame(); log.deploy = m.act(); await frame();
      log.dorothy = m.phase === 'dorothy'; log.swarm = !!(G.fx.swarm && G.fx.swarm.on); log.cine = !!m.cine;
      G.fast = 6; await until(() => m.phase === 'kill', 10, 'the core to go critical');
      log.killSeat = m.gn.seatId; log.killTether = !!m.tether;
      await until(() => { if (m.phase === 'kill' && m.reload <= 0) m.killShot(); return !!m.result; }, 15, 'the kill shot');
      log.result = { won: m.result.won, reason: m.result.reason, phase: m.phase, tug: s.tug, tether: m.tether };
      return log;
    } finally { G.input.axes = axes0; }
  }, { id, seed, driver, scenario });
}

// a violent windup on a phone, frozen for a screenshot (portrait and landscape)
async function shoot(page, id, file) {
  await page.evaluate(async ({ id }) => {
    const { STORMS } = await import('/src/config.js'); const G = window.__G, def = STORMS.find((s) => s.id === id);
    G.tetherSeed = 99; G.startMission(def); G.fast = 6; const m = G.mission, s = m.storm, frame = () => new Promise((r) => requestAnimationFrame(r));
    while (s.bandsLeft > 1) { while (m.phase !== 'chase') await frame(); m.damageStorm(m.hp + 1, { x: s.x, y: 40, z: s.z }); }
    while (m.phase !== 'chase') await frame(); m.damageStorm(m.hp + 1, { x: s.x, y: 40, z: s.z });
    while (m.phase !== 'rip') { if (m.phase === 'stagger' && !m.harpoonBusy) m.fireHarpoon(); await frame(); }
    G.fast = 1; m.hookT = 6; // into the second act, the bus three quarters of the way in
    const axes0 = G.input.axes; G.input.axes = () => { const r = m.rig, dx = s.ax - r.x, dz = s.az - r.z, l = Math.hypot(dx, dz) || 1, hx = Math.sin(r.heading), hz = Math.cos(r.heading); return { steer: Math.max(-1, Math.min(1, (hx * dz / l - hz * dx / l) * 3)), throttle: m.ringDist - m.dropR > 45 ? 1 : 0 }; };
    const t0 = m.time; while (!(m.tether && m.tether.tier === 2 && m.tether.step === 'windup' && m.tether.stepT > m.tether.stepDur * 0.75) && m.time - t0 < 30 && m.phase === 'rip') { if (m.hookT < 3) m.hookT = 6; await frame(); }
    G.fx.stopT = 1e9; G.input.axes = axes0; for (let i = 0; i < 3; i++) await frame();
  }, { id });
  await page.screenshot({ path: file });
  await page.evaluate(() => { window.__G.fx.stopT = 0; });
}

try {
  await new Promise((r) => setTimeout(r, 600));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL); await page.waitForFunction(() => window.__G && window.__G.ui && document.getElementById('loading').hidden, null, { timeout: 60000 });

  for (const id of (process.env.STORMS ?? 'pete,agnes,sisters').split(',').filter(Boolean)) { // STORMS= skips the finale runs
    for (const [driver, seeds] of [['attentive', [11, 12, 13]], ['naive', [21, 22]]]) for (const seed of seeds) {
      const L = await finale(page, { id, seed, driver });
      const lungeHits = L.hits.filter((h) => h.phase === 'rip' && h.funnel < 4), satHits = L.hits.filter((h) => h.phase === 'rip' && h.funnel >= 4);
      console.log(`${id.padEnd(8)} ${driver.padEnd(9)} seed ${seed}: hooked at ${L.hooked.mph} mph, ${L.lunges.length} dangerous lunges (${L.lunges.filter((x) => x.tier === 2).length} violent, ${L.threatened} at the bus, ${L.teleShown ? 'marked' : 'unmarked'}), max offset ${L.maxOff.toFixed(1)}/${L.radius.toFixed(1)} m, max step ${L.maxStep.toFixed(2)} m, dropped with ${L.leftAtDrop?.toFixed(1)} s left, funnel hits ${lungeHits.length}, satellite hits ${satHits.length}, result ${L.result ? L.result.reason : L.phaseAfter}`);
      const tag = `${id}/${driver}/${seed}`;
      ok(L.stagger, `${tag}: WEAKENED did not put you on Winch's harpoon`);
      ok(L.hooked.bus && L.hooked.tether && L.hooked.seed === seed, `${tag}: the hook did not hand you Doc's bus with the storm on the tether`);
      ok(L.hooked.mph <= 10, `${tag}: HUD reads ${L.hooked.mph} mph for a pinned storm`);
      ok(L.maxOff <= L.radius + 1e-6, `${tag}: funnel went ${L.maxOff.toFixed(1)} m from its anchor (line allows ${L.radius.toFixed(1)})`);
      ok(L.maxStep < 3, `${tag}: funnel moved ${L.maxStep.toFixed(2)} m in one step`);
      ok(L.lunges.every((x) => x.same && x.warned >= 0.9 - 1e-6), `${tag}: a dangerous lunge without its windup`);
      ok(L.dropped, `${tag}: never reached the ring`);
      ok(L.drum, `${tag}: DOROTHY is not on the ground at the ring`);
      ok(L.immuneAtDrop >= 1.0, `${tag}: no grace when DOROTHY went down (${L.immuneAtDrop})`);
      ok(L.hits.every((h) => h.sinceDrop === null || h.sinceDrop > 1.0 || h.phase !== 'rip'), `${tag}: hit inside the grace period`);
      ok(L.deploy && L.dorothy && L.swarm && L.cine, `${tag}: DEPLOY did not send the swarm`);
      ok(L.killSeat === 'rocket' && L.killTether, `${tag}: the kill shot was not on Sparks' truck with the storm still on the line`);
      ok(L.result && L.result.won && L.result.reason === 'destroyed' && !L.result.tug && !L.result.tether, `${tag}: no victory`);
      if (driver === 'attentive') ok(lungeHits.length === 0, `${tag}: an attentive driver was bitten by a telegraphed lunge ${JSON.stringify(lungeHits)}`);
    }
    // the line runs out with nobody coming: the storm is let go, as before
    const E = await finale(page, { id, seed: 31, driver: 'idle', scenario: 'expire' });
    console.log(`${id.padEnd(8)} line runs out: phase ${E.after.phase}, strength back to ${E.after.hp.toFixed(2)}`);
    ok(E.after.phase === 'chase' && !E.after.line && !E.after.tether && !E.after.tug && Math.abs(E.after.hp - E.after.hookRecover) < 1e-6, `${id}: the line running out did not let the storm go cleanly`);
    // straight into the wall: thrown back out, hurt once per contact, never inside the grace period
    const W = await finale(page, { id, seed: 41, driver: 'wall', scenario: 'wall' });
    const wh = W.hits.filter((h) => h.phase === 'rip'); let spaced = true; for (let i = 1; i < wh.length; i++) if (wh[i].t - wh[i - 1].t < 1.05) spaced = false;
    console.log(`${id.padEnd(8)} into the wall: ${wh.length} hits ${wh.map((h) => h.t.toFixed(2)).join(', ')}, hull ${Math.round(W.hull)}`);
    ok(wh.length >= 1, `${id}: driving into the wall did not hurt`); ok(spaced, `${id}: repeated damage from one contact`);
    ok(wh.every((h) => h.sinceDrop === null || h.sinceDrop > 1.0), `${id}: the wall hurt inside the grace period`);
  }
  // ---- seats and cinematics (2.7): every seat change the game makes says why; DOROTHY and the kill shot skip once seen ----
  const cineRun = (opts) => page.evaluate(async ({ calm, skipAt }) => {
    const { STORMS, FEEL } = await import('/src/config.js'); const G = window.__G, frame = () => new Promise((r) => requestAnimationFrame(r));
    G.fx.calm = calm; G.tetherSeed = 7; G.startMission(STORMS[0]); G.fast = 4; const m = G.mission, s = m.storm, out = { notes: {}, skips: {} };
    const tap = () => window.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', pointerId: 91 }));
    const until = async (c, secs, what) => { const t0 = m.time; while (!c()) { if (m.time - t0 > secs) throw new Error(`timed out: ${what} (phase ${m.phase}, cine ${m.cine && m.cine.kind}, reload ${m.reload}, dist ${Math.round(m.dist)}, rockets on ${G.fx.rockets.filter((r) => r.on).length})`); await frame(); } };
    const note = (k) => { out.notes[k] = m.coachLine(); out.tones = out.tones || {}; out.tones[k] = document.getElementById('hud-coach').className; };
    // into the zone: put on the gun by the game
    m.rig.place(s.x + 150, s.z, -Math.PI / 2, G.world); m.storm.vx = 0; await until(() => m.view === 'gun', 5, 'auto seat'); note('auto'); await frame(); await frame(); out.tones.auto = document.getElementById('hud-coach').className;
    while (s.bandsLeft > 1) { await until(() => m.phase === 'chase', 30, 'chase'); if (m.view !== 'gun') m.enterGun('auto'); m.damageStorm(m.hp + 1, { x: s.x, y: 40, z: s.z }); note('band'); }
    await until(() => m.phase === 'chase', 30, 'last band'); m.damageStorm(m.hp + 1, { x: s.x, y: 40, z: s.z }); note('harpoon');
    await until(() => { if (m.phase === 'stagger' && !m.harpoonBusy) m.fireHarpoon(); return m.phase === 'rip'; }, 12, 'hook'); note('bus');
    m.rig.place(s.ax + m.dropR + 2, s.az, -Math.PI / 2, G.world); m.home.place(s.ax - 140, s.az, Math.PI / 2, G.world); await until(() => m.dropped, 6, 'drop'); // your own rig where its autodrive holds it
    // DEPLOY, and a tap in the same moment: that tap started it, it must not skip it
    G.fast = 1; m.act(); tap(); await frame(); await frame(); const t0 = m.time; await until(() => m.time - t0 > 0.5, 3, 'half a second'); out.skips.deployTap = m.phase !== 'dorothy';
    if (skipAt !== null) { tap(); for (let i = 0; i < 4; i++) await frame(); out.skips.dorothy = { phase: m.phase, after: +(m.time - t0).toFixed(2), coach: m.coachLine() }; }
    G.fast = 4; await until(() => m.phase === 'kill', 8, 'kill'); note('kill'); out.killSeat = m.gn.seatId; out.view = G.input.mode;
    out.guarded = !G.input.firing; await until(() => m.reload <= 0 && m.gn.locked, 5, 'lock'); G.fast = 1; m.killShot(); await frame(); await frame(); const t1 = m.time; await until(() => m.time - t1 > 0.35 || m.result, 3, 'rocket away');
    out.skipLine = m.cine ? m.coachLine() : null; if (skipAt !== null) { tap(); for (let i = 0; i < 4; i++) await frame(); out.skips.kill = { result: m.result && m.result.reason, after: +(m.time - t1).toFixed(2) }; }
    await until(() => !!m.result, 8, 'result'); out.seen = { ...G.save.s.seen }; out.result = m.result.reason; G.fx.calm = false; G.fast = 1;
    // the reasons for the game taking your seat back: the line running out
    return out;
  }, opts);
  await page.evaluate(() => { const S = window.__G.save; S.s.seen = { dorothy: false, kill: false }; S.write(); });
  const C1 = await cineRun({ calm: false, skipAt: 0.5 });
  console.log('first time through:', JSON.stringify(C1));
  ok(C1.skips.dorothy && C1.skips.dorothy.phase === 'dorothy', 'the first DOROTHY ride was skippable');
  ok(C1.skips.kill && !C1.skips.kill.result, 'the first kill-shot camera was skippable');
  ok(C1.seen.dorothy && C1.seen.kill && C1.result === 'destroyed', 'watching both cinematics to the end did not mark them seen');
  ok(/^IN RANGE: YOU SHOOT, IT DRIVES$/.test(C1.notes.auto) && /seat/.test(C1.tones.auto), `no reason for the automatic seat change to the gun (${C1.notes.auto}, ${C1.tones.auto})`);
  ok(/^BAND OFF: YOUR WHEEL/.test(C1.notes.band), `no reason for being put back at the wheel (${C1.notes.band})`);
  ok(/WINCH/.test(C1.notes.harpoon) && /DOC'S BUS/.test(C1.notes.bus) && /SPARKS/.test(C1.notes.kill), `no reason for a crew seat change (${C1.notes.harpoon} / ${C1.notes.bus} / ${C1.notes.kill})`);
  for (const calm of [false, true]) {
    const C2 = await cineRun({ calm, skipAt: 0.5 });
    console.log(`seen before${calm ? ', calm' : ''}:`, JSON.stringify(C2.skips), C2.skipLine, C2.killSeat);
    ok(!C2.skips.deployTap, `${calm ? 'calm: ' : ''}the DEPLOY tap skipped the cinematic it started`);
    ok(C2.skips.dorothy && C2.skips.dorothy.phase === 'kill', `${calm ? 'calm: ' : ''}a tap did not skip a DOROTHY ride already seen (${JSON.stringify(C2.skips.dorothy)})`);
    ok(C2.killSeat === 'rocket' && C2.view === 'gun' && C2.guarded, `${calm ? 'calm: ' : ''}skipping DOROTHY did not land on Sparks' launcher like the ride does`);
    ok(/SKIP/.test(C2.skipLine || ''), `${calm ? 'calm: ' : ''}no TAP TO SKIP on a cinematic already seen`);
    ok(C2.skips.kill && C2.skips.kill.result === 'destroyed', `${calm ? 'calm: ' : ''}a tap did not skip the kill-shot camera (${JSON.stringify(C2.skips.kill)})`);
  }

  // ---- the Daily Storm (2.8): one scored attempt, practice after, the same fight at any frame rate, a share that stays local ----
  const DAY = '2026-11-12';
  const dailyRun = (opts) => page.evaluate(async ({ day, fast, noise, finish }) => {
    const { dailyFor } = await import('/src/daily.js'); const G = window.__G, frame = () => new Promise((r) => requestAnimationFrame(r));
    const R = Math.random; if (noise) { let x = noise; Math.random = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; } // different cosmetic randomness
    G.startDaily('scored', day); G.fast = fast; const m = G.mission, trail = { j: [], a: [] }, jr = m.rj, ra = m.ra, hail0 = +G.weather.nextHail.toFixed(6);
    m.rj = () => { const v = jr(); trail.j.push(v); return v; }; m.ra = () => { const v = ra(); trail.a.push(v); return v; };
    G.bot = true; while (m.time < 40 && !m.result) await frame(); G.bot = false;
    const out = { storm: m.def.id, want: dailyFor(day).storm.id, daily: m.daily, j: trail.j.slice(0, 8).map((v) => v.toFixed(8)), a: trail.a.slice(0, 16).map((v) => v.toFixed(8)), hail0, used: G.save.s.daily.used, chip: document.getElementById('storm-ef').textContent };
    if (finish) { // see it to the end: shed every band, harpoon, DOROTHY, kill shot
      G.fast = 6; const s = m.storm; m.rig.hull = m.rig.hullMax;
      while (!m.result) { if (m.phase === 'chase') m.damageStorm(m.hp + 1, { x: s.x, y: 40, z: s.z }); else if (m.phase === 'stagger' && !m.harpoonBusy) m.fireHarpoon(); else if (m.phase === 'rip') { if (!m.dropped) { m.rig.place(s.ax + m.dropR + 2, s.az, -Math.PI / 2, G.world); m.home.place(s.ax - 140, s.az, Math.PI / 2, G.world); } else m.act(); } else if (m.phase === 'kill' && m.reload <= 0 && m.gn.locked) m.killShot(); await frame(); }
      while (!G.resultShown) await frame(); out.tether = m.tetherSeed === dailyFor(day).tetherSeed; out.result = { ...G.save.s.daily.result, rows: undefined }; out.streak = { ...G.save.s.streak }; out.share = !document.getElementById('res-share').hidden; out.grade = document.getElementById('res-letter').textContent;
    }
    Math.random = R; G.fast = 1; return out;
  }, opts);
  await page.evaluate((day) => { const S = window.__G.save; S.s.daily = { day, used: false, result: null }; S.s.streak = { count: 2, last: '2026-11-11', best: 2 }; S.write(); }, DAY);
  const D1 = await dailyRun({ day: DAY, fast: 6, noise: 0, finish: false });
  console.log('daily, first:', JSON.stringify({ storm: D1.storm, daily: D1.daily, used: D1.used, chip: D1.chip, hail: D1.hail0 }));
  ok(D1.storm === D1.want && D1.daily === 'scored' && D1.used && D1.chip === 'DAILY', `the scored Daily Storm did not start on today's storm (${JSON.stringify(D1)})`);
  const D2 = await dailyRun({ day: DAY, fast: 2, noise: 12345, finish: true }); // same day again: practice now, at another frame rate, with other cosmetic noise
  ok(D2.daily === 'practice' && D2.chip === 'PRACTICE', `a second Daily Storm the same day was not practice (${D2.daily}, ${D2.chip})`);
  ok(JSON.stringify(D1.j) === JSON.stringify(D2.j) && JSON.stringify(D1.a) === JSON.stringify(D2.a) && D1.storm === D2.storm, 'the same day drew different jukes or throws');
  ok(D1.hail0 === D2.hail0, `the same day's first hail core was drawn differently (${D1.hail0} / ${D2.hail0})`);
  ok(D2.tether, "the line's seed was not the day's");
  ok(D2.result && D2.result.abandoned, 'restarting the scored Daily Storm did not spend it'); // D2 replaced the scored run D1 left unfinished
  ok(D2.streak.count === 2, 'practice moved the streak');
  // a scored run played to the end: tomorrow's, so the attempt is fresh. It records the result and extends the streak
  const D3 = await dailyRun({ day: '2026-11-13', fast: 6, noise: 0, finish: true }); // the streak was last extended on the 11th: the 12th was not finished
  console.log('daily, scored to the end:', JSON.stringify({ result: D3.result, streak: D3.streak, grade: D3.grade, share: D3.share }));
  ok(D3.daily === 'scored' && D3.result && D3.result.won && D3.result.letter && D3.share && D3.grade === D3.result.letter, `a scored Daily Storm did not record its result (${JSON.stringify(D3.result)})`);
  ok(D3.streak.count === 1 && D3.streak.last === '2026-11-13', `a missed day did not reset the streak (${JSON.stringify(D3.streak)})`);
  // Share: the system sheet when there is one, the clipboard when not. Nothing is sent anywhere else.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const shared = await page.evaluate(async () => {
    let sent = null; navigator.share = async (d) => { sent = d.text; }; navigator.canShare = () => true;
    document.getElementById('res-share').click(); await new Promise((r) => setTimeout(r, 200)); const viaSheet = sent;
    delete navigator.share; navigator.share = undefined; document.getElementById('res-share').click(); await new Promise((r) => setTimeout(r, 300));
    let clip = null; try { clip = await navigator.clipboard.readText(); } catch { clip = 'unreadable'; }
    return { viaSheet, clip, label: document.getElementById('res-share').textContent };
  });
  console.log('share:', JSON.stringify(shared));
  ok(shared.viaSheet && /^Tornado Hunter · Daily Storm · 13 Nov 2026\n.+ · [SABCD] · \d+:\d\d\n🚚 /.test(shared.viaSheet), `the share text is wrong: ${shared.viaSheet}`);
  ok(shared.clip === shared.viaSheet && shared.label === 'Copied', `the clipboard fallback did not copy the same text (${shared.label})`);

  // a version 1 save, loaded cold: nothing lost, the new fields at their defaults, the Daily Storm on the title
  {
    const fixture = fs.readFileSync(path.join(ROOT, 'tests/fixtures/save-v1.json'), 'utf8');
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }); await ctx.addInitScript((v) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('tornado-hunter/v1', v); sessionStorage.setItem('seeded', '1'); } }, fixture);
    const p2 = await ctx.newPage(); const errs = []; p2.on('pageerror', (e) => errs.push(String(e)));
    await p2.goto(URL); await p2.waitForFunction(() => window.__G && window.__G.ui && document.getElementById('loading').hidden, null, { timeout: 60000 });
    const v1 = await p2.evaluate(() => { const S = window.__G.save.s; window.__G.ui.show('hq'); return { data: S.data, kills: S.kills, rig: S.loadout.rig, gadget: S.loadout.gadget, calm: S.settings.calm, seen: S.seen, grades: S.grades, streak: S.streak, hqData: document.getElementById('hq-data').textContent, dailyShown: (window.__G.ui.show('title'), !document.getElementById('title-daily').hidden), streakText: document.getElementById('daily-streak').textContent }; });
    console.log('v1 save:', JSON.stringify(v1));
    ok(v1.data === 412 && v1.kills.agnes === 1 && v1.rig === 'bulldog' && v1.gadget === 'thumper' && v1.calm && v1.hqData === '412', `a version 1 save lost something (${JSON.stringify(v1)})`);
    ok(v1.seen && !v1.seen.dorothy && v1.grades && !Object.keys(v1.grades).length && v1.streak.count === 0 && v1.dailyShown && v1.streakText === 'No streak yet', `a version 1 save did not get the new fields (${JSON.stringify(v1)})`);
    ok(errs.length === 0, `v1 save: page errors ${errs.join(' | ')}`);
    await ctx.close();
  }

  // ---- the grain elevator (2.9): it triggers, it telegraphs, the escape line is clean; never in the finale, hail or the wall ----
  const elevator = (lane, kind = 'force') => page.evaluate(async ({ lane, kind }) => {
    const { STORMS, SETPIECE } = await import('/src/config.js'); const G = window.__G, frame = () => new Promise((r) => requestAnimationFrame(r));
    G.setpiece = kind; G.startMission(STORMS[0]); G.fast = 3; const m = G.mission, sp = m.sp, log = { lane, kind: sp.kind, hits: 0, warned: [], creak: null, fall: null, held: { auto: true, guns: null, throws: 0 } };
    m.time = SETPIECE.after + 0.5; m.rig.boostCharge = 0; // past the first minute, boost spent so the payout shows
    const hurt = m.hurt.bind(m); m.hurt = (n, k) => { const d = hurt(n, k); if (d) log.hits++; return d; };
    const atk = m.attack.bind(m); m.attack = () => { if (sp.busy) log.held.throws++; return atk(); };
    const ab = m.rig.addBoost.bind(m.rig); log.paid = []; m.rig.addBoost = (n) => { if (Math.abs(n - SETPIECE.give) < 1e-9) log.paid.push(n); return ab(n); }; // the clean-escape payout, told apart from drift and near-miss top-ups
    const axes0 = G.input.axes;
    G.input.axes = () => { const r = m.rig; if (!sp.O) return { steer: 0, throttle: 1 }; const P = sp.frame(r), want = lane === 'escape' ? (sp.tip + sp.half) / 2 : -2; // the middle of the escape lane, or the near lane
      const tx = r.x + sp.F.x * 40 + sp.N.x * (want - P.u), tz = r.z + sp.F.z * 40 + sp.N.z * (want - P.u), dx = tx - r.x, dz = tz - r.z, l = Math.hypot(dx, dz), hx = Math.sin(r.heading), hz = Math.cos(r.heading);
      return { steer: Math.max(-1, Math.min(1, (hx * dz / l - hz * dx / l) * 3)), throttle: 1 }; };
    try {
      while (sp.state !== 'done' && sp.state !== 'spent' && m.time < 45) {
        if (sp.state === 'creak' && log.creak === null) log.creak = m.time;
        if (sp.state === 'fall') {
          if (log.fall === null) { log.fall = m.time; log.boost0 = m.rig.boostCharge; log.coach = m.coachLine(); log.gunsRefused = !m.act(); log.action = m.actionState().hint; }
          for (const p of sp.pieces) { if (!p.landed && p.fill.visible && p.marks.every((e) => e.visible)) p.markedUntil = m.time; if (p.landed && p.warned === undefined) { p.warned = +(p.markedUntil - log.fall).toFixed(3); log.warned.push(p.warned); } }
        }
        if (sp.busy && m.view === 'gun') log.held.auto = false;
        await frame();
      }
      for (const p of sp.pieces || []) if (p.warned === undefined) { p.warned = +((p.markedUntil ?? 0) - log.fall).toFixed(3); log.warned.push(p.warned); }
      log.state = sp.state; log.boost1 = m.rig.boostCharge; log.clean = log.hits === 0; log.pieces = (sp.pieces || []).length; log.wires = !!sp.wires;
      return log;
    } finally { G.input.axes = axes0; G.setpiece = undefined; G.fast = 1; }
  }, { lane, kind });
  for (const lane of ['escape', 'near']) {
    const E = await elevator(lane);
    console.log(`elevator, ${lane} lane:`, JSON.stringify(E));
    ok(E.kind === 'elevator' && E.pieces === 3 && !E.wires, `elevator/${lane}: not the elevator (${E.kind}, ${E.pieces} pieces)`);
    ok(E.creak !== null && E.fall !== null && E.fall - E.creak >= 0.4, `elevator/${lane}: it did not creak and then fall (${E.creak}, ${E.fall})`);
    ok(E.warned.length === 3 && E.warned.every((w) => w >= 1.2 - 1 / 30), `elevator/${lane}: a piece came down with under 1.2 s marked (${E.warned})`);
    ok(E.gunsRefused && E.action === 'NOT NOW' && E.held.auto && E.held.throws === 0, `elevator/${lane}: the game took the wheel, gave the gun, or threw while it fell (${JSON.stringify(E.held)}, ${E.gunsRefused})`);
    ok(/OR TAKE THE FIELD/.test(E.coach), `elevator/${lane}: no way out on the coach line (${E.coach})`);
    if (lane === 'escape') ok(E.hits === 0 && E.paid.length === 1 && E.paid[0] === 0.6, `elevator: a truck on the escape line was hit, or not paid 60% of a boost for it (hits ${E.hits}, paid ${E.paid})`);
    else ok(E.hits >= 1 && E.paid.length === 0, `elevator: a truck holding the near lane was not hit, or was paid (hits ${E.hits}, paid ${E.paid})`);
  }
  // the power lines (2.10): the same bar, six poles, and never the elevator's fight
  for (const lane of ['escape', 'near']) {
    const L = await elevator(lane, 'lines');
    console.log(`power lines, ${lane} lane:`, JSON.stringify(L));
    ok(L.kind === 'lines' && L.pieces === 6 && L.wires, `lines/${lane}: not the power lines (${L.kind}, ${L.pieces} poles)`);
    ok(L.creak !== null && L.fall !== null && L.fall - L.creak >= 0.4, `lines/${lane}: they did not sway and then fall (${L.creak}, ${L.fall})`);
    ok(L.warned.length === 6 && L.warned.every((w) => w >= 1.2 - 1 / 30) && L.warned.every((w, i) => !i || w > L.warned[i - 1]), `lines/${lane}: a pole came down with under 1.2 s marked, or out of sequence (${L.warned})`);
    ok(L.gunsRefused && L.action === 'NOT NOW' && L.held.auto && L.held.throws === 0, `lines/${lane}: the game took the wheel, gave the gun, or threw while they fell (${JSON.stringify(L.held)}, ${L.gunsRefused})`);
    ok(/OR TAKE THE FIELD/.test(L.coach), `lines/${lane}: no way out on the coach line (${L.coach})`);
    if (lane === 'escape') ok(L.hits === 0 && L.paid.length === 1 && L.paid[0] === 0.6, `lines: a truck on the escape line was hit, or not paid 60% of a boost for it (hits ${L.hits}, paid ${L.paid})`);
    else ok(L.hits >= 1 && L.paid.length === 0, `lines: a truck holding the near lane was not hit, or was paid (hits ${L.hits}, paid ${L.paid})`);
  }
  // one set piece a fight: 400 unforced fights' worth of draws, and no mission ever holds both
  const both = await page.evaluate(async () => { const { SetPiece } = await import('/src/setpiece.js'); const G = window.__G, n = { elevator: 0, lines: 0, none: 0 }; for (let i = 0; i < 400; i++) { const k = new SetPiece({ G, seed: null, coach: false }).kind; n[k || 'none']++; } const coached = new SetPiece({ G, seed: null, coach: true }).kind; return { n, coached }; });
  console.log('set pieces over 400 fights:', JSON.stringify(both));
  ok(both.n.elevator > 100 && both.n.elevator < 175 && both.n.lines > 50 && both.n.lines < 115 && both.coached === null, `set pieces: the shares are off, or one came in the coached storm (${JSON.stringify(both)})`);
  // the rules: only in a chase at the wheel, never in the finale, a hail core or the debris wall
  const rules = await page.evaluate(async () => {
    const { STORMS, SETPIECE } = await import('/src/config.js'); const G = window.__G, all = {};
   for (const kind of ['force', 'lines']) {
    G.setpiece = kind; G.startMission(STORMS[0]); const m = G.mission, sp = m.sp, W = G.weather; m.time = SETPIECE.after + 1;
    const out = all[kind] = { chase: sp.eligible() };
    W.spell = 5; out.hail = sp.eligible(); W.spell = 0; W.nextHail = 3; out.hailSoon = sp.eligible(); W.nextHail = 99;
    m.surge = { x: 0, z: 0, r: 30 }; out.wall = sp.eligible(); m.surge = null;
    for (const ph of ['stagger', 'rip', 'dorothy', 'kill', 'surge']) { m.phase = ph; out[ph] = sp.eligible(); } m.phase = 'chase';
    m.enterGun('manual'); out.gun = sp.eligible(); m.leaveGun(true);
    // and once it is going the hail waits for it
    sp.arm(sp.road() || sp.track()); sp.state = 'fall'; sp.fallT = 0; W.spell = 0; W.nextHail = 0.01; const before = W.spells; W.update(0.5, 1, m, m.storm, G.camera); out.hailStarted = W.spells !== before;
   }
    G.setpiece = undefined; return all;
  });
  console.log('set piece rules:', JSON.stringify(rules));
  for (const [kind, r] of Object.entries(rules)) ok(r.chase && !r.hail && !r.hailSoon && !r.wall && !r.gun && ['stagger', 'rip', 'dorothy', 'kill', 'surge'].every((k) => !r[k]) && !r.hailStarted, `${kind === 'force' ? 'elevator' : kind}: it could come at the wrong time ${JSON.stringify(r)}`);

  // losing still ends the fight
  const lost = await page.evaluate(async () => { const { STORMS } = await import('/src/config.js'); const G = window.__G; G.startMission(STORMS[0]); const m = G.mission; m.rig.hull = 5; m.rig.immune = 0; m.hurt(20); return m.result && { won: m.result.won, reason: m.result.reason }; });
  ok(lost && !lost.won && lost.reason === 'wrecked', 'a wreck did not end the fight'); console.log('wreck:', JSON.stringify(lost));
  ok(errors.length === 0, `page errors: ${errors.join(' | ')}`);

  if (SHOTS) {
    for (const [w, h, tag] of [[390, 844, 'portrait'], [844, 390, 'landscape']]) {
      await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(400);
      for (const id of ['pete', 'agnes', 'sisters']) await shoot(page, id, path.join(SHOTS, `${id}-${tag}.png`));
    }
    console.log('screenshots in', SHOTS);
  }
  await browser.close();
} finally { server.kill(); }
console.log(`\n${checks - fails.length}/${checks} checks passed`);
process.exit(fails.length ? 1 : 0);
