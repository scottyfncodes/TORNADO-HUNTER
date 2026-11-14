// The storm: a funnel bent along a wobbling spine in the vertex shader, GPU debris. Since 2.14 a living thing: a molten heart
// where it can be hurt, cracks that spread from it as it is, lightning crawling inside it, a tear when it loses a phase, rage.
import * as THREE from '../vendor/three.module.min.js';
import { PALETTE } from './config.js';
import { cowGeo } from './geo.js';

// the same spine and radius maths runs here (JS) and in the shaders (GLSL): keep them in step
const SPINE_GLSL = `
uniform float uH,uR0,uR1,uPow,uWob,uTime,uSpin,uThin; uniform vec2 uLean;
vec2 spine(float v){ return uLean*v*v*uH*0.45 + vec2(sin(v*4.0+uTime*1.1),cos(v*3.3+uTime*0.9))*uWob*sin(3.14159*v); }
float radius(float v){ return mix(uR0*uThin,uR1*(0.45+0.55*uThin),pow(v,uPow)) + uR0*uThin*1.3*exp(-v*14.0); }`;

const funnelGeo = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 28, 24, true); g.translate(0, 0.5, 0); return g; })();
const debrisGeo = new THREE.BoxGeometry(1, 1, 1);

function funnelMaterial(shared, params) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: {
      uNoise: shared.uNoise, uTime: shared.uTime, uFlash: shared.uFlash, uFog: shared.uFog, uFogNear: shared.uFogNear, uFogFar: shared.uFogFar, uCloud: shared.uCloud, uGold: shared.uGold, uGoldK: shared.uGoldK,
      uH: { value: params.height }, uR0: { value: params.r0 }, uR1: { value: params.r1 }, uPow: { value: params.pow }, uWob: { value: params.wob }, uSpin: { value: 1 }, uThin: { value: 1 },
      uLean: { value: new THREE.Vector2() }, uFade: { value: 1 }, uCut: { value: 0 }, uCore: { value: 0 },
      // the monster (2.14): its heart (world position, radius, how bright), how hurt this phase is, how angry it is, lightning inside, the tear
      uHeart: { value: new THREE.Vector3() }, uHeartR: { value: 10 }, uHeartK: { value: 0 }, uWound: { value: 0 }, uRage: { value: 0 }, uVein: { value: 0 }, uTear: { value: new THREE.Vector4(0, 0, 0, 0) },
      uColA: { value: new THREE.Color('#151e1f') }, uColB: { value: new THREE.Color('#4d5a53') }, uDust: { value: new THREE.Color('#b89a58') }, uHot: { value: new THREE.Color(PALETTE.accent) },
    },
    vertexShader: `${SPINE_GLSL}
      varying vec2 vUv; varying float vV; varying vec3 vN; varying vec3 vW;
      void main(){ float v=position.y; vV=v; float a=atan(position.z,position.x);
        float r=radius(v)*(1.0+0.07*sin(v*11.0-uTime*2.2+a*2.0));
        vec2 sp=spine(v); vec3 p=vec3(cos(a)*r+sp.x, v*uH, sin(a)*r+sp.y);
        vUv=vec2(a/6.2831853+0.5,v); vN=normalize(mat3(modelMatrix)*vec3(cos(a),0.3,sin(a)));
        vec4 w=modelMatrix*vec4(p,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform sampler2D uNoise; uniform float uTime,uSpin,uFade,uCut,uCore,uFlash,uFogNear,uFogFar,uHeartR,uHeartK,uWound,uRage,uVein,uGoldK; uniform vec3 uColA,uColB,uDust,uHot,uCloud,uFog,uHeart,uGold; uniform vec4 uTear;
      varying vec2 vUv; varying float vV; varying vec3 vN; varying vec3 vW;
      void main(){
        float tw=uTime*uSpin;
        float s1=texture2D(uNoise,vec2(vUv.x*2.0-tw*0.42*(1.5-vV), vV*1.6-uTime*0.16)).r;
        float s2=texture2D(uNoise,vec2(vUv.x*5.0-tw*0.75, vV*5.0-uTime*0.4)).r;
        float n=s1*0.68+s2*0.32;
        vec3 c=mix(uColA,uColB,smoothstep(0.25,0.8,n));
        c=mix(uDust*(0.55+0.5*n),c,smoothstep(0.0,0.13,vV));
        c=mix(c,uCloud*0.75,smoothstep(0.62,1.0,vV));
        vec3 view=normalize(cameraPosition-vW); float rim=1.0-abs(dot(normalize(vN),view));
        c+=vec3(0.16,0.2,0.18)*rim*rim*(1.0-0.5*uGoldK); c+=uGold*0.3*uGoldK*rim*rim*rim; // its edges: backlit by the gold behind it (2.15)
        c+=uHot*uCore*(0.25+0.75*pow(1.0-rim,2.0))*(0.6+0.4*s2)*(1.0-smoothstep(0.0,0.5,vV));
        // rage: darker, with the heat showing at the edges
        c*=1.0-0.18*uRage; c+=uHot*0.1*uRage*rim*(0.5+n);
        // lightning crawling inside it: thin bright veins along the noise, anywhere on the body, while uVein flickers
        float dc=distance(vW,cameraPosition), aw=dc*0.00012; // lines widen and fade with distance, so they never sparkle
        float vein=(1.0-smoothstep(0.0,0.035+aw,abs(s1-0.55)))*(1.0-smoothstep(500.0,1400.0,dc)); c+=vec3(0.84,0.86,1.0)*vein*uVein*(0.6+0.8*n)*smoothstep(0.03,0.25,vV)*(1.0-smoothstep(0.75,1.0,vV));
        // the heart: molten where it is turned toward you, cracks running out from it, further the more it is hurt
        float beat=0.85+0.15*sin(uTime*(5.0+4.0*uRage)), dh=distance(vW,uHeart)+(n-0.5)*uHeartR*0.8; // a pulse, and a ragged edge
        float heart=uHeartK*exp(-dh*dh/(uHeartR*uHeartR*2.2))*beat;
        float reach=uHeartR*(3.0+6.0*uWound+3.0*uRage), near=uHeartK*(1.0-smoothstep(0.0,reach,dh));
        c=mix(c,c*0.55+uHot*0.32,near*0.75); // it bleeds light into the cloud around it
        float s3=texture2D(uNoise,vec2(vUv.x*9.0-tw*0.6, vV*11.0-uTime*0.3)).r; // finer, for the cracks
        float crack=(1.0-smoothstep(0.0,0.035+0.05*uWound+aw*2.0,abs(s3-0.5)))*(1.0-smoothstep(600.0,1500.0,dc)); c+=mix(uHot,vec3(1.0,0.75,0.55),0.25)*crack*near*(0.9+1.8*uWound)*beat;
        c=mix(c,mix(uHot*1.3,vec3(1.0,0.94,0.84),smoothstep(0.5,0.95,heart)),clamp(heart*1.5,0.0,1.0));
        // the tear: where it lost a phase, a gash opens, edged white-hot, the sky showing through, then it heals over
        float gd=distance(vW,uTear.xyz), gr=uHeartR*(2.5+3.0*(1.0-uTear.w)), gash=uTear.w*(1.0-smoothstep(gr*0.4,gr,gd+(s2-0.5)*gr*0.9));
        float edge=1.0-smoothstep(0.0,0.12,abs(s1-0.5)); c+=vec3(1.0,0.82,0.7)*gash*(0.6+2.4*edge);
        c*=1.0+uFlash*1.6;
        float al=mix(0.97,0.5,pow(rim,2.2))*(0.82+0.3*n); al=max(al,clamp(heart*1.3+crack*near*0.6+near*0.25,0.0,1.0)*uFade); al*=1.0-0.75*gash*(1.0-edge);
        al*=uFade*smoothstep(uCut-0.04,uCut+0.06,vV+(n-0.5)*0.08);
        float f=smoothstep(uFogNear,uFogFar*1.4,distance(vW,cameraPosition)); c=mix(c,uFog,f*0.75);
        gl_FragColor=vec4(c,clamp(al,0.0,1.0));
        #include <colorspace_fragment>
      }`,
  });
}

