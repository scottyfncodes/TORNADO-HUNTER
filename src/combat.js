// One mission: hunt, chase, survive, attack, escape, re-engage, destroy.
// The storm runs. You keep up and dodge what it throws. Guns and rockets break its debris shield; with the core
// exposed you harpoon it, which drags it to a crawl; then one rocket is the kill shot.
import * as THREE from '../vendor/three.module.min.js';
import { FEEL, PALETTE, CREW } from './config.js';
import { Storm } from './tornado.js';
import { Convoy } from './convoy.js';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const SAT_RING = new THREE.RingGeometry(7, 8.6, 28), SAT_MAT = new THREE.MeshBasicMaterial({ color: PALETTE.accent, transparent: true, opacity: 0.85, depthWrite: false, fog: false, side: THREE.DoubleSide });
const BOUND = 1120;
// rolling starts: rig on a road at speed, storm already running ahead of it
const STARTS = { pete: [768, -1100, 0], agnes: [-1050, 768, Math.PI / 2], sisters: [256, 1050, Math.PI] };
const SMALL = ['bale', 'door', 'sign'], BIG = ['car', 'tractor'];

export class Mission {
  constructor(G, def, loadout, upgrades, opts = {}) {
    this.G = G; this.def = def; this.coach = !!opts.coach; this.ef = def.ef + (opts.rematch || 0); this.rematch = opts.rematch || 0;
    const has = (id) => loadout.crew.includes(id), up = upgrades;
    this.crew = loadout.crew.map((id) => CREW.find((c) => c.id === id));
    this.p = {
      expose: FEEL.exposeSeconds + (has('doc') ? 3 : 0), dorothyRange: def.dorothyRange * (has('doc') ? 1.2 : 1),
      stagger: FEEL.staggerSeconds + (has('winch') ? 2 : 0), hook: FEEL.hookSeconds + (has('winch') ? 2 : 0) + up.winch * 1.5,
      rocketDmg: FEEL.rocketDamage * (1 + up.cable * 0.1), rocketReload: FEEL.rocketReload * (1 - up.cable * 0.08),
      mgRange: FEEL.mgRange * (has('june') ? 1.3 : 1), mgStormRange: FEEL.mgStormRange * (has('june') ? 1.3 : 1), mgDps: FEEL.mgDebrisDps * (has('june') ? 1.3 : 1), mgStorm: FEEL.mgStormDps * (has('june') ? 1.4 : 1),
      regen: has('sparks') ? 1.3 : 0, dataMul: (has('june') ? 1.2 : 1) * (1 + this.rematch * 0.5), tele: 1 - this.rematch * 0.12,
    };
    this.pay = def.pay; this.stageMax = def.stageHp * (1 + this.rematch * 0.3); this.hp = this.stageMax;
    const w = G.world, [rx, rz, hd] = STARTS[def.id] || STARTS.pete, fx = Math.sin(hd), fz = Math.cos(hd);
    this.storm = new Storm(G.scene, G.sky.uniforms, def, w, { low: !!G.low }); this.storm.place(rx + fx * 330 + fz * 40, rz + fz * 330 - fx * 40);
    this.ai = { hx: fx, hz: fz, jukeT: rand(3.5, 5), pending: null, edgeCd: 0 };
    this.rig = G.makeRig(); this.rig.place(rx, rz, hd, w); this.rig.vx = fx * 40; this.rig.vz = fz * 40; this.rig.speed = 40;
    this.convoy = new Convoy(G.scene, w, G.fx.dustTex); this.convoy.place(this.rig);
    this.phase = 'chase'; this.time = 0; this.phaseT = 0; this.stage = 0; this.data = 0; this.dataShown = 0; this.result = null;
    this.exposed = 0; this.dorothyCd = 0; this.podBusy = false; this.harpoonBusy = false; this.reload = 0; this.shotgunCd = 0; this.mgT = 0; this.firing = 0;
    this.staggerT = 0; this.hookT = 0; this.line = null; this.surge = null; this.wind = null; this.windWait = 0; this.hz = []; this.sats = []; this.attackT = 3.2;
    this.dist = 330; this.tension = null; this.bark = null; this.barkT = 0; this.callout = null; this.calloutT = 0; this.far = 0;
    this.stats = { snaps: 0, shot: 0, rockets: 0, direct: 0, hits: 0, close: 0, dorothys: 0 };
    this.say('start'); this.spawnSats();
  }
  dispose() { this.storm.dispose(); this.convoy.dispose(); for (const s of this.sats) { s.storm.dispose(); this.G.scene.remove(s.mark); } this.rig.dispose(); this.G.fx.reset(); }

  say(key, who) { const c = who || this.crew[(Math.random() * this.crew.length) | 0]; if (!c) return; this.bark = { name: c.name, text: c.barks[key] }; this.barkT = 3.4; }
  call(text, tone = 'warn', dur = 1.5) { this.callout = { text, tone }; this.calloutT = dur; }
  earn(n) { this.data += n * this.p.dataMul; }
  get shield() { return this.phase === 'stagger' || this.phase === 'rip' ? 0 : this.hp / this.stageMax; }
  get stability() { return this.shield; }
  get stormMph() { return Math.round(Math.hypot(this.storm.vx, this.storm.vz) * FEEL.mph); }
  // danger close pays: a miss by a truck length tops up the boost
  closeCall() { if (this.result) return; this.stats.close++; this.earn(3); this.rig.addBoost(FEEL.boostFromNearMiss); this.call('CLOSE CALL', 'good', 0.7); this.G.audio.tick(); }

