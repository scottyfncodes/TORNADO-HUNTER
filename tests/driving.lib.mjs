// Handling measurements for the rig, shared by the probe and the test. No browser: Rig runs on a flat stub world.
import { Rig } from '../src/rig.js';
import { FEEL, RIGS } from '../src/config.js';

const DT = 1 / 60;
export function flatWorld(surface = 2) { return { heightAt: () => 0, normalAt: (x, z, o) => o.set(0, 1, 0), surfaceAt: () => surface }; }
const scene = { add() {}, remove() {} };
export function rig(def = RIGS[0], surface = 2, speed) {
  const w = flatWorld(surface), r = new Rig(scene, def, null, { hull: 1, boost: 1, recharge: 1, glow: null });
  r.place(0, 0, 0, w); r.surface = surface; const v = speed ?? r.topSpeed; r.vx = 0; r.vz = v; r.speed = v; return { r, w };
}
const run = (r, w, secs, axes) => { for (let t = 0; t < secs; t += DT) r.update(DT, typeof axes === 'function' ? axes(t) : axes, w, 0, 0); };
const vAng = (r) => Math.atan2(r.vx, r.vz), sp = (r) => Math.hypot(r.vx, r.vz);
const slipDeg = (r) => { const d = r.heading - vAng(r); return Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) * 57.3; };

export function measure(def = RIGS[0]) {
  const M = {};
  // full lock for one second at top road speed: how far the direction of travel turns, and what it costs
  { const { r, w } = rig(def); const v0 = sp(r); run(r, w, 1, { steer: 1, throttle: 1 }); M.steerTurnDeg = Math.abs(vAng(r)) * 57.3; M.steerKeep = sp(r) / v0; }
  // the same second as a drift (brake + full lock)
  { const { r, w } = rig(def); const v0 = sp(r); let enter = null, maxSlip = 0;
    run(r, w, 1, (t) => { const s = slipDeg(r); maxSlip = Math.max(maxSlip, s); if (enter === null && s > 8) enter = t; return { steer: 1, throttle: -1 }; });
    M.driftTurnDeg = Math.abs(vAng(r)) * 57.3; M.driftKeep = sp(r) / v0; M.driftEnterS = enter; M.driftMaxSlipDeg = maxSlip;
    // let go and get back on the throttle, wheel straight: how long until it is pointing where it is going
    let out = null; run(r, w, 2, (t) => { if (out === null && slipDeg(r) < 4) out = t; return { steer: 0, throttle: 1 }; }); M.driftExitS = out; M.driftExitKeep = sp(r) / v0; }
  // a half-lock correction at speed: the small steer a thumb makes all the time. Should be gentle, not twitchy
  { const { r, w } = rig(def); run(r, w, 0.25, { steer: 0.3, throttle: 1 }); M.nudgeDeg = Math.abs(vAng(r)) * 57.3; }
  // a 90-degree corner at top speed: grip steering vs a drift, metres of road needed (the radius of the line)
  for (const mode of ['steer', 'drift']) {
    const { r, w } = rig(def); let t = 0; const v0 = sp(r);
    while (Math.abs(vAng(r)) < Math.PI / 2 && t < 4) { r.update(DT, mode === 'steer' ? { steer: 1, throttle: 1 } : { steer: 1, throttle: -1 }, w, 0, 0); t += DT; }
    M[mode + '90S'] = t; M[mode + '90Width'] = Math.abs(r.x); M[mode + '90Keep'] = sp(r) / v0;
  }
  // smashing through things at top speed (collideRig's drag), and how long until you are back to top speed
  for (const [name, drag] of [['fence', Math.max(FEEL.smashSoft, 0.94)], ['bale', Math.max(FEEL.smashSoft, 0.86)], ['tree', FEEL.smashTree]]) {
    const { r, w } = rig(def); const top = r.topSpeed; r.vx *= drag; r.vz *= drag; r.speed *= drag; let t = 0;
    while (sp(r) < top * 0.99 && t < 6) { r.update(DT, { steer: 0, throttle: 1 }, w, 0, 0); t += DT; }
    // time lost against carrying on at top speed: distance short after the recovery, over top speed
    M[name + 'LossS'] = Math.max(0, (top * t - Math.abs(r.z)) / top); M[name + 'RecoverS'] = t;
  }
  M.fovAtTop = FEEL.camFov + FEEL.camFovSpeed; M.fovAtField = FEEL.camFov + FEEL.camFovSpeed * FEEL.rigTopSpeedField / FEEL.rigTopSpeedRoad;
  return M;
}
