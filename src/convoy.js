// The rest of the crew: a camper truck and a converted bus that trail the rig and hang back from the funnel.
// They are company, not units to command: they flank you on the chase, stop short of the storm and run if it comes at them.
import * as THREE from '../vendor/three.module.min.js';
import { box, cyl, merge } from './geo.js';

const INK = '#1b2224', CHROME = '#c9cdca', GLASS = '#16262a', AMBER = '#ffc531';
const HOLD = 215, FLEE = 125;

function wheels(P, track, zs, r) { for (const z of zs) for (const sx of [1, -1]) P.push(cyl(r, r, 0.5, '#15191a', sx * track, r, z, 10, 0, Math.PI / 2), cyl(r * 0.5, r * 0.5, 0.54, CHROME, sx * track, r, z, 6, 0, Math.PI / 2)); }

function camper() { // a tired pickup under a camper shell twice its age
  const P = [], body = '#8a8f86', shell = '#e6dfc8', b = 0.95;
  P.push(box(2.2, 0.6, 5.4, body, 0, b + 0.2, 0), box(2.23, 0.14, 5.3, '#6f4a3a', 0, b + 0.22, 0), box(2.1, 0.12, 1.6, body, 0, b + 0.55, 1.85));
  P.push(box(2.06, 0.75, 1.5, body, 0, b + 0.9, 0.5), box(2.1, 0.42, 1.0, GLASS, 0, b + 0.98, 0.5), box(1.8, 0.44, 1.52, GLASS, 0, b + 0.98, 0.5));
  P.push(box(2.36, 1.5, 3.0, shell, 0, b + 1.3, -1.15), box(2.36, 0.7, 1.5, shell, 0, b + 1.75, 0.7), box(2.4, 0.16, 3.0, '#9a6a3c', 0, b + 1.0, -1.15), box(2.38, 0.4, 1.2, GLASS, 0, b + 1.5, -1.1), box(1.6, 0.36, 0.06, GLASS, 0, b + 1.85, 1.46));
  P.push(box(1.8, 0.4, 0.08, CHROME, 0, b + 0.2, 2.72), box(2.3, 0.2, 0.26, CHROME, 0, b - 0.05, 2.8), box(0.9, 0.5, 0.6, '#3a5a8a', 0.5, b + 2.3, -1.6), box(0.04, 1.6, 0.04, INK, -0.9, b + 2.9, -0.4));
  wheels(P, 1.2, [1.75, -1.65], 0.62);
  return merge(P);
}
function bus() { // a short bus retired from school and drafted into science
  const P = [], body = '#d9cfae', b = 1.0;
  P.push(box(2.4, 2.0, 5.2, body, 0, b + 1.0, -0.6), box(2.43, 0.2, 5.2, '#3d7f86', 0, b + 0.75, -0.6), box(2.44, 0.5, 4.4, GLASS, 0, b + 1.45, -0.7), box(2.2, 0.16, 5.0, '#b9af90', 0, b + 2.06, -0.6));
  P.push(box(2.2, 0.9, 1.5, body, 0, b + 0.45, 2.6), box(2.0, 0.6, 0.08, GLASS, 0, b + 1.5, 2.02), box(1.7, 0.4, 0.08, CHROME, 0, b + 0.4, 3.37), box(2.3, 0.2, 0.28, CHROME, 0, b + 0.02, 3.42));
  P.push(box(2.0, 0.08, 3.6, INK, 0, b + 2.3, -0.9), box(0.08, 0.3, 3.6, INK, 0.96, b + 2.2, -0.9), box(0.08, 0.3, 3.6, INK, -0.96, b + 2.2, -0.9), cyl(0.7, 0.2, 0.3, '#b9b39f', -0.4, b + 2.7, -1.8, 10, 0.5), cyl(0.05, 0.05, 0.5, INK, -0.4, b + 2.45, -1.8, 4));
  P.push(cyl(0.28, 0.12, 0.5, '#b9b39f', 0.6, b + 2.5, 0.4, 8, Math.PI / 2), cyl(0.28, 0.12, 0.5, '#b9b39f', 0.1, b + 2.5, 0.4, 8, Math.PI / 2), box(0.9, 0.5, 0.7, '#c9412e', 0.4, b + 2.56, -0.6), box(0.04, 2.0, 0.04, INK, 0.9, b + 3.2, 0.8));
  wheels(P, 1.28, [2.5, -2.0], 0.68);
  return merge(P);
}

