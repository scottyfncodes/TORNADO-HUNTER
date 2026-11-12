// The Daily Storm: one storm for everyone, the same all day. Pure: no DOM (tests/daily.test.mjs).
// The day is the date in America/Denver. Its seed picks the storm and seeds each stream the fight draws from, so the
// jukes, the throws, the weather and the line come in the same order for everyone, whatever their frame rate.
// Nothing here leaves the device: the result and the streak live in the save, and Share only hands text to the player.
import { STORMS } from './config.js';
import { rng } from './tether.js';

export const ZONE = 'America/Denver';
// YYYY-MM-DD in Denver, for a Date (or now)
export function dayKey(date = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
// the day before / after a key (calendar days, no clocks involved)
export function shiftDay(key, n) { const [y, m, d] = key.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d + n)); return t.toISOString().slice(0, 10); }
// FNV-1a: a day's key to a 32-bit seed
export function seedOf(key) { let h = 0x811c9dc5; for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }

// independent streams, so drawing a juke never moves the next throw
const SALT = { storm: 0x9e3779b9, juke: 0x85ebca6b, attack: 0xc2b2ae35, weather: 0x27d4eb2f, bolts: 0x7feb352d, tether: 0x165667b1, setpiece: 0xd3a2646c };
export function stream(seed, name) { return rng((seed ^ SALT[name]) >>> 0); }

export function dailyFor(key = dayKey()) {
  const seed = seedOf(key), pick = stream(seed, 'storm');
  return { day: key, seed, storm: STORMS[Math.floor(pick() * STORMS.length)], tetherSeed: Math.floor(stream(seed, 'tether')() * 4294967296) >>> 0 };
}

// the streak: consecutive Denver days with a scored attempt played to the end. last: the day it was last extended.
// Missing a day breaks it; it reads 0 on the title once a whole day has gone by unplayed.
export function extendStreak(streak, key) {
  if (streak.last === key) return streak;
  const count = streak.last === shiftDay(key, -1) ? streak.count + 1 : 1;
  return { count, last: key, best: Math.max(streak.best || 0, count) };
}
export function liveStreak(streak, key = dayKey()) { return streak.last === key || streak.last === shiftDay(key, -1) ? streak.count : 0; }

// a spoiler-free result: the storm, the grade, the time, and a row per phase. No route, no positions, no seed.
//   rows: { chase: [...], guns: [...], harpoon: [...], dorothy: [...], kill: [...] }, each a list of 'g' | 'y' | 'r'
const SQ = { g: '🟩', y: '🟨', r: '🟥' }, ICON = { chase: '🚚', guns: '🎯', harpoon: '🪝', dorothy: '📡', kill: '🚀' };
export function clock(t) { const s = Math.max(0, Math.round(t)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
export function shareText({ day, storm, letter, time, won, rows }) {
  const [y, m, d] = day.split('-').map(Number), date = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const head = `Tornado Hunter · Daily Storm · ${date}`, sub = won ? `${storm} · ${letter} · ${clock(time)}` : `${storm} · Wrecked at ${clock(time)}`;
  const body = Object.keys(ICON).filter((k) => rows[k] && rows[k].length).map((k) => `${ICON[k]} ${rows[k].map((c) => SQ[c]).join('')}`);
  return [head, sub, ...body].join('\n');
}
