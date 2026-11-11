// TORNADO HUNTER: boot, state machine (title, hq, playing, over), camera and the frame loop.
import * as THREE from '../vendor/three.module.min.js';
import { FEEL, STORMS, RIGS } from './config.js';
import { save } from './save.js';
import { input } from './input.js';
import { audio } from './audio.js';
import { Sky } from './sky.js';
import { World, TOWNS } from './world.js';
import { Rig } from './rig.js';
import { Storm } from './tornado.js';
import { Fx } from './fx.js';
import { Mission } from './combat.js';
import { Hud } from './hud.js';
import { UI } from './ui.js';

const $ = (id) => document.getElementById(id);
const canvas = $('view');
const G = { state: 'boot', paused: false, input, audio, save, mission: null, time: 0, fovKick: 0 };
window.__game = { state: 'title', score: 0, time: 0, phase: 'boot', hull: 0, strain: 0, bands: 0, dist: 0, speed: 0, tension: 0, data: 0, fps: 0, scale: 1 };

let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false }); }
catch { $('loading').querySelector('p').textContent = 'This device cannot run WebGL'; throw new Error('WebGL unavailable'); }
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(FEEL.camFov, 1, 0.5, 9000);
G.scene = scene; G.camera = camera; G.renderer = renderer;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ---- resolution governor: hold the frame rate by trading pixels, never by dropping input ----
const quality = { scale: Math.min(window.devicePixelRatio || 1, 2), min: 0.45, max: Math.min(window.devicePixelRatio || 1, 2), acc: 0, n: 0, good: 0, detail: 1 };
{ // a software rasteriser (or a very old GPU) starts on the low tier instead of discovering it the slow way
  const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'), name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
  if (/swiftshader|llvmpipe|software/i.test(name)) { quality.scale = 0.4; quality.min = 0.34; quality.max = 0.6; quality.detail = 0.3; G.low = true; }
}
function resize() {
  const w = window.innerWidth, h = window.innerHeight; renderer.setPixelRatio(quality.scale); renderer.setSize(w, h, false);
  camera.aspect = w / h; G.baseFov = camera.aspect >= 1 ? FEEL.camFov : Math.min(96, 2 * Math.atan(Math.tan(FEEL.camFov * Math.PI / 360) / Math.max(0.5, camera.aspect) * 0.9) * 180 / Math.PI);
  camera.fov = G.baseFov; camera.updateProjectionMatrix();
}
function govern(rawDt) {
  quality.acc += rawDt; quality.n++;
  if (quality.acc < 0.75) return; const ms = quality.acc / quality.n * 1000; quality.acc = 0; quality.n = 0; window.__game.fps = Math.round(1000 / ms);
  if (ms > 30 && quality.scale <= quality.min && quality.detail > 0.3) quality.detail = Math.max(0.3, quality.detail - 0.2);
  if (ms > 24 && quality.scale > quality.min) { quality.scale = Math.max(quality.min, quality.scale * (ms > 40 ? 0.7 : 0.85)); quality.good = 0; resize(); if (quality.scale < 0.8 && G.sky) G.sky.setRain(ms < 45); }
  else if (ms < 13 && quality.scale < quality.max) { if (++quality.good > 4) { quality.scale = Math.min(quality.max, quality.scale * 1.12); quality.good = 0; resize(); } } else quality.good = 0;
  window.__game.scale = +quality.scale.toFixed(2);
}
window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 250));

