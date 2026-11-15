// The world's props, built to be looked at (2.27), as the rigs (2.18) and the convoy (2.19) were: panels bevelled so their
// edges catch the light, occlusion baked under the eaves and at the foot, and the parts that say what a thing is (a gambrel
// roof and X-braced doors on a barn, bands and a ladder up a silo, a porch, windows and shutters on a house, eighteen blades
// on a windmill, a braced water tower with its catwalk). Same footprint, height and collision radius as the kit in world.js,
// which the low tier keeps drawing: these are a few hundred triangles each, and the trees, which there are hundreds of,
// stay under a hundred and fifty.
import * as THREE from '../vendor/three.module.min.js';
import { box, cyl, cone, blob, octa, open, dome, prism, merge, bev, ao } from './geo.js';

const C = { red: '#a3352b', redE: '#c4574a', roof: '#33393b', roofE: '#4a5254', cream: '#e9dfc4', creamE: '#fff6dc', white: '#f1eee2', whiteE: '#ffffff',
  tin: '#aab3b4', tinE: '#d3dadb', tinD: '#8b9495', wood: '#7a5a3a', dark: '#2a2f30', glass: '#26343a', leaf: '#5f8f3c', leaf2: '#7aa846', leaf3: '#4a7531',
  pine: '#417548', pine2: '#33603b', trunk: '#5a4330', brick: '#9a5a44', brickE: '#b8735b', teal: '#3f7f86', mustard: '#c99a2e', stone: '#8a8478', steel: '#5f6869' };
const Z = Math.PI / 2;

// triangles, coloured, each turned to face away from `c` (the middle of the thing): for hand-built roofs and gables
function tris(pts, color, c) {
  const p = [], col = new THREE.Color(color), a = new THREE.Vector3(), b = new THREE.Vector3(), n = new THREE.Vector3(), m = new THREE.Vector3();
  for (let i = 0; i < pts.length; i += 3) {
    const [A, B, D] = [pts[i], pts[i + 1], pts[i + 2]]; a.set(B[0] - A[0], B[1] - A[1], B[2] - A[2]); b.set(D[0] - A[0], D[1] - A[1], D[2] - A[2]); n.crossVectors(a, b);
    m.set((A[0] + B[0] + D[0]) / 3 - c[0], (A[1] + B[1] + D[1]) / 3 - c[1], (A[2] + B[2] + D[2]) / 3 - c[2]);
    p.push(...A, ...(n.dot(m) < 0 ? [...D, ...B] : [...B, ...D]));
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(p), 3));
  const cs = new Float32Array(p.length); for (let i = 0; i < cs.length; i += 3) { cs[i] = col.r; cs[i + 1] = col.g; cs[i + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(cs, 3)); g.computeVertexNormals(); return g;
}
// a gambrel roof (the barn's), ridge along z: steep lower slopes, shallow upper ones, from y0; and its two gable ends
function gambrel(w, d, h, y0, roofCol, gableCol, gw) {
  const a = w / 2, b = d / 2, P = [[-a, 0], [-a * 0.78, h * 0.6], [0, h], [a * 0.78, h * 0.6], [a, 0]], R = [];
  for (let i = 0; i < 4; i++) { const [p, q] = [P[i], P[i + 1]]; R.push([p[0], y0 + p[1], b], [q[0], y0 + q[1], b], [q[0], y0 + q[1], -b], [p[0], y0 + p[1], b], [q[0], y0 + q[1], -b], [p[0], y0 + p[1], -b]); }
  const k = gw / w, G = [], gb = b - 0.45; // the gable sits on the wall, under the overhang
  for (const s of [1, -1]) for (let i = 0; i < 4; i++) { const [p, q] = [P[i], P[i + 1]]; G.push([0, y0 + h * 0.35, s * gb], [p[0] * k, y0 + p[1] * 0.96, s * gb], [q[0] * k, y0 + q[1] * 0.96, s * gb]); }
  G.push([-a * k, y0, gb], [a * k, y0, gb], [0, y0 + h * 0.35, gb], [-a * k, y0, -gb], [a * k, y0, -gb], [0, y0 + h * 0.35, -gb]);
  return [tris(R, roofCol, [0, y0, 0]), tris(G, gableCol, [0, y0, 0])];
}
// an X-braced barn door, w by h, in the plane z = z0 facing +z (s = 1) or -z (s = -1)
function xDoor(P, x, y, z, w, h, s) {
  P.push(bev(w, h, 0.12, C.red, x, y, z, 0.03, C.redE));
  const t = 0.16, dz = z + s * 0.08, ang = Math.atan2(h - t, w - t), len = Math.hypot(w - t, h - t);
  for (const [px, py, pw, ph] of [[x, y + h / 2 - t / 2, w, t], [x, y - h / 2 + t / 2, w, t], [x - w / 2 + t / 2, y, t, h], [x + w / 2 - t / 2, y, t, h]]) P.push(box(pw, ph, 0.1, C.white, px, py, dz));
  P.push(box(len, t, 0.08, C.white, x, y, dz + s * 0.01, 0, 0, ang), box(len, t, 0.08, C.white, x, y, dz + s * 0.01, 0, 0, -ang));
}
// a window: dark glass in a white frame, with shutters if asked; in the plane z = z0 (s: which way it faces), or x = x0 (side)
// u: where along the wall; wall: the wall's z (or x, for a side wall); s: which way it faces
function win(P, u, y, wall, w, h, s, side = false, shut = null) {
  const at = (uu, v, o) => (side ? [wall + s * o, v, uu] : [uu, v, wall + s * o]), ry = side ? Z : 0;
  P.push(box(w, h, 0.08, C.glass, ...at(u, y, 0.02), ry));
  const fw = 0.14, cx = u;
  for (const [u, v, pw, ph] of [[cx, y + h / 2, w + fw, fw], [cx, y - h / 2, w + fw * 2, fw * 1.4], [cx - w / 2, y, fw, h], [cx + w / 2, y, fw, h], [cx, y, fw * 0.6, h]]) P.push(box(pw, ph, 0.12, C.white, ...at(u, v, 0.06), ry));
  if (shut) for (const o of [-1, 1]) P.push(box(w * 0.42, h * 1.02, 0.08, shut, ...at(cx + o * (w / 2 + w * 0.26), y, 0.05), ry));
}

