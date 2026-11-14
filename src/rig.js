// The rig: a chunky model with one oversized feature (the harpoon turret) and kinematic arcade handling.
import * as THREE from '../vendor/three.module.min.js';
import { FEEL, WORLD } from './config.js';
import { cyl, merge, bev, ao } from './geo.js';

const HALF = WORLD.size / 2 - 40;
const _n = new THREE.Vector3(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _e = new THREE.Euler();

// Storm-chaser trucks: lifted, boxy, bolted-on. Roof light bar, bull bar, an instrument cradle in the bed.
// 2.18: built to be looked at, as the weapons were in 2.17: panels bevelled so their edges catch the light, steel and chrome that
// reflect the storm sky as it is (src/sky.js capture), glass that mirrors the shelf and the gold strip under it, occlusion under
// the body and mud thrown up the sills, tyres with tread. You mostly see a rig from behind, so the tailgate, bumper, lights, flaps
// and plate carry the detail. The turret, wheels, lights and muzzle are where they were: handling, aim and the cable are unchanged.
const INK = '#1b2224', CHROME = '#c9cdca', GLASS = '#16262a', AMBER = '#ffc531', HAZ = '#e8b21c', RED = '#e2322c', CREAM = '#f3ecd8', OLIVE = '#4f6b54';
const Z = Math.PI / 2, _white = new THREE.Color('#ffffff'), MUD = new THREE.Color('#5b4a36');
const lite = (hex, k = 0.3) => '#' + new THREE.Color(hex).lerp(_white, k).getHexString();
// mud thrown up the body: colours pull toward dried mud below y1, heaviest at y0
function grime(g, y0, y1, k = 0.55) {
  const p = g.attributes.position, c = g.attributes.color;
  for (let i = 0; i < p.count; i++) { const t = 1 - Math.max(0, Math.min(1, (p.getY(i) - y0) / (y1 - y0))), a = k * t * t; c.setXYZ(i, c.getX(i) + (MUD.r - c.getX(i)) * a, c.getY(i) + (MUD.g - c.getY(i)) * a, c.getZ(i) + (MUD.b - c.getZ(i)) * a); }
  c.needsUpdate = true; return g;
}
function bullBar(K, W, z, y) { K.push(bev(0.12, 0.8, 0.12, INK, W * 0.3, y, z, 0.03), bev(0.12, 0.8, 0.12, INK, -W * 0.3, y, z, 0.03), bev(W * 0.86, 0.1, 0.1, INK, 0, y + 0.3, z, 0.03), bev(W * 0.86, 0.1, 0.1, INK, 0, y - 0.05, z, 0.03), bev(W * 0.3, 0.1, 0.1, INK, 0, y + 0.12, z, 0.03)); }
function cradle(P, K, W, z, y) { // hazard-striped frame holding the probe canisters, beacon on the corner post
  for (const sx of [1, -1]) for (const sz of [1, -1]) P.push(bev(0.1, 0.95, 0.1, HAZ, sx * W * 0.34, y + 0.47, z + sz * 0.3, 0.025, '#f6d36a'));
  P.push(bev(W * 0.78, 0.1, 0.1, HAZ, 0, y + 0.95, z + 0.3, 0.025, '#f6d36a'), bev(W * 0.78, 0.1, 0.1, HAZ, 0, y + 0.95, z - 0.3, 0.025, '#f6d36a'));
  K.push(bev(0.1, 0.1, 0.7, INK, W * 0.34, y + 0.95, z, 0.025), bev(0.1, 0.1, 0.7, INK, -W * 0.34, y + 0.95, z, 0.025));
  for (const x of [-0.42, 0, 0.42]) { P.push(cyl(0.2, 0.2, 0.75, '#62f58c', x, y + 0.42, z, 10), cyl(0.12, 0.12, 0.76, '#9ff7b8', x, y + 0.42, z + 0.11, 6)); K.push(cyl(0.215, 0.215, 0.1, INK, x, y + 0.72, z, 10), cyl(0.215, 0.215, 0.06, INK, x, y + 0.12, z, 10)); }
}
// a tyre with a tread, a rim with lugs; returns [rubber, steel] part lists centred on the axle (axis along x)
function wheelParts(wr, wide, low) {
  const T = [cyl(wr * 0.97, wr * 0.97, wide, '#15191a', 0, 0, 0, 16, 0, Z)], S = [], n = low ? 8 : 14;
  for (let i = 0; i < n; i++) { const a = i / n * 6.283; T.push(bev(wide * 1.02, 0.11, wr * 0.32, '#1e2426', 0, Math.cos(a) * (wr * 0.97), Math.sin(a) * (wr * 0.97), 0.025, '#2b3335', a)); }
  S.push(cyl(wr * 0.52, wr * 0.52, wide + 0.04, CHROME, 0, 0, 0, 12, 0, Z), cyl(wr * 0.2, wr * 0.2, wide + 0.1, INK, 0, 0, 0, 8, 0, Z));
  for (const sx of [1, -1]) for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; S.push(cyl(0.035, 0.035, 0.05, INK, sx * (wide / 2 + 0.04), Math.cos(a) * wr * 0.32, Math.sin(a) * wr * 0.32, 6, 0, Z)); }
  return [T, S];
}

