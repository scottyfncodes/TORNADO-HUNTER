// Effects: ground telegraphs, the cable and its ring, flipbooks, dust, thrown chunks, data shards, shake, hit-stop.
import * as THREE from '../vendor/three.module.min.js';
import { PALETTE } from './config.js';
import { box, cyl, merge } from './geo.js';

const F = 'assets/fx/';
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), dummy = new THREE.Object3D();

function softDot() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 31);
  g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.5, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

class Flipbook {
  constructor(scene, tex, meta, atlas, n) {
    this.meta = meta; this.frames = Object.values(atlas.frames).map((f) => f.frame); this.W = tex.image.width; this.H = tex.image.height; this.items = [];
    for (let i = 0; i < n; i++) {
      const t = tex.clone(); t.needsUpdate = true;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
      s.visible = false; s.renderOrder = 8; scene.add(s); this.items.push({ s, t, time: 0, on: false, loop: false, fps: meta.fps, fade: 1 });
    }
  }
  play(x, y, z, sx, sy, opts = {}) {
    const it = this.items.find((i) => !i.on) || this.items[0];
    it.on = true; it.time = 0; it.loop = !!opts.loop; it.fps = opts.fps || this.meta.fps; it.life = opts.life || 0; it.follow = opts.follow || null;
    it.s.visible = true; it.s.position.set(x, y, z); it.s.scale.set(sx, sy, 1); it.s.center.set(0.5, opts.ground ? 0 : 0.5); it.s.material.rotation = opts.rot || 0; it.s.material.opacity = 1; it.s.material.color.set(opts.color || '#ffffff');
    return it;
  }
  update(dt) {
    for (const it of this.items) {
      if (!it.on) continue; it.time += dt; let f = Math.floor(it.time * it.fps);
      if (it.loop) { if (it.life && it.time > it.life) { it.on = false; it.s.visible = false; continue; } f %= this.frames.length; if (it.life) it.s.material.opacity = Math.min(1, (it.life - it.time) * 3); }
      else if (f >= this.frames.length) { it.on = false; it.s.visible = false; continue; }
      if (it.follow) it.s.position.copy(it.follow);
      const fr = this.frames[f]; it.t.repeat.set(fr.w / this.W, fr.h / this.H); it.t.offset.set(fr.x / this.W, 1 - (fr.y + fr.h) / this.H);
    }
  }
  stop() { for (const it of this.items) { it.on = false; it.s.visible = false; } }
}

