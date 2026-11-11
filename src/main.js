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
import { Weather } from './weather.js';
import { UI } from './ui.js';

const $ = (id) => document.getElementById(id);
const canvas = $('view');
const G = { state: 'boot', paused: false, input, audio, save, mission: null, time: 0, fovKick: 0 };
window.__game = { state: 'title', score: 0, time: 0, phase: 'boot', view: 'drive', weapon: 'mg', rockets: 0, hull: 0, stability: 1, stage: 0, bands: 0, dist: 0, speed: 0, mph: 0, stormMph: 0, boost: 0, shot: 0, crits: 0, close: 0, hail: 0, data: 0, fps: 0, scale: 1 };

let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false }); }
catch { $('loading').querySelector('p').textContent = 'This device cannot run WebGL'; throw new Error('WebGL unavailable'); }
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(FEEL.camFov, 1, 0.5, 9000);
G.scene = scene; G.camera = camera; G.renderer = renderer; scene.add(camera); // the gunner's weapon hangs off the camera
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
  return new Rig(scene, def, G.sky.envMap, { hull: 1 + s.upgrades.plating * 0.2, boost: 1 + s.upgrades.turbo * 0.15, recharge: (1 + s.upgrades.turbo * 0.15) * (sparks ? 1.35 : 1), glow: G.fx.dustTex });
};
G.kickFov = () => { G.fovKick = 10; };
G.onScreen = (name) => { G.state = name === 'results' ? 'over' : name; input.setEnabled(false); input.setMode('drive'); document.body.classList.remove('playing'); G.hud.show(false); };
G.startMission = (def, opts = {}) => {
  if (G.mission) G.mission.dispose(); if (G.attract) { G.attract.dispose(); G.attract = null; }
  G.world.reset(); G.fx.reset(); G.lastOpts = { def, opts }; input.setMode('drive'); view.name = 'drive'; view.t = 1;
  G.mission = new Mission(G, def, save.s.loadout, save.s.upgrades, opts); G.weather.begin(G.mission);
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
  G.attract = new Storm(scene, G.sky.uniforms, STORMS[0], G.world, { low: !!G.low }); G.attract.place(t.x + 420, t.z + 360);
  for (const b of G.attract.bands) b.exposed = true;
}

function bank(res) {
  const s = save.s, first = res.won && !s.kills[res.storm.id]; let unlock = '';
  s.data += res.data; s.bands += res.stats.snaps;
  if (res.won) {
    s.kills[res.storm.id] = (s.kills[res.storm.id] || 0) + 1; if (!s.best[res.storm.id] || res.time < s.best[res.storm.id]) s.best[res.storm.id] = Math.round(res.time);
    if (first) { const i = STORMS.indexOf(res.storm), next = STORMS[i + 1], bp = res.storm.unlocks, names = { bulldog: 'the Bulldog', whippet: 'the Whippet' }; unlock = (bp ? `Blueprint recovered: ${names[bp]}. ` : '') + (next ? `${next.name} is on the radar.` : 'Every storm now has a rematch.'); if (next) { s.loadout.storm = next.id; s.loadout.rematch = false; } }
  }
  save.write(); return unlock;
}

