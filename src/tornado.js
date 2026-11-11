// The storm: a funnel bent along a wobbling spine in the vertex shader, radar-coloured bands, GPU debris.
import * as THREE from '../vendor/three.module.min.js';
import { PALETTE } from './config.js';

// the same spine and radius maths runs here (JS) and in the shaders (GLSL): keep them in step
const SPINE_GLSL = `
uniform float uH,uR0,uR1,uPow,uWob,uTime,uSpin,uThin; uniform vec2 uLean;
vec2 spine(float v){ return uLean*v*v*uH*0.45 + vec2(sin(v*4.0+uTime*1.1),cos(v*3.3+uTime*0.9))*uWob*sin(3.14159*v); }
float radius(float v){ return mix(uR0*uThin,uR1*(0.45+0.55*uThin),pow(v,uPow)) + uR0*uThin*1.3*exp(-v*14.0); }`;

const funnelGeo = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 28, 24, true); g.translate(0, 0.5, 0); return g; })();
const ringGeo = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 48, 1, true); return g; })();
const debrisGeo = new THREE.BoxGeometry(1, 1, 1);

function funnelMaterial(shared, params) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: {
      uNoise: shared.uNoise, uTime: shared.uTime, uFlash: shared.uFlash, uFog: shared.uFog, uFogNear: shared.uFogNear, uFogFar: shared.uFogFar, uCloud: shared.uCloud,
      uH: { value: params.height }, uR0: { value: params.r0 }, uR1: { value: params.r1 }, uPow: { value: params.pow }, uWob: { value: params.wob }, uSpin: { value: 1 }, uThin: { value: 1 },
      uLean: { value: new THREE.Vector2() }, uFade: { value: 1 }, uCut: { value: 0 }, uCore: { value: 0 },
      uColA: { value: new THREE.Color('#1d2a2b') }, uColB: { value: new THREE.Color('#5d6b62') }, uDust: { value: new THREE.Color('#b89a58') }, uHot: { value: new THREE.Color(PALETTE.accent) },
    },
    vertexShader: `${SPINE_GLSL}
      varying vec2 vUv; varying float vV; varying vec3 vN; varying vec3 vW;
      void main(){ float v=position.y; vV=v; float a=atan(position.z,position.x);
        float r=radius(v)*(1.0+0.07*sin(v*11.0-uTime*2.2+a*2.0));
        vec2 sp=spine(v); vec3 p=vec3(cos(a)*r+sp.x, v*uH, sin(a)*r+sp.y);
        vUv=vec2(a/6.2831853+0.5,v); vN=normalize(mat3(modelMatrix)*vec3(cos(a),0.3,sin(a)));
        vec4 w=modelMatrix*vec4(p,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform sampler2D uNoise; uniform float uTime,uSpin,uFade,uCut,uCore,uFlash,uFogNear,uFogFar; uniform vec3 uColA,uColB,uDust,uHot,uCloud,uFog;
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
        c+=vec3(0.16,0.2,0.18)*rim*rim; c+=uHot*uCore*(0.25+0.75*pow(1.0-rim,2.0))*(0.6+0.4*s2)*(1.0-smoothstep(0.0,0.5,vV));
        c*=1.0+uFlash*1.6;
        float al=mix(0.97,0.5,pow(rim,2.2))*(0.82+0.3*n);
        al*=uFade*smoothstep(uCut-0.04,uCut+0.06,vV+(n-0.5)*0.08);
        float f=smoothstep(uFogNear,uFogFar*1.4,distance(vW,cameraPosition)); c=mix(c,uFog,f*0.75);
        gl_FragColor=vec4(c,clamp(al,0.0,1.0));
        #include <colorspace_fragment>
      }`,
  });
}