export const HERO = {
  barn() {
    const P = [], K = [], W = 12, D = 16;
    P.push(bev(W + 0.5, 0.7, D + 0.5, C.stone, 0, 0.35, 0, 0.08, '#a39d90')); // fieldstone footing
    P.push(bev(W, 5.4, D, C.red, 0, 3.3, 0, 0.1, C.redE));
    for (let i = 0; i < 12; i++) { const z = -D / 2 + 0.7 + i * (D - 1.4) / 11; for (const s of [1, -1]) K.push(box(0.12, 5.1, 0.16, '#8a2c23', s * (W / 2 + 0.04), 3.3, z)); } // board battens down the long sides
    for (const sx of [1, -1]) for (const sz of [1, -1]) P.push(bev(0.42, 5.4, 0.42, C.white, sx * W / 2, 3.3, sz * D / 2, 0.05, C.whiteE)); // white corner boards
    for (const sz of [1, -1]) P.push(bev(W + 0.1, 0.3, 0.3, C.white, 0, 6.0, sz * D / 2, 0.04, C.whiteE)); // the eave line at the gables
    P.push(...gambrel(13.6, 17, 5.2, 6, C.roof, C.red, W));
    for (const sx of [1, -1]) P.push(bev(0.22, 0.22, 17, C.roofE, sx * 6.8, 6.0, 0, 0.04)); // drip edges
    for (const s of [1, -1]) { // big doors both ends, the hay-loft door over them, and the track the doors run on
      xDoor(P, -1.15, 2.85, s * (D / 2 + 0.07), 2.3, 4.5, s); xDoor(P, 1.15, 2.85, s * (D / 2 + 0.07), 2.3, 4.5, s);
      P.push(bev(5.4, 0.18, 0.18, C.dark, 0, 5.3, s * (D / 2 + 0.18), 0.03));
      xDoor(P, 0, 7.9, s * (D / 2 - 0.3), 1.9, 1.9, s); P.push(bev(0.9, 0.12, 1.1, C.dark, 0, 9.3, s * (D / 2 + 0.2), 0.02)); // the hay hood
    }
    P.push(bev(1.6, 1.4, 1.6, C.white, 0, 11.7, 0, 0.05, C.whiteE), prism(2.2, 1.0, 2.2, C.roof, 0, 12.4, 0)); for (const s of [1, -1]) K.push(box(1.2, 0.8, 0.06, C.dark, 0, 11.7, s * 0.82)); // the cupola, louvres
    K.push(box(0.05, 1.2, 0.05, C.dark, 0, 13.9, 0), box(0.9, 0.05, 0.05, C.dark, 0, 14.2, 0), box(0.6, 0.35, 0.04, C.dark, 0.2, 14.55, 0)); // weathervane
    return ao(merge([...P, ...K]), 1, 0, 3.2, 0.62);
  },
  silo() {
    const P = [], R = 3;
    P.push(cyl(R + 0.35, R + 0.45, 0.8, C.stone, 0, 0.4, 0, 14)); // the pad
    P.push(cyl(R, R, 13.6, C.tin, 0, 7.6, 0, 16));
    for (let i = 0; i < 7; i++) P.push(cyl(R + 0.05, R + 0.05, 0.16, C.tinD, 0, 1.6 + i * 2, 0, 16)); // the hoops
    P.push(dome(R + 0.12, C.white, 0, 14.35, 0), cyl(R + 0.14, R + 0.14, 0.3, C.tinD, 0, 14.4, 0, 16), cone(0.55, 0.9, C.tinD, 0, 17.6, 0, 8), cyl(0.35, 0.35, 0.5, C.white, 0, 17.0, 0, 8)); // cap, vent
    for (const x of [-0.32, 0.32]) P.push(box(0.08, 14, 0.08, C.steel, x, 7.4, R + 0.32)); // the ladder up the side, its rungs, its cage
    for (let i = 0; i < 20; i++) P.push(box(0.64, 0.05, 0.05, C.steel, 0, 1.2 + i * 0.66, R + 0.32));
    for (let i = 0; i < 6; i++) P.push(cyl(0.55, 0.55, 0.05, C.steel, 0, 6 + i * 1.5, R + 0.55, 6));
    P.push(box(1.1, 1.6, 0.1, C.tinD, 0, 2.2, R + 0.02)); // the hatch at the foot
    return ao(merge(P), 1, 0, 2.5, 0.66);
  },
  house() {
    const P = [], K = [], W = 9, D = 8;
    P.push(bev(W + 0.3, 0.6, D + 0.3, C.stone, 0, 0.3, 0, 0.06));
    P.push(bev(W, 4.5, D, C.cream, 0, 2.85, 0, 0.08, C.creamE));
    for (let i = 0; i < 8; i++) for (const s of [1, -1]) K.push(box(W + 0.02, 0.05, 0.03, '#cfc4a8', 0, 1.0 + i * 0.52, s * (D / 2 + 0.01))); // clapboard lines front and back
    for (const sx of [1, -1]) for (const sz of [1, -1]) P.push(box(0.3, 4.5, 0.3, C.white, sx * W / 2, 2.85, sz * D / 2));
    P.push(prism(10, 3.4, 9, C.brick, 0, 5.1, 0)); for (const s of [1, -1]) P.push(bev(0.18, 0.3, 9.2, C.white, s * 5.0, 5.1, 0, 0.03, C.whiteE)); // the roof, its fascia
    P.push(bev(1.3, 3.2, 1.3, C.brick, 2.4, 6.6, 1.5, 0.05, C.brickE), bev(1.55, 0.25, 1.55, C.stone, 2.4, 8.25, 1.5, 0.04)); // chimney, its cap
    for (const s of [1, -1]) { win(P, -2.6, 3.1, s * D / 2, 1.3, 1.6, s, false, C.teal); win(P, 2.6, 3.1, s * D / 2, 1.3, 1.6, s, false, C.teal); }
    for (const s of [1, -1]) win(P, 0, 3.1, s * W / 2, 1.2, 1.5, s, true);
    P.push(bev(1.5, 2.5, 0.12, C.teal, 0, 1.85, D / 2 + 0.05, 0.03, '#5aa0a7'), bev(1.85, 0.16, 0.16, C.white, 0, 3.15, D / 2 + 0.1, 0.03)); // the door
    P.push(bev(4.6, 0.25, 2.0, C.wood, 0, 0.7, D / 2 + 1.0, 0.04, '#94714c'), bev(1.6, 0.25, 0.7, C.wood, 0, 0.42, D / 2 + 2.3, 0.04)); // porch deck, the step
    for (const x of [-2.1, 2.1]) P.push(bev(0.2, 2.6, 0.2, C.white, x, 2.1, D / 2 + 1.85, 0.03, C.whiteE));
    P.push(prism(2.3, 0.9, 5.0, C.brick, 0, 3.4, D / 2 + 1.05, Z)); // the porch roof, ridge across the front
    return ao(merge([...P, ...K]), 1, 0, 2.2, 0.65);
  },
  windmill() {
    const P = [], top = 12.2, foot = 1.25;
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const lean = Math.atan2(foot - 0.25, top), x = sx * (foot + 0.25) / 2, z = sz * (foot + 0.25) / 2; P.push(box(0.12, top + 0.1, 0.12, C.dark, x, top / 2, z, 0, -sz * lean, sx * lean)); } // each leg leans in to the top
    for (const y of [3, 6.5, 9.5]) { const r = 0.25 + (foot - 0.25) * (1 - y / top); for (const s of [1, -1]) { P.push(box(r * 2, 0.07, 0.07, C.dark, 0, y, s * r), box(0.07, 0.07, r * 2, C.dark, s * r, y, 0)); } } // girts
    P.push(bev(0.8, 0.12, 0.8, C.steel, 0, top - 0.2, 0, 0.02)); // the platform
    P.push(cyl(0.22, 0.22, 0.9, C.dark, 0, top, 0.35, 8, Z), cyl(0.38, 0.38, 0.3, C.tin, 0, top, 0.85, 10, Z)); // the gearbox, the hub
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; P.push(box(0.46, 1.9, 0.04, C.tin, Math.cos(a) * 1.55, top + Math.sin(a) * 1.55, 0.85, 0, 0.28, a - Z)); } // eighteen blades
    P.push(box(0.08, 0.08, 2.6, C.dark, 0, top, -1.2), box(0.06, 1.4, 1.6, C.red, 0, top, -2.4)); // the tail and its vane
    return merge(P);
  },
  tower() {
    const P = [], H = 16;
    for (const [x, z] of [[3, 3], [-3, 3], [3, -3], [-3, -3]]) P.push(cyl(0.22, 0.32, H, C.steel, x, H / 2, z, 6), cyl(0.5, 0.55, 0.4, C.stone, x, 0.2, z, 8));
    for (const y of [4, 9, 13.5]) for (const [x0, z0, x1, z1] of [[3, 3, -3, 3], [-3, 3, -3, -3], [-3, -3, 3, -3], [3, -3, 3, 3]]) {
      const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, alongX = z0 === z1;
      P.push(box(alongX ? 6 : 0.1, 0.1, alongX ? 0.1 : 6, C.steel, mx, y, mz));
      if (y < 13) for (const s of [1, -1]) P.push(box(alongX ? 7.4 : 0.06, 0.06, alongX ? 0.06 : 7.4, C.steel, mx, y + 2.25, mz, 0, alongX ? 0 : s * 0.64, alongX ? s * 0.64 : 0)); // the X braces
    }
    P.push(cyl(5, 5, 6, C.white, 0, 19, 0, 16), cyl(5.06, 5.06, 1.2, C.mustard, 0, 19, 0, 16), cyl(5.05, 4.6, 0.6, C.white, 0, 15.75, 0, 16)); // the tank, its band, its bowl
    P.push(cone(5.4, 3, C.red, 0, 23.5, 0, 16), cyl(0.18, 0.18, 1.0, C.dark, 0, 25.4, 0, 6), blob(0.3, C.white, 0, 26.0, 0)); // roof, finial
    P.push(cyl(5.9, 5.9, 0.12, C.steel, 0, 16.6, 0, 20), cyl(5.9, 5.9, 0.06, C.steel, 0, 17.6, 0, 20)); // the catwalk, its rail
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P.push(box(0.06, 1.0, 0.06, C.steel, Math.cos(a) * 5.9, 17.1, Math.sin(a) * 5.9)); }
    for (const x of [-0.25, 0.25]) P.push(box(0.06, H, 0.06, C.steel, x, H / 2, 3.25));
    for (let i = 0; i < 22; i++) P.push(box(0.5, 0.04, 0.04, C.steel, 0, 0.8 + i * 0.7, 3.25));
    return ao(merge(P), 1, 0, 3, 0.7);
  },
  elevator() {
    const P = [], K = [];
    for (const [x, z] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) P.push(cyl(2.55, 2.55, 22, '#e6e1d4', x, 11, z, 14)); // four concrete bins
    P.push(bev(10.2, 0.8, 10.2, C.stone, 0, 0.4, 0, 0.06), bev(10.6, 0.6, 10.6, C.white, 0, 22.2, 0, 0.06, C.whiteE));
    for (const y of [6, 12, 18]) for (const [x, z] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) K.push(cyl(2.6, 2.6, 0.12, '#cfc8b8', x, y, z, 14)); // pour lines
    P.push(cyl(2.6, 2.6, 2, C.red, -2.6, 20, 2.6, 14), cyl(2.6, 2.6, 2, C.red, 2.6, 20, 2.6, 14)); // the painted band, the side you see
    P.push(bev(6, 7, 6, C.tin, 0, 26, 0, 0.08, C.tinE), prism(7, 2.5, 7, C.roof, 0, 29.5, 0)); // the head house
    for (const s of [1, -1]) win(P, 0, 27, s * 3, 1.2, 1.4, s);
    P.push(bev(14, 9, 8, C.tin, 10, 4.5, 0, 0.1, C.tinE)); for (let i = 0; i < 16; i++) K.push(box(0.1, 8.6, 8.04, C.tinD, 3.6 + i * 0.85, 4.5, 0)); // the drive shed, its corrugations
    P.push(prism(14.6, 1.6, 8.6, C.roof, 10, 9, 0, Z), bev(3.4, 3.6, 0.14, C.dark, 12, 1.8, 4.05, 0.03)); // its roof, the drive-through
    P.push(bev(Math.hypot(9, 16), 0.9, 0.9, C.steel, 9.5, 18.2, -1.5, 0.05, null, 0, 0, -Math.atan2(16, 9))); // the leg up to the head house
    P.push(cyl(0.3, 0.3, 9, C.tinD, 6, 13.5, 3.5, 6, 0, -0.5)); // a spout down to the trucks
    return ao(merge([...P, ...K]), 1, 0, 4, 0.66);
  },
  shop() {
    const P = [], K = [], W = 12, D = 10;
    P.push(bev(W, 6, D, C.brick, 0, 3, 0, 0.08, C.brickE));
    for (let i = 0; i < 9; i++) K.push(box(W + 0.02, 0.04, D + 0.02, '#874d3a', 0, 0.6 + i * 0.62, 0)); // brick courses
    P.push(bev(W + 0.6, 1.4, D + 0.6, C.cream, 0, 6.7, 0, 0.08, C.creamE), bev(W + 0.8, 0.25, D + 0.8, C.cream, 0, 7.45, 0, 0.04)); // the cornice
    for (const x of [-3.6, 3.6]) win(P, x, 2.2, D / 2, 3.2, 2.4, 1); // shop windows
    P.push(bev(1.6, 2.8, 0.12, C.teal, 0, 1.4, D / 2 + 0.05, 0.03, '#5aa0a7'));
    for (const x of [-3.6, 0, 3.6]) win(P, x, 5.0, D / 2, 1.0, 1.1, 1); // the rooms upstairs
    for (let i = 0; i < 10; i++) P.push(box(1.3, 0.12, 2.6, i % 2 ? C.cream : C.mustard, -5.85 + i * 1.3, 3.75, D / 2 + 1.25, 0, 0.42)); // a striped awning, sloping down to the street
    P.push(bev(6, 1.0, 0.14, C.dark, 0, 7.0, D / 2 + 0.38, 0.03), bev(5.6, 0.6, 0.06, C.mustard, 0, 7.0, D / 2 + 0.47, 0.02)); // the sign
    return ao(merge([...P, ...K]), 1, 0, 2.5, 0.68);
  },
  church() {
    const P = [], W = 8, D = 14;
    P.push(bev(W + 0.3, 0.6, D + 0.3, C.stone, 0, 0.3, 0, 0.06), bev(W, 6.5, D, C.white, 0, 3.55, 0, 0.08, C.whiteE));
    P.push(prism(9, 4, 14.4, C.roof, 0, 6.8, -0.2)); for (const s of [1, -1]) P.push(bev(0.16, 0.26, 14.5, C.white, s * 4.5, 6.8, -0.2, 0.03));
    for (let i = 0; i < 4; i++) for (const s of [1, -1]) { const z = -4.8 + i * 2.6; P.push(bev(0.08, 2.6, 1.0, '#3a4a6a', s * (W / 2 + 0.02), 3.7, z, 0.02), bev(0.1, 0.5, 0.5, '#3a4a6a', s * (W / 2 + 0.02), 5.1, z, 0.02, null, Math.PI / 4)); } // tall windows, pointed heads
    P.push(bev(3.4, 9, 3.4, C.white, 0, 4.5, 7.4, 0.06, C.whiteE), bev(3.0, 3.0, 3.0, C.white, 0, 10.5, 7.4, 0.06, C.whiteE)); // the tower stands proud of the nave, the belfry
    for (const [x, z, ry] of [[0, 8.92, 0], [0, 5.88, 0], [1.52, 7.4, Z], [-1.52, 7.4, Z]]) for (let i = 0; i < 4; i++) P.push(box(1.6, 0.12, 0.1, C.dark, x, 9.6 + i * 0.5, z, ry)); // louvres
    P.push(bev(3.5, 0.3, 3.5, C.white, 0, 12.1, 7.4, 0.04), cone(2.5, 7, C.roof, 0, 15.75, 7.4, 4), box(0.12, 1.4, 0.12, C.mustard, 0, 19.9, 7.4), box(0.7, 0.12, 0.12, C.mustard, 0, 20.1, 7.4)); // spire and cross
    P.push(bev(1.8, 2.8, 0.14, C.red, 0, 1.6, 9.15, 0.03, C.redE), bev(2.2, 0.2, 0.2, C.white, 0, 3.1, 9.2, 0.03)); // the doors
    return ao(merge(P), 1, 0, 2.5, 0.68);
  },
  car() {
    const P = [];
    P.push(bev(1.9, 0.7, 4.2, C.teal, 0, 0.8, 0, 0.12, '#5aa0a7'), bev(1.7, 0.66, 2.1, C.cream, 0, 1.48, -0.2, 0.1, C.creamE));
    for (const s of [1, -1]) P.push(bev(0.04, 0.5, 1.8, C.glass, s * 0.86, 1.5, -0.2, 0.01)); P.push(bev(1.5, 0.5, 0.04, C.glass, 0, 1.5, 0.86, 0.01, null, -0.35), bev(1.5, 0.45, 0.04, C.glass, 0, 1.5, -1.26, 0.01, null, 0.3));
    for (const s of [1, -1]) P.push(bev(2.0, 0.22, 0.2, C.tin, 0, 0.55, s * 2.15, 0.05, C.tinE), bev(0.32, 0.18, 0.06, s > 0 ? '#fff1c4' : '#c8362e', 0.62, 0.9, s * 2.11, 0.02), bev(0.32, 0.18, 0.06, s > 0 ? '#fff1c4' : '#c8362e', -0.62, 0.9, s * 2.11, 0.02));
    for (const [x, z] of [[0.92, 1.35], [-0.92, 1.35], [0.92, -1.35], [-0.92, -1.35]]) P.push(cyl(0.42, 0.42, 0.3, C.dark, x, 0.42, z, 10, 0, Z), cyl(0.2, 0.2, 0.32, C.tin, x, 0.42, z, 8, 0, Z));
    return ao(merge(P), 1, 0, 1.1, 0.6);
  },
  // the small things, the same way: a round bale with its net wrap and a spiral face, a fence section with capped posts,
  // a road sign on a post with its frame, a pole with insulators on its crossarm
  bale() {
    const P = [cyl(1.25, 1.25, 1.7, '#d9b45a', 0, 1.25, 0, 10, 0, Z)];
    for (const x of [-0.45, 0.45]) P.push(open(cyl(1.27, 1.27, 0.08, '#c39c45', x, 1.25, 0, 10, 0, Z)));
    for (const s of [1, -1]) P.push(cyl(0.6, 0.6, 0.05, '#cfa851', s * 0.86, 1.25, 0, 8, 0, Z));
    return ao(merge(P), 1, 0, 1.4, 0.7);
  },
  fence() {
    const P = [];
    for (const x of [-2.8, 0, 2.8]) P.push(box(0.3, 1.5, 0.3, C.cream, x, 0.75, 0), box(0.38, 0.1, 0.38, C.white, x, 1.53, 0));
    for (const y of [1.25, 0.7]) P.push(box(6, 0.2, 0.14, C.cream, 0, y, 0.12));
    return ao(merge(P), 1, 0, 0.8, 0.7);
  },
  sign() {
    return ao(merge([bev(0.18, 2.6, 0.18, C.tin, 0, 1.3, 0, 0.03, C.tinE), bev(1.9, 1.3, 0.1, C.dark, 0, 2.6, 0.08, 0.02), bev(1.7, 1.1, 0.06, C.mustard, 0, 2.6, 0.14, 0.02, '#e2b54a'),
      bev(1.2, 0.14, 0.02, C.dark, 0, 2.75, 0.18, 0.005), bev(0.8, 0.14, 0.02, C.dark, 0, 2.45, 0.18, 0.005)]), 1, 0, 1.0, 0.7);
  },
  pole() {
    const P = [cyl(0.22, 0.28, 10, C.trunk, 0, 5, 0, 6), bev(3.2, 0.25, 0.25, C.trunk, 0, 9.2, 0, 0.04), bev(1.2, 0.12, 0.12, C.trunk, 0, 8.6, 0, 0.02, null, 0, 0, 0.6)];
    for (const x of [-1.4, 0, 1.4]) P.push(cyl(0.08, 0.1, 0.36, '#cfd6d4', x, 9.5, 0, 6));
    return ao(merge(P), 1, 0, 2, 0.7);
  },
  // trees: a trunk with a fork in it, a canopy of lobes in three greens, darker underneath; a pine of four tiers
  oak() {
    const P = [open(cyl(0.3, 0.5, 3.4, C.trunk, 0, 1.7, 0, 6)), open(cyl(0.12, 0.2, 2.0, C.trunk, 0.55, 3.6, 0.2, 5, 0.35, -0.55)), open(cyl(0.1, 0.18, 1.8, C.trunk, -0.5, 3.5, -0.3, 5, -0.4, 0.5))];
    P.push(blob(2.3, C.leaf, 0, 4.9, 0, 0.82), blob(1.7, C.leaf3, 1.3, 4.4, 0.7, 0.8), blob(1.6, C.leaf2, -1.2, 5.3, -0.5, 0.85), blob(1.5, C.leaf2, 0.4, 6.2, -0.6, 0.8), octa(1.3, C.leaf3, -0.6, 4.3, 1.2, 0.8));
    return ao(merge(P), 1, 2.6, 6.4, 0.58);
  },
  pine() {
    const P = [open(cyl(0.22, 0.36, 2.2, C.trunk, 0, 1.1, 0, 5))];
    for (const [r, h, y, c] of [[2.4, 2.6, 2.6, C.pine2], [2.0, 2.4, 3.9, C.pine], [1.55, 2.2, 5.1, C.pine2], [1.05, 2.0, 6.3, C.pine]]) P.push(cone(r, h, c, 0, y, 0, 7));
    return ao(merge(P), 1, 1.4, 6.8, 0.6);
  },
  bush() { return ao(merge([octa(1.2, C.leaf2, 0, 0.75, 0, 0.75), octa(0.85, C.leaf3, 0.6, 0.6, 0.4, 0.7), octa(0.8, C.leaf, -0.55, 0.85, -0.3, 0.7)]), 1, 0, 1.4, 0.62); },
};
