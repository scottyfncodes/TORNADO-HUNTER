// The harpooned storm's movement, on its own: node --test tests/
// Deterministic: every case is a fixed seed and a scripted bus, at a fixed 60 Hz step.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Tether, TIERS, rng } from '../src/tether.js';
import { TETHER, FEEL, STORMS } from '../src/config.js';

const DT = 1 / 60;
const WALL = { pete: 22 + TETHER.hitPad, agnes: 60 + TETHER.hitPad, sisters: 32 + TETHER.hitPad }; // funnel contact radius, roughly radiusAt(0.02)
const SEEDS = Array.from({ length: 120 }, (_, i) => (i * 2654435761) >>> 0);

// a bus that drives in from `from` metres at `speed` m/s, stops at the ring and waits there (the slow, unlucky player)
function busPath(def, from = 190, speed = 30, bearing = 0.4, hold = 0) {
  const ring = WALL[def.id] - TETHER.hitPad + FEEL.dropMargin + hold;
  return (t) => { const d = Math.max(ring, from - speed * t); return { x: Math.cos(bearing) * d, z: Math.sin(bearing) * d }; };
}

// run the whole line (or `secs`), recording every frame and every event
function run(def, seed, opts = {}) {
  const te = new Tether(def.tether, seed), line = opts.line ?? FEEL.hookSeconds, bus = opts.bus || busPath(def);
  const frames = [], events = [], c = { wall: WALL[def.id] };
  for (let t = 0; t < (opts.secs ?? line); t += DT) {
    const b = bus(t); c.left = line - t; c.rip = opts.rip ?? true; c.bus = !!b; c.bx = b ? b.x : 0; c.bz = b ? b.z : 0; c.mercy = opts.mercy ? opts.mercy(t) : false;
    const ring = WALL[def.id] - TETHER.hitPad + FEEL.dropMargin; c.near = b ? Math.max(0, Math.min(1, 1 - (Math.hypot(b.x, b.z) - ring) / TETHER.nearRange)) : 0;
    const o = te.update(DT, c);
    frames.push({ t: te.t, ox: o.ox, oz: o.oz, step: te.step, tier: te.tier, mag: te.mag, magT: te.magT, dx: te.dx, dz: te.dz, mercy: c.mercy, bx: c.bx, bz: c.bz, tension: o.tension });
    if (te.ev) events.push({ t: te.t, ev: te.ev, tier: te.tier, dur: te.stepDur, dx: te.dx, dz: te.dz, left: c.left, bx: c.bx, bz: c.bz, mercy: c.mercy, magT: te.magT, act: te.act });
  }
  return { te, frames, events };
}

test('the same seed and the same driving give the same storm', () => {
  for (const def of STORMS) {
    const a = run(def, 1234).frames, b = run(def, 1234).frames, c = run(def, 1235).frames;
    assert.deepEqual(a, b);
    assert.notDeepEqual(a.map((f) => f.ox), c.map((f) => f.ox));
  }
  const r = rng(7), s = rng(7); for (let i = 0; i < 50; i++) assert.equal(r(), s());
});

test('it never goes further than the line allows', () => {
  for (const def of STORMS) {
    let worst = 0; const R = new Tether(def.tether).radius;
    for (const seed of SEEDS) for (const f of run(def, seed).frames) worst = Math.max(worst, Math.hypot(f.ox, f.oz));
    assert.ok(worst <= R + 1e-9, `${def.id}: ${worst.toFixed(2)} m > radius ${R.toFixed(2)} m`);
    assert.ok(worst > def.tether.aggressive * 0.6, `${def.id}: it barely moved (${worst.toFixed(1)} m)`); // and it really does lunge
  }
});

test('lunges are continuous: no jumps, no teleports', () => {
  for (const def of STORMS) {
    let worst = 0;
    for (const seed of SEEDS) {
      const { frames } = run(def, seed, { mercy: (t) => (t % 4) > 3 }); // mercy switching on mid-lunge pulls lunges short: still no jump
      for (let i = 1; i < frames.length; i++) worst = Math.max(worst, Math.hypot(frames[i].ox - frames[i - 1].ox, frames[i].oz - frames[i - 1].oz));
    }
    // 3 m in a 60th of a second is 180 m/s: a burst, not a jump. The funnel is 22 to 60 m across at its foot.
    assert.ok(worst < 3, `${def.id}: ${worst.toFixed(2)} m in one frame`);
  }
});

