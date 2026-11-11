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
