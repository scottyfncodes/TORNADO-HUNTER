// One mission: the tether fight. Probe, harpoon, orbit against the spin, snap the bands, drive through the eye.
import * as THREE from '../vendor/three.module.min.js';
import { FEEL, PALETTE, CREW } from './config.js';
import { Storm } from './tornado.js';
import { TOWNS } from './world.js';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SAT_RING = new THREE.RingGeometry(7, 8.6, 28), SAT_MAT = new THREE.MeshBasicMaterial({ color: PALETTE.accent, transparent: true, opacity: 0.85, depthWrite: false, fog: false, side: THREE.DoubleSide });

export class Mission {
  constructor(G, def, loadout, upgrades, opts = {}) {
    this.G = G; this.def = def; this.coach = !!opts.coach; this.ef = def.ef + (opts.rematch || 0); this.rematch = opts.rematch || 0;
    const has = (id) => loadout.crew.includes(id), up = upgrades;
    this.crew = loadout.crew.map((id) => CREW.find((c) => c.id === id)); this.gadget = loadout.gadget;
    this.p = {
      probeRange: FEEL.probeRange * (has('doc') ? 1.4 : 1), teleBonus: has('doc') ? 0.3 : 0,
      sweet: FEEL.tetherSweetBand * (has('winch') ? 1.4 : 1) * (1 + up.cable * 0.1), snapAfter: FEEL.tetherSnapAfter * (has('winch') ? 1.6 : 1),
      harpoonRange: FEEL.harpoonRange * (1 + up.cable * 0.1), wind: 1 + up.winch * 0.12, regen: has('sparks') ? 1.3 : 0,
      magnet: has('june') ? 3 : 1, dataMul: (has('june') ? 1.2 : 1) * (1 + this.rematch * 0.5), tele: 1 - this.rematch * 0.12,
    };
    this.town = TOWNS[def.id]; this.pay = def.pay;
    const w = G.world, sx = this.town.x + this.town.from[0] * def.start, sz = this.town.z + this.town.from[1] * def.start;
    this.storm = new Storm(G.scene, G.sky.uniforms, def, w); this.storm.place(sx, sz); this.startDist = def.start;
    // rig: off to one side of the storm's path, on a road, pointed at it
    const ang = Math.atan2(-this.town.from[1], -this.town.from[0]) + 0.95, rx0 = sx + Math.cos(ang) * 430, rz0 = sz + Math.sin(ang) * 430;
    const rx = clamp(w.nearestRoadLine(rx0), -1300, 1300), rz = clamp(rz0, -1400, 1400);
    this.rig = G.makeRig(); this.rig.place(rx, rz, Math.atan2(sx - rx, sz - rz), w);
    this.phase = 'intro'; this.time = 0; this.phaseT = 0; this.data = 0; this.dataShown = 0; this.result = null; this.pickups = 0;
    this.line = null; this.line2 = null; this.anchor = null; this.reload = 0; this.probeBusy = false; this.harpoonBusy = false;
    this.attackT = 5; this.surge = 0; this.lunge = 0; this.bolt = 0; this.sats = []; this.reversePending = false; this.reversed = false;
    this.gadgetCd = 0; this.strainRate = 0; this.tension = null; this.orbit = 0; this.crossfire = false; this.dist = 999; this.wrongWay = 0;
    this.stage = 0; this.bark = null; this.barkT = 0; this.callout = null; this.calloutT = 0; this.stats = { snaps: 0, lineSnaps: 0, hits: 0, probes: 0 };
    this.say('start'); this.spawnSats();
  }
  dispose() { this.storm.dispose(); for (const s of this.sats) { s.storm.dispose(); this.G.scene.remove(s.mark); } this.rig.dispose(); this.G.fx.reset(); }

