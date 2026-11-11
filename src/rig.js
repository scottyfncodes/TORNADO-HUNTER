// The rig: a chunky model with one oversized feature (the harpoon turret) and kinematic arcade handling.
import * as THREE from '../vendor/three.module.min.js';
import { FEEL, WORLD } from './config.js';
import { box, cyl, merge } from './geo.js';

const HALF = WORLD.size / 2 - 40;
const _n = new THREE.Vector3(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _e = new THREE.Euler();

function buildModel(def, envMap) {
  const g = new THREE.Group(), L = def.len, W = def.wid, Hh = def.hgt, dark = '#22292a', buggy = def.id === 'whippet', tank = def.id === 'bulldog';
  const parts = [box(W, 0.55, L, def.body, 0, 0.95, 0), box(W + 0.3, 0.3, 0.5, dark, 0, 0.8, L / 2 + 0.15), box(W + 0.2, 0.25, 0.4, dark, 0, 0.8, -L / 2 - 0.1)];
  if (buggy) {
    parts.push(box(W * 0.8, 0.5, L * 0.45, def.body, 0, 1.4, 0.5), box(0.12, 1.3, 0.12, def.trim, W * 0.42, 1.9, 0.1), box(0.12, 1.3, 0.12, def.trim, -W * 0.42, 1.9, 0.1), box(W * 0.9, 0.12, 0.12, def.trim, 0, 2.5, 0.1), box(0.12, 0.12, 1.7, def.trim, W * 0.42, 2.5, -0.7), box(0.12, 0.12, 1.7, def.trim, -W * 0.42, 2.5, -0.7));
  } else {
    parts.push(box(W * 0.94, Hh, L * 0.34, def.body, 0, 1.2 + Hh / 2, L * 0.12), box(W * 0.86, Hh * 0.55, L * 0.3, '#1b2a2c', 0, 1.3 + Hh * 0.62, L * 0.13), box(W * 0.96, 0.14, L * 0.36, def.trim, 0, 1.24 + Hh, L * 0.12), box(W, 0.5, L * 0.3, def.body, 0, 1.4, L * 0.38));
    parts.push(box(0.2, 0.5, L * 0.36, def.body, W / 2 - 0.1, 1.45, -L * 0.3), box(0.2, 0.5, L * 0.36, def.body, -W / 2 + 0.1, 1.45, -L * 0.3), box(W, 0.5, 0.2, def.body, 0, 1.45, -L / 2 + 0.1));
    if (tank) parts.push(box(W + 0.5, 0.5, L * 0.5, '#39493c', 0, 1.0, 0), box(W * 0.5, 0.9, 0.3, dark, 0, 1.3, L / 2 + 0.3));
  }
  parts.push(box(0.9, 0.14, 0.3, '#ffc531', 0, 1.42 + Hh + (buggy ? 1.2 : 0), L * 0.12)); // light bar
  const body = new THREE.Mesh(merge(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.25, envMap, envMapIntensity: 0.7 }));
  g.add(body);
  const lights = new THREE.Mesh(merge([box(0.4, 0.22, 0.1, '#fff6d6', W * 0.32, 1.0, L / 2 + 0.02), box(0.4, 0.22, 0.1, '#fff6d6', -W * 0.32, 1.0, L / 2 + 0.02), box(0.35, 0.2, 0.1, '#ff3f8e', W * 0.34, 1.05, -L / 2 - 0.02), box(0.35, 0.2, 0.1, '#ff3f8e', -W * 0.34, 1.05, -L / 2 - 0.02)]), new THREE.MeshBasicMaterial({ vertexColors: true }));
  g.add(lights);
  // the turret: the one thing that makes it a hunter's rig
  const turret = new THREE.Group(); turret.position.set(0, buggy ? 1.75 : 1.75, -L * 0.28);
  turret.add(new THREE.Mesh(merge([cyl(0.5, 0.62, 0.5, dark, 0, 0.25, 0, 8), box(0.5, 0.5, 0.7, '#ffc531', 0, 0.75, 0), cyl(0.16, 0.2, 2.6, '#f3ecd8', 0, 0.85, 1.4, 6, Math.PI / 2), cyl(0.05, 0.3, 0.7, '#ff3f8e', 0, 0.85, 2.9, 4, Math.PI / 2), cyl(0.45, 0.45, 0.5, dark, 0.55, 0.75, -0.1, 8, 0, Math.PI / 2)]), body.material));
  g.add(turret); g.userData.turret = turret;
  const wr = tank ? 0.82 : buggy ? 0.72 : 0.66, wheelGeo = merge([cyl(wr, wr, 0.5, '#1a1f20', 0, 0, 0, 10, 0, Math.PI / 2), cyl(wr * 0.5, wr * 0.5, 0.54, def.trim, 0, 0, 0, 6, 0, Math.PI / 2)]);
  const wm = new THREE.MeshLambertMaterial({ vertexColors: true }); g.userData.wheels = [];
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const w = new THREE.Mesh(wheelGeo, wm); w.position.set(sx * (W / 2 + 0.12), wr, sz * L * 0.33); w.rotation.order = 'YXZ'; w.userData.front = sz > 0; g.add(w); g.userData.wheels.push(w); }
  g.userData.muzzle = new THREE.Vector3(0, 2.6, -L * 0.28);
  g.scale.setScalar(1.25); // chunky on purpose: it has to read at 40 px on a phone
  return g;
}

