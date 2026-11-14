// The score, on its own: node --test tests/*.test.mjs
// What the music plays is decided by src/score.js, which is pure. These hold the composition to its own rules: every note in
// the key, the tune's long notes on the chord under them, the same bar always the same notes, and the fight mapped to the
// right part of the score. (What it sounds like is tests/audio.mjs, which renders it.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, THEME, PROG, SECTIONS, MINOR, MIXO, semis, sectionOf, themeOf, intensityOf, tempoOf, mixOf, chord, bassOf, stepEvents, fanfare, dirge, STING, LAND, mtof } from '../src/score.js';

const pcs = (theme) => new Set(theme.scale.map((s) => (theme.root + s) % 12));
const LOOPS = ['camp', 'chase', 'zone', 'surge', 'stagger', 'rip', 'dorothy', 'kill', 'killcine', 'after', 'ashes'];
const themeFor = (sec, id) => (sec === 'camp' || sec === 'ashes' ? THEMES.camp : sec === 'after' ? THEMES.after : THEMES[id]);
const each = (fn) => { for (const id of ['pete', 'agnes', 'sisters']) for (const section of LOOPS) for (const x of [0.2, 0.6, 1]) for (let bar = 0; bar < 16; bar++) for (let step = 0; step < 16; step++) fn({ theme: themeFor(section, id), section, bar, step, x, urgency: x }); };

test('the fight is mapped to the right part of the score', () => {
  const m = (o) => sectionOf({ scene: 'mission', storm: 'pete', phase: 'chase', view: 'drive', ...o });
  assert.equal(sectionOf({ scene: 'title' }), 'camp'); assert.equal(sectionOf({ scene: 'hq' }), 'camp'); assert.equal(sectionOf(undefined), 'camp');
  assert.equal(m({}), 'chase'); assert.equal(m({ inZone: true }), 'zone'); assert.equal(m({ view: 'gun' }), 'zone');
  assert.equal(m({ phase: 'surge' }), 'surge'); assert.equal(m({ phase: 'stagger', view: 'gun' }), 'stagger'); assert.equal(m({ phase: 'rip' }), 'rip');
  assert.equal(m({ phase: 'rip', cine: 'pod' }), 'dorothy'); assert.equal(m({ phase: 'kill', view: 'gun' }), 'kill'); assert.equal(m({ phase: 'kill', cine: 'rocket' }), 'killcine');
  assert.equal(m({ phase: 'won', won: true }), 'won'); assert.equal(m({ phase: 'lost', won: false }), 'lost');
  assert.equal(sectionOf({ scene: 'results', won: true }), 'after'); assert.equal(sectionOf({ scene: 'results', won: false }), 'ashes');
  for (const s of SECTIONS) assert.ok(mixOf(s, 0.5), s);
});

test('each storm has its own key and tempo, and the tempo climbs 4% a band', () => {
  assert.equal(themeOf({ scene: 'mission', storm: 'agnes', phase: 'chase' }).id, 'agnes'); assert.equal(themeOf({ scene: 'mission', storm: 'nobody', phase: 'chase' }).id, 'pete');
  assert.equal(themeOf({ scene: 'title' }).id, 'camp'); assert.equal(themeOf({ scene: 'results', won: true }).id, 'after'); assert.equal(themeOf({ scene: 'results', won: false }).id, 'camp');
  assert.equal(new Set(['pete', 'agnes', 'sisters'].map((k) => THEMES[k].root)).size, 3); assert.ok(THEMES.agnes.bpm < THEMES.pete.bpm && THEMES.pete.bpm < THEMES.sisters.bpm);
  assert.equal(tempoOf(THEMES.pete, { stage: 0 }), 126); assert.ok(Math.abs(tempoOf(THEMES.pete, { stage: 2 }) - 126 * 1.08) < 1e-9); assert.equal(tempoOf(THEMES.camp, { stage: 2 }), 84); assert.equal(tempoOf(THEMES.after, { stage: 3 }), 84);
});

