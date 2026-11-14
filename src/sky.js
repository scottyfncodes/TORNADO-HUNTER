// Sky dome (storm shelf over a clear morning horizon), the rotating wall cloud, rain, and the light.
import * as THREE from '../vendor/three.module.min.js';
import { noiseTexture } from './geo.js';

const S = 'assets/materials/';

export class Sky {
  constructor(scene, camera, low = false) {
    this.scene = scene; this.camera = camera; this.low = low; this.storm = 1; this.flash = 0; this.flashT = 0; this.vis = 1; this.ice = 0; this.calm = false; // vis: fog distance multiplier (hail); ice: 0..1 hail in the air
    const noise = noiseTexture(128, 11);
    // one set of uniforms every weather shader shares
    this.uniforms = {
      uNoise: { value: noise }, uTime: { value: 0 }, uStorm: { value: 1 }, uFlash: { value: 0 },
      uTint: { value: new THREE.Color(1, 1, 1) }, uFog: { value: new THREE.Color('#6f8280') }, uFogNear: { value: 250 }, uFogFar: { value: 2600 },
      uTor: { value: new THREE.Vector3(0, 0, 1) }, uCloud: { value: new THREE.Color('#16282a') }, uCloudLit: { value: new THREE.Color('#3d5a52') },
      // the light under the shelf (2.15): a dusty gold horizon behind the storm as you see it, the storm's shadow reaching toward you
      uTorDir: { value: new THREE.Vector2(0, 1) }, uGold: { value: new THREE.Color('#c9a466') }, uGoldHaze: { value: new THREE.Color('#9c9072') }, uGoldK: { value: 0 },
    };
    this.goldK = 0; this.shade = 1; // shade: how much light reaches what the camera is following (0.42 deep under the storm .. 1)
    scene.fog = new THREE.Fog('#6f8280', 250, 2600);
    this.hemi = new THREE.HemisphereLight('#9fc0c4', '#b5a66a', 1.2); scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#ffe2b0', 2.2); this.sun.position.set(0.97, 0.3, 0.09); scene.add(this.sun);
  }

