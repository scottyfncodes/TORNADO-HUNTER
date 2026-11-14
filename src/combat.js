// One mission, five phases, two seats:
//   1 CHASE     you drive: close on the storm, dodging what it throws while the crew shoot wreckage out of the air
//   2 GUNS      inside the danger zone you take the turret (first person, src/gunner.js) and the truck drives itself:
//               machine gun on the band's seam, rockets for anything armoured, and whatever you do not shoot down lands on you
//   3 HARPOON   back at the wheel: hook the weakened storm and it is dragged to a crawl
//   4 DOROTHY   the hooked storm is restrained, not tamed: it fights the line (src/tether.js). You drive Doc's bus right to its foot, past its lunges, DOROTHY is set down there, and you
//               deploy the sensors: they are sucked up the funnel (the camera rides with them, the trucks drive themselves)
//   5 KILL SHOT the turret again: lock the launcher on the critical core, one rocket
// Storms with more than one band shed the outer ones to gunfire first (a debris wall, a bolt, chase again).
import * as THREE from '../vendor/three.module.min.js';
import { FEEL, PALETTE, CREW, BUS, TETHER, GRADE } from './config.js';
import { Rig } from './rig.js';
import { box, cyl, merge } from './geo.js';
import { Storm } from './tornado.js';
import { Convoy } from './convoy.js';
import { Gunner, TARGET } from './gunner.js';
import { Tether } from './tether.js';
import { stream } from './daily.js';
import { SetPiece } from './setpiece.js';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const SAT_RING = new THREE.RingGeometry(7, 8.6, 28), SAT_MAT = new THREE.MeshBasicMaterial({ color: PALETTE.accent, transparent: true, opacity: 0.85, depthWrite: false, fog: false, side: THREE.DoubleSide });
const BOUND = 1120;
// rolling starts: rig on a road at speed, storm already running ahead of it
const STARTS = { pete: [768, -1100, 0], agnes: [-1050, 768, Math.PI / 2], sisters: [256, 1050, Math.PI] };
const SEATS = { harpoon: 'harpoon', kill: 'rocket' };
// DOROTHY herself: a steel drum of sensors with a beacon on it, set down at the foot of the funnel
const DOROTHY_GEO = merge([cyl(0.95, 1.05, 1.5, '#c9cdca', 0, 0.75, 0, 10), cyl(1.0, 1.0, 0.22, '#e8b21c', 0, 0.5, 0, 10), cyl(1.0, 1.0, 0.22, '#e8b21c', 0, 1.1, 0, 10), cyl(0.8, 0.95, 0.12, '#1b2224', 0, 1.56, 0, 10),
  cyl(0.2, 0.2, 0.5, '#62f58c', 0.4, 1.85, 0.25, 7), cyl(0.2, 0.2, 0.5, '#62f58c', -0.4, 1.85, 0.25, 7), cyl(0.2, 0.2, 0.5, '#62f58c', 0, 1.85, -0.42, 7), box(0.08, 1.3, 0.08, '#1b2224', 0, 2.2, 0), box(0.3, 0.3, 0.3, '#ffc531', 0, 2.95, 0)]);
const SMALL = ['cow', 'bale', 'cow', 'door', 'cow', 'sign'], BIG = ['car', 'tractor'];

export class Mission {
  constructor(G, def, loadout, upgrades, opts = {}) {
    this.G = G; this.def = def; this.coach = !!opts.coach; this.daily = opts.daily || null; this.seed = opts.seed ?? null; // daily: 'scored' or 'practice'
    // the decisions that make a fight this fight, each from its own stream: seeded (the Daily Storm) the same for everyone
    const S = (name) => (this.seed === null ? Math.random : stream(this.seed, name)); this.rj = S('juke'); this.ra = S('attack'); this.rt = S('tether'); this.rs = S('setpiece'); this.ef = def.ef + (opts.rematch || 0); this.rematch = opts.rematch || 0;
    const has = (id) => loadout.crew.includes(id), up = upgrades;
    this.crew = loadout.crew.map((id) => CREW.find((c) => c.id === id)).filter(Boolean); // none, one or two lead
    this.p = {
      kill: FEEL.killSeconds + (has('doc') ? 3 : 0), dorothyThin: has('doc') ? 0.5 : 0.62,
      stagger: FEEL.staggerSeconds + (has('winch') ? 2 : 0), hook: FEEL.hookSeconds + (has('winch') ? 2 : 0) + up.winch * 1.5,
            regen: has('sparks') ? 1.3 : 0, dataMul: (has('june') ? 1.2 : 1) * (1 + this.rematch * 0.5), tele: 1 - this.rematch * 0.12,
    };
    this.zone = def.zone; this.pay = def.pay; this.stageMax = def.stageHp * (1 + this.rematch * 0.3); this.hp = this.stageMax;
    const w = G.world, [rx, rz, hd] = STARTS[def.id] || STARTS.pete, fx = Math.sin(hd), fz = Math.cos(hd), lead = def.lead || FEEL.startLead;
    this.storm = new Storm(G.scene, G.sky.uniforms, def, w, { low: !!G.low }); this.storm.place(rx + fx * lead + fz * 40, rz + fz * lead - fx * 40);
    this.ai = { hx: fx, hz: fz, jukeT: this.jr(3.5, 5), pending: null, edgeCd: 0 };
    this.rig = G.makeRig(); const gun = this.rig.def.gun, gk = (has('june') ? 1.3 : 1); this.gun = gun;
    // wreckRange: how far out your turret reaches wreckage (the rig's gun); mgRange: the crew's cover at the wheel
    Object.assign(this.p, { wreckRange: FEEL.gunWreckRange * gun.range, mgRange: FEEL.mgRange * gun.range * gk, mgDps: FEEL.mgDebrisDps * gun.dps * gk, gunStorm: FEEL.gunStormDps * gun.dps * gk * (1 + up.cable * 0.1) });
    this.rig.place(rx, rz, hd, w); this.rig.vx = fx * 40; this.rig.vz = fz * 40; this.rig.speed = 40;
    this.convoy = new Convoy(G.scene, w, G.fx.dustTex); this.convoy.place(this.rig);
    this.phase = 'chase'; this.time = 0; this.phaseT = 0; this.stage = 0; this.data = 0; this.dataShown = 0; this.owed = 0; this.result = null; // owed: band data on its way to the truck as shards, before the multiplier
    this.view = 'drive'; this.zoneLatch = false; this.autoHold = 0; this.inZone = false; this.killT = 0; this.cine = null; this.podBusy = false; this.harpoonBusy = false; this.reload = 0; this.shotgunCd = 0; this.mgT = 0; this.firing = 0;
    this.staggerT = 0; this.hookT = 0; this.tether = null; this.tetherSeed = 0; this.mercyT = 0; this.taughtLunge = false; this.home = null; this.busUnit = null; this.dropped = false; this.line = null; this.surge = null; this.wind = null; this.windWait = 0; this.hz = []; this.sats = []; this.attackT = 3.2;
    this.dist = lead; this.tension = null; this.bark = null; this.barkT = 0; this.callout = null; this.calloutT = 0; this.calloutUp = 0; this.callQ = []; this.far = 0;
    this.seatT = -9; this.attacks = 0; this.lastAttack = ''; this.lastAimed = false; this.pipT = 0; this.seatWhy = ''; this.seatNote = null; this.skipped = false;
    this.stats = { snaps: 0, shot: 0, rockets: 0, direct: 0, hits: 0, close: 0, dorothys: 0, fired: 0, rounds: 0, crits: 0, sats: 0 }; // fired: turret rounds that hit something, rounds: all of them
    // how each phase went, for the share text: hull lost at the wheel and the turret's rounds per band, each window of the finale
    this.rec = { wheel: [], rounds: [], hits: [], harpoon: [], dorothy: [], kill: [], busHits: 0 };
    this.gn = new Gunner(this, up);
    this.dorothy = new THREE.Mesh(DOROTHY_GEO, new THREE.MeshLambertMaterial({ vertexColors: true })); this.dorothy.scale.setScalar(1.5); this.dorothy.visible = false; G.scene.add(this.dorothy);
    this.say('start'); this.spawnSats(); this.sp = new SetPiece(this);
  }
  dispose() { this.sp.dispose(); this.leaveBus(); this.G.scene.remove(this.dorothy); this.dorothy.material.dispose(); this.gn.dispose(); this.storm.dispose(); this.convoy.dispose(); for (const s of this.sats) { s.storm.dispose(); this.G.scene.remove(s.mark); } this.rig.dispose(); this.G.fx.reset(); }