// ---- game api used by the menus and the mission ----
G.makeRig = () => {
  const s = save.s, def = RIGS.find((r) => r.id === s.loadout.rig) || RIGS[0], sparks = s.loadout.crew.includes('sparks');
  return new Rig(scene, def, G.sky.envMap, { hull: 1 + s.upgrades.plating * 0.2, boost: 1 + s.upgrades.turbo * 0.15, recharge: (1 + s.upgrades.turbo * 0.15) * (sparks ? 1.35 : 1) });
};
G.kickFov = () => { G.fovKick = 10; };
G.onScreen = (name) => { G.state = name === 'results' ? 'over' : name; input.setEnabled(false); document.body.classList.remove('playing'); G.hud.show(false); };
G.startMission = (def, opts = {}) => {
  if (G.mission) G.mission.dispose(); if (G.attract) { G.attract.dispose(); G.attract = null; }
  G.world.reset(); G.fx.reset(); G.lastOpts = { def, opts };
  G.mission = new Mission(G, def, save.s.loadout, save.s.upgrades, opts);
  G.ui.hide(); G.hud.show(true); G.hud.begin(G.mission); G.state = 'playing'; G.paused = false; G.banked = false; G.resultShown = false;
  document.body.classList.add('playing'); input.clear(); input.setEnabled(true); camState.init = false; audio.suspend(false); document.activeElement && document.activeElement.blur && document.activeElement.blur();
  if (!save.s.seenCoach) { save.s.seenCoach = true; save.write(); }
};
G.restart = () => { if (G.lastOpts) G.startMission(G.lastOpts.def, G.lastOpts.opts); };
G.toHQ = () => { if (G.mission) { G.mission.dispose(); G.mission = null; } G.paused = false; spawnAttract(); G.ui.show('hq'); };
G.setPaused = (on) => {
  if (G.state !== 'playing' && !G.paused) return; G.paused = on; input.setEnabled(!on); document.body.classList.toggle('playing', !on);
  if (on) { G.ui.screens.pause.hidden = false; if (!input.usingTouch) $('p-resume').focus({ preventScroll: true }); } else { G.ui.screens.pause.hidden = true; input.clear(); document.activeElement && document.activeElement.blur && document.activeElement.blur(); }
  audio.suspend(on);
};
function spawnAttract() {
  if (G.attract) return; const t = TOWNS.pete; G.world.reset();
  G.attract = new Storm(scene, G.sky.uniforms, STORMS[0], G.world); G.attract.place(t.x + 420, t.z + 360);
  for (const b of G.attract.bands) b.exposed = true;
}

function bank(res) {
  const s = save.s, first = res.won && !s.kills[res.storm.id]; let unlock = '';
  s.data += res.data; s.bands += res.stats.snaps;
  if (res.won) {
    s.kills[res.storm.id] = (s.kills[res.storm.id] || 0) + 1; if (!s.best[res.storm.id] || res.time < s.best[res.storm.id]) s.best[res.storm.id] = Math.round(res.time);
    if (first) { const i = STORMS.indexOf(res.storm), next = STORMS[i + 1], bp = res.storm.unlocks; const names = { thumper: 'the Thumper', bulldog: 'the Bulldog', whippet: 'the Whippet' }; unlock = `Blueprint recovered: ${names[bp]}.` + (next ? ` ${next.name} is on the radar.` : ' Every storm now has a rematch.'); if (next) { s.loadout.storm = next.id; s.loadout.rematch = false; } }
  }
  save.write(); return unlock;
}

