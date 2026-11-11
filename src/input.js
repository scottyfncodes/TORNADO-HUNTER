// Touch and keyboard, in two modes. Read every frame; presses are latched so none is dropped.
//   drive: floating stick on the left half, BOOST and one action button under the right thumb
//   gun:   drag anywhere to aim (the FIRE button aims too, so one thumb can track and shoot), hold FIRE
// Switching modes drops every held finger and key: nothing carries over as a shot or a swerve.
import { FEEL } from './config.js';

const keys = new Set();
const pressed = { action: 0, boost: 0, mode: 0, swap: 0, pause: 0 }; // time of the last unconsumed press
let stickId = null, stickOrigin = { x: 0, y: 0 }, stick = { x: 0, y: 0, active: false };
let now = 0, touchSeen = false, els = null, enabled = false, mode = 'drive', modeAt = 0;
const STICK_R = 56, GUARD = FEEL.gunGuard;
const aim = { dx: 0, dy: 0, ptrs: new Map() }; // pixels dragged since the last read
const fire = { ptrs: new Set(), mouse: false, key: false, stale: new Set() };
const guarded = () => now - modeAt < GUARD;

function latch(name) { pressed[name] = now || 0.0001; }

function onKey(e, down) {
  const k = e.code;
  if (down && !e.repeat) {
    if (k === 'Space' || k === 'Enter') { if (mode === 'gun') { if (!guarded()) fire.key = true; } else latch('action'); }
    if (k === 'ShiftLeft' || k === 'ShiftRight') latch('boost');
    if (k === 'KeyF' || k === 'KeyE') latch('mode');
    if (k === 'KeyQ' || k === 'Tab') latch('swap');
    if (k === 'Escape' || k === 'KeyP') latch('pause');
  }
  if (!down) { if (k === 'Space' || k === 'Enter') fire.key = false; fire.stale.delete(k); }
  if (down) keys.add(k); else keys.delete(k);
  if (enabled && ['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
}

function placeStick(x, y) {
  if (!els) return;
  els.base.style.transform = `translate(${stickOrigin.x - 64}px, ${stickOrigin.y - 64}px)`;
  els.nub.style.transform = `translate(${x - 28}px, ${y - 28}px)`;
}

function stickDown(e) {
  if (!enabled || mode !== 'drive' || stickId !== null) return;
  touchSeen = touchSeen || e.pointerType === 'touch';
  stickId = e.pointerId; stickOrigin = { x: e.clientX, y: e.clientY };
  stick.active = true; stick.x = 0; stick.y = 0;
  els.zone.setPointerCapture?.(e.pointerId);
  els.base.classList.add('on'); els.nub.classList.add('on');
  placeStick(e.clientX, e.clientY); e.preventDefault();
}
function stickMove(e) {
  if (e.pointerId !== stickId) return;
  let dx = e.clientX - stickOrigin.x, dy = e.clientY - stickOrigin.y;
  const d = Math.hypot(dx, dy);
  if (d > STICK_R) { // the base follows the thumb so it never runs out of travel
    stickOrigin.x += dx * (1 - STICK_R / d); stickOrigin.y += dy * (1 - STICK_R / d);
    dx = e.clientX - stickOrigin.x; dy = e.clientY - stickOrigin.y;
  }
  stick.x = dx / STICK_R; stick.y = dy / STICK_R;
  placeStick(e.clientX, e.clientY); e.preventDefault();
}
function stickUp(e) {
  if (e.pointerId !== stickId) return;
  stickId = null; stick.active = false; stick.x = 0; stick.y = 0;
  if (els) { els.base.classList.remove('on'); els.nub.classList.remove('on'); }
}

// ---- aiming: every finger on the glass (or on FIRE) drags the sights; a mouse aims by moving ----
function aimDown(e) {
  if (!enabled || mode !== 'gun') return;
  touchSeen = touchSeen || e.pointerType === 'touch';
  if (e.pointerType === 'mouse') { if (e.button === 0 && !guarded()) fire.mouse = true; try { els.view.requestPointerLock?.()?.catch?.(() => {}); } catch { /* no pointer lock here: the mouse still aims */ } }
  else { aim.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); e.currentTarget.setPointerCapture?.(e.pointerId); }
  e.preventDefault();
}
function aimMove(e) {
  if (mode !== 'gun' || !enabled) return;
  if (e.pointerType === 'mouse') { if (!document.pointerLockElement) { aim.dx += e.movementX || 0; aim.dy += e.movementY || 0; } return; }
  const p = aim.ptrs.get(e.pointerId); if (!p) return;
  aim.dx += e.clientX - p.x; aim.dy += e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; e.preventDefault();
}
function aimUp(e) { aim.ptrs.delete(e.pointerId); if (e.pointerType === 'mouse') fire.mouse = false; }

function bindButton(el, name) {
  const down = (e) => { if (!enabled || guarded()) return; touchSeen = touchSeen || e.pointerType === 'touch'; latch(name); el.classList.add('down'); e.preventDefault(); e.stopPropagation(); };
  const up = () => el.classList.remove('down');
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
}
// FIRE is held, not tapped, and the thumb holding it can slide to aim
function bindFire(el) {
  el.addEventListener('pointerdown', (e) => {
    if (!enabled || mode !== 'gun') return; touchSeen = touchSeen || e.pointerType === 'touch';
    if (!guarded()) { fire.ptrs.add(e.pointerId); el.classList.add('down'); }
    aim.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); el.setPointerCapture?.(e.pointerId); e.preventDefault(); e.stopPropagation();
  });
  el.addEventListener('pointermove', aimMove);
  const up = (e) => { fire.ptrs.delete(e.pointerId); aim.ptrs.delete(e.pointerId); if (!fire.ptrs.size) el.classList.remove('down'); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}
function dropHeld() {
  if (stickId !== null) stickUp({ pointerId: stickId });
  aim.ptrs.clear(); aim.dx = aim.dy = 0; fire.ptrs.clear(); fire.mouse = false; fire.key = false;
  fire.stale.clear(); for (const k of keys) fire.stale.add(k); // a key held through the switch means nothing until it is pressed again
  for (const k in pressed) if (k !== 'pause') pressed[k] = 0;
  if (els) for (const b of [els.fire, els.action, els.boost, els.swap, els.drive]) b && b.classList.remove('down');
}

export const input = {
  init(dom) {
    els = dom;
    window.addEventListener('keydown', (e) => onKey(e, true));
    window.addEventListener('keyup', (e) => onKey(e, false));
    window.addEventListener('blur', () => { keys.clear(); dropHeld(); });
    dom.zone.addEventListener('pointerdown', stickDown);
    dom.zone.addEventListener('pointermove', stickMove);
    dom.zone.addEventListener('pointerup', stickUp);
    dom.zone.addEventListener('pointercancel', stickUp);
    dom.aim.addEventListener('pointerdown', aimDown);
    dom.aim.addEventListener('pointermove', aimMove);
    dom.aim.addEventListener('pointerup', aimUp);
    dom.aim.addEventListener('pointercancel', aimUp);
    // with the pointer locked the mouse reports to the document, not the glass
    document.addEventListener('mousemove', (e) => { if (document.pointerLockElement && mode === 'gun' && enabled) { aim.dx += e.movementX || 0; aim.dy += e.movementY || 0; } });
    document.addEventListener('mousedown', (e) => { if (document.pointerLockElement && mode === 'gun' && enabled && e.button === 0 && !guarded()) fire.mouse = true; });
    document.addEventListener('mouseup', () => { fire.mouse = false; });
    bindButton(dom.action, 'action'); bindButton(dom.boost, 'boost'); bindButton(dom.swap, 'swap'); bindButton(dom.drive, 'mode'); bindFire(dom.fire);
    // iOS: no rubber-banding, pinch or double-tap zoom on the play surface
    for (const ev of ['gesturestart', 'gesturechange', 'dblclick', 'contextmenu']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
    document.addEventListener('touchmove', (e) => { if (enabled) e.preventDefault(); }, { passive: false });
  },
  setEnabled(v) { enabled = v; if (!v) { keys.clear(); dropHeld(); if (document.pointerLockElement) document.exitPointerLock?.(); } },
  // 'drive' or 'gun'. Everything held is let go, and the new controls ignore the first third of a second.
  setMode(m) {
    if (m === mode) return; mode = m; modeAt = now; dropHeld();
    document.body.classList.toggle('gunning', m === 'gun');
    if (m !== 'gun' && document.pointerLockElement) document.exitPointerLock?.();
  },
  // same controls, a different seat: everything held is let go and the guard starts again
  reseat() { modeAt = now; dropHeld(); },
  get mode() { return mode; },
  tick(t) { now = t; for (const k in pressed) if (pressed[k] && t - pressed[k] > 0.3) pressed[k] = 0; },
  get usingTouch() { return touchSeen; },
  // steer -1..1 (left negative), throttle -1..1
  axes() {
    let steer = 0, throttle = 0; if (mode !== 'drive') return { steer, throttle };
    const k = (c) => keys.has(c) && !fire.stale.has(c);
    if (k('KeyA') || k('ArrowLeft')) steer -= 1;
    if (k('KeyD') || k('ArrowRight')) steer += 1;
    if (k('KeyW') || k('ArrowUp')) throttle += 1;
    if (k('KeyS') || k('ArrowDown')) throttle -= 1;
    if (stick.active) {
      // hold to go, slide to steer, pull back to brake: a thumb resting on the glass drives forward
      const sx = Math.abs(stick.x) < 0.12 ? 0 : stick.x;
      steer = Math.max(-1, Math.min(1, sx * 1.25));
      throttle = stick.y > 0.45 ? -Math.min(1, (stick.y - 0.45) / 0.4) : 1;
    }
    return { steer, throttle };
  },
  // pixels the sights were dragged since the last call
  aimDelta(out) { out.x = aim.dx; out.y = aim.dy; aim.dx = aim.dy = 0; return out; },
  // the keyboard turns the gun at a steady rate: -1..1 each way
  aimKeys(out) {
    const k = (c) => keys.has(c) && !fire.stale.has(c); out.x = 0; out.y = 0; if (mode !== 'gun') return out;
    if (k('KeyA') || k('ArrowLeft')) out.x -= 1; if (k('KeyD') || k('ArrowRight')) out.x += 1;
    if (k('KeyW') || k('ArrowUp')) out.y += 1; if (k('KeyS') || k('ArrowDown')) out.y -= 1;
    return out;
  },
  get firing() { return enabled && mode === 'gun' && !guarded() && (fire.ptrs.size > 0 || fire.mouse || fire.key); },
  // true once per press, remembered for `buffer` seconds so an early tap still counts
  take(name, buffer = 0.15) {
    const t = pressed[name];
    if (t && now - t <= buffer + 0.05) { pressed[name] = 0; return true; }
    if (t && now - t > buffer + 0.05) pressed[name] = 0;
    return false;
  },
  peek(name) { return !!pressed[name]; },
  clear() { for (const k in pressed) pressed[k] = 0; dropHeld(); },
};
