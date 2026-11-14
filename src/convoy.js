// The rest of the crew, a vehicle each: Winch's harpoon truck, Doc's science bus (DOROTHY rides on it) and Sparks' rocket truck.
// They flank you on the chase, stop short of the storm and run if it comes at them. When a phase of the fight is theirs you
// take their seat (src/gunner.js mounts on the unit), and that vehicle closes to range and holds while you work.
import * as THREE from '../vendor/three.module.min.js';
import { cyl, merge, bev, ao } from './geo.js';
import { lite, grime, wheelParts } from './rig.js';

const INK = '#1b2224', CHROME = '#c9cdca', GLASS = '#16262a', AMBER = '#ffc531';
const HOLD = 150, FLEE = 90, PINK = '#ff3f8e', HAZ = '#e8b21c', CREAM = '#f3ecd8', GREEN = '#62f58c';
const Z = Math.PI / 2;

// 2.19: built to be looked at, as the rigs were in 2.18: bevelled panels with worn edges, chrome and glass that reflect the storm,
// mud up the sills, tyres with a tread. Each builder returns its parts by material: P painted, M chrome, Gl glass, Li lamps, and the
// wheels (tread and rims). The seat (eye), the launcher's muzzle, the lamps and the beacon are where they were.
function wheels(V, track, zs, r, low) { for (const z of zs) for (const sx of [1, -1]) { const [t, s] = wheelParts(r, 0.5, low); for (const q of t) V.T.push(q.translate(sx * track, r, z)); for (const q of s) V.S.push(q.translate(sx * track, r, z)); } }
const kit = () => ({ P: [], M: [], Gl: [], Li: [], T: [], S: [] });
function rear(V, W, zr, b, plateY) { // tail lamps in bezels, a plate, mud flaps: the end you follow
  for (const sx of [1, -1]) { V.Li.push(bev(0.26, 0.2, 0.06, PINK, sx * W * 0.4, b + 0.3, zr - 0.02, 0.02)); V.P.push(bev(0.32, 0.26, 0.04, INK, sx * W * 0.4, b + 0.3, zr, 0.01), bev(0.34, 0.4, 0.035, INK, sx * (W / 2 - 0.15), b - 0.16, zr + 0.45, 0.012)); }
  V.P.push(bev(0.44, 0.2, 0.025, CREAM, 0, plateY, zr - 0.01, 0.01, '#fffaf0'), bev(0.34, 0.06, 0.006, INK, 0, plateY, zr - 0.024, 0.002));
}
function camper(low) { // a tired pickup under a camper shell twice its age; Sparks bolted a rocket pod to the roof
  const V = kit(), body = '#8a8f86', BE = lite(body), shell = '#e6dfc8', SE = lite(shell, 0.4), b = 0.95;
  V.P.push(bev(2.2, 0.6, 5.4, body, 0, b + 0.2, 0, 0.06, BE), bev(2.23, 0.14, 5.3, '#6f4a3a', 0, b + 0.22, 0, 0.03), bev(2.1, 0.12, 1.6, body, 0, b + 0.55, 1.85, 0.04, BE), bev(0.9, 0.06, 1.2, body, 0, b + 0.63, 1.9, 0.02, BE));
  V.P.push(bev(2.06, 0.75, 1.5, body, 0, b + 0.9, 0.5, 0.06, BE)); V.Gl.push(bev(1.8, 0.4, 0.04, GLASS, 0, b + 0.98, 1.25, 0.012, null, -0.2)); for (const sx of [1, -1]) V.Gl.push(bev(0.03, 0.38, 1.0, GLASS, sx * 1.035, b + 0.98, 0.5, 0.01));
  V.P.push(bev(2.36, 1.5, 3.0, shell, 0, b + 1.3, -1.15, 0.1, SE), bev(2.36, 0.7, 1.5, shell, 0, b + 1.75, 0.7, 0.08, SE), bev(2.4, 0.16, 3.0, '#9a6a3c', 0, b + 1.0, -1.15, 0.03)); // the shell, its cab-over, a brown stripe
  for (const sx of [1, -1]) V.Gl.push(bev(0.03, 0.4, 1.1, GLASS, sx * 1.185, b + 1.5, -0.9, 0.012)); V.Gl.push(bev(1.6, 0.36, 0.06, GLASS, 0, b + 1.85, 1.46, 0.012));
  V.P.push(bev(1.2, 1.1, 0.05, '#d6cfb6', 0, b + 1.25, -2.66, 0.02)); V.Gl.push(bev(0.7, 0.36, 0.02, GLASS, 0, b + 1.55, -2.69, 0.008)); V.M.push(bev(0.2, 0.04, 0.04, CHROME, 0.4, b + 1.15, -2.7, 0.01)); // the shell's back door
  V.P.push(bev(0.6, 0.12, 0.6, '#c9c1a8', -0.4, b + 2.1, 0.2, 0.03)); // roof vent
  V.M.push(bev(1.8, 0.4, 0.08, CHROME, 0, b + 0.2, 2.72, 0.03), bev(2.3, 0.2, 0.26, CHROME, 0, b - 0.05, 2.8, 0.05), bev(2.3, 0.2, 0.22, CHROME, 0, b - 0.05, -2.75, 0.05));
  V.P.push(bev(0.9, 0.5, 0.6, '#3a5a8a', 0.5, b + 2.3, -1.6, 0.05, '#6f8fbf'), bev(0.92, 0.08, 0.62, CREAM, 0.5, b + 2.58, -1.6, 0.02), bev(0.04, 1.6, 0.04, INK, -0.9, b + 2.9, -0.4, 0.01)); // the cooler, the aerial
  // the pod: four tubes in an olive box with a hazard band, on a mount
  V.P.push(bev(1.3, 0.62, 1.7, '#4f6b54', 0, b + 2.42, -1.2, 0.06, '#7d977f'), bev(1.32, 0.12, 1.72, HAZ, 0, b + 2.56, -1.2, 0.025, '#f6d36a'), bev(0.5, 0.2, 0.5, INK, 0, b + 2.1, -1.2, 0.03));
  for (const x of [-0.32, 0.32]) for (const y of [-0.14, 0.16]) { V.P.push(cyl(0.2, 0.2, 0.1, '#0c1112', x, b + 2.42 + y, -0.33, 12, Z), cyl(0.0, 0.14, 0.26, PINK, x, b + 2.42 + y, -0.24, 8, Z)); V.M.push(cyl(0.21, 0.21, 0.03, '#6f7a78', x, b + 2.42 + y, -0.36, 12, Z)); }
  rear(V, 2.2, -2.85, b, b + 0.15); wheels(V, 1.2, [1.75, -1.65], 0.62, low);
  return V;
}
function harpooner(low) { // Winch's flatbed: a launcher the size of a telegraph pole and the drum of cable that feeds it
  const V = kit(), body = '#2f8f9a', BE = lite(body), b = 0.98;
  V.P.push(bev(2.2, 0.55, 5.6, body, 0, b + 0.2, 0, 0.06, BE), bev(2.23, 0.13, 5.5, CREAM, 0, b + 0.24, 0, 0.03, '#fffaf0'), bev(2.1, 0.12, 1.5, body, 0, b + 0.52, 2.0, 0.04, BE));
  V.P.push(bev(2.06, 0.8, 1.45, body, 0, b + 0.9, 0.75, 0.06, BE), bev(2.1, 0.1, 1.5, CREAM, 0, b + 1.34, 0.75, 0.03, '#fffaf0')); V.Gl.push(bev(1.8, 0.42, 0.04, GLASS, 0, b + 0.98, 1.48, 0.012, null, -0.2), bev(1.6, 0.34, 0.03, GLASS, 0, b + 1.0, 0.02, 0.01)); for (const sx of [1, -1]) V.Gl.push(bev(0.03, 0.38, 1.0, GLASS, sx * 1.035, b + 0.98, 0.75, 0.01));
  V.P.push(bev(2.3, 0.14, 3.0, INK, 0, b + 0.52, -1.3, 0.03)); for (let i = 0; i < 7; i++) V.M.push(bev(2.2, 0.03, 0.06, '#5d6967', 0, b + 0.6, -2.6 + i * 0.43, 0.01)); // the deck and its tread bars
  for (const sx of [1, -1]) V.P.push(bev(0.4, 0.4, 1.2, INK, sx * 0.9, b + 0.8, -0.4, 0.04, '#3a4446')); // toolboxes either side
  V.M.push(bev(1.8, 0.4, 0.08, CHROME, 0, b + 0.2, 2.82, 0.03), bev(2.3, 0.2, 0.26, CHROME, 0, b - 0.05, 2.9, 0.05), bev(2.3, 0.2, 0.22, CHROME, 0, b - 0.05, -2.9, 0.05));
  // the launcher: a pedestal, an amber housing worn at the edges, the pale barrel, the barbed head; the drum behind, cable wound on
  V.P.push(cyl(0.5, 0.62, 0.5, INK, 0, b + 0.84, -1.2, 12), bev(0.6, 0.55, 0.9, AMBER, 0, b + 1.36, -1.2, 0.06, '#ffe08a'), cyl(0.05, 0.42, 0.95, PINK, 0, b + 1.5, 2.4, 6, Z));
  V.M.push(cyl(0.2, 0.24, 3.4, CREAM, 0, b + 1.5, 0.3, 12, Z), cyl(0.26, 0.26, 0.1, INK, 0, b + 1.5, -0.8, 12, Z), cyl(0.26, 0.26, 0.1, INK, 0, b + 1.5, 1.6, 12, Z));
  V.P.push(cyl(0.62, 0.62, 0.9, INK, 0, b + 1.0, -2.45, 14, 0, Z)); for (let i = 0; i < 7; i++) V.P.push(cyl(0.53, 0.53, 0.08, '#b9b39f', -0.3 + i * 0.1, b + 1.0, -2.45, 14, 0, Z));
  V.P.push(bev(0.04, 1.7, 0.04, INK, 0.95, b + 2.2, -2.9, 0.01));
  rear(V, 2.2, -3.0, b, b + 0.15); wheels(V, 1.22, [1.85, -1.75], 0.66, low);
  return V;
}
function bus(low) { // a short bus retired from school and drafted into science; DOROTHY racked on the roof
  const V = kit(), body = '#d9cfae', BE = lite(body, 0.35), TE = '#3d7f86', b = 1.0;
  V.P.push(bev(2.4, 2.0, 5.2, body, 0, b + 1.0, -0.6, 0.12, BE), bev(2.43, 0.2, 5.2, TE, 0, b + 0.75, -0.6, 0.04, lite(TE, 0.2)), bev(2.2, 0.16, 5.0, '#b9af90', 0, b + 2.06, -0.6, 0.04));
  for (const sx of [1, -1]) for (let i = 0; i < 5; i++) V.Gl.push(bev(0.03, 0.5, 0.76, GLASS, sx * 1.205, b + 1.45, 1.35 - i * 0.92, 0.01)); // a window each, pillars between
  V.P.push(bev(2.2, 0.9, 1.5, body, 0, b + 0.45, 2.6, 0.08, BE)); V.Gl.push(bev(2.0, 0.6, 0.06, GLASS, 0, b + 1.5, 2.02, 0.012, null, -0.15));
  V.M.push(bev(1.7, 0.4, 0.08, CHROME, 0, b + 0.4, 3.37, 0.03), bev(2.3, 0.2, 0.28, CHROME, 0, b + 0.02, 3.42, 0.05), bev(2.3, 0.2, 0.24, CHROME, 0, b + 0.02, -3.25, 0.05)); for (const y of [-0.1, 0.05]) V.P.push(bev(1.5, 0.05, 0.03, INK, 0, b + 0.4 + y, 3.42, 0.01));
  V.P.push(bev(1.3, 1.5, 0.05, '#cfc5a3', 0, b + 1.05, -3.21, 0.03)); V.Gl.push(bev(0.9, 0.5, 0.02, GLASS, 0, b + 1.5, -3.24, 0.01)); V.M.push(bev(0.24, 0.05, 0.04, CHROME, 0.45, b + 1.0, -3.25, 0.01)); // the emergency door
  V.P.push(bev(2.0, 0.08, 3.6, INK, 0, b + 2.3, -0.9, 0.02), bev(0.08, 0.3, 3.6, INK, 0.96, b + 2.2, -0.9, 0.02), bev(0.08, 0.3, 3.6, INK, -0.96, b + 2.2, -0.9, 0.02)); // roof rack
  V.M.push(cyl(0.7, 0.2, 0.3, '#b9b39f', -0.4, b + 2.7, -1.8, 14, 0.5), cyl(0.05, 0.05, 0.5, INK, -0.4, b + 2.45, -1.8, 6), cyl(0.28, 0.12, 0.5, '#b9b39f', 0.6, b + 2.5, 0.4, 10, Z), cyl(0.28, 0.12, 0.5, '#b9b39f', 0.1, b + 2.5, 0.4, 10, Z));
  V.P.push(bev(0.9, 0.5, 0.7, '#c9412e', 0.4, b + 2.56, -0.6, 0.05, '#e0705e'), bev(0.04, 2.0, 0.04, INK, 0.9, b + 3.2, 0.8, 0.01));
  for (const x of [-0.7, -0.35, 0]) V.P.push(cyl(0.15, 0.15, 0.55, GREEN, x, b + 2.6, -2.7, 10), cyl(0.09, 0.09, 0.56, '#9ff7b8', x + 0.06, b + 2.6, -2.62, 6), cyl(0.16, 0.16, 0.08, INK, x, b + 2.9, -2.7, 10)); // DOROTHY's canisters
  V.P.push(bev(1.1, 0.08, 0.5, HAZ, -0.35, b + 2.36, -2.7, 0.02, '#f6d36a'));
  rear(V, 2.4, -3.24, b, b + 0.2); wheels(V, 1.28, [2.5, -2.0], 0.68, low);
  return V;
}

