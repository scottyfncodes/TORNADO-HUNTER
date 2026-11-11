// One mission, five phases, two seats:
//   1 CHASE     you drive: close on the storm, dodging what it throws while the crew shoot wreckage out of the air
//   2 GUNS      inside the danger zone you take the turret (first person, src/gunner.js) and the truck drives itself:
//               machine gun on the band's seam, rockets for anything armoured, and whatever you do not shoot down lands on you
//   3 HARPOON   back at the wheel: hook the weakened storm and it is dragged to a crawl
//   4 DOROTHY   the sensors are sucked up the funnel (the camera rides with them, the truck drives itself)
//   5 KILL SHOT the turret again: lock the launcher on the critical core, one rocket
// Storms with more than one band shed the outer ones to gunfire first (a debris wall, a bolt, chase again).
import * as THREE from '../vendor/three.module.min.js';
import { FEEL, PALETTE, CREW } from './config.js';
import { Storm } from './tornado.js';
import { Convoy } from './convoy.js';
import { Gunner, TARGET } from './gunner.js';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const SAT_RING = new THREE.RingGeometry(7, 8.6, 28), SAT_MAT = new THREE.MeshBasicMaterial({ color: PALETTE.accent, transparent: true, opacity: 0.85, depthWrite: false, fog: false, side: THREE.DoubleSide });
const BOUND = 1120;
// rolling starts: rig on a road at speed, storm already running ahead of it
const STARTS = { pete: [768, -1100, 0], agnes: [-1050, 768, Math.PI / 2], sisters: [256, 1050, Math.PI] };
const SMALL = ['cow', 'bale', 'cow', 'door', 'cow', 'sign'], BIG = ['car', 'tractor'];