function debrisMesh(shared, funnelUniforms, count) {
  const seeds = new Float32Array(count * 4); for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
  const g = debrisGeo.clone(); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4));
  const fu = funnelUniforms;
  const m = new THREE.InstancedMesh(g, new THREE.ShaderMaterial({
    fog: false,
    uniforms: { uNoise: shared.uNoise, uTime: shared.uTime, uFog: shared.uFog, uFogNear: shared.uFogNear, uFogFar: shared.uFogFar, uH: fu.uH, uR0: fu.uR0, uR1: fu.uR1, uPow: fu.uPow, uWob: fu.uWob, uSpin: fu.uSpin, uThin: fu.uThin, uLean: fu.uLean, uFade: fu.uFade, uCut: fu.uCut },
    vertexShader: `${SPINE_GLSL}
      uniform float uFade,uCut; attribute vec4 aSeed; varying vec3 vC; varying vec3 vW;
      void main(){ float v=fract(aSeed.y+uTime*0.045*(0.5+aSeed.z)); float hv=v*0.62;
        float w=uSpin*(1.2+1.6*(1.0-hv))*(0.6+0.7*aSeed.z); float ang=aSeed.x*43.0+uTime*w;
        float r=radius(hv)*(1.05+0.6*aSeed.w)+2.0+6.0*aSeed.w; vec2 sp=spine(hv);
        vec3 lp=position*vec3(1.0,0.3,0.55)*(0.9+aSeed.w*2.8)*uFade*clamp(1.0-uCut*2.2,0.0,1.0)*smoothstep(0.0,0.06,v)*(1.0-smoothstep(0.9,1.0,v));
        float ta=ang*2.0+uTime*aSeed.z*4.0; float c1=cos(ta),s1=sin(ta); lp=vec3(lp.x*c1-lp.z*s1, lp.y*c1+lp.x*s1*0.5, lp.x*s1+lp.z*c1);
        vec3 p=vec3(sp.x+cos(ang)*r, hv*uH+1.0, sp.y+sin(ang)*r)+lp;
        vC=mix(vec3(0.07,0.06,0.05),vec3(0.42,0.34,0.17),step(0.6,aSeed.x))*(0.7+0.5*abs(normal.y));
        vec4 wp=modelMatrix*vec4(p,1.0); vW=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform vec3 uFog; uniform float uFogNear,uFogFar; varying vec3 vC; varying vec3 vW;
      void main(){ float f=smoothstep(uFogNear,uFogFar*1.4,distance(vW,cameraPosition)); gl_FragColor=vec4(mix(vC,uFog,f*0.7),1.0);
        #include <colorspace_fragment>
      }`,
  }), count);
  m.frustumCulled = false; return m;
}

