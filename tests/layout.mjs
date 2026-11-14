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
  pause: async () => { // the pause menu, the Sound button on its longest setting
    const G = window.__G, { STORMS } = await import('/src/config.js'); G.startMission(STORMS[0]); for (let i = 0; i < 10; i++) await new Promise((r) => requestAnimationFrame(r));
    G.setPaused(true); const b = document.getElementById('p-sound'); for (let i = 0; i < 3 && b.textContent !== 'Sound on, music off'; i++) b.click();
  },
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

// a fight played straight to its results screen (bands shed by the test, the finale's steps taken as soon as they open)
const FINISH = `async (m, G) => { const s = m.storm, frame = () => new Promise((r) => requestAnimationFrame(r)); G.fast = 6;
  while (!m.result) { if (m.phase === 'chase') { m.stats.close += 1; m.damageStorm(m.hp + 1, { x: s.x, y: 40, z: s.z }); } else if (m.phase === 'stagger' && !m.harpoonBusy) m.fireHarpoon(); else if (m.phase === 'rip') { if (!m.dropped) { m.rig.place(s.ax + m.dropR + 2, s.az, -Math.PI / 2, G.world); m.home.place(s.ax - 140, s.az, Math.PI / 2, G.world); } else m.act(); } else if (m.phase === 'kill' && m.reload <= 0 && m.gn.locked) { m.stats.rounds = 940; m.stats.fired = 702; m.stats.crits = 241; m.rig.hull = m.rig.hullMax * 0.71; m.time = 88.4; m.killShot(); } await frame(); } // a believable fight for the numbers on the screen, set before the grade is worked out
  while (!G.resultShown) await frame(); G.fast = 1; }`;