  spawnSats() {
    for (const s of this.sats) { s.storm.dispose(); this.G.scene.remove(s.mark); } this.sats = [];
    const n = this.def.satellites ? this.def.satellites[Math.min(this.stage, this.def.satellites.length - 1)] : 0;
    for (let i = 0; i < n; i++) {
      const st = new Storm(this.G.scene, this.G.sky.uniforms, { ...this.def, r0: 3.4, r1: 18, height: 90, bands: 0, type: 'Rope', wob: 3 }, this.G.world, { mini: true });
      const mark = new THREE.Mesh(SAT_RING, SAT_MAT); mark.rotation.x = -Math.PI / 2; mark.renderOrder = 4; this.G.scene.add(mark);
      this.sats.push({ storm: st, mark, ang: (i / n) * 6.283, i, hit: 0 });
    }
  }

  // ---- the player's three buttons ----
  fireRocket() {
    if (this.result || this.reload > 0) return false;
    if (this.dist > FEEL.rocketRange) { this.call('OUT OF RANGE', 'warn', 0.7); return false; }
    const G = this.G, r = this.rig; this.reload = this.p.rocketReload; this.stats.rockets++; G.audio.rocket(); G.fx.shake(3);
    r.muzzle(_a); G.fx.flashAt(_a.x, _a.y, _a.z, 6, '#ffb14a', 0.1); G.fx.puff(_a.x, _a.y, _a.z, 5, '#e9e2cc', 0.5, 2);
    G.fx.rocket(_a.clone(), (out) => this.aimPoint(out), FEEL.rocketSpeed, (pt) => this.rocketHit(pt));
    return true;
  }
  aimPoint(out) { const s = this.storm, b = s.band; return b && s.alive ? s.seam(b, this.rig.x, this.rig.z, out) : out.set(s.x, s.groundY + 30, s.z); }
  rocketHit(pt) {
    const G = this.G, near = clamp(1.25 - this.dist / 380, 0.3, 1), kill = this.phase === 'rip';
    G.fx.explode(pt.x, pt.y, pt.z, kill ? 26 : 16); G.audio.boom(near); G.fx.shake(FEEL.shakeRocket * near * (kill ? 1.6 : 1)); this.storm.hit = 1;
    if (this.result) return;
    if (kill) { this.stats.direct++; this.ripBand(); return; }           // hooked and exposed: this is the kill shot
    if (this.phase === 'chase') { G.fx.hitStop(FEEL.hitStopRocket); this.damageStorm(this.p.rocketDmg * (this.exposed > 0 ? FEEL.dorothyBoost : 1)); }
  }
  // HARPOON once the shield is down; before that, DOROTHY (optional: double shield damage while it flies)
  tech() {
    const G = this.G, s = this.storm, r = this.rig; if (this.result) return false;
    if (this.phase === 'stagger') {
      if (this.harpoonBusy || this.dist > FEEL.harpoonRange) return false; const b = s.band; if (!b) return false;
      this.harpoonBusy = true; G.audio.harpoon();
      G.fx.launchHarpoon(r.muzzle(_a), (out) => s.seam(b, r.x, r.z, out), () => {
        this.harpoonBusy = false; if (this.phase !== 'stagger' || s.band !== b) { G.fx.hideCable(0); return; }
        this.phase = 'rip'; this.phaseT = 0; this.hookT = this.p.hook; this.line = { L: Math.max(90, this.dist) }; this.reload = Math.min(this.reload, 0.5); G.audio.twang(); G.audio.stagger(); G.fx.hitStop(FEEL.hitStopHarpoon); G.fx.shake(8); this.call('HOOKED: KILL SHOT', 'good', 1.5);
        s.seam(b, r.x, r.z, _a); G.fx.energy.play(_a.x, _a.y, _a.z, 26, 26, { fps: 48 });
      });
      return true;
    }
    if (this.phase === 'chase' && this.exposed <= 0 && this.dorothyCd <= 0 && !this.podBusy && this.dist < this.p.dorothyRange) {
      this.podBusy = true; this.stats.dorothys++; G.audio.probeLaunch(); this.say('probe');
      G.fx.launchPod(r.muzzle(_a), s, () => {
        this.podBusy = false; if (this.phase !== 'chase' || !s.band) return;
        this.exposed = this.p.expose; G.audio.ping(); G.audio.dorothy(); this.earn(8); this.call('DOROTHY IN: DOUBLE DAMAGE', 'good', 1.4); G.fx.flash(0.35, PALETTE.signal);
        s.seam(s.band, r.x, r.z, _a); G.fx.energy.play(_a.x, _a.y, _a.z, 40, 40, { fps: 36 });
      });
      return true;
    }
    return false;
  }
  rocketState() { const kill = this.phase === 'rip'; return { ready: this.reload <= 0 && this.dist <= FEEL.rocketRange && !this.result, danger: kill, label: kill ? 'KILL SHOT' : 'ROCKET', fill: clamp(this.reload / this.p.rocketReload, 0, 1), hint: this.dist > FEEL.rocketRange ? 'TOO FAR' : '' }; }
  techState() {
    if (this.phase === 'stagger') return { label: 'HARPOON', ready: !this.harpoonBusy && this.dist < FEEL.harpoonRange, danger: true, fill: 0, hint: this.dist > FEEL.harpoonRange ? 'CLOSER' : `${Math.ceil(this.staggerT)} s` };
    if (this.phase === 'rip') return { label: 'HOOKED', ready: false, fill: 0, hint: `${Math.ceil(this.hookT)} s` };
    if (this.exposed > 0) return { label: 'DOROTHY', ready: false, fill: 0, hint: 'x2 ' + Math.ceil(this.exposed) + ' s' };
    if (this.dorothyCd > 0 || this.podBusy) return { label: 'DOROTHY', ready: false, fill: clamp(this.dorothyCd / FEEL.dorothyCooldown, 0, 1), hint: this.podBusy ? 'AWAY' : '' };
    if (this.phase !== 'chase') return { label: 'HARPOON', ready: false, fill: 0, hint: '' };
    return { label: 'DOROTHY', ready: this.dist < this.p.dorothyRange, fill: 0, hint: this.dist < this.p.dorothyRange ? 'x2 DAMAGE' : `${Math.round(this.dist - this.p.dorothyRange)} m` };
  }

