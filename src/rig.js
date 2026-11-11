// The rig: a chunky model with one oversized feature (the harpoon turret) and kinematic arcade handling.
import * as THREE from '../vendor/three.module.min.js';
import { FEEL, WORLD } from './config.js';
import { box, cyl, merge } from './geo.js';

const HALF = WORLD.size / 2 - 40;
const _n = new THREE.Vector3(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _e = new THREE.Euler();

// Storm-chaser trucks: lifted, boxy, bolted-on. Roof light bar, bull bar, an instrument cradle in the bed.
const INK = '#1b2224', CHROME = '#c9cdca', GLASS = '#16262a', AMBER = '#ffc531', HAZ = '#e8b21c', RED = '#e2322c';

function bullBar(P, W, z, y) { P.push(box(0.12, 0.8, 0.12, INK, W * 0.3, y, z), box(0.12, 0.8, 0.12, INK, -W * 0.3, y, z), box(W * 0.86, 0.1, 0.1, INK, 0, y + 0.3, z), box(W * 0.86, 0.1, 0.1, INK, 0, y - 0.05, z), box(W * 0.3, 0.1, 0.1, INK, 0, y + 0.12, z)); }
function cradle(P, W, z, y) { // hazard-striped frame holding the probe canisters, beacon on the corner post
  for (const sx of [1, -1]) for (const sz of [1, -1]) P.push(box(0.1, 0.95, 0.1, HAZ, sx * W * 0.34, y + 0.47, z + sz * 0.3));
  P.push(box(W * 0.78, 0.1, 0.1, HAZ, 0, y + 0.95, z + 0.3), box(W * 0.78, 0.1, 0.1, HAZ, 0, y + 0.95, z - 0.3), box(0.1, 0.1, 0.7, INK, W * 0.34, y + 0.95, z), box(0.1, 0.1, 0.7, INK, -W * 0.34, y + 0.95, z), box(W * 0.26, 0.1, 0.1, INK, W * 0.2, y + 0.95, z + 0.3), box(W * 0.26, 0.1, 0.1, INK, -W * 0.2, y + 0.95, z - 0.3));
  for (const x of [-0.42, 0, 0.42]) P.push(cyl(0.2, 0.2, 0.75, '#62f58c', x, y + 0.42, z, 7), cyl(0.21, 0.21, 0.1, INK, x, y + 0.72, z, 7));
}

function buildModel(def, envMap, glowTex) {
  const g = new THREE.Group(), L = def.len, W = def.wid, id = def.id, P = [], lit = [];
  const wr = id === 'bulldog' ? 0.78 : 0.64, base = wr + 0.34; // lifted: daylight between tyre and arch
  let cabTop = base + 1.45, barZ = L * 0.06, bedZ = -L * 0.3, turretY = base + 0.55;
  P.push(box(W * 0.8, 0.26, L * 0.96, INK, 0, base - 0.22, 0)); // frame rails
  if (id === 'mule') {
    P.push(box(W, 0.62, L, def.body, 0, base + 0.25, 0), box(W + 0.03, 0.15, L * 0.985, def.trim, 0, base + 0.3, 0), box(W + 0.03, 0.07, L * 0.985, '#8a3415', 0, base + 0.1, 0));
    P.push(box(W * 0.95, 0.12, L * 0.3, def.body, 0, base + 0.6, L * 0.33));                                          // hood
    P.push(box(W * 0.94, 0.78, L * 0.29, def.body, 0, base + 0.94, L * 0.045), box(W * 0.96, 0.44, L * 0.2, GLASS, 0, base + 1.0, L * 0.045), box(W * 0.82, 0.46, L * 0.295, GLASS, 0, base + 1.0, L * 0.045), box(W * 0.97, 0.1, L * 0.3, def.trim, 0, base + 1.38, L * 0.045));
    P.push(box(0.14, 0.42, L * 0.38, def.body, W / 2 - 0.07, base + 0.72, bedZ - 0.1), box(0.14, 0.42, L * 0.38, def.body, -W / 2 + 0.07, base + 0.72, bedZ - 0.1), box(W, 0.42, 0.14, def.body, 0, base + 0.72, -L / 2 + 0.07), box(W * 0.9, 0.06, L * 0.36, INK, 0, base + 0.56, bedZ - 0.1));
    P.push(box(W * 0.82, 0.42, 0.08, CHROME, 0, base + 0.28, L / 2 + 0.03), box(W + 0.12, 0.2, 0.28, CHROME, 0, base - 0.02, L / 2 + 0.1), box(W + 0.12, 0.2, 0.22, CHROME, 0, base - 0.02, -L / 2 - 0.06));
    for (const sx of [1, -1]) for (const sz of [1, -1]) P.push(box(0.16, 0.14, wr * 2.5, INK, sx * (W / 2 + 0.06), base + 0.02, sz * L * 0.33));
    bullBar(P, W, L / 2 + 0.34, base + 0.2); cradle(P, W, -L / 2 + 0.5, base + 0.56);
    P.push(box(0.04, 1.9, 0.04, INK, -W * 0.44, base + 2.2, -L * 0.1), box(0.18, 0.5, 0.18, CHROME, W * 0.52, base + 1.05, L * 0.2));
    turretY = base + 0.58; bedZ = -L * 0.22;
  } else if (id === 'bulldog') {
    P.push(box(W, 0.95, L, def.body, 0, base + 0.42, 0), box(W + 0.36, 0.72, L * 0.86, '#3d5242', 0, base + 0.1, 0));                 // hull + side skirts over the tyres
    P.push(box(W * 0.98, 0.7, L * 0.3, def.body, 0, base + 0.82, L * 0.4, 0, 0.5), box(W * 0.9, 0.16, 0.5, HAZ, 0, base + 0.5, L / 2 + 0.12, 0, 0.5)); // wedge nose, hazard lip
    P.push(box(W * 0.9, 0.7, L * 0.42, def.body, 0, base + 1.2, -L * 0.02), box(W * 0.92, 0.16, L * 0.3, GLASS, 0, base + 1.3, 0), box(W * 0.74, 0.18, L * 0.425, GLASS, 0, base + 1.3, -L * 0.02), box(W * 0.6, 0.12, L * 0.2, '#3d5242', 0, base + 1.6, -L * 0.04));
    P.push(box(W * 0.94, 0.5, L * 0.26, '#3d5242', 0, base + 1.1, -L * 0.36), box(W + 0.4, 0.14, L * 0.9, INK, 0, base - 0.24, 0));
    for (const z of [-0.3, 0, 0.3]) P.push(box(W + 0.38, 0.5, 0.06, INK, 0, base + 0.1, z * L));
    P.push(box(0.04, 2.1, 0.04, INK, W * 0.4, base + 2.5, -L * 0.2));
    cabTop = base + 1.66; barZ = -L * 0.02; bedZ = -L * 0.36; turretY = base + 1.35;
  } else {
    P.push(box(W, 0.5, L, def.body, 0, base + 0.16, 0), box(W + 0.03, 0.12, L * 0.985, def.trim, 0, base + 0.2, 0), box(W * 0.92, 0.1, L * 0.34, def.body, 0, base + 0.45, L * 0.32)); // low tub
    P.push(box(W * 0.84, 0.36, 0.07, GLASS, 0, base + 0.68, L * 0.14, 0, -0.35), box(0.5, 0.6, 0.5, INK, W * 0.22, base + 0.6, -L * 0.02), box(0.5, 0.6, 0.5, INK, -W * 0.22, base + 0.6, -L * 0.02));
    for (const sx of [1, -1]) P.push(box(0.1, 1.15, 0.1, def.trim, sx * W * 0.44, base + 0.95, -L * 0.1), box(0.1, 0.1, L * 0.36, def.trim, sx * W * 0.44, base + 1.5, L * 0.07), box(0.1, 0.9, 0.1, def.trim, sx * W * 0.44, base + 1.05, L * 0.22, 0, -0.45));
    P.push(box(W * 0.9, 0.1, 0.1, def.trim, 0, base + 1.5, -L * 0.1), box(W * 0.9, 0.1, 0.1, def.trim, 0, base + 1.5, L * 0.24));
    P.push(cyl(0.62, 0.62, 0.34, INK, 0, base + 0.75, -L * 0.42, 10, Math.PI / 2 - 0.5), cyl(0.07, 0.07, W * 1.05, CHROME, 0, base - 0.05, L / 2 + 0.2, 6, 0, Math.PI / 2));
    cabTop = base + 1.56; barZ = -L * 0.1; bedZ = -L * 0.26; turretY = base + 0.42;
  }
  // roof light bar: four amber lamps, always on in the gloom
  P.push(box(W * 0.84, 0.1, 0.16, INK, 0, cabTop, barZ));
  for (const x of [-0.36, -0.12, 0.12, 0.36]) lit.push(box(0.3, 0.24, 0.22, AMBER, x * W, cabTop + 0.16, barZ));
  lit.push(box(0.44, 0.24, 0.1, '#fff6d6', W * 0.33, base + 0.3, L / 2 + 0.08), box(0.44, 0.24, 0.1, '#fff6d6', -W * 0.33, base + 0.3, L / 2 + 0.08), box(0.3, 0.2, 0.1, '#ff3f8e', W * 0.38, base + 0.3, -L / 2 - 0.03), box(0.3, 0.2, 0.1, '#ff3f8e', -W * 0.38, base + 0.3, -L / 2 - 0.03));
  const paint = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.2, envMap, envMapIntensity: 0.65 });
  g.add(new THREE.Mesh(merge(P), paint), new THREE.Mesh(merge(lit), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })));
  // the turret: the one thing that makes it a hunter's rig
  const turret = new THREE.Group(); turret.position.set(0, turretY, bedZ);
  turret.add(new THREE.Mesh(merge([cyl(0.5, 0.62, 0.5, INK, 0, 0.25, 0, 8), box(0.56, 0.5, 0.74, AMBER, 0, 0.75, 0), box(0.58, 0.12, 0.3, INK, 0, 0.75, 0.1), cyl(0.16, 0.2, 2.7, '#f3ecd8', 0, 0.85, 1.45, 6, Math.PI / 2), cyl(0.05, 0.32, 0.75, '#ff3f8e', 0, 0.85, 3.0, 4, Math.PI / 2), cyl(0.46, 0.46, 0.5, INK, 0.58, 0.75, -0.1, 8, 0, Math.PI / 2), cyl(0.3, 0.3, 0.54, '#b9b39f', 0.58, 0.75, -0.1, 8, 0, Math.PI / 2)]), paint));
  g.add(turret); g.userData.turret = turret;
  const wheelGeo = merge([cyl(wr, wr, 0.56, '#15191a', 0, 0, 0, 12, 0, Math.PI / 2), cyl(wr * 0.52, wr * 0.52, 0.6, CHROME, 0, 0, 0, 6, 0, Math.PI / 2), cyl(wr * 0.2, wr * 0.2, 0.64, INK, 0, 0, 0, 6, 0, Math.PI / 2)]);
  const wm = new THREE.MeshLambertMaterial({ vertexColors: true }); g.userData.wheels = [];
  const track = W / 2 + (id === 'whippet' ? 0.3 : 0.14);
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const w = new THREE.Mesh(wheelGeo, wm); w.position.set(sx * track, wr, sz * L * 0.33); w.rotation.order = 'YXZ'; w.userData.front = sz > 0; g.add(w); g.userData.wheels.push(w); }
  // glows: headlights and a red beacon that actually flash (sprites, additive)
  g.userData.glows = [];
  if (glowTex) {
    const glow = (color, x, y, z, size, kind) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true })); sp.position.set(x, y, z); sp.scale.setScalar(size); sp.userData.kind = kind; sp.userData.size = size; g.add(sp); g.userData.glows.push(sp); };
    glow('#fff1c4', W * 0.33, base + 0.3, L / 2 + 0.2, 1.15, 'head'); glow('#fff1c4', -W * 0.33, base + 0.3, L / 2 + 0.2, 1.15, 'head');
    glow('#ffb52e', -W * 0.3, cabTop + 0.2, barZ, 1.5, 'barA'); glow('#ffb52e', W * 0.3, cabTop + 0.2, barZ, 1.5, 'barB');
    if (id === 'mule') { g.add(new THREE.Mesh(merge([cyl(0.14, 0.16, 0.26, RED, W * 0.34, base + 1.7, -L / 2 + 0.8, 7)]), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }))); glow('#ff3a2e', W * 0.34, base + 1.72, -L / 2 + 0.8, 1.9, 'beacon'); }
  }
  g.userData.muzzle = new THREE.Vector3(0, turretY + 0.85, bedZ);
  g.scale.setScalar(1.2); // chunky on purpose: it has to read at 40 px on a phone
  return g;
}

