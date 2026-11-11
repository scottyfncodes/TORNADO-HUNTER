// Progress in localStorage. One currency (data), kill-based unlocks, a loadout, settings.
const KEY = 'tornado-hunter/v1';

const FRESH = () => ({
  data: 0, bands: 0, kills: {}, best: {},
  owned: { mule: true, anchor: true },
  upgrades: { winch: 0, cable: 0, plating: 0, turbo: 0 },
  loadout: { rig: 'mule', crew: ['doc', 'winch'], gadget: 'anchor', storm: 'pete' },
  settings: { mute: false, calm: false },
  seenCoach: false,
});

let state = FRESH();
let storage = null;
try { storage = window.localStorage; storage.getItem(KEY); } catch { storage = null; }

function merge(base, extra) {
  for (const k in extra) {
    if (extra[k] && typeof extra[k] === 'object' && !Array.isArray(extra[k]) && base[k] && typeof base[k] === 'object') merge(base[k], extra[k]);
    else base[k] = extra[k];
  }
  return base;
}

export const save = {
  get s() { return state; },
  load() {
    if (!storage) return state;
    try { const raw = storage.getItem(KEY); if (raw) state = merge(FRESH(), JSON.parse(raw)); } catch { state = FRESH(); }
    return state;
  },
  write() { if (!storage) return; try { storage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode or full: play on without saving */ } },
  reset() { state = FRESH(); this.write(); },
  firstRun() { return !state.seenCoach && !Object.keys(state.kills).length; },
};