  // ---- damage both ways ----
  damageStorm(n) {
    if (this.phase !== 'chase' || this.result) return;
    this.hp -= n; this.storm.hit = Math.max(this.storm.hit || 0, 0.6);
    if (this.hp <= 0) {
      this.hp = 0; this.phase = 'stagger'; this.phaseT = 0; this.staggerT = this.p.stagger; this.exposed = 0; this.attackT = 2.5; this.wind = null;
      const G = this.G; G.audio.stagger(); G.audio.boom(0.9); G.fx.hitStop(0.08); G.fx.shake(11); G.fx.flash(0.6); G.sky.strike(0.8); this.call('SHIELD DOWN', 'good', 1.6); this.clearHazards(true);
      const s = this.storm; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, rr = s.radiusAt(0.1) * 1.4; G.fx.explode(s.x + Math.cos(a) * rr, s.groundY + 18 + Math.random() * 30, s.z + Math.sin(a) * rr, 14); }
    }
  }
  hurt(n, key = 'hurt') {
    if (!this.rig.damage(n)) return false; this.stats.hits++;
    const fx = this.G.fx; fx.hitStop(FEEL.hitStopHull); fx.shake(FEEL.shakeHull); fx.flash(0.5, PALETTE.accent); this.G.audio.hurt(); if (Math.random() < 0.6) this.say(key);
    fx.puff(this.rig.x, this.rig.y + 2, this.rig.z, 9, '#2a2f30', 0.8);
    if (this.rig.hull <= 0) this.end(false, 'wrecked'); return true;
  }

  // ---- wreckage: thrown at where you are going, marked on the ground, shootable in the air ----
  throwAt(kind, lead, lateral, extra = 0) {
    const G = this.G, r = this.rig, s = this.storm, big = BIG.includes(kind), dur = Math.max(FEEL.telegraphMin, (big ? 1.9 : 1.55) * this.p.tele) + extra;
    const sp = Math.hypot(r.vx, r.vz), ux = sp > 4 ? r.vx / sp : Math.sin(r.heading), uz = sp > 4 ? r.vz / sp : Math.cos(r.heading);
    const tx = clamp(r.x + ux * Math.max(18, sp * dur * lead) - uz * lateral, -1480, 1480), tz = clamp(r.z + uz * Math.max(18, sp * dur * lead) + ux * lateral, -1480, 1480);
    s.spineAt(0.2, _a); const h = G.fx.hazard(kind, { x: s.x + _a.x, y: s.groundY + s.height * 0.2, z: s.z + _a.z }, { x: tx, y: G.fx.ground(tx, tz) + 1, z: tz }, dur); if (!h) return;
    // it is thrown at where you will be, and corrects in flight until it locks: the last stretch is yours to dodge
    const rad = big ? 10 : 7.5, lock = dur - Math.max(0.75, dur * 0.42), off = { x: -uz * lateral, z: ux * lateral };
    const tele = G.fx.telegraph(tx, tz, rad, dur + 0.05, null, { lock, track: (e, dt) => { const left = Math.max(0.2, h.dur - h.t), k = Math.min(1, dt * 4); e.x += (clamp(r.x + r.vx * left * lead + off.x, -1480, 1480) - e.x) * k; e.z += (clamp(r.z + r.vz * left * lead + off.z, -1480, 1480) - e.z) * k; h.tx = e.x; h.tz = e.z; h.ty = G.fx.ground(e.x, e.z) + 1; } });
    this.hz.push({ h, big, hp: big ? 230 : 60, rad, state: 'fly', tele });
  }
  dropHazard(z, how) { // shot down, landed small, or blasted
    const G = this.G, h = z.h; if (z.tele) { z.tele.on = false; z.tele.g.visible = false; }
    if (how !== 'land') { G.fx.explode(h.x, h.y, h.z, z.big ? 13 : 8); G.audio.crack(); this.stats.shot++; this.earn(2); this.rig.addBoost(FEEL.boostFromKill * (z.big ? 2 : 1)); }
    G.fx.freeHazard(h); z.state = 'gone';
  }
  clearHazards(all) { for (const z of this.hz) if (z.state !== 'gone' && (all || z.state === 'fly')) this.dropHazard(z, 'land'); this.hz.length = 0; this.G.fx.clearTelegraphs(); }
  attack() {
    const stage = Math.min(this.stage, this.def.attacks.length - 1), list = this.def.attacks[stage], kind = list[(Math.random() * list.length) | 0];
    const G = this.G, fx = G.fx, r = this.rig, pick = (a) => a[(Math.random() * a.length) | 0];
    if (kind === 'debris') { const n = this.def.volley[stage] + (this.rematch ? 1 : 0); for (let i = 0; i < n; i++) this.throwAt(pick(SMALL), 1.0 + i * 0.14, i ? rand(-13, 13) : rand(-1.5, 1.5), i * 0.16); G.audio.whistle(1.3); }
    else if (kind === 'big') { this.throwAt(pick(BIG), 1.0, rand(-3, 3)); G.audio.whistle(1.7); this.call('INCOMING', 'bad', 0.9); }
    else if (kind === 'field') { const gap = (Math.random() * 4) | 0; [-21, -7, 7, 21].forEach((o, i) => { if (i !== gap) this.throwAt(i % 2 ? pick(BIG) : pick(SMALL), 1.0, o + rand(-2, 2), i * 0.1); }); G.audio.whistle(1.8); this.call('DEBRIS FIELD', 'bad', 1.1); }
    else if (kind === 'lightning') {
      const dur = Math.max(FEEL.telegraphMin, 1.3 * this.p.tele), lock = dur - 0.5;
      fx.telegraph(r.x, r.z, 11, dur, (e) => {
        const y = fx.ground(e.x, e.z); fx.lightning.play(e.x, y, e.z, 120, 170, { ground: true, fps: 30 }); fx.lightning.play(e.x + 6, y, e.z - 4, 90, 150, { ground: true, fps: 36, rot: 0.1 });
        G.sky.strike(1); fx.flash(0.7); G.audio.thunder(); fx.shake(6); const d = Math.hypot(r.x - e.x, r.z - e.z); if (d < 10.5) this.hurt(FEEL.dmgLightning); else if (d < 24) this.closeCall();
      }, { lock, track: (e, dt) => { const k = Math.min(1, dt * 5); e.x += (r.x + r.vx * 0.3 - e.x) * k; e.z += (r.z + r.vz * 0.3 - e.z) * k; } });
      G.audio.warn();
    } else if (kind === 'crosswind') { const side = Math.random() < 0.5 ? 1 : -1; this.windWait = Math.max(FEEL.telegraphMin, 0.95 * this.p.tele); this.windSide = side; this.call(side > 0 ? 'CROSSWIND  >>>' : '<<<  CROSSWIND', 'bad', this.windWait + 0.4); G.audio.warn(); }
  }

  // ---- the harpoon pays off ----
  ripBand() {
    const s = this.storm, b = s.band, G = this.G, fx = G.fx, r = this.rig; if (!b) return;
    s.seam(b, r.x, r.z, _a); const bx = _a.x, by = _a.y, bz = _a.z;
    s.snapBand(b); this.stats.snaps++; this.stage++; this.line = null; fx.hideCable(0); this.clearHazards(true);
    fx.hitStop(FEEL.hitStopBandSnap); fx.shake(FEEL.shakeBandSnap); fx.flash(1); G.audio.bandSnap(); G.audio.boom(1); G.sky.strike(1.2);
    fx.energy.play(bx, by, bz, 80, 80, { fps: 40 }); fx.explode(bx, by, bz, 26);
    const each = this.pay / 12; fx.shardBurst(s.x, s.groundY + 12, s.z, 12, r, (i) => { this.earn(each); G.audio.pickup(i); });
    this.say('snap'); for (const st of this.sats) { st.storm.die(); st.dead = true; }
    if (s.bandsLeft === 0) { this.end(true, 'destroyed'); return; }
    // it does not take that quietly: a wall of debris rolls out from where it stood, and it bolts
    this.phase = 'surge'; this.phaseT = 0; this.surge = { x: s.x, z: s.z, r: 24, hit: false }; this.hp = this.stageMax; this.exposed = 0; this.dorothyCd = 1.5; this.attackT = 4.5;
    const a = Math.atan2(s.z - r.z, s.x - r.x) + rand(-0.9, 0.9); this.ai.hx = Math.cos(a); this.ai.hz = Math.sin(a); this.ai.pending = null; this.ai.jukeT = rand(3, 4.5);
    this.call('GET CLEAR', 'bad', 1.8); G.audio.warn(); r.immune = Math.max(r.immune, 0.4);
  }
  end(won, reason) {
    if (this.result) return; const s = this.storm, fx = this.G.fx;
    this.phase = won ? 'won' : 'lost'; this.phaseT = 0; this.clearHazards(true); fx.hideCable(0); fx.hideRing(); this.line = null; this.surge = null; this.wind = null;
    const lines = [['Storm data', Math.round(this.data)]];
    if (won) {
      const fin = this.pay * this.p.dataMul, hull = Math.round(this.pay * 0.4 * (this.rig.hull / this.rig.hullMax) * this.p.dataMul);
      lines.push(['Storm destroyed', Math.round(fin)], ['Hull intact', hull]); this.data += fin + hull;
      s.die(); fx.slowMo(1.4); fx.flash(1); fx.shake(18); fx.hitStop(0.12); this.G.audio.win(); this.say('win'); fx.energy.play(s.x, s.groundY + 24, s.z, 110, 110, { fps: 28 });
      for (let i = 0; i < 4; i++) fx.anim(0.25 + i * 0.3, () => {}, () => { fx.explode(s.x + rand(-20, 20), s.groundY + 20 + i * 28, s.z + rand(-20, 20), 22); this.G.audio.boom(0.8); fx.shake(8); });
      fx.shardBurst(s.x, s.groundY + 14, s.z, 20, this.rig, (i) => this.G.audio.pickup(i));
    } else { this.G.audio.fail(); this.rig.dead = true; const d = this.dist || 1; this.rig.fling((this.rig.x - s.x) / d, (this.rig.z - s.z) / d, 24, 13); fx.explode(this.rig.x, this.rig.y + 2, this.rig.z, 14); this.G.audio.boom(0.9); }
    this.result = { won, reason, storm: this.def, data: Math.round(this.data), lines, time: this.time, stats: this.stats, rematch: this.rematch };
  }

  // ---- the storm has somewhere to be ----
  drive(dt, t, over) {
    const s = this.storm, a = this.ai, d = this.dist; a.jukeT -= dt; a.edgeCd -= dt;
    const out = (Math.abs(s.x) > BOUND && s.x * a.hx > 0) || (Math.abs(s.z) > BOUND && s.z * a.hz > 0);
    if (a.pending) { a.pending.t -= dt; if (a.pending.t <= 0) { a.hx = Math.cos(a.pending.ang); a.hz = Math.sin(a.pending.ang); a.pending = null; } }
    else if ((this.phase === 'chase' || this.phase === 'surge') && (out ? a.edgeCd <= 0 : a.jukeT <= 0 && this.phase === 'chase')) {
      const cur = Math.atan2(a.hz, a.hx); let ang;
      if (out) { ang = Math.atan2(-s.z, -s.x) + rand(-0.6, 0.6); a.edgeCd = 2.5; }
      else { ang = cur + (Math.random() < 0.5 ? 1 : -1) * rand(this.def.jukeAngle[0], this.def.jukeAngle[1]); const fx2 = s.x + Math.cos(ang) * 420, fz2 = s.z + Math.sin(ang) * 420; if (Math.abs(fx2) > BOUND || Math.abs(fz2) > BOUND) ang = Math.atan2(-s.z, -s.x) + rand(-0.7, 0.7); }
      a.pending = { ang, t: out ? 0.3 : 0.75 }; a.jukeT = rand(this.def.juke[0], this.def.juke[1]) * (1 - 0.1 * this.stage);
      if (d < 420 && !out) { let turn = ang - cur; turn = Math.atan2(Math.sin(turn), Math.cos(turn)); if (Math.abs(turn) > 0.5) { if (this.coach && !this.taughtDrift) { this.taughtDrift = true; this.call('BRAKE + STEER = DRIFT', 'good', 2.2); } else this.call('IT IS TURNING', 'warn', 0.9); } }
    }
    let sp = this.def.run * (1 + this.rematch * 0.1) * (1 + 0.06 * this.stage);
    // rubber band: it never simply leaves, and it never lets you sit on it
    sp *= d > 430 ? 0.5 : d > 230 ? 0.5 + 0.5 * (430 - d) / 200 : d < 100 ? 1.1 : 1;
    // whatever the storm, it never outruns your rig across open country until you are on top of it
    if (d > 170) sp = Math.min(sp, FEEL.rigTopSpeedField * this.rig.def.speed * 0.94);
    if (this.exposed > 0) sp *= 0.85;
    if (this.phase === 'stagger') sp *= 0.7; else if (this.phase === 'rip') sp *= 0.14; else if (this.phase === 'surge') sp = this.def.run * 1.35;
    if (over) sp = this.phase === 'won' ? 0 : sp * 0.5;
    s.moveX = a.hx; s.moveZ = a.hz; s.moveSpeed = sp; s.thrash = this.phase === 'stagger' || this.phase === 'rip' ? 10 : 0; s.update(dt, t);
  }

  update(dt, t, axes, input) {
    const G = this.G, s = this.storm, r = this.rig, fx = G.fx, w = G.world;
    this.time += dt; this.phaseT += dt; this.barkT -= dt; this.calloutT -= dt; this.reload = Math.max(0, this.reload - dt); this.shotgunCd = Math.max(0, this.shotgunCd - dt); this.firing = Math.max(0, this.firing - dt);
    if (this.exposed > 0) { this.exposed -= dt; if (this.exposed <= 0) { this.exposed = 0; this.dorothyCd = FEEL.dorothyCooldown; if (this.phase === 'chase') this.call('CORE CLOSED', 'warn', 1); } } else this.dorothyCd = Math.max(0, this.dorothyCd - dt);
    const over = this.phase === 'won' || this.phase === 'lost';
    let dx = r.x - s.x, dz = r.z - s.z, dist = Math.hypot(dx, dz) || 0.01; this.dist = dist; let nx = dx / dist, nz = dz / dist;
    r.aim = Math.atan2(-dx, -dz); r.alert = dist < 420 && s.alive ? 1 : 0;

    // ---- input: three buttons ----
    if (!over) {
      if (input.take('action', FEEL.inputBuffer)) { if (!this.fireRocket()) { G.audio.deny(); G.hud.deny('btn-action'); } }
      if (input.take('boost')) { if (r.boost()) { G.audio.boost(); fx.shake(4); G.kickFov(); const bx = r.x - Math.sin(r.heading) * 3, bz = r.z - Math.cos(r.heading) * 3; fx.flashAt(bx, r.y + 1, bz, 7, '#ff9a3c', 0.18); for (let i = 0; i < 5; i++) fx.puff(bx + rand(-1.5, 1.5), r.y + 0.8, bz + rand(-1.5, 1.5), 4 + i, '#e9e2cc', 0.6, 2); } else { G.audio.deny(); G.hud.deny('btn-boost'); } }
      if (input.take('gadget', FEEL.inputBuffer)) { if (!this.tech()) { G.audio.deny(); G.hud.deny('btn-gadget'); } }
    }

    // ---- the storm moves ----
    this.drive(dt, t, over);
    if (this.phase === 'stagger') { this.staggerT -= dt; if (this.staggerT <= 0 && !this.harpoonBusy) { this.phase = 'chase'; this.phaseT = 0; this.hp = this.stageMax * FEEL.staggerRecover; this.dorothyCd = 2; this.call('SHIELD REFORMING', 'bad', 1.4); G.audio.warn(); } }

    // ---- forces on the rig: suction, crosswind, the cable ----
    let ax = 0, az = 0; this.tension = null;
    if (s.alive && this.phase === 'chase' && dist < this.def.suckR) { const k = Math.pow(1 - dist / this.def.suckR, 1.6) * this.def.suck * r.def.resist; ax -= nx * k; az -= nz * k; }
    if (this.windWait > 0) { this.windWait -= dt; if (this.windWait <= 0) { this.wind = { t: 1.4, side: this.windSide }; G.audio.gust(); } }
    if (this.wind) {
      const wn = this.wind; wn.t -= dt; const px = -Math.cos(r.heading) * wn.side, pz = Math.sin(r.heading) * wn.side, k = FEEL.crosswind * Math.min(1, wn.t * 3) * r.def.resist; ax += px * k; az += pz * k;
      if (Math.random() < dt * 30) fx.puff(r.x - px * rand(6, 22) + rand(-14, 14), r.y + rand(0.5, 3), r.z - pz * rand(6, 22) + rand(-14, 14), 4, '#d9c9a0', 0.5, 0.5);
      if (wn.t <= 0) this.wind = null;
    }
    const b = s.band;
    if (this.phase === 'rip' && this.line && b) {
      // hooked: the storm is dragged to a crawl and you are on a leash; the kill shot is one rocket away
      this.hookT -= dt; this.tension = 0.5 + 0.5 * Math.sin(t * 9);
      const stretch = dist - this.line.L - 25; if (stretch > 0) { const k = Math.min(70, 3.2 * stretch); ax -= nx * k; az -= nz * k; }
      if (Math.random() < dt * 12) { s.seam(b, r.x, r.z, _a); fx.flashAt(_a.x, _a.y, _a.z, 9, '#ff3f8e', 0.1); }
      fx.shake(2);
      if (this.hookT <= 0) { this.phase = 'chase'; this.phaseT = 0; this.line = null; fx.hideCable(0); this.hp = this.stageMax * FEEL.hookRecover; this.dorothyCd = 2; this.call('LINE LET GO', 'bad', 1.4); G.audio.lineSnap(); }
    }

    // ---- rig ----
    r.update(dt, axes, w, ax, az);
    if (r.landed) { r.landed = false; fx.puff(r.x, r.y + 1, r.z, 10); G.audio.impact(); }
    if (r.launch) for (let i = 0; i < 4; i++) fx.puff(r.x - Math.sin(r.heading) * (2.5 + i) + rand(-1, 1), r.y + 0.6, r.z - Math.cos(r.heading) * (2.5 + i) + rand(-1, 1), 4 + i, r.surface === 2 ? '#8d9392' : '#cdb27a', 0.6, 2);
    for (const e of w.collideRig(r)) { if (e.kind === 'smash') { G.audio.smash(); fx.shake(e.tree ? 4 : 2); fx.puff(e.x, e.y + 1.5, e.z, e.tree ? 9 : 6, e.type === 'bale' ? '#d9b45a' : '#cdb27a', 0.6); } else { G.audio.impact(); fx.shake(6); if (e.dmg && !over) this.hurt(e.dmg); } }
    if (!over && this.p.regen && r.hull > 0 && r.hull < r.hullMax) r.hull = Math.min(r.hullMax, r.hull + this.p.regen * dt);
    const spd = Math.hypot(r.vx, r.vz);
    if (r.air <= 0 && spd > 9 && Math.random() < dt * (r.drifting ? 60 : r.surface ? 10 : 20) * Math.min(1.5, spd / 40)) fx.puff(r.x - Math.sin(r.heading) * 2.6 + rand(-1.2, 1.2), r.y + 0.5, r.z - Math.cos(r.heading) * 2.6 + rand(-1.2, 1.2), (r.drifting ? 5 : 2.6) + spd * 0.05, r.surface === 2 ? '#8d9392' : '#cdb27a', 0.7, 2);
    dx = r.x - s.x; dz = r.z - s.z; dist = Math.hypot(dx, dz) || 0.01; this.dist = dist; nx = dx / dist; nz = dz / dist;

    // ---- wreckage in the air and on the ground ----
    let target = null, soonest = 1e9;
    for (let i = this.hz.length - 1; i >= 0; i--) {
      const z = this.hz[i], h = z.h; if (z.state === 'gone') { this.hz.splice(i, 1); continue; }
      const hd = Math.hypot(h.x - r.x, h.z - r.z);
      if (z.state === 'fly') {
        if (h.t >= h.dur) { // it lands
          fx.puff(h.tx, h.ty + 1, h.tz, z.big ? 20 : 12, '#b89a58', 1.1); G.audio.impact(); if (hd < 60) fx.shake(z.big ? 7 : 4);
          if (!over) { if (hd < z.rad) this.hurt(z.big ? FEEL.dmgBigDebris : FEEL.dmgDebris); else if (hd < z.rad * 2.4) this.closeCall(); }
          if (z.big) { z.state = 'wreck'; z.life = 9; h.landed = true; h.x = h.tx; h.y = h.ty + 0.6; h.z = h.tz; h.m.rotation.set(rand(-0.4, 0.4), rand(0, 6), rand(-0.5, 0.5)); if (z.tele) { z.tele.on = false; z.tele.g.visible = false; } } else this.dropHazard(z, 'land');
          continue;
        }
        const left = h.dur - h.t, d3 = Math.hypot(hd, h.y - r.y);
        if (h.t > 0.2 && d3 < this.p.mgRange && left < soonest) { soonest = left; target = z; }
        if (!over && this.shotgunCd <= 0 && d3 < FEEL.shotgunRange && left < 0.5) this.shotgun(z);
      } else { // a wreck on the ground: go round it, or let the shotgun clear it
        z.life -= dt; if (Math.random() < dt * 5) fx.puff(h.x, h.y + 2, h.z, 5, '#2a2420', 1.0, 5);
        const ahead = (h.x - r.x) * r.vx + (h.z - r.z) * r.vz > 0;
        if (!over && this.shotgunCd <= 0 && hd < FEEL.shotgunRange + spd * 0.12 && ahead) this.shotgun(z);
        else if (!over && hd < 4.4) { this.hurt(FEEL.dmgWreck); r.vx *= 0.5; r.vz *= 0.5; r.speed *= 0.5; this.dropHazard(z, 'ram'); }
        else if (z.life <= 0 || hd > 700) this.dropHazard(z, 'land');
      }
    }
    // ---- the gunner: debris first, then the open core ----
    if (!over) {
      if (target && target.state === 'fly') { const h = target.h; _b.set(h.x, h.y, h.z); this.mg(dt, _b, 0.062); target.hp -= this.p.mgDps * dt; if (target.hp <= 0) this.dropHazard(target, 'mg'); }
      else if (this.phase === 'chase' && dist < this.p.mgStormRange && b && s.alive) { s.seam(b, r.x, r.z, _b); this.mg(dt, _b, 0.085); this.damageStorm(this.p.mgStorm * (this.exposed > 0 ? FEEL.dorothyBoost : 1) * dt); }
    }

    // ---- contact with the funnel, satellites, the surge ----
    if (!over && s.alive && this.phase === 'chase' && dist < s.killRadius && r.immune <= 0) { if (this.hurt(FEEL.dmgCore) && r.hull > 0) { r.fling(nx, nz, 55); this.call('TOO CLOSE', 'bad'); } }
    for (let i = this.sats.length - 1; i >= 0; i--) {
      const st = this.sats[i], m = st.storm; st.hit -= dt;
      if (!st.dead) { st.ang += s.spin * 0.55 * dt; const rad = 78 + 38 * Math.sin(t * 0.55 + st.i * 2.1); m.spin = s.spin; m.place(s.x + Math.cos(st.ang) * rad, s.z + Math.sin(st.ang) * rad); if (!over && st.hit <= 0 && Math.hypot(r.x - m.x, r.z - m.z) < 7.5) { st.hit = 1.5; if (this.hurt(FEEL.dmgSatellite) && r.hull > 0) { const d = Math.hypot(r.x - m.x, r.z - m.z) || 1; r.fling((r.x - m.x) / d, (r.z - m.z) / d, 24, 6); } } }
      m.update(dt, t); st.mark.visible = !st.dead; st.mark.position.set(m.x, m.groundY + 0.5, m.z); if (st.dead && !m.visible) { m.dispose(); G.scene.remove(st.mark); this.sats.splice(i, 1); }
    }
    if (this.phase === 'surge' && this.surge) {
      const sg = this.surge; sg.r += FEEL.surgeSpeed * dt; const rd = Math.hypot(r.x - sg.x, r.z - sg.z), k = sg.r / FEEL.surgeRadius;
      fx.setRing(sg.x, sg.z, sg.r, 1, 0.9 * (1 - k * k * 0.7), PALETTE.accent, 9);
      for (let i = 0; i < 3; i++) if (Math.random() < dt * 30) { const a = Math.random() * 6.283, px = sg.x + Math.cos(a) * sg.r, pz = sg.z + Math.sin(a) * sg.r; fx.puff(px, fx.ground(px, pz) + 3, pz, 14, '#6e5637', 0.8, 6); }
      if (!sg.hit && !over && Math.abs(rd - sg.r) < 8 && sg.r > 40) { sg.hit = true; if (this.hurt(FEEL.dmgSurge) && r.hull > 0) r.fling((r.x - sg.x) / (rd || 1), (r.z - sg.z) / (rd || 1), 34, 8); }
      if (sg.r >= FEEL.surgeRadius) { if (!sg.hit && !over) { r.addBoost(0.6); this.earn(5); this.call('CLEAN ESCAPE', 'good', 0.9); } this.surge = null; fx.hideRing(); if (!over) { this.phase = 'chase'; this.phaseT = 0; this.spawnSats(); } }
    }

    // ---- attacks ----
    if (!over && s.alive && this.phase === 'chase' && dist < 360) {
      this.attackT -= dt; if (this.attackT <= 0) { const ev = this.def.attackEvery[Math.min(this.stage, this.def.attackEvery.length - 1)]; this.attackT = ev * rand(0.8, 1.2) * this.p.tele; this.attack(); }
    }

    // ---- cable, rings, what the storm ate ----
    // the band's ring is the shield: wheat segments that go out as it breaks, green when the core is bare, magenta when hooked
    if (b) { b.exposed = true; b.strain = this.phase === 'chase' || this.phase === 'surge' ? this.hp / this.stageMax : 1; b.tone = this.phase === 'rip' ? PALETTE.accent : this.phase === 'stagger' ? PALETTE.signal : this.exposed > 0 ? '#fff1c2' : PALETTE.wheat; }
    if (this.phase === 'rip' && this.line && b) { r.muzzle(_a); s.seam(b, r.x, r.z, _b); fx.setCable(0, _a, _b, this.hookT < 2.5 ? 1.2 : 0.7, t); }
    else if (!this.harpoonBusy) fx.hideCable(0);
    if (!this.surge) { if (!over && this.phase === 'chase' && this.exposed <= 0 && this.dorothyCd <= 0 && !this.podBusy && dist < this.p.dorothyRange * 2.4) fx.setRing(s.x, s.z, this.p.dorothyRange, 1, 0.3 + 0.2 * Math.sin(t * 5), PALETTE.signal); else fx.hideRing(); }
    this.convoy.update(dt, t, r, s);
    w.update(dt, s);
    for (const e of w.events) { if (e.kind === 'rip') { fx.puff(e.x, e.y + 3, e.z, e.big ? 22 : 9, '#b89a58', 1.2); if (e.big && dist < 500) { G.audio.smash(); fx.shake(3); } } else if (e.kind === 'land' && Math.hypot(e.x - r.x, e.z - r.z) < 120) fx.puff(e.x, e.y + 1, e.z, 7); }
    w.events.length = 0;
    s.hit = Math.max(0, (s.hit || 0) - dt * 3); const core = this.phase === 'stagger' || this.phase === 'rip' ? 0.75 + 0.25 * Math.sin(t * 14) : s.hit * 0.8;
    s.mat.uniforms.uCore.value += (core - s.mat.uniforms.uCore.value) * Math.min(1, dt * 10);
    this.far = dist > 460 ? this.far + dt : 0;
    this.dataShown += (this.data - this.dataShown) * Math.min(1, dt * 8);
  }
  mg(dt, pos, every) {
    const G = this.G, r = this.rig; r.aim = Math.atan2(pos.x - r.x, pos.z - r.z); this.firing = 0.15; this.mgT -= dt; if (this.mgT > 0) return; this.mgT = every;
    r.muzzle(_a); _c.set(pos.x + rand(-1.2, 1.2), pos.y + rand(-1.2, 1.2), pos.z + rand(-1.2, 1.2)); G.fx.tracer(_a, _c); G.fx.flashAt(_a.x, _a.y, _a.z, 2.6, '#ffd27a', 0.05); G.audio.mg();
    if (Math.random() < 0.35) G.fx.flashAt(_c.x, _c.y, _c.z, 2.2, '#ffe9b0', 0.06);
  }
  shotgun(z) {
    const G = this.G, r = this.rig, h = z.h; this.shotgunCd = FEEL.shotgunReload; r.muzzle(_a); r.aim = Math.atan2(h.x - r.x, h.z - r.z);
    for (let i = 0; i < 7; i++) { _c.set(h.x + rand(-4, 4), h.y + rand(-3, 3), h.z + rand(-4, 4)); G.fx.tracer(_a, _c); }
    G.fx.flashAt(_a.x, _a.y, _a.z, 8, '#fff1c4', 0.1); G.audio.shotgun(); G.fx.shake(5); this.dropHazard(z, 'shotgun'); this.call('BOOM', 'good', 0.5);
  }

  // the one line of coaching for this moment
  coachLine() {
    const ph = this.phase, d = this.dist;
    if (ph === 'chase') {
      if (this.far > 2.5) return 'CATCH IT: ROADS ARE FASTER';
      if (d > 210 && this.rig.boostCharge >= 1) return 'BOOST TO CLOSE IN';
      if (d > this.p.mgStormRange) return 'GET IN GUN RANGE';
      return this.reload <= 0 ? 'BREAK THE SHIELD: FIRE ROCKETS' : 'BREAK THE SHIELD: STAY IN GUN RANGE';
    }
    if (ph === 'stagger') return d > FEEL.harpoonRange ? 'SHIELD DOWN: GET CLOSER' : 'SHIELD DOWN: HARPOON IT';
    if (ph === 'rip') return 'HOOKED: FIRE THE KILL SHOT';
    if (ph === 'surge' && this.surge) { const gap = Math.hypot(this.rig.x - this.surge.x, this.rig.z - this.surge.z) - this.surge.r; return gap > 0 ? `OUTRUN THE WALL: ${Math.round(gap / 5) * 5} M BEHIND YOU` : 'OUTRUN THE WALL'; }
    return '';
  }
}