let COW = null; const cowMat = new THREE.MeshLambertMaterial({ vertexColors: true }), cowDummy = new THREE.Object3D();
const BAND_V = { 1: [0.12], 2: [0.16, 0.075], 3: [0.19, 0.125, 0.06] };
const _v = new THREE.Vector3();

export class Storm {
  constructor(scene, shared, def, world, opts = {}) {
    this.scene = scene; this.def = def; this.world = world; this.mini = !!opts.mini;
    this.x = 0; this.z = 0; this.groundY = 0; this.vx = 0; this.vz = 0; this.spin = 1; this.height = def.height;
    this.alive = true; this.visible = true; this.fade = 1; this.thin = 1; this.thinTarget = 1; this.eats = !this.mini; this.t = 0; this.cut = 0;
    this.moveX = 0; this.moveZ = 0; this.moveSpeed = 0; this.lean = new THREE.Vector2(); this.topOffset = new THREE.Vector3(); this.thrash = 0; this.thrashX = 0; this.thrashZ = 0;
    // harpooned (src/tether.js): ax,az is the anchor, which travels at vx,vz; tug is the lunge offset, lean and writhe on top of it
    this.ax = 0; this.az = 0; this.tug = null; this.writhe = 0;
    this.pow = def.pow || (def.type === 'Wedge' ? 1.25 : def.type === 'Rope' ? 2.2 : 1.7); this.wob = def.wob || (def.type === 'Rope' ? 12 : 7);
    this.group = new THREE.Group(); scene.add(this.group);
    this.mat = funnelMaterial(shared, { height: def.height, r0: def.r0, r1: def.r1, pow: this.pow, wob: this.wob });
    this.funnel = new THREE.Mesh(funnelGeo, this.mat); this.funnel.frustumCulled = false; this.funnel.renderOrder = 2; this.group.add(this.funnel);
    this.debris = debrisMesh(shared, this.mat.uniforms, this.mini ? 24 : 150); this.group.add(this.debris);
    // every super tornado keeps a few cows in the air. It is the law.
    if (!this.mini) { COW = COW || cowGeo(); const n = opts.low ? 8 : 14; this.cows = new THREE.InstancedMesh(COW, cowMat, n); this.cows.frustumCulled = false; this.group.add(this.cows); this.cowSeed = Array.from({ length: n }, (_, i) => ({ v: 0.06 + 0.36 * ((i * 0.37) % 1), a: i * 2.4, w: 0.7 + ((i * 0.61) % 1) * 0.6, r: 1.15 + ((i * 0.43) % 1) * 0.9, s: 2.1 + ((i * 0.29) % 1) * 1.5 })); }
    // the dirt it is chewing: a low, wide, dark skirt around the base (skipped on weak GPUs: it is a lot of pixels)
    if (!this.mini && !opts.low) {
      this.skirtMat = funnelMaterial(shared, { height: 44 + def.r0, r0: def.r0 * 1.9 + 9, r1: def.r0 * 3.0 + 22, pow: 0.75, wob: 2.5 });
      const su = this.skirtMat.uniforms; su.uColA.value.set('#1c1712'); su.uColB.value.set('#5a4733'); su.uDust.value.set('#6e5637'); su.uCloud.value.set('#2a221a');
      this.skirt = new THREE.Mesh(funnelGeo, this.skirtMat); this.skirt.frustumCulled = false; this.skirt.renderOrder = 2; this.group.add(this.skirt);
    }
    // its phases (still `bands` in the code and the save): the health it fights in, each with the height its heart sits at. No ring
    // since 2.14: the funnel is what you shoot, and what you see hurt
    this.bands = []; if (!this.mini) for (const v of BAND_V[def.bands]) this.bands.push({ v, exposed: false, strain: 0, gone: false });
    this.rage = 0; this.wound = 0; this.heartK = 0; this.heartR = 10; this.heart = new THREE.Vector3(); this.tear = 0; this.tearAt = new THREE.Vector3(); this.vein = 0; this.veinT = 2;
  }
  dispose() { this.scene.remove(this.group); this.mat.dispose(); if (this.skirtMat) this.skirtMat.dispose(); this.debris.material.dispose(); this.debris.geometry.dispose(); }
  get band() { return this.bands.find((b) => !b.gone) || null; }
  get bandsLeft() { let n = 0; for (const b of this.bands) if (!b.gone) n++; return n; }
  get eatRadius() { return this.def.r0 * this.thin * 1.5 + 6; }
  get killRadius() { return this.def.killR * (0.55 + 0.45 * this.thin); }
  get shadowR() { return this.def.r0 * 2 + 40; }
  get wallR() { return this.def.r1 * 3.4; }
  spineAt(v, out) { const w = this.wob * (1 + this.writhe) * Math.sin(Math.PI * v), k = v * v * this.height * 0.45; return out.set(this.lean.x * k + Math.sin(v * 4 + this.t * 1.1) * w, 0, this.lean.y * k + Math.cos(v * 3.3 + this.t * 0.9) * w); }
  radiusAt(v) { const r0 = this.def.r0 * this.thin; return r0 + (this.def.r1 * (0.45 + 0.55 * this.thin) - r0) * Math.pow(v, this.pow) + r0 * 1.3 * Math.exp(-v * 14); }
  // where a harpoon bites: on the band, on the side facing (px,pz)
  seam(band, px, pz, out) { this.spineAt(band.v, out); const cx = this.x + out.x, cz = this.z + out.z, d = Math.hypot(px - cx, pz - cz) || 1, r = this.radiusAt(band.v) * 1.1; return out.set(cx + (px - cx) / d * r, this.groundY + band.v * this.height, cz + (pz - cz) / d * r); }
  place(x, z) { this.x = this.ax = x; this.z = this.az = z; this.groundY = this.world.heightAt(x, z); }
  // a phase lost: it tears where its heart was, and comes back angrier
  snapBand(band) { band.gone = true; this.thinTarget = 0.42 + 0.58 * this.bandsLeft / this.bands.length; this.tear = 1; this.tearAt.set(this.heart.x - this.x, this.heart.y - this.groundY, this.heart.z - this.z); this.rage = 1 - this.bandsLeft / this.bands.length; this.vein = 1; }
  // where its heart shows: on the funnel's wall at the phase's height, on the side toward (px, py, pz)
  setHeart(px, pz, v, k, r) { this.spineAt(v, _v); const cx = this.x + _v.x, cz = this.z + _v.z, d = Math.hypot(px - cx, pz - cz) || 1, rr = this.radiusAt(v) * 0.97; this.heart.set(cx + (px - cx) / d * rr, this.groundY + v * this.height, cz + (pz - cz) / d * rr); this.heartK = k; this.heartR = r; }
  die() { this.alive = false; this.eats = false; }