  say(key, who) { const c = who || this.crew[(Math.random() * this.crew.length) | 0]; if (!c) return; this.bark = { name: c.name, text: c.barks[key] }; this.barkT = 3.6; }
  call(text, tone = 'warn', dur = 1.6) { this.callout = { text, tone }; this.calloutT = dur; }
  windSeconds() { return FEEL.bandWindSeconds * this.def.windMul * (1 + this.rematch * 0.2) / this.p.wind; }
  earn(n) { this.data += n * this.p.dataMul; }

  spawnSats() {
    for (const s of this.sats) { s.storm.dispose(); this.G.scene.remove(s.mark); } this.sats = [];
    const n = this.def.satellites ? this.def.satellites[Math.min(this.stage, this.def.satellites.length - 1)] : 0;
    for (let i = 0; i < n; i++) {
      const st = new Storm(this.G.scene, this.G.sky.uniforms, { ...this.def, r0: 3.2, r1: 16, height: 80, bands: 0, type: 'Rope', wob: 3 }, this.G.world, { mini: true });
      const mark = new THREE.Mesh(SAT_RING, SAT_MAT); mark.rotation.x = -Math.PI / 2; mark.renderOrder = 4; this.G.scene.add(mark);
      this.sats.push({ storm: st, mark, ang: (i / n) * 6.283 + 1 + Math.PI * (this.storm.spin > 0 ? 0 : 1), rad: FEEL.tetherLength + (i % 2 ? 5 : -3), hit: 0 });
    }
  }