  async load() {
    const loader = new THREE.TextureLoader();
    const [eq, cube, info] = await Promise.all([
      loader.loadAsync(S + 'sky_equirect.png'),
      new THREE.CubeTextureLoader().loadAsync([S + 'sky_px.png', S + 'sky_nx.png', S + 'sky_py.png', S + 'sky_ny.png', S + 'sky_pz.png', S + 'sky_nz.png']),
      fetch(S + 'sky.sky.json').then((r) => r.json()),
    ]);
    eq.colorSpace = THREE.SRGBColorSpace; eq.wrapS = THREE.RepeatWrapping; cube.colorSpace = THREE.SRGBColorSpace;
    this.envMap = cube; this.info = info;
    const sd = info.sun_direction_yup; this.sunDir = new THREE.Vector3(sd[0], Math.max(0.22, sd[1]), sd[2]).normalize(); this.sun.position.copy(this.sunDir);
    this.clearHorizon = new THREE.Color().setRGB(info.horizon_rgb[0], info.horizon_rgb[1], info.horizon_rgb[2], THREE.SRGBColorSpace);
    this.clearAmbient = new THREE.Color().setRGB(info.ambient_rgb[0], info.ambient_rgb[1], info.ambient_rgb[2], THREE.SRGBColorSpace);
    const u = this.uniforms;
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(6000, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, defines: this.low ? { LOW: 1 } : {},
      uniforms: { uSky: { value: eq }, uNoise: u.uNoise, uTime: u.uTime, uStorm: u.uStorm, uFlash: u.uFlash, uCloud: u.uCloud, uCloudLit: u.uCloudLit, uTor: u.uTor, uTorDir: u.uTorDir, uGold: u.uGold, uGoldK: u.uGoldK },
      vertexShader: `varying vec3 vDir; void main(){ vDir=normalize(position); vec4 p=projectionMatrix*viewMatrix*vec4(position+cameraPosition,1.0); gl_Position=p.xyww; }`,
      fragmentShader: `uniform sampler2D uSky,uNoise; uniform float uTime,uStorm,uFlash,uGoldK; uniform vec3 uCloud,uCloudLit,uTor,uGold; uniform vec2 uTorDir; varying vec3 vDir;
        void main(){ vec3 d=normalize(vDir);
          vec2 uv=vec2(atan(d.z,d.x)/6.2831853+0.5, asin(clamp(d.y,-1.0,1.0))/3.14159265+0.5);
          vec3 clear=texture2D(uSky,uv).rgb;
          // the strip of clear sky under the shelf goes dusty gold, strongest behind the storm: the light it is silhouetted against
          float toward=smoothstep(-0.3,0.95,dot(normalize(d.xz+vec2(1e-4)),uTorDir)), hz=smoothstep(-0.06,0.0,d.y)*(1.0-smoothstep(0.0,0.2,d.y));
          clear=mix(clear,uGold*(0.88+0.3*toward)*(1.0-0.25*smoothstep(0.02,0.2,d.y)),hz*(0.25+0.75*toward)*uGoldK);
          vec2 cp=d.xz/max(0.08,d.y+0.12);
          float n=texture2D(uNoise,cp*0.11+vec2(uTime*0.006,uTime*0.004)).r;
          #ifdef LOW
          float n2=n;
          #else
          float n2=texture2D(uNoise,cp*0.37-vec2(uTime*0.011,0.0)).r;
          #endif
          float edge=mix(1.25,0.075,uStorm);
          float cover=smoothstep(edge-0.03,edge+0.10,d.y+(n-0.5)*0.11+(n2-0.5)*0.04);
          vec3 cloud=mix(uCloud,uCloudLit,n*0.65+n2*0.35);
          float under=1.0-smoothstep(edge,edge+0.22,d.y); cloud+=vec3(0.30,0.24,0.12)*under*under*(0.4+0.5*toward*uGoldK); // the shelf's underside catches it
          cloud+=vec3(0.75,0.85,1.0)*uFlash*(0.35+n*0.9);
          vec3 c=mix(clear,cloud,cover);
          c=mix(c,c*vec3(0.80,0.88,0.84),uStorm*(1.0-cover)*0.5);
          gl_FragColor=vec4(c,1.0);
          #include <colorspace_fragment>
        }`,
    }));
    this.dome.renderOrder = -10; this.dome.frustumCulled = false; this.scene.add(this.dome);
    // the storm sky as a reflection (2.17): the dome alone (layer 1), rendered into a small cube twice a second where the camera is,
    // so steel shows the shelf and the gold strip under it rather than the clear morning the cube map was baked from. Not on the low tier
    if (!this.low) { this.cubeRT = new THREE.WebGLCubeRenderTarget(64, { type: THREE.HalfFloatType }); this.cubeCam = new THREE.CubeCamera(1, 12000, this.cubeRT); this.cubeCam.layers.set(1); this.dome.layers.enable(1); this.stormEnv = this.cubeRT.texture; this.capT = 0; }
    // the wall cloud: a rotating collar the funnel hangs from
    this.wall = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      uniforms: { uNoise: u.uNoise, uTime: u.uTime, uFlash: u.uFlash, uCloud: u.uCloud, uCloudLit: u.uCloudLit, uSpin: { value: 1 }, uAlpha: { value: 1 } },
      vertexShader: `varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform sampler2D uNoise; uniform float uTime,uFlash,uSpin,uAlpha; uniform vec3 uCloud,uCloudLit; varying vec2 vP;
        void main(){ float r=length(vP); float a=atan(vP.y,vP.x)/6.2831853;
          float sw=texture2D(uNoise,vec2(a*3.0+uTime*0.05*uSpin+r*1.2, r*1.6-uTime*0.02)).r; float sw2=texture2D(uNoise,vec2(a*7.0+uTime*0.09*uSpin, r*4.0)).r;
          vec3 c=mix(uCloud*0.55,uCloudLit*0.9,sw*0.7+sw2*0.3)*(0.55+0.45*smoothstep(0.0,0.5,r));
          c+=vec3(0.7,0.8,1.0)*uFlash*sw;
          float al=(1.0-smoothstep(0.55,1.0,r+(sw-0.5)*0.25))*uAlpha;
          gl_FragColor=vec4(c,al);
          #include <colorspace_fragment>
        }`,
    }));
    this.wall.rotation.x = Math.PI / 2; this.wall.renderOrder = 1; this.scene.add(this.wall);
    // rain: streaks in a box that follows the camera, wrapped in the vertex shader
    const COUNT = 700, pos = new Float32Array(COUNT * 6), seed = new Float32Array(COUNT * 2);
    for (let i = 0; i < COUNT; i++) { const x = Math.random(), y = Math.random(), z = Math.random(); pos.set([x, y, z, x, y, z], i * 6); seed.set([0, 1], i * 2); }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); rg.setAttribute('aEnd', new THREE.BufferAttribute(seed, 1));
    this.rain = new THREE.LineSegments(rg, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false,
      uniforms: { uTime: u.uTime, uAmount: { value: 0 }, uWind: { value: new THREE.Vector3(0.3, -1, 0.1) }, uStreak: { value: new THREE.Vector3(0.8, -2.6, 0.3) }, uCam: { value: new THREE.Vector3() } },
      vertexShader: `attribute float aEnd; uniform float uTime,uAmount; uniform vec3 uWind,uCam,uStreak; varying float vA;
        void main(){ vec3 box=vec3(70.0,44.0,70.0); vec3 p=position*box; p+=uWind*uTime*46.0; p=mod(p-uCam,box)-box*0.5; p+=uStreak*aEnd;
          vA=uAmount*step(position.x*0.999,uAmount+0.2); gl_Position=projectionMatrix*viewMatrix*vec4(p+uCam,1.0); }`,
      fragmentShader: `varying float vA; void main(){ gl_FragColor=vec4(0.78,0.86,0.88,0.34*vA); }`,
    }));
    this.rain.frustumCulled = false; this.rain.renderOrder = 6; this.scene.add(this.rain);
    return this;
  }

  capture(renderer, dt) { if (!this.cubeCam) return; this.capT -= dt; if (this.capT > 0) return; this.capT = 0.5; this.cubeCam.position.copy(this.camera.position); this.cubeCam.update(renderer, this.scene); this.stormEnv.needsPMREMUpdate = true; }
  strike(power = 1) { this.flash = Math.max(this.flash, power); }
  setRain(on) { this.rain.visible = on; }

  // storm 0 (clear morning) .. 1 (under the shelf); tornado gives the wall cloud and ground shadow a centre
  update(dt, t, stormTarget, tor, prox, mover) {
    const u = this.uniforms; u.uTime.value = t;
    this.storm += (stormTarget - this.storm) * Math.min(1, dt * (stormTarget < this.storm ? 0.7 : 2));
    this.flash = Math.max(0, this.flash - dt * 3.2);
    // one stroke and a fainter return stroke, never a strobe; calm mode gets a single soft pulse
    const fl = this.calm ? this.flash * 0.4 : this.flash * (0.78 + 0.22 * Math.sin(t * 30)); u.uFlash.value = fl; u.uStorm.value = this.storm;
    const s = this.storm, dark = 1 - 0.16 * s - 0.14 * s * prox;
    u.uTint.value.setRGB(dark * (1 - 0.06 * s), dark, dark * (1 - 0.03 * s));
    u.uFog.value.copy(this.clearHorizon).lerp(_stormFog, s * 0.85).lerp(_iceFog, this.ice * 0.55); this.scene.fog.color.copy(u.uFog.value);
    // hail closes the distance in; a lightning flash throws it open again for a moment, and whatever was out there shows
    const see = (1 - (1 - this.vis) * (1 - Math.min(1, fl * 1.4))) * (1 + fl * 0.5);
    u.uFogNear.value = this.scene.fog.near = (260 - 120 * s * prox) * (0.4 + 0.6 * see); u.uFogFar.value = this.scene.fog.far = (3000 - 1300 * s) * see;
    this.hemi.intensity = (2.2 - 0.5 * s) * (1 + fl * 2.5); this.hemi.color.copy(this.clearAmbient).lerp(_stormSky, s);
    // the light comes from behind the storm as you see it: the gold strip, the sun swung round under the shelf (low, so it rakes),
    // and the storm's shadow reaching across the ground toward you. What the camera follows darkens with the ground under it
    const cam = this.camera.position, gk = tor && tor.visible ? s * tor.fade : 0; this.goldK += (gk - this.goldK) * Math.min(1, dt * 1.5); u.uGoldK.value = this.goldK;
    if (tor) { _w.set(tor.x - cam.x, 0, tor.z - cam.z); if (_w.lengthSq() > 1) { _w.normalize(); const td = u.uTorDir.value, k = Math.min(1, dt * 2); td.x += (_w.x - td.x) * k; td.y += (_w.z - td.y) * k; td.normalize(); } }
    const TD = u.uTorDir.value, sd = this.sunDir || this.sun.position, b = 0.7 * this.goldK; _s.set(sd.x + (TD.x - sd.x) * b, 0, sd.z + (TD.y - sd.z) * b).normalize(); this.sun.position.set(_s.x, sd.y + (0.26 - sd.y) * b, _s.z);
    const subj = mover || cam; this.shade = 1;
    if (tor && tor.alive) { const r = tor.shadowR, rx = subj.x - tor.x, rz = subj.z - tor.z, al = -(rx * TD.x + rz * TD.y), ac = -rx * TD.y + rz * TD.x, td = Math.hypot(ac, (al - r * 1.4) * 0.62); this.shade = 1 - (1 - (0.46 + 0.54 * sstep(r * 0.6, r * 4.5, td)) * (0.8 + 0.2 * sstep(r * 2, r * 9, td))) * this.goldK; }
    const lit = this.shade; this.sun.intensity = (2.4 - 0.9 * s) * (0.3 + 0.7 * lit); this.hemi.intensity *= 0.72 + 0.28 * lit; this.hemi.color.lerp(_shadeSky, (1 - lit) * 0.5); this.sun.color.copy(_sunClear).lerp(_sunGold, this.goldK);
    if (tor) {
      u.uTor.value.set(tor.x, tor.z, tor.alive ? tor.shadowR : 0.001);
      this.wall.visible = tor.visible; this.wall.position.set(tor.x + tor.topOffset.x, tor.groundY + tor.height + 6, tor.z + tor.topOffset.z);
      this.wall.scale.setScalar(tor.wallR); this.wall.material.uniforms.uSpin.value = tor.spin; this.wall.material.uniforms.uAlpha.value = tor.fade * Math.min(1, s * 1.4);
    } else { u.uTor.value.set(0, 0, 0.001); this.wall.visible = false; }
    this.rain.material.uniforms.uAmount.value = s * (0.45 + 0.55 * prox); this.rain.material.uniforms.uCam.value.copy(this.camera.position);
    if (tor) { _w.set(tor.x - this.camera.position.x, 0, tor.z - this.camera.position.z).normalize(); this.rain.material.uniforms.uWind.value.set(_w.x * 0.35 + _w.z * 0.2 * tor.spin, -1, _w.z * 0.35 - _w.x * 0.2 * tor.spin); }
    // at speed the rain comes at you: streaks stretch back along your own velocity (the cheapest honest speed cue there is)
    const st = this.rain.material.uniforms.uStreak.value, wv = this.rain.material.uniforms.uWind.value; if (mover) st.set(wv.x * 2.6 - mover.vx * 0.055, -2.6, wv.z * 2.6 - mover.vz * 0.055); else st.set(wv.x * 2.6, -2.6, wv.z * 2.6);
  }
}
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const _sunClear = new THREE.Color('#ffe2b0'), _sunGold = new THREE.Color('#ffd296'), _shadeSky = new THREE.Color('#7f9aa6'), _s = new THREE.Vector3();
const _iceFog = new THREE.Color('#93a8a6'), _stormFog = new THREE.Color('#42585a'), _stormSky = new THREE.Color('#7fa6a2'), _w = new THREE.Vector3();