// ---- camera: behind the rig, turned toward the storm so both stay in frame ----
const camState = { init: false, dir: new THREE.Vector3(0, 0, 1), pos: new THREE.Vector3(), look: new THREE.Vector3(), dist: FEEL.camDistance, height: FEEL.camHeight };
const _d = new THREE.Vector3(), _p = new THREE.Vector3(), _l = new THREE.Vector3();
function missionCamera(dt, m) {
  const r = m.rig, s = m.storm, hx = Math.sin(r.heading), hz = Math.cos(r.heading), sp = r.speedFrac;
  const tx = (s.x - r.x) / m.dist, tz = (s.z - r.z) / m.dist, port = camera.aspect < 1, won = m.phase === 'won';
  // look where you are going, leaning toward the storm so it stays in frame; lean hard when you are hooked to it
  const near = THREE.MathUtils.clamp((520 - m.dist) / 380, 0, 1), hooked = m.phase === 'rip' || m.phase === 'stagger';
  const wS = !s.alive ? 0 : hooked ? 0.5 : 0.1 + 0.3 * near;
  _d.set(hx * (1 - wS) + tx * wS, 0, hz * (1 - wS) + tz * wS); if (_d.lengthSq() < 0.01) _d.set(hx, 0, hz); _d.normalize();
  if (won) { const a = m.phaseT * 0.25 + Math.atan2(camState.dir.x, camState.dir.z); _d.set(Math.sin(a), 0, Math.cos(a)); }
  if (!camState.init) camState.dir.copy(_d);
  camState.dir.lerp(_d, Math.min(1, dt * (won ? 0.6 : 4))).normalize();
  // speed pulls the camera in low and stretches the lens; boost stretches it further
  const boost = r.boostT > 0 ? 1 : 0;
  const wantD = FEEL.camDistance - sp * 2.2 + (hooked ? 9 : 0) + (won ? 12 : 0) + (port ? 7 : 0), wantH = FEEL.camHeight - sp * 1.3 + (hooked ? 3 : 0) + (port ? 3 : 0);
  camState.dist += (wantD - camState.dist) * Math.min(1, dt * 2.5); camState.height += (wantH - camState.height) * Math.min(1, dt * 2.5);
  _p.set(r.x - camState.dir.x * camState.dist, r.y + camState.height, r.z - camState.dir.z * camState.dist);
  const gy = G.world.heightAt(_p.x, _p.z) + 1.6; if (_p.y < gy) _p.y = gy;
  const ahead = 26 + sp * 16, lift = won ? 13 : 3 + near * 7 + (hooked ? 4 : 0);
  _l.set(r.x + camState.dir.x * ahead, r.y + lift, r.z + camState.dir.z * ahead);
  if (!camState.init) { camState.pos.copy(_p); camState.look.copy(_l); camState.init = true; }
  camState.pos.lerp(_p, Math.min(1, dt * 11)); camState.look.lerp(_l, Math.min(1, dt * 7));
  camera.position.copy(camState.pos);
  // road rumble at speed plus whatever just exploded (off in calm mode)
  const sh = G.fx.shakeAmt * 0.035 + (G.fx.calm ? 0 : Math.max(0, sp - 0.7) * 0.05 + boost * 0.05); if (sh > 0) { camera.position.x += (Math.random() - 0.5) * sh; camera.position.y += (Math.random() - 0.5) * sh; camera.position.z += (Math.random() - 0.5) * sh; }
  camera.lookAt(camState.look); camera.updateMatrixWorld();
  G.fovKick = Math.max(0, G.fovKick - dt * 16); const fov = Math.min(112, G.baseFov + G.fovKick + Math.min(1.1, sp) * FEEL.camFovSpeed + boost * 7);
  if (Math.abs(fov - camera.fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 7); camera.updateProjectionMatrix(); }
}
// on the gun: the camera is the gunner's eye (src/gunner.js places it). Driving to gun and back is one quick swing
// measured from the truck, so the world never stops moving and nothing jumps.
const view = { name: 'drive', t: 1, pos: new THREE.Vector3(), quat: new THREE.Quaternion() }, _q = new THREE.Quaternion();
function gunCamera(dt, m) {
  m.gn.camera(dt, camera, G.fx.calm);
  G.fovKick = Math.max(0, G.fovKick - dt * 16); const fov = G.baseFov - FEEL.gunFovTighten;
  if (Math.abs(fov - camera.fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 9); camera.updateProjectionMatrix(); }
  camState.pos.copy(camera.position);
}
function viewCamera(dt, m) {
  const gun = m.view === 'gun' && !m.cine, now = m.cine ? 'cine' : gun ? 'gun:' + m.gn.seatId : 'drive', r = m.rig;
  if (now !== view.name) { // cuts to and from the cinematics stay cuts; wheel to gun, and one crew vehicle to the next, is a swing
    const was = view.name; view.dur = now.startsWith('gun:') && now !== 'gun:rig' ? FEEL.seatBlend : FEEL.gunBlend;
    if (now !== 'cine' && was !== 'cine') { view.t = 0; view.pos.copy(camera.position).sub(_p.set(r.x, r.y, r.z)); view.quat.copy(camera.quaternion); } else view.t = 1;
    if (now === 'drive' && was !== 'cine') camState.init = false;
    view.name = now;
  }
  G.fx.fp = gun; if (!gun) m.gn.root.visible = false;
  if (now === 'cine') cineCamera(dt, m); else if (gun) gunCamera(dt, m); else missionCamera(dt, m);
  if (view.t < 1) {
    view.t = Math.min(1, view.t + dt / (G.fx.calm ? 0.1 : view.dur || FEEL.gunBlend)); const k = view.t * view.t * (3 - 2 * view.t);
    _l.set(r.x, r.y, r.z).add(view.pos); camera.position.lerpVectors(_l, camera.position, k); _q.copy(camera.quaternion); camera.quaternion.slerpQuaternions(view.quat, _q, k); camera.updateMatrixWorld();
  }
}
// phase 4 and the kill shot: the camera leaves the truck and rides with the sensors, or the rocket
function cineCamera(dt, m) {
  const s = m.storm, p = m.cine.pos, rocket = m.cine.kind === 'rocket';
  _d.set(s.x - p.x, 0, s.z - p.z); const d = _d.length() || 1; _d.multiplyScalar(1 / d);
  if (rocket) _p.set(p.x - _d.x * 11 - _d.z * 3, p.y + 3, p.z - _d.z * 11 + _d.x * 3);
  else { // stand well outside the funnel, on the truck's side of it, and watch the sensors go round and up
    const r = m.rig, ox = r.x - s.x, oz = r.z - s.z, od = Math.hypot(ox, oz) || 1, out = s.radiusAt(0.2) * 1.4 + 58;
    _p.set(s.x + ox / od * out - oz / od * 22, s.groundY + 16 + (p.y - s.groundY) * 0.45, s.z + oz / od * out + ox / od * 22);
  }
  const gy = G.world.heightAt(_p.x, _p.z) + 2; if (_p.y < gy) _p.y = gy;
  if (rocket) _l.set(p.x + _d.x * Math.min(d, 30), p.y, p.z + _d.z * Math.min(d, 30)); else _l.set(p.x * 0.7 + s.x * 0.3, p.y + 4, p.z * 0.7 + s.z * 0.3);
  if (!m.cine.cut) { m.cine.cut = true; camera.position.copy(_p); camState.look.copy(_l); } // a hard cut to the new subject, then follow it
  camera.position.lerp(_p, Math.min(1, dt * 7)); camState.look.lerp(_l, Math.min(1, dt * 9)); camera.lookAt(camState.look); camera.updateMatrixWorld();
  const fov = G.baseFov + (rocket ? 14 : -8); if (Math.abs(fov - camera.fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 6); camera.updateProjectionMatrix(); }
  camState.pos.copy(camera.position);
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
    // G.fast (tests only) runs extra fixed steps a frame so whole encounters can be simulated quickly
    const steps = dt > 0 ? (G.fast || 1) : 0, sdt = G.fast ? 1 / 60 : dt;
    for (let i = 0; i < steps; i++) { if (i) { simT += sdt; fx.update(sdt, simT); if (fx.stopT > 0) fx.stopT = 0; } m.update(sdt, simT, input.axes(), input); }
    storm = m.storm; prox = THREE.MathUtils.clamp(1 - (m.dist - 40) / 500, 0, 1); stormLevel = m.phase === 'won' ? 0 : 1;
    viewCamera(dtBase, m);
    if (!G.paused) G.hud.update(dtBase, m, camera, input.usingTouch, fx.calm);
    audio.beds({ prox: storm.alive ? prox : 0, storm: G.sky.storm, speed: Math.min(1.4, m.rig.speedFrac), throttle: Math.abs(m.rig.throttle), tension: m.line ? 0.6 : null, playing: !G.paused && !m.result, drift: m.rig.drifting ? 1 : Math.min(1, Math.abs(m.rig.slip || 0) / 14), boost: m.rig.boostT > 0, hail: G.weather.hail });
    if (m.result && !G.banked) { G.banked = true; G.unlockText = bank(m.result); input.setEnabled(false); document.body.classList.remove('playing'); }
    if (m.result && !G.resultShown && m.phaseT > (m.result.won ? 4.8 : 1.8)) { G.resultShown = true; G.hud.show(false); G.ui.results(m.result, G.unlockText); }
    const g = window.__game; g.state = m.result ? 'over' : 'playing'; g.score = Math.round(m.data); g.data = g.score; g.time = +m.time.toFixed(2); g.phase = m.phase; g.hull = Math.round(m.rig.hull); g.stability = +m.stability.toFixed(3); g.stage = m.stage; g.bands = storm.bandsLeft; g.dist = Math.round(m.dist); g.speed = +Math.hypot(m.rig.vx, m.rig.vz).toFixed(1); g.mph = m.rig.mph; g.stormMph = m.stormMph; g.inZone = !!m.inZone; g.cine = !!m.cine; g.boost = +m.rig.boostCharge.toFixed(2); g.shot = m.stats.shot; g.close = m.stats.close; g.view = m.view; g.seat = m.gn.seatId; g.weapon = m.gn.weapon; g.rockets = m.gn.rockets; g.crits = m.stats.crits; g.locked = m.gn.locked; g.aim = m.gn.aim.kind; g.hail = +G.weather.hail.toFixed(2); g.x = Math.round(m.rig.x); g.z = Math.round(m.rig.z);
    G.rigVel = m.rig;
  } else if (G.attract) {
    const s = G.attract, t = TOWNS.pete, a = simT * 0.05; s.moveX = Math.cos(a); s.moveZ = Math.sin(a); s.moveSpeed = 9; if (dt > 0) { s.update(dt, simT); G.world.update(dt, s); G.world.events.length = 0; }
    if (Math.hypot(s.x - t.x, s.z - t.z) > 700) s.place(t.x + 420, t.z + 360);
    storm = s; prox = 0.35; attractCamera(dtBase, simT); audio.beds({ prox: 0.12, storm: 1 });
    const g = window.__game; g.state = G.state === 'over' ? 'over' : 'title'; g.phase = G.state;
  }
  if (dt > 0) fx.update(dt, simT);
  G.weather.update(dt, simT, m, storm, camera);
  G.world.cull(camera, quality.detail); G.sky.update(dtBase, simT, stormLevel, storm, prox, m && !m.result ? m.rig : null);
  renderer.render(scene, camera);
}

