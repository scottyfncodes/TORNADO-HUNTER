// Tiny low-poly kit: coloured primitives merged into one flat-shaded geometry per object type.
import * as THREE from '../vendor/three.module.min.js';

const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1);

function paint(geom, color, x, y, z, rx, ry, rz) {
  const g = geom.index ? geom.toNonIndexed() : geom;
  E.set(rx || 0, ry || 0, rz || 0); Q.setFromEuler(E); V.set(x || 0, y || 0, z || 0);
  g.applyMatrix4(M.compose(V, Q, S));
  const c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  g.deleteAttribute('uv');
  return g;
}

export const box = (w, h, d, color, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) => paint(new THREE.BoxGeometry(w, h, d), color, x, y, z, rx, ry, rz);
export const cyl = (rTop, rBot, h, color, x = 0, y = 0, z = 0, seg = 8, rx = 0, rz = 0, ry = 0) => paint(new THREE.CylinderGeometry(rTop, rBot, h, seg, 1), color, x, y, z, rx, ry, rz);
export const cone = (r, h, color, x = 0, y = 0, z = 0, seg = 6) => paint(new THREE.ConeGeometry(r, h, seg, 1), color, x, y, z);
export const blob = (r, color, x = 0, y = 0, z = 0, sy = 1) => { const g = new THREE.IcosahedronGeometry(r, 0); g.scale(1, sy, 1); return paint(g, color, x, y, z); };
export const octa = (r, color, x = 0, y = 0, z = 0, sy = 1) => { const g = new THREE.OctahedronGeometry(r, 0); g.scale(1, sy, 1); return paint(g, color, x, y, z); };
// drop the end caps of a cylinder (nobody sees the underside of a trunk)
export const open = (g) => { const p = g.attributes.position, n = g.attributes.normal, keep = []; for (let i = 0; i < p.count; i += 3) if (Math.abs(n.getY(i)) < 0.9) keep.push(i, i + 1, i + 2); const pick = (a) => { const o = new Float32Array(keep.length * 3); keep.forEach((k, j) => { o[j * 3] = a.getX(k); o[j * 3 + 1] = a.getY(k); o[j * 3 + 2] = a.getZ(k); }); return new THREE.BufferAttribute(o, 3); }; const out = new THREE.BufferGeometry(); out.setAttribute('position', pick(p)); out.setAttribute('normal', pick(n)); out.setAttribute('color', pick(g.attributes.color)); return out; };
export const dome = (r, color, x = 0, y = 0, z = 0) => paint(new THREE.SphereGeometry(r, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), color, x, y, z);

// gabled roof, ridge along z
export function prism(w, h, d, color, x = 0, y = 0, z = 0, ry = 0) {
  const a = w / 2, b = d / 2;
  const p = [
    -a, 0, b, a, 0, b, 0, h, b,  a, 0, -b, -a, 0, -b, 0, h, -b,            // gables
    -a, 0, -b, -a, 0, b, 0, h, b,  -a, 0, -b, 0, h, b, 0, h, -b,           // left slope
    a, 0, b, a, 0, -b, 0, h, -b,  a, 0, b, 0, h, -b, 0, h, b,              // right slope
  ];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(p), 3)); g.computeVertexNormals();
  return paint(g, color, x, y, z, 0, ry, 0);
}

