// The music, measured: node tests/audio.mjs   (Playwright + Chromium; serves the repo itself)
// Nobody can listen to a test, so this one renders the score for a whole scripted fight on an OfflineAudioContext (the same
// music.js the game plays, on the same graph) and measures what comes out: every section is audible and none clips, the band
// is quieter out of range than on the gun, the win does not go silent before the results music starts, off is off.
// Then it plays a real fight in the page and checks the band follows it: section by section, the switch, the results screen.
// OUT=<folder> also writes the render as fight.wav, for ears and for a spectrogram.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8000 + Math.floor(Math.random() * 900), URL = `http://127.0.0.1:${PORT}/`, OUT = process.env.OUT || '';
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const fails = []; let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails.push(msg); console.log('  FAIL', msg); } };

// a fight as the score sees it: [seconds, name, state]. urgency ramps over a window where the game's would.
export const FIGHT = (storm) => [
  [9, 'camp', { scene: 'title', run: 0 }],
  [7, 'chase', { scene: 'mission', run: 1, storm, phase: 'chase', view: 'drive', inZone: false, stage: 0, hull: 1 }],
  [18, 'zone', { scene: 'mission', run: 1, storm, phase: 'chase', view: 'gun', inZone: true, stage: 0, hull: 1 }],
  [4, 'surge', { scene: 'mission', run: 1, storm, phase: 'surge', view: 'drive', stage: 1, hull: 0.84 }],
  [5, 'chase 2', { scene: 'mission', run: 1, storm, phase: 'chase', view: 'drive', inZone: false, stage: 1, hull: 0.84 }],
  [17, 'zone 2', { scene: 'mission', run: 1, storm, phase: 'chase', view: 'gun', inZone: true, stage: 1, hull: 0.6, threat: true }],
  [8, 'stagger', { scene: 'mission', run: 1, storm, phase: 'stagger', view: 'gun', stage: 1, hull: 0.6, ramp: 3 }],
  [13, 'rip', { scene: 'mission', run: 1, storm, phase: 'rip', view: 'drive', stage: 1, hull: 0.6, ramp: 5 }],
  [5, 'dorothy', { scene: 'mission', run: 1, storm, phase: 'rip', cine: 'pod', view: 'drive', stage: 1, hull: 0.6 }],
  [7, 'kill', { scene: 'mission', run: 1, storm, phase: 'kill', view: 'gun', stage: 1, hull: 0.6, ramp: 3 }],
  [2.5, 'killcine', { scene: 'mission', run: 1, storm, phase: 'kill', cine: 'rocket', view: 'gun', stage: 1, hull: 0.6 }],
  [6.8, 'won', { scene: 'mission', run: 1, storm, phase: 'won', won: true, stage: 1, hull: 0.6 }],
  [16, 'after', { scene: 'results', run: 1, storm, phase: 'won', won: true, stage: 1, hull: 0.6 }],
];

