// The grain elevator: a set piece on the road. About a third of chases (the Daily Storm's seed decides on its days).
//   Placed along the road you are driving, a few hundred metres ahead, on the far side from the storm. The storm is turned
//   onto it, and as it passes the elevator starts to go: a creak, dust at its foot. As you arrive it comes down across the
//   road in sequence, three pieces, each with at least 1.2 s of warning: it leans, it groans, and the strip it will land on
//   is marked in the storm's magenta, filling toward the tip. It falls toward the storm and stops short: the lane on the
//   storm's side of the road is the escape line, and the field beyond it is the shortcut that costs speed.
//   Never in the finale, never with a debris wall or a hail core, and never with you on the gun: while it is going the game
//   does not take the wheel, the storm holds its throws, and the hail waits. A clean escape pays 60% of a boost.
// Numbers: SETPIECE in config.js. Tested by tests/e2e.mjs (it triggers, it telegraphs, the escape line is clean).
import * as THREE from '../vendor/three.module.min.js';
import { PALETTE, WORLD, SETPIECE as SP } from './config.js';
import { box, cyl, prism, merge } from './geo.js';
import { HWD, hwDist, gridDist } from './world.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
const STRIP = new THREE.MeshBasicMaterial({ color: PALETTE.accent, transparent: true, opacity: 0.45, depthWrite: false, fog: false, side: THREE.DoubleSide });
const EDGE = new THREE.MeshBasicMaterial({ color: PALETTE.accent, transparent: true, opacity: 0.95, depthWrite: false, fog: false, side: THREE.DoubleSide });
const LIFT = 0.6; // m over the ground: clear of the road's own strips and the terrain's facets
const CONCRETE = '#d8d2bf', TIN = '#aab3b4', RED = '#a3352b', ROOF = '#33393b', INK = '#2a2f30';

// one piece, standing on its own foot, local +z is the way it will fall, +y up. r: its half depth toward the road
function pieceGeo(kind, H) {
  if (kind === 'bins') { // two concrete bins side by side, a red band, a catwalk on top
    const r = 4.2; return { r, g: merge([cyl(r, r, H, CONCRETE, -4.4, H / 2, 0, 12), cyl(r, r, H, CONCRETE, 4.4, H / 2, 0, 12), cyl(r + 0.08, r + 0.08, 1.4, RED, -4.4, H * 0.7, 0, 12), cyl(r + 0.08, r + 0.08, 1.4, RED, 4.4, H * 0.7, 0, 12), box(10, 0.6, 3, INK, 0, H + 0.3, 0)]) };
  }
  // the headhouse: a tall tin box with a pitched roof and the leg up its side
  const r = 4; return { r, g: merge([box(8, H - 3, 8, TIN, 0, (H - 3) / 2, 0), box(8.2, 1.2, 8.2, RED, 0, H * 0.55, 0), prism(8.6, 3, 8.6, ROOF, 0, H - 3, 0), box(1.2, H, 1.2, INK, 3.4, H / 2, -4.6)]) };
}
export class SetPiece {
  constructor(mission) {
    this.m = mission; this.G = mission.G; this.state = 'idle'; this.root = null; this.waitT = 0; this.hit = false; this.at = -9;
    const seeded = mission.seed !== null && mission.seed !== undefined, G = this.G;
    // whether this fight has one: the Daily Storm's seed decides on its days. Never on the first, coached storm
    const roll = seeded ? mission.rs() : Math.random();
    this.planned = G.setpiece === 'force' ? true : G.setpiece === 'never' || mission.coach ? false : roll < SP.chance;
  }
  get armed() { return this.state === 'armed' || this.state === 'creak' || this.state === 'fall'; }
  get busy() { return this.state === 'creak' || this.state === 'fall'; } // it is going: no seat changes, no throws, no hail
  dispose() { if (this.root) { this.G.scene.remove(this.root); this.root.traverse((o) => { if (o.userData.own) { o.geometry.dispose(); if (o.material !== MAT) o.material.dispose(); } }); this.root = null; } }

