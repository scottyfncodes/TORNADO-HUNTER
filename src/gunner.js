// The gunner's seat. First person on the turret while the truck drives itself:
//   the machine gun (hold FIRE, hitscan, the storm's glowing heart and dead-centre hits are critical)
//   rockets (few of them, a lock-on reticle, one shot for anything armoured, a bite out of a band)
//   the kill shot (the same launcher, locked on the critical core)
// One aim, one camera rig and one autodrive serve all of them. The truck is still a truck: whatever
// the storm throws lands on it unless you shoot it down or take the wheel back.
// Two phases of the finale are seats on other vehicles (src/convoy.js): Winch's harpoon truck and
// Sparks' rocket truck. (Doc's bus you drive: src/combat.js.) `mount` is the convoy unit you are sitting on, or null for your own rig.
import * as THREE from '../vendor/three.module.min.js';
import { FEEL, PALETTE, WORLD } from './config.js';
import { box, cyl, merge } from './geo.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _p = new THREE.Vector3(), _w = new THREE.Vector3(), _m = new THREE.Vector3(), _e = new THREE.Vector3();
const _px = { x: 0, y: 0 }, _ky = { x: 0, y: 0 };
const INK = '#1b2224', STEEL = '#3a4648', GUNMETAL = '#8b9693', CHROME = '#c9cdca', AMBER = '#ffc531', CREAM = '#f3ecd8', HAZ = '#e8b21c', OLIVE = '#4f6b54';
const HALF = WORLD.size / 2 - 40;
export const TARGET = {
  cow: { name: 'COW', cols: ['#f1eee2', '#22292a', '#e8a0a8'] }, bale: { name: 'HAY BALE', cols: ['#d9b45a', '#b89a58', '#8a7340'] }, door: { name: 'BARN DOOR', cols: ['#a3352b', '#f3ecd8', '#6e2a22'] }, sign: { name: 'ROAD SIGN', cols: ['#3f8f5a', '#aab3b4', '#f3ecd8'] },
  car: { name: 'CAR', cols: ['#3f7f86', '#e9dfc4', '#1b2224'] }, tractor: { name: 'TRACTOR', cols: ['#3f8f3a', '#e8b21c', '#1b2224'] },
};

// ---- what you see of your own weapon (camera space: -Z is down the barrel) ----
const Z = Math.PI / 2;
function mgModel(kind) {
  const P = [], g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  // receiver in the turret's amber, a pale feed cover you look down on, notch sight, back plate
  P.push(box(0.13, 0.15, 0.6, AMBER, 0, 0, 0), box(0.11, 0.035, 0.36, GUNMETAL, 0, 0.09, -0.06), box(0.05, 0.04, 0.05, INK, 0, 0.095, 0.16), box(0.135, 0.155, 0.03, INK, 0, 0, 0.31));
  P.push(box(0.014, 0.05, 0.014, CREAM, 0.024, 0.125, 0.22), box(0.014, 0.05, 0.014, CREAM, -0.024, 0.125, 0.22));
  // spade grips and the butterfly trigger between them
  for (const sx of [1, -1]) P.push(box(0.022, 0.022, 0.13, STEEL, sx * 0.075, 0.045, 0.38), box(0.022, 0.022, 0.13, STEEL, sx * 0.075, -0.075, 0.38), cyl(0.021, 0.021, 0.15, INK, sx * 0.075, -0.015, 0.44, 6));
  P.push(box(0.075, 0.04, 0.02, AMBER, 0, -0.015, 0.4));
  // ammunition can on the left, brass belt into the feed
  P.push(box(0.16, 0.15, 0.24, OLIVE, -0.175, -0.07, -0.04), box(0.163, 0.03, 0.243, CREAM, -0.175, -0.03, -0.04), box(0.1, 0.022, 0.05, AMBER, -0.085, 0.085, -0.06), box(0.022, 0.07, 0.05, AMBER, -0.125, 0.05, -0.06));
  P.push(box(0.22, 0.035, 0.16, STEEL, 0, -0.095, -0.05), cyl(0.04, 0.05, 0.6, STEEL, 0, -0.4, -0.05, 7)); // cradle, pintle
  let muzzleZ = -1.3, spin = null;
  if (kind === 'minigun') { // six barrels in a cage that turns
    const B = []; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; B.push(cyl(0.017, 0.017, 0.86, GUNMETAL, Math.cos(a) * 0.046, Math.sin(a) * 0.046, -0.43, 5, Z)); }
    B.push(cyl(0.072, 0.072, 0.04, INK, 0, 0, -0.28, 10, Z), cyl(0.072, 0.072, 0.04, INK, 0, 0, -0.82, 10, Z), cyl(0.03, 0.03, 0.86, STEEL, 0, 0, -0.43, 6, Z));
    spin = new THREE.Mesh(merge(B), mat); spin.position.set(0, 0.01, -0.3); muzzleZ = -1.2;
  } else if (kind === 'cannon') { // one long heavy barrel, a recoil sleeve and a slotted brake
    P.push(cyl(0.045, 0.055, 1.2, GUNMETAL, 0, 0.01, -0.9, 8, Z), cyl(0.07, 0.07, 0.3, STEEL, 0, 0.01, -0.48, 8, Z), cyl(0.074, 0.074, 0.04, CREAM, 0, 0.01, -0.36, 8, Z), box(0.16, 0.085, 0.17, INK, 0, 0.01, -1.56), box(0.17, 0.025, 0.05, GUNMETAL, 0, 0.01, -1.56)); muzzleZ = -1.68;
  } else { // perforated jacket, two pale bands, a flash hider and a front post
    P.push(cyl(0.03, 0.03, 0.96, GUNMETAL, 0, 0.01, -0.78, 8, Z), cyl(0.05, 0.05, 0.5, STEEL, 0, 0.01, -0.57, 8, Z), cyl(0.054, 0.054, 0.04, CREAM, 0, 0.01, -0.36, 8, Z), cyl(0.054, 0.054, 0.04, CREAM, 0, 0.01, -0.78, 8, Z), cyl(0.05, 0.036, 0.1, INK, 0, 0.01, -1.25, 8, Z), box(0.012, 0.06, 0.012, CREAM, 0, 0.075, -1.16));
  }
  g.add(new THREE.Mesh(merge(P), mat)); if (spin) g.add(spin);
  g.userData = { muzzle: new THREE.Vector3(0, 0.01, muzzleZ), spin, mat };
  return g;
}
function podModel() { // four tubes strapped in a rack; a rocket's nose shows in every one that is loaded
  const P = [], g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ vertexColors: true }), tips = [];
  const tipGeo = merge([cyl(0.0, 0.055, 0.15, PALETTE.accent, 0, 0, 0, 6, -Z), cyl(0.055, 0.055, 0.05, CREAM, 0, 0, 0.1, 6, Z)]);
  for (const [x, y] of [[-0.095, 0.085], [0.095, 0.085], [-0.095, -0.095], [0.095, -0.095]]) {
    P.push(cyl(0.078, 0.078, 0.74, GUNMETAL, x, y, 0, 8, Z), cyl(0.084, 0.084, 0.05, INK, x, y, -0.35, 8, Z), cyl(0.084, 0.084, 0.05, INK, x, y, 0.35, 8, Z), cyl(0.05, 0.05, 0.02, '#0c1112', x, y, 0.376, 8, Z));
    const t = new THREE.Mesh(tipGeo, mat); t.position.set(x, y, -0.4); g.add(t); tips.push(t);
  }
  P.push(box(0.4, 0.4, 0.07, HAZ, 0, -0.005, -0.12), box(0.4, 0.4, 0.07, HAZ, 0, -0.005, 0.16), box(0.05, 0.03, 0.4, INK, 0, 0.2, 0.02), box(0.012, 0.05, 0.012, CREAM, 0, 0.24, -0.16)); // hazard straps, top rail, sight post
  for (const sx of [1, -1]) P.push(box(0.022, 0.022, 0.12, STEEL, sx * 0.16, 0.0, 0.42), cyl(0.021, 0.021, 0.15, INK, sx * 0.16, -0.05, 0.47, 6));
  P.push(box(0.2, 0.035, 0.16, STEEL, 0, -0.21, 0), cyl(0.04, 0.05, 0.6, STEEL, 0, -0.5, 0, 7));
  g.add(new THREE.Mesh(merge(P), mat)); g.userData = { muzzle: new THREE.Vector3(0, 0, -0.45), tips, mat };
  return g;
}