  // ---- actions ----
  action() {
    const s = this.storm;
    if (this.phase === 'hunt' && !this.probeBusy && this.dist < this.p.probeRange) {
      this.probeBusy = true; this.stats.probes++; this.G.audio.probeLaunch(); this.say('probe');
      this.G.fx.launchPod(this.rig.muzzle(_a), s, () => {
        this.probeBusy = false; if (this.phase !== 'hunt') return; const b = s.band; if (!b) return; b.exposed = true; this.phase = 'exposed'; this.phaseT = 0;
        this.G.audio.ping(); this.earn(10); s.seam(b, this.rig.x, this.rig.z, _a); this.G.fx.energy.play(_a.x, _a.y, _a.z, 30, 30, { fps: 40 }); this.call('BAND EXPOSED', 'good');
      });
      return true;
    }
    if ((this.phase === 'exposed' || (this.phase === 'tethered' && this.anchor && !this.line)) && !this.harpoonBusy && this.reload <= 0 && this.dist < this.p.harpoonRange) {
      const b = s.band; if (!b) return false; this.harpoonBusy = true; this.G.audio.harpoon();
      this.G.fx.launchHarpoon(this.rig.muzzle(_a), (out) => s.seam(b, this.rig.x, this.rig.z, out), () => {
        this.harpoonBusy = false; if (!s.band || s.band !== b || (this.phase !== 'exposed' && this.phase !== 'tethered')) { this.G.fx.hideCable(0); return; }
        this.line = { L: clamp(this.dist, 82, 122), grace: FEEL.tetherGrace, over: 0 }; this.phase = 'tethered'; this.phaseT = 0;
        this.G.audio.twang(); this.G.fx.hitStop(FEEL.hitStopHarpoon); this.G.fx.shake(5); s.seam(b, this.rig.x, this.rig.z, _a); this.G.fx.energy.play(_a.x, _a.y, _a.z, 22, 22, { fps: 48 });
      });
      return true;
    }
    if (this.phase === 'tethered' && this.line && this.tension > 1) { this.dropLine(false); return true; }
    return false;
  }
  actionState() {
    const ph = this.phase;
    if (ph === 'hunt') return { label: 'PROBE', ready: this.dist < this.p.probeRange && !this.probeBusy, hint: this.probeBusy ? 'POD AWAY' : `${Math.max(0, Math.round(this.dist - this.p.probeRange))} m` };
    if (ph === 'exposed') return { label: 'HARPOON', ready: this.dist < this.p.harpoonRange && this.reload <= 0 && !this.harpoonBusy, hint: this.reload > 0 ? 'RELOADING' : '' };
    if (ph === 'tethered') { if (this.anchor && !this.line) return { label: 'HARPOON', ready: this.dist < this.p.harpoonRange && this.reload <= 0 && !this.harpoonBusy, hint: 'CROSSFIRE' }; if (this.tension > 1) return { label: 'CUT', ready: true, danger: true, hint: '' }; return { label: 'LINE ON', ready: false, hint: '' }; }
    if (ph === 'finisher') return { label: 'DRIVE IN', ready: false, hint: '' };
    return { label: 'CHASE', ready: false, hint: '' };
  }
  useGadget() {
    if (this.gadgetCd > 0 || this.phase === 'won' || this.phase === 'lost') return false;
    const fx = this.G.fx, r = this.rig;
    if (this.gadget === 'thumper') {
      fx.shockwave(r.x, r.z, FEEL.thumperRadius); this.G.audio.thump(); fx.shake(8); fx.cancelTelegraphs(r.x, r.z, FEEL.thumperRadius + 20); this.attackT += 2.5; this.lunge = Math.min(this.lunge, 0); this.surge = 0;
      for (const s of this.sats) if (Math.hypot(s.storm.x - r.x, s.storm.z - r.z) < FEEL.thumperRadius) { s.storm.die(); s.dead = true; }
      this.gadgetCd = FEEL.thumperCooldown; this.call('THUMP', 'good', 0.8); return true;
    }
    if (this.gadget === 'anchor') {
      if (this.phase !== 'tethered' || !this.line || this.anchor) { this.G.audio.deny(); return false; }
      this.anchor = { x: r.x, z: r.z, t: FEEL.anchorSeconds, L: this.line.L }; this.line = null; fx.hideCable(0); fx.setStake(true, r.x, r.z); this.G.audio.stake(); this.gadgetCd = FEEL.anchorCooldown; this.call('LINE STAKED', 'good', 1.2); return true;
    }
    return false;
  }
  dropLine(snapped) {
    const b = this.storm.band; this.line = null; this.G.fx.hideCable(0);
    if (snapped) { this.reload = FEEL.harpoonReload; this.stats.lineSnaps++; this.G.audio.lineSnap(); this.G.fx.shake(7); if (b) b.strain = Math.floor(b.strain * 4) / 4; this.call('LINE SNAPPED', 'bad'); const r = this.rig, d = this.dist || 1; r.vx += (r.x - this.storm.x) / d * 9; r.vz += (r.z - this.storm.z) / d * 9; }
    if (!this.anchor && this.phase === 'tethered') { this.phase = 'exposed'; this.phaseT = 0; this.G.fx.hideRing(); }
  }

  hurt(n, key = 'hurt') {
    if (!this.rig.damage(n)) return false; this.stats.hits++;
    const fx = this.G.fx; fx.hitStop(FEEL.hitStopHull); fx.shake(FEEL.shakeHull); fx.flash(0.5, PALETTE.accent); this.G.audio.hurt(); if (Math.random() < 0.6) this.say(key);
    fx.puff(this.rig.x, this.rig.y + 2, this.rig.z, 9, '#2a2f30', 0.8);
    if (this.rig.hull <= 0) this.end(false, 'wrecked'); return true;
  }

