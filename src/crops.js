// The crops stand up (2.20). The fields are painted into the ground texture; near the camera they are also standing crops: one
// instanced mesh of clumps on a grid that follows the camera, each the colour of the field it stands in (src/world.js's crop map)
// and lit like the ground (the same storm shadow, haze and fog). All the motion is in the vertex shader: a breeze running over
// them, the storm's inflow bending them toward it (harder the nearer it is), and flattened where something presses on them: the
// funnel's foot, your truck going through, and every telegraph, so a mark on the ground is never hidden in the crop.
// Nothing here collides or is read by the game. The low tier gets a smaller grid of thinner clumps.
import * as THREE from '../vendor/three.module.min.js';
import { WORLD } from './config.js';
import { LIT, HEAD } from './world.js';
import { TOWNS } from './world.js';

const CELL = 1.9, HALF = WORLD.size / 2, TELE = 8;
const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };

function cardGeo(cards) { // crossed cards, 1.6 m wide and a metre tall; the stalks are cut out of them in the fragment shader. aH: 0 root, 1 top
  const P = [], H = [], U = [];
  for (let c = 0; c < cards; c++) {
    const a = c / cards * Math.PI + 0.3, cx = Math.cos(a) * 0.8, sz = Math.sin(a) * 0.8;
    const q = [[-cx, 0, -sz, 0, 0], [cx, 0, sz, 1, 0], [cx, 1, sz, 1, 1], [-cx, 1, -sz, 0, 1]];
    for (const k of [0, 1, 2, 0, 2, 3]) { const [x, y, z, u, v] = q[k]; P.push(x, y, z); H.push(v); U.push(u + c, v); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aH', new THREE.Float32BufferAttribute(H, 1)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); return g;
}

export class Crops {
  constructor(scene, world, uniforms, low) {
    this.world = world; this.G = low ? 30 : 56; this.cell = low ? 2.4 : CELL; const n = this.G * this.G;
    this.edge = this.G * this.cell * 0.5; this.key = new Int32Array(n * 2).fill(-999999); this.cx = null; this.cz = null;
    this.u = { uTime: uniforms.uTime, uTint: uniforms.uTint, uFog: uniforms.uFog, uFogNear: uniforms.uFogNear, uFogFar: uniforms.uFogFar, uFlash: uniforms.uFlash, uTor: uniforms.uTor, uTorDir: uniforms.uTorDir, uGoldHaze: uniforms.uGoldHaze, uGoldK: uniforms.uGoldK, uHead: uniforms.uHead, uHeadK: uniforms.uHeadK, uGold: uniforms.uGold, uNoise: uniforms.uNoise,
      uStorm: { value: new THREE.Vector4(0, 0, 1, 0) }, uRig: { value: new THREE.Vector3(0, 0, -1) }, uTele: { value: Array.from({ length: TELE }, () => new THREE.Vector4(0, 0, 0, 0)) }, uCam: { value: new THREE.Vector3() }, uEdge: { value: this.edge } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u, side: THREE.DoubleSide,
      vertexShader: `attribute float aH; uniform float uTime, uEdge; uniform vec4 uStorm; uniform vec3 uRig, uCam; uniform vec4 uTele[${TELE}];
        varying vec3 vW, vC; varying float vH; varying vec2 vUv; varying float vSeed;
        void main(){ vUv = uv; vSeed = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
          vec3 base = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz; vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
          float h = aH;
          // the storm pulls the crop toward it, harder the nearer; a breeze runs over the rest
          vec2 toS = uStorm.xy - base.xz; float dS = length(toS); vec2 dirS = toS / max(dS, 1.0);
          float pull = uStorm.w * (1.0 - smoothstep(uStorm.z * 1.3, uStorm.z * 8.0, dS));
          float wave = sin(dot(base.xz, vec2(0.13, 0.09)) - uTime * (2.2 + 3.0 * pull)) * 0.5 + 0.5;
          vec2 sway = vec2(sin(uTime * 2.7 + base.x * 0.9), cos(uTime * 2.3 + base.z * 0.8)) * 0.05;
          vec2 bend = dirS * (0.08 + 0.18 * wave + pull * (0.55 + 0.35 * wave)) + sway * (1.0 - pull);
          // pressed flat: by the funnel's foot, by your truck, and under every telegraph so a mark is never hidden
          float press = (1.0 - smoothstep(uStorm.z * 0.9, uStorm.z * 1.8, dS)) * uStorm.w; // (smoothstep with its edges reversed is undefined in GLSL: always 1 - smoothstep(lo, hi, x))
          if (uRig.z > 0.0) press = max(press, 1.0 - smoothstep(1.2, uRig.z, distance(base.xz, uRig.xy)));
          for (int i = 0; i < ${TELE}; i++) { vec4 t = uTele[i]; if (t.w > 0.0) press = max(press, 1.0 - smoothstep(t.z * 0.95, t.z + 2.0, distance(base.xz, t.xy))); }
          // a stalk leans about its root, keeping its length: the tip moves furthest, never more than about 50 degrees over
          float lean = min(0.9, length(bend)) * pow(h, 1.4), bl = length(bend); vec2 bd = bl > 1e-4 ? bend / bl : vec2(0.0);
          vec3 rel = wp.xyz - base; float up = rel.y; rel.y = 0.0;
          wp.xyz = base + rel + vec3(bd.x, 0.0, bd.y) * sin(lean) * up + vec3(0.0, cos(lean) * up, 0.0);
          wp.y = base.y + (wp.y - base.y) * (1.0 - 0.85 * press);
          wp.y = base.y + (wp.y - base.y) * (1.0 - smoothstep(uEdge * 0.72, uEdge, distance(base.xz, uCam.xz))); // grows out of the field at the edge of the grid
          vW = wp.xyz; vH = h; vC = instanceColor; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `${HEAD} uniform vec3 uGold; varying vec3 vC; varying float vH; varying vec2 vUv; varying float vSeed;
        float hh(float n){ return fract(sin(n * 91.345 + vSeed * 47.0) * 43758.5453); }
        void main(){
          // stalks cut out of the card: nine across, each its own height, thin, with an ear at the top
          float sx = vUv.x * 9.0, id = floor(sx), fs = fract(sx), top = 0.62 + 0.38 * hh(id), ear = smoothstep(top - 0.2, top - 0.12, vUv.y);
          float w = mix(0.5, 0.86, ear) * (0.8 + 0.3 * hh(id + 3.0)); /* game-scale stalks: real ones would vanish under a pixel */
          if (abs(fs - 0.5) > w * 0.5 || vUv.y > top) discard; // (2.26: this sat inside the comment above since 2.20, so every card drew whole)
          // the canopy is lighter and warmer than the field under it: dark at the root, bright at the head
          vec3 c = mix(vC, vC * vec3(1.25, 1.18, 0.95) + vec3(0.04, 0.035, 0.0), vH) * (0.38 + 1.0 * pow(vH, 1.3)) * (0.86 + 0.28 * hh(id + 7.0)) * mix(1.0, 1.15, ear);
          c += uGold * uGoldK * vH * vH * 0.3 * max(0.0, dot(normalize(vW.xz - cameraPosition.xz + vec2(1e-4)), uTorDir)); // the tips catch the gold behind the storm
          ${LIT} }`,
    });
    this.mesh = new THREE.InstancedMesh(cardGeo(low ? 2 : 3), mat, n); this.mesh.frustumCulled = false; this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3); this.mesh.renderOrder = 2; scene.add(this.mesh);
    this.d = new THREE.Object3D(); this.col = new THREE.Color();
  }
  // a cell's clump: jittered in the cell, the colour of its field, nothing on roads, yards, towns, water or field tracks
  fill(slot, ix, iz) {
    const w = this.world, C = this.cell, x = (ix + 0.2 + 0.6 * hash(ix, iz)) * C, z = (iz + 0.2 + 0.6 * hash(iz + 7, ix - 3)) * C, d = this.d;
    let s = 0, o = -1;
    if (Math.abs(x) < HALF - 40 && Math.abs(z) < HALF - 40 && w.cropMap && w.clear(x, z, WORLD.roadHalf + 2.5)) {
      const px = Math.min(511, Math.max(0, ((x + HALF) / WORLD.size * 512) | 0)), pz = Math.min(511, Math.max(0, ((z + HALF) / WORLD.size * 512) | 0)); o = (pz * 512 + px) * 4;
      const dens = w.cropMap[o + 3] / 255; s = dens > 0.35 && hash(ix * 3 + 1, iz * 5 + 2) < 0.2 + dens ? 0.8 + 0.4 * hash(ix + 11, iz + 13) : 0;
      if (s) for (const k in TOWNS) { const t = TOWNS[k]; if (Math.abs(x - t.x) < 160 && Math.abs(z - t.z) < 110) { s = 0; break; } }
      if (s && w.farms) for (const f of w.farms) if (Math.hypot(f.x - x, f.z - z) < 48) { s = 0; break; }
    }
    d.position.set(x, s ? w.heightAt(x, z) - 0.05 : -999, z); d.rotation.set(0, hash(ix - 5, iz + 9) * 6.283, 0); d.scale.setScalar(s || 0.0001); d.updateMatrix(); this.mesh.setMatrixAt(slot, d.matrix);
    if (o >= 0) { const m = w.cropMap; this.col.setRGB(Math.min(1, m[o] / 255 * 1.12), Math.min(1, m[o + 1] / 255 * 1.12), Math.min(1, m[o + 2] / 255 * 1.05), THREE.SRGBColorSpace); this.mesh.setColorAt(slot, this.col); }
  }
  // follow the camera: only the cells that scrolled into the window are re-filled
  update(camera, rig, storm, tele) {
    const G = this.G, cx = Math.floor(camera.position.x / this.cell), cz = Math.floor(camera.position.z / this.cell), u = this.u;
    if (cx !== this.cx || cz !== this.cz) {
      this.cx = cx; this.cz = cz; let changed = false; const h = G >> 1;
      for (let ix = cx - h; ix < cx - h + G; ix++) for (let iz = cz - h; iz < cz - h + G; iz++) {
        const slot = (((ix % G) + G) % G) * G + (((iz % G) + G) % G);
        if (this.key[slot * 2] !== ix || this.key[slot * 2 + 1] !== iz) { this.key[slot * 2] = ix; this.key[slot * 2 + 1] = iz; this.fill(slot, ix, iz); changed = true; }
      }
      if (changed) { this.mesh.instanceMatrix.needsUpdate = true; this.mesh.instanceColor.needsUpdate = true; }
    }
    u.uCam.value.copy(camera.position);
    if (storm && storm.alive) u.uStorm.value.set(storm.x, storm.z, storm.def.r0 * 2 + 18, storm.fade); else u.uStorm.value.set(0, 0, 1, 0);
    if (rig && !rig.ghost) u.uRig.value.set(rig.x, rig.z, 4.5); else u.uRig.value.set(0, 0, -1);
    let i = 0; if (tele) for (const t of tele) { if (i >= TELE) break; if (t.on) u.uTele.value[i++].set(t.x, t.z, t.r, 1); } for (; i < TELE; i++) u.uTele.value[i].w = 0;
  }
  dispose() { this.mesh.parent && this.mesh.parent.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}
