// The score: what the music plays, decided from the fight. Pure: no Web Audio, no DOM (tests/score.test.mjs).
// music.js turns the events this returns into sound. One theme, eight bars, written against one progression (i, VII, VI, VII,
// two bars each), so whatever section the fight is in, the tune still fits the chords under it. Each storm plays it its own
// way: its key, its tempo, its drummer.
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const MINOR = [0, 2, 3, 5, 7, 8, 10], MIXO = [0, 2, 4, 5, 7, 9, 10]; // the fight is in the minor; the win turns it major, with the flat seventh a western keeps
// a scale degree (0 is the root; 7 is the octave; negatives go down) in semitones
export const semis = (scale, d) => scale[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);

export const THEMES = {
  camp:    { id: 'camp', root: 45, bpm: 84, scale: MINOR, leadOct: 12, lead: 'pluck' },          // title and headquarters: A minor, unhurried
  pete:    { id: 'pete', root: 45, bpm: 126, scale: MINOR, leadOct: 24, lead: 'pluck' },         // Skinny Pete: A minor, light on its feet
  agnes:   { id: 'agnes', root: 38, bpm: 108, scale: MINOR, leadOct: 24, lead: 'brass', heavy: true }, // Big Agnes: D minor, low, slow and heavy (half-time drums)
  sisters: { id: 'sisters', root: 40, bpm: 138, scale: MINOR, leadOct: 24, lead: 'pluck', twin: true }, // The Sisters: E minor, fastest, the arpeggio answered a third above
  after:   { id: 'after', root: 45, bpm: 84, scale: MIXO, leadOct: 12, lead: 'pluck' },          // after a win: A major with the flat seventh
};
export const PROG = [0, 0, 6, 6, 5, 5, 6, 6];            // the chord under each of the eight bars, as a scale degree: i i VII VII VI VI VII VII
const PROG_AFTER = [0, 0, 6, 6, 3, 3, 0, 0];             // after a win: I, flat VII, IV, I
// the theme: per bar, [step, degree, length in sixteenths]. Three, three, two: a gallop. Every long note is a chord tone.
export const THEME = [
  [[0, 4, 3], [3, 7, 3], [6, 6, 2], [8, 4, 6]],          // E  A  G  E      over i
  [[0, 3, 3], [3, 4, 3], [6, 6, 2], [8, 7, 8]],          // D  E  G  A
  [[0, 8, 3], [3, 7, 3], [6, 6, 2], [8, 3, 6]],          // B  A  G  D      over VII
  [[0, 6, 3], [3, 7, 3], [6, 8, 2], [8, 10, 8]],         // G  A  B  D'     climbing
  [[0, 7, 3], [3, 9, 3], [6, 7, 2], [8, 5, 6]],          // A  C' A  F      over VI
  [[0, 4, 3], [3, 5, 3], [6, 7, 2], [8, 9, 8]],          // E  F  A  C'
  [[0, 8, 3], [3, 7, 3], [6, 6, 2], [8, 8, 6]],          // B  A  G  B      over VII
  [[0, 10, 3], [3, 8, 3], [6, 6, 2], [8, 3, 8]],         // D' B  G  D      and a step up into the first bar again
];
export const SECTIONS = ['camp', 'chase', 'zone', 'surge', 'stagger', 'rip', 'dorothy', 'kill', 'killcine', 'won', 'lost', 'after', 'ashes'];

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// which part of the score the game is in. `st` is what main.js reads off the mission each frame.
export function sectionOf(st) {
  if (!st || st.scene === 'title' || st.scene === 'hq') return 'camp';
  if (st.scene === 'results') return st.won ? 'after' : 'ashes';
  if (st.won === true || st.phase === 'won') return 'won';
  if (st.won === false || st.phase === 'lost') return 'lost';
  if (st.cine === 'pod') return 'dorothy';
  if (st.cine === 'rocket') return 'killcine';
  if (st.phase === 'surge') return 'surge';
  if (st.phase === 'stagger') return 'stagger';
  if (st.phase === 'rip' || st.phase === 'dorothy') return 'rip';
  if (st.phase === 'kill') return 'kill';
  return st.inZone || st.view === 'gun' ? 'zone' : 'chase';
}
export const themeOf = (st, section = sectionOf(st)) => (section === 'camp' ? THEMES.camp : section === 'after' ? THEMES.after : section === 'ashes' ? THEMES.camp : THEMES[st.storm] || THEMES.pete);

