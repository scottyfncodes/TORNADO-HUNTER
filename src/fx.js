// Effects: ground telegraphs, the cable and its ring, flipbooks, dust, thrown chunks, data shards, shake, hit-stop.
import * as THREE from '../vendor/three.module.min.js';
import { PALETTE } from './config.js';

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
    for (let i = 0; i < 44; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.dustTex, color: '#cdb27a', transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; s.renderOrder = 5; scene.add(s); this.dust.push({ s, on: false }); }
    // thrown chunks
    this.chunks = [];
    for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 2.2), new THREE.MeshLambertMaterial({ color: i % 3 ? '#5a4330' : '#d9b45a' })); m.visible = false; scene.add(m); this.chunks.push({ m, on: false }); }
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
  chunk(from, to, dur) { const c = this.chunks.find((e) => !e.on); if (!c) return; Object.assign(c, { on: true, t: 0, dur, fx: from.x, fy: from.y, fz: from.z, tx: to.x, ty: to.y, tz: to.z }); c.m.visible = true; }
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
  setRing(cx, cz, L, dir, alpha, color) {
    const pos = this.ring.geometry.attributes.position, RS = this.RS, w = 5; this.ring.visible = alpha > 0.01;
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
    for (const c of this.chunks) { if (!c.on) continue; c.t += dt; const k = Math.min(1, c.t / c.dur); c.m.position.set(c.fx + (c.tx - c.fx) * k, c.fy + (c.ty - c.fy) * k + Math.sin(k * Math.PI) * 40, c.fz + (c.tz - c.fz) * k); c.m.rotation.x += dt * 7; c.m.rotation.z += dt * 5; if (k >= 1) { c.on = false; c.m.visible = false; } }
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

  reset() { this.clearTelegraphs(); this.hideCable(0); this.hideCable(1); this.hideRing(); this.setStake(false); this.anims.length = 0; this.pod.visible = this.bolt.visible = this.wave.visible = false; this.lightning.stop(); this.energy.stop(); for (const c of this.chunks) { c.on = false; c.m.visible = false; } for (const s of this.shards) s.on = false; for (let i = 0; i < this.SH; i++) { dummy.scale.setScalar(0); dummy.updateMatrix(); this.shardMesh.setMatrixAt(i, dummy.matrix); } this.shardMesh.instanceMatrix.needsUpdate = true; this.stopT = 0; this.slowT = 0; this.shakeAmt = 0; }
}