// ---- camera: behind the rig, turned toward the storm so both stay in frame ----
const camState = { init: false, dir: new THREE.Vector3(0, 0, 1), pos: new THREE.Vector3(), look: new THREE.Vector3(), dist: FEEL.camDistance, height: FEEL.camHeight };
const _d = new THREE.Vector3(), _p = new THREE.Vector3(), _l = new THREE.Vector3();
function missionCamera(dt, m) {
  const r = m.rig, s = m.storm, hx = Math.sin(r.heading), hz = Math.cos(r.heading);
  const tx = (s.x - r.x) / m.dist, tz = (s.z - r.z) / m.dist;
  const near = THREE.MathUtils.clamp((420 - m.dist) / 300, 0, 1), teth = m.phase === 'tethered' || m.phase === 'exposed';
  let wS = s.alive ? (m.phase === 'tethered' ? 0.62 : 0.14 + 0.36 * near) : 0;
  if (m.phase === 'finisher') wS = 0.5;
  _d.set(hx * (1 - wS) + tx * wS, 0, hz * (1 - wS) + tz * wS); if (_d.lengthSq() < 0.01) _d.set(hx, 0, hz); _d.normalize();
  if (m.phase === 'won') { const a = m.phaseT * 0.25 + Math.atan2(camState.dir.x, camState.dir.z); _d.set(Math.sin(a), 0, Math.cos(a)); }
  if (!camState.init) camState.dir.copy(_d);
  camState.dir.lerp(_d, Math.min(1, dt * (m.phase === 'won' ? 0.6 : 3.2))).normalize();
  const port = camera.aspect < 1, won = m.phase === 'won';
  const wantD = (teth ? 26 : FEEL.camDistance + r.speedFrac * 3) + (won ? 8 : 0) + (port ? 6 : 0), wantH = (teth ? 9.5 : FEEL.camHeight) + (port ? 3 : 0);
  camState.dist += (wantD - camState.dist) * Math.min(1, dt * 2); camState.height += (wantH - camState.height) * Math.min(1, dt * 2);
  _p.set(r.x - camState.dir.x * camState.dist, r.y + camState.height, r.z - camState.dir.z * camState.dist);
  const gy = G.world.heightAt(_p.x, _p.z) + 2; if (_p.y < gy) _p.y = gy;
  // look past the rig: level when roped (rig low in frame, bands above it), nose up a little as the funnel fills the sky
  const ahead = teth ? 40 : 24, lift = won ? 13 : teth ? 12 : 3.5 + near * 6;
  _l.set(r.x + camState.dir.x * ahead, r.y + lift, r.z + camState.dir.z * ahead);
  if (!camState.init) { camState.pos.copy(_p); camState.look.copy(_l); camState.init = true; }
  camState.pos.lerp(_p, Math.min(1, dt * 9)); camState.look.lerp(_l, Math.min(1, dt * 6));
  camera.position.copy(camState.pos);
  const sh = G.fx.shakeAmt * 0.035; if (sh > 0) { camera.position.x += (Math.random() - 0.5) * sh; camera.position.y += (Math.random() - 0.5) * sh; camera.position.z += (Math.random() - 0.5) * sh; }
  camera.lookAt(camState.look); camera.updateMatrixWorld();
  G.fovKick = Math.max(0, G.fovKick - dt * 22); const fov = G.baseFov + G.fovKick + (r.boostT > 0 ? 4 : 0) + (teth ? 5 : 0);
  if (Math.abs(fov - camera.fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 10); camera.updateProjectionMatrix(); }
}
function attractCamera(dt, t) {
  const s = G.attract, a = t * 0.045 + 2.4, d = 330;
  camera.position.set(s.x + Math.cos(a) * d, s.groundY + 26, s.z + Math.sin(a) * d);
  const side = camera.aspect >= 1 ? 90 : 0; _l.set(s.x - Math.sin(a) * -side, s.groundY + 78, s.z + Math.cos(a) * -side); camera.lookAt(_l);
  if (Math.abs(camera.fov - G.baseFov) > 0.05) { camera.fov = G.baseFov; camera.updateProjectionMatrix(); }
}

