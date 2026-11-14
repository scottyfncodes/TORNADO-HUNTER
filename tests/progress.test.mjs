// Saves, grades and the Daily Storm, under Node: node --test tests/
// tests/fixtures/save-v1.json is a save as version 2.6 and earlier wrote it (key tornado-hunter/v1): an old gadget owned and
// fitted, a rematch flag, two storms beaten, calm mode on. It has to load into this build with nothing lost.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { migrate, FRESH, save, crewOf, tapCrew } from '../src/save.js';
import { grade, better, rankOf, LETTERS } from '../src/grade.js';
import { dayKey, shiftDay, seedOf, dailyFor, stream, extendStreak, liveStreak, shareText, clock } from '../src/daily.js';
import { GRADE, STORMS, RIGS, CREW, SETPIECE, POWERLINES } from '../src/config.js';

const V1 = fs.readFileSync(new URL('./fixtures/save-v1.json', import.meta.url), 'utf8');

test('a version 1 save loads with everything it had, under the same key', () => {
  const old = JSON.parse(V1), s = migrate(V1);
  assert.equal(save.KEY, 'tornado-hunter/v1');
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  for (const k of Object.keys(old)) assert.deepEqual(s[k], isObj(old[k]) ? { ...FRESH()[k], ...old[k] } : old[k], k); // every field it had, as it had it
  assert.equal(s.data, 412); assert.deepEqual(s.kills, { pete: 3, agnes: 1 }); assert.deepEqual(s.loadout.crew, ['june', 'winch']);
  assert.equal(s.loadout.gadget, 'thumper'); assert.equal(s.owned.thumper, true); assert.equal(s.loadout.rematch, true); assert.equal(s.settings.calm, true);
});
test('a version 1 save gets every new field at its default', () => {
  const s = migrate(V1);
  assert.deepEqual(s.seen, { dorothy: false, kill: false });
  assert.deepEqual(s.grades, {});
  assert.deepEqual(s.daily, { day: '', used: false, result: null });
  assert.deepEqual(s.streak, { count: 0, last: '', best: 0 });
  assert.equal(s.settings.music, true); assert.equal(s.settings.calm, true); // 2.12: the music is on for a save that never heard of it, and its other settings are kept
});
test('a migrated save written back and read again is the same save', () => {
  const s = migrate(V1); assert.deepEqual(migrate(JSON.stringify(s)), s);
});
test('nothing, rubbish or the wrong shape is a fresh start, never a crash', () => {
  for (const raw of [null, '', '{', 'null', '[]', '42', '"x"']) assert.deepEqual(migrate(raw), FRESH(), String(raw));
});
test('a save from this build keeps its new fields', () => {
  const s = migrate(V1); s.grades.pete = 'A'; s.streak = { count: 4, last: '2026-11-11', best: 6 }; s.daily = { day: '2026-11-11', used: true, result: { won: true, letter: 'B', time: 80 } };
  s.settings.music = false; const back = migrate(JSON.stringify(s)); assert.equal(back.settings.music, false); assert.equal(back.grades.pete, 'A'); assert.equal(back.streak.count, 4); assert.equal(back.daily.result.letter, 'B');
});

// ---- grades ----
const fightOf = (id, o = {}) => ({ won: true, storm: STORMS.find((s) => s.id === id), time: GRADE.par[id], hull: 100, hullMax: 100, stats: { rounds: 1000, fired: 600, crits: Math.ceil(GRADE.crit[id] * 1000), close: GRADE.close, ...o.stats }, ...o });
test('a perfect fight is an S, a wreck has no grade', () => {
  for (const s of STORMS) assert.equal(grade(fightOf(s.id)).letter, 'S');
  assert.equal(grade({ ...fightOf('pete'), won: false }).letter, null);
});
test('the letters are in order and the best is kept', () => {
  assert.deepEqual(LETTERS, ['S', 'A', 'B', 'C', 'D']); assert.equal(better('B', 'A'), 'A'); assert.equal(better('S', 'C'), 'S'); assert.ok(rankOf('S') < rankOf('D'));
});
test("every hint names one thing, in the player's own units, and doing it does raise the grade", () => {
  let n = 0;
  for (const s of STORMS) for (const t of [1.1, 1.4, 1.7]) for (const hull of [20, 60, 95]) for (const acc of [0.25, 0.45]) for (const crits of [0.2, 0.7]) for (const close of [0, 3]) {
    const f = fightOf(s.id, { time: GRADE.par[s.id] * t, hull, stats: { rounds: 1000, fired: Math.round(acc * 1000), crits: Math.round(crits * GRADE.crit[s.id] * 1000), close } }), g = grade(f);
    if (g.letter === 'S') continue; const next = LETTERS[LETTERS.indexOf(g.letter) - 1];
    // "6 s faster for A", "3 near misses short of A", or two of them: "6 s faster and 4% more crits for A"
    const m = g.hint.match(/^(.+?) (?:for|short of) ([SABCD])$/); assert.ok(m, `"${g.hint}"`); assert.equal(m[2], next, g.hint);
    const b = structuredClone(f); b.storm = f.storm;
    for (const part of m[1].split(' and ')) { // do exactly what it says
      const q = part.match(/^(\d+)(?: s faster|% more accuracy|% more crits| more hull| (?:more )?near miss(?:es)?)$/); assert.ok(q, `"${part}" in "${g.hint}"`); const k = +q[1];
      if (/faster/.test(part)) b.time -= k; else if (/hull/.test(part)) b.hull += k; else if (/accuracy/.test(part)) b.stats.fired += Math.ceil(k * b.stats.rounds / 100); else if (/crit/.test(part)) b.stats.crits += Math.ceil(k * b.stats.rounds / 100); else b.stats.close += k;
    }
    assert.ok(m[1].split(' and ').length <= 2, g.hint);
    assert.ok(rankOf(grade(b).letter) <= rankOf(next), `${s.id}: "${g.hint}" did not reach ${next} (${grade(b).letter})`); n++;
  }
  assert.ok(n > 100);
});