  // ---- storm attacks: every one lands on a ground telegraph ----
  attack() {
    const stage = Math.min(this.stage, this.def.attacks.length - 1), list = this.def.attacks[stage], kind = list[(Math.random() * list.length) | 0];
    const fx = this.G.fx, r = this.rig, s = this.storm, tele = (base) => Math.max(FEEL.telegraphMin, base * this.p.tele) + this.p.teleBonus;
    if (kind === 'debris') {
      const n = this.def.volley + (stage >= 2 ? 1 : 0) + (this.rematch ? 1 : 0), dur = tele(1.2);
      for (let i = 0; i < n; i++) {
        const lead = dur * (0.75 + i * 0.3), x = r.x + r.vx * lead + (i ? (Math.random() - 0.5) * 26 : 0), z = r.z + r.vz * lead + (i ? (Math.random() - 0.5) * 26 : 0), d = dur + i * 0.22;
        s.spineAt(0.25, _a); fx.chunk({ x: s.x + _a.x, y: s.groundY + s.height * 0.25, z: s.z + _a.z }, { x, y: fx.ground(x, z), z }, d);
        fx.telegraph(x, z, 9, d, (e) => { fx.puff(e.x, fx.ground(e.x, e.z) + 2, e.z, 16, '#b89a58', 1.1); this.G.audio.impact(); if (Math.hypot(r.x - e.x, r.z - e.z) < 8.5) this.hurt(FEEL.dmgDebris); else if (Math.hypot(r.x - e.x, r.z - e.z) < 40) fx.shake(4); });
      }
      this.G.audio.whistle(dur);
    } else if (kind === 'lightning') {
      const dur = tele(1.35), lock = dur - 0.55;
      fx.telegraph(r.x, r.z, 11, dur, (e) => {
        const y = fx.ground(e.x, e.z); fx.lightning.play(e.x, y, e.z, 120, 170, { ground: true, fps: 30 }); fx.lightning.play(e.x + 6, y, e.z - 4, 90, 150, { ground: true, fps: 36, rot: 0.1 });
        this.G.sky.strike(1); fx.flash(0.7); this.G.audio.thunder(); fx.shake(6); if (Math.hypot(r.x - e.x, r.z - e.z) < 10.5) this.hurt(FEEL.dmgLightning);
      }, { lock, track: (e, dt) => { const k = Math.min(1, dt * 5); e.x += (r.x + r.vx * 0.25 - e.x) * k; e.z += (r.z + r.vz * 0.25 - e.z) * k; } });
      this.G.audio.warn();
    } else if (kind === 'lunge') {
      const dur = tele(1.0); this.call('LUNGE', 'bad', dur); this.G.audio.warn();
      fx.telegraph(r.x, r.z, s.killRadius + 10, dur + 1.6, null); this.lungeAt = { x: r.x, z: r.z, wait: dur }; this.lunge = dur + 1.9;
    } else if (kind === 'surge') { this.call('SUCTION SURGE', 'bad', 1.4); this.G.audio.warn(); this.surgeWait = tele(0.9); }
  }