export class Convoy {
  constructor(scene, world, glowTex, envMap = null, low = false) {
    this.scene = scene; this.world = world; this.units = [];
    // painted, chrome, glass, rubber (one Lambert for the lot on the low tier), and the lamps; all reflect the captured storm (src/sky.js)
    const lam = low || !envMap ? new THREE.MeshLambertMaterial({ vertexColors: true }) : null, std = (r, m, e) => lam || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: r, metalness: m, envMap, envMapIntensity: e });
    const M = { P: std(0.55, 0.2, 0.7), M: std(0.26, 0.9, 1.1), Gl: std(0.06, 0.85, 1.5), T: std(0.92, 0, 0.25), S: std(0.26, 0.9, 1.1), Li: new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }) };
    this.mats = [...new Set(Object.values(M))];
    const build = (V, b) => { const g = new THREE.Group(), y0 = b - 0.45, y1 = b + 0.6;
      for (const k of ['P', 'M', 'Gl', 'Li', 'T', 'S']) { if (!V[k].length) continue; let geo = merge(V[k]); if (k === 'P' || k === 'M') geo = ao(grime(geo, y0, y1, k === 'P' ? 0.55 : 0.4), 1, y0, b + 0.9, k === 'P' ? 0.62 : 0.7); g.add(new THREE.Mesh(geo, M[k])); }
      return g; };
    // role, who drives it, model, slot beside the rig, length, and where you sit when the seat is yours (x, y, z in the vehicle)
    for (const [role, crew, model, side, back, len, eye] of [['harpoon', 'winch', build(harpooner(low), 0.98), -11, 5, 5.6, [0, 3.5, -1.2]], ['dorothy', 'doc', build(bus(low), 1.0), 12.5, -1, 6.8, [0, 4.4, 1.7]], ['rocket', 'sparks', build(camper(low), 0.95), -12.5, -8, 5.4, [0, 4.75, -1.2]]]) {
      const g = model;
      const lamps = [];
      for (const sx of [1, -1]) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#fff1c4', blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true, opacity: 0.85 })); sp.position.set(sx * 0.75, 1.3, len / 2 + 0.3); sp.scale.setScalar(1.2); g.add(sp); lamps.push(sp); }
      const bc = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: AMBER, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true })); bc.position.set(0, 3.6, 0); bc.scale.setScalar(1.6); g.add(bc);
      const sh = new THREE.Mesh(new THREE.CircleGeometry(1, 16), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.28, depthWrite: false, fog: false })); sh.rotation.x = -Math.PI / 2; sh.scale.set(1.6, len * 0.6, 1); sh.renderOrder = 1;
      scene.add(g, sh); this.units.push({ role, crew, eye, active: false, driven: false, g, sh, bc, side, back, x: 0, y: 0, z: 0, heading: 0, speed: 0, phase: Math.random() * 6 });
    }
  }
  dispose() { for (const u of this.units) { this.scene.remove(u.g); this.scene.remove(u.sh); u.g.traverse((o) => { if (o.isMesh) o.geometry.dispose(); }); } for (const m of this.mats) m.dispose(); }
  unit(role) { return this.units.find((u) => u.role === role) || null; }
  seat(unit) { for (const u of this.units) u.active = u === unit; }
  // where your eye is in a unit's seat, and where its weapon leaves from (just below and ahead of it)
  eyeOf(u, out, drop = 0, ahead = 0) { const s = Math.sin(u.heading), c = Math.cos(u.heading), e = u.eye; return out.set(u.x + c * e[0] + s * (e[2] + ahead), u.y + e[1] - drop, u.z - s * e[0] + c * (e[2] + ahead)); }
  muzzle(u, out) { return this.eyeOf(u, out, 0.7, 1.6); }
  place(rig) { for (const u of this.units) { const p = this.slot(u, rig); u.x = p.x; u.z = p.z; u.heading = rig.heading; u.speed = 0; } this.sync(0, 0); }
  // flanking slots beside and a little behind the rig, so the convoy is in the shot, not behind the camera
  slot(u, rig) { const fx = Math.sin(rig.heading), fz = Math.cos(rig.heading), rx = -fz, rz = fx; return { x: rig.x + rx * u.side + fx * u.back, z: rig.z + rz * u.side + fz * u.back }; }

  update(dt, t, rig, storm) {
    for (const u of this.units) {
      if (u.driven) continue; // you have its wheel
      const p = this.slot(u, rig), sd = Math.hypot(u.x - storm.x, u.z - storm.z), td = Math.hypot(p.x - storm.x, p.z - storm.z);
      let want = 0, dx = p.x - u.x, dz = p.z - u.z, dist = Math.hypot(dx, dz);
      if (storm.alive && sd < FLEE) { dx = u.x - storm.x; dz = u.z - storm.z; dist = 60; want = 55; }            // it is coming: run
      else if (u.active && storm.alive) { dx = storm.x - u.x; dz = storm.z - u.z; dist = sd; want = sd > HOLD + 15 ? Math.min(72, 24 + (sd - HOLD) * 0.9) : 0; } // its phase: close to range, then hold still for the shot
      else if (!storm.alive || td > HOLD) want = dist < 1.5 ? Math.max(0, Math.hypot(rig.vx, rig.vz) * 0.98) : Math.min(98, Math.hypot(rig.vx, rig.vz) + dist * 1.4); // keep station
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
      const y = this.world.heightAt(u.x, u.z); u.y = y; u.g.position.set(u.x, y, u.z); u.g.rotation.y = u.heading; u.g.rotation.z = Math.sin(t * 9 + u.phase) * 0.012 * Math.min(1, u.speed / 10);
      u.sh.position.set(u.x, y + 0.1, u.z); u.sh.rotation.z = u.heading; u.bc.material.opacity = 0.35 + 0.65 * (Math.sin(t * 6 + u.phase) > 0 ? 1 : 0.1);
    }
  }
}