test('every dangerous lunge is telegraphed, longer and harder for violent ones', () => {
  for (const def of STORMS) {
    const wind = { 1: [], 2: [] };
    for (const seed of SEEDS) {
      const { events } = run(def, seed); let last = null;
      for (const e of events) {
        if (e.ev === 'windup') last = e;
        if (e.ev === 'lunge' && e.tier > 0) {
          assert.ok(last && last.tier === e.tier, `${def.id}/${seed}: lunge without its windup`);
          assert.ok(e.t - last.t >= FEEL.telegraphMin - 1e-6, `${def.id}/${seed}: windup only ${(e.t - last.t).toFixed(2)} s`);
          assert.equal(e.dx, last.dx); assert.equal(e.dz, last.dz); // it goes where it leaned
          wind[e.tier].push(e.t - last.t);
        }
      }
    }
    const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    assert.ok(wind[1].length > 0 && wind[2].length > 0, `${def.id}: never lunged hard (${wind[1].length}/${wind[2].length})`);
    assert.ok(avg(wind[2]) > avg(wind[1]) + 0.3, `${def.id}: violent warning ${avg(wind[2]).toFixed(2)} s vs aggressive ${avg(wind[1]).toFixed(2)} s`);
  }
});

test('the windup reads: the line goes taut (>1) before a dangerous lunge, and slack as it is hauled back', () => {
  for (const def of STORMS) {
    const { frames } = run(def, SEEDS[3]);
    const lungeIdx = frames.findIndex((f, i) => i && f.step === 'lunge' && f.tier > 0 && frames[i - 1].step === 'windup');
    assert.ok(lungeIdx > 0); assert.ok(frames[lungeIdx - 1].tension > 1, `tension at the end of the windup ${frames[lungeIdx - 1].tension}`);
    const recoil = frames.slice(lungeIdx).filter((f) => f.step === 'recoil' && f.tier > 0); assert.ok(recoil.some((f) => f.tension < 0), 'no slack in the recoil');
  }
});

test('the hook lands with a breath, then a lesson wide of the bus', () => {
  for (const def of STORMS) for (const seed of SEEDS.slice(0, 40)) {
    const { events } = run(def, seed); const first = events.find((e) => e.tier > 0);
    assert.ok(first.t >= TETHER.opening - 1e-6, `${def.id}: first dangerous lunge at ${first.t.toFixed(2)} s`);
    assert.equal(first.tier, 1, 'the first one is aggressive, not violent');
    const off = Math.abs(Math.atan2(Math.sin(Math.atan2(first.dz, first.dx) - Math.atan2(first.bz, first.bx)), Math.cos(Math.atan2(first.dz, first.dx) - Math.atan2(first.bz, first.bx))));
    assert.ok(off >= 1.2, `${def.id}: the lesson came at the bus (${off.toFixed(2)} rad)`);
  }
});

test('it escalates over the 15 seconds, and nothing violent comes before 10 s are left', () => {
  for (const def of STORMS) {
    const per = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    // the bus closes and hangs 40 m off the ring (in the game, crossing the ring sets DOROTHY down and ends the run)
    for (const seed of SEEDS) { let lesson = true; for (const e of run(def, seed, { bus: busPath(def, 190, 30, 0.4, 40) }).events) if (e.ev === 'windup') { if (e.tier && lesson) { lesson = false; assert.equal(e.act, 0); continue; } per[e.act][e.tier]++; } }
    assert.equal(per[0][2], 0, `${def.id}: violent in the first act`);
    // dangerous lunges per 5 s, per player, after the lesson: more in each act, and a bigger share of them violent
    const rate = (a) => (per[a][1] + per[a][2]) / SEEDS.length, share = (a) => per[a][2] / (per[a][1] + per[a][2]);
    const threat = (a) => (per[a][1] + 2 * per[a][2]) / SEEDS.length; // a violent lunge counts double: it is longer, further, and louder
    assert.ok(rate(1) > rate(0) && rate(2) > rate(1), `${def.id}: ${[0, 1, 2].map(rate).map((x) => x.toFixed(2)).join(' → ')} lunges per act`);
    assert.ok(threat(2) > threat(1) * 1.15, // the last act is near the ceiling the warnings and breathers allow (about 1.5 in 5 s)
      `${def.id}: threat ${[0, 1, 2].map(threat).map((x) => x.toFixed(2)).join(' → ')} per act`);
    assert.ok(share(2) > share(1), `${def.id}: violent share ${share(1).toFixed(2)} → ${share(2).toFixed(2)}`);
    assert.ok(rate(2) < 2.2, `${def.id}: ${rate(2).toFixed(2)} dangerous lunges in the last 5 s is too many`);
  }
});

