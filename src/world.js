// The plains: terrain mesh, one baked ground texture (fields, roads, towns), instanced props the storm can eat.
import * as THREE from '../vendor/three.module.min.js';
import { WORLD } from './config.js';
import { box, cyl, cone, blob, octa, open, dome, prism, merge, rng, cowGeo } from './geo.js';

const HALF = WORLD.size / 2, N = 129, CELL = WORLD.size / (N - 1);
const HW0 = { x: -HALF, z: -1180 }, HW1 = { x: HALF, z: 1020 };
const HWL = Math.hypot(HW1.x - HW0.x, HW1.z - HW0.z), HWD = { x: (HW1.x - HW0.x) / HWL, z: (HW1.z - HW0.z) / HWL };

export const TOWNS = {
  pete: { name: 'Hadley', x: -256, z: -256, from: [0.72, 0.69] },
  agnes: { name: 'Coldwater', x: 256, z: -768, from: [-0.45, 0.89] },
  sisters: { name: 'Marrow Creek', x: -768, z: 256, from: [0.93, -0.37] },
};

const hash2 = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const gridDist = (v) => { const m = (((v - WORLD.roadOffset) % WORLD.roadSpacing) + WORLD.roadSpacing) % WORLD.roadSpacing; return Math.min(m, WORLD.roadSpacing - m); };
const hwDist = (x, z) => Math.abs((x - HW0.x) * HWD.z - (z - HW0.z) * HWD.x);

async function loadImageData(url) {
  const img = new Image(); img.src = url; await img.decode();
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  return x.getImageData(0, 0, c.width, c.height);
}
async function loadGLB(url) {
  const buf = await (await fetch(url)).arrayBuffer(), dv = new DataView(buf);
  const jsonLen = dv.getUint32(12, true), json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen)));
  const bin = 20 + jsonLen + 8, prim = json.meshes[0].primitives[0];
  const view = (i, Type, n) => { const a = json.accessors[i], bv = json.bufferViews[a.bufferView]; return new Type(buf.slice(bin + (bv.byteOffset || 0), bin + (bv.byteOffset || 0) + a.count * n * Type.BYTES_PER_ELEMENT)); };
  return { position: view(prim.attributes.POSITION, Float32Array, 3), uv: view(prim.attributes.TEXCOORD_0, Float32Array, 2), index: view(prim.indices, json.accessors[prim.indices].componentType === 5125 ? Uint32Array : Uint16Array, 1) };
}