function ringMaterial(shared) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    uniforms: { uTime: shared.uTime, uColor: { value: new THREE.Color(PALETTE.signal) }, uProgress: { value: 0 }, uState: { value: 0 }, uAlpha: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime,uProgress,uState,uAlpha; uniform vec3 uColor; varying vec2 vUv;
      void main(){ float seg=fract(vUv.x*18.0+uTime*0.25); float edge=smoothstep(0.5,0.42,abs(vUv.y-0.5));
        float shroud=step(0.5,seg)*0.13;
        float lit=step(seg,0.12+0.88*uProgress); float live=mix(0.42,1.0,lit)*(0.85+0.15*sin(uTime*9.0));
        float a=mix(shroud,live,step(0.5,uState))*edge*uAlpha;
        vec3 c=mix(vec3(0.55,0.62,0.6),uColor*(1.0+0.6*lit),step(0.5,uState));
        gl_FragColor=vec4(c,a);
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

const BAND_V = { 1: [0.12], 2: [0.16, 0.075], 3: [0.19, 0.125, 0.06] };
const _v = new THREE.Vector3();

export class Storm {
  constructor(scene, shared, def, world, opts = {}) {
    this.scene = scene; this.def = def; this.world = world; this.mini = !!opts.mini;
    this.x = 0; this.z = 0; this.groundY = 0; this.vx = 0; this.vz = 0; this.spin = 1; this.height = def.height;
    this.alive = true; this.visible = true; this.fade = 1; this.thin = 1; this.thinTarget = 1; this.eats = !this.mini; this.t = 0; this.cut = 0;
    this.moveX = 0; this.moveZ = 0; this.moveSpeed = 0; this.lean = new THREE.Vector2(); this.topOffset = new THREE.Vector3(); this.thrash = 0; this.thrashX = 0; this.thrashZ = 0;
    this.pow = def.pow || (def.type === 'Wedge' ? 1.25 : def.type === 'Rope' ? 2.2 : 1.7); this.wob = def.wob || (def.type === 'Rope' ? 12 : 7);
    this.group = new THREE.Group(); scene.add(this.group);
    this.mat = funnelMaterial(shared, { height: def.height, r0: def.r0, r1: def.r1, pow: this.pow, wob: this.wob });
    this.funnel = new THREE.Mesh(funnelGeo, this.mat); this.funnel.frustumCulled = false; this.funnel.renderOrder = 2; this.group.add(this.funnel);
    this.debris = debrisMesh(shared, this.mat.uniforms, this.mini ? 24 : 150); this.group.add(this.debris);
    // the dirt it is chewing: a low, wide, dark skirt around the base (skipped on weak GPUs: it is a lot of pixels)
    if (!this.mini && !opts.low) {
      this.skirtMat = funnelMaterial(shared, { height: 44 + def.r0, r0: def.r0 * 1.9 + 9, r1: def.r0 * 3.0 + 22, pow: 0.75, wob: 2.5 });
      const su = this.skirtMat.uniforms; su.uColA.value.set('#1c1712'); su.uColB.value.set('#5a4733'); su.uDust.value.set('#6e5637'); su.uCloud.value.set('#2a221a');
      this.skirt = new THREE.Mesh(funnelGeo, this.skirtMat); this.skirt.frustumCulled = false; this.skirt.renderOrder = 2; this.group.add(this.skirt);
    }
    this.bands = [];
    if (!this.mini) for (const v of BAND_V[def.bands]) {
      const mesh = new THREE.Mesh(ringGeo, ringMaterial(shared)); mesh.frustumCulled = false; mesh.renderOrder = 3; this.group.add(mesh);
      this.bands.push({ v, mesh, exposed: false, strain: 0, gone: false, burst: 0 });
    }
  }
  dispose() { this.scene.remove(this.group); this.mat.dispose(); if (this.skirtMat) this.skirtMat.dispose(); for (const b of this.bands) b.mesh.material.dispose(); this.debris.material.dispose(); this.debris.geometry.dispose(); }
  get band() { return this.bands.find((b) => !b.gone) || null; }
  get bandsLeft() { let n = 0; for (const b of this.bands) if (!b.gone) n++; return n; }
  get eatRadius() { return this.def.r0 * this.thin * 1.5 + 6; }
  get killRadius() { return this.def.killR * (0.55 + 0.45 * this.thin); }
  get shadowR() { return this.def.r0 * 2 + 40; }
  get wallR() { return this.def.r1 * 3.4; }
  spineAt(v, out) { const w = this.wob * Math.sin(Math.PI * v), k = v * v * this.height * 0.45; return out.set(this.lean.x * k + Math.sin(v * 4 + this.t * 1.1) * w, 0, this.lean.y * k + Math.cos(v * 3.3 + this.t * 0.9) * w); }
  radiusAt(v) { const r0 = this.def.r0 * this.thin; return r0 + (this.def.r1 * (0.45 + 0.55 * this.thin) - r0) * Math.pow(v, this.pow) + r0 * 1.3 * Math.exp(-v * 14); }
  // where a harpoon bites: on the band, on the side facing (px,pz)
  seam(band, px, pz, out) { this.spineAt(band.v, out); const cx = this.x + out.x, cz = this.z + out.z, d = Math.hypot(px - cx, pz - cz) || 1, r = this.radiusAt(band.v) * 1.1; return out.set(cx + (px - cx) / d * r, this.groundY + band.v * this.height, cz + (pz - cz) / d * r); }
  place(x, z) { this.x = x; this.z = z; this.groundY = this.world.heightAt(x, z); }
  snapBand(band) { band.gone = true; band.burst = 0.001; this.thinTarget = 0.42 + 0.58 * this.bandsLeft / this.bands.length; }
  die() { this.alive = false; this.eats = false; }

  update(dt, t) {
    this.t = t; const u = this.mat.uniforms;
    // movement: ease toward the commanded velocity, lean into it
    const tx = this.moveX * this.moveSpeed, tz = this.moveZ * this.moveSpeed, k = Math.min(1, dt * 1.8);
    this.vx += (tx - this.vx) * k; this.vz += (tz - this.vz) * k;
    if (this.alive) {
      this.thrashX = Math.sin(t * 2.3) * this.thrash; this.thrashZ = Math.cos(t * 1.7) * this.thrash;
      this.x += (this.vx + this.thrashX) * dt; this.z += (this.vz + this.thrashZ) * dt;
      const lim = this.world ? 1440 : 1e9; this.x = Math.max(-lim, Math.min(lim, this.x)); this.z = Math.max(-lim, Math.min(lim, this.z));
    }
    this.groundY = this.world.heightAt(this.x, this.z);
    this.lean.x += (THREE.MathUtils.clamp(this.vx / 14, -1.3, 1.3) - this.lean.x) * Math.min(1, dt * 1.2);
    this.lean.y += (THREE.MathUtils.clamp(this.vz / 14, -1.3, 1.3) - this.lean.y) * Math.min(1, dt * 1.2);
    this.thin += (this.thinTarget - this.thin) * Math.min(1, dt * 2.5);
    if (!this.alive) { this.cut = Math.min(1.1, this.cut + dt * 0.5); this.fade = Math.max(0, 1 - Math.max(0, this.cut - 0.6) * 2.5); if (this.cut >= 1.1) this.visible = false; }
    this.group.visible = this.visible; this.group.position.set(this.x, this.groundY, this.z);
    u.uSpin.value = this.spin; u.uThin.value = this.thin; u.uLean.value.copy(this.lean); u.uFade.value = this.fade; u.uCut.value = this.cut;
    if (this.skirtMat) { const su = this.skirtMat.uniforms; su.uSpin.value = this.spin; su.uThin.value = 0.55 + 0.45 * this.thin; su.uLean.value.set(0, 0); su.uFade.value = this.fade * 0.82; su.uCut.value = Math.min(1, this.cut * 2.2); }
    this.spineAt(1, this.topOffset);
    for (const b of this.bands) {
      const m = b.mesh, mu = m.material.uniforms;
      if (b.gone) { if (b.burst > 0) { b.burst += dt * 2.2; const s = 1 + b.burst * 1.6; m.scale.multiplyScalar(1 + dt * 3); mu.uAlpha.value = Math.max(0, 1 - b.burst); mu.uProgress.value = 1; if (b.burst >= 1) { b.burst = 0; m.visible = false; } } continue; }
      this.spineAt(b.v, _v); const r = this.radiusAt(b.v) * 1.16 + 2.5;
      m.position.set(_v.x, b.v * this.height, _v.z); m.scale.set(r, 7 + r * 0.05, r);
      const current = b === this.band;
      mu.uState.value = b.exposed ? 1 : 0; mu.uProgress.value = b.strain; mu.uAlpha.value = this.fade * (current ? 1 : 0.55);
      mu.uColor.value.set(b.tone || (!b.exposed ? '#8a9a96' : PALETTE.signal));
    }
  }
}