test('the last seconds stay survivable: there is always a breather between dangerous lunges', () => {
  for (const def of STORMS) for (const seed of SEEDS) {
    const { events } = run(def, seed); let end = -1e9;
    for (const e of events) {
      if (e.ev === 'windup' && e.tier > 0) {
        const a = TETHER.acts[e.act]; if (e !== events.find((x) => x.tier > 0)) assert.ok(e.t - end >= a.gap * def.tether.rest * (1 - TETHER.nearGap) - DT * 2, `${def.id}/${seed}: ${(e.t - end).toFixed(2)} s between lunges`);
      }
      if (e.ev === 'recoil' && e.tier > 0) end = e.t + TETHER.tiers[TIERS[e.tier]].recoil;
    }
  }
});

test('mercy: nothing dangerous lands on a bus that has just been hit', () => {
  for (const def of STORMS) for (const seed of SEEDS) {
    // the bus parks right at the ring with mercy on from 3 s: every lunge from then on must stay clear of it
    const { frames } = run(def, seed, { bus: busPath(def, 60, 40, 1.1), mercy: (t) => t > 3 });
    for (const f of frames) if (f.mercy && f.tier > 0 && f.t > 3.4) { // allow the eased pull-back of one that was already coming
      const gap = Math.hypot(f.bx - f.dx * f.magT, f.bz - f.dz * f.magT);
      assert.ok(gap >= WALL[def.id] + TETHER.safety - 0.01 || (f.dx * f.bx + f.dz * f.bz) <= 0, `${def.id}/${seed}: lunge lands ${gap.toFixed(1)} m from the bus`);
    }
  }
});

test('while DOROTHY flies and on the kill shot it only shivers', () => {
  for (const def of STORMS) for (const seed of SEEDS.slice(0, 30)) {
    const { events } = run(def, seed, { rip: false, bus: () => null });
    assert.ok(events.every((e) => e.tier === 0), `${def.id}: lunged with no bus to aim at`);
  }
});

test('each storm keeps its temperament', () => {
  const [pete, agnes, sisters] = ['pete', 'agnes', 'sisters'].map((id) => STORMS.find((s) => s.id === id));
  const reach = (d) => d.tether.violent, warn = (d) => new Tether(d.tether).windupFor(2);
  assert.ok(reach(pete) < reach(sisters) && reach(sisters) < reach(agnes));
  assert.ok(pete.tether.aggressive < agnes.tether.aggressive);
  assert.ok(warn(pete) > warn(sisters) && warn(pete) > warn(agnes), 'Pete warns longest');
  assert.ok(pete.tether.rest > agnes.tether.rest && agnes.tether.rest > sisters.tether.rest, 'Pete rests longest, the Sisters least');
  // an aggressive lunge does not reach a bus parked on the ring dead ahead of it: only a badly placed bus gets bitten
  for (const d of STORMS) assert.ok(d.tether.aggressive < FEEL.dropMargin - TETHER.hitPad + 4, `${d.id}: aggressive reach ${d.tether.aggressive} m`);
});

test('it lashes out at whatever gets close: sooner, never violent in the first act', () => {
  for (const def of STORMS) {
    const second = (bus) => { let sum = 0; for (const seed of SEEDS) { const ev = run(def, seed, { bus, secs: 12 }).events.filter((e) => e.ev === 'windup' && e.tier > 0); sum += ev[1] ? ev[1].t : 12; } return sum / SEEDS.length; };
    const close = second(busPath(def, 60, 40)), far = second(() => ({ x: 400, z: 0 }));
    assert.ok(close < far - 0.5, `${def.id}: second lunge at ${close.toFixed(2)} s close vs ${far.toFixed(2)} s far`);
    for (const seed of SEEDS) for (const e of run(def, seed, { bus: busPath(def, 60, 40) }).events) if (e.act === 0) assert.notEqual(e.tier, 2);
  }
});

test('safeMag stops a lunge short of the bus', () => {
  const te = new Tether(STORMS[0].tether, 1); te.dx = 1; te.dz = 0;
  const c = { bus: true, bx: 60, bz: 0, wall: 25 };
  const m = te.safeMag(c, 40); assert.ok(Math.abs(60 - m - (25 + TETHER.safety)) < 1e-9);
  assert.equal(te.safeMag({ ...c, bx: -60 }, 40), 40);           // lunging away
  assert.equal(te.safeMag({ ...c, bx: 0, bz: 90 }, 40), 40);     // the line of the lunge misses
  assert.equal(te.safeMag({ ...c, bx: 20 }, 40), 0);             // already in reach: nothing more comes its way
});
