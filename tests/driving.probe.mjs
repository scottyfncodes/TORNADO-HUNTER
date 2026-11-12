// The truck on its own, no storm: node tests/driving.probe.mjs   (pure handling, a flat stub world, 60 Hz)
// Prints what the numbers in FEEL mean in the hand: how hard a steer and a drift turn you, what a drift keeps, how fast it
// lets go, and what a fence, a tree or a bale costs in time. tests/driving.test.mjs holds the same measurements to targets.
import { measure } from './driving.lib.mjs';
const M = measure();
for (const [k, v] of Object.entries(M)) console.log(k.padEnd(28), typeof v === 'number' ? +v.toFixed(3) : JSON.stringify(v));