// ---- frame ----
let last = performance.now(), simT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const raw = Math.min(0.1, (now - last) / 1000); last = now; govern(raw);
  const dtBase = Math.min(0.05, raw), fx = G.fx, m = G.mission;
  input.tick(now / 1000);
  if (input.take('pause', 0.3)) { if (G.state === 'playing') G.setPaused(!G.paused); else if (G.paused) G.setPaused(false); }
  let dt = dtBase;
  if (G.paused) dt = 0; else if (fx.stopT > 0) { fx.stopT -= raw; dt = 0; } else if (fx.slowT > 0) { fx.slowT -= raw; dt *= 0.3; }
  simT += dt; G.time = simT;
  let storm = null, stormLevel = 1, prox = 0;
  if (m) {
    if (dt > 0) m.update(dt, simT, input.axes(), input);
    storm = m.storm; prox = THREE.MathUtils.clamp(1 - (m.dist - 40) / 500, 0, 1); stormLevel = m.phase === 'won' ? 0 : 1;
    missionCamera(dtBase, m);
    if (!G.paused) G.hud.update(dtBase, m, camera, input.usingTouch);
    audio.beds({ prox: storm.alive ? prox : 0, storm: G.sky.storm, speed: m.rig.speedFrac, throttle: Math.abs(m.rig.throttle), tension: m.line ? m.tension : null, playing: !G.paused && !m.result });
    if (m.result && !G.banked) { G.banked = true; G.unlockText = bank(m.result); input.setEnabled(false); document.body.classList.remove('playing'); }
    if (m.result && !G.resultShown && m.phaseT > (m.result.won ? 4.6 : 1.7)) { G.resultShown = true; G.hud.show(false); G.ui.results(m.result, G.unlockText); }
    const g = window.__game, b = storm.band; g.state = m.result ? 'over' : 'playing'; g.score = Math.round(m.data); g.data = g.score; g.time = +m.time.toFixed(2); g.phase = m.phase; g.hull = Math.round(m.rig.hull); g.strain = b ? +b.strain.toFixed(3) : 1; g.bands = storm.bandsLeft; g.dist = Math.round(m.dist); g.speed = +Math.hypot(m.rig.vx, m.rig.vz).toFixed(1); g.tension = m.tension === null ? 0 : +m.tension.toFixed(2); g.x = Math.round(m.rig.x); g.z = Math.round(m.rig.z);
  } else if (G.attract) {
    const s = G.attract, t = TOWNS.pete, a = simT * 0.05; s.moveX = Math.cos(a); s.moveZ = Math.sin(a); s.moveSpeed = 5; if (dt > 0) { s.update(dt, simT); G.world.update(dt, s); G.world.events.length = 0; }
    if (Math.hypot(s.x - t.x, s.z - t.z) > 700) s.place(t.x + 420, t.z + 360);
    storm = s; prox = 0.35; attractCamera(dtBase, simT); audio.beds({ prox: 0.12, storm: 1 });
    const g = window.__game; g.state = G.state === 'over' ? 'over' : 'title'; g.phase = G.state;
  }
  if (dt > 0) fx.update(dt, simT);
  G.world.cull(camera, quality.detail); G.sky.update(dtBase, simT, stormLevel, storm, prox);
  renderer.render(scene, camera);
}

async function boot() {
  save.load(); resize();
  // the identity's palette is the source of the interface colours
  fetch('assets/brand/palette.json').then((r) => r.json()).then((p) => { const st = document.documentElement.style; for (const [k, v] of Object.entries({ bg: p.background, surface: p.surface, primary: p.primary, accent: p.accent, text: p.text, signal: p.signal, wheat: p.wheat })) if (v) st.setProperty('--' + k, v); }).catch(() => {});
  const fill = $('load-fill'), prog = (v) => { fill.style.transform = `scaleX(${v})`; };
  G.sky = new Sky(scene, camera, !!G.low); G.sky.low = !!G.low; G.world = new World(scene, G.sky); G.fx = new Fx(scene, camera, G.world, G.sky.uniforms);
  await G.sky.load(); prog(0.2);
  await G.world.load((v) => prog(0.2 + v * 0.6));
  await G.fx.load(); prog(0.95);
  G.hud = new Hud(); G.fx.flashCb = (s, c) => G.hud.flash(s, c); G.fx.calm = save.s.settings.calm || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  G.hud.onReady = () => audio.ready_();
  input.init({ zone: $('stick-zone'), base: $('stick-base'), nub: $('stick-nub'), action: $('btn-action'), boost: $('btn-boost'), gadget: $('btn-gadget') });
  audio.setMuted(save.s.settings.mute);
  G.ui = new UI(G); spawnAttract(); G.ui.show('title');
  window.addEventListener('pointerdown', () => audio.unlock(), { once: false, passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'playing' && !G.paused && !G.mission.result) G.setPaused(true); });
  try { await document.fonts.ready; } catch { /* fonts are a nicety */ }
  prog(1); $('loading').hidden = true;
  last = performance.now(); requestAnimationFrame(frame);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot().catch((e) => { console.error(e); const p = $('loading').querySelector('p'); if (p) p.textContent = 'Could not load the storm. Reload to try again.'; });
G.quality = quality; window.__G = G;