async function render(page, storm, opts = {}) {
  return page.evaluate(async ({ plan, wav, off, lost }) => {
    const { Music } = await import('/src/music.js');
    if (lost) { plan = plan.slice(0, 6); plan.push([1.8, 'lost', { ...plan[5][2], phase: 'lost', won: false }], [10, 'ashes', { ...plan[5][2], scene: 'results', phase: 'lost', won: false }]); }
    const SR = 44100, total = plan.reduce((p, s) => p + s[0], 0), ctx = new OfflineAudioContext(2, Math.ceil(SR * total), SR), merge = ctx.createChannelMerger(2), bus = ctx.createGain(), h1 = ctx.createBiquadFilter(), h2 = ctx.createBiquadFilter(), music = new Music(ctx, bus);
    // channel 0 is the band; channel 1 is what a phone's speaker keeps of it (nothing much under 300 Hz)
    h1.type = h2.type = 'highpass'; h1.frequency.value = h2.frequency.value = 300; bus.connect(merge, 0, 0); bus.connect(h1).connect(h2).connect(merge, 0, 1); merge.connect(ctx.destination);
    if (off) music.on = false;
    let t = 0; const marks = [];
    for (const [dur, name, st] of plan) { const t0 = t, t1 = t + dur; marks.push({ name, t0, t1 }); for (; t < t1 - 1e-6; t += 0.05) music.advance(Math.min(t1, t + 0.05), st.ramp ? { ...st, urgency: Math.max(0, Math.min(1, 1 - (t1 - t) / st.ramp)) } : st, t); t = t1; }
    const buf = await ctx.startRendering(), d = buf.getChannelData(0), ph = buf.getChannelData(1);
    const stat = (a, b) => { let pk = 0, sq = 0, sp = 0; const i0 = Math.floor(a * SR), i1 = Math.min(d.length, Math.floor(b * SR)); for (let i = i0; i < i1; i++) { const v = d[i]; if (v > pk) pk = v; else if (-v > pk) pk = -v; sq += v * v; sp += ph[i] * ph[i]; } return { peak: +pk.toFixed(3), rms: +Math.sqrt(sq / Math.max(1, i1 - i0)).toFixed(4), phone: +Math.sqrt(sp / Math.max(1, i1 - i0)).toFixed(4) }; };
    const out = { total: +total.toFixed(1), notes: music.notes, all: stat(0, total), parts: marks.map((m) => ({ name: m.name, t0: +m.t0.toFixed(1), ...stat(m.t0 + Math.min(1, (m.t1 - m.t0) / 4), m.t1) })), seconds: [] };
    for (let s = 0; s + 1 <= total; s++) out.seconds.push(stat(s, s + 1).rms);
    if (wav) { const b = new ArrayBuffer(44 + d.length * 2), v = new DataView(b), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }; w(0, 'RIFF'); v.setUint32(4, 36 + d.length * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, SR, true); v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, d.length * 2, true); for (let i = 0; i < d.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true); const u = new Uint8Array(b); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); out.wav = btoa(s); }
    return out;
  }, { plan: FIGHT(storm), wav: !!opts.wav, off: !!opts.off, lost: !!opts.lost });
}