export class Convoy {
  constructor(scene, world, glowTex) {
    this.scene = scene; this.world = world; this.units = [];
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    for (const [geo, side, back, len] of [[camper(), -11, 4, 5.4], [bus(), 12.5, -1, 6.8]]) {
      const g = new THREE.Group(); g.add(new THREE.Mesh(geo, mat));
      const lamps = [];
      for (const sx of [1, -1]) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#fff1c4', blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true, opacity: 0.85 })); sp.position.set(sx * 0.75, 1.3, len / 2 + 0.3); sp.scale.setScalar(1.2); g.add(sp); lamps.push(sp); }
      const bc = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: AMBER, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true })); bc.position.set(0, 3.6, 0); bc.scale.setScalar(1.6); g.add(bc);
      const sh = new THREE.Mesh(new THREE.CircleGeometry(1, 16), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.28, depthWrite: false, fog: false })); sh.rotation.x = -Math.PI / 2; sh.scale.set(1.6, len * 0.6, 1); sh.renderOrder = 1;
      scene.add(g, sh); this.units.push({ g, sh, bc, side, back, x: 0, z: 0, heading: 0, speed: 0, phase: Math.random() * 6 });
    }
  }
  dispose() { for (const u of this.units) { this.scene.remove(u.g); this.scene.remove(u.sh); } }
  place(rig) { for (const u of this.units) { const p = this.slot(u, rig); u.x = p.x; u.z = p.z; u.heading = rig.heading; u.speed = 0; } this.sync(0, 0); }
  // flanking slots beside and a little behind the rig, so the convoy is in the shot, not behind the camera
  slot(u, rig) { const fx = Math.sin(rig.heading), fz = Math.cos(rig.heading), rx = -fz, rz = fx; return { x: rig.x + rx * u.side + fx * u.back, z: rig.z + rz * u.side + fz * u.back }; }

  update(dt, t, rig, storm) {
    for (const u of this.units) {
      const p = this.slot(u, rig), sd = Math.hypot(u.x - storm.x, u.z - storm.z), td = Math.hypot(p.x - storm.x, p.z - storm.z);
      let want = 0, dx = p.x - u.x, dz = p.z - u.z, dist = Math.hypot(dx, dz);
      if (storm.alive && sd < FLEE) { dx = u.x - storm.x; dz = u.z - storm.z; dist = 60; want = 30; }            // it is coming: run
      else if (!storm.alive || td > HOLD) want = dist < 1.5 ? Math.max(0, Math.hypot(rig.vx, rig.vz) * 0.98) : Math.min(42, Math.hypot(rig.vx, rig.vz) + dist * 1.4); // keep station
      u.speed += (want - u.speed) * Math.min(1, dt * 3);
      if (u.speed > 0.5) {
        const hd = dist > 3 ? Math.atan2(dx, dz) : rig.heading; let d = hd - u.heading; d = Math.atan2(Math.sin(d), Math.cos(d)); u.heading += d * Math.min(1, dt * 4);
        u.x += Math.sin(u.heading) * u.speed * dt; u.z += Math.cos(u.heading) * u.speed * dt;
        // they plough through fences and saplings like you do, and shoulder off anything solid
        const vx = Math.sin(u.heading) * u.speed, vz = Math.cos(u.heading) * u.speed;
        this.world.near(u.x, u.z, 12, (q) => { if (q.state !== 0) return; const ex = u.x - q.x, ez = u.z - q.z, rr = q.r + 1.8, d2 = ex * ex + ez * ez; if (d2 > rr * rr) return; if (q.kit.soft || q.kit.tree) this.world.launch(q, vx * 0.8, 6 + u.speed * 0.2, vz * 0.8); else { const e = Math.sqrt(d2) || 0.01; u.x = q.x + ex / e * rr; u.z = q.z + ez / e * rr; } });
      }
    }
    this.sync(dt, t);
  }
  sync(dt, t) {
    for (const u of this.units) {
      const y = this.world.heightAt(u.x, u.z); u.g.position.set(u.x, y, u.z); u.g.rotation.y = u.heading; u.g.rotation.z = Math.sin(t * 9 + u.phase) * 0.012 * Math.min(1, u.speed / 10);
      u.sh.position.set(u.x, y + 0.1, u.z); u.sh.rotation.z = u.heading; u.bc.material.opacity = 0.35 + 0.65 * (Math.sin(t * 6 + u.phase) > 0 ? 1 : 0.1);
    }
  }
}