// ---- hero kit (2.17): chamfered boxes whose bevels catch the light in a worn-edge colour, and baked ambient occlusion ----
const _t = new THREE.Vector3(), _u = new THREE.Vector3(), _n = new THREE.Vector3(), _c = new THREE.Vector3();
// a box (w, h, d) with every edge bevelled by `b`: 6 faces, 12 edge strips, 8 corners. `edge` colours the bevels (lighter: wear)
export function bev(w, h, d, color, x = 0, y = 0, z = 0, b = 0.01, edge = null, rx = 0, ry = 0, rz = 0) {
  const H = [w / 2, h / 2, d / 2], I = H.map((v) => Math.max(1e-4, v - b)), tris = [], cols = [], fc = new THREE.Color(color), ec = new THREE.Color(edge || color);
  const pt = (k, s, o) => { const p = [0, 0, 0]; for (let a = 0; a < 3; a++) p[a] = a === k ? s * H[a] : o[a] * I[a]; return p; }; // on face (k, s), at the inner corner signs o
  const tri = (A, B, C, col) => { _t.set(B[0] - A[0], B[1] - A[1], B[2] - A[2]); _u.set(C[0] - A[0], C[1] - A[1], C[2] - A[2]); _n.crossVectors(_t, _u); _c.set(A[0] + B[0] + C[0], A[1] + B[1] + C[1], A[2] + B[2] + C[2]);
    if (_n.dot(_c) < 0) tris.push(...A, ...C, ...B); else tris.push(...A, ...B, ...C); for (let i = 0; i < 3; i++) cols.push(col.r, col.g, col.b); };
  const quad = (A, B, C, D, col) => { tri(A, B, C, col); tri(A, C, D, col); };
  for (let k = 0; k < 3; k++) for (const s of [1, -1]) { // faces
    const u = (k + 1) % 3, v = (k + 2) % 3, o = (a, b2) => { const r = [0, 0, 0]; r[u] = a; r[v] = b2; return r; };
    quad(pt(k, s, o(1, 1)), pt(k, s, o(-1, 1)), pt(k, s, o(-1, -1)), pt(k, s, o(1, -1)), fc);
  }
  for (let k = 0; k < 3; k++) for (let m = k + 1; m < 3; m++) for (const s1 of [1, -1]) for (const s2 of [1, -1]) { // edges between faces (k, s1) and (m, s2)
    const t = 3 - k - m, o1 = (st) => { const r = [0, 0, 0]; r[m] = s2; r[t] = st; return r; }, o2 = (st) => { const r = [0, 0, 0]; r[k] = s1; r[t] = st; return r; };
    quad(pt(k, s1, o1(1)), pt(k, s1, o1(-1)), pt(m, s2, o2(-1)), pt(m, s2, o2(1)), ec);
  }
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) { const o = [sx, sy, sz]; tri(pt(0, sx, o), pt(1, sy, o), pt(2, sz, o), ec); } // corners
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tris), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cols), 3));
  E.set(rx, ry, rz); Q.setFromEuler(E); V.set(x, y, z); g.applyMatrix4(M.compose(V, Q, S)); g.computeVertexNormals(); return g;
}
// baked occlusion on a merged geometry: colours darken toward `lo` along `axis` (0 x, 1 y, 2 z), down to `min` of themselves
export function ao(g, axis, lo, hi, min = 0.6) {
  const p = g.attributes.position, c = g.attributes.color;
  for (let i = 0; i < p.count; i++) { const t = Math.max(0, Math.min(1, (p.getComponent(i, axis) - lo) / (hi - lo))), k = min + (1 - min) * t * t * (3 - 2 * t); c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k); }
  c.needsUpdate = true; return g;
}

export function merge(parts) {
  let n = 0; for (const p of parts) n += p.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const p of parts) {
    if (!p.attributes.normal) p.computeVertexNormals();
    pos.set(p.attributes.position.array, o); nor.set(p.attributes.normal.array, o); col.set(p.attributes.color.array, o);
    o += p.attributes.position.count * 3; p.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeBoundingSphere();
  return g;
}

// one cow, used on the ground, in the air and round the funnel
export function cowGeo() {
  const W = '#f1eee2', K = '#22292a', P = '#e8a0a8';
  return merge([box(1.2, 1.1, 2.4, W, 0, 1.4, 0), box(1.22, 0.6, 0.9, K, 0, 1.55, 0.45), box(0.7, 0.5, 0.7, K, 0.27, 1.25, -0.7), box(0.72, 0.72, 0.85, W, 0, 1.85, 1.5), box(0.5, 0.36, 0.3, P, 0, 1.65, 2.0), box(0.16, 0.3, 0.16, K, 0.4, 2.3, 1.35), box(0.16, 0.3, 0.16, K, -0.4, 2.3, 1.35), box(0.5, 0.3, 0.5, P, 0, 0.75, -0.5),
    box(0.26, 0.95, 0.26, W, 0.42, 0.47, 0.85), box(0.26, 0.95, 0.26, W, -0.42, 0.47, 0.85), box(0.26, 0.95, 0.26, W, 0.42, 0.47, -0.85), box(0.26, 0.95, 0.26, W, -0.42, 0.47, -0.85), box(0.12, 0.9, 0.12, K, 0, 1.5, -1.3, 0, 0.5)]);
}

// tileable value noise on a canvas (the one texture every weather shader samples)
export function noiseTexture(size = 128, seed = 7) {
  let s = seed >>> 0; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(size, size), acc = new Float32Array(size * size);
  let amp = 1, total = 0;
  for (const cells of [4, 8, 16, 32]) {
    const lat = new Float32Array(cells * cells); for (let i = 0; i < lat.length; i++) lat[i] = rnd();
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const fx = x / size * cells, fy = y / size * cells, x0 = Math.floor(fx), y0 = Math.floor(fy);
      let tx = fx - x0, ty = fy - y0; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      const x1 = (x0 + 1) % cells, y1 = (y0 + 1) % cells;
      const a = lat[y0 * cells + x0], b = lat[y0 * cells + x1], c = lat[y1 * cells + x0], d = lat[y1 * cells + x1];
      acc[y * size + x] += amp * (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty);
    }
    total += amp; amp *= 0.5;
  }
  for (let i = 0; i < acc.length; i++) { const v = Math.max(0, Math.min(255, (acc[i] / total - 0.5) * 1.9 * 255 + 128)); img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

export function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