export class Fx {
  constructor(scene, camera, world, shared) {
    this.scene = scene; this.camera = camera; this.world = world; this.shared = shared;
    this.shakeAmt = 0; this.stopT = 0; this.slowT = 0; this.calm = false; this.flashCb = () => {};
    // telegraphs
    this.tele = [];
    const ringG = new THREE.RingGeometry(0.9, 1, 40), discG = new THREE.CircleGeometry(1, 32);
    for (let i = 0; i < 14; i++) {
      const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: PALETTE.accent, transparent: true, opacity: 0.95, depthWrite: false, fog: false, side: THREE.DoubleSide }), mat2 = mat.clone(); mat2.opacity = 0.3;
      const ring = new THREE.Mesh(ringG, mat), disc = new THREE.Mesh(discG, mat2); g.add(ring, disc); g.rotation.x = -Math.PI / 2; g.visible = false; g.renderOrder = 4; ring.renderOrder = 4; disc.renderOrder = 4; scene.add(g);
      this.tele.push({ g, ring, disc, on: false });
    }
    // dust puffs
    this.dustTex = softDot(); this.dust = [];
    for (let i = 0; i < 72; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.dustTex, color: '#cdb27a', transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; s.renderOrder = 5; scene.add(s); this.dust.push({ s, on: false }); }
    // wreckage the storm throws: real objects you can read, dodge and shoot (pooled)
    const W = '#f3ecd8', K = '#1b2224';
    this.hazGeo = {
      bale: merge([cyl(1.5, 1.5, 2.0, '#d9b45a', 0, 0, 0, 10, 0, Math.PI / 2)]),
      door: merge([box(4.2, 0.3, 2.6, '#a3352b', 0, 0, 0), box(4.3, 0.34, 0.3, W, 0, 0, 0), box(0.3, 0.34, 2.7, W, 0, 0, 0)]),
      sign: merge([box(3.2, 2.2, 0.2, '#3f8f5a', 0, 0, 0), box(3.4, 0.3, 0.24, W, 0, 0.95, 0), box(0.25, 3.6, 0.25, '#aab3b4', 0, -2.6, 0)]),
      car: merge([box(2.2, 0.9, 4.8, '#3f7f86', 0, 0, 0), box(2.0, 0.8, 2.4, '#e9dfc4', 0, 0.8, -0.2), box(2.3, 0.3, 0.3, '#c9cdca', 0, -0.3, 2.4), cyl(0.5, 0.5, 2.5, K, 0, -0.5, 1.5, 8, 0, Math.PI / 2), cyl(0.5, 0.5, 2.5, K, 0, -0.5, -1.5, 8, 0, Math.PI / 2)]),
      tractor: merge([box(1.8, 1.3, 3.6, '#3f8f3a', 0, 0.2, 0.3), box(1.7, 1.5, 1.6, '#3f8f3a', 0, 1.3, -1.0), box(1.5, 0.9, 1.4, '#16262a', 0, 1.5, -1.0), cyl(1.3, 1.3, 2.8, K, 0, -0.2, -1.1, 10, 0, Math.PI / 2), cyl(0.7, 0.7, 2.4, K, 0, -0.8, 1.6, 8, 0, Math.PI / 2), cyl(0.14, 0.14, 1.6, K, 0.5, 1.9, 1.2, 5), cyl(0.6, 0.6, 2.9, '#e8b21c', 0, -0.2, -1.1, 6, 0, Math.PI / 2)]),
    };
    const hmat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.haz = []; for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(this.hazGeo.bale, hmat); m.visible = false; scene.add(m); this.haz.push({ m, on: false }); }
    // tracers: one mesh of camera-facing dashes
    this.TR = 28; const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.TR * 12), 3));
    const ti = []; for (let i = 0; i < this.TR; i++) { const a = i * 4; ti.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } tg.setIndex(ti);
    this.tracerMesh = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ color: '#ffe08a', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide })); this.tracerMesh.frustumCulled = false; this.tracerMesh.renderOrder = 7; scene.add(this.tracerMesh);
    this.tracers = []; for (let i = 0; i < this.TR; i++) this.tracers.push({ on: false, a: new THREE.Vector3(), b: new THREE.Vector3(), t: 0, life: 0.1 });
    // rockets
    const rgeo = merge([cyl(0.28, 0.28, 2.2, W, 0, 0, 0, 6, Math.PI / 2), cyl(0.02, 0.3, 0.8, PALETTE.accent, 0, 0, 1.5, 5, Math.PI / 2), box(1.1, 0.08, 0.5, K, 0, 0, -0.9), box(0.08, 1.1, 0.5, K, 0, 0, -0.9)]);
    this.rockets = []; for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(rgeo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })); m.visible = false; scene.add(m); this.rockets.push({ m, on: false, p: new THREE.Vector3() }); }
    // flashes (muzzle, explosions): additive sprites
    this.flashes = []; for (let i = 0; i < 10; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.dustTex, color: '#ffd27a', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); sp.visible = false; sp.renderOrder = 8; scene.add(sp); this.flashes.push({ s: sp, on: false }); }
    // data shards
    this.SH = 48; this.shardMesh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.75), new THREE.MeshBasicMaterial({ color: PALETTE.signal, fog: false }), this.SH); this.shardMesh.frustumCulled = false; scene.add(this.shardMesh);
    this.shards = []; for (let i = 0; i < this.SH; i++) { this.shards.push({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), t: 0 }); dummy.scale.setScalar(0); dummy.updateMatrix(); this.shardMesh.setMatrixAt(i, dummy.matrix); }
    // cables (0: rig line, 1: anchor line)
    this.cables = [0, 1].map(() => {
      const SEG = 14, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SEG + 1) * 6), 3));
      const idx = []; for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } g.setIndex(idx);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: PALETTE.primary, side: THREE.DoubleSide, fog: false })); m.frustumCulled = false; m.visible = false; m.renderOrder = 5; scene.add(m); return { m, SEG };
    });
    // the ring on the ground at cable length, with chevrons that flow the way you must orbit
    const RS = 96, rg = new THREE.BufferGeometry(), rp = new Float32Array((RS + 1) * 6), ruv = new Float32Array((RS + 1) * 4), ridx = [];
    for (let i = 0; i <= RS; i++) { ruv.set([i / RS, 0, i / RS, 1], i * 4); if (i < RS) { const a = i * 2; ridx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); rg.setAttribute('uv', new THREE.BufferAttribute(ruv, 2)); rg.setIndex(ridx);
    this.ring = new THREE.Mesh(rg, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      uniforms: { uTime: shared.uTime, uColor: { value: new THREE.Color(PALETTE.primary) }, uDir: { value: 1 }, uAlpha: { value: 0 }, uReps: { value: 60 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform float uTime,uDir,uAlpha,uReps; uniform vec3 uColor; varying vec2 vUv;
        void main(){ float y=abs(vUv.y-0.5); float ch=fract(vUv.x*uReps*uDir - uTime*1.6 + y*1.5); float m=step(0.52,ch)*smoothstep(0.5,0.4,y);
          float rail=smoothstep(0.40,0.47,y); gl_FragColor=vec4(uColor,(m*0.6+rail*0.55)*uAlpha);
          #include <colorspace_fragment>
        }`,
    }));
    this.ring.frustumCulled = false; this.ring.renderOrder = 3; this.ring.visible = false; scene.add(this.ring); this.RS = RS;
    // shockwave + projectiles + stake
    this.wave = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48), new THREE.MeshBasicMaterial({ color: PALETTE.text, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide })); this.wave.rotation.x = -Math.PI / 2; this.wave.visible = false; this.wave.renderOrder = 5; scene.add(this.wave);
    this.pod = new THREE.Mesh(new THREE.OctahedronGeometry(1.6), new THREE.MeshBasicMaterial({ color: PALETTE.signal, fog: false })); this.pod.visible = false; scene.add(this.pod);
    this.bolt = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.4, 5), new THREE.MeshBasicMaterial({ color: PALETTE.text, fog: false })); this.bolt.visible = false; scene.add(this.bolt);
    this.stake = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.1, 3.2, 5), new THREE.MeshBasicMaterial({ color: PALETTE.primary, fog: false })); this.stake.visible = false; scene.add(this.stake);
    this.anims = [];
  }

  async load() {
    const L = new THREE.TextureLoader();
    const [lt, et, lm, em, la, ea] = await Promise.all([
      L.loadAsync(F + 'lightning_flipbook.png'), L.loadAsync(F + 'energy_flipbook.png'),
      fetch(F + 'lightning_flipbook.json').then((r) => r.json()), fetch(F + 'energy_flipbook.json').then((r) => r.json()),
      fetch(F + 'lightning_atlas.json').then((r) => r.json()), fetch(F + 'energy_atlas.json').then((r) => r.json()),
    ]);
    lt.colorSpace = et.colorSpace = THREE.SRGBColorSpace;
    this.lightning = new Flipbook(this.scene, lt, lm, la, 4); this.energy = new Flipbook(this.scene, et, em, ea, 6);
    return this;
  }

  // ---- feel ----
  shake(px) { if (!this.calm) this.shakeAmt = Math.max(this.shakeAmt, px); }
  hitStop(s) { this.stopT = Math.max(this.stopT, s); }
  slowMo(s) { this.slowT = Math.max(this.slowT, s); }
  flash(strength = 1, color) { if (!this.calm) this.flashCb(strength, color); }

  ground(x, z) { return this.world.heightAt(x, z); }

  // a closing circle on the ground: nothing lands without one. opts.track(dt, t) may move it until it locks.
  telegraph(x, z, r, dur, onLand, opts = {}) {
    const t = this.tele.find((e) => !e.on); if (!t) { return null; }
    Object.assign(t, { on: true, x, z, r, dur, time: 0, onLand, track: opts.track || null, lock: opts.lock ?? dur, cancelled: false });
    t.g.visible = true; return t;
  }
  cancelTelegraphs(x, z, radius) { let n = 0; for (const t of this.tele) if (t.on && Math.hypot(t.x - x, t.z - z) < radius) { t.on = false; t.g.visible = false; this.puff(t.x, this.ground(t.x, t.z) + 1, t.z, 10, '#f3ecd8'); n++; } return n; }
  clearTelegraphs() { for (const t of this.tele) { t.on = false; t.g.visible = false; } }

  puff(x, y, z, size = 6, color = '#cdb27a', life = 0.9, rise = 3) {
    const d = this.dust.find((e) => !e.on) || this.dust[(Math.random() * this.dust.length) | 0];
    d.on = true; d.t = 0; d.life = life; d.size = size; d.rise = rise; d.s.visible = true; d.s.position.set(x, y, z); d.s.material.color.set(color); d.s.material.rotation = Math.random() * 6;
  }
  // a thrown object: arcs from `from` to `to` in `dur` seconds; returns the pooled record (x,y,z are live)
  hazard(kind, from, to, dur) {
    const h = this.haz.find((e) => !e.on); if (!h) return null;
    Object.assign(h, { on: true, kind, t: 0, dur, fx: from.x, fy: from.y, fz: from.z, tx: to.x, ty: to.y, tz: to.z, x: from.x, y: from.y, z: from.z, landed: false, big: kind === 'car' || kind === 'tractor', spin: 3 + Math.random() * 5 });
    h.m.geometry = this.hazGeo[kind]; h.m.visible = true; h.m.scale.setScalar(h.big ? 1.25 : 1.1); h.m.position.set(from.x, from.y, from.z); return h;
  }
  freeHazard(h) { if (h) { h.on = false; h.m.visible = false; } }
  tracer(a, b) { const t = this.tracers.find((e) => !e.on) || this.tracers[0]; t.on = true; t.t = 0; t.a.copy(a); t.b.copy(b); t.life = Math.min(0.14, 0.04 + a.distanceTo(b) / 1600); }
  flashAt(x, y, z, size, color = '#ffd27a', life = 0.08) { const f = this.flashes.find((e) => !e.on) || this.flashes[0]; f.on = true; f.t = 0; f.life = life; f.size = size; f.s.visible = true; f.s.position.set(x, y, z); f.s.material.color.set(color); }
  explode(x, y, z, size = 14) {
    this.flashAt(x, y, z, size * 2.2, '#ffe9b0', 0.14); this.flashAt(x, y, z, size * 1.3, '#ff9a3c', 0.22);
    for (let i = 0; i < 5; i++) this.puff(x + (Math.random() - 0.5) * size * 0.7, y + (Math.random() - 0.3) * size * 0.5, z + (Math.random() - 0.5) * size * 0.7, size * (0.5 + Math.random() * 0.5), i % 2 ? '#2a2420' : '#6e5637', 0.9 + Math.random() * 0.5, 4);
  }
  // a rocket that homes on getTarget(out) and calls onHit(point)
  rocket(from, getTarget, speed, onHit) { const r = this.rockets.find((e) => !e.on); if (!r) { onHit(getTarget(_a).clone()); return; } r.on = true; r.p.copy(from); r.get = getTarget; r.speed = speed; r.onHit = onHit; r.t = 0; r.m.visible = true; }

  // data bursts out, hangs, then flies to the rig; onGet fires as each one arrives
  shardBurst(x, y, z, n, target, onGet) {
    for (let i = 0; i < n; i++) { const s = this.shards.find((e) => !e.on); if (!s) { onGet(i); continue; } const a = Math.random() * 6.283, v = 14 + Math.random() * 22; s.on = true; s.t = -i * 0.03; s.p.set(x, y, z); s.v.set(Math.cos(a) * v, 14 + Math.random() * 20, Math.sin(a) * v); s.target = target; s.onGet = onGet; s.i = i; }
  }
  shockwave(x, z, radius) { this.wave.visible = true; this.wave.position.set(x, this.ground(x, z) + 1.2, z); this.waveT = 0; this.waveR = radius; }
  anim(dur, step, done) { this.anims.push({ t: 0, dur, step, done }); }

  // probe pod: lobbed at the funnel, then spirals up it
  launchPod(from, storm, onEaten) {
    const start = from.clone(); this.pod.visible = true;
    this.anim(1.15, (k) => {
      if (k < 0.45) { const u = k / 0.45; _a.set(storm.x, storm.groundY + 6, storm.z); this.pod.position.lerpVectors(start, _a, u); this.pod.position.y += Math.sin(u * Math.PI) * 14; }
      else { const u = (k - 0.45) / 0.55, v = u * 0.4, r = storm.radiusAt(v) * (1.1 - u * 0.6), a = u * 14 * storm.spin; storm.spineAt(v, _a); this.pod.position.set(storm.x + _a.x + Math.cos(a) * r, storm.groundY + v * storm.height, storm.z + _a.z + Math.sin(a) * r); }
      this.pod.rotation.y += 0.4; this.pod.scale.setScalar(1 + Math.sin(k * 40) * 0.2);
    }, () => { this.pod.visible = false; onEaten(); });
  }
  launchHarpoon(from, getTarget, onHit) {
    const start = from.clone(); this.bolt.visible = true;
    this.anim(0.28, (k) => { const to = getTarget(_a); this.bolt.position.lerpVectors(start, to, k); this.bolt.lookAt(to); this.bolt.rotateX(Math.PI / 2); this.setCable(0, start, this.bolt.position, 0.5, 0); }, () => { this.bolt.visible = false; onHit(); });
  }

  // cable i from a to b; tension <0 slack, 0..1 good, >1 over
  setCable(i, a, b, tension, t) {
    const c = this.cables[i], pos = c.m.geometry.attributes.position, SEG = c.SEG; c.m.visible = true;
    const slack = tension < 0 ? Math.min(1, -tension) : 0, len = a.distanceTo(b), sag = slack * len * 0.16 + 1.5, vib = tension > 0 ? (tension > 1 ? 0.9 : 0.25) : 0;
    _d.subVectors(b, a).normalize();
    for (let s = 0; s <= SEG; s++) {
      const u = s / SEG; _c.lerpVectors(a, b, u); const arch = Math.sin(u * Math.PI); _c.y -= sag * arch; _c.y += Math.sin(u * 30 + t * 60) * vib * arch;
      const gy = this.ground(_c.x, _c.z) + 0.4; if (_c.y < gy) _c.y = gy;
      _b.subVectors(this.camera.position, _c); _a.crossVectors(_d, _b).normalize().multiplyScalar(0.11 + u * 0.42 + (tension > 1 ? 0.12 : 0));
      pos.setXYZ(s * 2, _c.x - _a.x, _c.y - _a.y, _c.z - _a.z); pos.setXYZ(s * 2 + 1, _c.x + _a.x, _c.y + _a.y, _c.z + _a.z);
    }
    pos.needsUpdate = true;
    c.m.material.color.set(tension < 0 ? '#b9b39f' : tension > 1 ? PALETTE.accent : PALETTE.primary);
  }
  hideCable(i) { this.cables[i].m.visible = false; }

  // ring at radius L around (cx,cz), draped on the terrain; dir +1/-1 is the way to orbit; state colours it
  setRing(cx, cz, L, dir, alpha, color, w = 5) {
    const pos = this.ring.geometry.attributes.position, RS = this.RS; this.ring.visible = alpha > 0.01;
    if (!this.ring.visible) return;
    for (let i = 0; i <= RS; i++) { const a = i / RS * 6.2831853, c = Math.cos(a), s = Math.sin(a), xi = cx + c * (L - w), zi = cz + s * (L - w), xo = cx + c * (L + w), zo = cz + s * (L + w); pos.setXYZ(i * 2, xi, this.ground(xi, zi) + 0.45, zi); pos.setXYZ(i * 2 + 1, xo, this.ground(xo, zo) + 0.45, zo); }
    pos.needsUpdate = true; const u = this.ring.material.uniforms; u.uDir.value = dir; u.uAlpha.value = alpha; u.uColor.value.set(color); u.uReps.value = Math.round(L * 6.283 / 12);
  }
  hideRing() { this.ring.visible = false; }
  setStake(on, x, z) { this.stake.visible = on; if (on) this.stake.position.set(x, this.ground(x, z) + 1.4, z); }

  update(dt, t) {
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 34);
    for (const e of this.tele) {
      if (!e.on) continue; e.time += dt; if (e.track && e.time < e.lock) e.track(e, dt);
      const k = Math.min(1, e.time / e.dur), y = this.ground(e.x, e.z) + 0.5; e.g.position.set(e.x, y, e.z); e.ring.scale.setScalar(e.r); e.disc.scale.setScalar(Math.max(0.001, e.r * k));
      e.disc.material.opacity = 0.22 + 0.35 * k; e.ring.material.opacity = e.time > e.lock ? 1 : 0.7 + 0.3 * Math.sin(t * 22);
      if (e.time >= e.dur) { e.on = false; e.g.visible = false; e.onLand && e.onLand(e); }
    }
    for (const d of this.dust) { if (!d.on) continue; d.t += dt; const k = d.t / d.life; if (k >= 1) { d.on = false; d.s.visible = false; continue; } d.s.position.y += d.rise * dt; const s = d.size * (0.5 + k * 1.2); d.s.scale.set(s, s, 1); d.s.material.opacity = 0.6 * (1 - k); }
    for (const h of this.haz) {
      if (!h.on) continue; h.t += dt;
      if (!h.landed) { const k = Math.min(1, h.t / h.dur); h.x = h.fx + (h.tx - h.fx) * k; h.z = h.fz + (h.tz - h.fz) * k; h.y = h.fy + (h.ty - h.fy) * k + Math.sin(k * Math.PI) * (26 + h.dur * 12); h.m.rotation.x += dt * h.spin; h.m.rotation.z += dt * h.spin * 0.7; }
      h.m.position.set(h.x, h.y, h.z);
    }
    const tp = this.tracerMesh.geometry.attributes.position; let tn = 0;
    for (let i = 0; i < this.TR; i++) {
      const tr = this.tracers[i]; let ok = false;
      if (tr.on) { tr.t += dt; const k = tr.t / tr.life; if (k >= 1) tr.on = false; else { ok = true; tn++; _c.lerpVectors(tr.a, tr.b, k); _d.lerpVectors(tr.a, tr.b, Math.min(1, k + 0.22)); _b.subVectors(this.camera.position, _c); _a.subVectors(_d, _c).cross(_b).normalize().multiplyScalar(0.22); tp.setXYZ(i * 4, _c.x - _a.x, _c.y - _a.y, _c.z - _a.z); tp.setXYZ(i * 4 + 1, _c.x + _a.x, _c.y + _a.y, _c.z + _a.z); tp.setXYZ(i * 4 + 2, _d.x - _a.x, _d.y - _a.y, _d.z - _a.z); tp.setXYZ(i * 4 + 3, _d.x + _a.x, _d.y + _a.y, _d.z + _a.z); } }
      if (!ok) for (let v = 0; v < 4; v++) tp.setXYZ(i * 4 + v, 0, -999, 0);
    }
    tp.needsUpdate = true; this.tracerMesh.visible = tn > 0 || this.tracerWas; this.tracerWas = tn > 0;
    for (const r of this.rockets) {
      if (!r.on) continue; r.t += dt; const to = r.get(_a); _b.subVectors(to, r.p); const d = _b.length(), step = r.speed * dt;
      if (d <= step + 3 || r.t > 3) { r.on = false; r.m.visible = false; r.onHit(to.clone()); continue; }
      r.p.addScaledVector(_b, step / d); r.m.position.copy(r.p); r.m.lookAt(to); this.puff(r.p.x, r.p.y, r.p.z, 2.6, '#e9e2cc', 0.45, 1); this.flashAt(r.p.x - _b.x / d * 1.5, r.p.y - _b.y / d * 1.5, r.p.z - _b.z / d * 1.5, 3.2, '#ffb14a', 0.05);
    }
    for (const f of this.flashes) { if (!f.on) continue; f.t += dt; const k = f.t / f.life; if (k >= 1) { f.on = false; f.s.visible = false; continue; } const sz = f.size * (0.6 + 0.6 * k); f.s.scale.set(sz, sz, 1); f.s.material.opacity = 1 - k; }
    let any = false;
    for (let i = 0; i < this.SH; i++) {
      const s = this.shards[i]; if (!s.on) continue; any = true; s.t += dt;
      if (s.t > 0) {
        if (s.t < 0.55) { s.v.y -= 30 * dt; s.p.addScaledVector(s.v, dt); const gy = this.ground(s.p.x, s.p.z) + 1; if (s.p.y < gy) { s.p.y = gy; s.v.y *= -0.4; } }
        else { _a.set(s.target.x, s.target.y + 1.5, s.target.z).sub(s.p); const d = _a.length(), sp = 40 + (s.t - 0.55) * 160; if (d < sp * dt + 2.5) { s.on = false; s.onGet(s.i); dummy.scale.setScalar(0); dummy.updateMatrix(); this.shardMesh.setMatrixAt(i, dummy.matrix); continue; } s.p.addScaledVector(_a, sp * dt / d); }
      }
      dummy.position.copy(s.p); dummy.rotation.set(s.t * 5, s.t * 7, 0); dummy.scale.setScalar(s.t > 0 ? 1 : 0); dummy.updateMatrix(); this.shardMesh.setMatrixAt(i, dummy.matrix);
    }
    if (any || this.shardDirty) { this.shardMesh.instanceMatrix.needsUpdate = true; this.shardDirty = any; }
    if (this.wave.visible) { this.waveT += dt * 2.4; const s = this.waveR * Math.min(1, this.waveT); this.wave.scale.setScalar(s); this.wave.material.opacity = 1 - this.waveT; if (this.waveT >= 1) this.wave.visible = false; }
    for (let i = this.anims.length - 1; i >= 0; i--) { const a = this.anims[i]; a.t += dt; const k = Math.min(1, a.t / a.dur); a.step(k); if (k >= 1) { this.anims.splice(i, 1); a.done && a.done(); } }
    this.lightning.update(dt); this.energy.update(dt);
  }

  reset() { this.clearTelegraphs(); this.hideCable(0); this.hideCable(1); this.hideRing(); this.setStake(false); this.anims.length = 0; this.pod.visible = this.bolt.visible = this.wave.visible = false; this.lightning.stop(); this.energy.stop(); for (const h of this.haz) { h.on = false; h.m.visible = false; } for (const r of this.rockets) { r.on = false; r.m.visible = false; } for (const f of this.flashes) { f.on = false; f.s.visible = false; } for (const t of this.tracers) t.on = false; for (const s of this.shards) s.on = false; for (let i = 0; i < this.SH; i++) { dummy.scale.setScalar(0); dummy.updateMatrix(); this.shardMesh.setMatrixAt(i, dummy.matrix); } this.shardMesh.instanceMatrix.needsUpdate = true; this.stopT = 0; this.slowT = 0; this.shakeAmt = 0; }
}