function buildModel(def, envMap, glowTex, low) {
  const g = new THREE.Group(), L = def.len, W = def.wid, id = def.id, P = [], K = [], M = [], Gl = [], lit = [], B = def.body, BE = lite(def.body), T = def.trim, TE = lite(def.trim, 0.18);
  const wr = id === 'bulldog' ? 0.78 : 0.64, base = wr + 0.34; // lifted: daylight between tyre and arch
  let cabTop = base + 1.45, barZ = L * 0.06, bedZ = -L * 0.3, turretY = base + 0.55;
  K.push(bev(W * 0.8, 0.26, L * 0.96, INK, 0, base - 0.22, 0, 0.04)); // frame rails
  const plate = (y, z) => { P.push(bev(0.44, 0.2, 0.025, CREAM, 0, y, z, 0.01, '#fffaf0')); K.push(bev(0.34, 0.06, 0.006, INK, 0, y, z - 0.014, 0.002)); };
  const flaps = (zr, x) => { for (const sx of [1, -1]) K.push(bev(0.36, 0.42, 0.035, INK, sx * x, base - 0.18, zr, 0.012)); };
  if (id === 'mule') {
    P.push(bev(W, 0.62, L, B, 0, base + 0.25, 0, 0.07, BE), bev(W + 0.03, 0.15, L * 0.985, T, 0, base + 0.3, 0, 0.03, TE), bev(W + 0.03, 0.07, L * 0.985, '#8a3415', 0, base + 0.1, 0, 0.02));
    P.push(bev(W * 0.95, 0.12, L * 0.3, B, 0, base + 0.6, L * 0.33, 0.04, BE), bev(W * 0.42, 0.06, L * 0.24, B, 0, base + 0.68, L * 0.33, 0.025, BE)); // hood and its power bulge
    K.push(bev(W * 0.64, 0.36, 0.06, INK, 0, base + 0.3, L / 2 + 0.01, 0.02)); for (const y of [-0.09, 0, 0.09]) M.push(bev(W * 0.58, 0.035, 0.04, CHROME, 0, base + 0.3 + y, L / 2 + 0.045, 0.01)); // grille
    P.push(bev(W * 0.94, 0.78, L * 0.29, B, 0, base + 0.94, L * 0.045, 0.06, BE), bev(W * 0.97, 0.1, L * 0.3, T, 0, base + 1.38, L * 0.045, 0.03, TE));
    Gl.push(bev(W * 0.8, 0.42, 0.04, GLASS, 0, base + 1.02, L * 0.045 + L * 0.145, 0.012, null, -0.18), bev(W * 0.72, 0.34, 0.03, GLASS, 0, base + 1.04, L * 0.045 - L * 0.145 - 0.004, 0.01));
    for (const sx of [1, -1]) Gl.push(bev(0.03, 0.36, L * 0.2, GLASS, sx * (W * 0.47 + 0.004), base + 1.02, L * 0.045, 0.01));
    for (const sx of [1, -1]) { P.push(bev(0.14, 0.42, L * 0.38, B, sx * (W / 2 - 0.07), base + 0.72, bedZ - 0.1, 0.035, BE)); K.push(bev(0.18, 0.05, L * 0.38, INK, sx * (W / 2 - 0.07), base + 0.95, bedZ - 0.1, 0.015)); }
    P.push(bev(W, 0.42, 0.14, B, 0, base + 0.72, -L / 2 + 0.07, 0.04, BE)); K.push(bev(W * 0.9, 0.06, L * 0.36, INK, 0, base + 0.56, bedZ - 0.1, 0.01), bev(W * 0.7, 0.2, 0.02, INK, 0, base + 0.74, -L / 2 - 0.004, 0.008));
    M.push(bev(0.32, 0.045, 0.03, CHROME, 0, base + 0.88, -L / 2 - 0.008, 0.01)); // tailgate handle
    M.push(bev(W + 0.12, 0.2, 0.28, CHROME, 0, base - 0.02, L / 2 + 0.1, 0.05), bev(W + 0.12, 0.2, 0.22, CHROME, 0, base - 0.02, -L / 2 - 0.06, 0.05)); K.push(bev(W * 0.3, 0.04, 0.2, INK, 0, base + 0.09, -L / 2 - 0.06, 0.01));
    plate(base + 0.4, -L / 2 - 0.016);
    for (const sx of [1, -1]) for (const sz of [1, -1]) K.push(bev(0.2, 0.16, wr * 2.5, INK, sx * (W / 2 + 0.07), base + 0.02, sz * L * 0.33, 0.045));
    flaps(-L * 0.33 - wr - 0.12, W / 2 - 0.05);
    bullBar(K, W, L / 2 + 0.34, base + 0.2); cradle(P, K, W, -L / 2 + 0.5, base + 0.56);
    K.push(bev(0.04, 1.9, 0.04, INK, -W * 0.44, base + 2.2, -L * 0.1, 0.01)); M.push(bev(0.18, 0.5, 0.18, CHROME, W * 0.52, base + 1.05, L * 0.2, 0.04), bev(0.18, 0.5, 0.18, CHROME, -W * 0.52, base + 1.05, L * 0.2, 0.04));
    turretY = base + 0.58; bedZ = -L * 0.22;
  } else if (id === 'bulldog') {
    const SK = '#3d5242', SKE = lite(SK, 0.2);
    P.push(bev(W, 0.95, L, B, 0, base + 0.42, 0, 0.1, BE), bev(W + 0.36, 0.72, L * 0.86, SK, 0, base + 0.1, 0, 0.08, SKE)); // hull, skirts over the tyres
    for (const sx of [1, -1]) for (let i = 0; i < 7; i++) K.push(bev(0.05, 0.05, 0.05, '#2c3a30', sx * (W / 2 + 0.185), base + 0.36, (i / 6 - 0.5) * L * 0.78, 0.012)); // rivets
    P.push(bev(W * 0.98, 0.7, L * 0.3, B, 0, base + 0.82, L * 0.4, 0.08, BE, 0.5), bev(W * 0.9, 0.16, 0.5, HAZ, 0, base + 0.5, L / 2 + 0.12, 0.03, '#f6d36a', 0.5)); // wedge nose, hazard lip
    for (let i = 0; i < 4; i++) K.push(bev(W * 0.6, 0.04, 0.06, INK, 0, base + 0.72 + i * 0.1, L * 0.46 - i * 0.05, 0.01, null, 0.5)); // grille slots in the wedge
    P.push(bev(W * 0.9, 0.7, L * 0.42, B, 0, base + 1.2, -L * 0.02, 0.08, BE), bev(W * 0.6, 0.12, L * 0.2, SK, 0, base + 1.6, -L * 0.04, 0.03, SKE));
    Gl.push(bev(W * 0.74, 0.14, 0.04, GLASS, 0, base + 1.3, -L * 0.02 + L * 0.21, 0.01, null, -0.3), bev(W * 0.6, 0.12, 0.03, GLASS, 0, base + 1.32, -L * 0.02 - L * 0.21 - 0.004, 0.008));
    for (const sx of [1, -1]) Gl.push(bev(0.03, 0.14, L * 0.26, GLASS, sx * (W * 0.45 + 0.004), base + 1.3, 0, 0.008));
    P.push(bev(W * 0.94, 0.5, L * 0.26, SK, 0, base + 1.1, -L * 0.36, 0.06, SKE)); K.push(bev(W + 0.4, 0.14, L * 0.9, INK, 0, base - 0.24, 0, 0.04));
    for (const z of [-0.3, 0, 0.3]) K.push(bev(W + 0.38, 0.5, 0.06, INK, 0, base + 0.1, z * L, 0.02));
    K.push(bev(W * 0.5, 0.5, 0.04, '#2c3a30', 0, base + 0.55, -L / 2 - 0.01, 0.015)); M.push(bev(0.2, 0.04, 0.03, CHROME, 0.12, base + 0.6, -L / 2 - 0.035, 0.008)); // rear door, its handle
    for (const sx of [1, -1]) { P.push(bev(0.3, 0.42, 0.16, OLIVE, sx * W * 0.36, base + 0.62, -L / 2 - 0.06, 0.03, lite(OLIVE, 0.2)), bev(0.06, 0.06, 0.06, RED, sx * W * 0.36 + 0.08, base + 0.86, -L / 2 - 0.06, 0.012)); M.push(cyl(0.07, 0.08, 1.0, '#6f7a78', sx * (W / 2 + 0.02), base + 1.4, -L * 0.42, 8)); } // jerry cans, exhaust stacks
    plate(base + 0.18, -L / 2 - 0.03); flaps(-L * 0.33 - wr - 0.1, W / 2 + 0.05);
    K.push(bev(0.04, 2.1, 0.04, INK, W * 0.4, base + 2.5, -L * 0.2, 0.01));
    cabTop = base + 1.66; barZ = -L * 0.02; bedZ = -L * 0.36; turretY = base + 1.35;
  } else {
    P.push(bev(W, 0.5, L, B, 0, base + 0.16, 0, 0.06, BE), bev(W + 0.03, 0.12, L * 0.985, T, 0, base + 0.2, 0, 0.03, TE), bev(W * 0.92, 0.1, L * 0.34, B, 0, base + 0.45, L * 0.32, 0.03, BE)); // low tub
    Gl.push(bev(W * 0.84, 0.36, 0.05, GLASS, 0, base + 0.68, L * 0.14, 0.012, null, -0.35));
    for (const sx of [1, -1]) K.push(bev(0.5, 0.6, 0.5, INK, sx * W * 0.22, base + 0.6, -L * 0.02, 0.06), bev(0.5, 0.14, 0.42, '#2c3436', sx * W * 0.22, base + 0.36, 0.02, 0.04)); // bucket seats
    for (const sx of [1, -1]) M.push(cyl(0.055, 0.055, 1.15, T, sx * W * 0.44, base + 0.95, -L * 0.1, 8), cyl(0.055, 0.055, L * 0.36, T, sx * W * 0.44, base + 1.5, L * 0.07, 8, Z), cyl(0.055, 0.055, 0.95, T, sx * W * 0.44, base + 1.05, L * 0.22, 8, -0.45));
    M.push(cyl(0.055, 0.055, W * 0.9, T, 0, base + 1.5, -L * 0.1, 8, 0, Z), cyl(0.055, 0.055, W * 0.9, T, 0, base + 1.5, L * 0.24, 8, 0, Z), cyl(0.045, 0.045, 1.4, T, 0, base + 1.05, -L * 0.1, 8, 0, 0.9)); // cage hoops and a brace
    const [st, ss] = wheelParts(0.6, 0.34, low); for (const q of st) P.push(q.rotateY(Z).rotateX(Math.PI / 2 - 0.5).translate(0, base + 0.75, -L * 0.42)); for (const q of ss) M.push(q.rotateY(Z).rotateX(Math.PI / 2 - 0.5).translate(0, base + 0.75, -L * 0.42)); // the spare, leaning on the cage
    P.push(bev(0.5, 0.34, 0.36, RED, 0, base + 0.5, -L * 0.36, 0.04, lite(RED, 0.25))); M.push(cyl(0.06, 0.06, 0.05, CHROME, 0.12, base + 0.69, -L * 0.36, 8)); // fuel cell
    M.push(cyl(0.07, 0.07, W * 1.05, CHROME, 0, base - 0.05, L / 2 + 0.2, 8, 0, Z), cyl(0.07, 0.07, W * 1.05, CHROME, 0, base - 0.05, -L / 2 - 0.12, 8, 0, Z));
    plate(base + 0.22, -L / 2 - 0.02); flaps(-L * 0.33 - wr - 0.1, W / 2 + 0.2);
    cabTop = base + 1.56; barZ = -L * 0.1; bedZ = -L * 0.26; turretY = base + 0.42;
  }
  // roof light bar: four amber lamps, always on in the gloom
  K.push(bev(W * 0.84, 0.1, 0.16, INK, 0, cabTop, barZ, 0.03));
  for (const x of [-0.36, -0.12, 0.12, 0.36]) lit.push(bev(0.3, 0.24, 0.22, AMBER, x * W, cabTop + 0.16, barZ, 0.04, '#ffe08a'));
  lit.push(bev(0.44, 0.24, 0.1, '#fff6d6', W * 0.33, base + 0.3, L / 2 + 0.08, 0.03), bev(0.44, 0.24, 0.1, '#fff6d6', -W * 0.33, base + 0.3, L / 2 + 0.08, 0.03), bev(0.3, 0.2, 0.1, '#ff3f8e', W * 0.38, base + 0.3, -L / 2 - 0.03, 0.03), bev(0.3, 0.2, 0.1, '#ff3f8e', -W * 0.38, base + 0.3, -L / 2 - 0.03, 0.03));
  for (const sx of [1, -1]) K.push(bev(0.36, 0.26, 0.04, INK, sx * W * 0.38, base + 0.3, -L / 2 - 0.015, 0.01)); // tail-lamp bezels
  // materials: painted body, chrome, glass that mirrors the storm, lamps; the low tier draws the lot in one Lambert
  const y0 = base - 0.45, y1 = base + 0.55, body = ao(grime(merge([...P, ...K]), y0, y1), 1, y0, base + 0.9, 0.62), chrome = M.length ? ao(grime(merge(M), y0, y1, 0.4), 1, y0, base + 0.9, 0.7) : null, glass = Gl.length ? merge(Gl) : null;
  const mat = low ? new THREE.MeshLambertMaterial({ vertexColors: true }) : null;
  const paint = mat || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.52, metalness: 0.22, envMap, envMapIntensity: 0.75 });
  const steel = mat || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.26, metalness: 0.9, envMap, envMapIntensity: 1.1 });
  const pane = mat || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.06, metalness: 0.85, envMap, envMapIntensity: 1.5 });
  g.add(new THREE.Mesh(body, paint)); if (chrome) g.add(new THREE.Mesh(chrome, steel)); if (glass) g.add(new THREE.Mesh(glass, pane)); g.add(new THREE.Mesh(merge(lit), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })));
  // the turret: the one thing that makes it a hunter's rig. Amber, worn at the edges; the harpoon, its head, the cable drum
  const turret = new THREE.Group(); turret.position.set(0, turretY, bedZ);
  const tp = [cyl(0.5, 0.62, 0.5, INK, 0, 0.25, 0, 12), bev(0.56, 0.5, 0.74, AMBER, 0, 0.75, 0, 0.06, '#ffe08a'), bev(0.58, 0.12, 0.3, INK, 0, 0.75, 0.1, 0.03), cyl(0.05, 0.32, 0.75, '#ff3f8e', 0, 0.85, 3.0, 6, Z), cyl(0.46, 0.46, 0.5, INK, 0.58, 0.75, -0.1, 12, 0, Z)];
  for (let i = 0; i < 5; i++) tp.push(cyl(0.36, 0.36, 0.06, '#b9b39f', 0.4 + i * 0.09, 0.75, -0.1, 12, 0, Z));
  const tm = [cyl(0.16, 0.2, 2.7, CREAM, 0, 0.85, 1.45, 10, Z), cyl(0.21, 0.21, 0.08, INK, 0, 0.85, 0.5, 10, Z), cyl(0.21, 0.21, 0.08, INK, 0, 0.85, 2.2, 10, Z)];
  turret.add(new THREE.Mesh(ao(merge(tp), 1, -0.1, 1.0, 0.7), paint), new THREE.Mesh(merge(tm), steel));
  g.add(turret); g.userData.turret = turret;
  // wheels: rubber with a tread, steel rims and lugs. Each is a group, turned and steered as one
  const [wt, ws] = wheelParts(wr, 0.56, low), tyreGeo = merge(wt), rimGeo = merge(ws), rubber = mat || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, envMap, envMapIntensity: 0.25 });
  g.userData.wheels = [];
  const track = W / 2 + (id === 'whippet' ? 0.3 : 0.14);
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const w = new THREE.Group(); w.add(new THREE.Mesh(tyreGeo, rubber), new THREE.Mesh(rimGeo, steel)); w.position.set(sx * track, wr, sz * L * 0.33); w.rotation.order = 'YXZ'; w.userData.front = sz > 0; g.add(w); g.userData.wheels.push(w); }
  // glows: headlights and a red beacon that actually flash (sprites, additive)
  g.userData.glows = [];
  if (glowTex) {
    const glow = (color, x, y, z, size, kind) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true })); sp.position.set(x, y, z); sp.scale.setScalar(size); sp.userData.kind = kind; sp.userData.size = size; g.add(sp); g.userData.glows.push(sp); };
    glow('#fff1c4', W * 0.33, base + 0.3, L / 2 + 0.2, 1.15, 'head'); glow('#fff1c4', -W * 0.33, base + 0.3, L / 2 + 0.2, 1.15, 'head');
    glow('#ffb52e', -W * 0.3, cabTop + 0.2, barZ, 1.5, 'barA'); glow('#ffb52e', W * 0.3, cabTop + 0.2, barZ, 1.5, 'barB');
    if (id === 'mule') { g.add(new THREE.Mesh(merge([cyl(0.14, 0.16, 0.26, RED, W * 0.34, base + 1.7, -L / 2 + 0.8, 10)]), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }))); glow('#ff3a2e', W * 0.34, base + 1.72, -L / 2 + 0.8, 1.9, 'beacon'); }
  }
  g.userData.muzzle = new THREE.Vector3(0, turretY + 0.85, bedZ);
  g.scale.setScalar(1.2); // chunky on purpose: it has to read at 40 px on a phone
  return g;
}

