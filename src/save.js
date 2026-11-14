// Progress in localStorage. One currency (data), kill-based unlocks, a loadout, settings.
// The key and the shape are version 1's (tornado-hunter/v1): fields are only ever added, never renamed or removed, so a save
// from any earlier build loads (tests/save.test.mjs loads a real one, tests/fixtures/save-v1.json).
const KEY = 'tornado-hunter/v1';

export const FRESH = () => ({
  data: 0, bands: 0, kills: {}, best: {},
  owned: { mule: true, anchor: true },
  upgrades: { winch: 0, cable: 0, plating: 0, turbo: 0 },
  loadout: { rig: 'mule', crew: ['doc', 'winch'], gadget: 'anchor', storm: 'pete' },
  settings: { mute: false, calm: false, music: true }, // music (2.12): the band has its own switch
  seenCoach: false,
  seen: { dorothy: false, kill: false }, // 2.7: the two cinematics, watched to the end at least once: from then on a tap skips them
  grades: {},                            // 2.8: the best letter per storm, { pete: 'A' }
  daily: { day: '', used: false, result: null }, // 2.8: today's Daily Storm: its Denver date, whether the scored attempt is spent, how it went
  streak: { count: 0, last: '', best: 0 },       // 2.8: consecutive days with a scored Daily Storm played to the end
});

function merge(base, extra) {
  for (const k in extra) {
    if (extra[k] && typeof extra[k] === 'object' && !Array.isArray(extra[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], extra[k]);
    else base[k] = extra[k];
  }
  return base;
}
// a stored save (the JSON text, or nothing) to the current shape: what is there is kept, what is new gets its default.
// Anything unreadable is a fresh start rather than a crash.
export function migrate(raw) {
  if (!raw) return FRESH();
  try { const old = typeof raw === 'string' ? JSON.parse(raw) : raw; if (!old || typeof old !== 'object' || Array.isArray(old)) return FRESH(); return merge(FRESH(), old); } catch { return FRESH(); }
}

// ---- the crew who lead: at most two, each once, only ones that exist. Pure, for the headquarters and tests/progress.test.mjs ----
export const CREW_LEADS = 2;
// a stored list as it may be (any build's save, or a damaged one) to a valid one: unknown and repeated names dropped, at most two kept
export function crewOf(list, known) {
  if (!Array.isArray(list)) return FRESH().loadout.crew.slice();
  const out = []; for (const id of list) if (known.includes(id) && !out.includes(id) && out.length < CREW_LEADS) out.push(id);
  return out;
}
// a tap on a crew card: a leader stands down, anyone else steps up if there is room. Never a silent swap: with two leading,
// someone else is refused (`full`) until the player stands one down
export function tapCrew(list, id) {
  if (list.includes(id)) return { crew: list.filter((x) => x !== id), full: false };
  if (list.length >= CREW_LEADS) return { crew: list, full: true };
  return { crew: [...list, id], full: false };
}

let state = FRESH();
let storage = null;
try { storage = window.localStorage; storage.getItem(KEY); } catch { storage = null; }

export const save = {
  KEY,
  get s() { return state; },
  load() { if (!storage) return state; try { state = migrate(storage.getItem(KEY)); } catch { state = FRESH(); } return state; },
  write() { if (!storage) return; try { storage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode or full: play on without saving */ } },
  reset() { state = FRESH(); this.write(); },
  firstRun() { return !state.seenCoach && !Object.keys(state.kills).length; },
};