  // ---- can it come now, and where ----
  eligible() {
    const m = this.m, G = this.G, w = G.weather, r = m.rig;
    if (!this.planned || this.state !== 'idle' || m.result || m.phase !== 'chase' || m.view !== 'drive' || m.home) return false;
    if (m.time < SP.after || m.surge || m.windWait > 0 || m.wind || m.time - m.seatT < 1.5) return false;
    if (w && (w.spell > 0 || w.nextHail < SP.hailClear)) return false; // never with a hail core, and not with one about to arrive
    return Math.hypot(r.vx, r.vz) > SP.minSpeed;
  }
  // the road under the truck and running its way: { ox, oz, fx, fz, half } (a point on its centre line, its direction, its half width)
  road() {
    const r = this.m.rig, sp = Math.hypot(r.vx, r.vz) || 1, vx = r.vx / sp, vz = r.vz / sp, s = this.G.world.surfaceAt(r.x, r.z);
    if (s === 2) { const d = (r.x + 1536) * HWD.z - (r.z + 1180) * HWD.x, sg = vx * HWD.x + vz * HWD.z >= 0 ? 1 : -1; if (Math.abs(sg * (vx * HWD.x + vz * HWD.z)) < SP.align) return null; return { ox: r.x - d * HWD.z, oz: r.z + d * HWD.x, fx: HWD.x * sg, fz: HWD.z * sg, half: WORLD.highwayHalf }; }
    if (s === 1) {
      const onX = gridDist(r.x) < WORLD.roadHalf, onZ = gridDist(r.z) < WORLD.roadHalf; if (onX === onZ) return null; // a crossroads, or a town: not here
      const w = this.G.world;
      if (onX && Math.abs(vz) > SP.align) return { ox: w.nearestRoadLine(r.x), oz: r.z, fx: 0, fz: Math.sign(vz), half: WORLD.roadHalf };
      if (onZ && Math.abs(vx) > SP.align) return { ox: r.x, oz: w.nearestRoadLine(r.z), fx: Math.sign(vx), fz: 0, half: WORLD.roadHalf };
    }
    return null;
  }
  // stand it up beside the road ahead, on the far side from the storm, and turn the storm onto it
  arm(road) {
    const m = this.m, G = this.G, s = m.storm, r = m.rig;
    const F = { x: road.fx, z: road.fz }, Nr = { x: -F.z, z: F.x }; // the way you are going, and the road's right
    const side = (s.x - road.ox) * Nr.x + (s.z - road.oz) * Nr.z >= 0 ? 1 : -1, N = { x: Nr.x * side, z: Nr.z * side }; // N: toward the storm's side
    const along = (r.x - road.ox) * F.x + (r.z - road.oz) * F.z, s0 = along + SP.ahead; // piece B stands this far down the road
    const O = { x: road.ox + F.x * s0, z: road.oz + F.z * s0 }; if (Math.abs(O.x) > 1350 || Math.abs(O.z) > 1350) return false;
    const half = road.half, foot = -(half + SP.setback), tip = half - SP.lane, H = tip - foot; // it reaches to the escape lane, no further
    this.F = F; this.N = N; this.O = O; this.half = half; this.foot = foot; this.tip = tip; this.right = side > 0; // N is the road's right
    this.root = new THREE.Group(); G.scene.add(this.root); this.pieces = [];
    const kinds = ['bins', 'head', 'bins'], yaw = Math.atan2(N.x, N.z);
    for (let i = 0; i < 3; i++) {
      const s_ = (i - 1) * SP.spacing, { r: depth, g } = pieceGeo(kinds[i], H - (kinds[i] === 'head' ? 0 : 0)), lo = foot - depth - 2;
      const px = O.x + F.x * s_ + N.x * (foot + depth), pz = O.z + F.z * s_ + N.z * (foot + depth), py = G.world.heightAt(px, pz);
      const outer = new THREE.Group(); outer.position.set(px, py, pz); outer.rotation.y = yaw; const pivot = new THREE.Group(); outer.add(pivot);
      const mesh = new THREE.Mesh(g, MAT); mesh.position.z = -depth; mesh.userData.own = true; pivot.add(mesh); this.root.add(outer);
      // the strip it will land on: magenta, draped on the ground, filling from the foot to the tip as it comes
      // the tip's edge is the line not to cross: drawn heavy. The sides are the strip's width along the road
      const fill = this.drape(s_, lo, tip + 0.6, SP.width, STRIP), edge = this.drape(s_, tip - 0.4, tip + 1.2, SP.width + 2, EDGE), sideA = this.drape(s_ - SP.width / 2 - 0.5, lo, tip + 0.6, 1, EDGE), sideB = this.drape(s_ + SP.width / 2 + 0.5, lo, tip + 0.6, 1, EDGE);
      for (const e of [fill, edge, sideA, sideB]) { e.visible = false; this.root.add(e); }
      this.pieces.push({ i, s: s_, lo, depth, outer, pivot, fill, marks: [edge, sideA, sideB], tele: SP.tele[i], landed: false, hit: false, rubbleHit: false, lean: 0 });
    }
    // the storm goes for it: a juke onto the elevator
    const gx = O.x + N.x * SP.pass, gz = O.z + N.z * SP.pass; m.ai.pending = { ang: Math.atan2(gz - s.z, gx - s.x), t: 0.5 }; // past it, on its own side of the road: the elevator falls toward it
    this.state = 'armed'; this.armT = 0; this.hit = false; this.at = m.time; return true;
  }
  // a quad on the ground over (s0 - wid/2 .. s0 + wid/2) along the road and (u0 .. u1) across it, following the terrain
  drape(s0, u0, u1, wid, mat) {
    const g = new THREE.BufferGeometry(), seg = 10, pos = new Float32Array((seg + 1) * 2 * 3), idx = [], W = this.G.world;
    for (let k = 0; k <= seg; k++) for (let j = 0; j < 2; j++) {
      const u = u0 + (u1 - u0) * k / seg, s = s0 + (j ? wid / 2 : -wid / 2), x = this.O.x + this.F.x * s + this.N.x * u, z = this.O.z + this.F.z * s + this.N.z * u, o = (k * 2 + j) * 3;
      pos[o] = x; pos[o + 1] = W.heightAt(x, z) + LIFT; pos[o + 2] = z;
    }
    for (let k = 0; k < seg; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    const m = new THREE.Mesh(g, mat.clone()); m.renderOrder = 4; m.frustumCulled = false; m.userData = { own: true, s0, u0, u1, wid }; return m;
  }
  // where the truck is in the road's frame: s along it (from piece B), u across it (toward the storm)
  frame(r) { const dx = r.x - this.O.x, dz = r.z - this.O.z; return { s: dx * this.F.x + dz * this.F.z, u: dx * this.N.x + dz * this.N.z }; }

  // ---- every step ----
  update(dt) {
    const m = this.m, G = this.G, fx = G.fx;
    if (this.state === 'idle') {
      if (!this.eligible()) { this.waitT = this.planned && m.phase === 'chase' && m.view === 'drive' && m.time >= SP.after ? this.waitT : 0; return; }
      this.waitT += dt; const road = this.road() || (this.waitT > SP.forceAfter ? this.track() : null); if (road) this.arm(road);
      return;
    }
    if (this.state === 'done' || this.state === 'spent') { this.settle(dt); return; }
    const r = m.rig, P = this.frame(r), sp = Math.max(20, Math.hypot(r.vx, r.vz)), first = this.pieces[0], toA = first.s - P.s; // metres to the middle of the first strip
    // left behind, wandered off, or the fight moved on: it stands where it is, and it is over
    // (once it is falling it finishes: nothing that could end a chase can happen at the wheel while it does)
    if (this.state !== 'fall' && (m.result || m.phase !== 'chase' || m.surge || m.home || m.view !== 'drive' || (this.state === 'armed' && (P.s > first.s + 30 || Math.abs(P.u) > 400 || m.time - this.at > SP.armLimit)))) { this.cancel(); return; }
    if (this.state === 'armed') {
      this.armT += dt; const ds = Math.hypot(m.storm.x - this.O.x, m.storm.z - this.O.z);
      if (ds < SP.creakRange || toA < sp * (SP.tele[0] + 2.4)) { // the storm has it, or you are four seconds out: it starts to go
        this.state = 'creak'; this.creakT = 0; G.audio.strain(2.4, 0.8); G.audio.warn(); m.call('THE ELEVATOR IS GOING', 'bad', 1.4, 3);
      }
    } else if (this.state === 'creak') {
      this.creakT += dt;
      for (const p of this.pieces) { p.lean = 0.012 + 0.008 * Math.sin(m.time * 23 + p.i); p.pivot.rotation.x = p.lean; }
      if (Math.random() < dt * 8) { const p = this.pieces[(Math.random() * 3) | 0]; this.puffAt(p.s + (Math.random() - 0.5) * 10, this.foot + Math.random() * 6, 5, '#cdb27a'); }
      if (toA < sp * SP.tele[0] || this.creakT > SP.creakMax) this.drop(); // hold your line and the first piece lands on you
    } else if (this.state === 'fall') {
      this.fallT += dt; let all = true;
      for (const p of this.pieces) {
        const left = p.tele - this.fallT, k = clamp(this.fallT / p.tele, 0, 1);
        if (!p.landed) {
          all = false;
          // the warning: the strip fills from the foot toward the tip, the edge flashes in its last 0.4 s; it leans and groans
          p.fill.visible = true; p.fill.scale.set(1, 1, 1); this.fillTo(p.fill, k); for (const e of p.marks) { e.visible = true; e.material.opacity = left < 0.4 ? (Math.sin(m.time * 40) > 0 ? 1 : 0.35) : 0.95; }
          const fallStart = p.tele - SP.fallSeconds;
          if (this.fallT < fallStart) { p.lean = 0.02 + 0.1 * (this.fallT / fallStart) ** 2 + 0.01 * Math.sin(m.time * 19 + p.i); p.pivot.rotation.x = p.lean; if (Math.random() < dt * 6) this.puffAt(p.s + (Math.random() - 0.5) * 10, this.foot + 2, 6, '#cdb27a'); }
          else { const u = clamp((this.fallT - fallStart) / SP.fallSeconds, 0, 1); p.pivot.rotation.x = p.lean + (Math.PI / 2 - p.lean) * u * u; }
          if (left <= 0) this.land(p);
        } else this.rubble(p, P, dt);
      }
      if (all && !this.finished) { this.finished = true; this.doneT = 0; if (!this.hit) { r.addBoost(SP.give); m.earn(5); m.call('CLEAN ESCAPE', 'good', 0.9); } this.state = 'done'; }
    }
  }
  drop() {
    const m = this.m; this.state = 'fall'; this.fallT = 0; m.call('ELEVATOR COMING DOWN', 'bad', 1.4, 3); this.G.audio.strain(SP.tele[2], 1); this.G.fx.shake(3);
    for (const p of this.pieces) { p.fill.visible = true; for (const e of p.marks) e.visible = true; }
  }
  // it lands: anything on its strip is hit, and it lies across the road
  land(p) {
    const m = this.m, G = this.G, r = m.rig, P = this.frame(r); p.landed = true; p.pivot.rotation.x = Math.PI / 2; p.fill.visible = false; for (const e of p.marks) e.visible = false;
    G.audio.boom(0.9); G.audio.impact(); const d = Math.hypot(r.x - (this.O.x + this.F.x * p.s), r.z - (this.O.z + this.F.z * p.s)); G.fx.shake(Math.max(2, 9 - d / 12));
    for (let k = 0; k < 7; k++) this.puffAt(p.s + (Math.random() - 0.5) * SP.width, p.lo + (this.tip - p.lo) * k / 6, 14, '#b89a58');
    const hw = SP.width / 2 + 2.4, inS = Math.abs(P.s - p.s) < hw, inU = P.u > p.lo - 1.3 && P.u < this.tip + 1.3;
    if (inS && inU && !m.result) { p.hit = true; this.hit = true; if (m.hurt(SP.dmg) && r.hull > 0) r.fling(this.N.x, this.N.z, SP.fling, 7); }
    p.rubbleT = SP.rubble;
  }
  // lying across the road: drive over it and it costs you speed, once a piece
  rubble(p, P, dt) {
    const m = this.m, r = m.rig; if (p.rubbleT <= 0) return; p.rubbleT -= dt;
    if (!p.rubbleHit && Math.abs(P.s - p.s) < SP.width / 2 + 1 && P.u > p.lo && P.u < this.tip + 1) { p.rubbleHit = true; r.vx *= SP.rubbleDrag; r.vz *= SP.rubbleDrag; r.speed *= SP.rubbleDrag; this.G.audio.smash(); this.G.fx.shake(6); this.puffAt(P.s, P.u, 9, '#8d9392'); }
  }
  // after: the pieces settle into the field and are gone a few seconds later
  settle(dt) {
    if (this.state !== 'done' || !this.pieces) return; this.doneT += dt;
    for (const p of this.pieces) { if (p.rubbleT > 0) this.rubble(p, this.frame(this.m.rig), dt); }
    if (this.doneT > SP.rubble) { const k = clamp((this.doneT - SP.rubble) / 1.5, 0, 1); for (const p of this.pieces) p.outer.position.y -= 6 * dt * k; if (k >= 1) { this.dispose(); this.state = 'spent'; } }
  }
  // the fight moved on before it fell: it stands where it is (no warning left on the ground), inert
  cancel() { if (this.pieces) for (const p of this.pieces) { p.fill.visible = false; for (const e of p.marks) e.visible = false; if (!p.landed) p.pivot.rotation.x = 0; } this.state = 'spent'; }
  // no road to stand it on: the line you are driving will do (a farm track)
  track() { const r = this.m.rig, sp = Math.hypot(r.vx, r.vz) || 1; return { ox: r.x, oz: r.z, fx: r.vx / sp, fz: r.vz / sp, half: WORLD.roadHalf }; }
  fillTo(mesh, k) { // the fill reaches k of the way from the foot to the tip
    const d = mesh.userData, pos = mesh.geometry.attributes.position, seg = 10, W = this.G.world, u1 = d.u0 + (d.u1 - d.u0) * Math.max(0.04, k);
    for (let i = 0; i <= seg; i++) for (let j = 0; j < 2; j++) { const u = d.u0 + (u1 - d.u0) * i / seg, s = d.s0 + (j ? d.wid / 2 : -d.wid / 2), x = this.O.x + this.F.x * s + this.N.x * u, z = this.O.z + this.F.z * s + this.N.z * u, o = (i * 2 + j) * 3; pos.array[o] = x; pos.array[o + 1] = W.heightAt(x, z) + LIFT; pos.array[o + 2] = z; }
    pos.needsUpdate = true;
  }
  puffAt(s, u, size, col) { const x = this.O.x + this.F.x * s + this.N.x * u, z = this.O.z + this.F.z * s + this.N.z * u; this.G.fx.puff(x, this.G.world.heightAt(x, z) + 1.5, z, size, col, 1, 4); }
  // the coach line while it is coming: which way out
  coach() {
    if (this.state === 'creak' || this.state === 'fall') return this.right ? 'KEEP RIGHT, OR TAKE THE FIELD' : 'KEEP LEFT, OR TAKE THE FIELD';
    return '';
  }
}