// how hard the music is pushing, 0..1: later bands, something about to land on you, a hull that is nearly gone, a window running out
export function intensityOf(st, section = sectionOf(st)) {
  if (section === 'camp' || section === 'after' || section === 'ashes') return 0.2;
  const stage = Math.min(3, st.stage || 0), hull = st.hull === undefined ? 1 : st.hull, urgent = st.urgency || 0;
  const base = { chase: 0.25, zone: 0.45, surge: 0.7, stagger: 0.35, rip: 0.7, dorothy: 0.6, kill: 0.8, killcine: 1, won: 0, lost: 0 }[section];
  return clamp01(base + 0.1 * stage + (st.threat ? 0.15 : 0) + 0.25 * clamp01((0.4 - hull) / 0.4) + 0.2 * urgent);
}
// each band the storm loses it speeds up 6%: the music goes with it, 4% a band
export const tempoOf = (theme, st) => theme.bpm * (theme.id === 'camp' || theme.id === 'after' ? 1 : 1 + 0.04 * Math.min(3, (st && st.stage) || 0));

// how loud each layer is in each section (0..1), before the engine's own balance. x is intensityOf.
export function mixOf(section, x) {
  switch (section) {
    case 'camp': return { pad: 0.9, bass: 0.5, drums: 0, arp: 0, lead: 0.7 };
    case 'after': return { pad: 1, bass: 0.55, drums: 0, arp: 0.35, lead: 0.75 };
    case 'ashes': return { pad: 0.7, bass: 0.3, drums: 0, arp: 0, lead: 0 };
    case 'chase': return { pad: 0.6, bass: 0.8, drums: 0.45 + 0.3 * x, arp: 0, lead: 0 };
    case 'zone': return { pad: 0.6, bass: 1, drums: 0.8 + 0.2 * x, arp: 0.35 + 0.5 * x, lead: 0.8 };
    case 'surge': return { pad: 0.9, bass: 0.9, drums: 0.9, arp: 0, lead: 0 };
    case 'stagger': return { pad: 1, bass: 0, drums: 0.5 + 0.4 * x, arp: 0.3, lead: 0 };
    case 'rip': return { pad: 0.7, bass: 1, drums: 1, arp: 0.7, lead: 1 };
    case 'dorothy': return { pad: 1, bass: 0, drums: 0.3, arp: 1, lead: 0 };
    case 'kill': return { pad: 0.8, bass: 1, drums: 1, arp: 0.8, lead: 0.6 };
    case 'killcine': return { pad: 1, bass: 0.8, drums: 1, arp: 0, lead: 0 };
    default: return { pad: 0, bass: 0, drums: 0, arp: 0, lead: 0 }; // won, lost: the sting plays, the loop is out
  }
}

// the three notes of the chord on a degree, folded into one octave above `base` so the voices move as little as they can
export function chord(theme, bar, base = theme.root + 12) {
  const d = (theme.id === 'after' ? PROG_AFTER : PROG)[((bar % 8) + 8) % 8];
  return [0, 2, 4].map((k) => { let m = theme.root + semis(theme.scale, d + k); while (m >= base + 12) m -= 12; while (m < base) m += 12; return m; }).sort((a, b) => a - b);
}
// the bass note under a bar: the chord's root, kept in the octave from the theme's root down
export function bassOf(theme, bar) { const d = (theme.id === 'after' ? PROG_AFTER : PROG)[((bar % 8) + 8) % 8]; let s = semis(theme.scale, d); if (s >= 7) s -= 12; return theme.root + s; }