  jr(a, b) { return a + this.rj() * (b - a); } // a juke draw
  ar(a, b) { return a + this.ra() * (b - a); } // an attack draw
  say(key, who) { const c = who || this.crew[(Math.random() * this.crew.length) | 0]; if (!c) return; this.bark = { name: c.name, text: c.barks[key] }; this.barkT = 3.4; }
  // one callout at a time, and everything that matters gets read. pri: 4 a turn in the fight (BAND SHOT OFF, WEAKENED: they
  // clear the sky), 3 a threat, 2 a beat, 1 chatter (BOOM, CLOSE CALL, the band cracking: the sound and the bar carry it). Nothing is replaced before it has been up FEEL.calloutRead unless by something more urgent, and a beat that
  // was cut short comes back afterwards. Chatter that would have to wait is dropped. next: wait behind whatever is up.
  call(text, tone = 'warn', dur = 1.5, pri, next) {
    const c = { text, tone, dur, pri: pri ?? (tone === 'bad' ? 3 : 2), at: this.time }, cur = this.calloutT > 0 ? this.callout : null;
    const read = cur ? this.calloutUp >= Math.min(FEEL.calloutRead, cur.dur) : true;
    if (!cur || (!next && ((read && c.pri >= cur.pri) || c.pri > cur.pri))) {
      if (cur && !read && cur.pri >= 2 && !cur.moot) { cur.dur = Math.max(FEEL.calloutRead, this.calloutT); cur.at = this.time; this.callQ.unshift(cur); } // cut short: it comes back
      this.showCall(c);
    } else if (c.pri >= 2) { this.callQ.push(c); this.callQ.sort((a, b) => b.pri - a.pri); if (this.callQ.length > 3) this.callQ.length = 3; }
  }
  // every seat change the game makes for you comes with its reason on the coach line, then how to take the wheel back
  // (design question 4: being put on the gun must never feel like having the wheel taken away)
  note(text, then) { this.seatNote = { text, then: then || null, at: this.time }; }
  noteLine() {
    const n = this.seatNote; if (!n) return ''; const age = this.time - n.at;
    if (age < FEEL.seatNoteSeconds) return n.text; if (n.then && age < FEEL.seatNoteSeconds * 2) return (n.shown = typeof n.then === 'function' ? n.then() : n.then); this.seatNote = null; return '';
  }
  // the two cinematics: skippable once each has been watched to the end
  canSkip() { const c = this.cine, seen = this.G.save && this.G.save.s.seen; return !!(c && seen && !this.result && (c.kind === 'pod' ? seen.dorothy : seen.kill)); }
  sawCine(kind) { const s = this.G.save; if (!s || this.skipped || s.s.seen[kind]) return; s.s.seen[kind] = true; s.write(); }
  skipCine() { if (!this.canSkip()) return false; this.skipped = true; if (this.cine.kind === 'pod') this.G.fx.skipSwarm(); else this.G.fx.skipRockets(); return true; }
  // the sky has been cleared (a band shot off, the storm weakened): what was about to be said about it is moot, and so is a crosswind still coming
  clearCalls() { for (const c of [this.callout, ...this.callQ]) if (c && c.pri <= 3) c.moot = true; this.callQ.length = 0; this.windWait = 0; this.wind = null; }
  showCall(c) { this.callout = c; this.calloutT = c.dur; this.calloutUp = 0; }
  tickCall(dt) {
    this.calloutT -= dt; this.calloutUp += dt; if (this.calloutT > 0) return;
    while (this.callQ.length) { const c = this.callQ.shift(); if (c.pri >= 3 || this.time - c.at < FEEL.calloutStale) { this.showCall(c); return; } } // a beat that waited too long is old news
  }
  // data is earned until the fight has a result, and never after: what is still in the air when it ends is settled once, in end()
  earn(n) { if (this.result) return; this.data += n * this.p.dataMul; }
  get dropR() { return this.storm.radiusAt(0.02) + FEEL.dropMargin; } // the ring at the funnel's foot where DOROTHY is set down
  // the ring is drawn round the line's anchor, not the funnel: you drive to a place, not after every lunge
  get ringDist() { return Math.hypot(this.rig.x - this.storm.ax, this.rig.z - this.storm.az); }
  get shield() { return this.phase === 'stagger' || this.phase === 'rip' ? 0 : this.hp / this.stageMax; }
  get stability() { return this.shield; }
  get stormMph() { return Math.round(Math.hypot(this.storm.vx, this.storm.vz) * FEEL.mph); }
  // danger close pays: a miss by a truck length tops up the boost
  closeCall() { if (this.result) return; this.stats.close++; this.earn(3); this.rig.addBoost(FEEL.boostFromNearMiss); this.call('CLOSE CALL', 'good', 0.7, 1); this.G.audio.tick(); }

  spawnSats() {
    for (const s of this.sats) { s.storm.dispose(); this.G.scene.remove(s.mark); } this.sats = [];
    const n = this.def.satellites ? this.def.satellites[Math.min(this.stage, this.def.satellites.length - 1)] : 0;
    for (let i = 0; i < n; i++) {
      const st = new Storm(this.G.scene, this.G.sky.uniforms, { ...this.def, r0: 3.4, r1: 18, height: 90, bands: 0, type: 'Rope', wob: 3 }, this.G.world, { mini: true });
      const mark = new THREE.Mesh(SAT_RING, SAT_MAT); mark.rotation.x = -Math.PI / 2; mark.renderOrder = 4; this.G.scene.add(mark);
      this.sats.push({ storm: st, mark, ang: (i / n) * 6.283, i, hit: 0, hp: 100 });
    }
  }

  // ---- seats. Yours: the wheel and the turret of your own rig. The crew's: one vehicle for each phase of the finale ----
  // why: 'auto' (you crossed into the danger zone) and 'manual' (you asked) put you on your own turret;
  // 'harpoon' is Winch's truck, 'kill' is Sparks' rocket truck. (Doc's bus is not a gun seat: you drive it, takeBus.)
  enterGun(why) {
    if (this.result || this.rig.dead) return; const role = SEATS[why], unit = role ? this.convoy.unit(role) : null; if (this.gn.on && this.gn.mount === unit && this.gn.why === why) return;
    this.gn.enter(why, unit); this.convoy.seat(unit); this.view = 'gun'; this.zoneLatch = true; this.seatT = this.time; this.seatWhy = why;
    if (why === 'auto') { this.call('GUNS UP: AUTODRIVE', 'good', 1.1); this.note('IN RANGE: YOU SHOOT, IT DRIVES', () => (this.G.input.usingTouch ? 'TAP DRIVE TO STEER IT YOURSELF' : 'F TO STEER IT YOURSELF')); } else if (why === 'manual') this.call('AUTODRIVE', 'good', 0.7);
    else { const c = CREW.find((x) => x.id === unit.crew); this.bark = { name: c.name, text: c.barks.seat }; this.barkT = 2.6; } // whose seat this is, in their own words
  }
  leaveGun(manual) { if (!this.gn.on) return; this.gn.exit(); this.convoy.seat(null); this.view = 'drive'; this.seatT = this.time; this.seatWhy = manual ? 'manual' : 'back'; if (manual) { this.autoHold = 4; this.call('YOU HAVE THE WHEEL', 'warn', 0.8); } } // you took the wheel on purpose: it stays yours for a few seconds whatever the range
  // the vehicle you are sitting on (your rig, or a crew member's), and where its weapon leaves from
  get seatAt() { return this.gn.mount || this.rig; }
  seatMuzzle(out) { const u = this.gn.mount; return u ? this.convoy.muzzle(u, out) : this.rig.muzzle(out); }