// ---- crits are precision, not volume (2.13): until then the grade counted them, and a faster gun counted more of them ----
test('the same aim grades the same on every rig: crits are a share of rounds, not a count', () => {
  for (const s of STORMS) {
    const at = (rig, share, acc) => { const rounds = Math.round(60 / rig.gun.every); return grade(fightOf(s.id, { time: GRADE.par[s.id] * 1.3, hull: 70, stats: { rounds, fired: Math.round(acc * rounds), crits: Math.round(share * rounds), close: 2 } })).score; };
    const [mule, bulldog, whippet] = RIGS.map((r) => at(r, 0.25, 0.6));
    assert.ok(Math.abs(bulldog - mule) <= 1 && Math.abs(whippet - mule) <= 1, `${s.id}: one minute of the same aim graded ${mule} / ${bulldog} / ${whippet} on the Mule / Bulldog / Whippet`);
    const better = RIGS.map((r) => at(r, 0.35, 0.6)); assert.ok(better.every((v, i) => v > [mule, bulldog, whippet][i]), `${s.id}: more rounds on the seam did not grade higher on every rig`);
  }
});
test('missed rounds and rounds off the seam still cost the grade', () => {
  const base = { rounds: 1000, fired: 700, crits: 250, close: 2 }, f = (st) => grade(fightOf('agnes', { time: GRADE.par.agnes * 1.4, hull: 60, stats: { ...base, ...st } })).score;
  const ref = f({});
  assert.ok(f({ rounds: 1400 }) < ref, 'the same hits and crits from more rounds (400 missed) did not grade lower');
  assert.ok(f({ crits: 120 }) < ref, 'the same hits with fewer of them on the seam did not grade lower');
  assert.ok(f({ crits: 120, fired: 400 }) < f({ crits: 120 }), 'fewer hits did not grade lower');
});

// ---- the crew who lead (2.13): a tap toggles, two at most, never a silent swap; any older save's list still loads ----
test('crew: a tap stands a leader down or steps one up, and with two leading anyone else is refused', () => {
  const ids = CREW.map((c) => c.id);
  assert.deepEqual(tapCrew(['doc', 'winch'], 'doc'), { crew: ['winch'], full: false }, 'a leader did not stand down');
  assert.deepEqual(tapCrew(['winch'], 'june'), { crew: ['winch', 'june'], full: false }, 'a crew member did not step up into an open place');
  assert.deepEqual(tapCrew(['doc', 'winch'], 'june'), { crew: ['doc', 'winch'], full: true }, 'with two leading a third replaced one');
  assert.deepEqual(tapCrew([], 'sparks'), { crew: ['sparks'], full: false });
  for (const a of ids) for (const b of ids) { const t = tapCrew(crewOf([a, b], ids), 'sparks'); assert.ok(t.crew.length <= 2 && new Set(t.crew).size === t.crew.length, `${a},${b}: ${t.crew}`); }
  assert.deepEqual(crewOf(migrate(V1).loadout.crew, ids), ['june', 'winch'], 'a version 1 save lost its crew');
  assert.deepEqual(crewOf(['doc', 'doc', 'nobody', 'sparks', 'june'], ids), ['doc', 'sparks'], 'repeats, unknown names or a third leader survived');
  assert.deepEqual(crewOf('doc', ids), ['doc', 'winch'], 'a damaged list did not fall back to the default pair'); assert.deepEqual(crewOf([], ids), []);
});