// What sounds on one sixteenth. bar counts from when the theme started and never resets with the section, so the tune carries
// across a seat change. Returns [{ v: voice, m: midi, len: sixteenths, g: 0..1 }]; a 'pad' event carries the chord in `ms`.
// Deterministic: the same bar, step, section and intensity always give the same notes.
export function stepEvents({ theme, section, bar, step, x = 0.5, urgency = 0 }) {
  const ev = [], b8 = ((bar % 8) + 8) % 8, cycle = Math.floor(bar / 8), beat = step % 4, heavy = !!theme.heavy;
  const push = (v, m, len, g) => ev.push({ v, m, len, g });
  if (section === 'won' || section === 'lost') return ev;
  if (step === 0) ev.push({ v: 'pad', ms: section === 'stagger' ? [theme.root + 12, theme.root + 17, theme.root + 19] : chord(theme, bar), len: 16, g: 1 }); // the harpoon window hangs on a suspended chord: nothing resolved yet
  const root = bassOf(theme, bar), quiet = section === 'camp' || section === 'after' || section === 'ashes';

  // ---- bass ----
  if (quiet) { if (step === 0) push('bass', root, 6, 0.8); else if (step === 8 && section !== 'ashes') push('bass', root, 4, 0.55); }
  else if (section === 'surge') { if (step % 2 === 0) push('bass', theme.root, 2, 0.7 + 0.3 * (step / 16)); }             // a pedal on the root, getting louder: get clear
  else if (section === 'kill' || section === 'killcine') { if (step % 2 === 0 || (x > 0.85 && beat === 3)) push('bass', theme.root + 7 - 12, 2, 0.9); } // the fifth, held under the lock: it wants to come home
  else if (section !== 'stagger' && section !== 'dorothy') {
    if (heavy) { if ([0, 3, 6, 8, 11, 14].includes(step)) push('bass', root, step === 14 ? 2 : 3, step === 0 || step === 8 ? 1 : 0.8); } // Agnes: three, three, two, like a slow gallop
    else if (x < 0.4 && section === 'chase') { if (step % 2 === 0) push('bass', root, 2, beat === 0 ? 1 : 0.75); }           // far out: eighths
    else if (beat !== 1) push('bass', beat === 0 && step === 12 && b8 % 2 === 1 ? root + 12 : root, beat === 0 ? 2 : 1, beat === 0 ? 1 : 0.7); // in close: the gallop, da da-da
  }

  // ---- drums ----
  if (!quiet) {
    const fill = b8 === 7 && step >= 12 && (section === 'zone' || section === 'rip' || section === 'chase'); // into the next eight bars
    if (section === 'surge') { push('snare', 0, 1, 0.35 + 0.65 * (step / 15)); if (step % 4 === 0) push('kick', 0, 1, 0.9); } // a roll that climbs through the bar
    else if (section === 'killcine') { push('snare', 0, 1, 0.5 + 0.5 * (step / 15)); if (step % 2 === 0) push('kick', 0, 1, 1); }
    else if (section === 'stagger') { if (step === 0) push('kick', 0, 1, 0.8); if (step % 2 === 0 || urgency > 0.5) push('hat', 0, 1, step % 4 === 0 ? 0.9 : 0.5 + 0.4 * urgency); } // a clock: it ticks faster as the window closes
    else if (section === 'dorothy') { if (step % 2 === 0) push('hat', 0, 1, 0.5); }
    else if (fill) push('snare', 0, 1, 0.5 + 0.15 * (step - 12));
    else {
      const four = section === 'rip' || section === 'kill';
      if (heavy) { if (step === 0 || step === 10 || (four && step === 6)) push('kick', 0, 1, 1); if (step === 8) push('snare', 0, 1, 1); } // half time: the snare lands once a bar, late and hard
      else {
        if (four ? beat === 0 : step === 0 || step === 8 || (step === 10 && (x > 0.6 || (section !== 'chase' && b8 % 2 === 1)))) push('kick', 0, 1, step === 0 ? 1 : 0.85);
        if ((section !== 'chase' || x > 0.5) && (step === 4 || step === 12)) push('snare', 0, 1, 0.9);
        if (section === 'kill' && urgency > 0.5 && beat === 2) push('snare', 0, 1, 0.5); // the last seconds of the kill window: a snare on every off-beat
      }
      if (step === 14 && b8 % 2 === 1) push('ohat', 0, 2, 0.7);
      else if (step % 2 === 0 || x > 0.55) push('hat', 0, 1, step % 4 === 0 ? 0.8 : step % 2 === 0 ? 0.55 : 0.3);
    }
  }

  // ---- the arpeggio: the chord, up and back, in sixteenths. The Sisters' is answered a third above, two steps late ----
  if (section === 'zone' || section === 'rip' || section === 'dorothy' || section === 'kill' || section === 'stagger' || section === 'after') {
    const ch = chord(theme, section === 'stagger' ? 0 : bar, theme.root + 24), tones = [ch[0], ch[1], ch[2], ch[0] + 12, ch[1] + 12], shape = [0, 1, 2, 3, 2, 1], note = (i, up = 0) => tones[shape[((i % 6) + 6) % 6] + up];
    const every = section === 'after' || section === 'stagger' ? 2 : 1; // half speed where the music is holding its breath
    if (step % every === 0) { const i = (bar * 16 + step) / every; push('arp', section === 'dorothy' ? note(i) + 12 * Math.floor(step / 8) : note(i), every, i % 6 === 0 ? 0.9 : 0.6); if (theme.twin && every === 1) push('arp', note(i - 2, 1), 1, 0.4); } // the answer: the same figure two steps late, one chord tone up
  }

  // ---- the theme ----
  // In camp it is played once every other time round, alone. On the gun it comes in on the second time round and stays.
  // On the line (rip) it is there from the first bar: that is the tune's moment.
  const plays = section === 'camp' ? cycle % 2 === 0 && b8 < 4 : section === 'after' ? b8 < 2 : section === 'zone' ? cycle % 2 === 1 || x > 0.75 : section === 'rip' || section === 'kill';
  if (plays) {
    const bars = section === 'after' ? THEME.slice(0, 2) : THEME;
    for (const [s, d, len] of bars[b8 % bars.length]) if (s === step) { const m = theme.root + theme.leadOct + semis(theme.scale, d); push('lead', m, len, s === 8 ? 1 : 0.85); if (section === 'rip' || (section === 'kill' && x > 0.8)) push('lead', m + 12, len, 0.4); } // on the line it is doubled an octave up
  }
  return ev;
}