  // ---- the action button at the wheel. In a chase it takes your turret; in the finale it puts you in the seat whose turn it is ----
  act() {
    const s = this.storm, b = s.band; if (this.result || !b) return false;
    if (this.phase === 'chase') { if (this.sp.busy) return false; if (this.sp.armed) this.sp.cancel(); this.enterGun('manual'); return true; } // not while the elevator is coming down
    if (this.phase === 'stagger') { this.enterGun('harpoon'); return true; }
    if (this.phase === 'rip') { if (!this.dropped) return false; this.deployNow = true; return true; } // DEPLOY, once she is on the ground (done at the top of the next step: it changes which rig is yours)
    if (this.phase === 'kill') { this.enterGun('kill'); return true; } // phase 5 is fired from the turret
    return false;
  }
  // a lock means the shot will go. The harpoon needs Winch's truck inside its range; the kill shot needs yours inside the rocket's
  get canFire() {
    if (this.phase === 'stagger') { const u = this.seatAt, s = this.storm; return Math.hypot(u.x - s.x, u.z - s.z) <= FEEL.harpoonRange; }
    if (this.phase === 'kill') return this.dist <= FEEL.rocketRange;
    return true;
  }
  get closing() { const u = this.seatAt, s = this.storm; return Math.max(0, Math.hypot(u.x - s.x, u.z - s.z) - FEEL.harpoonRange); } // m Winch's truck still has to make up
  // phase 3, from Winch's truck: the harpoon bites the band and the storm is dragged to a crawl. Then the seat is Doc's.
  fireHarpoon() {
    const G = this.G, s = this.storm, b = s.band, u = this.seatAt; if (this.phase !== 'stagger' || this.harpoonBusy || !b) return false;
    if (Math.hypot(u.x - s.x, u.z - s.z) > FEEL.harpoonRange) { this.gn.say('CLOSING IN', 0.8); return false; }
    this.harpoonBusy = true; G.audio.harpoon(); G.fx.shake(3);
    G.fx.launchHarpoon(this.seatMuzzle(_a), (out) => s.seam(b, u.x, u.z, out), () => {
      this.harpoonBusy = false; if (this.phase !== 'stagger' || s.band !== b) { G.fx.hideCable(0); return; }
      this.rec.harpoon.push('g'); this.phase = 'rip'; this.phaseT = 0; this.hookT = this.p.hook; this.line = { u: u === this.rig ? null : u }; this.restrainStart(); G.audio.twang(); G.audio.stagger(); G.fx.hitStop(FEEL.hitStopHarpoon); G.fx.shake(10); G.fx.slowMo(0.35); this.call('HOOKED', 'good', 1.4);
      s.seam(b, u.x, u.z, _a); G.fx.energy.play(_a.x, _a.y, _a.z, 26, 26, { fps: 48 }); G.fx.ringAt(_a.x, _a.y, _a.z, 60, PALETTE.primary, 0.5); this.leaveGun(); this.takeBus();
    });
    return true;
  }
  // phase 4 is driven. The storm is pinned on Winch's line, and you have the wheel of Doc's bus: your own handling, drawn as
  // his bus, while your rig drives itself (this.home). Get to the ring at the funnel's foot and DOROTHY is set down.
  takeBus() {
    const G = this.G, u = this.convoy.unit('dorothy'); if (this.home || !u) return;
    const bus = new Rig(G.scene, BUS, G.sky.envMap, { hull: 1, boost: 1, recharge: 1, glow: null, ghost: true });
    bus.place(u.x, u.z, u.heading, G.world); bus.vx = Math.sin(u.heading) * u.speed; bus.vz = Math.cos(u.heading) * u.speed; bus.speed = u.speed; bus.hullMax = this.rig.hullMax; bus.hull = this.rig.hull; bus.gripMul = this.rig.gripMul;
    this.home = this.rig; this.rig = bus; this.busUnit = u; u.driven = true; this.rec.busHits = 0; this.dropped = false; this.dorothy.visible = false;
    const c = CREW.find((x) => x.id === u.crew); this.bark = { name: c.name, text: c.barks.seat }; this.barkT = 3; this.note("HOOKED: DOC'S BUS, YOU DRIVE");
  }
  // hand the bus back to Doc where it stands, and you are back in your own rig
  leaveBus() {
    if (!this.home) return; const bus = this.rig, u = this.busUnit; u.x = bus.x; u.z = bus.z; u.heading = bus.heading; u.speed = Math.hypot(bus.vx, bus.vz); u.driven = false;
    this.home.hull = Math.min(this.home.hull, bus.hull); bus.dispose(); this.rig = this.home; this.home = null; this.busUnit = null;
  }
  // the line bites, and the storm is restrained, not tamed: from here it fights the line (src/tether.js). G.tetherSeed replays one.
  restrainStart() { const G = this.G; this.tetherSeed = (G.tetherSeed ?? this.rt() * 4294967296) >>> 0; this.tether = new Tether(this.def.tether, this.tetherSeed); this.mercyT = 0; this.taughtLunge = false; }
  // each step on the line: the tether decides what the funnel does about it, and the encounter answers (marks, sound, shake)
  restrain(dt) {
    const G = this.G, fx = G.fx, s = this.storm, te = this.tether, r = this.rig, bus = this.phase === 'rip' && !!this.home && !this.result, wall = this.dropR - FEEL.dropMargin + TETHER.hitPad;
    this.mercyT = Math.max(0, this.mercyT - dt);
    // no lunge is aimed at a bus that has just been hit, is in the air, or has a satellite twister on it
    let mercy = this.mercyT > 0 || r.stun > 0 || r.air > 0;
    if (bus && !mercy) for (const st of this.sats) if (!st.dead && Math.hypot(r.x - st.storm.x, r.z - st.storm.z) < TETHER.satGuard) { mercy = true; break; }
    const c = this.tc || (this.tc = {}); c.left = this.hookT; c.rip = bus; c.bus = bus; c.bx = r.x - s.ax; c.bz = r.z - s.az; c.wall = wall; c.mercy = mercy;
    c.near = bus ? clamp(1 - (this.ringDist - this.dropR) / TETHER.nearRange, 0, 1) : 0; // it lashes out at whatever gets close
    s.tug = te.update(dt, c);
    if (te.ev && te.tier > 0) this.lungeCue(te.ev, c, wall);
    // the ground it tears up as it goes, at the leading edge of the wall
    if (te.dangerous && te.step !== 'windup' && Math.random() < dt * (te.tier === 2 ? 26 : 14)) { const px = s.x + te.dx * (wall - 4) + rand(-9, 9), pz = s.z + te.dz * (wall - 4) + rand(-9, 9); fx.puff(px, fx.ground(px, pz) + 2, pz, 12 + te.tier * 3, '#6e5637', 0.9, 5); }
  }
  // a dangerous lunge, as the player gets it: winding up (it leans, the line groans, the ground is marked if it can reach you), going, hauled back
  lungeCue(ev, c, wall) {
    const G = this.G, fx = G.fx, s = this.storm, te = this.tether, violent = te.tier === 2;
    if (ev === 'windup') {
      const threat = te.reaches(c), tx = te.targetX(), tz = te.targetZ(); G.audio.strain(te.stepDur, violent ? 1 : 0.55);
      if (violent || threat) fx.telegraph(s.ax + tx, s.az + tz, wall, te.landsIn, null, { track: (e) => { e.x = s.ax + tx; e.z = s.az + tz; } }); // where the wall will be: the storm's own magenta
      if (!this.taughtLunge) { this.taughtLunge = true; this.call('IT IS FIGHTING THE LINE', 'warn', 1.8); }
      else if (threat) this.call('IT IS LUNGING', 'bad', Math.min(1.6, te.landsIn));
    } else if (ev === 'lunge') {
      G.audio.gust(); if (violent) G.audio.boom(0.35);
      const k = clamp(1 - (this.dist - wall) / 140, 0, 1); if (k > 0) fx.shake(TETHER.shake[te.tier] * k);
    } else if (ev === 'recoil') G.audio.twang();
  }
  // at the foot of the funnel: she goes over the tailgate
  dropDorothy() {
    const G = this.G, r = this.rig, s = this.storm, d = this.ringDist || 1; this.dropped = true;
    r.vx *= 0.35; r.vz *= 0.35; r.speed *= 0.35; r.immune = Math.max(r.immune, 1.2); // brakes on as she goes: a second to turn away before the wall can hurt you
    // set down on the ring, toward its anchor, and nothing is aimed at the bus while she goes over the tailgate
    const x = r.x + (s.ax - r.x) / d * 6, z = r.z + (s.az - r.z) / d * 6; this.mercyT = TETHER.mercy; this.dorothy.position.set(x, G.world.heightAt(x, z), z); this.dorothy.rotation.y = Math.random() * 6; this.dorothy.visible = true;
    G.audio.thump(); G.audio.ready_(); G.fx.shake(6); G.fx.hitStop(0.05); G.fx.puff(x, this.dorothy.position.y + 1, z, 10, '#cdb27a', 0.8); G.fx.ringAt(x, this.dorothy.position.y + 2, z, 16, PALETTE.signal, 0.45); this.call('DOROTHY IS DOWN: DEPLOY', 'good', 1.6);
  }
  // the sensors go: up the funnel, and the camera with them. The bus is Doc's again and gets out of there. Then the seat is Sparks'.
  sendDorothy() {
    const G = this.G, s = this.storm; if (this.phase !== 'rip' || this.result || !this.dropped) return false;
    _a.copy(this.dorothy.position); _a.y += 3; this.rec.dorothy.push(this.rec.busHits ? 'y' : 'g'); this.leaveBus(); const r = this.rig;
    this.phase = 'dorothy'; this.phaseT = 0; this.stats.dorothys++; G.audio.probeLaunch(); this.clearHazards(true); r.immune = Math.max(r.immune, FEEL.dorothySeconds + 0.6);
    this.cine = { kind: 'pod', pos: G.fx.swarmCenter, at: this.time }; this.call('DOROTHY IS FLYING', 'good', 1.6);
    G.fx.flashAt(_a.x, _a.y, _a.z, 12, PALETTE.signal, 0.3); G.fx.launchSwarm(_a, s, FEEL.dorothySeconds, () => {
      this.cine = null; this.sawCine('dorothy'); this.skipped = false; if (this.phase !== 'dorothy') return; this.note("CORE CRITICAL: SPARKS' ROCKET");
      this.phase = 'kill'; this.phaseT = 0; this.killT = this.p.kill; this.reload = 0; s.thinTarget = Math.max(0.28, s.thinTarget * this.p.dorothyThin); this.enterGun('kill');
      G.audio.ping(); G.audio.dorothy(); G.audio.stagger(); G.fx.flash(0.6, PALETTE.signal); G.fx.shake(9); G.fx.hitStop(0.06); G.sky.strike(1); this.earn(10); this.call('CORE CRITICAL', 'good', 1.0);
      for (let i = 0; i < 5; i++) { s.spineAt(0.1 + i * 0.07, _a); G.fx.energy.play(s.x + _a.x, s.groundY + (0.1 + i * 0.07) * s.height, s.z + _a.z, 30, 30, { fps: 30 + i * 4 }); }
    });
    return true;
  }
  // phase 5, from Sparks' rocket truck: the launcher is locked on the core. The camera rides with the rocket.
  killShot() {
    const G = this.G, r = this.rig; if (this.phase !== 'kill' || this.reload > 0 || this.result) return false;
    if (this.dist > FEEL.rocketRange) { this.call('OUT OF RANGE', 'warn', 0.7); return false; }
    this.reload = FEEL.rocketReload; G.audio.rocket(); G.fx.shake(4); this.rec.kill.push(this.killT >= this.p.kill / 2 ? 'g' : 'y');
    this.seatMuzzle(_a); G.fx.flashAt(_a.x, _a.y, _a.z, 7, '#ffb14a', 0.12); G.fx.puff(_a.x, _a.y, _a.z, 5, '#e9e2cc', 0.5, 2);
    const rk = G.fx.rocket(_a.clone(), (out) => this.aimPoint(out), FEEL.rocketSpeed * 0.7, (pt) => { this.cine = null; this.sawCine('kill'); this.skipped = false; this.rocketHit(pt); });
    if (rk) { this.cine = { kind: 'rocket', pos: rk.p, at: this.time }; G.fx.slowMo(0.5); r.immune = Math.max(r.immune, 1.5); }
    return true;
  }
  killSat(st) {
    if (st.dead) return; const G = this.G, q = st.storm; st.dead = true; q.die(); this.stats.sats++; this.earn(5);
    G.fx.burst(q.x, q.groundY + 16, q.z, 16, ['#5d6b62', '#b89a58', '#1d2a2b'], 8); G.audio.boom(0.7); this.call('SATELLITE DOWN', 'good', 0.8, 1);
  }
  aimPoint(out) { const s = this.storm, b = s.band, u = this.seatAt; return b && s.alive ? s.seam(b, u.x, u.z, out) : out.set(s.x, s.groundY + 30, s.z); }
  rocketHit(pt) {
    const G = this.G; G.fx.explode(pt.x, pt.y, pt.z, 28); G.audio.boom(1); G.fx.shake(FEEL.shakeRocket * 1.6); this.storm.hit = 1;
    if (this.result || this.phase !== 'kill') return;
    this.stats.direct++; this.ripBand();
  }
  actionState() {
    const ph = this.phase, d = this.dist;
    if (ph === 'chase') return this.sp.busy ? { label: 'GUNS', ready: false, fill: 0, hint: 'NOT NOW' } : { label: 'GUNS', ready: true, fill: 0, hint: d > this.zone ? 'AUTODRIVE' : 'IN RANGE' };
    if (ph === 'stagger') return { label: 'HARPOON', ready: !this.harpoonBusy, danger: true, fill: 0, hint: `${Math.ceil(this.staggerT)} s` };
    if (ph === 'rip') return this.dropped ? { label: 'DEPLOY', ready: true, danger: true, fill: 0, hint: `${Math.ceil(this.hookT)} s` } : { label: 'DOROTHY', ready: false, fill: 0, hint: `${Math.max(0, Math.round((this.ringDist - this.dropR) / 5) * 5)} M` };
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
      const G = this.G; G.fx.energy.play(pt.x, pt.y, pt.z, 44, 44, { fps: 44 }); G.fx.ringAt(pt.x, pt.y, pt.z, 40, th > 0.5 ? PALETTE.primary : PALETTE.accent, 0.4); G.audio.crack(); G.audio.stormCrack(th < 0.5); G.fx.shake(4); this.call(th > 0.5 ? 'BAND CRACKING' : 'BAND FAILING', 'good', 0.8, 1);
    }
    if (this.hp <= 0) {
      this.hp = 0; const G = this.G, s = this.storm;
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, rr = s.radiusAt(0.1) * 1.4; G.fx.explode(s.x + Math.cos(a) * rr, s.groundY + 18 + Math.random() * 30, s.z + Math.sin(a) * rr, 14); }
      if (s.bandsLeft > 1) { this.clearCalls(); this.call('BAND SHOT OFF', 'good', 0.75, 4); this.ripBand(); return; }   // an outer band: it sheds it, surges and runs
      this.phase = 'stagger'; this.phaseT = 0; this.staggerT = this.p.stagger; this.closeT = 0; this.attackT = 2.5; this.wind = null; this.enterGun('harpoon'); this.note("WEAKENED: WINCH'S HARPOON IS UP");
      G.audio.stagger(); G.audio.boom(0.9); G.fx.hitStop(0.08); G.fx.shake(11); G.fx.flash(0.6); G.sky.strike(0.8); this.clearCalls(); this.call('WEAKENED', 'good', 1.0, 4); this.clearHazards(true);
    }
  }
  hurt(n, key = 'hurt') {
    if (!this.rig.damage(n)) return false; this.stats.hits++; this.mercyT = TETHER.mercy;
    if (this.view === 'gun' && this.phase === 'chase') this.attackT = Math.max(this.attackT, FEEL.gunnerMercy); // hit on the gun, where you cannot dodge: it does not throw again at once
    if (this.home) this.rec.busHits++; else if ((this.phase === 'chase' || this.phase === 'surge') && this.view === 'drive') this.rec.wheel[this.stage] = (this.rec.wheel[this.stage] || 0) + n;
    const fx = this.G.fx; fx.hitStop(FEEL.hitStopHull); fx.shake(FEEL.shakeHull); fx.flash(0.5, PALETTE.accent); this.G.audio.hurt(); if (Math.random() < 0.6) this.say(key);
    fx.puff(this.rig.x, this.rig.y + 2, this.rig.z, 9, '#2a2f30', 0.8);
    if (this.rig.hull <= 0) this.end(false, 'wrecked'); return true;
  }

  // will this piece land on the truck, where the truck will be when it lands? (On the gun you cannot see the circle on the
  // ground: the HUD marks these pieces in the air, and the coach line names them.)
  willHit(z) { if (!z || z.state !== 'fly' || z.ranging) return false; const r = this.rig, h = z.h, left = Math.max(0, h.dur - h.t); return Math.hypot(h.tx - r.x - r.vx * left, h.tz - r.z - r.vz * left) < z.rad * FEEL.threatMargin; }
  // something is coming down on you and you are steering out from under it: the game does not take the wheel off you now
  // (it waits for it to land, never more than FEEL.seatWait)
  dodging() { const r = this.rig; if (this.inZone && this.zoneT > FEEL.seatWait) return false; return this.hz.some((z) => { if (z.state !== 'fly') return false; const left = Math.max(0, z.h.dur - z.h.t); return Math.hypot(z.h.tx - r.x - r.vx * left, z.h.tz - r.z - r.vz * left) < z.rad * 2.4 + 8; }); } // where it lands, against where you will be

  // ---- wreckage: thrown at where you are going, marked on the ground, shootable in the air ----
  throwAt(kind, lead, lateral, extra = 0, ranging = false, beside = false) {
    // on the gun the only answer is to shoot it down, so it hangs in the air a little longer for you (FEEL.gunnerAir)
    const G = this.G, r = this.rig, s = this.storm, big = BIG.includes(kind), dur = Math.max(FEEL.telegraphMin, (big ? 1.9 : 1.55) * this.p.tele) + extra + (this.view === 'gun' ? FEEL.gunnerAir : 0);
    const sp = Math.hypot(r.vx, r.vz), ux = sp > 4 ? r.vx / sp : Math.sin(r.heading), uz = sp > 4 ? r.vz / sp : Math.cos(r.heading);
    const tx = clamp(r.x + ux * Math.max(18, sp * dur * lead) - uz * lateral, -1480, 1480), tz = clamp(r.z + uz * Math.max(18, sp * dur * lead) + ux * lateral, -1480, 1480);
    s.spineAt(0.2, _a); const h = G.fx.hazard(kind, { x: s.x + _a.x, y: s.groundY + s.height * 0.2, z: s.z + _a.z }, { x: tx, y: G.fx.ground(tx, tz) + 1, z: tz }, dur); if (!h) return;
    // it is thrown at where you will be, and corrects in flight until it locks: the last stretch is yours to dodge
    if (kind === 'cow' && this.time - (this.mooT || -9) > 1.6) { this.mooT = this.time; G.audio.moo(); if (Math.random() < 0.4) this.call('COW', 'bad', 0.7, 1); }
    const rad = big ? 10 : 7.5, lock = dur - Math.max(0.75, dur * 0.42), off = { x: -uz * lateral, z: ux * lateral };
    // a ranging shot is never aimed at you: it holds its place beside the truck, in the truck's own frame, all the way down
    const track = ranging ? (e) => { const left = Math.max(0, h.dur - h.t), q = this.rig, sp = Math.hypot(q.vx, q.vz) || 1; e.x = clamp(q.x + q.vx * left - q.vz / sp * lateral, -1480, 1480); e.z = clamp(q.z + q.vz * left + q.vx / sp * lateral, -1480, 1480); h.tx = e.x; h.tz = e.z; h.ty = G.fx.ground(e.x, e.z) + 1; }
      : (e, dt) => { const left = Math.max(0.2, h.dur - h.t), k = Math.min(1, dt * 4); e.x += (clamp(r.x + r.vx * left * lead + off.x, -1480, 1480) - e.x) * k; e.z += (clamp(r.z + r.vz * left * lead + off.z, -1480, 1480) - e.z) * k; h.tx = e.x; h.tz = e.z; h.ty = G.fx.ground(e.x, e.z) + 1; };
    const tele = G.fx.telegraph(tx, tz, rad, dur + 0.05, null, { lock: ranging ? dur + 1 : lock, track });
    const hp = big ? FEEL.wreckHpBig : FEEL.wreckHp; this.hz.push({ h, big, hp, max: hp, rad, state: 'fly', tele, ranging, beside });
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
    const stage = Math.min(this.stage, this.def.attacks.length - 1), list = this.def.attacks[stage], THROWS = ['debris', 'big', 'field'];
    const G = this.G, fx = G.fx, r = this.rig, pick = (a) => a[(this.ra() * a.length) | 0], rand = (a, b) => this.ar(a, b);
    // its first throw of the fight is a ranging shot: one piece, a truck's width wide. Then never two attacks in a row
    // that throw nothing (lightning, crosswind), so the wreckage keeps coming.
    // On the gun the truck holds a steady line and cannot dodge: a throw aimed at it always arrives. So there the storm
    // throws at most one piece per attack that will hit, and never in two attacks running; the rest land beside the truck,
    // and the ring (hud.js) says which is which. The side and the distance are drawn for every attack, whatever the seat,
    // so the day's storm makes the same draws for everyone.
    const gun = this.view === 'gun', ws = this.ra() < 0.5 ? 1 : -1, wb = this.ra(), aimed = !gun || !this.lastAimed, beside = (rad, side = ws) => side * rad * (1.6 + 0.5 * wb);
    let kind = this.attacks === 0 ? 'ranging' : pick(list);
    if (kind !== 'ranging' && !THROWS.includes(kind) && !THROWS.includes(this.lastAttack) && this.lastAttack) kind = pick(list.filter((k) => THROWS.includes(k)));
    this.attacks++; this.lastAttack = kind === 'ranging' ? 'debris' : kind; if (THROWS.includes(kind)) this.lastAimed = aimed; else if (kind === 'ranging') this.lastAimed = false;
    if (kind === 'ranging') { const side = this.ra() < 0.5 ? 1 : -1; this.throwAt(pick(SMALL), 1.0, side * FEEL.rangingWide, 0, true); G.audio.whistle(1.3); }
    else if (kind === 'debris') { const n = this.def.volley[stage] + (this.rematch ? 1 : 0); for (let i = 0; i < n; i++) { const lat = i ? rand(-13, 13) : rand(-1.5, 1.5), far = gun && (i > 0 || !aimed); this.throwAt(pick(SMALL), 1.0 + i * 0.14, far ? beside(7.5, i % 2 ? -ws : ws) + lat * 0.1 : lat, i * 0.16, false, far); } G.audio.whistle(1.3); }
    else if (kind === 'big') { const lat = rand(-3, 3); this.throwAt(pick(BIG), 1.0, aimed ? lat : beside(10), 0, false, !aimed); G.audio.whistle(1.7); this.call('INCOMING', 'bad', 0.9); }
    else if (kind === 'field') { const gap = gun ? -1 : (this.ra() * 4) | 0; [-21, -7, 7, 21].forEach((o, i) => { if (i !== gap && !(gun && (i === 0 || i === 3))) this.throwAt(i % 2 ? pick(BIG) : pick(SMALL), 1.0, (gun ? (i === 1 ? beside(10) : aimed ? 0 : beside(7.5, -ws)) : o) + rand(-2, 2), i * 0.1, false, gun && !(i === 2 && aimed)); }); G.audio.whistle(1.8); this.call('DEBRIS FIELD', 'bad', 1.1); } // on the gun: the armour comes down beside you, and the small piece is the one at you (or beside you too, on the other side)
    else if (kind === 'lightning') {
      const dur = Math.max(FEEL.telegraphMin, 1.3 * this.p.tele), lock = dur - 0.5;
      fx.telegraph(r.x, r.z, 11, dur, (e) => {
        const y = fx.ground(e.x, e.z); fx.lightning.play(e.x, y, e.z, 120, 170, { ground: true, fps: 30 }); fx.lightning.play(e.x + 6, y, e.z - 4, 90, 150, { ground: true, fps: 36, rot: 0.1 });
        G.sky.strike(1); fx.flash(0.7); G.audio.thunder(); fx.shake(6); const d = Math.hypot(r.x - e.x, r.z - e.z); if (d < 10.5) this.hurt(FEEL.dmgLightning); else if (d < 24) this.closeCall();
      }, { lock, track: (e, dt) => { const k = Math.min(1, dt * 5), lead = this.view === 'gun' ? 0.16 : 0.3; e.x += (r.x + r.vx * lead - e.x) * k; e.z += (r.z + r.vz * lead - e.z) * k; } }); // on the gun you cannot swerve: it trails a truck at speed and finds a slow one
      G.audio.warn();
    } else if (kind === 'crosswind') { const side = this.ra() < 0.5 ? 1 : -1; this.windWait = Math.max(FEEL.telegraphMin, 0.95 * this.p.tele); this.windSide = side; this.call(side > 0 ? 'CROSSWIND  >>>' : '<<<  CROSSWIND', 'bad', this.windWait + 0.4); G.audio.warn(); }
  }

  // ---- the harpoon pays off ----
  ripBand() {
    const s = this.storm, b = s.band, G = this.G, fx = G.fx, r = this.rig; if (!b || this.result) return; // a band breaks once, and never after the fight is over
    s.seam(b, r.x, r.z, _a); const bx = _a.x, by = _a.y, bz = _a.z;
    s.snapBand(b); this.stats.snaps++; this.stage++; this.line = null; this.cine = null; fx.hideCable(0); this.clearHazards(true); const wasGun = this.view === 'gun'; this.leaveGun(); this.zoneLatch = false; if (wasGun && s.bandsLeft > 0) this.note('BAND OFF: YOUR WHEEL, OUTRUN IT');
    fx.debris(bx, by, bz, 10, ['#5d6b62', '#b89a58', '#1d2a2b'], 2.2, 30);
    fx.hitStop(FEEL.hitStopBandSnap); fx.shake(FEEL.shakeBandSnap); fx.flash(1); G.audio.bandSnap(); G.audio.boom(1); G.sky.strike(1.2);
    fx.energy.play(bx, by, bz, 80, 80, { fps: 40 }); fx.explode(bx, by, bz, 26);
    const each = this.pay / 12; this.owed += this.pay; fx.shardBurst(s.x, s.groundY + 12, s.z, 12, r, (i) => { if (!this.result) { this.owed -= each; this.earn(each); } G.audio.pickup(i); }); // the last band's shards land after the result: end() has banked them
    this.say('snap'); for (const st of this.sats) { st.storm.die(); st.dead = true; }
    if (s.bandsLeft === 0) { this.end(true, 'destroyed'); return; }
    // it does not take that quietly: a wall of debris rolls out from where it stood, and it bolts
    this.phase = 'surge'; this.phaseT = 0; this.surge = { x: s.x, z: s.z, r: 24, hit: false }; this.hp = this.stageMax; this.attackT = 4.5;
    const a = Math.atan2(s.z - r.z, s.x - r.x) + this.jr(-0.9, 0.9); this.ai.hx = Math.cos(a); this.ai.hz = Math.sin(a); this.ai.pending = null; this.ai.jukeT = this.jr(3, 4.5);
    const n = this.gn.resupply(); this.call(n ? `GET CLEAR  ·  +${n} ROCKETS` : 'GET CLEAR', 'bad', 1.6, 3, true); G.audio.warn(); r.immune = Math.max(r.immune, 0.4);
  }
  end(won, reason) {
    if (this.result) return; const s = this.storm, fx = this.G.fx;
    this.leaveBus(); this.leaveGun(); this.phase = won ? 'won' : 'lost'; this.phaseT = 0; this.cine = null; this.clearHazards(true); fx.hideCable(0); fx.hideRing(); this.line = null; this.tether = null; s.tug = null; this.surge = null; this.wind = null;
    if (this.owed > 1e-6) { this.data += this.owed * this.p.dataMul; this.owed = 0; } // shards still flying are paid now, so the HUD, the results and the save agree
    const lines = [['Storm data', Math.round(this.data)]];
    if (won) {
      const fin = this.pay * this.p.dataMul, hull = Math.round(this.pay * 0.4 * (this.rig.hull / this.rig.hullMax) * this.p.dataMul);
      lines.push(['Storm destroyed', Math.round(fin)], ['Hull intact', hull]); this.data += fin + hull;
      s.die(); fx.slowMo(1.4); fx.flash(1); fx.shake(18); fx.hitStop(0.12); this.G.audio.win(); this.say('win'); fx.energy.play(s.x, s.groundY + 24, s.z, 110, 110, { fps: 28 });
      for (let i = 0; i < 4; i++) fx.anim(0.25 + i * 0.3, () => {}, () => { fx.explode(s.x + rand(-20, 20), s.groundY + 20 + i * 28, s.z + rand(-20, 20), 22); this.G.audio.boom(0.8); fx.shake(8); });
      fx.shardBurst(s.x, s.groundY + 14, s.z, 20, this.rig, (i) => this.G.audio.pickup(i));
    } else { this.G.audio.fail(); this.rig.dead = true; const d = this.dist || 1; this.rig.fling((this.rig.x - s.x) / d, (this.rig.z - s.z) / d, 24, 13); fx.explode(this.rig.x, this.rig.y + 2, this.rig.z, 14); this.G.audio.boom(0.9); }
    this.result = { won, reason, storm: this.def, data: Math.round(this.data), lines, time: this.time, stats: this.stats, rematch: this.rematch, hull: Math.max(0, this.rig.hull), hullMax: this.rig.hullMax, rows: this.rows(), daily: this.daily };
  }

  // ---- the storm has somewhere to be ----
  drive(dt, t, over) {
    const s = this.storm, a = this.ai, d = this.dist; a.jukeT -= dt; a.edgeCd -= dt;
    const out = (Math.abs(s.x) > BOUND && s.x * a.hx > 0) || (Math.abs(s.z) > BOUND && s.z * a.hz > 0);
    if (a.pending) { a.pending.t -= dt; if (a.pending.t <= 0) { a.hx = Math.cos(a.pending.ang); a.hz = Math.sin(a.pending.ang); a.pending = null; } }
    else if ((this.phase === 'chase' || this.phase === 'surge') && (out ? a.edgeCd <= 0 : a.jukeT <= 0 && this.phase === 'chase')) {
      const cur = Math.atan2(a.hz, a.hx); let ang;
      if (out) { ang = Math.atan2(-s.z, -s.x) + this.jr(-0.6, 0.6); a.edgeCd = 2.5; }
      else { ang = cur + (this.rj() < 0.5 ? 1 : -1) * this.jr(this.def.jukeAngle[0], this.def.jukeAngle[1]); const fx2 = s.x + Math.cos(ang) * 420, fz2 = s.z + Math.sin(ang) * 420; if (Math.abs(fx2) > BOUND || Math.abs(fz2) > BOUND) ang = Math.atan2(-s.z, -s.x) + this.jr(-0.7, 0.7); }
      a.pending = { ang, t: out ? 0.3 : 0.75 }; a.jukeT = this.jr(this.def.juke[0], this.def.juke[1]) * (1 - 0.1 * this.stage);
      if (d < 420 && !out) { let turn = ang - cur; turn = Math.atan2(Math.sin(turn), Math.cos(turn)); if (Math.abs(turn) > 0.5 && this.view === 'drive') { if (this.coach && !this.taughtDrift) { this.taughtDrift = true; this.call('BRAKE + STEER = DRIFT', 'good', 2.2); } else this.call('IT IS TURNING', 'warn', 0.9, 1); } }
    }
    let sp = this.def.run * (1 + this.rematch * 0.1) * (1 + 0.06 * this.stage);
    // rubber band: it never simply leaves, and it never lets you sit on it
    sp *= d > 430 ? 0.5 : d > 230 ? 0.5 + 0.5 * (430 - d) / 200 : d < 100 ? 1.1 : 1;
    // whatever the storm, it never outruns your rig across open country until you are on top of it
    if (d > 170) sp = Math.min(sp, FEEL.rigTopSpeedField * this.rig.def.speed * 0.94);
    if (this.phase === 'stagger') sp *= 0.7; else if (this.phase === 'rip' || this.phase === 'dorothy' || this.phase === 'kill') sp *= FEEL.hookedSpeed; // pinned on the line else if (this.phase === 'surge') sp = this.def.run * 1.35;
    if (over) sp = this.phase === 'won' ? 0 : sp * 0.5;
    s.moveX = a.hx; s.moveZ = a.hz; s.moveSpeed = sp; s.thrash = this.phase === 'stagger' ? 10 : 0;
    // on the line the anchor creeps at that speed (what the HUD reads) and the tether does the fighting on top of it
    if (this.tether && this.line && s.alive && (this.phase === 'rip' || this.phase === 'dorothy' || this.phase === 'kill')) this.restrain(dt); else { s.tug = null; this.tether = null; }
    s.update(dt, t);
  }

  update(dt, t, axes, input) {
    if (this.deployNow) { this.deployNow = false; this.sendDorothy(); }
    // the tap that started a cinematic (DEPLOY, FIRE) is not a request to skip it: only a tap once it is under way counts
    if (input && input.take && input.take('skip') && this.cine && this.time - (this.cine.at ?? -9) > FEEL.gunGuard) this.skipCine();
    const G = this.G, s = this.storm, r = this.rig, fx = G.fx, w = G.world;
    this.time += dt; this.phaseT += dt; this.barkT -= dt; this.tickCall(dt); this.reload = Math.max(0, this.reload - dt); this.shotgunCd = Math.max(0, this.shotgunCd - dt); this.firing = Math.max(0, this.firing - dt); this.autoHold = Math.max(0, this.autoHold - dt);
    const over = this.phase === 'won' || this.phase === 'lost';
    let dx = r.x - s.x, dz = r.z - s.z, dist = Math.hypot(dx, dz) || 0.01; this.dist = dist; let nx = dx / dist, nz = dz / dist;
    r.aim = Math.atan2(-dx, -dz); r.alert = dist < 420 && s.alive ? 1 : 0;

    // ---- input: at the wheel, BOOST and the action button; on the gun, the sights and the trigger (src/gunner.js) ----
    if (!over) {
      // crossing into the danger zone puts you on the gun; leave it yourself and it stays your call until you come back in
      if (this.phase === 'chase' && this.view === 'drive') { if (this.inZone && !this.zoneLatch) { if (this.phaseT > 0.5 && this.autoHold <= 0 && r.stun <= 0 && r.air <= 0 && this.windWait <= 0 && !this.wind && !this.dodging() && !this.sp.armed) this.enterGun('auto'); } else if (dist > this.zone * 1.12) this.zoneLatch = false; }
      this.gn.handle(dt, input);
      if (this.view === 'drive' && input.take('action', FEEL.inputBuffer)) { if (!this.act()) { G.audio.deny(); G.hud.deny('btn-action'); } }
      if (this.view === 'drive' && input.take('boost')) { if (r.boost()) { G.audio.boost(); fx.shake(4); G.kickFov(); const bx = r.x - Math.sin(r.heading) * 3, bz = r.z - Math.cos(r.heading) * 3; fx.flashAt(bx, r.y + 1, bz, 7, '#ff9a3c', 0.18); for (let i = 0; i < 5; i++) fx.puff(bx + rand(-1.5, 1.5), r.y + 0.8, bz + rand(-1.5, 1.5), 4 + i, '#e9e2cc', 0.6, 2); } else { G.audio.deny(); G.hud.deny('btn-boost'); } }
    }

    // hands off: on the gun, and while the camera is away with DOROTHY or the rocket, the truck drives itself
    if (!over && (this.view === 'gun' || this.phase === 'dorothy' || (this.cine && this.cine.kind === 'rocket'))) axes = this.gn.autodrive(dt);

    // ---- the storm moves ----
    this.drive(dt, t, over);
    // the harpoon window is yours to aim in: it does not run down while Winch's truck is still closing to range (FEEL.harpoonCloseMax at most)
    if (this.phase === 'stagger') { if (!this.canFire && this.view === 'gun' && this.closeT < FEEL.harpoonCloseMax) this.closeT += dt; else this.staggerT -= dt; if (this.staggerT <= 0 && !this.harpoonBusy) { this.rec.harpoon.push('r'); this.leaveGun(); this.phase = 'chase'; this.phaseT = 0; this.hp = this.stageMax * FEEL.staggerRecover; this.zoneLatch = false; this.call('SHIELD REFORMING', 'bad', 1.4); this.note('MISSED IT: YOUR WHEEL, CLOSE IN'); G.audio.warn(); } }

    // ---- forces on the rig: suction, crosswind, the cable ----
    let ax = 0, az = 0; this.tension = null;
    // the pinned storm still breathes in: the closer the bus gets, the harder the inflow pulls and shakes it
    if (this.phase === 'rip' && this.home && s.alive && dist < 120) { const k = 1 - dist / 120; ax -= nx * 7 * k * r.def.resist / 0.45; az -= nz * 7 * k * r.def.resist / 0.45; fx.shake(1.5 + 5 * k); if (Math.random() < dt * 20 * k) fx.puff(r.x + rand(-9, 9), r.y + rand(0.5, 3), r.z + rand(-9, 9), 4, '#b89a58', 0.5, 1); }
    if (s.alive && this.phase === 'chase' && dist < this.def.suckR) { const k = Math.pow(1 - dist / this.def.suckR, 1.6) * this.def.suck * r.def.resist; ax -= nx * k; az -= nz * k; }
    if (this.windWait > 0) { this.windWait -= dt; if (this.windWait <= 0) { this.wind = { t: 1.4, side: this.windSide }; G.audio.gust(); } }
    if (this.wind) {
      const wn = this.wind; wn.t -= dt; const px = -Math.cos(r.heading) * wn.side, pz = Math.sin(r.heading) * wn.side, k = FEEL.crosswind * Math.min(1, wn.t * 3) * r.def.resist; ax += px * k; az += pz * k;
      if (Math.random() < dt * 30) fx.puff(r.x - px * rand(6, 22) + rand(-14, 14), r.y + rand(0.5, 3), r.z - pz * rand(6, 22) + rand(-14, 14), 4, '#d9c9a0', 0.5, 0.5);
      if (wn.t <= 0) this.wind = null;
    }
    const b = s.band;
    if ((this.phase === 'rip' || this.phase === 'dorothy' || this.phase === 'kill') && this.line && b) {
      // hooked: the storm is dragged to a crawl on Winch's line
      this.tension = 0.5 + 0.5 * Math.sin(t * 9); const hk = this.line.u || r;
      if (Math.random() < dt * 12) { s.seam(b, hk.x, hk.z, _a); fx.flashAt(_a.x, _a.y, _a.z, 9, '#ff3f8e', 0.1); }
      fx.shake(this.view === 'gun' ? 0.6 : 2);
      if (this.phase === 'rip') this.hookT -= dt; else if (this.phase === 'kill' && !(this.cine && this.cine.kind === 'rocket')) this.killT -= dt;
      if ((this.phase === 'rip' && this.hookT <= 0) || (this.phase === 'kill' && this.killT <= 0)) { this.rec[this.phase === 'rip' ? 'dorothy' : 'kill'].push('r'); this.leaveBus(); this.leaveGun(); this.dorothy.visible = false; this.zoneLatch = false; this.phase = 'chase'; this.phaseT = 0; this.line = null; fx.hideCable(0); this.hp = this.stageMax * FEEL.hookRecover; s.thinTarget = 0.42 + 0.58 * s.bandsLeft / s.bands.length; fx.endSwarm(); this.tether = null; s.tug = null; this.call('LINE LET GO', 'bad', 1.4); this.note('THE LINE WENT: YOUR WHEEL AGAIN'); G.audio.lineSnap(); }
    }

    // ---- rig ----
    r.update(dt, axes, w, ax, az);
    if (this.home) { // you are driving Doc's bus: it is drawn where you are, and your own rig looks after itself
      const u = this.busUnit; u.x = r.x; u.z = r.z; u.heading = r.heading; u.speed = Math.hypot(r.vx, r.vz); this.home.update(dt, this.gn.autodrive(dt, this.home), w, 0, 0);
    }
    if (!over) this.sp.update(dt); // the grain elevator
    if (r.landed) { r.landed = false; fx.puff(r.x, r.y + 1, r.z, 10); G.audio.impact(); }
    if (r.launch) for (let i = 0; i < 4; i++) fx.puff(r.x - Math.sin(r.heading) * (2.5 + i) + rand(-1, 1), r.y + 0.6, r.z - Math.cos(r.heading) * (2.5 + i) + rand(-1, 1), 4 + i, r.surface === 2 ? '#8d9392' : '#cdb27a', 0.6, 2);
    for (const e of w.collideRig(r)) { if (e.kind === 'smash') { G.audio.smash(); fx.shake(e.tree ? 4 : 2); fx.puff(e.x, e.y + 1.5, e.z, e.tree ? 9 : 6, e.type === 'bale' ? '#d9b45a' : '#cdb27a', 0.6); } else { G.audio.impact(); fx.shake(6); if (e.dmg && !over && this.view === 'drive' && !this.cine) this.hurt(e.dmg); } } // a building costs hull only with your hands on the wheel: the autodrive's crashes are not yours to pay for
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
          if (!over) { if (hd < z.rad) this.hurt(z.big ? FEEL.dmgBigDebris : FEEL.dmgDebris); else if (hd < z.rad * 2.4 && !z.beside) this.closeCall(); } // (a piece thrown beside a truck on the gun is not a dodge)
          if (z.big) { z.state = 'wreck'; z.life = 9; h.landed = true; h.x = h.tx; h.y = h.ty + 0.6; h.z = h.tz; h.m.rotation.set(rand(-0.4, 0.4), rand(0, 6), rand(-0.5, 0.5)); if (z.tele) { z.tele.on = false; z.tele.g.visible = false; } } else this.dropHazard(z, 'land');
          continue;
        }
        const left = h.dur - h.t, d3 = Math.hypot(hd, h.y - r.y);
        if (h.t > 0.2 && d3 < this.p.mgRange && left < soonest && !z.ranging) { soonest = left; target = z; }
        if (!over && this.shotgunCd <= 0 && d3 < FEEL.shotgunRange && left < 0.5 && !(z.ranging && Math.hypot(h.tx - r.x, h.tz - r.z) > z.rad) && (this.view !== 'gun' || this.willHit(z))) this.shotgun(z); // on the gun the shell is slow to come round again: it is kept for a piece that will hit
      } else { // a wreck on the ground: go round it, or let the shotgun clear it
        z.life -= dt; if (Math.random() < dt * 5) fx.puff(h.x, h.y + 2, h.z, 5, '#2a2420', 1.0, 5);
        const ahead = (h.x - r.x) * r.vx + (h.z - r.z) * r.vz > 0;
        if (!over && this.view !== 'gun' && this.shotgunCd <= 0 && hd < FEEL.shotgunRange + spd * 0.12 && ahead) this.shotgun(z);
        else if (!over && hd < 4.4) { if (this.view !== 'gun') this.hurt(FEEL.dmgWreck); r.vx *= 0.5; r.vz *= 0.5; r.speed *= 0.5; this.dropHazard(z, 'ram'); }
        else if (z.life <= 0 || hd > 700) this.dropHazard(z, 'land');
      }
    }
    // ---- the guns. On the turret they are yours. At the wheel the crew cover the truck: they shoot wreckage, never the storm ----
    this.inZone = dist < this.zone; this.zoneT = this.inZone ? (this.zoneT || 0) + dt : 0;
    if (!over) {
      if (this.view === 'gun') { r.aim = this.gn.yaw; this.gn.update(dt, input); }
      else if (target && target.state === 'fly') { const h = target.h; _b.set(h.x, h.y, h.z); this.mg(dt, _b, this.gun.every); target.hp -= this.p.mgDps * FEEL.crewGunShare * dt; h.dmg = clamp(1 - target.hp / target.max, 0, 1); if (target.hp <= 0) this.dropHazard(target, 'mg'); }
    }

    // ---- contact with the funnel, satellites, the surge ----
    if (!over && this.phase === 'rip' && this.home && s.alive) { // DOROTHY's run: the ring is the place, the wall behind it is too far
      if (!this.dropped && this.ringDist < this.dropR + 4) this.dropDorothy();
      if (dist < this.dropR - FEEL.dropMargin + TETHER.hitPad && r.immune <= 0) { if (this.hurt(FEEL.dmgTooClose) && r.hull > 0) { r.fling(nx, nz, 30, 5); this.call('TOO CLOSE', 'bad', 0.8); } }
    }
    if (!over && s.alive && this.phase === 'chase' && dist < s.killRadius && r.immune <= 0) { if (this.hurt(FEEL.dmgCore) && r.hull > 0) { r.fling(nx, nz, 55); this.call('TOO CLOSE', 'bad'); } }
    // satellites circle the anchor (the same point as the funnel until it is harpooned): on the line they do not lunge with her
    for (let i = this.sats.length - 1; i >= 0; i--) {
      const st = this.sats[i], m = st.storm; st.hit -= dt;
      if (!st.dead) { st.ang += s.spin * 0.55 * dt; const rad = 78 + 38 * Math.sin(t * 0.55 + st.i * 2.1); m.spin = s.spin; m.place(s.ax + Math.cos(st.ang) * rad, s.az + Math.sin(st.ang) * rad); if (!over && st.hit <= 0 && Math.hypot(r.x - m.x, r.z - m.z) < 7.5) { st.hit = 1.5; if (this.hurt(FEEL.dmgSatellite) && r.hull > 0) { const d = Math.hypot(r.x - m.x, r.z - m.z) || 1; r.fling((r.x - m.x) / d, (r.z - m.z) / d, 24, 6); } } }
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
      // a piece that will land on the truck is heard as well as ringed: pings that close up as it comes down
      if (this.view === 'gun') { let hot = null; for (const z of this.hz) if (this.willHit(z) && (!hot || z.h.dur - z.h.t < hot.h.dur - hot.h.t)) hot = z; if (!hot) this.pipT = 0; else if ((this.pipT -= dt) <= 0) { const left = hot.h.dur - hot.h.t; G.audio.incoming(clamp(1 - left / 2.2, 0, 1), hot.big); this.pipT = clamp(left * 0.28, 0.11, 0.5); } }
      this.attackT -= dt * (this.inZone ? 1.1 : 1); if (this.attackT <= 0 && this.time - this.seatT >= FEEL.seatQuiet && !this.sp.busy) { const ev = this.def.attackEvery[Math.min(this.stage, this.def.attackEvery.length - 1)]; this.attackT = ev * this.ar(0.8, 1.2) * this.p.tele * (this.view === 'gun' ? FEEL.gunnerBreather : 1); this.attack(); }
    }

    // ---- cable, rings, what the storm ate ----
    // the band's ring is the shield: wheat segments that go out as it breaks, green when the core is bare, magenta when hooked
    // and it changes colour as it fails: wheat, amber under two thirds, flickering magenta under one third. The funnel thins with it.
    const frac = this.hp / this.stageMax;
    if (b) { b.exposed = true; b.strain = this.phase === 'chase' || this.phase === 'surge' ? frac : this.phase === 'dorothy' || this.phase === 'kill' ? 0.3 : 1; b.tone = this.phase === 'kill' || this.phase === 'dorothy' ? PALETTE.accent : this.phase === 'rip' ? (this.tether && this.tether.dangerous && Math.sin(t * 24) > 0 ? PALETTE.accent : PALETTE.primary) : this.phase === 'stagger' ? PALETTE.signal : s.hit > 0.75 ? '#fff1c2' : frac > 0.66 ? PALETTE.wheat : frac > 0.33 ? PALETTE.primary : Math.sin(t * 22) > -0.3 ? PALETTE.accent : PALETTE.primary; }
    if (this.phase === 'chase' && s.alive) s.thinTarget = 0.42 + 0.58 * (s.bandsLeft - 0.45 * (1 - frac)) / s.bands.length;
    if (this.line && b && (this.phase === 'rip' || this.phase === 'dorothy' || this.phase === 'kill')) { const hk = this.line.u; if (hk) this.convoy.muzzle(hk, _a); else r.muzzle(_a); s.seam(b, (hk || r).x, (hk || r).z, _b); const p = this.tether ? this.tether.out.tension : 0.7; fx.setCable(0, _a, _b, (this.phase === 'rip' ? this.hookT : this.killT) < 2.5 && this.phase !== 'dorothy' && p >= 0 ? Math.max(1.2, p) : p, t); } // taut as it winds up, slack as it is hauled back
    else if (!this.harpoonBusy) fx.hideCable(0);
    // the danger zone: amber while you are outside it, green once the guns can reach
    if (!this.surge) { if (!over && this.phase === 'rip' && this.home && !this.dropped) fx.setRing(s.ax, s.az, this.dropR, 1, 0.6 + 0.3 * Math.sin(t * 7), PALETTE.signal, 4); else if (!over && this.phase === 'chase' && dist < this.zone * 2.6) fx.setRing(s.x, s.z, this.zone, 1, this.inZone ? 0.28 : 0.45 + 0.2 * Math.sin(t * 5), this.inZone ? PALETTE.signal : PALETTE.primary, this.inZone ? 3 : 5); else fx.hideRing(); }
    this.convoy.update(dt, t, this.home || r, s);
    w.update(dt, s);
    for (const e of w.events) { if (e.kind === 'rip') { fx.puff(e.x, e.y + 3, e.z, e.big ? 22 : 9, '#b89a58', 1.2); if (e.cow && dist < 420 && this.time - (this.mooT || -9) > 2.2) { this.mooT = this.time; G.audio.moo(); } if (e.big && dist < 500) { G.audio.smash(); fx.shake(3); } } else if (e.kind === 'land' && Math.hypot(e.x - r.x, e.z - r.z) < 120) fx.puff(e.x, e.y + 1, e.z, 7); }
    w.events.length = 0;
    s.hit = Math.max(0, (s.hit || 0) - dt * 3); const core = this.phase === 'dorothy' ? 0.3 + 0.5 * Math.min(1, this.phaseT / FEEL.dorothySeconds) : this.phase === 'kill' ? 0.85 + 0.15 * Math.sin(t * 18) : this.phase === 'stagger' || this.phase === 'rip' ? 0.5 + 0.2 * Math.sin(t * 10) : Math.max(s.hit * 0.8, this.inZone && this.firing > 0 ? 0.18 : 0);
    s.mat.uniforms.uCore.value += (core - s.mat.uniforms.uCore.value) * Math.min(1, dt * 10);
    this.far = dist > 460 ? this.far + dt : 0;
    this.dataShown += (this.data - this.dataShown) * Math.min(1, dt * 8);
  }
  // the share text's rows: one square per band at the wheel and on the gun, one per window of the finale
  rows() {
    const R = this.rec, n = Math.min(this.stage + (this.result || this.phase === 'won' ? 0 : 1), this.storm.bands.length), chase = [], guns = [];
    for (let i = 0; i < Math.max(1, n); i++) {
      const w = R.wheel[i] || 0, S = GRADE.share; chase.push(w <= 0 ? 'g' : w < S.hullOk ? 'y' : 'r');
      const a = R.rounds[i] ? (R.hits[i] || 0) / R.rounds[i] : 0; guns.push(!R.rounds[i] ? 'y' : a >= S.accGood ? 'g' : a >= S.accOk ? 'y' : 'r');
    }
    return { chase, guns, harpoon: R.harpoon.slice(), dorothy: R.dorothy.slice(), kill: R.kill.slice() };
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
    G.fx.flashAt(_a.x, _a.y, _a.z, 8, '#fff1c4', 0.1); G.audio.shotgun(); G.fx.shake(5); this.dropHazard(z, 'shotgun'); this.call('BOOM', 'good', 0.5, 1);
  }

  // the one line of coaching for this moment
  coachLine() {
    const ph = this.phase, d = this.dist;
    if (this.cine) return this.canSkip() ? (this.G.input.usingTouch ? 'TAP TO SKIP' : 'SPACE TO SKIP') : ph === 'dorothy' ? 'DOROTHY IS READING THE CORE' : '';
    if (ph === 'chase' && this.view === 'gun' && this.gn.weapon !== 'rocket' && this.hz.some((z) => this.willHit(z))) return this.hz.some((z) => z.big && this.willHit(z)) && this.gn.rockets > 0 ? 'ARMOUR INCOMING: SWAP TO ROCKETS' : 'INCOMING: SHOOT IT DOWN'; // a hit coming outranks everything on this line (armour thrown beside the truck is not named)
    const why = this.result ? '' : this.noteLine(); if (why) return why;
    const out = this.sp.coach(); if (out) return out;
    if (ph === 'chase') {
      if (this.view === 'gun') {
        if (this.gn.weapon === 'rocket') return 'ROCKETS: HOLD ON TARGET TO LOCK';
        if (d > this.zone) return `AUTODRIVE IS CLOSING IN: ${Math.round((d - this.zone) / 5) * 5} M`;
        return 'SHOOT THE BRIGHT SEAM';
      }
      if (this.far > 2.5) return 'CATCH IT: ROADS ARE FASTER';
      if (d > 250 && this.rig.boostCharge >= 1) return 'BOOST TO CLOSE IN';
      if (d > this.zone) return `GET INSIDE THE DANGER ZONE: ${Math.round((d - this.zone) / 5) * 5} M`;
      return 'IN RANGE: TAP GUNS TO TAKE THE TURRET';
    }
    if (ph === 'stagger') return this.view === 'gun' && !this.canFire ? `WINCH IS CLOSING IN: ${Math.max(5, Math.round(this.closing / 5) * 5)} M` : this.gn.locked ? 'LOCKED: FIRE THE HARPOON' : "WINCH'S TRUCK: AIM AT THE GLOW";
    if (ph === 'rip') return this.dropped ? 'DOROTHY IS DOWN: DEPLOY' : `DOC'S BUS: DRIVE TO ITS FOOT: ${Math.max(0, Math.round((this.ringDist - this.dropR) / 5) * 5)} M`;
    if (ph === 'dorothy') return 'DOROTHY IS READING THE CORE';
    if (ph === 'kill') return this.gn.locked ? 'LOCKED: FIRE THE KILL SHOT' : "SPARKS' TRUCK: AIM AT THE GLOW";
    if (ph === 'surge' && this.surge) { const gap = Math.hypot(this.rig.x - this.surge.x, this.rig.z - this.surge.z) - this.surge.r; return gap > 0 ? `OUTRUN THE WALL: ${Math.round(gap / 5) * 5} M BEHIND YOU` : 'OUTRUN THE WALL'; }
    return '';
  }
}