  // ---- band, finisher, end ----
  snapBand() {
    const s = this.storm, b = s.band, fx = this.G.fx, r = this.rig; if (!b) return;
    s.seam(b, r.x, r.z, _a); const bx = _a.x, by = _a.y, bz = _a.z;
    s.snapBand(b); this.stats.snaps++; this.stage++; this.line = null; this.line2 = null; this.anchor = null; fx.hideCable(0); fx.hideCable(1); fx.hideRing(); fx.setStake(false); fx.clearTelegraphs(); this.lunge = 0; this.surge = 0; this.reversePending = false;
    fx.hitStop(FEEL.hitStopBandSnap); fx.shake(FEEL.shakeBandSnap); fx.flash(1); this.G.audio.bandSnap(); this.G.sky.strike(1.2);
    fx.energy.play(bx, by, bz, 70, 70, { fps: 40 });
    const each = this.pay / 12; fx.shardBurst(s.x, s.groundY + 12, s.z, 12, r, (i) => { this.earn(each); this.pickups++; this.G.audio.pickup(i); });
    this.say('snap'); for (const st of this.sats) { st.storm.die(); st.dead = true; }
    if (s.bandsLeft === 0) { this.phase = 'finisher'; this.phaseT = 0; s.thrash = 16; this.call('CORE EXPOSED', 'good', 2.2); }
    else { this.phase = 'bolt'; this.phaseT = 0; this.bolt = 4.2; this.attackT = 4.5; this.call('BAND SNAPPED', 'good', 1.6); const td = Math.hypot(this.town.x - s.x, this.town.z - s.z) || 1, d = this.dist || 1; let bx2 = (s.x - r.x) / d * 0.8 + (this.town.x - s.x) / td * 0.5, bz2 = (s.z - r.z) / d * 0.8 + (this.town.z - s.z) / td * 0.5; const a = Math.atan2(bz2, bx2) + (Math.random() - 0.5) * 0.7; this.boltDir = { x: Math.cos(a), z: Math.sin(a) }; r.immune = Math.max(r.immune, 1.2); }
  }
  end(won, reason) {
    if (this.result) return; const s = this.storm, fx = this.G.fx;
    this.phase = won ? 'won' : 'lost'; this.phaseT = 0; fx.clearTelegraphs(); fx.hideCable(0); fx.hideCable(1); fx.hideRing(); fx.setStake(false); this.line = this.anchor = null;
    const lines = [['Storm data', Math.round(this.data)]];
    if (won) {
      const fin = this.pay * this.p.dataMul, hull = Math.round(this.pay * 0.4 * (this.rig.hull / this.rig.hullMax) * this.p.dataMul), town = Math.round(this.pay * 0.3 * this.p.dataMul);
      lines.push(['Dissipation', Math.round(fin)], ['Hull intact', hull], [`${this.town.name} is safe`, town]); this.data += fin + hull + town;
      s.die(); fx.slowMo(1.2); fx.flash(1); fx.shake(16); fx.hitStop(0.1); this.G.audio.bandSnap(); this.G.audio.win(); this.say('win'); fx.energy.play(s.x, s.groundY + 24, s.z, 90, 90, { fps: 32 });
      fx.shardBurst(s.x, s.groundY + 14, s.z, 20, this.rig, (i) => this.G.audio.pickup(i));
    } else { this.G.audio.fail(); this.rig.dead = true; if (reason === 'wrecked') { this.rig.fling((this.rig.x - s.x) / (this.dist || 1), (this.rig.z - s.z) / (this.dist || 1), 22, 13); fx.puff(this.rig.x, this.rig.y + 2, this.rig.z, 18, '#2a2f30', 1.4); } }
    this.result = { won, reason, storm: this.def, data: Math.round(this.data), lines, time: this.time, stats: this.stats, rematch: this.rematch };
  }