// ---- the stings: fixed phrases in seconds, in the storm's own key. [t, voice, midi (or 0), seconds, gain] ----
// The win: the theme's first two bars, turned major, timed so the last chord lands as the results come up. That is 5.8 s after
// the kill on the clock a person hears (4.8 s of the mission's, which runs slow for the first second and a half of it).
export const LAND = 5.8;
export function fanfare(theme) {
  const r = theme.root, L = r + 24, out = [], n = (t, m, d, g = 0.9, v = 'brass') => out.push([t, v, m, d, g]);
  out.push([0, 'swell', 0, 1.2, 0.6]);                                                       // a cymbal swelling out of the explosion
  for (const m of [r - 12, r, r + 4, r + 7]) n(0.35, m + 12, 0.6, 0.55);                     // the major chord, hit once
  n(1.4, L + 7, 0.4); n(1.85, L + 12, 0.4); n(2.3, L + 10, 0.26); n(2.6, L + 7, 0.75);       // E A G E
  for (const m of [r + 12, r + 16, r + 19]) n(1.4, m, 2.0, 0.3, 'pad');
  n(3.5, L + 5, 0.4); n(3.95, L + 7, 0.4); n(4.4, L + 10, 0.3);                              // D E G ...
  for (const m of [r + 10, r + 14, r + 17]) n(3.5, m, 1.25, 0.3, 'pad');                     // over the flat seventh
  n(4.8, L + 7, 0.3, 0.7); n(5.13, L + 9, 0.3, 0.8); n(5.46, L + 11, 0.3, 0.9);              // a run up the major scale
  for (let i = 0; i < 6; i++) out.push([4.8 + i * 0.165, 'snare', 0, 0.1, 0.4 + 0.1 * i]);   // and a roll under it
  n(LAND, L + 12, 2.6, 1); n(LAND, L, 2.6, 0.6); out.push([LAND, 'kick', 0, 0.3, 1]); out.push([LAND, 'crash', 0, 2.4, 0.8]); // ... A: home
  for (const m of [r - 12, r, r + 12, r + 16, r + 19, r + 24]) n(LAND, m, 3.2, 0.34, 'pad');
  return out;
}
// The loss: four notes down to the fifth, and a low note left hanging.
export function dirge(theme) {
  const r = theme.root, out = [], n = (t, m, d, g = 0.8, v = 'brass') => out.push([t, v, m, d, g]);
  n(0.15, r + 12, 0.5); n(0.65, r + 10, 0.5); n(1.15, r + 8, 0.5); n(1.65, r + 7, 1.6, 0.9);
  for (const m of [r - 12, r, r + 7]) n(1.65, m, 3.2, 0.3, 'pad');
  return out;
}
// How long each sting holds the stage before the results loop may start (s)
export const STING = { won: LAND + 2.9, lost: 4.2 };
