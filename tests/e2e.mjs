// The finale, played in a real browser: node tests/e2e.mjs  (needs Playwright with Chromium; serves the repo itself)
// For each storm: shed the outer bands, harpoon, drive Doc's bus to the ring past the lunges, set DOROTHY down, DEPLOY,
// and fire Sparks' kill shot. Two drivers: an attentive one that steps out of the way of a telegraphed lunge, and a naive
// one that drives straight at the ring whatever the storm does. Plus: the line running out, driving into the wall, and a wreck.
// Deterministic tether seeds (G.tetherSeed). This proves the systems work together; it does not prove the Sisters feel fair.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

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
    log.hooked = { bus: !!m.home && m.rig.def.id === 'bus', tether: !!m.tether, seed: m.tetherSeed, mph: m.stormMph, hookT: m.hookT };
    log.radius = m.tether.radius; log.wall = m.dropR - FEEL.dropMargin + TETHER.hitPad;
    // ---- record every step on the line ----
    const orig = m.update.bind(m); let px = s.x - s.ax, pz = s.z - s.az, dropAt = null;
    m.update = (dt, t, axes, input) => {
      const was = m.phase; orig(dt, t, axes, input); const te = m.tether;
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

  for (const id of ['pete', 'agnes', 'sisters']) {
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