try {
  await new Promise((r) => setTimeout(r, 600));
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  // a tap on the speakers: whatever reaches the destination also reaches an analyser, so the page can be asked how loud it is
  await page.addInitScript(() => {
    const conn = AudioNode.prototype.connect; window.__tap = null;
    AudioNode.prototype.connect = function (dest, ...r) { if (dest instanceof AudioDestinationNode && !(dest.context instanceof OfflineAudioContext) && !window.__tap) { const an = dest.context.createAnalyser(); an.fftSize = 2048; window.__tap = { an, buf: new Float32Array(2048) }; conn.call(this, an); } return conn.call(this, dest, ...r); };
    window.__rms = () => { const t = window.__tap; if (!t) return 0; t.an.getFloatTimeDomainData(t.buf); let q = 0; for (const v of t.buf) q += v * v; return Math.sqrt(q / t.buf.length); };
  });
  await page.goto(URL); await page.waitForFunction(() => window.__G && window.__G.ui && document.getElementById('loading').hidden, null, { timeout: 60000 });

  // ---- the render: every storm's fight, measured ----
  for (const storm of ['pete', 'agnes', 'sisters']) {
    const R = await render(page, storm, { wav: !!OUT }), P = Object.fromEntries(R.parts.map((p) => [p.name, p]));
    if (R.wav) { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, `fight-${storm}.wav`), Buffer.from(R.wav, 'base64')); }
    console.log(`${storm}: ${R.total} s, ${R.notes} notes, peak ${R.all.peak}, rms ${R.all.rms}`);
    for (const p of R.parts) console.log(`   ${p.name.padEnd(9)} from ${String(p.t0).padStart(5)} s  peak ${p.peak.toFixed(3)}  rms ${p.rms.toFixed(4)}  on a phone ${p.phone.toFixed(4)}`);
    ok(R.all.peak < 0.65, `${storm}: the band alone peaks at ${R.all.peak} (it shares the master with the storm and the guns: under 0.65)`);
    for (const p of R.parts) ok(p.rms > 0.015 && p.rms < 0.13 && p.phone > 0.02, `${storm}/${p.name}: rms ${p.rms}, ${p.phone} of it above 300 Hz (want 0.015 to 0.13, and at least 0.02 a phone can play)`);
    ok(P.zone.rms > P.chase.rms * 1.1, `${storm}: on the gun (${P.zone.rms}) is not louder than the chase (${P.chase.rms})`);
    ok(P.rip.rms >= P.zone.rms * 0.95, `${storm}: on the line (${P.rip.rms}) is quieter than on the gun (${P.zone.rms})`);
    ok(P.camp.rms < P.zone.rms * 0.75 && P.after.rms < P.zone.rms * 0.75, `${storm}: the camp (${P.camp.rms}) and the results (${P.after.rms}) are not quieter than the fight (${P.zone.rms})`);
    ok(P.stagger.rms < P.zone.rms, `${storm}: the harpoon window (${P.stagger.rms}) does not drop back from the gun (${P.zone.rms})`);
    // the win: no silent second from the kill to the end of the results music
    const w0 = Math.floor(P.won.t0), quiet = R.seconds.slice(w0, w0 + 20).map((v, i) => [i, v]).filter(([, v]) => v < 0.004);
    ok(quiet.length === 0, `${storm}: after the kill, silent seconds at ${quiet.map(([i]) => i).join(', ')} (rms by second: ${R.seconds.slice(w0, w0 + 20).join(' ')})`);
  }
  const L = await render(page, 'pete', { lost: true }), lw = Math.floor(L.parts.find((p) => p.name === 'lost').t0);
  ok(L.seconds.slice(lw, lw + 10).every((v) => v > 0.003), `a wreck goes silent (rms by second: ${L.seconds.slice(lw, lw + 10).join(' ')})`);
  const off = await render(page, 'pete', { off: true });
  ok(off.all.peak === 0 && off.notes === 0, `with the music off the band still played (${off.notes} notes, peak ${off.all.peak})`);

  // ---- the game: a real fight, and the band following it ----
  await page.touchscreen.tap(420, 200); await page.waitForTimeout(700); // the first tap unlocks sound (iOS rule): the camp theme starts
  const camp = await page.evaluate(() => window.__G.audio.musicState());
  ok(camp && camp.section === 'camp' && camp.theme === 'camp' && camp.notes > 0, `on the title the camp theme is not playing (${JSON.stringify(camp)})`);
  const live = await page.evaluate(async () => {
    const { STORMS } = await import('/src/config.js'); const G = window.__G, A = G.audio, frame = () => new Promise((r) => requestAnimationFrame(r)), wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { seen: [], bpm: {}, pings: [], crits: [], grade: null, cost: 0, frames: 0 };
    const sc = A.score.bind(A); A.score = (st) => { const t = performance.now(); sc(st); out.cost += performance.now() - t; out.frames++; }; // what the band costs a frame
    const inc = A.incoming.bind(A); A.incoming = (k, big) => { out.pings.push([+G.mission.time.toFixed(2), +k.toFixed(2), big]); inc(k, big); };
    const cr = A.crit.bind(A); A.crit = (n) => { out.crits.push(n); cr(n); }; const gr = A.grade.bind(A); A.grade = (l, f) => { out.grade = l; gr(l, f); };
    G.setpiece = 'never'; G.bot = true; G.startMission(STORMS[0]); G.fast = 3; const m = G.mission, s = m.storm;
    const axes0 = G.input.axes, steer = (r, tx, tz) => { const dx = tx - r.x, dz = tz - r.z, l = Math.hypot(dx, dz) || 1, hx = Math.sin(r.heading), hz = Math.cos(r.heading); return Math.max(-1, Math.min(1, (hx * dz / l - hz * dx / l) * 3)); };
    G.input.axes = () => { const r = m.rig; if (m.view !== 'drive') return { steer: 0, throttle: 0 }; if (m.phase === 'rip' && m.home) return { steer: steer(r, s.ax, s.az), throttle: m.ringDist - m.dropR > 30 ? 1 : 0.55 }; if (m.surge) return { steer: steer(r, r.x + (r.x - m.surge.x), r.z + (r.z - m.surge.z)), throttle: 1 }; return { steer: steer(r, s.x + s.vx * 1.2, s.z + s.vz * 1.2), throttle: 1 }; };
    const note = () => { const M = A.musicState(); if (M.section !== out.seen[out.seen.length - 1]) { out.seen.push(M.section); if (!(M.section in out.bpm)) out.bpm[M.section] = M.bpm; } return M; };
    // paused: the audio clock stops, and the band with it
    while (m.time < 3) { note(); await frame(); }
    G.setPaused(true); await wait(150); const n0 = A.musicState().notes; await wait(600); out.pausedNotes = A.musicState().notes - n0; G.setPaused(false);
    // the Sound button: everything, no music, nothing, and round again. With the music off the band schedules nothing; the guns still sound
    const btn = document.getElementById('p-sound'), lab = () => btn.textContent; out.labels = [lab()];
    btn.click(); out.labels.push(lab()); await wait(400); const n1 = A.musicState().notes; await wait(700); out.offNotes = A.musicState().notes - n1; out.offState = A.musicState().on; out.savedMusic = JSON.parse(localStorage.getItem('tornado-hunter/v1')).settings.music;
    btn.click(); out.labels.push(lab()); out.muted = A.muted; btn.click(); out.labels.push(lab()); out.backOn = A.musicState().on && !A.muted;
    while (!m.result && m.time < 300) { note(); if (m.view === 'drive' && /BOOST/.test(m.coachLine()) && m.rig.boostCharge >= 1) m.rig.boost(); if (m.phase === 'rip' && m.dropped) m.act(); await frame(); }
    out.won = !!(m.result && m.result.won); G.fast = 0; G.bot = false; G.input.axes = axes0;
    // from the kill to the results, and on: how long until the screen, and whether any second of it is silent
    const t0 = performance.now(); out.rms = []; let shown = null, acc = 0, cnt = 0, sec = 0;
    while (performance.now() - t0 < 16000) { note(); const el = (performance.now() - t0) / 1000; if (shown === null && G.resultShown) shown = +el.toFixed(2); acc += window.__rms(); cnt++; if (el >= sec + 1) { out.rms.push(+(acc / cnt).toFixed(4)); acc = 0; cnt = 0; sec++; } await frame(); }
    out.resultsAt = shown; out.final = A.musicState(); out.cost = +(out.cost / out.frames).toFixed(3); G.setpiece = undefined; return out;
  });
  console.log('live:', JSON.stringify({ ...live, pings: live.pings.length, crits: [...new Set(live.crits)] }));
  const order = ['chase', 'zone', 'surge', 'stagger', 'rip', 'dorothy', 'kill', 'killcine', 'won', 'after'];
  ok(order.every((k) => live.seen.includes(k)), `the band missed part of the fight: heard ${live.seen.join(' > ')}`);
  ok(live.seen.indexOf('stagger') < live.seen.indexOf('rip') && live.seen.indexOf('rip') < live.seen.indexOf('kill') && live.seen.indexOf('kill') < live.seen.indexOf('won') && live.seen[live.seen.length - 1] === 'after', `the sections came in the wrong order: ${live.seen.join(' > ')}`);
  ok(live.bpm.chase === 126 && live.bpm.stagger > 126 && live.bpm.after === 84, `tempo: chase ${live.bpm.chase}, with a band off ${live.bpm.stagger}, results ${live.bpm.after} (want 126, faster, 84)`);
  ok(live.pausedNotes === 0, `paused, the band played ${live.pausedNotes} more notes`);
  ok(live.labels.join(' | ') === 'Sound on | Sound on, music off | Sound off | Sound on', `the Sound button reads ${live.labels.join(' | ')}`);
  ok(live.offNotes === 0 && live.offState === false && live.savedMusic === false && live.muted === true && live.backOn, `music off: ${live.offNotes} notes, on ${live.offState}, saved ${live.savedMusic}; sound off: muted ${live.muted}; back on: ${live.backOn}`);
  ok(live.won && live.resultsAt !== null, `the fight was not won (${live.won}), or the results never came (${live.resultsAt})`);
  ok(live.rms.slice(0, 15).every((v) => v > 0.002), `after the kill a second went silent (rms by second ${live.rms.join(' ')}; results at ${live.resultsAt} s)`);
  ok(live.final.section === 'after' && live.final.theme === 'after', `on the results screen the band is playing ${JSON.stringify(live.final)}`);
  ok(live.pings.length >= 3, `a piece coming down on the truck was not heard (${live.pings.length} pings)`);
  ok(Math.max(...live.crits) >= 2, `a run of critical hits never climbed (${[...new Set(live.crits)].join(',')})`);
  ok(/^[SABCD]$/.test(live.grade || ''), `the grade was not sounded (${live.grade})`);
  ok(live.cost < 0.5, `the band costs ${live.cost} ms a frame (want under half a millisecond)`);
  ok(errors.length === 0, `page errors: ${errors.join(' | ')}`);
  await browser.close();
} finally { server.kill(); }
console.log(`\n${checks - fails.length}/${checks} checks passed`);
process.exit(fails.length ? 1 : 0);