async function boot() {
  save.load(); resize();
  // the identity's palette is the source of the interface colours
  fetch('assets/brand/palette.json').then((r) => r.json()).then((p) => { const st = document.documentElement.style; for (const [k, v] of Object.entries({ bg: p.background, surface: p.surface, primary: p.primary, accent: p.accent, text: p.text, signal: p.signal, wheat: p.wheat })) if (v) st.setProperty('--' + k, v); }).catch(() => {});
  const fill = $('load-fill'), prog = (v) => { fill.style.transform = `scaleX(${v})`; };
  G.sky = new Sky(scene, camera, !!G.low); G.sky.low = !!G.low; G.world = new World(scene, G.sky); G.fx = new Fx(scene, camera, G.world, G.sky.uniforms, !!G.low);
  await G.sky.load(); prog(0.2);
  await G.world.load((v) => prog(0.2 + v * 0.6));
  await G.fx.load(); prog(0.95);
  G.weather = new Weather(G);
  G.hud = new Hud(); G.fx.flashCb = (s, c) => G.hud.flash(s, c); G.fx.calm = save.s.settings.calm || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  G.hud.onReady = () => audio.ready_();
  input.init({ view: canvas, zone: $('stick-zone'), aim: $('aim-zone'), base: $('stick-base'), nub: $('stick-nub'), action: $('btn-action'), boost: $('btn-boost'), fire: $('btn-fire'), swap: $('btn-swap'), drive: $('btn-drive') });
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