  update(dt, t, axes, input) {
    const G = this.G, s = this.storm, r = this.rig, fx = G.fx, w = G.world;
    this.time += dt; this.phaseT += dt; this.barkT -= dt; this.calloutT -= dt; this.reload = Math.max(0, this.reload - dt); this.gadgetCd = Math.max(0, this.gadgetCd - dt);
    const over = this.phase === 'won' || this.phase === 'lost';
    if (this.phase === 'intro' && this.phaseT > 0.4) { this.phase = 'hunt'; this.phaseT = 0; }
    const dx = r.x - s.x, dz = r.z - s.z, dist = Math.hypot(dx, dz) || 0.01; this.dist = dist; const nx = dx / dist, nz = dz / dist;
    r.aim = Math.atan2(-dx, -dz);

    // ---- input ----
    if (!over) {
      if (input.take('action', FEEL.inputBuffer)) { if (!this.action()) G.audio.deny(); }
      if (input.take('boost')) { if (r.boost()) { G.audio.boost(); fx.shake(3); G.kickFov(); } else G.audio.deny(); }
      if (input.take('gadget')) this.useGadget();
    }

    // ---- storm movement ----
    const toTownX = this.town.x - s.x, toTownZ = this.town.z - s.z, townDist = Math.hypot(toTownX, toTownZ) || 1; this.townDist = townDist;
    let mx = toTownX / townDist, mz = toTownZ / townDist, speed = this.def.speed * (1 + this.rematch * 0.12);
    const wob = Math.sin(t * 0.35 + this.def.ef) * this.def.wander; { const c = Math.cos(wob), sn = Math.sin(wob), ox = mx; mx = ox * c - mz * sn; mz = ox * sn + mz * c; }
    if (this.line || this.anchor) speed *= FEEL.tetheredStormSlowdown;
    if (this.phase === 'bolt') { this.bolt -= dt; mx = this.boltDir.x; mz = this.boltDir.z; speed = 21; if (this.bolt <= 0) { this.phase = 'hunt'; this.phaseT = 0; this.spawnSats(); } }
    if (this.lunge > 0) { this.lunge -= dt; this.lungeAt.wait -= dt; if (this.lungeAt.wait <= 0) { const lx = this.lungeAt.x - s.x, lz = this.lungeAt.z - s.z, ld = Math.hypot(lx, lz); if (ld > 4) { mx = lx / ld; mz = lz / ld; speed = 30; } else speed = 0; } else speed *= 0.3; }
    if (this.phase === 'finisher') speed *= 0.45;
    if (over) speed = this.phase === 'won' ? 0 : speed;
    s.moveX = mx; s.moveZ = mz; s.moveSpeed = speed; s.update(dt, t);
    if (!over && townDist < 75) this.end(false, 'town');

    // ---- forces on the rig: suction and the cable ----
    let ax = 0, az = 0; this.tension = null; this.strainRate = 0; this.crossfire = false;
    if (this.surgeWait > 0) { this.surgeWait -= dt; if (this.surgeWait <= 0) this.surge = 4; }
    if (this.surge > 0) this.surge -= dt;
    if (s.alive && this.phase !== 'finisher' && dist < this.def.suckR) { const k = Math.pow(1 - dist / this.def.suckR, 1.6) * this.def.suck * (this.surge > 0 ? 2.2 : 1) * r.def.resist; ax -= nx * k; az -= nz * k; }
    if (this.surge > 0 && Math.random() < dt * 14) { const a = Math.random() * 6.28, d = 40 + Math.random() * 90; fx.puff(s.x + Math.cos(a) * d, s.groundY + 1.5, s.z + Math.sin(a) * d, 7, '#d9b45a', 0.7, 1); }

    const b = s.band;
    if (this.phase === 'tethered' && b) {
      let rate = 0;
      // tangential speed against the spin
      const omega = (r.vx * -nz + r.vz * nx) / dist, against = -omega * s.spin; this.orbit = against / FEEL.windRefAngular;
      if (this.line) {
        const L = this.line; L.L += (FEEL.tetherLength - L.L) * Math.min(1, dt * 0.5); L.grace -= dt;
        const stretch = dist - L.L, tau = (stretch + this.p.sweet) / (this.p.sweet + FEEL.tetherOverStretch); this.tension = tau;
        if (stretch > 0) { const k = Math.min(70, FEEL.tetherSpring * stretch); ax -= nx * k; az -= nz * k; const out = r.vx * nx + r.vz * nz; if (out > 0) { ax -= nx * out * 2.5; az -= nz * out * 2.5; } }
        const q = clamp(tau / 0.3, 0, 1) * (tau > 1 ? 0.5 : 1); rate += q * clamp(this.orbit, 0, 1.5);
        if (tau > 1 && L.grace <= 0) { L.over += dt; if (L.over > this.p.snapAfter) this.dropLine(true); } else L.over = Math.max(0, L.over - dt * 1.5);
        this.wrongWay = this.orbit < -0.25 && tau > 0 ? this.wrongWay + dt : 0;
      }
      if (this.anchor) {
        const A = this.anchor; A.t -= dt; const ad = Math.hypot(A.x - s.x, A.z - s.z); rate += FEEL.anchorRate;
        if (this.line) { const cosang = ((A.x - s.x) * dx + (A.z - s.z) * dz) / (ad * dist || 1); if (cosang < Math.cos(FEEL.crossfireAngle * Math.PI / 180) && this.tension > 0) { rate *= 2; this.crossfire = true; } }
        _a.set(A.x, fx.ground(A.x, A.z) + 2.5, A.z); s.seam(b, A.x, A.z, _b); fx.setCable(1, _a, _b, 0.6, t);
        if (A.t <= 0 || ad > A.L + 60) { this.anchor = null; fx.hideCable(1); fx.setStake(false); if (!this.line) { if (dist < this.p.harpoonRange) { this.line = { L: clamp(dist, 82, 122), grace: FEEL.tetherGrace, over: 0 }; G.audio.twang(); } else { this.phase = 'exposed'; fx.hideRing(); } } }
      }
      this.strainRate = rate;
      if (this.phase === 'tethered') {
        const before = b.strain; b.strain = Math.min(1, b.strain + rate * dt / this.windSeconds());
        if (this.def.reverses && this.stage >= 1 && !this.reversed && before < 0.5 && b.strain >= 0.5) { this.reversePending = 1.5; this.reversed = true; this.call('SPIN REVERSING', 'bad', 1.5); G.audio.warn(); }
        if (b.strain >= 1) this.snapBand();
      }
    } else { this.orbit = 0; this.wrongWay = 0; }
    if (this.reversePending) { this.reversePending -= dt; if (this.reversePending <= 0) { this.reversePending = false; s.spin *= -1; fx.flash(0.4, PALETTE.accent); } }
    if (this.phase === 'hunt') this.reversed = false;

    // ---- rig ----
    r.update(dt, axes, w, ax, az);
    if (r.landed) { r.landed = false; fx.puff(r.x, r.y + 1, r.z, 10); G.audio.impact(); }
    for (const e of w.collideRig(r)) { if (e.kind === 'smash') { G.audio.smash(); fx.shake(2); fx.puff(e.x, e.y + 1.5, e.z, 6, e.type === 'bale' ? '#d9b45a' : '#cdb27a', 0.6); } else { G.audio.impact(); fx.shake(5); if (e.dmg && !over) this.hurt(e.dmg); } }
    if (!over && this.p.regen && r.hull > 0 && r.hull < r.hullMax) r.hull = Math.min(r.hullMax, r.hull + this.p.regen * dt);
    const spd = Math.hypot(r.vx, r.vz);
    if (r.air <= 0 && spd > 9 && Math.random() < dt * (r.surface ? 9 : 16) * (spd / 30)) fx.puff(r.x - Math.sin(r.heading) * 2.4 + (Math.random() - 0.5) * 1.6, r.y + 0.5, r.z - Math.cos(r.heading) * 2.4, 2.6 + spd * 0.07, r.surface === 2 ? '#8d9392' : '#cdb27a', 0.7, 2);

    // ---- contact with the funnel ----
    if (!over && s.alive) {
      if (this.phase === 'finisher') { if (dist < Math.max(15, s.killRadius + 6)) this.end(true, 'dissipated'); }
      else if (dist < s.killRadius && r.immune <= 0) { if (this.hurt(FEEL.dmgCore) && r.hull > 0) { r.fling(nx, nz, 46); if (this.line) this.dropLine(true); this.call('TOO CLOSE', 'bad'); } }
    }
    // satellites ride the ring with the spin: head-on to anyone winding
    for (let i = this.sats.length - 1; i >= 0; i--) {
      const st = this.sats[i], m = st.storm; st.hit -= dt;
      if (!st.dead) { st.ang += s.spin * 0.1 * dt; m.spin = s.spin; m.place(s.x + Math.cos(st.ang) * st.rad, s.z + Math.sin(st.ang) * st.rad); if (!over && st.hit <= 0 && Math.hypot(r.x - m.x, r.z - m.z) < 7.5) { st.hit = 1.5; if (this.hurt(FEEL.dmgSatellite) && r.hull > 0) { const d = Math.hypot(r.x - m.x, r.z - m.z) || 1; r.fling((r.x - m.x) / d, (r.z - m.z) / d, 20, 6); } } }
      m.update(dt, t); st.mark.visible = !st.dead; st.mark.position.set(m.x, m.groundY + 0.5, m.z); if (st.dead && !m.visible) { m.dispose(); G.scene.remove(st.mark); this.sats.splice(i, 1); }
    }

    // ---- attacks ----
    if (!over && s.alive && (this.phase === 'hunt' || this.phase === 'exposed' || this.phase === 'tethered') && dist < 300) {
      this.attackT -= dt; if (this.attackT <= 0) { const ev = this.def.attackEvery[Math.min(this.stage, this.def.attackEvery.length - 1)]; this.attackT = ev * (0.8 + Math.random() * 0.4) * (this.coach && this.stats.snaps === 0 ? 1.5 : 1) * this.p.tele; this.attack(); }
    }

    // ---- cable, ring, what the storm ate ----
    if (this.line && b) {
      r.muzzle(_a); s.seam(b, r.x, r.z, _b); fx.setCable(0, _a, _b, this.tension, t);
      const col = this.tension < 0 ? '#b9b39f' : this.tension > 1 ? PALETTE.accent : PALETTE.primary; fx.setRing(s.x, s.z, this.line.L, -s.spin, 0.85, this.reversePending ? PALETTE.accent : col);
    } else if (this.anchor && b) fx.setRing(s.x, s.z, this.anchor.L, -s.spin, 0.5, PALETTE.primary);
    else if (this.phase === 'hunt' && !this.probeBusy && dist < this.p.probeRange * 2.2) fx.setRing(s.x, s.z, this.p.probeRange, 1, 0.35 + 0.25 * Math.sin(t * 5), PALETTE.signal);
    else if (!this.harpoonBusy) { fx.hideRing(); if (!this.line) fx.hideCable(0); }
    w.update(dt, s);
    for (const e of w.events) { if (e.kind === 'rip') { fx.puff(e.x, e.y + 3, e.z, e.big ? 22 : 9, '#b89a58', 1.2); if (e.big && dist < 500) { G.audio.smash(); fx.shake(3); } } else if (e.kind === 'land' && Math.hypot(e.x - r.x, e.z - r.z) < 120) fx.puff(e.x, e.y + 1, e.z, 7); }
    w.events.length = 0;
    if (this.phase === 'finisher' && Math.random() < dt * 6) fx.energy.play(s.x + (Math.random() - 0.5) * 14, s.groundY + 4 + Math.random() * 30, s.z + (Math.random() - 0.5) * 14, 16, 16, { fps: 48 });
    s.mat.uniforms.uCore.value += ((this.phase === 'finisher' ? 1 : 0) - s.mat.uniforms.uCore.value) * Math.min(1, dt * 3);
    this.dataShown += (this.data - this.dataShown) * Math.min(1, dt * 8);
  }

  // the one line of coaching for this moment
  coachLine() {
    const ph = this.phase, d = this.dist;
    if (ph === 'hunt') return this.probeBusy ? 'POD AWAY' : d > this.p.probeRange ? 'GET IN CLOSE TO PROBE' : 'PROBE IT';
    if (ph === 'exposed') return this.reload > 0 ? 'RELOADING' : d > this.p.harpoonRange ? 'GET IN RANGE' : 'HARPOON THE BAND';
    if (ph === 'tethered') { if (!this.line) return 'LINE STAKED: FIRE AGAIN FOR CROSSFIRE'; if (this.tension > 1) return 'TOO TIGHT: EASE IN'; if (this.tension < 0) return 'LINE SLACK: STEER OUT'; if (this.wrongWay > 0.6) return 'WRONG WAY: FOLLOW THE ARROWS'; if (this.crossfire) return 'CROSSFIRE'; return this.orbit > 0.5 ? 'WINDING: HOLD THE RING' : 'ORBIT AGAINST THE SPIN'; }
    if (ph === 'bolt') return 'IT IS RUNNING: CHASE IT';
    if (ph === 'finisher') return 'DRIVE THROUGH THE EYE';
    return '';
  }
}