export class Rig {
  constructor(scene, def, envMap, mods) {
    this.def = def; this.mods = mods; this.scene = scene;
    this.model = buildModel(def, envMap); scene.add(this.model);
    const sh = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.32, depthWrite: false, fog: false }));
    sh.rotation.x = -Math.PI / 2; sh.scale.set(def.wid * 1.1, def.len * 0.95, 1); sh.renderOrder = 1; scene.add(sh); this.shadow = sh;
    this.x = 0; this.z = 0; this.y = 0; this.heading = 0; this.vx = 0; this.vz = 0; this.speed = 0;
    this.hullMax = FEEL.hullBase * def.hull * mods.hull; this.hull = this.hullMax;
    this.boostT = 0; this.boostCharge = 1; this.stun = 0; this.immune = 0; this.air = 0; this.vy = 0; this.surface = 0;
    this.pitch = 0; this.roll = 0; this.squat = 0; this.wheelSpin = 0; this.aim = 0; this.throttle = 0; this.dead = false;
  }
  dispose() { this.scene.remove(this.model); this.scene.remove(this.shadow); }
  place(x, z, heading, world) { this.x = x; this.z = z; this.heading = heading; this.vx = this.vz = this.speed = 0; this.y = world.heightAt(x, z); this.sync(world, 0); }
  get topSpeed() { return (this.surface > 0 ? FEEL.rigTopSpeedRoad : FEEL.rigTopSpeedField) * this.def.speed * (this.boostT > 0 ? FEEL.boostMultiplier : 1); }
  get speedFrac() { return Math.min(1.3, Math.hypot(this.vx, this.vz) / (FEEL.rigTopSpeedRoad * this.def.speed)); }
  boost() { if (this.boostCharge < 1 || this.stun > 0 || this.dead) return false; this.boostT = FEEL.boostSeconds * this.def.boost * this.mods.boost; this.boostCharge = 0; return true; }
  damage(n) { if (this.immune > 0 || this.dead) return false; this.hull = Math.max(0, this.hull - n); this.immune = 1.1; return true; }
  fling(nx, nz, v, up = 9) { this.vx = nx * v; this.vz = nz * v; this.vy = up; this.air = 0.01; this.stun = 0.9; }

  // axes: {steer, throttle}; ax/az: outside acceleration (suction, the cable)
  update(dt, axes, world, ax, az) {
    this.immune = Math.max(0, this.immune - dt); this.stun = Math.max(0, this.stun - dt);
    if (this.boostT > 0) this.boostT -= dt; else this.boostCharge = Math.min(1, this.boostCharge + dt / (FEEL.boostRecharge / this.mods.recharge));
    let steer = axes.steer, thr = axes.throttle; if (this.stun > 0 || this.dead) { steer = 0; thr = 0; }
    this.launch = thr > 0 && this.throttle <= 0 && Math.abs(this.speed) < 6; // the frame the throttle goes down from rest
    this.throttle = thr; this.steerIn = steer; this.surface = world.surfaceAt(this.x, this.z);
    const grounded = this.air <= 0;
    // heading first, then split velocity into the new forward/side so momentum carries through a turn
    let fx = Math.sin(this.heading), fz = Math.cos(this.heading), vF = this.vx * fx + this.vz * fz;
    if (grounded) {
      const grip = Math.min(1, Math.abs(vF) / 7) * (1 - 0.5 * Math.min(1, Math.abs(vF) / 44));
      this.heading -= steer * FEEL.rigTurnRate * this.def.turn * grip * (vF >= -0.5 ? 1 : -1) * dt;
      fx = Math.sin(this.heading); fz = Math.cos(this.heading);
    }
    const rx = -fz, rz = fx; vF = this.vx * fx + this.vz * fz; let vS = this.vx * rx + this.vz * rz;
    if (grounded) {
      const top = this.topSpeed, acc = FEEL.rigAccel * this.def.accel * (this.boostT > 0 ? 2.2 : 1);
      if (thr > 0) { if (vF < top) vF = Math.min(top, vF + acc * thr * dt); else vF -= Math.min(vF - top, 9 * dt); }
      else if (thr < 0) { if (vF > 0.5) vF -= FEEL.rigBrake * -thr * dt; else vF = Math.max(-FEEL.rigReverseSpeed, vF - acc * 0.6 * -thr * dt); }
      else vF -= Math.sign(vF) * Math.min(Math.abs(vF), 5 * dt);
      vS *= Math.exp(-FEEL.rigGripRecover * (this.boostT > 0 ? 0.7 : 1) * dt);
    }
    this.vx = fx * vF + rx * vS + ax * dt; this.vz = fz * vF + rz * vS + az * dt; this.speed = vF;
    this.x += this.vx * dt; this.z += this.vz * dt;
    if (Math.abs(this.x) > HALF) { this.x = Math.sign(this.x) * HALF; this.vx *= -0.3; }
    if (Math.abs(this.z) > HALF) { this.z = Math.sign(this.z) * HALF; this.vz *= -0.3; }
    const gy = world.heightAt(this.x, this.z);
    if (this.air > 0) { this.vy -= 24 * dt; this.y += this.vy * dt; this.air += dt; if (this.y <= gy) { this.y = gy; this.air = 0; this.vy = 0; this.landed = true; } }
    else this.y = gy;
    this.squat += ((thr > 0 && vF < this.topSpeed - 2 ? -0.09 : thr < 0 && vF > 2 ? 0.1 : 0) - this.squat) * Math.min(1, dt * 14);
    this.lean = (this.lean || 0) + ((-steer * Math.min(1, Math.abs(vF) / 20) * 0.09 - vS * 0.012) - (this.lean || 0)) * Math.min(1, dt * 7);
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
    this.shadow.position.set(this.x, world.heightAt(this.x, this.z) + 0.12, this.z); this.shadow.rotation.z = this.heading; this.shadow.material.opacity = 0.32 * (this.air > 0 ? 0.5 : 1);
    m.visible = !(this.immune > 0 && this.hull > 0 && Math.floor(this.immune * 20) % 2 === 0);
  }
  // world position of the harpoon muzzle (where the cable leaves the rig)
  muzzle(out) { return out.copy(this.model.userData.muzzle).applyMatrix4(this.model.matrixWorld); }
}