// ---- the Daily Storm ----
test('the day is the date in Denver', () => {
  assert.equal(dayKey(new Date('2026-11-12T06:59:00Z')), '2026-11-11'); // 11:59 pm the night before, in Denver
  assert.equal(dayKey(new Date('2026-11-12T07:00:00Z')), '2026-11-12'); // midnight in Denver (MST, UTC-7)
  assert.equal(dayKey(new Date('2026-07-04T05:59:00Z')), '2026-07-03'); // summer: MDT, UTC-6
  assert.equal(dayKey(new Date('2026-07-04T06:00:00Z')), '2026-07-04');
  assert.equal(shiftDay('2026-03-01', -1), '2026-02-28'); assert.equal(shiftDay('2026-12-31', 1), '2027-01-01');
});
test('one day, one storm and one fight for everyone; other days differ', () => {
  const a = dailyFor('2026-11-12'), b = dailyFor('2026-11-12');
  assert.deepEqual(a, b); assert.equal(a.seed, seedOf('2026-11-12'));
  const seen = new Set(), seeds = new Set(); for (let i = 0; i < 60; i++) { const d = dailyFor(shiftDay('2026-11-12', i)); seen.add(d.storm.id); seeds.add(d.seed); }
  assert.equal(seen.size, 3, 'every storm comes up'); assert.equal(seeds.size, 60);
  for (const name of ['juke', 'attack', 'weather', 'bolts', 'tether']) { const x = stream(a.seed, name), y = stream(a.seed, name); for (let i = 0; i < 20; i++) assert.equal(x(), y()); }
  const j = stream(a.seed, 'juke')(), k = stream(a.seed, 'attack')(); assert.notEqual(j, k, 'the streams are independent');
});
test('the streak counts consecutive days played, and breaks on a missed one', () => {
  let s = { count: 0, last: '', best: 0 };
  s = extendStreak(s, '2026-11-10'); s = extendStreak(s, '2026-11-11'); s = extendStreak(s, '2026-11-11'); s = extendStreak(s, '2026-11-12');
  assert.deepEqual(s, { count: 3, last: '2026-11-12', best: 3 });
  assert.equal(liveStreak(s, '2026-11-12'), 3); assert.equal(liveStreak(s, '2026-11-13'), 3, 'still alive the next day until it is played'); assert.equal(liveStreak(s, '2026-11-14'), 0);
  s = extendStreak(s, '2026-11-15'); assert.deepEqual(s, { count: 1, last: '2026-11-15', best: 3 });
});
test('the share text is spoiler-free: storm, grade, time and a row per phase', () => {
  const t = shareText({ day: '2026-11-12', storm: 'Big Agnes', letter: 'A', time: 102.4, won: true, rows: { chase: ['g', 'y', 'g'], guns: ['g', 'g', 'y'], harpoon: ['g'], dorothy: ['g'], kill: ['g'] } });
  assert.equal(t, 'Tornado Hunter · Daily Storm · 12 Nov 2026\nBig Agnes · A · 1:42\n🚚 🟩🟨🟩\n🎯 🟩🟩🟨\n🪝 🟩\n📡 🟩\n🚀 🟩');
  const l = shareText({ day: '2026-11-12', storm: 'The Sisters', letter: null, time: 61, won: false, rows: { chase: ['r'], guns: ['y'], harpoon: [], dorothy: [], kill: [] } });
  assert.equal(l, 'Tornado Hunter · Daily Storm · 12 Nov 2026\nThe Sisters · Wrecked at 1:01\n🚚 🟥\n🎯 🟨');
  assert.ok(!/\d{3,}|seed|http/i.test(t.split('\n').slice(2).join('')), 'no numbers, no seed, no link in the rows');
  assert.equal(clock(59.6), '1:00');
});

test('the grain elevator comes in about a third of Daily Storms, and the seed decides', () => {
  let n = 0; const days = 730; for (let i = 0; i < days; i++) { const d = dailyFor(shiftDay('2026-01-01', i)); if (stream(d.seed, 'setpiece')() < SETPIECE.chance) n++; }
  assert.ok(Math.abs(n / days - SETPIECE.chance) < 0.05, `${n} of ${days} days`);
  const d = dailyFor('2026-11-12'); assert.equal(stream(d.seed, 'setpiece')(), stream(d.seed, 'setpiece')());
});

test('the power lines come on about a fifth of Daily Storm days, and never on the elevator\'s', () => {
  let lines = 0, both = 0; const days = 730;
  for (let i = 0; i < days; i++) { const r = stream(dailyFor(shiftDay('2026-01-01', i)).seed, 'setpiece')(), el = r < SETPIECE.chance, ln = !el && r < SETPIECE.chance + POWERLINES.chance; if (ln) lines++; if (el && ln) both++; }
  assert.ok(Math.abs(lines / days - POWERLINES.chance) < 0.05, `${lines} of ${days} days`); assert.equal(both, 0);
  assert.ok(POWERLINES.tele0 >= 1.2 && SETPIECE.tele.every((t) => t >= 1.2), 'every piece has at least 1.2 s of warning');
});