Object.assign(STATES, {
  // the title once the Daily Storm is open: today's storm, the streak, how today went
  'title-daily': async () => { const G = window.__G, { dayKey } = await import('/src/daily.js'); if (G.mission) G.toHQ(); const S = G.save.s; S.kills.pete = S.kills.pete || 1; S.seenCoach = true; S.streak = { count: 4, last: dayKey(), best: 6 }; S.daily = { day: dayKey(), used: true, result: { won: true, letter: 'A', time: 102 } }; G.ui.show('title'); },
  results: async () => { const G = window.__G, { STORMS } = await import('/src/config.js'); G.save.s.grades.agnes = 'B'; G.startMission(STORMS[1]); await (FINISH_FN)(G.mission, G); },
  'results-daily': async () => { const G = window.__G, { dayKey } = await import('/src/daily.js'); G.save.s.daily = { day: dayKey(), used: false, result: null }; G.startDaily('scored'); await (FINISH_FN)(G.mission, G); },
  // the grain elevator coming down: the strips marked, the way out on the coach line, GUNS: NOT NOW
  elevator: async () => {
    const G = window.__G, { STORMS, SETPIECE } = await import('/src/config.js'), frame = () => new Promise((r) => requestAnimationFrame(r)); G.setpiece = 'force'; G.startMission(STORMS[0]); G.fast = 2; const m = G.mission, sp = m.sp; m.time = SETPIECE.after + 0.5;
    const axes0 = G.input.axes; G.input.axes = () => { const r = m.rig; if (!sp.O) return { steer: 0, throttle: 1 }; const P = sp.frame(r), want = (sp.tip + sp.half) / 2, tx = r.x + sp.F.x * 40 + sp.N.x * (want - P.u), tz = r.z + sp.F.z * 40 + sp.N.z * (want - P.u), dx = tx - r.x, dz = tz - r.z, l = Math.hypot(dx, dz), hx = Math.sin(r.heading), hz = Math.cos(r.heading); return { steer: Math.max(-1, Math.min(1, (hx * dz / l - hz * dx / l) * 3)), throttle: 1 }; };
    while (!(sp.state === 'fall' && sp.fallT >= 1.0)) await frame(); G.input.axes = axes0; G.setpiece = undefined; G.fx.stopT = 1e9;
  },
  // the power lines coming down: six strips marked down the road, the wires, the way out
  lines: async () => {
    const G = window.__G, { STORMS, SETPIECE } = await import('/src/config.js'), frame = () => new Promise((r) => requestAnimationFrame(r)); G.setpiece = 'lines'; G.startMission(STORMS[0]); G.fast = 2; const m = G.mission, sp = m.sp; m.time = SETPIECE.after + 0.5;
    const axes0 = G.input.axes; G.input.axes = () => { const r = m.rig; if (!sp.O) return { steer: 0, throttle: 1 }; const P = sp.frame(r), want = (sp.tip + sp.half) / 2, tx = r.x + sp.F.x * 40 + sp.N.x * (want - P.u), tz = r.z + sp.F.z * 40 + sp.N.z * (want - P.u), dx = tx - r.x, dz = tz - r.z, l = Math.hypot(dx, dz), hx = Math.sin(r.heading), hz = Math.cos(r.heading); return { steer: Math.max(-1, Math.min(1, (hx * dz / l - hz * dx / l) * 3)), throttle: 1 }; };
    while (!(sp.state === 'fall' && sp.fallT >= 1.1)) await frame(); G.input.axes = axes0; G.setpiece = undefined; G.fx.stopT = 1e9;
  },
  // on the gun, looking up, with a piece that will land on the truck: its ring in the sky, the coach line naming it
  threat: async () => {
    const G = window.__G, { STORMS } = await import('/src/config.js'), frame = () => new Promise((r) => requestAnimationFrame(r)); G.setpiece = 'never'; G.startMission(STORMS[1]); const m = G.mission, s = m.storm; m.attackT = 99;
    m.rig.place(s.x + 190, s.z + 60, -Math.PI / 2, G.world); m.rig.vx = -40; m.rig.speed = 40; for (let i = 0; i < 25; i++) await frame(); if (m.view !== 'gun') m.enterGun('auto'); for (let i = 0; i < 30; i++) await frame(); m.attackT = 99;
    m.throwAt('tractor', 1.0, 0); m.throwAt('cow', 1.0, 18, 0.1); const z = m.hz[0]; while (z.h.t < z.h.dur - 1.0) await frame();
    const g = m.gn, e = G.camera.position, dx = z.h.x - e.x, dy = z.h.y - e.y, dz = z.h.z - e.z; g.yaw = Math.atan2(dx, dz) + 0.28; g.pitch = Math.atan2(dy, Math.hypot(dx, dz)) - 0.12; // the sights beside it, as a thumb chasing it would have them
    for (let i = 0; i < 3; i++) await frame(); G.setpiece = undefined; G.fx.stopT = 1e9;
  },
  // the harpoon seat while Winch's truck is still closing to range: no lock, the reason on the coach line and the button
  closing: async () => {
    const G = window.__G, { STORMS } = await import('/src/config.js'), frame = () => new Promise((r) => requestAnimationFrame(r)); G.setpiece = 'never'; G.startMission(STORMS[0]); G.fast = 4; const m = G.mission, s = m.storm, u = m.convoy.unit('harpoon');
    while (s.bandsLeft > 1) { while (m.phase !== 'chase') await frame(); m.damageStorm(m.hp + 1, { x: s.x, y: 40, z: s.z }); }
    while (m.phase !== 'chase') await frame(); u.x = s.x + 430; u.z = s.z; m.damageStorm(m.hp + 1, { x: s.x, y: 40, z: s.z }); G.fast = 1;
    G.bot = true; const t0 = m.time; while (m.time - t0 < 2.4 && m.phase === 'stagger') await frame(); G.bot = false; G.setpiece = undefined; G.fx.stopT = 1e9;
  },
  'results-lost': async () => { const G = window.__G, { STORMS } = await import('/src/config.js'); G.startMission(STORMS[2]); const m = G.mission; for (let i = 0; i < 20; i++) await new Promise((r) => requestAnimationFrame(r)); m.rig.hull = 5; m.rig.immune = 0; m.hurt(20); while (!G.resultShown) await new Promise((r) => requestAnimationFrame(r)); },
});

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
      const sc = b.closest('.hq-body'); if (!sc || sc.scrollHeight <= sc.clientHeight) out.off.push(`${name} at ${Math.round(r.left)},${Math.round(r.top)}`); // inside the scrolling HQ list is fine; a results or pause button must be on screen
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
  // a mark for a piece that will hit must be clear of the plates along the top and of the coach line
  for (const e of document.querySelectorAll('#marks i.hit')) { if (e.hidden) continue; const r = e.getBoundingClientRect(); for (const id of ['hud-storm', 'hud-coach', 'hud-hull', 'hud-speed']) { const B = document.getElementById(id).getBoundingClientRect(); if (shown(document.getElementById(id)) && r.left < B.right && B.left < r.right && r.top < B.bottom && B.top < r.bottom) out.overlap.push(`hit mark / ${id}`); } }
  const boxes = ids.map((id) => { const e = document.getElementById(id); return e && shown(e) && !document.getElementById('hud').hidden ? [id, e.getBoundingClientRect()] : null; }).filter(Boolean);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const [a, A] = boxes[i], [b, B] = boxes[j], x = Math.min(A.right, B.right) - Math.max(A.left, B.left), y = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
    if (x > 1 && y > 1) out.overlap.push(`${a} / ${b} (${Math.round(x)}x${Math.round(y)})`);
  }
  // the title: its block never runs into the credit at the bottom
  const tb = document.querySelector('#title:not([hidden]) .title-block'), by = document.querySelector('#title:not([hidden]) .haveanapp-byline span');
  if (tb && by) { const A = tb.getBoundingClientRect(), B = by.getBoundingClientRect(); if (A.bottom > B.top + 1 && A.left < B.right && B.left < A.right) out.overlap.push(`title block / byline (${Math.round(A.bottom - B.top)} px)`); }
  return out;
}

export async function run(states = Object.keys(STATES), shots = SHOTS) {
  const browser = await chromium.launch();
  for (const [w, h] of SIZES) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: shots ? 2 : 1, hasTouch: true, isMobile: true });
    const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(URL); await page.waitForFunction(() => window.__G && window.__G.ui && document.getElementById('loading').hidden, null, { timeout: 60000 });
    for (const name of states) {
      await page.evaluate(`(${STATES[name].toString().replace('FINISH_FN', FINISH)})()`);
      if (['drive', 'gun', 'elevator', 'lines', 'threat', 'closing'].includes(name)) await page.touchscreen.tap(Math.round(w * 0.2), Math.round(h * 0.62)); // a thumb on the glass: the game knows it is on a phone
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