test('every note is in the key', () => {
  let n = 0;
  each((c) => { const ok = pcs(c.theme); for (const e of stepEvents(c)) { for (const m of e.ms || (e.m ? [e.m] : [])) { n++; assert.ok(ok.has(((m % 12) + 12) % 12), `${c.theme.id}/${c.section} bar ${c.bar} step ${c.step}: ${e.v} plays ${m}, outside the key`); } } });
  assert.ok(n > 20000);
});

test("the tune's long notes sit on the chord under them", () => {
  for (const th of [THEMES.pete, THEMES.agnes, THEMES.sisters]) for (let bar = 0; bar < 8; bar++) {
    const tones = new Set([0, 2, 4].map((k) => (th.root + semis(th.scale, PROG[bar] + k)) % 12));
    for (const [, d, len] of THEME[bar]) if (len >= 6) assert.ok(tones.has((th.root + semis(th.scale, d)) % 12), `${th.id} bar ${bar}: the held note (degree ${d}) is not in the chord`);
  }
  // and it is the same tune whichever section plays it
  const lead = (section, bar) => { const out = []; for (let step = 0; step < 16; step++) for (const e of stepEvents({ theme: THEMES.pete, section, bar, step, x: 0.9 })) if (e.v === 'lead' && e.m < THEMES.pete.root + 24 + 20) out.push([step, e.m % 12, e.len]); return out; };
  for (let bar = 0; bar < 8; bar++) assert.deepEqual(lead('rip', bar).filter((_, i, a) => i === 0 || a[i - 1][0] !== a[i][0]), lead('zone', bar));
});

test('the same bar is always the same notes, and never a pile of them', () => {
  let most = 0;
  each((c) => { const a = stepEvents(c), b = stepEvents(c); assert.deepEqual(a, b); most = Math.max(most, a.length); if (c.step === 0) assert.equal(a.filter((e) => e.v === 'pad').length, 1, `${c.section}: no chord on the first beat of bar ${c.bar}`); for (const e of a) { assert.ok(e.g > 0 && e.g <= 1 && e.len >= 1 && e.len <= 16, JSON.stringify(e)); } });
  assert.ok(most <= 9, `${most} voices on one sixteenth`);
  assert.deepEqual(stepEvents({ theme: THEMES.pete, section: 'won', bar: 0, step: 0 }), []); assert.deepEqual(stepEvents({ theme: THEMES.pete, section: 'lost', bar: 3, step: 0 }), []);
});

test('the sections are different music', () => {
  const count = (section, v, x = 0.6, id = 'pete') => { let n = 0; for (let bar = 0; bar < 8; bar++) for (let step = 0; step < 16; step++) n += stepEvents({ theme: themeFor(section, id), section, bar, step, x, urgency: x }).filter((e) => e.v === v).length; return n; };
  assert.equal(count('camp', 'kick') + count('camp', 'snare') + count('camp', 'hat'), 0);                 // no drums in camp
  assert.equal(count('chase', 'lead'), 0); assert.ok(count('rip', 'lead') > count('zone', 'lead'));        // the tune arrives on the gun and is doubled on the line
  assert.equal(count('stagger', 'bass'), 0); assert.equal(count('dorothy', 'kick'), 0);                    // the harpoon window and DOROTHY's ride float
  assert.ok(count('stagger', 'hat', 1) > count('stagger', 'hat', 0.2));                                    // the clock ticks faster as the window closes
  assert.ok(count('zone', 'kick') > count('chase', 'kick', 0.2) && count('zone', 'snare') > count('chase', 'snare', 0.2)); assert.ok(count('zone', 'snare', 0.6, 'agnes') < count('zone', 'snare')); // the backbeat comes in on the gun; Agnes is in half time
  assert.ok(count('zone', 'arp', 0.6, 'sisters') > count('zone', 'arp') * 1.8);                            // the Sisters' arpeggio is answered
  assert.ok(count('surge', 'snare') === 8 * 16 && count('killcine', 'snare') === 8 * 16);                  // rolls
  for (const s of ['won', 'lost']) assert.deepEqual(mixOf(s, 1), { pad: 0, bass: 0, drums: 0, arp: 0, lead: 0 });
  assert.equal(mixOf('camp', 0.2).drums, 0); assert.ok(mixOf('zone', 0.9).drums > mixOf('chase', 0.2).drums);
});