export class Rig {
  constructor(scene, def, envMap, mods) {
    this.def = def; this.mods = mods; this.scene = scene;
    this.model = buildModel(def, envMap, mods.glow, !!mods.low); scene.add(this.model); this.alert = 0; this.clock = 0; this.ghost = !!mods.ghost; // ghost: handling only, drawn by something else (a crew vehicle you are driving)
    const sh = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.32, depthWrite: false, fog: false }));
    sh.rotation.x = -Math.PI / 2; sh.scale.set(def.wid * 1.1, def.len * 0.95, 1); sh.renderOrder = 1; scene.add(sh); this.shadow = sh; if (this.ghost) { this.model.visible = false; sh.visible = false; }
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
        const slipA = Math.atan2(this.vx * fz - this.vz * fx, Math.max(0.01, vF)); if (Math.abs(slipA) > FEEL.driftMaxSlip && Math.sign(slipA) === Math.sign(steer)) yaw = 0;
      }
      this.heading -= yaw * dt;
      fx = Math.sin(this.heading); fz = Math.cos(this.heading);
    }
    const rx = -fz, rz = fx; vF = this.vx * fx + this.vz * fz; let vS = this.vx * rx + this.vz * rz;
    if (grounded) {
      if (drift || this.driftOut > 0) {
        // swing the velocity round toward the nose without throwing the speed away; getting back on the throttle carries it out
        const sp = Math.max(0, sp0 - (drift ? FEEL.driftBleed : 0) * dt), va = Math.atan2(this.vx, this.vz); let d = this.heading - va; d = Math.atan2(Math.sin(d), Math.cos(d));
        const na = va + Math.sign(d) * Math.min(Math.abs(d), (drift ? FEEL.driftSwing : FEEL.driftCatch) * dt); this.vx = Math.sin(na) * sp; this.vz = Math.cos(na) * sp;
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
    m.visible = !this.ghost && !(this.immune > 0 && this.hull > 0 && Math.floor(this.immune * 20) % 2 === 0);
  }
  // world position of the harpoon muzzle (where the cable leaves the rig)
  muzzle(out) { return out.copy(this.model.userData.muzzle).applyMatrix4(this.model.matrixWorld); }
}
