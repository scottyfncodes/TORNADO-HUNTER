// A letter for a fight, and the one thing that would have raised it. Pure: no DOM, no three.js (tests/grade.test.mjs).
// The weights and targets are GRADE in config.js. A grade is earned by destroying the storm; a wreck has none.
import { GRADE } from './config.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const LETTERS = GRADE.letters.map(([l]) => l); // best first
export const rankOf = (l) => (l ? LETTERS.indexOf(l) : 99);
export const better = (a, b) => (rankOf(a) <= rankOf(b) ? a : b);

// what a fight was, in the numbers a grade reads (from Mission.result)
export function line(res) {
  const st = res.stats;
  return {
    time: res.time, hull: res.hull, hullMax: res.hullMax,
    acc: st.rounds ? st.fired / st.rounds : 0, rounds: st.rounds, fired: st.fired,
    crits: st.crits, close: st.close,
  };
}

// each part 0..1, from the raw number
function parts(L, id) {
  const par = GRADE.par[id], g = GRADE;
  return {
    time: clamp01((par * g.timeZero - L.time) / (par * (g.timeZero - 1))),
    hull: clamp01(L.hull / L.hullMax),
    acc: clamp01((L.acc - g.accZero) / (g.accFull - g.accZero)),
    crits: clamp01(L.crits / g.crits[id]),
    close: clamp01(L.close / g.close),
  };
}
const total = (p) => Object.keys(GRADE.weights).reduce((s, k) => s + GRADE.weights[k] * p[k], 0) * 100;
const letterFor = (score) => GRADE.letters.find(([, min]) => score >= min - 1e-9)[0];

// the cheapest change that reaches the next letter, in the player's own units: "2 crits short of A". One thing if one thing
// can do it (the one that was closest); otherwise the two biggest levers together: "6 s faster and 40 more crits for A".
const UNIT = {
  time: (L, id, want) => { const par = GRADE.par[id], t = par * GRADE.timeZero - want * par * (GRADE.timeZero - 1); return [Math.max(1, Math.ceil(L.time - t)), (n) => `${n} s faster`]; },
  hull: (L, id, want) => [Math.max(1, Math.ceil(want * L.hullMax - L.hull)), (n) => `${n} more hull`],
  acc: (L, id, want) => { const a = GRADE.accZero + want * (GRADE.accFull - GRADE.accZero); return [Math.max(1, Math.ceil((a - L.acc) * 100)), (n) => `${n}% more accuracy`]; },
  crits: (L, id, want) => [Math.max(1, Math.ceil(want * GRADE.crits[id] - L.crits)), (n) => `${n} more crit${n === 1 ? '' : 's'}`],
  close: (L, id, want) => [Math.max(1, Math.ceil(want * GRADE.close - L.close)), (n) => `${n} more near miss${n === 1 ? '' : 'es'}`],
};
function nudge(L, id, score, next) {
  const need = (GRADE.letters.find(([l]) => l === next)[1] - score) / 100, p = parts(L, id), w = GRADE.weights, keys = Object.keys(w);
  // one thing alone
  // the one that asks for the smallest share of what that part still had to give: the most within reach, not the heaviest
  const effort = (k) => need / w[k] / Math.max(1e-6, 1 - p[k]), one = keys.filter((k) => p[k] + need / w[k] <= 1 + 1e-9).sort((a, b) => effort(a) - effort(b));
  if (one.length) {
    const k = one[0], [n, say] = UNIT[k](L, id, p[k] + need / w[k]);
    if (k === 'crits') return `${n} crit${n === 1 ? '' : 's'} short of ${next}`;
    if (k === 'close') return `${n} near miss${n === 1 ? '' : 'es'} short of ${next}`;
    return `${say(n)} for ${next}`;
  }
  // two together: the part with the most to give first, then whatever the second has to make up
  const room = keys.map((k) => [k, (1 - p[k]) * w[k]]).sort((a, b) => b[1] - a[1]), [k1, g1] = room[0], [k2] = room[1], rest = need - g1;
  const second = p[k2] + rest / w[k2]; if (second > 1 + 1e-9) return `Faster, cleaner and sharper for ${next}`;
  const [n1, s1] = UNIT[k1](L, id, 1), [n2, s2] = UNIT[k2](L, id, second);
  return `${s1(n1)} and ${s2(n2)} for ${next}`;
}

export function grade(res) {
  if (!res.won) return { letter: null, score: 0, hint: 'Destroy the storm to earn a grade' };
  const id = res.storm.id, L = line(res), score = total(parts(L, id)), letter = letterFor(score), i = LETTERS.indexOf(letter);
  return { letter, score: Math.round(score), line: L, hint: i === 0 ? 'Top grade: beat your time' : nudge(L, id, score, LETTERS[i - 1]) };
}