export class Rig {
  constructor(scene, def, envMap, mods) {
    this.def = def; this.mods = mods; this.scene = scene;
    this.model = buildModel(def, envMap, mods.glow); scene.add(this.model); this.alert = 0; this.clock = 0;
    const sh = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.32, depthWrite: false, fog: false }));
    sh.rotation.x = -Math.PI / 2; sh.scale.set(def.wid * 1.1, def.len * 0.95, 1); sh.renderOrder = 1; scene.add(sh); this.shadow = sh;
    this.x = 0; this.z = 0; this.y = 0; this.heading = 0; this.vx = 0; this.vz = 0; this.speed = 0;
    this.hullMax = FEEL.hullBase * def.hull * mods.hull; this.hull = this.hullMax;
    this.boostT = 0; this.boostCharge = 1; this.stun = 0; this.immune = 0; this.air = 0; this.vy = 0; this.surface = 0;
    this.gripMul = 1; this.pitch = 0; this.roll = 0; this.squat = 0; this.wheelSpin = 0; this.aim = 0; this.throttle = 0; this.dead = false;
  }
  dispose() { this.scene.remove(this.model); this.scene.remove(this.shadow); }
  place(x, z, heading, world) { this.x = x; this.z = z; this.heading = heading; this.vx = this.vz = this.speed = 0; this.y = world.heightAt(x, z); this.sync(world, 0); }
  get topSpeed() { return (this.surface > 0 ? FEEL.rigTopSpeedRoad : FEEL.rigTopSpeedField) * this.def.speed * (this.boostT > 0 ? FEEL.boostMultiplier : 1); }
  get speedFrac() { return Math.min(1.5, Math.hypot(this.vx, this.vz) / (FEEL.rigTopSpeedRoad * this.def.speed)); }
  get mph() { return Math.round(Math.hypot(this.vx, this.vz) * FEEL.mph); }
  boost() { if (this.boostCharge < 1 || this.stun > 0 || this.dead) return false; this.boostT = FEEL.boostSeconds * this.def.boost * this.mods.boost; this.boostCharge = 0; return true; }
  // near misses, kills and slides pay back into the boost
  addBoost(n) { if (this.boostT <= 0) this.boostCharge = Math.min(1, this.boostCharge + n); }
  damage(n) { if (this.immune > 0 || this.dead) return false; this.hull = Math.max(0, this.hull - n); this.immune = 1.1; return true; }
  fling(nx, nz, v, up = 9) { this.vx = nx * v; this.vz = nz * v; this.vy = up; this.air = 0.01; this.stun = 0.7; }

  // axes: {steer, throttle}; ax/az: outside acceleration (suction, crosswind, the cable)
  update(dt, axes, world, ax, az) {
    this.immune = Math.max(0, this.immune - dt); this.stun = Math.max(0, this.stun - dt);
    if (this.boostT > 0) this.boostT -= dt; else this.boostCharge = Math.min(1, this.boostCharge + dt / (FEEL.boostRecharge / this.mods.recharge));
    let steer = axes.steer, thr = axes.throttle; if (this.stun > 0 || this.dead) { steer = 0; thr = 0; }
    this.launch = thr > 0 && this.throttle <= 0 && Math.abs(this.speed) < 6; // the frame the throttle goes down from rest
    this.throttle = thr; this.steerIn = steer; this.surface = world.surfaceAt(this.x, this.z);
    const grounded = this.air <= 0;
    let fx = Math.sin(this.heading), fz = Math.cos(this.heading), vF = this.vx * fx + this.vz * fz;
    const sp0 = Math.hypot(this.vx, this.vz);
    // brake + steer at speed is a handbrake slide: the nose swings in, the truck keeps its speed and its line bends to follow
    const drift = grounded && thr < 0 && Math.abs(steer) > 0.25 && sp0 > FEEL.driftMinSpeed && vF > 0;
    if (drift) { this.addBoost(FEEL.boostFromDrift * dt); this.driftOut = 0.45; } else this.driftOut = Math.max(0, (this.driftOut || 0) - dt);
    this.drifting = drift;
    if (grounded) {
      const grip = Math.min(1, Math.abs(vF) / 6) * (1 - 0.56 * Math.min(1, Math.abs(vF) / 75));
      let yaw = steer * FEEL.rigTurnRate * this.def.turn * (drift ? FEEL.driftTurn * (1 - 0.4 * Math.min(1, sp0 / 80)) : grip) * (vF >= -0.5 ? 1 : -1);
      if (drift) { // the nose may lead the direction of travel by about 50 degrees, no more: a slide, not a spin
        const slipA = Math.atan2(this.vx * fz - this.vz * fx, Math.max(0.01, vF)); if (Math.abs(slipA) > 0.85 && Math.sign(slipA) === Math.sign(steer)) yaw = 0;
      }
      this.heading -= yaw * dt;
      fx = Math.sin(this.heading); fz = Math.cos(this.heading);
    }
    const rx = -fz, rz = fx; vF = this.vx * fx + this.vz * fz; let vS = this.vx * rx + this.vz * rz;
    if (grounded) {
      if (drift || this.driftOut > 0) {
        // swing the velocity round toward the nose without throwing the speed away; getting back on the throttle carries it out
        const sp = Math.max(0, sp0 - (drift ? 7 : 0) * dt), va = Math.atan2(this.vx, this.vz); let d = this.heading - va; d = Math.atan2(Math.sin(d), Math.cos(d));
        const na = va + Math.sign(d) * Math.min(Math.abs(d), (drift ? 1.5 : 3.2) * dt); this.vx = Math.sin(na) * sp; this.vz = Math.cos(na) * sp;
        vF = this.vx * fx + this.vz * fz; vS = this.vx * rx + this.vz * rz;
        if (!drift && thr > 0) { const top = this.topSpeed; if (Math.hypot(vF, vS) < top) vF += FEEL.rigAccel * this.def.accel * 0.6 * dt; }
      } else {
        const top = this.topSpeed, k = Math.max(0, vF) / top, acc = FEEL.rigAccel * this.def.accel * (this.boostT > 0 ? 1.8 : 1) * (1 - 0.62 * Math.min(1, k));
        if (thr > 0) { if (vF < top) vF = Math.min(top, vF + acc * thr * dt); else vF -= Math.min(vF - top, 12 * dt); }
        else if (thr < 0) { if (vF > 0.5) vF -= FEEL.rigBrake * -thr * dt; else vF = Math.max(-FEEL.rigReverseSpeed, vF - 14 * -thr * dt); }
        else vF -= Math.sign(vF) * Math.min(Math.abs(vF), 7 * dt);
        vS *= Math.exp(-FEEL.rigGripRecover * this.gripMul * dt); // hail on the road: the tail steps out a little further
      }
    }
    this.vx = fx * vF + rx * vS + ax * dt; this.vz = fz * vF + rz * vS + az * dt; this.speed = vF; this.slip = vS;
    this.x += this.vx * dt; this.z += this.vz * dt;
    if (Math.abs(this.x) > HALF) { this.x = Math.sign(this.x) * HALF; this.vx *= -0.3; }
    if (Math.abs(this.z) > HALF) { this.z = Math.sign(this.z) * HALF; this.vz *= -0.3; }
    const gy = world.heightAt(this.x, this.z);
    if (this.air > 0) { this.vy -= 24 * dt; this.y += this.vy * dt; this.air += dt; if (this.y <= gy) { this.y = gy; this.air = 0; this.vy = 0; this.landed = true; } }
    else this.y = gy;
    this.squat += ((thr > 0 && vF < this.topSpeed - 3 ? -0.09 - (this.boostT > 0 ? 0.05 : 0) : thr < 0 && vF > 2 ? 0.1 : 0) - this.squat) * Math.min(1, dt * 14);
    this.lean = (this.lean || 0) + ((-steer * Math.min(1, Math.abs(vF) / 30) * 0.1 - vS * 0.012) - (this.lean || 0)) * Math.min(1, dt * 7);
    this.wheelSpin += vF * dt / 0.66;
    this.sync(world, dt);
  }

  sync(world, dt) {
    const m = this.model; m.position.set(this.x, this.y, this.z);
    world.normalAt(this.x, this.z, _n); if (this.air > 0) _n.set(0, 1, 0);
    _q.setFromUnitVectors(_up, _n); m.quaternion.copy(_q);
    _e.set(this.squat + (this.air > 0 ? Math.sin(this.air * 5) * 0.4 : 0), this.heading, this.lean || 0, 'YXZ'); _q.setFromEuler(_e); m.quaternion.multiply(_q);
    this.steerVis = (this.steerVis || 0) + ((this.steerIn || 0) - (this.steerVis || 0)) * Math.min(1, (dt || 0.016) * 14);
    for (const w of m.userData.wheels) { w.rotation.x = this.wheelSpin; if (w.userData.front) w.rotation.y = -this.steerVis * 0.5; }
    m.userData.turret.rotation.y = this.aim - this.heading;
    // lights: the bar wig-wags when the storm is close, the beacon turns, headlights hold steady
    this.clock += dt || 0; const fl = Math.sin(this.clock * 13) > 0, bc = 0.5 + 0.5 * Math.sin(this.clock * 7);
    for (const sp of m.userData.glows) { const k = sp.userData.kind, v = k === 'head' ? 1 : k === 'beacon' ? 0.25 + bc * 1.1 : this.alert > 0.5 ? ((k === 'barA') === fl ? 1.25 : 0.2) : 0.6; sp.scale.setScalar(sp.userData.size * (0.7 + 0.3 * v)); sp.material.opacity = Math.min(1, v) * (this.dead ? 0.2 : 0.9); }
    this.shadow.position.set(this.x, world.heightAt(this.x, this.z) + 0.12, this.z); this.shadow.rotation.z = this.heading; this.shadow.material.opacity = 0.32 * (this.air > 0 ? 0.5 : 1);
    m.visible = !(this.immune > 0 && this.hull > 0 && Math.floor(this.immune * 20) % 2 === 0);
  }
  // world position of the harpoon muzzle (where the cable leaves the rig)
  muzzle(out) { return out.copy(this.model.userData.muzzle).applyMatrix4(this.model.matrixWorld); }
}