// ---- object kit: one chunky silhouette each -------------------------------------------------
const C = { red: '#a3352b', roof: '#33393b', cream: '#e9dfc4', white: '#f1eee2', tin: '#aab3b4', wood: '#7a5a3a', dark: '#2a2f30', wheat: '#d9b45a', leaf: '#5f8f3c', leaf2: '#7aa846', pine: '#417548', trunk: '#5a4330', brick: '#9a5a44', teal: '#3f7f86', mustard: '#c99a2e', hide: '#f1eee2' };
const KIT = {
  barn: { r: 9, solid: 1, g: () => merge([box(12, 6, 16, C.red, 0, 3, 0), prism(13.5, 5, 17, C.roof, 0, 6, 0), box(4, 4.4, 0.4, C.white, 0, 2.2, 8.1), box(1.6, 1.6, 0.4, C.white, 0, 7.6, 8.4)]) },
  silo: { r: 3.6, solid: 1, g: () => merge([cyl(3, 3, 14, C.tin, 0, 7, 0, 10), dome(3.1, C.white, 0, 14, 0)]) },
  house: { r: 6.5, solid: 1, g: () => merge([box(9, 5, 8, C.cream, 0, 2.5, 0), prism(10, 3.4, 9, C.brick, 0, 5, 0), box(1.4, 3, 1.4, C.brick, 2.4, 6.6, 1.5), box(1.6, 2.6, 0.3, C.teal, 0, 1.3, 4.1)]) },
  windmill: { r: 1.4, solid: 1, g: () => merge([cyl(0.25, 1.2, 12, C.dark, 0, 6, 0, 4), cyl(2.6, 2.6, 0.25, C.tin, 0, 12.2, 0.7, 10, Math.PI / 2), box(0.2, 1.6, 3, C.red, 0, 12.2, -1.6)]) },
  tower: { r: 4.5, solid: 1, g: () => merge([cyl(0.3, 0.5, 16, C.dark, 3, 8, 3, 4), cyl(0.3, 0.5, 16, C.dark, -3, 8, 3, 4), cyl(0.3, 0.5, 16, C.dark, 3, 8, -3, 4), cyl(0.3, 0.5, 16, C.dark, -3, 8, -3, 4), cyl(5, 5, 6, C.white, 0, 19, 0, 10), cone(5.4, 3, C.red, 0, 23.5, 0, 10), cyl(5.1, 5.1, 1.2, C.mustard, 0, 19, 0, 10)]) },
  elevator: { r: 8, solid: 1, g: () => merge([box(10, 24, 10, C.white, 0, 12, 0), box(6, 7, 6, C.tin, 0, 27.5, 0), prism(7, 2.5, 7, C.roof, 0, 31, 0), box(14, 9, 8, C.tin, 10, 4.5, 0), box(10.2, 2, 10.2, C.red, 0, 20, 0)]) },
  shop: { r: 7.5, solid: 1, g: () => merge([box(12, 6, 10, C.brick, 0, 3, 0), box(12.6, 1.4, 10.6, C.cream, 0, 6.7, 0), box(8, 2.6, 0.4, C.teal, 0, 1.6, 5.1), box(13, 0.5, 2.5, C.mustard, 0, 3.6, 6)]) },
  church: { r: 6.5, solid: 1, g: () => merge([box(8, 7, 14, C.white, 0, 3.5, 0), prism(9, 4, 15, C.roof, 0, 7, 0), box(3.4, 14, 3.4, C.white, 0, 7, 6), cone(2.8, 7, C.roof, 0, 17.5, 6, 4)]) },
  pole: { r: 0.5, solid: 1, g: () => merge([cyl(0.22, 0.28, 10, C.trunk, 0, 5, 0, 5), box(3.2, 0.25, 0.25, C.trunk, 0, 9.2, 0)]) },
  fence: { r: 2.6, soft: 1, drag: 0.94, g: () => merge([box(0.3, 1.5, 0.3, C.cream, -2.8, 0.75, 0), box(0.3, 1.5, 0.3, C.cream, 0, 0.75, 0), box(0.3, 1.5, 0.3, C.cream, 2.8, 0.75, 0), box(6, 0.2, 0.14, C.cream, 0, 1.25, 0), box(6, 0.2, 0.14, C.cream, 0, 0.7, 0)]) },
  bale: { r: 1.5, soft: 1, drag: 0.86, g: () => merge([cyl(1.25, 1.25, 1.7, C.wheat, 0, 1.25, 0, 10, 0, Math.PI / 2)]) },
  cow: { r: 1.4, soft: 1, drag: 0.9, g: () => cowGeo() },
  sign: { r: 1.2, soft: 1, drag: 0.96, g: () => merge([box(0.2, 2.6, 0.2, C.tin, 0, 1.3, 0), box(1.8, 1.2, 0.12, C.mustard, 0, 2.6, 0)]) },
  car: { r: 2.3, soft: 1, drag: 0.7, g: () => merge([box(1.9, 0.8, 4.2, C.teal, 0, 0.8, 0), box(1.7, 0.7, 2.1, C.cream, 0, 1.5, -0.2)]) },
  oak: { r: 1.0, tree: 1, veg: 1, g: () => merge([open(cyl(0.35, 0.5, 3.2, C.trunk, 0, 1.6, 0, 4)), blob(2.6, C.leaf, 0, 4.6, 0, 0.85), octa(1.8, C.leaf2, 1.2, 5.6, 0.6)]) },
  pine: { r: 0.8, tree: 1, veg: 1, g: () => merge([open(cyl(0.25, 0.35, 2, C.trunk, 0, 1, 0, 4)), cone(2.2, 4, C.pine, 0, 3.6, 0, 5), cone(1.5, 3.2, C.pine, 0, 5.8, 0, 5)]) },
  bush: { r: 1.0, soft: 1, drag: 0.985, veg: 1, g: () => merge([octa(1.3, C.leaf2, 0, 0.8, 0, 0.75)]) },
  tuft: { deco: 1, veg: 1, range: 300, g: () => merge([cone(0.3, 1.3, C.wheat, 0, 0.65, 0, 3), cone(0.24, 1.0, '#e2c06a', 0.35, 0.5, 0.2, 3)]) },
};

const FLY_MAX = 64;
const dummy = new THREE.Object3D(), tmp = new THREE.Vector3();

export class World {
  constructor(scene, env) {
    this.scene = scene; this.env = env; this.group = new THREE.Group(); scene.add(this.group);
    this.heights = new Float32Array(N * N); this.events = []; this.flying = []; this.ripples = [];
  }

