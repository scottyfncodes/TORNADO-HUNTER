// Weather that comes and goes over a fight.
//   Hail: a core passes over for ten seconds or so. Stones in the air, stars on the lens, the distance closes in,
//         the road is a little slick. Called out before it arrives; the funnel, the ground markers and the HUD never fog.
//   Lightning: strikes out in the country, never on you (the storm's own aimed bolt is combat.js). A brief wash of
//         light that throws the murk open for a moment, and thunder that arrives when the distance says it should.
import * as THREE from '../vendor/three.module.min.js';
import { FEEL } from './config.js';
import { stream } from './daily.js';

const rand = (a, b) => a + Math.random() * (b - a), span = (r) => rand(r[0], r[1]);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const _f = new THREE.Vector3();

export class Weather {
  constructor(G) {
    this.G = G; this.hail = 0; this.spell = 0; this.nextHail = 1e9; this.boltT = rand(4, 8); this.lensT = 0; this.reveal = 0; this.spells = 0; this.bolts = 0;
    // hailstones: one draw call of points in a box that follows the camera, wrapped in the vertex shader
    const COUNT = G.low ? 160 : 520, pos = new Float32Array(COUNT * 3); for (let i = 0; i < pos.length; i++) pos[i] = Math.random();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.stones = new THREE.Points(g, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false,
      uniforms: { uTime: G.sky.uniforms.uTime, uAmount: { value: 0 }, uCam: { value: new THREE.Vector3() }, uPx: { value: 1 } },
      vertexShader: `uniform float uTime,uAmount,uPx; uniform vec3 uCam; varying float vA;
        void main(){ vec3 box=vec3(60.0,38.0,60.0); vec3 p=position*box; p+=vec3(7.0,-58.0,4.0)*uTime; p=mod(p-uCam,box)-box*0.5;
          vec4 mv=viewMatrix*vec4(p+uCam,1.0); vA=step(fract(position.y*7.31+position.z*3.7),uAmount)*smoothstep(0.6,2.5,-mv.z);
          gl_PointSize=uPx*clamp(70.0/max(1.0,-mv.z),2.0,9.0); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `varying float vA; void main(){ vec2 c=gl_PointCoord-0.5; float d=dot(c,c); if(d>0.25||vA<0.01) discard; gl_FragColor=vec4(0.95,0.98,1.0,vA*(1.0-d*2.0)); }`,
    }));
    this.stones.frustumCulled = false; this.stones.renderOrder = 6; this.stones.visible = false; G.scene.add(this.stones);
    // stars where a stone hits the lens: a small pool of elements, never in the middle of the picture
    this.lens = document.getElementById('lens'); this.marks = [];
    if (this.lens) for (let i = 0; i < (G.low ? 4 : 8); i++) { const e = document.createElement('i'); this.lens.appendChild(e); this.marks.push({ e, until: 0 }); }
  }
  // when the weather turns: seeded on the Daily Storm so the hail comes when everyone's does. The strikes have a stream of their
  // own: calm mode spaces them out, and that must never move the hail
  wr(a, b) { return a + this.rnd() * (b - a); }
  br(a, b) { return a + this.rb() * (b - a); }
  begin(m) {
    const seeded = m.seed !== null && m.seed !== undefined; this.rnd = seeded ? stream(m.seed, 'weather') : Math.random; this.rb = seeded ? stream(m.seed, 'bolts') : Math.random;
    this.hail = 0; this.spell = 0; this.nextHail = this.wr(...FEEL.hailFirst) + (m.coach ? 14 : 0); this.boltT = this.br(4, 8); this.reveal = 0; this.spells = 0; this.bolts = 0;
    for (const k of this.marks) { k.until = 0; k.e.style.opacity = 0; }
  }

  update(dt, t, m, storm, camera) {
    const G = this.G, sky = G.sky, fx = G.fx, calm = fx.calm, live = !!m && !m.result;
    // ---- hail ----
    if (!live) this.spell = 0;
    else if (this.spell > 0) { this.spell -= dt; if (this.spell <= 0) this.nextHail = this.wr(...FEEL.hailGap); }
    else if (m.phase === 'chase' || m.phase === 'surge') { this.nextHail -= dt; if (this.nextHail <= 0) { this.spell = this.wr(...FEEL.hailSeconds); this.spells++; m.call('HAIL CORE: LOW GRIP', 'warn', 1.6, 3); G.audio.warn(); } } // it changes your grip: a threat, never dropped from the callout queue
    this.hail += ((this.spell > 0 ? 1 : 0) - this.hail) * Math.min(1, dt * 0.9); if (this.hail < 0.004) this.hail = 0;
    const h = this.hail; sky.ice = h; sky.vis = 1 - (1 - FEEL.hailVisibility) * h; sky.calm = calm;
    if (m) m.rig.gripMul = 1 - FEEL.hailGrip * h;
    this.stones.visible = h > 0;
    if (h > 0) {
      const u = this.stones.material.uniforms; u.uAmount.value = h; u.uCam.value.copy(camera.position); u.uPx.value = G.renderer.getPixelRatio() * Math.max(0.8, window.innerHeight / 420);
      // stones bursting on the ground round the truck
      if (m && !G.low && Math.random() < dt * 16 * h) { const r = m.rig, x = r.x + r.vx * 0.5 + rand(-18, 18), z = r.z + r.vz * 0.5 + rand(-18, 18); fx.puff(x, fx.ground(x, z) + 0.3, z, 1.3, '#e9f1f0', 0.22, 6); }
      // and on the lens
      this.lensT -= dt * h * (calm ? 0.7 : 2.3);
      if (this.lensT <= 0 && live && !m.cine && h > 0.25) { this.lensT = rand(0.6, 1.4); this.lensHit(t, calm); }
    }
    // ---- lightning out in the country ----
    this.reveal = Math.max(0, this.reveal - dt); this.boltT -= dt;
    if (this.boltT <= 0 && storm && storm.alive) {
      this.boltT = (m && this.rb ? this.br(...(h > 0.4 ? FEEL.boltEveryHail : FEEL.boltEvery)) : span(h > 0.4 ? FEEL.boltEveryHail : FEEL.boltEvery)) * (calm ? 1.6 : 1) * (m ? 1 : 1.5);
      if (!(m && m.cine)) this.bolt(storm, camera, !!m);
    }
  }

  bolt(storm, camera, loud) {
    const G = this.G, fx = G.fx, c = camera.position; let x, z;
    if (Math.random() < 0.55) { const a = rand(0, 6.283), d = rand(90, 300); x = storm.x + Math.cos(a) * d; z = storm.z + Math.sin(a) * d; } // round the funnel
    else { camera.getWorldDirection(_f); const a = Math.atan2(_f.x, _f.z) + rand(-1.1, 1.1), d = rand(240, 720); x = c.x + Math.sin(a) * d; z = c.z + Math.cos(a) * d; } // or somewhere you are looking
    let dx = x - c.x, dz = z - c.z, dist = Math.hypot(dx, dz) || 1;
    if (dist < 150) { x = c.x + dx / dist * 150; z = c.z + dz / dist * 150; dist = 150; } // never on top of you: that is the storm's own bolt, and it has a marker
    x = clamp(x, -1500, 1500); z = clamp(z, -1500, 1500);
    const y = fx.ground(x, z), hgt = rand(210, 300), near = clamp(1 - dist / 800, 0, 1);
    fx.lightning.play(x, y, z, hgt * 0.55, hgt, { ground: true, fps: rand(24, 32), rot: rand(-0.08, 0.08) });
    G.sky.strike(0.3 + 0.6 * near); this.reveal = 0.7; this.bolts++; this.lastBolt = { dist: Math.round(dist), delay: +(dist / FEEL.soundSpeed).toFixed(2) };
    if (loud) G.audio.thunderFar(0.25 + 0.6 * near, dist / FEEL.soundSpeed, 1 - near);
  }

  lensHit(t, calm) {
    const k = this.marks.find((e) => e.until <= t); if (!k) return; k.until = t + 1.5;
    let x, y; do { x = Math.random(); y = Math.random(); } while (Math.abs(x - 0.5) < 0.17 && Math.abs(y - 0.5) < 0.24); // the sights stay clear
    const s = rand(0.55, 1.15), e = k.e; e.style.transform = `translate(${Math.round(x * window.innerWidth - 32)}px, ${Math.round(y * window.innerHeight - 32)}px) rotate(${Math.round(rand(0, 360))}deg) scale(${s.toFixed(2)})`;
    if (e.animate) e.animate([{ opacity: 0.9 }, { opacity: 0.6, offset: 0.25 }, { opacity: 0 }], { duration: calm ? 1000 : 1500, easing: 'ease-out' }); else { e.style.opacity = 0.7; setTimeout(() => { e.style.opacity = 0; }, 700); }
    this.G.audio.hailTick();
  }
}