  update(dt, t) {
    this.t = t; const u = this.mat.uniforms;
    // movement: ease toward the commanded velocity, lean into it
    const tx = this.moveX * this.moveSpeed, tz = this.moveZ * this.moveSpeed, k = Math.min(1, dt * (this.tug ? 4 : 1.8)); // the line bites: it stops quickly
    this.vx += (tx - this.vx) * k; this.vz += (tz - this.vz) * k;
    const tg = this.alive ? this.tug : null, lim = this.world ? 1440 : 1e9;
    if (tg) { // on the line: the anchor travels (slowly), the funnel fights around it
      this.ax = Math.max(-lim, Math.min(lim, this.ax + this.vx * dt)); this.az = Math.max(-lim, Math.min(lim, this.az + this.vz * dt));
      this.x = this.ax + tg.ox; this.z = this.az + tg.oz;
    } else if (this.alive) {
      this.thrashX = Math.sin(t * 2.3) * this.thrash; this.thrashZ = Math.cos(t * 1.7) * this.thrash;
      this.x += (this.vx + this.thrashX) * dt; this.z += (this.vz + this.thrashZ) * dt;
      this.x = Math.max(-lim, Math.min(lim, this.x)); this.z = Math.max(-lim, Math.min(lim, this.z)); this.ax = this.x; this.az = this.z;
    }
    this.groundY = this.world.heightAt(this.x, this.z);
    this.writhe += ((tg ? tg.writhe : 0) - this.writhe) * Math.min(1, dt * 8);
    const lr = Math.min(1, dt * (tg ? 5 : 1.2)); // on the line it leans into what it is about to do, not just where it is going
    this.lean.x += (THREE.MathUtils.clamp(this.vx / 14 + (tg ? tg.lx : 0), -1.3, 1.3) - this.lean.x) * lr;
    this.lean.y += (THREE.MathUtils.clamp(this.vz / 14 + (tg ? tg.lz : 0), -1.3, 1.3) - this.lean.y) * lr;
    this.thin += (this.thinTarget - this.thin) * Math.min(1, dt * 2.5);
    if (!this.alive) { this.cut = Math.min(1.1, this.cut + dt * 0.5); this.fade = Math.max(0, 1 - Math.max(0, this.cut - 0.6) * 2.5); if (this.cut >= 1.1) this.visible = false; }
    this.group.visible = this.visible; this.group.position.set(this.x, this.groundY, this.z);
    u.uSpin.value = this.spin; u.uWob.value = this.wob * (1 + this.writhe + 0.3 * this.rage); u.uThin.value = this.thin; u.uLean.value.copy(this.lean); u.uFade.value = this.fade; u.uCut.value = this.cut;
    if (this.skirtMat) { const su = this.skirtMat.uniforms; su.uSpin.value = this.spin; su.uThin.value = 0.55 + 0.45 * this.thin; su.uLean.value.set(0, 0); su.uFade.value = this.fade * 0.82; su.uCut.value = Math.min(1, this.cut * 2.2); }
    if (this.cows) { // orbit, tumble, moo
      const k = this.fade * Math.max(0, 1 - this.cut * 2);
      this.cowSeed.forEach((c, i) => { const v = c.v + 0.05 * Math.sin(t * 0.5 + i), a = c.a + t * this.spin * c.w * 1.3, r = this.radiusAt(v) * c.r + 8; this.spineAt(v, _v); cowDummy.position.set(_v.x + Math.cos(a) * r, v * this.height, _v.z + Math.sin(a) * r); cowDummy.rotation.set(t * 1.7 * c.w + i, a, t * 1.1 + i * 2); cowDummy.scale.setScalar(c.s * k); cowDummy.updateMatrix(); this.cows.setMatrixAt(i, cowDummy.matrix); });
      this.cows.instanceMatrix.needsUpdate = true;
    }
    this.spineAt(1, this.topOffset);
    // alive: lightning inside it now and then (more often the angrier it is), the tear healing, the heart where it was set
    if (!this.mini) {
      this.veinT -= dt; if (this.veinT <= 0 && this.alive) { this.vein = 1; this.veinT = (2.4 + Math.random() * 3.5) / (1 + 1.5 * this.rage); }
      this.vein = Math.max(0, this.vein - dt * 4.5); this.tear = Math.max(0, this.tear - dt * 0.55);
      const f = this.vein > 0 ? this.vein * (0.55 + 0.45 * Math.sin(t * 61)) : 0;
      u.uVein.value = f * this.fade; u.uRage.value += (this.rage - u.uRage.value) * Math.min(1, dt * 2); u.uWound.value += (Math.min(1, this.wound + (this.hit || 0) * 0.25) - u.uWound.value) * Math.min(1, dt * 6);
      u.uHeart.value.copy(this.heart); u.uHeartR.value = this.heartR; u.uHeartK.value += ((this.alive ? this.heartK : 0) * this.fade - u.uHeartK.value) * Math.min(1, dt * 5); u.uTear.value.set(this.x + this.tearAt.x, this.groundY + this.tearAt.y, this.z + this.tearAt.z, this.tear); // it moves with the storm
    }
  }
}