test('how hard it pushes follows the fight', () => {
  const st = (o) => ({ scene: 'mission', storm: 'pete', phase: 'chase', view: 'gun', inZone: true, stage: 0, hull: 1, ...o }), x = (o) => intensityOf(st(o));
  assert.ok(x({ stage: 2 }) > x({ stage: 0 })); assert.ok(x({ threat: true }) > x({})); assert.ok(x({ hull: 0.1 }) > x({ hull: 0.5 })); assert.equal(x({ hull: 0.5 }), x({ hull: 1 }));
  assert.ok(x({ phase: 'kill', urgency: 1 }) > x({ phase: 'kill', urgency: 0 })); assert.ok(x({ view: 'drive', inZone: false }) < x({}));
  for (const s of [{ stage: 9, hull: 0, threat: true, urgency: 1, phase: 'kill' }, { scene: 'title' }, {}]) { const v = intensityOf(st(s)); assert.ok(v >= 0 && v <= 1, String(v)); }
});

test('the chords and the bass', () => {
  for (const th of Object.values(THEMES)) for (let bar = 0; bar < 8; bar++) {
    const c = chord(th, bar), b = bassOf(th, bar); assert.equal(c.length, 3); assert.ok(c[0] >= th.root + 12 && c[2] < th.root + 24 && c[0] < c[1] && c[1] < c[2], `${th.id} bar ${bar}: ${c}`);
    assert.ok(b <= th.root + 6 && b >= th.root - 6, `${th.id} bar ${bar}: bass ${b}`); assert.ok(c.some((m) => m % 12 === ((b % 12) + 12) % 12), 'the bass is the root of the chord');
  }
  assert.equal(Math.round(mtof(69)), 440); assert.equal(semis(MINOR, 7), 12); assert.equal(semis(MINOR, -1), -2); assert.equal(semis(MIXO, 2), 4);
});

test('the win lands on its last chord as the results come up, in the major', () => {
  for (const th of [THEMES.pete, THEMES.agnes, THEMES.sisters]) {
    const F = fanfare(th), major = new Set([0, 2, 4, 5, 7, 9, 10, 11].map((s) => (th.root + s) % 12)); // the major scale, and the flat seventh the tune keeps
    for (const [t, v, m, d] of F) { assert.ok(t >= 0 && t + d <= STING.won + 1.2, `${v} at ${t}`); if (m) assert.ok(major.has(m % 12), `${th.id}: ${v} plays ${m}`); }
    const last = F.filter(([t]) => t === LAND); assert.ok(last.length >= 8 && last.some(([, , m]) => m % 12 === th.root % 12) && last.some(([, , m]) => m % 12 === (th.root + 4) % 12), 'the last chord is the major chord on the root');
    assert.ok(F.some(([t, v]) => v === 'brass' && t > 1 && t < 3) && Math.max(...F.map(([t]) => t)) === LAND);
    const gaps = F.map(([t]) => t).sort((a, b) => a - b).map((t, i, a) => (i ? t - a[i - 1] : 0)); assert.ok(Math.max(...gaps) < 1.2, 'no hole in the fanfare');
    const D = dirge(th); for (const [t, , m] of D) { assert.ok(t < STING.lost); assert.ok(pcs(th).has(m % 12)); } assert.ok(D[0][2] > D[3][2], 'the loss goes down');
  }
  assert.ok(STING.won > LAND + 2 && STING.lost >= 3);
});
