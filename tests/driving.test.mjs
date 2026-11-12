// The truck on its own, no storm (design question 1): node --test tests/
// The handling targets, measured on a flat stub world at 60 Hz. `node tests/driving.probe.mjs` prints the numbers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { measure } from './driving.lib.mjs';
import { RIGS } from '../src/config.js';

for (const def of RIGS) {
  const M = measure(def);
  test(`${def.name}: a drift is the tight way round a corner, and it keeps the speed`, () => {
    assert.ok(M.drift90Width < M.steer90Width * 0.7, `drift needs ${M.drift90Width.toFixed(1)} m against ${M.steer90Width.toFixed(1)} m steering`);
    assert.ok(M.drift90S < M.steer90S * 0.75, `drift takes ${M.drift90S.toFixed(2)} s against ${M.steer90S.toFixed(2)} s`);
    assert.ok(M.drift90Keep >= 0.88, `drift keeps ${M.drift90Keep.toFixed(2)} of its speed`);
  });
  test(`${def.name}: a drift starts at once, never spins, and lets go quickly`, () => {
    assert.ok(M.driftEnterS !== null && M.driftEnterS <= 0.15, // the Mule 0.08 s, the Whippet 0.07, the Bulldog (turns like a barn) 0.13
      `slide takes ${M.driftEnterS} s to start`);
    assert.ok(M.driftMaxSlipDeg <= 55, `nose leads by ${M.driftMaxSlipDeg.toFixed(0)} degrees`);
    assert.ok(M.driftExitS !== null && M.driftExitS <= 0.35, `straightens in ${M.driftExitS} s`);
  });
  test(`${def.name}: a thumb's small correction is gentle`, () => assert.ok(M.nudgeDeg < 6, `${M.nudgeDeg.toFixed(1)} degrees for a quarter second at 30%`));
  test(`${def.name}: a tree is felt but never stops you; a fence barely registers`, () => {
    assert.ok(M.treeLossS >= 0.06 && M.treeLossS <= 0.2, `a tree costs ${M.treeLossS.toFixed(3)} s`);
    assert.ok(M.treeRecoverS <= 1.3, `${M.treeRecoverS.toFixed(2)} s back to top speed after a tree`);
    assert.ok(M.fenceLossS < 0.02, `a fence costs ${M.fenceLossS.toFixed(3)} s`);
  });
}