  async load(progress = () => {}) {
    const A = 'assets/models/';
    const names = ['terrain_height16.png', 'terrain_normal.png', 'terrain_splat.png', 'terrain_biomes.png', 'terrain_water.png', 'terrain_cliff.png', 'terrain_beach.png', 'terrain_forest.png', 'terrain_moisture.png', 'terrain_slope.png'];
    const [glb, scatter, coast, ...imgs] = await Promise.all([
      loadGLB(A + 'terrain.glb'),
      fetch(A + 'terrain_scatter.json').then((r) => r.json()),
      fetch(A + 'terrain_coastline.json').then((r) => r.json()),
      ...names.map((n) => loadImageData(A + n)),
    ]);
    progress(0.35);
    const masks = {}; names.forEach((n, i) => { masks[n.replace('terrain_', '').replace('.png', '')] = imgs[i]; });
    // heights + mesh
    const pos = glb.position;
    for (let i = 0; i < N * N; i++) { pos[i * 3] *= WORLD.scale; pos[i * 3 + 2] *= WORLD.scale; pos[i * 3 + 1] *= WORLD.yScale; this.heights[i] = pos[i * 3 + 1]; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(glb.uv, 2)); g.setIndex(new THREE.BufferAttribute(glb.index, 1));
    g.computeBoundingSphere();
    this.layout(scatter);
    const canvas = this.bake(masks, coast);
    progress(0.7);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; map.flipY = false;
    const u = this.env.uniforms;
    const shared = { uNoise: u.uNoise, uTint: u.uTint, uFog: u.uFog, uFogNear: u.uFogNear, uFogFar: u.uFogFar, uFlash: u.uFlash, uTor: u.uTor };
    const lit = `c*=uTint*(1.0+uFlash); float td=distance(vW.xz,uTor.xy); c*=mix(0.5,1.0,smoothstep(uTor.z*0.5,uTor.z*2.8,td));
          float f=smoothstep(uFogNear,uFogFar,distance(vW,cameraPosition)); c=mix(c,uFog,f); gl_FragColor=vec4(c,1.0);
          #include <colorspace_fragment>`;
    const head = `uniform sampler2D uNoise; uniform vec3 uTint,uFog,uTor; uniform float uFogNear,uFogFar,uFlash; varying vec3 vW;`;
    this.ground = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: { uMap: { value: map }, ...shared },
      vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `${head} uniform sampler2D uMap; varying vec2 vUv;
        void main(){ vec3 c=texture2D(uMap,vUv).rgb; float d=texture2D(uNoise,vW.xz*0.045).r; float d2=texture2D(uNoise,vW.xz*0.006).r; float d3=texture2D(uNoise,vW.xz*0.31).r;
          c*=0.8+0.2*d+0.12*d2+0.16*d3; ${lit} }`,
    }));
    if (this.env.low) { // weak GPU: one texture read a pixel instead of four
      this.ground.material.fragmentShader = `${head} uniform sampler2D uMap; varying vec2 vUv; void main(){ vec3 c=texture2D(uMap,vUv).rgb*1.04; ${lit} }`;
    }
    // roads as their own draped strips: the ground texture is 1.5 m a texel, a road edge has to be sharper than that
    const rp = [], rc = [], ri = [], col = (h) => { const k = new THREE.Color(h); return [k.r, k.g, k.b]; };
    const strip = (x0, z0, x1, z1, half, mid, edge, lift) => {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(len / (this.env.low ? 48 : 20)), dx = (x1 - x0) / len, dz = (z1 - z0) / len, px = -dz, pz = dx, cm = col(mid), ce = col(edge), base = rp.length / 3;
      for (let i = 0; i <= n; i++) { const t = i / n * len, cx = x0 + dx * t, cz = z0 + dz * t; for (const [o, cc] of [[-half, ce], [-half * 0.72, cm], [half * 0.72, cm], [half, ce]]) { const x = cx + px * o, z = cz + pz * o; rp.push(x, this.heightAt(x, z) + lift, z); rc.push(cc[0], cc[1], cc[2]); } }
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { const a = base + i * 4 + k; ri.push(a, a + 4, a + 1, a + 1, a + 4, a + 5); }
    };
    for (let v = WORLD.roadOffset - WORLD.roadSpacing * 3; v < HALF; v += WORLD.roadSpacing) { strip(v, -HALF, v, HALF, WORLD.roadHalf, '#d2c29a', '#a8946a', 0.16); strip(-HALF, v, HALF, v, WORLD.roadHalf, '#d2c29a', '#a8946a', 0.17); }
    strip(HW0.x, HW0.z, HW1.x, HW1.z, WORLD.highwayHalf, '#474d4e', '#3a3f40', 0.22);
    for (const t of Object.values(TOWNS)) strip(t.x - 125, t.z, t.x + 125, t.z, 8, '#50575a', '#454b4d', 0.24);
    for (let sd = 10; sd < HWL - 10; sd += 22) { const x = HW0.x + HWD.x * sd, z = HW0.z + HWD.z * sd; strip(x, z, x + HWD.x * 10, z + HWD.z * 10, 0.4, '#e8b93a', '#e8b93a', 0.3); }
    const rgeo = new THREE.BufferGeometry(); rgeo.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rgeo.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3)); rgeo.setIndex(ri);
    this.roads = new THREE.Mesh(rgeo, new THREE.ShaderMaterial({
      uniforms: shared, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: `varying vec3 vC; varying vec3 vW; void main(){ vC=color; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: this.env.low ? `${head} varying vec3 vC; void main(){ vec3 c=vC; ${lit} }` : `${head} varying vec3 vC; void main(){ vec3 c=vC*(0.86+0.28*texture2D(uNoise,vW.xz*0.33).r); ${lit} }`,
    }));
    this.roads.frustumCulled = false; this.group.add(this.roads);
    this.ground.frustumCulled = false; this.group.add(this.ground);
    // a skirt so the edge of the world is never a hole
    const skirt = new THREE.Mesh(new THREE.PlaneGeometry(14000, 14000), new THREE.MeshBasicMaterial({ color: '#8a7a45' }));
    skirt.rotation.x = -Math.PI / 2; skirt.position.y = -2; this.group.add(skirt); this.skirt = skirt;
    this.buildProps();
    progress(1);
    return this;
  }

  heightAt(x, z) {
    const fx = Math.max(0, Math.min(N - 1.001, (x + HALF) / CELL)), fz = Math.max(0, Math.min(N - 1.001, (z + HALF) / CELL));
    const ix = fx | 0, iz = fz | 0, tx = fx - ix, tz = fz - iz, h = this.heights, i = iz * N + ix;
    return (h[i] * (1 - tx) + h[i + 1] * tx) * (1 - tz) + (h[i + N] * (1 - tx) + h[i + N + 1] * tx) * tz;
  }
  normalAt(x, z, out) { const e = 6; out.set(this.heightAt(x - e, z) - this.heightAt(x + e, z), 2 * e, this.heightAt(x, z - e) - this.heightAt(x, z + e)).normalize(); return out; }
  // 0 field, 1 gravel, 2 highway
  surfaceAt(x, z) { if (hwDist(x, z) < WORLD.highwayHalf) return 2; if (gridDist(x) < WORLD.roadHalf || gridDist(z) < WORLD.roadHalf) return 1; for (const k in TOWNS) { const t = TOWNS[k]; if (Math.abs(x - t.x) < 120 && Math.abs(z - t.z) < 70) return 1; } return 0; }
  nearestRoadLine(v) { return Math.round((v - WORLD.roadOffset) / WORLD.roadSpacing) * WORLD.roadSpacing + WORLD.roadOffset; }

  // ---- where things go (deterministic) ----
  layout(scatter) {
    const R = rng(20261111), P = []; this.placements = P; this.farms = [];
    const put = (type, x, z, rot = 0, scale = 1) => { if (Math.abs(x) < HALF - 20 && Math.abs(z) < HALF - 20) P.push({ type, x, z, rot, scale }); };
    const towns = Object.values(TOWNS), nearTown = (x, z, d) => towns.some((t) => Math.hypot(x - t.x, z - t.z) < d);
    for (const t of towns) {
      for (let i = -4; i <= 4; i++) { if (i === 0) continue; put('shop', t.x + i * 24, t.z + 19, 0); put(i % 2 ? 'shop' : 'house', t.x + i * 24, t.z - 19, Math.PI); }
      put('tower', t.x + 78, t.z + 58); put('elevator', t.x - 92, t.z - 56); put('church', t.x + 46, t.z - 62, Math.PI);
      for (let i = 0; i < 12; i++) { const a = R() * 6.283, d = 70 + R() * 55, x = t.x + Math.cos(a) * d * 1.3, z = t.z + Math.sin(a) * d; if (gridDist(x) > 12 && gridDist(z) > 12 && hwDist(x, z) > 16) put('house', x, z, Math.floor(R() * 4) * 1.5708); }
      for (let i = 0; i < 6; i++) put('car', t.x - 90 + i * 34 + R() * 6, t.z + (i % 2 ? 9.5 : -9.5), Math.PI / 2 + (R() - 0.5) * 0.2);
      put('sign', t.x - 135, t.z + 10, Math.PI / 2); put('sign', t.x + 135, t.z - 10, -Math.PI / 2);
    }
    let tries = 0;
    while (this.farms.length < 16 && tries++ < 300) {
      const cx = this.nearestRoadLine((R() - 0.5) * (WORLD.size - 700)), cz = this.nearestRoadLine((R() - 0.5) * (WORLD.size - 700));
      const x = cx + (R() < 0.5 ? -1 : 1) * (70 + R() * 90), z = cz + (R() < 0.5 ? -1 : 1) * (60 + R() * 90);
      if (nearTown(x, z, 330) || hwDist(x, z) < 60 || this.farms.some((f) => Math.hypot(f.x - x, f.z - z) < 260)) continue;
      const rot = Math.floor(R() * 4) * 1.5708; this.farms.push({ x, z });
      put('barn', x, z, rot); put('silo', x + 15, z + 6); if (R() < 0.6) put('silo', x + 15, z - 3, 0, 0.8);
      put('house', x - 22, z + 16, rot + 1.5708); put('windmill', x - 8, z - 24, R() * 6.28);
      for (let i = 0; i < 6; i++) put('bale', x + 24 + (i % 3) * 3.2, z - 18 - Math.floor(i / 3) * 3.4, R() * 0.4);
      for (let i = 0; i < 11; i++) { const a = R() * 6.283, d = 42 + R() * 60; put('cow', x + Math.cos(a) * d, z + Math.sin(a) * d, R() * 6.28); }
      const fz = this.nearestRoadLine(z), side = z > fz ? 1 : -1;
      for (let i = -7; i <= 7; i++) if (Math.abs(i) > 1) put('fence', x + i * 6, fz + side * 10.5, 0);
      put('sign', x + 6, fz + side * 9, 0);
    }
    for (let s = 40; s < HWL - 40; s += 70) { const x = HW0.x + HWD.x * s - HWD.z * 14, z = HW0.z + HWD.z * s + HWD.x * 14; if (gridDist(x) > 10 && gridDist(z) > 10 && !nearTown(x, z, 60)) put('pole', x, z, Math.atan2(HWD.x, HWD.z)); }
    for (let i = 0; i < 46; i++) { const x = (R() - 0.5) * (WORLD.size - 200), z = (R() - 0.5) * (WORLD.size - 200); if (this.clear(x, z, 30) && !nearTown(x, z, 170)) for (let k = 0, n = 3 + Math.floor(R() * 3); k < n; k++) put('bale', x + (R() - 0.5) * 30, z + (R() - 0.5) * 30, R() * 3.14); }
    // herds out in the open: the plains are full of cattle, and the storm knows it
    for (let i = 0; i < 26; i++) { const x = (R() - 0.5) * (WORLD.size - 300), z = (R() - 0.5) * (WORLD.size - 300); if (this.clear(x, z, 24) && !nearTown(x, z, 170)) for (let k = 0, n = 6 + Math.floor(R() * 6); k < n; k++) put('cow', x + (R() - 0.5) * 46, z + (R() - 0.5) * 46, R() * 6.28, 0.9 + R() * 0.25); }
    let i = 0;
    for (const v of scatter.vegetation) {
      i++; const sp = v.species, x = v.position[0] * WORLD.scale, z = v.position[2] * WORLD.scale;
      let type = null;
      if (sp === 'oak' && i % 3 === 0) type = 'oak'; else if (sp === 'pine' && i % 2 === 0) type = 'pine'; else if ((sp === 'bush' || sp === 'dry_bush') && i % 4 === 0) type = 'bush'; else if (sp === 'grass_tuft' && i % 2 === 0) type = 'tuft';
      if (!type || !this.clear(x, z, type === 'tuft' ? 8 : 14) || nearTown(x, z, 165) || this.farms.some((f) => Math.hypot(f.x - x, f.z - z) < 50)) continue;
      put(type, x, z, (v.rotation_y || 0) * 0.01745, 0.8 + (v.scale || 1) * 0.35);
    }
  }
  clear(x, z, d) { return gridDist(x) > d && gridDist(z) > d && hwDist(x, z) > d + 4; }

  // ---- one ground texture: fields from the terrain masks, then roads and yards drawn on top ----
  bake(m, coast) {
    const S = 1024, base = document.createElement('canvas'); base.width = base.height = S;
    const bx = base.getContext('2d'), img = bx.createImageData(S, S), d = img.data;
    const CROPS = [[214, 174, 70, 1.0, 12], [228, 190, 92, 0.9, 10], [205, 163, 62, 1.1, 14], [196, 176, 118, 1.3, 8], [112, 150, 66, 0, 0], [146, 176, 74, 0.8, 14], [126, 88, 56, 1.2, 16], [236, 200, 104, 1.0, 9], [128, 160, 72, 0, 0], [221, 182, 80, 1.0, 12]];
    const M = 257, at = (im, ix, iz, c = 0) => im.data[(iz * M + ix) * 4 + c];
    const H = this.heights, q = 256;
    for (let py = 0; py < S; py++) {
      const wz = (py + 0.5) / S * WORLD.size - HALF, iz = Math.min(M - 1, (py / S * (M - 1)) | 0), hz = Math.min(N - 2, Math.max(1, (py / S * (N - 1)) | 0));
      for (let px = 0; px < S; px++) {
        const wx = (px + 0.5) / S * WORLD.size - HALF, ix = Math.min(M - 1, (px / S * (M - 1)) | 0), hx = Math.min(N - 2, Math.max(1, (px / S * (N - 1)) | 0));
        const cx = Math.floor((wx + HALF) / q), cz = Math.floor((wz + HALF) / q);
        let h = hash2(cx, cz), sub = 0;
        if (h < 0.5) { const along = hash2(cx + 91, cz + 17) < 0.5, f = along ? ((wx + HALF) / q) % 1 : ((wz + HALF) / q) % 1; sub = f < 0.5 ? 1 : 2; h = hash2(cx * 3 + sub, cz * 7 + sub * 5); }
        const crop = CROPS[(h * CROPS.length) | 0], dir = hash2(cx + 5 + sub, cz + 9) < 0.5;
        const row = crop[4] * Math.sin((dir ? wx : wz) * crop[3]);
        let r = crop[0] + row, g = crop[1] + row, b = crop[2] + row * 0.6;
        const ex = ((wx + HALF) % q), ez = ((wz + HALF) % q); if (ex < 4 || ez < 4) { r *= 0.72; g *= 0.78; b *= 0.72; } // field tracks
        const moist = (at(m.moisture, ix, iz) / 255 - 0.5) * 0.3; r *= 1 - moist * 0.5; b *= 1 - moist * 0.4;
        const forest = at(m.forest, ix, iz) / 255 * 0.3; r += (84 - r) * forest; g += (112 - g) * forest; b += (58 - b) * forest;
        const dirt = at(m.splat, ix, iz, 0) / 255 * 0.7; r += (128 - r) * dirt; g += (100 - g) * dirt; b += (70 - b) * dirt;
        const bio = 0.07; r += (at(m.biomes, ix, iz, 0) - r) * bio; g += (at(m.biomes, ix, iz, 1) - g) * bio; b += (at(m.biomes, ix, iz, 2) - b) * bio;
        const cliff = at(m.cliff, ix, iz) / 255; r += (120 - r) * cliff; g += (118 - g) * cliff; b += (112 - b) * cliff;
        const beach = at(m.beach, ix, iz) / 255 * 0.5; r += (214 - r) * beach; g += (196 - g) * beach; b += (150 - b) * beach;
        const water = at(m.water, ix, iz) / 255; r += (70 - r) * water; g += (104 - g) * water; b += (110 - b) * water;
        // light: hillshade from the height grid, micro-relief from the normal map, altitude from the heightmap
        const hi = hz * N + hx, shade = 1 + ((H[hi - 1] - H[hi + 1]) * 0.75 + (H[hi - N] - H[hi + N]) * 0.25) * 0.06;
        const micro = 0.94 + at(m.normal, ix, iz, 2) / 255 * 0.08, alt = 0.93 + at(m.height16, ix, iz) / 255 * 0.12, slope = 1 - at(m.slope, ix, iz) / 255 * 0.3;
        const l = Math.max(0.6, Math.min(1.35, shade)) * micro * alt * slope, o = (py * S + px) * 4;
        d[o] = r * l; d[o + 1] = g * l; d[o + 2] = b * l; d[o + 3] = 255;
      }
    }
    bx.putImageData(img, 0, 0);
    const T = 2048, cv = document.createElement('canvas'); cv.width = cv.height = T;
    const c = cv.getContext('2d'); c.imageSmoothingQuality = 'high'; c.drawImage(base, 0, 0, T, T);
    const k = T / WORLD.size, X = (w) => (w + HALF) * k;
    c.lineCap = 'butt';
    for (const f of this.farms) { c.fillStyle = 'rgba(140,112,78,0.85)'; c.beginPath(); c.ellipse(X(f.x), X(f.z), 44 * k, 36 * k, 0, 0, 6.283); c.fill(); }
    for (const t of Object.values(TOWNS)) { c.fillStyle = 'rgba(150,140,118,0.9)'; c.fillRect(X(t.x - 125), X(t.z - 75), 250 * k, 150 * k); c.fillStyle = 'rgba(108,128,70,0.8)'; c.fillRect(X(t.x + 20), X(t.z - 72), 50 * k, 26 * k); }
    const line = (x0, z0, x1, z1, w, style, dash) => { c.strokeStyle = style; c.lineWidth = w * k; c.setLineDash(dash || []); c.beginPath(); c.moveTo(X(x0), X(z0)); c.lineTo(X(x1), X(z1)); c.stroke(); };
    for (let v = WORLD.roadOffset - WORLD.roadSpacing * 3; v < HALF; v += WORLD.roadSpacing) { line(v, -HALF, v, HALF, 17, 'rgba(120,104,70,0.55)'); line(-HALF, v, HALF, v, 17, 'rgba(120,104,70,0.55)'); }
    for (let v = WORLD.roadOffset - WORLD.roadSpacing * 3; v < HALF; v += WORLD.roadSpacing) { line(v, -HALF, v, HALF, 12, '#cdbd96'); line(-HALF, v, HALF, v, 12, '#cdbd96'); line(v - 2.2, -HALF, v - 2.2, HALF, 1.6, 'rgba(160,140,100,0.6)'); line(-HALF, v + 2.2, HALF, v + 2.2, 1.6, 'rgba(160,140,100,0.6)'); }
    line(HW0.x, HW0.z, HW1.x, HW1.z, 24, 'rgba(120,104,70,0.6)'); line(HW0.x, HW0.z, HW1.x, HW1.z, 17, '#43494a'); line(HW0.x, HW0.z, HW1.x, HW1.z, 1.6, '#e8b93a', [9 * k, 9 * k]);
    for (const t of Object.values(TOWNS)) line(t.x - 125, t.z, t.x + 125, t.z, 14, '#50575a');
    c.setLineDash([]);
    for (const pl of coast.polylines || []) { c.strokeStyle = '#d6c496'; c.lineWidth = 4; c.beginPath(); pl.forEach((p, i) => (i ? c.lineTo(X(p[0] * WORLD.scale), X(p[1] * WORLD.scale)) : c.moveTo(X(p[0] * WORLD.scale), X(p[1] * WORLD.scale)))); c.stroke(); }
    const mapC = document.createElement('canvas'); mapC.width = mapC.height = 384; mapC.getContext('2d').drawImage(cv, 0, 0, 384, 384); this.mapCanvas = mapC;
    return cv;
  }

  buildProps() {
    const CH = 512, groups = new Map(), geos = {};
    for (const p of this.placements) { const k = p.type + '|' + Math.floor(p.x / CH) + '|' + Math.floor(p.z / CH); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    // things right in front of the lens dissolve instead of filling the screen
    mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      float camD = length(vViewPosition); if (camD < 11.0 && fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) > camD / 11.0 - 0.12) discard;`); };
    this.chunks = []; this.props = []; this.grid = new Map(); this.gcell = 96;
    for (const [key, list] of groups) {
      const [type, cx, cz] = key.split('|'), kit = KIT[type], mesh = new THREE.InstancedMesh(geos[type] || (geos[type] = kit.g()), mat, list.length);
      this.group.add(mesh); this.chunks.push({ mesh, x: (+cx + 0.5) * CH, z: (+cz + 0.5) * CH, range: kit.veg ? kit.range || 1250 : 0 });
      list.forEach((p, i) => {
        const y = this.heightAt(p.x, p.z), rec = { type, kit, mesh, i, x: p.x, y, z: p.z, rot: p.rot, scale: p.scale, bx: p.x, by: y, bz: p.z, state: 0, r: (kit.r || 0) * p.scale };
        this.place(rec); if (kit.deco) return;
        this.props.push(rec);
        const gk = Math.floor(p.x / this.gcell) + ',' + Math.floor(p.z / this.gcell);
        if (!this.grid.has(gk)) this.grid.set(gk, []); this.grid.get(gk).push(rec);
      });
      mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 12;
    }
  }
  // distance culling for vegetation (frustum culling does the rest); detail 0..1 shortens the range on weak GPUs
  cull(camera, detail = 1) { const cx = camera.position.x, cz = camera.position.z; for (const c of this.chunks) if (c.range) c.mesh.visible = Math.hypot(c.x - cx, c.z - cz) < c.range * detail + (detail < 1 ? 280 : 360); }
  place(p, rx = 0, rz = 0, s = p.scale) { dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(rx, p.rot, rz); dummy.scale.setScalar(s); dummy.updateMatrix(); p.mesh.setMatrixAt(p.i, dummy.matrix); p.mesh.instanceMatrix.needsUpdate = true; }
  reset() { for (const p of this.props) if (p.state !== 0) { p.state = 0; p.x = p.bx; p.y = p.by; p.z = p.bz; this.place(p); p.mesh.frustumCulled = true; } this.flying.length = 0; this.events.length = 0; }

  near(x, z, radius, fn) {
    const g = this.gcell, x0 = Math.floor((x - radius) / g), x1 = Math.floor((x + radius) / g), z0 = Math.floor((z - radius) / g), z1 = Math.floor((z + radius) / g);
    for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) { const list = this.grid.get(cx + ',' + cz); if (list) for (let i = 0; i < list.length; i++) fn(list[i]); }
  }
  launch(p, vx, vy, vz) { if (p.state === 0) this.flying.push(p); p.mesh.frustumCulled = false; p.state = 3; p.vx = vx; p.vy = vy; p.vz = vz; p.tx = Math.random() * 6; p.tz = Math.random() * 6; p.spin = 2 + Math.random() * 5; }

  // the storm eats whatever its base passes over
  feed(storm) {
    const R = storm.eatRadius;
    this.near(storm.x, storm.z, R + 10, (p) => {
      if (p.state !== 0) return; const dx = p.x - storm.x, dz = p.z - storm.z, d2 = dx * dx + dz * dz; if (d2 > (R + p.r) * (R + p.r)) return;
      this.events.push({ kind: 'rip', x: p.x, y: p.y, z: p.z, big: !!p.kit.solid && p.r > 3, cow: p.type === 'cow' });
      if (this.flying.length >= FLY_MAX + (p.type === 'cow' ? 24 : 0)) { p.state = 2; this.place(p, 0, 0, 0); return; }
      p.state = 1; p.mesh.frustumCulled = false; p.ang = Math.atan2(dz, dx); p.rad = Math.sqrt(d2); p.h = 0; p.life = 0; p.climb = 14 + Math.random() * 22; p.tx = 0; p.tz = 0; p.spin = 1 + Math.random() * 3; p.storm = storm; this.flying.push(p);
    });
  }

  // rig against props: soft things fly, trees snap at speed, buildings stop you
  collideRig(rig) {
    const out = [];
    this.near(rig.x, rig.z, 14, (p) => {
      if (p.state !== 0) return; const dx = rig.x - p.x, dz = rig.z - p.z, rr = p.r + 1.5, d2 = dx * dx + dz * dz; if (d2 > rr * rr) return;
      const sp = Math.hypot(rig.vx, rig.vz);
      if (p.kit.soft || (p.kit.tree && sp > 13)) { // at these speeds everything short of a building goes flying: it costs speed, never hull
        this.launch(p, rig.vx * 0.6 + (Math.random() - 0.5) * 8, 6 + sp * 0.16, rig.vz * 0.6 + (Math.random() - 0.5) * 8);
        const drag = p.kit.tree ? 0.86 : Math.max(0.93, p.kit.drag); rig.vx *= drag; rig.vz *= drag; rig.speed *= drag;
        out.push({ kind: 'smash', dmg: 0, x: p.x, y: p.y, z: p.z, type: p.type, tree: !!p.kit.tree });
      } else {
        const d = Math.sqrt(d2) || 0.01, nx = dx / d, nz = dz / d, into = -(rig.vx * nx + rig.vz * nz);
        rig.x = p.x + nx * rr; rig.z = p.z + nz * rr;
        if (into > 0) { rig.vx += nx * into * 1.25; rig.vz += nz * into * 1.25; rig.speed *= 0.55; if (into > 12) out.push({ kind: 'crash', dmg: into > 30 ? 8 : 4, x: p.x, y: p.y, z: p.z, type: p.type }); }
      }
    });
    return out;
  }

  update(dt, storm) {
    if (storm && storm.eats) this.feed(storm);
    const F = this.flying;
    for (let i = F.length - 1; i >= 0; i--) {
      const p = F[i]; p.tx += dt * p.spin; p.tz += dt * p.spin * 0.7;
      if (p.state === 1) {
        const s = p.storm; p.life += dt; p.h += p.climb * dt; const v = Math.min(1, p.h / s.height);
        const target = s.radiusAt(v) * 1.2 + 3; p.rad += (target - p.rad) * Math.min(1, dt * 1.6);
        const w = s.spin * (1.3 + 26 / (p.rad + 8)); p.ang += w * dt; s.spineAt(v, tmp);
        p.x = s.x + tmp.x + Math.cos(p.ang) * p.rad; p.z = s.z + tmp.z + Math.sin(p.ang) * p.rad; p.y = s.groundY + p.h;
        if (v > 0.5 || p.life > 6 || !s.alive) { const tv = w * p.rad; this.launch(p, -Math.sin(p.ang) * tv + Math.cos(p.ang) * 12, 6, Math.cos(p.ang) * tv + Math.sin(p.ang) * 12); }
        this.place(p, p.tx, p.tz);
      } else if (p.state === 3) {
        p.vy -= 22 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.y <= this.heightAt(p.x, p.z) && p.vy < 0) { p.state = 2; this.place(p, 0, 0, 0); this.events.push({ kind: 'land', x: p.x, y: p.y, z: p.z }); F.splice(i, 1); continue; }
        this.place(p, p.tx, p.tz);
      } else F.splice(i, 1);
    }
  }
}

export { HW0, HWD, hwDist, gridDist };