export class Mission {
  constructor(G, def, loadout, upgrades, opts = {}) {
    this.G = G; this.def = def; this.coach = !!opts.coach; this.ef = def.ef + (opts.rematch || 0); this.rematch = opts.rematch || 0;
    const has = (id) => loadout.crew.includes(id), up = upgrades;
    this.crew = loadout.crew.map((id) => CREW.find((c) => c.id === id));
    this.p = {
      kill: FEEL.killSeconds + (has('doc') ? 3 : 0), dorothyThin: has('doc') ? 0.5 : 0.62,
      stagger: FEEL.staggerSeconds + (has('winch') ? 2 : 0), hook: FEEL.hookSeconds + (has('winch') ? 2 : 0) + up.winch * 1.5,
            regen: has('sparks') ? 1.3 : 0, dataMul: (has('june') ? 1.2 : 1) * (1 + this.rematch * 0.5), tele: 1 - this.rematch * 0.12,
    };
    this.zone = def.zone; this.pay = def.pay; this.stageMax = def.stageHp * (1 + this.rematch * 0.3); this.hp = this.stageMax;
    const w = G.world, [rx, rz, hd] = STARTS[def.id] || STARTS.pete, fx = Math.sin(hd), fz = Math.cos(hd);
    this.storm = new Storm(G.scene, G.sky.uniforms, def, w, { low: !!G.low }); this.storm.place(rx + fx * 330 + fz * 40, rz + fz * 330 - fx * 40);
    this.ai = { hx: fx, hz: fz, jukeT: rand(3.5, 5), pending: null, edgeCd: 0 };
    this.rig = G.makeRig(); const gun = this.rig.def.gun, gk = (has('june') ? 1.3 : 1); this.gun = gun;
    Object.assign(this.p, { mgRange: FEEL.mgRange * gun.range * gk, mgDps: FEEL.mgDebrisDps * gun.dps * gk, gunStorm: FEEL.gunStormDps * gun.dps * gk * (1 + up.cable * 0.1) });
    this.rig.place(rx, rz, hd, w); this.rig.vx = fx * 40; this.rig.vz = fz * 40; this.rig.speed = 40;
    this.convoy = new Convoy(G.scene, w, G.fx.dustTex); this.convoy.place(this.rig);
    this.phase = 'chase'; this.time = 0; this.phaseT = 0; this.stage = 0; this.data = 0; this.dataShown = 0; this.result = null;
    this.view = 'drive'; this.zoneLatch = false; this.autoHold = 0; this.inZone = false; this.killT = 0; this.cine = null; this.podBusy = false; this.harpoonBusy = false; this.reload = 0; this.shotgunCd = 0; this.mgT = 0; this.firing = 0;
    this.staggerT = 0; this.hookT = 0; this.line = null; this.surge = null; this.wind = null; this.windWait = 0; this.hz = []; this.sats = []; this.attackT = 3.2;
    this.dist = 330; this.tension = null; this.bark = null; this.barkT = 0; this.callout = null; this.calloutT = 0; this.far = 0;
    this.stats = { snaps: 0, shot: 0, rockets: 0, direct: 0, hits: 0, close: 0, dorothys: 0, fired: 0, crits: 0, sats: 0 };
    this.gn = new Gunner(this, up);
    this.say('start'); this.spawnSats();
  }
  dispose() { this.gn.dispose(); this.storm.dispose(); this.convoy.dispose(); for (const s of this.sats) { s.storm.dispose(); this.G.scene.remove(s.mark); } this.rig.dispose(); this.G.fx.reset(); }

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
      this.sats.push({ storm: st, mark, ang: (i / n) * 6.283, i, hit: 0, hp: 100 });
    }
  }

  // ---- two seats: the wheel and the turret ----
  // why: 'auto' (you crossed into the danger zone), 'manual' (you asked), 'kill' (the core is critical)
  enterGun(why) {
    if (this.result || this.gn.on || this.rig.dead) return; this.gn.enter(why); this.view = 'gun'; this.zoneLatch = true;
    if (why === 'auto') this.call('GUNS UP: AUTODRIVE', 'good', 1.1); else if (why === 'manual') this.call('AUTODRIVE', 'good', 0.7);
  }
  leaveGun(manual) { if (!this.gn.on) return; this.gn.exit(); this.view = 'drive'; if (manual) { this.autoHold = 4; this.call('YOU HAVE THE WHEEL', 'warn', 0.8); } } // you took the wheel on purpose: it stays yours for a few seconds whatever the range

  // ---- one context button at the wheel: GUNS, then HARPOON, then DOROTHY ----
  act() {
    const G = this.G, s = this.storm, r = this.rig, b = s.band; if (this.result || !b) return false;
    if (this.phase === 'chase') { this.enterGun('manual'); return true; }
    if (this.phase === 'stagger') { // phase 3
      if (this.harpoonBusy || this.dist > FEEL.harpoonRange) return false;
      this.harpoonBusy = true; G.audio.harpoon();
      G.fx.launchHarpoon(r.muzzle(_a), (out) => s.seam(b, r.x, r.z, out), () => {
        this.harpoonBusy = false; if (this.phase !== 'stagger' || s.band !== b) { G.fx.hideCable(0); return; }
        this.phase = 'rip'; this.phaseT = 0; this.hookT = this.p.hook; this.line = { L: Math.max(90, this.dist) }; G.audio.twang(); G.audio.stagger(); G.fx.hitStop(FEEL.hitStopHarpoon); G.fx.shake(8); this.call('HOOKED', 'good', 1.3);
        s.seam(b, r.x, r.z, _a); G.fx.energy.play(_a.x, _a.y, _a.z, 26, 26, { fps: 48 });
      });
      return true;
    }
    if (this.phase === 'rip') { // phase 4: DOROTHY. The camera goes with the sensors; the truck looks after itself.
      this.phase = 'dorothy'; this.phaseT = 0; this.stats.dorothys++; G.audio.probeLaunch(); this.say('probe'); this.clearHazards(true); r.immune = Math.max(r.immune, FEEL.dorothySeconds + 0.6);
      this.cine = { kind: 'pod', pos: G.fx.swarmCenter }; this.call('DOROTHY IS FLYING', 'good', 1.6);
      G.fx.launchSwarm(r.muzzle(_a), s, FEEL.dorothySeconds, () => {
        this.cine = null; if (this.phase !== 'dorothy') return;
        this.phase = 'kill'; this.phaseT = 0; this.killT = this.p.kill; this.reload = 0; s.thinTarget = Math.max(0.28, s.thinTarget * this.p.dorothyThin); this.enterGun('kill');
        G.audio.ping(); G.audio.dorothy(); G.audio.stagger(); G.fx.flash(0.6, PALETTE.signal); G.fx.shake(9); G.fx.hitStop(0.06); G.sky.strike(1); this.earn(10); this.call('CORE CRITICAL: KILL SHOT', 'good', 1.8);
        for (let i = 0; i < 5; i++) { s.spineAt(0.1 + i * 0.07, _a); G.fx.energy.play(s.x + _a.x, s.groundY + (0.1 + i * 0.07) * s.height, s.z + _a.z, 30, 30, { fps: 30 + i * 4 }); }
      });
      return true;
    }
    if (this.phase === 'kill') { this.enterGun('kill'); return true; } // phase 5 is fired from the turret
    return false;
  }
  // phase 5: the launcher is locked on the core. The camera rides with the rocket.
  killShot() {
    const G = this.G, r = this.rig; if (this.phase !== 'kill' || this.reload > 0 || this.result) return false;
    if (this.dist > FEEL.rocketRange) { this.call('OUT OF RANGE', 'warn', 0.7); return false; }
    this.reload = FEEL.rocketReload; G.audio.rocket(); G.fx.shake(4);
    r.muzzle(_a); G.fx.flashAt(_a.x, _a.y, _a.z, 7, '#ffb14a', 0.12); G.fx.puff(_a.x, _a.y, _a.z, 5, '#e9e2cc', 0.5, 2);
    const rk = G.fx.rocket(_a.clone(), (out) => this.aimPoint(out), FEEL.rocketSpeed * 0.7, (pt) => { this.cine = null; this.rocketHit(pt); });
    if (rk) { this.cine = { kind: 'rocket', pos: rk.p }; G.fx.slowMo(0.5); r.immune = Math.max(r.immune, 1.5); }
    return true;
  }
  killSat(st) {
    if (st.dead) return; const G = this.G, q = st.storm; st.dead = true; q.die(); this.stats.sats++; this.earn(5);
    G.fx.burst(q.x, q.groundY + 16, q.z, 16, ['#5d6b62', '#b89a58', '#1d2a2b'], 8); G.audio.boom(0.7); this.call('SATELLITE DOWN', 'good', 0.8);
  }
  aimPoint(out) { const s = this.storm, b = s.band; return b && s.alive ? s.seam(b, this.rig.x, this.rig.z, out) : out.set(s.x, s.groundY + 30, s.z); }
  rocketHit(pt) {
    const G = this.G; G.fx.explode(pt.x, pt.y, pt.z, 28); G.audio.boom(1); G.fx.shake(FEEL.shakeRocket * 1.6); this.storm.hit = 1;
    if (this.result || this.phase !== 'kill') return;
    this.stats.direct++; this.ripBand();
  }
  actionState() {
    const ph = this.phase, d = this.dist;
    if (ph === 'chase') return { label: 'GUNS', ready: true, fill: 0, hint: d > this.zone ? 'AUTODRIVE' : 'IN RANGE' };
    if (ph === 'stagger') return { label: 'HARPOON', ready: !this.harpoonBusy && d < FEEL.harpoonRange, danger: true, fill: 0, hint: d > FEEL.harpoonRange ? 'CLOSER' : `${Math.ceil(this.staggerT)} s` };
    if (ph === 'rip') return { label: 'DOROTHY', ready: true, danger: true, fill: 0, hint: `${Math.ceil(this.hookT)} s` };
    if (ph === 'dorothy') return { label: 'DOROTHY', ready: false, fill: 0, hint: 'AWAY' };
    if (ph === 'kill') return { label: 'KILL SHOT', ready: this.reload <= 0, danger: true, fill: 0, hint: `${Math.ceil(this.killT)} s` };
    return { label: 'GUNS', ready: false, fill: 0, hint: '' };
  }

  // ---- damage both ways ----
  damageStorm(n, pt, crit) {
    if (this.phase !== 'chase' || this.result) return;
    const was = this.hp / this.stageMax; this.hp -= n; const is = this.hp / this.stageMax; this.storm.hit = Math.max(this.storm.hit || 0, crit ? 1 : 0.6);
    // a band fails in stages you can see and hear: it cracks at two thirds, it is coming apart at one third
    for (const th of [0.66, 0.33]) if (was > th && is <= th && is > 0 && pt) {
      const G = this.G; G.fx.energy.play(pt.x, pt.y, pt.z, 44, 44, { fps: 44 }); G.fx.ringAt(pt.x, pt.y, pt.z, 40, th > 0.5 ? PALETTE.primary : PALETTE.accent, 0.4); G.audio.crack(); G.audio.stormCrack(th < 0.5); G.fx.shake(4); this.call(th > 0.5 ? 'BAND CRACKING' : 'BAND FAILING', 'good', 0.8);
    }
    if (this.hp <= 0) {
      this.hp = 0; const G = this.G, s = this.storm;
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, rr = s.radiusAt(0.1) * 1.4; G.fx.explode(s.x + Math.cos(a) * rr, s.groundY + 18 + Math.random() * 30, s.z + Math.sin(a) * rr, 14); }
      if (s.bandsLeft > 1) { this.call('BAND SHOT OFF', 'good', 1.4); this.ripBand(); return; }   // an outer band: it sheds it, surges and runs
      this.leaveGun(); this.phase = 'stagger'; this.phaseT = 0; this.staggerT = this.p.stagger; this.attackT = 2.5; this.wind = null;
      G.audio.stagger(); G.audio.boom(0.9); G.fx.hitStop(0.08); G.fx.shake(11); G.fx.flash(0.6); G.sky.strike(0.8); this.call('WEAKENED: HARPOON IT', 'good', 1.8); this.clearHazards(true);
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
    if (kind === 'cow' && this.time - (this.mooT || -9) > 1.6) { this.mooT = this.time; G.audio.moo(); if (Math.random() < 0.4) this.call('COW', 'bad', 0.7); }
    const rad = big ? 10 : 7.5, lock = dur - Math.max(0.75, dur * 0.42), off = { x: -uz * lateral, z: ux * lateral };
    const tele = G.fx.telegraph(tx, tz, rad, dur + 0.05, null, { lock, track: (e, dt) => { const left = Math.max(0.2, h.dur - h.t), k = Math.min(1, dt * 4); e.x += (clamp(r.x + r.vx * left * lead + off.x, -1480, 1480) - e.x) * k; e.z += (clamp(r.z + r.vz * left * lead + off.z, -1480, 1480) - e.z) * k; h.tx = e.x; h.tz = e.z; h.ty = G.fx.ground(e.x, e.z) + 1; } });
    const hp = big ? FEEL.wreckHpBig : FEEL.wreckHp; this.hz.push({ h, big, hp, max: hp, rad, state: 'fly', tele });
  }
  dropHazard(z, how) { // shot down, landed small, or blasted
    const G = this.G, h = z.h; if (z.tele) { z.tele.on = false; z.tele.g.visible = false; }
    if (how !== 'land') { // it comes apart in its own colours, still carrying the way it was going
      const k = h.landed ? 0 : 0.3 / h.dur; G.fx.burst(h.x, h.y, h.z, z.big ? 15 : 9, TARGET[h.kind].cols, z.big ? 11 : 6, (h.tx - h.fx) * k, 3, (h.tz - h.fz) * k);
      G.audio.crack(); if (z.big) G.audio.boom(0.55); this.stats.shot++; this.earn(this.view === 'gun' ? 4 : 2); this.rig.addBoost(FEEL.boostFromKill * (z.big ? 2 : 1));
    }
    G.fx.freeHazard(h); z.state = 'gone';
  }
  clearHazards(all) { for (const z of this.hz) if (z.state !== 'gone' && (all || z.state === 'fly')) this.dropHazard(z, 'land'); this.hz.length = 0; this.G.fx.clearTelegraphs(); }
  attack() {
    const stage = Math.min(this.stage, this.def.attacks.length - 1), list = this.def.attacks[stage], kind = list[(Math.random() * list.length) | 0];
    const G = this.G, fx = G.fx, r = this.rig, pick = (a) => a[(Math.random() * a.length) | 0];
    if (kind === 'debris') { const n = this.def.volley[stage] + (this.rematch ? 1 : 0); for (let i = 0; i < n; i++) this.throwAt(pick(SMALL), 1.0 + i * 0.14, i ? rand(-13, 13) : rand(-1.5, 1.5), i * 0.16); G.audio.whistle(1.3); }
    else if (kind === 'big') { this.throwAt(pick(BIG), 1.0, rand(-3, 3)); G.audio.whistle(1.7); this.call('INCOMING', 'bad', 0.9); }
    else if (kind === 'field') { const gun = this.view === 'gun', gap = gun ? -1 : (Math.random() * 4) | 0; [-21, -7, 7, 21].forEach((o, i) => { if (i !== gap && !(gun && (i === 0 || i === 3))) this.throwAt(i % 2 ? pick(BIG) : pick(SMALL), 1.0, o + rand(-2, 2), i * 0.1); }); G.audio.whistle(1.8); this.call('DEBRIS FIELD', 'bad', 1.1); }
    else if (kind === 'lightning') {
      const dur = Math.max(FEEL.telegraphMin, 1.3 * this.p.tele), lock = dur - 0.5;
      fx.telegraph(r.x, r.z, 11, dur, (e) => {
        const y = fx.ground(e.x, e.z); fx.lightning.play(e.x, y, e.z, 120, 170, { ground: true, fps: 30 }); fx.lightning.play(e.x + 6, y, e.z - 4, 90, 150, { ground: true, fps: 36, rot: 0.1 });
        G.sky.strike(1); fx.flash(0.7); G.audio.thunder(); fx.shake(6); const d = Math.hypot(r.x - e.x, r.z - e.z); if (d < 10.5) this.hurt(FEEL.dmgLightning); else if (d < 24) this.closeCall();
      }, { lock, track: (e, dt) => { const k = Math.min(1, dt * 5), lead = this.view === 'gun' ? 0.16 : 0.3; e.x += (r.x + r.vx * lead - e.x) * k; e.z += (r.z + r.vz * lead - e.z) * k; } }); // on the gun you cannot swerve: it trails a truck at speed and finds a slow one
      G.audio.warn();
    } else if (kind === 'crosswind') { const side = Math.random() < 0.5 ? 1 : -1; this.windWait = Math.max(FEEL.telegraphMin, 0.95 * this.p.tele); this.windSide = side; this.call(side > 0 ? 'CROSSWIND  >>>' : '<<<  CROSSWIND', 'bad', this.windWait + 0.4); G.audio.warn(); }
  }

  // ---- the harpoon pays off ----
  ripBand() {
    const s = this.storm, b = s.band, G = this.G, fx = G.fx, r = this.rig; if (!b) return;
    s.seam(b, r.x, r.z, _a); const bx = _a.x, by = _a.y, bz = _a.z;
    s.snapBand(b); this.stats.snaps++; this.stage++; this.line = null; this.cine = null; fx.hideCable(0); this.clearHazards(true); this.leaveGun(); this.zoneLatch = false;
    fx.debris(bx, by, bz, 10, ['#5d6b62', '#b89a58', '#1d2a2b'], 2.2, 30);
    fx.hitStop(FEEL.hitStopBandSnap); fx.shake(FEEL.shakeBandSnap); fx.flash(1); G.audio.bandSnap(); G.audio.boom(1); G.sky.strike(1.2);
    fx.energy.play(bx, by, bz, 80, 80, { fps: 40 }); fx.explode(bx, by, bz, 26);
    const each = this.pay / 12; fx.shardBurst(s.x, s.groundY + 12, s.z, 12, r, (i) => { this.earn(each); G.audio.pickup(i); });
    this.say('snap'); for (const st of this.sats) { st.storm.die(); st.dead = true; }
    if (s.bandsLeft === 0) { this.end(true, 'destroyed'); return; }
    // it does not take that quietly: a wall of debris rolls out from where it stood, and it bolts
    this.phase = 'surge'; this.phaseT = 0; this.surge = { x: s.x, z: s.z, r: 24, hit: false }; this.hp = this.stageMax; this.attackT = 4.5;
    const a = Math.atan2(s.z - r.z, s.x - r.x) + rand(-0.9, 0.9); this.ai.hx = Math.cos(a); this.ai.hz = Math.sin(a); this.ai.pending = null; this.ai.jukeT = rand(3, 4.5);
    const n = this.gn.resupply(); this.call(n ? `GET CLEAR  ·  +${n} ROCKETS` : 'GET CLEAR', 'bad', 1.8); G.audio.warn(); r.immune = Math.max(r.immune, 0.4);
  }
  end(won, reason) {
    if (this.result) return; const s = this.storm, fx = this.G.fx;
    this.leaveGun(); this.phase = won ? 'won' : 'lost'; this.phaseT = 0; this.cine = null; this.clearHazards(true); fx.hideCable(0); fx.hideRing(); this.line = null; this.surge = null; this.wind = null;
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
      if (d < 420 && !out) { let turn = ang - cur; turn = Math.atan2(Math.sin(turn), Math.cos(turn)); if (Math.abs(turn) > 0.5 && this.view === 'drive') { if (this.coach && !this.taughtDrift) { this.taughtDrift = true; this.call('BRAKE + STEER = DRIFT', 'good', 2.2); } else this.call('IT IS TURNING', 'warn', 0.9); } }
    }
    let sp = this.def.run * (1 + this.rematch * 0.1) * (1 + 0.06 * this.stage);
    // rubber band: it never simply leaves, and it never lets you sit on it
    sp *= d > 430 ? 0.5 : d > 230 ? 0.5 + 0.5 * (430 - d) / 200 : d < 100 ? 1.1 : 1;
    // whatever the storm, it never outruns your rig across open country until you are on top of it
    if (d > 170) sp = Math.min(sp, FEEL.rigTopSpeedField * this.rig.def.speed * 0.94);
    if (this.phase === 'stagger') sp *= 0.7; else if (this.phase === 'rip' || this.phase === 'dorothy' || this.phase === 'kill') sp *= 0.12; else if (this.phase === 'surge') sp = this.def.run * 1.35;
    if (over) sp = this.phase === 'won' ? 0 : sp * 0.5;
    s.moveX = a.hx; s.moveZ = a.hz; s.moveSpeed = sp; s.thrash = this.phase === 'stagger' || this.phase === 'rip' || this.phase === 'kill' ? 10 : 0; s.update(dt, t);
  }

  update(dt, t, axes, input) {
    const G = this.G, s = this.storm, r = this.rig, fx = G.fx, w = G.world;
    this.time += dt; this.phaseT += dt; this.barkT -= dt; this.calloutT -= dt; this.reload = Math.max(0, this.reload - dt); this.shotgunCd = Math.max(0, this.shotgunCd - dt); this.firing = Math.max(0, this.firing - dt); this.autoHold = Math.max(0, this.autoHold - dt);
    const over = this.phase === 'won' || this.phase === 'lost';
    let dx = r.x - s.x, dz = r.z - s.z, dist = Math.hypot(dx, dz) || 0.01; this.dist = dist; let nx = dx / dist, nz = dz / dist;
    r.aim = Math.atan2(-dx, -dz); r.alert = dist < 420 && s.alive ? 1 : 0;

    // ---- input: at the wheel, BOOST and the action button; on the gun, the sights and the trigger (src/gunner.js) ----
    if (!over) {
      // crossing into the danger zone puts you on the gun; leave it yourself and it stays your call until you come back in
      if (this.phase === 'chase' && this.view === 'drive') { if (this.inZone && !this.zoneLatch) { if (this.phaseT > 0.5 && this.autoHold <= 0 && r.stun <= 0 && r.air <= 0) this.enterGun('auto'); } else if (dist > this.zone * 1.12) this.zoneLatch = false; }
      this.gn.handle(dt, input);
      if (this.view === 'drive' && input.take('action', FEEL.inputBuffer)) { if (!this.act()) { G.audio.deny(); G.hud.deny('btn-action'); } }
      if (this.view === 'drive' && input.take('boost')) { if (r.boost()) { G.audio.boost(); fx.shake(4); G.kickFov(); const bx = r.x - Math.sin(r.heading) * 3, bz = r.z - Math.cos(r.heading) * 3; fx.flashAt(bx, r.y + 1, bz, 7, '#ff9a3c', 0.18); for (let i = 0; i < 5; i++) fx.puff(bx + rand(-1.5, 1.5), r.y + 0.8, bz + rand(-1.5, 1.5), 4 + i, '#e9e2cc', 0.6, 2); } else { G.audio.deny(); G.hud.deny('btn-boost'); } }
    }

    // hands off: on the gun, and while the camera is away with DOROTHY or the rocket, the truck drives itself
    if (!over && (this.view === 'gun' || this.phase === 'dorothy' || (this.cine && this.cine.kind === 'rocket'))) axes = this.gn.autodrive(dt);

    // ---- the storm moves ----
    this.drive(dt, t, over);
    if (this.phase === 'stagger') { this.staggerT -= dt; if (this.staggerT <= 0 && !this.harpoonBusy) { this.phase = 'chase'; this.phaseT = 0; this.hp = this.stageMax * FEEL.staggerRecover; this.zoneLatch = false; this.call('SHIELD REFORMING', 'bad', 1.4); G.audio.warn(); } }

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
    if ((this.phase === 'rip' || this.phase === 'dorothy' || this.phase === 'kill') && this.line && b) {
      // hooked: the storm is dragged to a crawl and you are on a leash
      this.tension = 0.5 + 0.5 * Math.sin(t * 9);
      const stretch = dist - this.line.L - 25; if (stretch > 0) { const k = Math.min(70, 3.2 * stretch); ax -= nx * k; az -= nz * k; }
      if (Math.random() < dt * 12) { s.seam(b, r.x, r.z, _a); fx.flashAt(_a.x, _a.y, _a.z, 9, '#ff3f8e', 0.1); }
      fx.shake(this.view === 'gun' ? 0.6 : 2);
      if (this.phase === 'rip') this.hookT -= dt; else if (this.phase === 'kill' && !(this.cine && this.cine.kind === 'rocket')) this.killT -= dt;
      if ((this.phase === 'rip' && this.hookT <= 0) || (this.phase === 'kill' && this.killT <= 0)) { this.leaveGun(); this.zoneLatch = false; this.phase = 'chase'; this.phaseT = 0; this.line = null; fx.hideCable(0); this.hp = this.stageMax * FEEL.hookRecover; s.thinTarget = 0.42 + 0.58 * s.bandsLeft / s.bands.length; fx.endSwarm(); this.call('LINE LET GO', 'bad', 1.4); G.audio.lineSnap(); }
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
      const z = this.hz[i]; if (!z) continue; // the list is cleared when the fight ends mid-loop
      const h = z.h; if (z.state === 'gone') { this.hz.splice(i, 1); continue; }
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
    // ---- the guns. On the turret they are yours. At the wheel the crew cover the truck: they shoot wreckage, never the storm ----
    this.inZone = dist < this.zone;
    if (!over) {
      if (this.view === 'gun') { r.aim = this.gn.yaw; this.gn.update(dt, input); }
      else if (target && target.state === 'fly') { const h = target.h; _b.set(h.x, h.y, h.z); this.mg(dt, _b, this.gun.every); target.hp -= this.p.mgDps * FEEL.crewGunShare * dt; h.dmg = clamp(1 - target.hp / target.max, 0, 1); if (target.hp <= 0) this.dropHazard(target, 'mg'); }
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
      this.attackT -= dt * (this.inZone ? 1.1 : 1); if (this.attackT <= 0) { const ev = this.def.attackEvery[Math.min(this.stage, this.def.attackEvery.length - 1)]; this.attackT = ev * rand(0.8, 1.2) * this.p.tele * (this.view === 'gun' ? FEEL.gunnerBreather : 1); this.attack(); }
    }

    // ---- cable, rings, what the storm ate ----
    // the band's ring is the shield: wheat segments that go out as it breaks, green when the core is bare, magenta when hooked
    // and it changes colour as it fails: wheat, amber under two thirds, flickering magenta under one third. The funnel thins with it.
    const frac = this.hp / this.stageMax;
    if (b) { b.exposed = true; b.strain = this.phase === 'chase' || this.phase === 'surge' ? frac : this.phase === 'dorothy' || this.phase === 'kill' ? 0.3 : 1; b.tone = this.phase === 'kill' || this.phase === 'dorothy' ? PALETTE.accent : this.phase === 'rip' ? PALETTE.primary : this.phase === 'stagger' ? PALETTE.signal : s.hit > 0.75 ? '#fff1c2' : frac > 0.66 ? PALETTE.wheat : frac > 0.33 ? PALETTE.primary : Math.sin(t * 22) > -0.3 ? PALETTE.accent : PALETTE.primary; }
    if (this.phase === 'chase' && s.alive) s.thinTarget = 0.42 + 0.58 * (s.bandsLeft - 0.45 * (1 - frac)) / s.bands.length;
    if (this.line && b && (this.phase === 'rip' || this.phase === 'dorothy' || this.phase === 'kill')) { r.muzzle(_a); s.seam(b, r.x, r.z, _b); fx.setCable(0, _a, _b, (this.phase === 'rip' ? this.hookT : this.killT) < 2.5 && this.phase !== 'dorothy' ? 1.2 : 0.7, t); }
    else if (!this.harpoonBusy) fx.hideCable(0);
    // the danger zone: amber while you are outside it, green once the guns can reach
    if (!this.surge) { if (!over && this.phase === 'chase' && dist < this.zone * 2.6) fx.setRing(s.x, s.z, this.zone, 1, this.inZone ? 0.28 : 0.45 + 0.2 * Math.sin(t * 5), this.inZone ? PALETTE.signal : PALETTE.primary, this.inZone ? 3 : 5); else fx.hideRing(); }
    this.convoy.update(dt, t, r, s);
    w.update(dt, s);
    for (const e of w.events) { if (e.kind === 'rip') { fx.puff(e.x, e.y + 3, e.z, e.big ? 22 : 9, '#b89a58', 1.2); if (e.cow && dist < 420 && this.time - (this.mooT || -9) > 2.2) { this.mooT = this.time; G.audio.moo(); } if (e.big && dist < 500) { G.audio.smash(); fx.shake(3); } } else if (e.kind === 'land' && Math.hypot(e.x - r.x, e.z - r.z) < 120) fx.puff(e.x, e.y + 1, e.z, 7); }
    w.events.length = 0;
    s.hit = Math.max(0, (s.hit || 0) - dt * 3); const core = this.phase === 'dorothy' ? 0.3 + 0.5 * Math.min(1, this.phaseT / FEEL.dorothySeconds) : this.phase === 'kill' ? 0.85 + 0.15 * Math.sin(t * 18) : this.phase === 'stagger' || this.phase === 'rip' ? 0.5 + 0.2 * Math.sin(t * 10) : Math.max(s.hit * 0.8, this.inZone && this.firing > 0 ? 0.18 : 0);
    s.mat.uniforms.uCore.value += (core - s.mat.uniforms.uCore.value) * Math.min(1, dt * 10);
    this.far = dist > 460 ? this.far + dt : 0;
    this.dataShown += (this.data - this.dataShown) * Math.min(1, dt * 8);
  }
  mg(dt, pos, every) {
    const G = this.G, r = this.rig; r.aim = Math.atan2(pos.x - r.x, pos.z - r.z); this.firing = 0.15; this.mgT -= dt; if (this.mgT > 0) return; this.mgT = every;
    const snd = this.gun.sound;
    r.muzzle(_a); _c.set(pos.x + rand(-1.2, 1.2), pos.y + rand(-1.2, 1.2), pos.z + rand(-1.2, 1.2)); G.fx.tracer(_a, _c); G.fx.sparks(_c.x, _c.y, _c.z, 1, 2.5, 12, '#ffd27a'); G.fx.flashAt(_a.x, _a.y, _a.z, snd === 'cannon' ? 5 : 2.6, '#ffd27a', 0.05); G.audio[snd](); if (snd === 'cannon') { G.fx.tracer(_a, _c); G.fx.flashAt(_c.x, _c.y, _c.z, 6, '#ffb14a', 0.12); }
    if (Math.random() < 0.35) G.fx.flashAt(_c.x, _c.y, _c.z, 2.2, '#ffe9b0', 0.06);
  }
  shotgun(z) {
    const G = this.G, r = this.rig, h = z.h; this.shotgunCd = FEEL.shotgunReload * (this.view === 'gun' ? FEEL.gunnerShotgun : 1); r.muzzle(_a); r.aim = Math.atan2(h.x - r.x, h.z - r.z);
    for (let i = 0; i < 7; i++) { _c.set(h.x + rand(-4, 4), h.y + rand(-3, 3), h.z + rand(-4, 4)); G.fx.tracer(_a, _c); }
    G.fx.flashAt(_a.x, _a.y, _a.z, 8, '#fff1c4', 0.1); G.audio.shotgun(); G.fx.shake(5); this.dropHazard(z, 'shotgun'); this.call('BOOM', 'good', 0.5);
  }

  // the one line of coaching for this moment
  coachLine() {
    const ph = this.phase, d = this.dist;
    if (ph === 'chase') {
      if (this.view === 'gun') {
        const g = this.gn, big = this.hz.some((z) => z.state === 'fly' && z.big);
        if (d > this.zone) return `AUTODRIVE IS CLOSING IN: ${Math.round((d - this.zone) / 5) * 5} M`;
        if (g.weapon === 'rocket') return 'ROCKETS: HOLD ON TARGET TO LOCK';
        if (big && g.rockets > 0) return 'ARMOUR INCOMING: SWAP TO ROCKETS';
        return big ? 'SHOOT IT DOWN BEFORE IT LANDS' : 'SHOOT THE BRIGHT SEAM';
      }
      if (this.far > 2.5) return 'CATCH IT: ROADS ARE FASTER';
      if (d > 250 && this.rig.boostCharge >= 1) return 'BOOST TO CLOSE IN';
      if (d > this.zone) return `GET INSIDE THE DANGER ZONE: ${Math.round((d - this.zone) / 5) * 5} M`;
      return 'IN RANGE: TAP GUNS TO TAKE THE TURRET';
    }
    if (ph === 'stagger') return d > FEEL.harpoonRange ? 'WEAKENED: GET CLOSER' : 'WEAKENED: HARPOON IT';
    if (ph === 'rip') return 'HOOKED: SEND DOROTHY';
    if (ph === 'dorothy') return 'DOROTHY IS READING THE CORE';
    if (ph === 'kill') return this.gn.locked ? 'LOCKED: FIRE THE KILL SHOT' : 'CORE CRITICAL: AIM AT THE GLOW';
    if (ph === 'surge' && this.surge) { const gap = Math.hypot(this.rig.x - this.surge.x, this.rig.z - this.surge.z) - this.surge.r; return gap > 0 ? `OUTRUN THE WALL: ${Math.round(gap / 5) * 5} M BEHIND YOU` : 'OUTRUN THE WALL'; }
    return '';
  }
}
