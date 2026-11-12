// The harpooned storm: restrained, not tamed.
// Winch's line holds the storm to an anchor, and it fights the line the whole time. It twitches (restless), it throws its
// weight sideways now and then (aggressive), and every so often it winds up and tries to tear itself free (violent).
// Every dangerous lunge is telegraphed: the funnel leans and writhes toward where it is going and the line goes taut
// first; then it goes; then the line hauls it back past where it started and it settles. It never goes further than
// the line allows, and a lunge is a curve in time, never a jump.
// Average travel and instantaneous movement are separate: the anchor creeps (the storm's ground speed, what the HUD
// reads); the lunges are an offset from it. Pure maths, no THREE and no DOM, so it runs under node: tests/tether.test.mjs.
// Tuning: TETHER (the shape of a lunge, the three acts of the line's 15 seconds) and STORMS[].tether (each storm's reach).
import { TETHER, FEEL } from './config.js';

export const TIERS = ['restless', 'aggressive', 'violent'];
const TAU = Math.PI * 2;
const ease = (u) => u * u * (3 - 2 * u);

// a small seeded generator (mulberry32): the same seed and the same driving give the same storm
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export class Tether {
  // tune: STORMS[].tether. seed: any 32-bit integer.
  constructor(tune, seed = 1) {
    this.k = tune; this.seed = seed >>> 0; this.rand = rng(this.seed);
    this.t = 0; this.step = 'rest'; this.stepT = 0; this.stepDur = TETHER.opening; // the hook lands: a beat of relief first
    this.tier = 0; this.dx = 1; this.dz = 0; this.mag = 0; this.magT = 0; this.taught = false; this.lastDanger = -1e9;
    this.act = 0; this.agit = 0; this.ev = null; this.n = [0, 0, 0];
    const r = this.rand; this.ph = [r() * TAU, r() * TAU, r() * TAU, r() * TAU, r() * TAU];
    this.out = { ox: 0, oz: 0, lx: 0, lz: 0, writhe: 0, tension: TETHER.tensionRest };
  }
  // the furthest the line lets the funnel get from the anchor: the biggest lunge plus the restless shiver on top of it
  get radius() { return this.k.violent + this.k.jitter * TETHER.jitterMax * 1.42; }
  get spec() { return TETHER.tiers[TIERS[this.tier]]; }
  // a lunge the player has to answer: aggressive or violent, from the first lean until the line hauls it back
  get dangerous() { return this.tier > 0 && (this.step === 'windup' || this.step === 'lunge' || this.step === 'hold'); }
  get winding() { return this.tier > 0 && this.step === 'windup'; }
  // where this lunge puts the funnel's centre, relative to the anchor
  targetX() { return this.dx * this.magT; }
  targetZ() { return this.dz * this.magT; }
  // how long the warning lasts and how long until it lands, for the lunge being wound up now
  windupFor(tier) { const w = TETHER.tiers[TIERS[tier]].windup * (tier ? this.k.windup : 1); return tier ? Math.max(FEEL.telegraphMin, w) : w; }
  get landsIn() { return this.step === 'windup' ? this.stepDur - this.stepT + this.spec.lunge : this.step === 'lunge' ? this.stepDur - this.stepT : 0; }

  // would a lunge of `mag` along the current direction put the funnel's wall on a bus at (bx,bz)? (relative to the anchor)
  reaches(c, mag = this.magT) { return !!c.bus && Math.hypot(c.bx - this.dx * mag, c.bz - this.dz * mag) < c.wall + TETHER.reach; }
  // the biggest lunge along the current direction that stays clear of the bus by `safety` metres
  safeMag(c, mag) {
    if (!c.bus) return mag; const R = c.wall + TETHER.safety, bb = c.bx * c.bx + c.bz * c.bz, p = c.bx * this.dx + c.bz * this.dz;
    if (bb <= R * R) return p > 0 ? 0 : mag;  // the bus is already in the wall's reach: nothing more comes its way
    if (p <= 0) return mag;                    // it is lunging away from the bus
    const disc = p * p - (bb - R * R); if (disc < 0) return mag; // the line of the lunge misses the bus
    return Math.min(mag, Math.max(0, p - Math.sqrt(disc)));
  }

  // c: { left: seconds of line left, rip: may it lunge dangerously now (only while the bus is on its way),
  //      bus: is there a bus to fear for, bx/bz: the bus relative to the anchor, wall: the funnel's contact radius, near: 0..1 how close it is to the ring,
  //      mercy: the bus has just been hit, is airborne, is boxed in by a satellite or has just set DOROTHY down }
  update(dt, c) {
    this.t += dt; this.stepT += dt; this.ev = null;
    const A = TETHER.acts; let act = A.length - 1; for (let i = 0; i < A.length; i++) if (c.left > A[i].from) { act = i; break; }
    this.act = act; this.agit += (act / (A.length - 1) - this.agit) * Math.min(1, dt * TETHER.agitRate);
    // fairness: a dangerous lunge that would land on a bus that cannot get out of the way is pulled short (eased, never cut)
    if (this.tier > 0 && this.step !== 'recoil' && this.step !== 'rest' && (c.mercy || !c.rip) && this.reaches(c)) this.magT = this.safeMag(c, this.magT);
    const dm = this.magT - this.mag, cap = TETHER.pullRate * dt; this.mag += Math.max(-cap, Math.min(cap, dm)); // a rate, so even a pulled-short lunge moves, never jumps
    let guard = 6; while (this.stepT >= this.stepDur && guard-- > 0) { this.stepT -= this.stepDur; this.next(c); }
    return this.shape(c);
  }

  next(c) {
    const sp = this.spec;
    if (this.step === 'rest') { this.pick(c); return; }
    if (this.step === 'windup') { this.step = 'lunge'; this.stepDur = sp.lunge; this.ev = 'lunge'; return; }
    if (this.step === 'lunge' && sp.hold > 0) { this.step = 'hold'; this.stepDur = sp.hold; return; }
    if (this.step === 'lunge' || this.step === 'hold') { this.step = 'recoil'; this.stepDur = sp.recoil; this.ev = 'recoil'; return; }
    // recoil done: it settles, and gets its breath back
    if (this.tier > 0) this.lastDanger = this.t;
    const a = TETHER.acts[this.act], rest = a.rest[0] + this.rand() * (a.rest[1] - a.rest[0]);
    this.step = 'rest'; this.stepDur = rest * (this.tier ? this.k.rest : 1); this.tier = 0; this.mag = this.magT = 0;
  }

  pick(c) {
    const a = TETHER.acts[this.act], R = this.rand; let tier = 0;
    if (c.rip && this.t >= TETHER.opening) {
      if (!this.taught) tier = 1; // the first real lunge comes straight away, and wide of the bus: it is the lesson
      else {
        // the breather between dangerous lunges: it twitches through it, and if there is no time left for a twitch it waits
        const near = c.near || 0, wait = a.gap * this.k.rest * (1 - TETHER.nearGap * near) - (this.t - this.lastDanger), sp = TETHER.tiers.restless;
        if (wait > 0 && wait < sp.windup + sp.lunge + sp.recoil) { this.step = 'rest'; this.stepDur = wait; return; }
        if (wait > 0) return this.twitch();
        const f = this.k.fury * (1 + TETHER.nearFury * near), w1 = a.weights[1] * f, w2 = a.weights[2] * f, roll = R() * (a.weights[0] + w1 + w2);
        tier = roll < a.weights[0] ? 0 : roll < a.weights[0] + w1 ? 1 : 2;
      }
    }
    this.lunge(c, tier);
  }
  twitch() { this.lunge(null, 0); }
  lunge(c, tier) {
    const R = this.rand;
    // which way: restless anywhere; aggressive sweeps across the bus's line; violent comes at its side; mercy turns it away
    const tb = c && c.bus ? Math.atan2(c.bz, c.bx) : R() * TAU, side = R() < 0.5 ? -1 : 1; let ang;
    if (tier === 0) ang = R() * TAU;
    else if (c.mercy) ang = tb + Math.PI + side * R() * 0.9;
    else if (!this.taught) ang = tb + side * (1.25 + R() * 0.5);
    else if (tier === 1) ang = tb + side * (0.6 + R() * 1.3);
    else ang = tb + side * R() * 0.9;
    this.dx = Math.cos(ang); this.dz = Math.sin(ang); this.tier = tier;
    const reach = this.k[TIERS[tier]]; this.magT = reach * (tier ? 0.8 + R() * 0.2 : 0.5 + R() * 0.5);
    if (tier && (c.mercy || !this.taught) && this.reaches(c)) this.magT = this.safeMag(c, this.magT);
    this.mag = this.magT; // s is ~0 at the start of a windup, so the offset is continuous whatever the reach
    if (tier) { this.taught = true; this.n[tier]++; } else this.n[0]++;
    this.step = 'windup'; this.stepDur = this.windupFor(tier); this.ev = 'windup';
  }

  // the lunge as a curve: s is the share of its reach along its direction, l the funnel's lean, w how hard it writhes,
  // p how hard the line is pulling (<0 slack, 0..1 holding, >1 straining)
  shape() {
    const sp = this.spec, u = Math.min(1, this.stepT / this.stepDur), o = this.out, ag = this.agit;
    let s = 0, l = 0, w = 0, p = TETHER.tensionRest + TETHER.tensionAgit * ag;
    const L = sp.lean, W = sp.writhe, P = sp.tension;
    if (this.step === 'windup') { // it gathers itself: the base digs in the other way, the top leans and twists toward where it is going, the line tightens
      const e = ease(u); s = -sp.coil * Math.sin(u * Math.PI / 2); l = L * e; w = W * e; p += (P - p) * e;
    } else if (this.step === 'lunge') { // it snaps out; the top whips back over the base
      // it starts from rest at the end of the windup, so it goes without a jump in speed either
      s = -sp.coil + (1 + sp.coil) * ease(u); l = L + (-0.45 * L - L) * ease(u); w = W; p = P;
    } else if (this.step === 'hold') { // at the end of the line, taut
      s = 1; l = -0.45 * L + 0.25 * L * ease(u); w = W; p = P + 0.1 * Math.sin(u * 40);
    } else if (this.step === 'recoil') { // the line hauls it back past the anchor, and it settles
      s = Math.exp(-3.2 * u) * Math.cos(2.4 * Math.PI * u) * (1 - u); l = L * (-0.2 * (1 - u) + 0.3 * Math.sin(Math.PI * u) * (1 - u)); w = W * (1 - ease(u));
      p = u < 0.5 ? -TETHER.slack * Math.sin(Math.PI * u / 0.5) * (this.tier ? 1 : 0.3) : p * ease((u - 0.5) / 0.5);
    } else if (this.act === TETHER.acts.length - 1) p = TETHER.tensionFray + 0.25 * Math.sin(this.t * 13); // the last act: the line is fraying
    const m = this.mag, t = this.t, J = this.k.jitter * (1 + (TETHER.jitterMax - 1) * ag), ph = this.ph;
    let ox = this.dx * m * s + J * (0.6 * Math.sin(t * 1.9 + ph[0]) + 0.4 * Math.sin(t * 3.7 + ph[1]));
    let oz = this.dz * m * s + J * (0.6 * Math.sin(t * 1.6 + ph[2]) + 0.4 * Math.sin(t * 4.1 + ph[3]));
    const d = Math.hypot(ox, oz), R = this.radius; if (d > R) { ox *= R / d; oz *= R / d; } // the line: it is never further than this
    const sh = TETHER.shiverLean * (1 + ag) * Math.sin(t * 1.3 + ph[4]);
    o.ox = ox; o.oz = oz; o.lx = this.dx * l + sh; o.lz = this.dz * l - sh * 0.6; o.writhe = w + TETHER.writheAgit * ag; o.tension = p;
    return o;
  }
}
