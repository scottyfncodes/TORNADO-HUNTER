// Touch (floating stick + three buttons) and keyboard. Read every frame; presses are latched so none is dropped.
const keys = new Set();
const pressed = { action: 0, boost: 0, gadget: 0, pause: 0 }; // time of the last unconsumed press
let stickId = null, stickOrigin = { x: 0, y: 0 }, stick = { x: 0, y: 0, active: false };
let now = 0, touchSeen = false, els = null, enabled = false;
const STICK_R = 56;

function latch(name) { pressed[name] = now || 0.0001; }

function onKey(e, down) {
  const k = e.code;
  if (down && !e.repeat) {
    if (k === 'Space' || k === 'Enter') latch('action');
    if (k === 'ShiftLeft' || k === 'ShiftRight') latch('boost');
    if (k === 'KeyE' || k === 'KeyQ') latch('gadget');
    if (k === 'Escape' || k === 'KeyP') latch('pause');
  }
  if (down) keys.add(k); else keys.delete(k);
  if (enabled && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
}

function placeStick(x, y) {
  if (!els) return;
  els.base.style.transform = `translate(${stickOrigin.x - 64}px, ${stickOrigin.y - 64}px)`;
  els.nub.style.transform = `translate(${x - 28}px, ${y - 28}px)`;
}

function stickDown(e) {
  if (!enabled || stickId !== null) return;
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
  els.base.classList.remove('on'); els.nub.classList.remove('on');
}

function bindButton(el, name) {
  const down = (e) => { if (!enabled) return; touchSeen = touchSeen || e.pointerType === 'touch'; latch(name); el.classList.add('down'); e.preventDefault(); e.stopPropagation(); };
  const up = () => el.classList.remove('down');
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
}

export const input = {
  init(dom) {
    els = dom;
    window.addEventListener('keydown', (e) => onKey(e, true));
    window.addEventListener('keyup', (e) => onKey(e, false));
    window.addEventListener('blur', () => { keys.clear(); stickUp({ pointerId: stickId }); });
    dom.zone.addEventListener('pointerdown', stickDown);
    dom.zone.addEventListener('pointermove', stickMove);
    dom.zone.addEventListener('pointerup', stickUp);
    dom.zone.addEventListener('pointercancel', stickUp);
    bindButton(dom.action, 'action'); bindButton(dom.boost, 'boost'); if (dom.gadget) bindButton(dom.gadget, 'gadget');
    // iOS: no rubber-banding, pinch or double-tap zoom on the play surface
    for (const ev of ['gesturestart', 'gesturechange', 'dblclick', 'contextmenu']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
    document.addEventListener('touchmove', (e) => { if (enabled) e.preventDefault(); }, { passive: false });
  },
  setEnabled(v) { enabled = v; if (!v) { keys.clear(); if (stickId !== null) stickUp({ pointerId: stickId }); } },
  tick(t) { now = t; for (const k in pressed) if (pressed[k] && t - pressed[k] > 0.3) pressed[k] = 0; },
  get usingTouch() { return touchSeen; },
  // steer -1..1 (left negative), throttle -1..1
  axes() {
    let steer = 0, throttle = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) steer -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) steer += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) throttle += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) throttle -= 1;
    if (stick.active) {
      // hold to go, slide to steer, pull back to brake: a thumb resting on the glass drives forward
      const sx = Math.abs(stick.x) < 0.12 ? 0 : stick.x;
      steer = Math.max(-1, Math.min(1, sx * 1.25));
      throttle = stick.y > 0.45 ? -Math.min(1, (stick.y - 0.45) / 0.4) : 1;
    }
    return { steer, throttle };
  },
  // true once per press, remembered for `buffer` seconds so an early tap still counts
  take(name, buffer = 0.15) {
    const t = pressed[name];
    if (t && now - t <= buffer + 0.05) { pressed[name] = 0; return true; }
    if (t && now - t > buffer + 0.05) pressed[name] = 0;
    return false;
  },
  peek(name) { return !!pressed[name]; },
  clear() { for (const k in pressed) pressed[k] = 0; },
};