function harpModel() { // Winch's launcher: a pale barrel as thick as your arm, a barbed magenta head, the cable drum beside it
  const P = [], g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  P.push(box(0.2, 0.2, 0.6, AMBER, 0, 0, 0.05), box(0.205, 0.06, 0.2, INK, 0, 0, 0.15), box(0.21, 0.21, 0.03, INK, 0, 0, 0.36), cyl(0.075, 0.085, 1.2, CREAM, 0, 0.02, -0.8, 8, Z), cyl(0.092, 0.092, 0.06, INK, 0, 0.02, -0.3, 8, Z), cyl(0.092, 0.092, 0.06, INK, 0, 0.02, -1.3, 8, Z));
  P.push(cyl(0.0, 0.1, 0.34, PALETTE.accent, 0, 0.02, -1.6, 4, -Z), box(0.3, 0.02, 0.1, PALETTE.accent, 0, 0.02, -1.42), box(0.02, 0.3, 0.1, PALETTE.accent, 0, 0.02, -1.42));
  P.push(cyl(0.16, 0.16, 0.2, INK, 0.25, -0.02, 0.0, 10, 0, Z), cyl(0.125, 0.125, 0.16, CREAM, 0.25, -0.02, 0.0, 10, 0, Z), box(0.02, 0.02, 0.9, CREAM, 0.14, 0.06, -0.5));
  for (const sx of [1, -1]) P.push(box(0.022, 0.022, 0.13, STEEL, sx * 0.085, 0.045, 0.42), cyl(0.021, 0.021, 0.15, INK, sx * 0.085, -0.015, 0.48, 6));
  P.push(box(0.26, 0.035, 0.18, STEEL, 0, -0.12, 0), cyl(0.045, 0.055, 0.6, STEEL, 0, -0.42, 0, 7));
  g.add(new THREE.Mesh(merge(P), mat)); g.userData = { muzzle: new THREE.Vector3(0, 0.02, -1.7), mat };
  return g;
}
export class Gunner {
  constructor(mission, upgrades) {
    const G = mission.G; this.m = mission; this.G = G;
    this.on = false; this.why = ''; this.weapon = 'mg'; this.mount = null; this.seatId = 'rig'; this.yaw = 0; this.pitch = 0.2; this.eyeY = null;
    this.rocketMax = FEEL.rocketMax + upgrades.cable; this.rockets = Math.min(this.rocketMax, FEEL.rocketAmmo + upgrades.cable);
    this.reload = 0; this.shotT = 0; this.recoil = 0; this.kick = 0; this.flashT = 0; this.swapT = 1; this.spinV = 0; this.swayX = 0; this.swayY = 0;
    this.lock = null; this.lockT = 0; this.lockLost = 0; this.locked = false; this.wasFiring = false; this.lastRef = null; this.lastAz = 0; this.lastEl = 0;
    this.aim = { kind: null, ref: null, t: 0, crit: false, point: new THREE.Vector3() }; this.hit = { kind: null, ref: null, t: 0, crit: false, point: new THREE.Vector3() };
    this.note = ''; this.noteT = 0; this.hitT = 0; this.stuckT = 0; this.backT = 0; this.weakT = Math.random() * 20; this.weak = new THREE.Vector3(); this.weakR = 6;
    // the weapon in front of you
    this.root = new THREE.Group(); this.root.visible = false; G.camera.add(this.root);
    this.mg = mgModel(mission.gun.sound); this.pod = podModel(); this.harp = harpModel(); this.models = { mg: this.mg, rocket: this.pod, harpoon: this.harp }; this.root.add(this.mg, this.pod, this.harp);
    this.muzzleFlash = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.fx.dustTex, color: '#ffd27a', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); this.muzzleFlash.visible = false; this.root.add(this.muzzleFlash);
    // the heart: the one glowing place on the storm where a hit counts double (the shader draws it into the funnel; these mark it on the gun)
    const sm = (color, order) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.fx.dustTex, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); s.visible = false; s.renderOrder = order; G.scene.add(s); return s; };
    this.seam = sm(PALETTE.accent, 8); this.seamHot = sm('#fff1c4', 9);
  }
  dispose() {
    this.G.camera.remove(this.root); this.G.scene.remove(this.seam, this.seamHot); this.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); for (const k in this.models) this.models[k].userData.mat.dispose();
    this.seam.material.dispose(); this.seamHot.material.dispose(); this.muzzleFlash.material.dispose();
    if (this.on) { this.on = false; this.G.input.setMode('drive'); this.G.fx.fp = false; }
  }
  say(text, dur = 1) { this.note = text; this.noteT = dur; }
  get touch() { return this.G.input.usingTouch; }

  // ---- in and out ----
  // why: auto / manual (your own turret), or harpoon / kill (a seat on `unit`, another crew member's vehicle)
  enter(why, unit = null) {
    const m = this.m, G = this.G, was = this.on;
    this.on = true; this.why = why; this.mount = unit; this.seatId = unit ? unit.role : 'rig'; this.lock = null; this.lockT = 0; this.locked = false; this.wasFiring = true; this.shotT = 0; this.eyeY = null; this.lastRef = null;
    this.setWeapon(why === 'kill' ? 'rocket' : why === 'harpoon' ? why : 'mg', true); this.swapT = 0.35;
    // you arrive looking at what you came to shoot
    this.placeSeam(0); this.eye(_o); _p.copy(this.weak).sub(_o);
    this.yaw = Math.atan2(_p.x, _p.z); this.pitch = clamp(Math.atan2(_p.y, Math.hypot(_p.x, _p.z)), FEEL.gunPitchMin, FEEL.gunPitchMax);
    m.rig.model.userData.turret.visible = !!unit; if (was) G.input.reseat(); else G.input.setMode('gun'); G.audio.modeIn();
  }
  exit() {
    if (!this.on) return; const m = this.m; this.on = false; this.mount = null; this.seatId = 'rig'; this.lock = null; this.locked = false; this.seam.visible = this.seamHot.visible = false; this.root.visible = false;
    m.rig.model.userData.turret.visible = true; m.rig.aim = this.yaw; this.G.input.setMode('drive'); this.G.audio.modeOut(); this.G.fx.fp = false;
  }
  setWeapon(w, quiet) { if (this.weapon === w && !quiet) return; this.weapon = w; this.swapT = quiet ? 1 : 0; this.lock = null; this.lockT = 0; this.locked = false; if (!quiet) this.G.audio.swap(); }
  swap() {
    if (this.m.phase !== 'chase') return false;
    if (this.weapon === 'mg' && this.rockets <= 0) { this.say('NO ROCKETS'); this.G.audio.dry(); return false; }
    this.setWeapon(this.weapon === 'mg' ? 'rocket' : 'mg'); return true;
  }

  // where your eye is: above the turret mount, riding the truck
  eye(out) { if (this.mount) return this.m.convoy.eyeOf(this.mount, out); const r = this.m.rig; r.model.updateMatrixWorld(true); r.muzzle(out); out.y += FEEL.gunEyeHeight; return out; }
  dir(out, yaw = this.yaw, pitch = this.pitch) { const c = Math.cos(pitch); return out.set(Math.sin(yaw) * c, Math.sin(pitch), Math.cos(yaw) * c); }
  bandGeo(out) { // centre, radius and height of the band you are working on
    const s = this.m.storm, b = s.band; if (!b || !s.alive) return null; s.spineAt(b.v, _w);
    out.cx = s.x + _w.x; out.cz = s.z + _w.z; out.r = s.radiusAt(b.v) * 1.16 + 2.5; out.y = s.groundY + b.v * s.height; return out;
  }
  // the seam drifts back and forth across the face of the band that is turned toward you
  placeSeam(dt) {
    const m = this.m, B = this.bandGeo(_bg); this.weakT += dt; if (!B) return false;
    if (m.phase !== 'chase' && m.phase !== 'surge') { m.aimPoint(this.weak); this.weakR = Math.max(9, B.r * 0.6); return true; } // the finale: one glowing place to put the harpoon, then the rocket
    const face = Math.atan2(m.rig.z - B.cz, m.rig.x - B.cx), a = face + 0.6 * Math.sin(this.weakT * 0.8) + 0.22 * Math.sin(this.weakT * 2.1 + 1);
    this.weak.set(B.cx + Math.cos(a) * B.r, B.y, B.cz + Math.sin(a) * B.r); this.weakR = Math.max(6, B.r * 0.33); return true;
  }

  // ---- buttons and sights (called every step while the fight is on) ----
  handle(dt, input) {
    const m = this.m, G = this.G, ph = m.phase;
    if (input.take('mode')) {
      if (this.on) { if (ph !== 'chase') G.audio.deny(); else m.leaveGun(true); } // the finale seats are not yours to leave
      else if (ph === 'chase') m.enterGun('manual'); else G.audio.deny();
    }
    if (!this.on) return;
    if (input.take('swap') && !this.swap()) G.hud.deny('btn-swap');
    input.aimDelta(_px); input.aimKeys(_ky);
    // a finger's drag turns the gun about as far as it moved across the picture; on a target the sights slow down so a thumb can hold it
    const perPx = G.camera.fov * Math.PI / 180 / Math.max(320, window.innerHeight) * (this.touch ? 1.5 : 0.8) * (this.touch && this.aim.kind ? 0.62 : 1);
    this.yaw -= _px.x * perPx + _ky.x * 1.5 * dt; this.pitch -= _px.y * perPx - _ky.y * 1.0 * dt;
    this.swayX += clamp(_px.x * 0.0009, -0.05, 0.05); this.swayY += clamp(_px.y * 0.0009, -0.05, 0.05);
    this.pitch = clamp(this.pitch, FEEL.gunPitchMin, FEEL.gunPitchMax); this.yaw = wrap(this.yaw);
  }

  // one ray against everything that can be shot. `assist` widens targets (touch).
  trace(o, d, assist, out) {
    const m = this.m, s = m.storm; let best = 1e9; out.kind = null; out.ref = null; out.crit = false;
    for (const z of m.hz) {
      if (!z || z.state === 'gone') continue; const h = z.h, vx = h.x - o.x, vy = h.y - o.y, vz = h.z - o.z, t = vx * d.x + vy * d.y + vz * d.z;
      if (t < 3 || t > m.p.wreckRange || t > best) continue; // each rig's gun reaches wreckage its own distance
      const d2 = vx * vx + vy * vy + vz * vz - t * t, R = Math.max(z.big ? 3.6 : 2.8, t * 0.028) * assist;
      if (d2 < R * R) { best = t; out.kind = 'haz'; out.ref = z; out.crit = d2 < R * R * 0.18; }
    }
    const dxz = d.x * d.x + d.z * d.z;
    if (dxz > 0.003) for (const st of m.sats) {
      if (st.dead) continue; const q = st.storm, vx = q.x - o.x, vz = q.z - o.z, t = (vx * d.x + vz * d.z) / dxz; if (t < 3 || t > 320 || t > best) continue;
      const ex = vx - d.x * t, ez = vz - d.z * t, R = Math.max(8, t * 0.03) * assist, y = o.y + d.y * t;
      if (ex * ex + ez * ez < R * R && y > q.groundY - 4 && y < q.groundY + 85) { best = t; out.kind = 'sat'; out.ref = st; out.crit = false; }
    }
    const B = this.bandGeo(_bg);
    if (B && dxz > 0.003) {
      const kill = m.phase !== 'chase', rr = B.r + 2 + (assist - 1) * 8, ox = o.x - B.cx, oz = o.z - B.cz, bq = 2 * (ox * d.x + oz * d.z), c = ox * ox + oz * oz - rr * rr, disc = bq * bq - 4 * dxz * c;
      if (disc >= 0 && c > 0) {
        const t = (-bq - Math.sqrt(disc)) / (2 * dxz), y = o.y + d.y * t, hh = Math.max(10, t * 0.045) * assist * (kill ? 2.4 : 1);
        if (t > 3 && t < best && Math.abs(y - B.y) < hh) { best = t; out.kind = kill ? 'core' : 'band'; out.ref = s.band; _p.copy(o).addScaledVector(d, t); out.crit = _p.distanceTo(this.weak) < this.weakR * (assist > 1 ? 1.25 : 1); }
      }
      // the rest of its body (2.14): the whole funnel answers a round, though only the band of it around the heart is where it
      // really hurts. Walk the hit height onto the funnel's own shape: its radius and spine at the height the ray meets it
      if (!kill && out.kind !== 'band') {
        let v = (B.y - s.groundY) / s.height, tt = 0;
        for (let i = 0; i < 3 && v >= 0; i++) {
          s.spineAt(v, _w); const cx = s.x + _w.x, cz = s.z + _w.z, r = s.radiusAt(v), ox = o.x - cx, oz = o.z - cz, b2 = 2 * (ox * d.x + oz * d.z), c2 = ox * ox + oz * oz - r * r, q = b2 * b2 - 4 * dxz * c2;
          if (q < 0 || c2 <= 0) { v = -1; break; } tt = (-b2 - Math.sqrt(q)) / (2 * dxz); v = (o.y + d.y * tt - s.groundY) / s.height; if (v < 0 || v > 0.85) v = -1;
        }
        if (v >= 0 && tt > 3 && tt < best) { best = tt; out.kind = 'hide'; out.ref = s; out.crit = false; }
      }
    }
    out.t = best; if (out.kind) out.point.copy(o).addScaledVector(d, best); return out;
  }
  // where a miss ends up: on the ground, or a long way off
  farPoint(o, d, out) { for (let t = 20; t <= 420; t += 40) { out.copy(o).addScaledVector(d, t); if (out.y < this.G.fx.ground(out.x, out.z)) { out.addScaledVector(d, -20); out.y = Math.max(out.y, this.G.fx.ground(out.x, out.z) + 0.3); return true; } } return false; }
  refPoint(a, out) { // the live position of whatever is under the sights
    if (a.kind === 'haz') return out.set(a.ref.h.x, a.ref.h.y, a.ref.h.z);
    if (a.kind === 'sat') return out.set(a.ref.storm.x, a.ref.storm.groundY + 16, a.ref.storm.z);
    if (a.crit || a.kind === 'core') return out.copy(this.weak);
    const B = this.bandGeo(_bg); return B ? out.set(B.cx, B.y, B.cz) : out.copy(a.point);
  }

  // ---- every step in the seat: what is under the sights, lock, trigger ----
  update(dt, input) {
    const m = this.m, G = this.G, fx = G.fx, ph = m.phase; this.noteT -= dt; this.hitT -= dt; this.reload = Math.max(0, this.reload - dt); this.shotT -= dt;
    this.recoil = Math.max(0, this.recoil - dt * 9); this.kick *= Math.exp(-dt * 14); this.flashT -= dt; this.swapT = Math.min(1, this.swapT + dt * 5);
    this.swayX *= Math.exp(-dt * 9); this.swayY *= Math.exp(-dt * 9);
    const seam = this.placeSeam(dt); this.eye(_o); if (G.bot) this.bot(_o, dt);
    const assist = this.touch ? FEEL.aimAssist : 1, a = this.trace(_o, this.dir(_d), assist, this.aim);
    // touch: the sights ride along with whatever they are on, half as fast as it moves. On the critical core they hold for
    // everyone: the truck is circling it, and the kill shot is a lock to take, not a target to chase.
    if (a.kind) {
      this.refPoint(a, _p).sub(_o); const az = Math.atan2(_p.x, _p.z), el = Math.atan2(_p.y, Math.hypot(_p.x, _p.z)), ride = a.kind === 'core' ? 0.92 : this.touch ? 0.5 : 0;
      if (ride && a.ref === this.lastRef) { this.yaw = wrap(this.yaw + wrap(az - this.lastAz) * ride); this.pitch = clamp(this.pitch + (el - this.lastEl) * ride, FEEL.gunPitchMin, FEEL.gunPitchMax); }
      this.lastRef = a.ref; this.lastAz = az; this.lastEl = el;
    } else this.lastRef = null;
    // rockets want a moment on the target; then they follow it
    const rocket = this.weapon === 'rocket', locks = rocket || this.weapon === 'harpoon', lockable = locks && m.canFire && (a.kind === 'haz' || a.kind === 'sat' || a.kind === 'core' || (a.kind === 'band' && m.inZone)); // no lock on a shot that would be refused
    if (lockable) { if (this.lock && this.lock.ref === a.ref) this.lockT += dt; else { this.lock = { kind: a.kind, ref: a.ref }; this.lockT = 0; this.locked = false; } this.lockLost = 0; }
    else if (this.lock) { this.lockLost += dt; if (this.lockLost > 0.3 || !locks) { this.lock = null; this.lockT = 0; this.locked = false; } }
    if (this.lock && this.lock.kind === 'haz' && this.lock.ref.state === 'gone') { this.lock = null; this.lockT = 0; this.locked = false; }
    const locked = !!this.lock && this.lockT >= FEEL.rocketLockSeconds; if (locked && !this.locked) G.audio.lock(); this.locked = locked;
    // the trigger
    const firing = input.firing || !!this.botFire, edge = firing && !this.wasFiring; this.wasFiring = firing;
    if (ph === 'kill') { if (edge) { if (locked) m.killShot(); else if (m.reload <= 0) { this.say('AIM AT THE CORE'); G.audio.deny(); G.hud.deny('btn-fire'); } } }
    else if (ph === 'stagger') { if (edge && !m.harpoonBusy) { if (!m.canFire) { this.say('CLOSING IN', 0.8); G.audio.deny(); G.hud.deny('btn-fire'); } else if (!locked) { this.say('AIM AT THE GLOW'); G.audio.deny(); G.hud.deny('btn-fire'); } else if (m.fireHarpoon()) { this.recoil = 1.6; this.kick += 0.03; } else G.hud.deny('btn-fire'); } }
    else if (ph !== 'chase') { /* nothing to shoot at between phases */ }
    else if (rocket) { if (edge) this.fireRocket(); }
    else if (firing && this.shotT <= 0) { this.shotT = m.gun.every; this.shoot(assist); }
    if (this.mg.userData.spin) { this.spinV += ((firing && !rocket ? 34 : 0) - this.spinV) * Math.min(1, dt * 6); this.mg.userData.spin.rotation.z += this.spinV * dt; }
    // the seam marker
    const show = seam && m.storm.alive && (ph === 'chase' || ph === 'kill' || ph === 'stagger'); this.seam.visible = this.seamHot.visible = show;
    if (show) { const pulse = 1 + 0.16 * Math.sin(this.weakT * (ph === 'chase' ? 9 : 16)), sz = this.weakR * 1.6 * pulse; this.seam.position.copy(this.weak); this.seam.scale.set(sz, sz, 1); this.seamHot.position.copy(this.weak); this.seamHot.scale.set(sz * 0.36, sz * 0.36, 1); this.seam.material.opacity = m.inZone || ph !== 'chase' ? 0.95 : 0.4; }
  }
  muzzlePoint(out) { return out.copy(_o).addScaledVector(this.dir(_e), this.weapon === 'mg' ? 2.0 : 1.4).add(_e.set(0, -0.42, 0)); }

  shoot(assist) {
    const m = this.m, G = this.G, fx = G.fx, snd = m.gun.sound, every = m.gun.every, sp = snd === 'minigun' ? 0.011 : snd === 'cannon' ? 0.002 : 0.005;
    m.stats.rounds++; m.rec.rounds[m.stage] = (m.rec.rounds[m.stage] || 0) + 1; // every round, for accuracy
    this.dir(_d); _d.x += (Math.random() - 0.5) * sp; _d.y += (Math.random() - 0.5) * sp; _d.z += (Math.random() - 0.5) * sp; _d.normalize();
    const h = this.trace(_o, _d, assist, this.hit); this.muzzlePoint(_m);
    if (!h.kind && !this.farPoint(_o, _d, h.point)) h.point.copy(_o).addScaledVector(_d, 420);
    fx.tracer(_m, h.point); if (snd === 'cannon') fx.tracer(_m, h.point); G.audio[snd]();
    this.recoil = 1; this.kick += snd === 'cannon' ? 0.012 : 0.0045; this.flashT = 0.045; if (snd === 'cannon') fx.shake(2);
    const far = h.kind ? h.t : _o.distanceTo(h.point), k = Math.max(1, far * 0.028), P = h.point;
    if (!h.kind) { if (far < 400 && Math.random() < 0.5) fx.puff(P.x, P.y + 0.4, P.z, 1.5 * k, '#b89a58', 0.4, 2); return; }
    const crit = h.crit, mul = crit ? FEEL.gunCrit : 1; if (h.kind !== 'hide') { m.stats.fired++; m.rec.hits[m.stage] = (m.rec.hits[m.stage] || 0) + 1; } // a glancing round on its body is not one on something you can properly hurt
    if (h.kind === 'haz') {
      const z = h.ref, hz = z.h, T = TARGET[hz.kind]; z.hp -= m.p.mgDps * every * mul; hz.hitFlash = 1; hz.dmg = clamp(1 - z.hp / z.max, 0, 1);
      fx.flashAt(P.x, P.y, P.z, (crit ? 3.4 : 2.2) * k, crit ? '#fff1c4' : '#ffd27a', 0.07); fx.sparks(P.x, P.y, P.z, crit ? 5 : 2, k, 14, crit ? '#fff1c4' : '#ffd27a');
      if (Math.random() < (crit ? 0.6 : 0.25)) fx.debris(P.x, P.y, P.z, 1, T.cols, 0.35 * k, 9);
      if (z.hp <= 0) { m.dropHazard(z, 'mg'); this.feedback('kill', T.name, 0, 'haz'); } else this.feedback(crit ? 'crit' : 'hit', T.name, z.hp / z.max, 'haz');
      if (crit) m.stats.crits++;
    } else if (h.kind === 'sat') { // bullets go straight through a twister
      const st = h.ref; st.hp -= m.p.mgDps * every * FEEL.gunSatMul; fx.sparks(P.x, P.y, P.z, 1, k, 10, '#9fb0ac');
      if (st.hp <= 0) { m.killSat(st); this.feedback('kill', 'SATELLITE', 0, 'sat'); } else { this.feedback('weak', 'SATELLITE', st.hp / 100, 'sat'); this.say(this.rockets > 0 ? 'ARMOURED: USE A ROCKET' : 'ARMOURED', 0.8); }
    } else if (!m.inZone) { this.feedback('far', m.def.name.toUpperCase(), m.shield, 'band'); this.say('OUT OF RANGE', 0.6); }
    else if (h.kind === 'hide') { // its body: it flinches and sparks, a glancing share of the damage, and the sights say where it hurts
      fx.sparks(P.x, P.y, P.z, 2, k, 12, '#9fb0ac'); const before = m.stage; m.damageStorm(m.p.gunStorm * every * FEEL.hideShare, P, false);
      this.feedback(m.stage !== before || m.phase !== 'chase' ? 'kill' : 'weak', m.def.name.toUpperCase(), m.shield, 'band'); this.say('AIM FOR THE HEART', 0.8);
    }
    else {
      fx.flashAt(P.x, P.y, P.z, (crit ? 5 : 3) * k, crit ? '#ffffff' : '#ffd27a', crit ? 0.1 : 0.06); fx.sparks(P.x, P.y, P.z, crit ? 6 : 2, k, 16, crit ? PALETTE.accent : '#ffd27a');
      const before = m.stage; m.damageStorm(m.p.gunStorm * every * mul, P, crit); if (crit) m.stats.crits++;
      this.feedback(m.stage !== before || m.phase !== 'chase' ? 'kill' : crit ? 'crit' : 'hit', m.def.name.toUpperCase(), m.shield, 'band');
    }
  }
  // the marker on the reticle, the sound in your ear, the bar under the sights
  feedback(kind, label, frac, what) {
    const G = this.G; G.hud.hit(kind); G.hud.target(label, frac, what);
    if (kind === 'kill') G.audio.kill(); else if (this.hitT <= 0) { this.hitT = 0.055; if (kind === 'crit') { const t = this.m.time; if (t - (this.critAt || -9) > 0.4) this.critFrom = t; this.critAt = t; G.audio.crit(Math.floor((t - this.critFrom) / 0.5)); } else if (kind === 'weak' || kind === 'far') G.audio.plink(); else G.audio.hit(what === 'band'); }
  }

  fireRocket() {
    const m = this.m, G = this.G, fx = G.fx; if (this.reload > 0) return;
    if (this.rockets <= 0) { this.say('NO ROCKETS'); G.audio.dry(); G.hud.deny('btn-fire'); return; }
    this.rockets--; this.reload = 1.1; m.stats.rockets++; this.recoil = 1.6; this.kick += 0.03; this.flashT = 0.09;
    const L = this.locked ? this.lock : null, a = this.aim, fixed = new THREE.Vector3(); this.dir(_d);
    if (a.kind) fixed.copy(a.point); else if (!this.farPoint(_o, _d, fixed)) fixed.copy(_o).addScaledVector(_d, 380);
    let get = (out) => out.copy(fixed);
    if (L && L.kind === 'haz') { const z = L.ref, h = z.h; get = (out) => (z.state !== 'gone' ? fixed.set(h.x, h.y, h.z) : fixed, out.copy(fixed)); }
    else if (L && L.kind === 'sat') { const q = L.ref.storm; get = (out) => out.set(q.x, q.groundY + 16, q.z); }
    else if (L && L.kind === 'band') { const ang0 = Math.atan2(fixed.z - _bg.cz, fixed.x - _bg.cx), B = { cx: 0, cz: 0, r: 0, y: 0 }; get = (out) => (this.bandGeo(B) ? out.set(B.cx + Math.cos(ang0) * B.r, B.y, B.cz + Math.sin(ang0) * B.r) : out.copy(fixed)); }
    const from = this.muzzlePoint(_m).clone();
    fx.flashAt(from.x, from.y, from.z, 5, '#ffb14a', 0.12); fx.puff(_o.x - _d.x * 2, _o.y - 0.5, _o.z - _d.z * 2, 5, '#e9e2cc', 0.5, 2);
    G.audio.rocket(); fx.shake(5); this.lock = null; this.lockT = 0; this.locked = false;
    fx.rocket(from, get, FEEL.rocketSpeed, (pt) => this.blast(pt, L));
    if (this.rockets <= 0) { this.say('LAST ROCKET AWAY', 1.2); this.setWeapon('mg'); }
  }
  // a rocket has gone off at pt: everything close comes apart, and a band in reach loses a bite
  blast(pt, L) {
    const m = this.m, G = this.G, fx = G.fx; if (m.result) { fx.explode(pt.x, pt.y, pt.z, 18); return; }
    fx.burst(pt.x, pt.y, pt.z, 20, ['#2a2420', '#6e5637', '#ff9a3c'], 6); G.audio.boom(0.9); fx.shake(FEEL.shakeRocket); let got = 0, label = '';
    for (const z of m.hz) { if (!z || z.state === 'gone') continue; const h = z.h; if ((L && L.ref === z) || Math.hypot(h.x - pt.x, h.y - pt.y, h.z - pt.z) < FEEL.rocketSplash) { label = TARGET[h.kind].name; m.dropHazard(z, 'rocket'); got++; } }
    for (const st of m.sats) { if (st.dead) continue; const q = st.storm; if ((L && L.ref === st) || (Math.hypot(q.x - pt.x, q.z - pt.z) < FEEL.rocketSplash && pt.y < q.groundY + 95)) { m.killSat(st); label = 'SATELLITE'; got++; } }
    const B = this.bandGeo(_bg);
    if (B && m.phase === 'chase' && Math.abs(Math.hypot(pt.x - B.cx, pt.z - B.cz) - B.r) < 16 && Math.abs(pt.y - B.y) < 24) {
      if (m.inZone) { const before = m.stage; fx.hitStop(FEEL.hitStopRocket); m.damageStorm(FEEL.rocketStorm * m.stageMax, pt, true); G.hud.hit(m.stage !== before || m.phase !== 'chase' ? 'kill' : 'crit'); G.hud.target(m.def.name.toUpperCase(), m.shield, 'band'); G.audio.crit(); m.stats.direct++; }
      else this.say('OUT OF RANGE', 0.8);
    }
    if (got) { fx.hitStop(FEEL.hitStopRocket); G.hud.hit('kill'); G.hud.target(got > 1 ? `${got} DESTROYED` : label, 0, 'haz'); G.audio.kill(); if (got > 1) m.call(`${got} WITH ONE ROCKET`, 'good', 0.9); m.stats.direct++; }
  }
  resupply() { const n = Math.min(FEEL.rocketResupply, this.rocketMax - this.rockets); if (n > 0) { this.rockets += n; return n; } return 0; }

  // ---- autodrive: holds the truck inside the danger zone, on a road when one runs its way, round anything solid ----
  autodrive(dt, r = this.m.rig) {
    const m = this.m, s = m.storm, w = this.G.world, d = r === m.rig ? m.dist : Math.hypot(r.x - s.x, r.z - s.z), hx = Math.sin(r.heading), hz = Math.cos(r.heading), sp = Math.hypot(r.vx, r.vz);
    if (this.backT > 0) { this.backT -= dt; return { steer: this.backSteer, throttle: -1 }; }
    const tx = s.x + s.vx * 0.6 - r.x, tz = s.z + s.vz * 0.6 - r.z, tl = Math.hypot(tx, tz) || 1, ux = tx / tl, uz = tz / tl;
    let px = -uz, pz = ux; if (px * hx + pz * hz < 0) { px = -px; pz = -pz; }
    let dx, dz, throttle = 1;
    if (m.phase === 'kill' || m.phase === 'dorothy' || m.phase === 'rip') { const e = clamp((d - 140) / 40, -1, 1); dx = px + ux * e; dz = pz + uz * e; throttle = sp > 34 ? 0 : 1; }
    else {
      // too far: straight at it. At the standoff: alongside. Too close: swing wide and ease off.
      const e = clamp((d - m.zone * FEEL.autoStandoff) / 55, -1, 1), k = 1 - Math.abs(e); dx = ux * e + px * k; dz = uz * e + pz * k;
      if (sp > r.topSpeed * FEEL.autoSpeed || (e < -0.5 && sp > 22)) throttle = 0;
      const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
      // roads are faster: merge onto one that runs the way you are going
      if (Math.abs(dz) > 0.82) { const off = w.nearestRoadLine(r.x) - r.x; if (Math.abs(off) < 80) dx += clamp(off / 45, -0.55, 0.55); }
      else if (Math.abs(dx) > 0.82) { const off = w.nearestRoadLine(r.z) - r.z; if (Math.abs(off) < 80) dz += clamp(off / 45, -0.55, 0.55); }
    }
    if (Math.abs(r.x) > HALF - 160) dx -= Math.sign(r.x) * 0.9; if (Math.abs(r.z) > HALF - 160) dz -= Math.sign(r.z) * 0.9;
    // normal navigation: buildings, trees, wrecks on the ground and satellite twisters are steered round
    let avoid = 0; const look = 16 + sp * 0.8;
    const see = (x, z, rad, wgt) => { const ox = x - r.x, oz = z - r.z, f = ox * hx + oz * hz; if (f < -2 || f > look) return; const lat = oz * hx - ox * hz; if (Math.abs(lat) < rad) avoid += (lat >= 0 ? -1 : 1) * (1 - Math.max(0, f) / look) * wgt; };
    w.near(r.x + hx * look * 0.5, r.z + hz * look * 0.5, look * 0.5 + 14, (p) => { if (p.state === 0 && !p.kit.soft) see(p.x, p.z, p.r + (p.kit.tree ? 2.6 : 3.6), p.kit.tree ? 1 : 2.2); });
    for (const z of m.hz) if (z && z.state === 'wreck') see(z.h.x, z.h.z, 6, 1.6);
    for (const st of m.sats) if (!st.dead) see(st.storm.x, st.storm.z, 15, 2.2);
    // wedged against something: back out and try the other way
    if (sp < 2.5 && throttle > 0 && !r.stun && r.air <= 0) { this.stuckT += dt; if (this.stuckT > 0.9) { this.stuckT = 0; this.backT = 0.9; this.backSteer = avoid >= 0 ? -1 : 1; } } else this.stuckT = 0;
    return { steer: clamp((hx * dz - hz * dx) * 3 + avoid, -1, 1), throttle };
  }

  // ---- the camera on the gun, and the gun in front of the camera ----
  camera(dt, cam, calm) {
    const m = this.m, r = m.rig, fx = this.G.fx; this.eye(_o);
    this.eyeY = this.eyeY === null ? _o.y : this.eyeY + (_o.y - this.eyeY) * Math.min(1, dt * 12); // the suspension takes the edge off the ground
    cam.position.set(_o.x, this.eyeY, _o.z);
    const own = !this.mount, sh = fx.shakeAmt * 0.022 + (calm || !own ? 0 : Math.max(0, r.speedFrac - 0.6) * 0.012); if (sh > 0) { cam.position.x += (Math.random() - 0.5) * sh; cam.position.y += (Math.random() - 0.5) * sh; cam.position.z += (Math.random() - 0.5) * sh; }
    cam.rotation.set(this.pitch + (calm ? 0 : this.kick), this.yaw + Math.PI, calm || !own ? 0 : -(r.lean || 0) * 0.5, 'YXZ');
    // the weapon: drops away and comes back on a swap, kicks on every round, lags the sights a touch
    const k = this.swapT, drop = (1 - k) * (1 - k) * 0.7, rk = calm ? 0 : this.recoil, mgOn = this.weapon === 'mg' || this.weapon === 'harpoon', g = this.models[this.weapon];
    for (const key in this.models) this.models[key].visible = this.models[key] === g; this.root.visible = true;
    const tall = cam.aspect < 1; g.scale.setScalar(tall ? 0.6 : 1); // portrait: a narrow picture, so the weapon is drawn smaller to leave the same share of it clear
    g.position.set((calm ? 0 : this.swayX) * 0.6, (mgOn ? -0.5 : -0.56) * (tall ? 1.25 : 1) - drop - (calm ? 0 : this.swayY) * 0.4, (mgOn ? -1.3 : -1.34) + rk * (mgOn ? 0.035 : 0.09)); g.rotation.set((mgOn ? 0.13 : 0.12) + rk * 0.012 - drop * 0.5, (calm ? 0 : this.swayX) * 0.5, 0);
    if (g === this.pod) this.pod.userData.tips.forEach((t, i) => { t.visible = m.phase === 'kill' ? i === 0 && m.reload <= 0 : i < this.rockets; });
    const f = this.muzzleFlash; f.visible = this.flashT > 0 && k >= 1;
    if (f.visible) { f.position.copy(g.userData.muzzle).multiplyScalar(g.scale.x).applyEuler(g.rotation).add(g.position); const sz = (mgOn ? 0.5 : 1.1) * g.scale.x * (0.8 + Math.random() * 0.5); f.scale.set(sz, sz, 1); f.material.rotation = Math.random() * 6; }
    cam.updateMatrixWorld();
  }

  // tests only: an aimer that tracks the most urgent thing and holds the trigger
  bot(o, dt = 0) {
    const m = this.m; let z = null, soon = 1e9; this.botFire = false; if (m.phase !== 'chase') { _p.copy(this.weak).sub(o); this.botFire = this.locked && !this.wasFiring; }
    else {
      for (const h of m.hz) if (h && h.state === 'fly' && h.h.dur - h.h.t < soon && h.h.t > 0.25 && m.willHit(h)) { soon = h.h.dur - h.h.t; z = h; } // it reads the ring: only a piece that will hit is worth leaving the seam for
      if (this.G.bot === 'storm') z = null;
      if (z) { _p.set(z.h.x, z.h.y, z.h.z).sub(o); const want = z.big && this.rockets > 0 && !this.G.botGunOnly ? 'rocket' : 'mg'; if (this.weapon !== want) this.setWeapon(want); this.botFire = want === 'mg' || (this.locked && !this.wasFiring); }
      else { if (this.weapon !== 'mg') this.setWeapon('mg'); _p.copy(this.weak).sub(o); this.botFire = m.inZone; }
    }
    // G.botAim { deg, delay, rest }: a thumb. It takes `delay` s to swing onto a new target (and keeps firing where it was),
    // its sights sit `deg` degrees off whatever it is tracking (so a small piece far away is missed, a close one is hit),
    // and it is off the trigger a share of the time. A model of a mediocre player, for tests/fullfight.mjs.
    const A = this.G.botAim;
    if (A && m.phase === 'chase') {
      const key = z || 'seam'; if (key !== this.botKey) { this.botKey = key; this.botSwing = A.delay; }
      if (this.botSwing > 0) { this.botSwing -= dt; this.botFire = this.weapon === 'mg' && m.inZone; return; } // still on the way over: the sights stay where they were
      const t = this.weakT, rad = A.deg * Math.PI / 180, yaw = Math.atan2(_p.x, _p.z) + rad * Math.sin(t * 1.7 + 0.6 * Math.sin(t * 0.37)), pit = Math.atan2(_p.y, Math.hypot(_p.x, _p.z)) + rad * 0.6 * Math.sin(t * 2.3 + 1);
      if (Math.sin(t * 0.9) < A.rest) this.botFire = false;
      this.yaw = yaw; this.pitch = clamp(pit, FEEL.gunPitchMin, FEEL.gunPitchMax); return;
    }
    // G.botLag (0..1): a sloppy aimer whose sights wander off the target and who lets go of the trigger now and then
    const lag = this.G.botLag || 0; if (lag && m.phase === 'chase') { const t = this.weakT, w = lag * 22 * Math.sin(t * 1.7), l = Math.hypot(_p.x, _p.z) || 1; _p.x += -_p.z / l * w; _p.z += _p.x / l * w; _p.y += lag * 6 * Math.sin(t * 2.3); if (Math.sin(t * 0.9) < -0.5) this.botFire = false; }
    this.yaw = Math.atan2(_p.x, _p.z); this.pitch = clamp(Math.atan2(_p.y, Math.hypot(_p.x, _p.z)), FEEL.gunPitchMin, FEEL.gunPitchMax);
  }
}
const _bg = { cx: 0, cz: 0, r: 0, y: 0 };
