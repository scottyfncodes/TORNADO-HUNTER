// In-mission HUD: hull and speed on the left, the storm in the middle, the pad under the right thumb.
// At the wheel the pad is BOOST and one action button. On the gun it is FIRE, a weapon swap and DRIVE, and the
// centre of the screen gets the sights: a reticle per weapon, a hit marker, and the health of whatever you are hitting.
// Writes to the DOM only when a value actually changes.
import * as THREE from '../vendor/three.module.min.js';
import { FEEL } from './config.js';

const $ = (id) => document.getElementById(id);
const _v = new THREE.Vector3();
const overlap = (a, b) => { const A = a.getBoundingClientRect(), B = b.getBoundingClientRect(); return A.left < B.right && B.left < A.right && A.top < B.bottom && B.top < A.bottom; };
// hit markers: a tick for a hit, a wider amber one for a critical, a green burst when it comes apart, grey when it did nothing
const SEAT = { harpoon: 'Winch · harpoon truck', rocket: 'Sparks · rocket truck' };
const MARK = { hit: [1.0, 0.82, 130], crit: [1.5, 1.0, 190], kill: [1.95, 1.2, 320], weak: [0.8, 0.7, 110], far: [0.8, 0.7, 110] };

export class Hud {
  constructor() {
    this.el = $('hud'); this.last = {}; this.hullSegs = [];
    const segs = $('hull-segs'); for (let i = 0; i < 12; i++) { const s = document.createElement('i'); segs.appendChild(s); this.hullSegs.push(s); }
    this.flashEl = $('flash'); this.flashV = 0; this.calm = false;
    this.ret = $('reticle'); this.hm = $('hitmark'); this.hmAt = 0; this.targetT = 0; this.clock = 0;
    this.marks = []; const mk = $('marks'); for (let i = 0; i < 5; i++) { const e = document.createElement('i'); e.hidden = true; mk.appendChild(e); this.marks.push({ e, on: false, cls: '' }); }
  }
  set(key, val, fn) { if (this.last[key] !== val) { this.last[key] = val; fn(val); } }
  deny(id) { const b = $(id); if (!b) return; b.classList.remove('deny'); void b.offsetWidth; b.classList.add('deny'); }
  show(on) { this.el.hidden = !on; if (!on) { this.last = {}; this.ret.hidden = true; } }
  flash(strength, color) { this.flashV = Math.max(this.flashV, strength * 0.7); this.flashEl.style.background = color || '#ffffff'; }

  // a shot landed: kind is hit, crit, kill, weak (it barely marked it) or far (out of range)
  hit(kind) {
    const m = MARK[kind] || MARK.hit; if (kind !== 'kill' && kind !== 'crit' && this.clock - this.hmAt < 0.05) return; this.hmAt = this.clock;
    this.set('hmk', kind, (v) => { this.hm.setAttribute('class', 'hitmark ' + v); });
    if (this.hm.animate) this.hm.animate(this.calm ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: `scale(${m[0]})` }, { opacity: 1, transform: `scale(${m[1]})`, offset: 0.35 }, { opacity: 0, transform: `scale(${m[1]})` }], { duration: m[2], easing: 'ease-out' });
  }
  // the thing under the sights: its name and how much of it is left. what: haz, sat or band.
  target(label, frac, what) {
    this.targetT = frac <= 0 ? 0.7 : 1.3; const f = Math.max(0, Math.min(1, frac));
    this.set('tOn', true, () => { $('ret-info').hidden = false; });
    this.set('tLabel', frac <= 0 ? (what === 'band' ? 'BAND BROKEN' : label.includes('DESTROYED') ? label : label + ' DESTROYED') : label, (v) => { $('ret-label').textContent = v; });
    this.set('tFill', Math.round(f * 40), (v) => { $('ret-fill').style.transform = `scaleX(${v / 40})`; });
    this.set('tTone', frac <= 0 ? 'dead' : f < 0.34 ? 'low' : f < 0.67 ? 'mid' : '', (v) => { $('ret-info').className = 'ret-info ' + v; });
  }

  begin(m) {
    this.last = {}; this.targetT = 0; $('ret-info').hidden = true; $('ret-note').hidden = true; this.ret.hidden = true; for (const k of this.marks) { k.on = false; k.e.hidden = true; }
    $('storm-name').textContent = m.def.name; $('storm-ef').textContent = 'EF' + m.ef;
    const pips = $('band-pips'); pips.textContent = ''; this.pips = m.storm.bands.map(() => { const i = document.createElement('i'); pips.appendChild(i); return i; });
  }

  update(dt, m, camera, touch, calm) {
    const r = m.rig, s = m.storm; this.clock += dt; this.calm = !!calm;
    this.flashV = Math.max(0, this.flashV - dt * 3.5); this.set('flash', Math.round(this.flashV * 20), (v) => { this.flashEl.style.opacity = v / 20; });
    this.set('touch', touch, (v) => document.body.classList.toggle('touch', v));
    const hull = Math.ceil(r.hull / r.hullMax * 12);
    this.set('hull', hull, (v) => { this.hullSegs.forEach((e, i) => e.classList.toggle('off', i >= v)); $('hud-hull').classList.toggle('low', v <= 3); });
    this.set('hit', r.immune > 0.2, (v) => $('hud-hull').classList.toggle('hit', v));
    this.set('data', Math.round(m.dataShown), (v) => { $('hud-data').textContent = v; });
    this.set('mph', Math.round(r.mph / 2) * 2, (v) => { $('rig-mph').textContent = v; });
    this.set('boosting', r.boostT > 0, (v) => $('hud-speed').classList.toggle('boost', v));
    this.set('smph', Math.round(m.stormMph / 5) * 5, (v) => { $('storm-mph').textContent = v; }); // ground speed: on the line, the anchor's creep
    this.set('lunge', !!(m.tether && m.tether.dangerous), (v) => $('hud-storm').classList.toggle('lunge', v)); // and the lunges on top of it
    this.set('pips', s.bands.map((b) => (b.gone ? 'gone' : '')).join(','), (v) => v.split(',').forEach((c, i) => { this.pips[i].className = c; }));
    // one bar: the storm's strength while the guns work on it, then the window for whichever step comes next
    const ph = m.phase, mode = ph === 'kill' || ph === 'dorothy' ? 'stagger' : ph === 'stagger' || ph === 'rip' ? 'open' : '';
    this.set('mode', mode, (v) => { const e = $('hud-storm'); e.classList.toggle('open', v === 'open'); e.classList.toggle('stagger', v === 'stagger'); });
    this.set('stabLabel', ph === 'kill' ? 'Critical' : ph === 'dorothy' ? 'Dorothy' : ph === 'rip' ? 'Hooked' : ph === 'stagger' ? 'Weakened' : 'Strength', (v) => { $('stab-label').textContent = v; });
    const fill = ph === 'kill' ? m.killT / m.p.kill : ph === 'dorothy' ? 1 - m.phaseT / FEEL.dorothySeconds : ph === 'rip' ? m.hookT / m.p.hook : ph === 'stagger' ? m.staggerT / m.p.stagger : m.shield;
    this.set('stab', Math.round(Math.max(0, Math.min(1, fill)) * 100), (v) => { $('stab-fill').style.transform = `scaleX(${v / 100})`; });
    this.set('stabHit', ph === 'chase' && s.hit > 0.3, (v) => $('stab-bar').classList.toggle('hit', v));
    this.set('zone', ph === 'chase' && m.inZone, (v) => $('hud-storm').classList.toggle('inzone', v));
    const gun = m.view === 'gun' && !m.cine, g = m.gn;
    if (!gun) { // at the wheel: BOOST, and one button that is always the next thing to do
      const a = m.actionState();
      this.set('alabel', a.label, (v) => { $('action-label').textContent = v; });
      this.set('ahint', a.hint || '', (v) => { $('action-hint').textContent = v; });
      this.set('aready', (a.ready ? 1 : 0) + (a.ready && a.danger ? 2 : 0) + (a.hot ? 4 : 0), (v) => { const b = $('btn-action'); b.classList.toggle('ready', (v & 3) === 1); b.classList.toggle('danger', (v & 3) === 3); b.classList.toggle('hot', v >= 4); if ((v & 3) === 3) this.onReady && this.onReady(); });
      this.set('afill', Math.round(a.fill * 20), (v) => { $('action-fill').style.transform = `scaleY(${v / 20})`; });
      this.set('boost', Math.round(r.boostCharge * 20), (v) => { $('boost-fill').style.transform = `scaleY(${1 - v / 20})`; $('btn-boost').classList.toggle('ready', v >= 20); });
    }
    this.set('cine', !!m.cine, (v) => this.el.classList.toggle('cine', v));
    this.set('gun', gun, (v) => { this.ret.hidden = !v; $('hud-speed').classList.toggle('auto', v); this.last.seat = null; $('rig-mph').hidden = false; $('mph-lbl').textContent = v ? 'mph · auto' : 'mph'; if (!v) { for (const k of this.marks) { k.on = false; k.e.hidden = true; } this.targetT = 0; } });
    this.set('bus', !gun && !!m.home, (v) => { if (!gun) $('mph-lbl').textContent = v ? 'mph · Doc\'s bus' : 'mph'; }); // at the wheel of someone else's vehicle
    if (gun) this.gunner(dt, m, g, camera);
    // green: why the game just changed your seat (and how to get the wheel back). Magenta: you are losing it. Amber: do this
    const line = m.coachLine(), n = m.seatNote, tone = n && (line === n.text || line === n.shown) ? 'seat' : /SKIP$/.test(line) ? '' : /CATCH|CLOSER|OUTRUN|GET INSIDE|ARMOUR/.test(line) ? 'bad' : /FIRE|GLOW|KILL|BOOST|TAP GUNS|DEPLOY|ITS FOOT|SEAM|LOCK/.test(line) ? 'good' : '';
    this.set('coach', line, (v) => { $('hud-coach').textContent = v; }); this.set('coachTone', tone, (v) => { $('hud-coach').className = 'coach ' + v; });
    const call = m.calloutT > 0 && m.callout ? m.callout : null;
    this.set('callout', call ? call.text + call.tone : '', () => { const e = $('hud-callout'); e.hidden = !call; if (call) { e.textContent = call.text; e.className = 'callout ' + call.tone; } this.last.clash = null; });
    const bark = m.barkT > 0 && m.bark ? m.bark : null;
    this.set('bark', bark ? bark.text : '', () => { $('hud-bark').hidden = !bark; if (bark) { $('bark-name').textContent = bark.name; $('bark-text').textContent = bark.text; } this.last.clash = null; });
    // a callout outranks the crew's chatter: where the two would overlap (it depends on the screen and the words), the bark steps aside
    this.set('clash', !!(call && bark) && overlap($('hud-callout'), $('hud-bark')), (v) => $('hud-bark').classList.toggle('aside', v));
    // an arrow on the screen edge when the storm is out of frame
    _v.set(s.x, s.groundY + 40, s.z).project(camera);
    const off = _v.z > 1 || Math.abs(_v.x) > 1.02 || Math.abs(_v.y) > 1.2;
    this.set('arrowOn', off && s.alive, (v) => { $('storm-arrow').hidden = !v; });
    if (off && s.alive) {
      let x = _v.x, y = _v.y; if (_v.z > 1) { x = -x; y = -y; } const k = 1 / Math.max(Math.abs(x), Math.abs(y), 0.001); x *= k * 0.86; y *= k * 0.7;
      const W = window.innerWidth, H = window.innerHeight, py = Math.max(H * 0.36, Math.min(H * 0.78, (-y * 0.5 + 0.5) * H)); // keep it off the plates and the pad
      $('storm-arrow').style.transform = `translate(${(x * 0.5 + 0.5) * W - 15}px, ${py - 15}px) rotate(${Math.atan2(x, y)}rad)`;
    }
  }

  // ---- the sights ----
  gunner(dt, m, g, camera) {
    const kill = m.phase !== 'chase', w = g.weapon, rk = w !== 'mg', locks = w === 'rocket' || w === 'harpoon', a = g.aim, W = window.innerWidth, H = window.innerHeight; // kill: any finale seat, where the pad is one button
    this.set('wpn', rk, (v) => { this.ret.classList.toggle('rk', v); });
    // whose seat: your own speed while the truck drives itself, or the crew member and the vehicle you are sitting on
    this.set('seat', SEAT[g.seatId] || '', (v) => { $('rig-mph').hidden = !!v; $('mph-lbl').textContent = v || 'mph · auto'; });
    // reticle: cream at rest, amber on something you can hurt, magenta on the seam (or a lock), dim when out of range
    const reach = a.kind === 'haz' || a.kind === 'sat' || a.kind === 'core' || (a.kind === 'band' && m.inZone);
    this.set('aim', !a.kind ? '' : !reach ? 'far' : g.locked || (a.crit && !rk) ? 'hot' : 'on', (v) => { this.ret.classList.toggle('on', v === 'on'); this.ret.classList.toggle('hot', v === 'hot'); this.ret.classList.toggle('far', v === 'far'); });
    this.set('lock', locks ? Math.round(Math.min(1, g.lockT / FEEL.rocketLockSeconds) * 12) : 0, (v) => { this.ret.style.setProperty('--lock', v / 12); });
    const note = g.noteT > 0 ? g.note : g.locked ? 'LOCKED' : locks && g.lock ? 'LOCKING' : '';
    this.set('note', note, (v) => { const e = $('ret-note'); e.hidden = !v; e.textContent = v; e.classList.toggle('hot', v === 'LOCKED'); });
    if (this.targetT > 0) { this.targetT -= dt; if (this.targetT <= 0) this.set('tOn', false, () => { $('ret-info').hidden = true; }); }
    // the pad
    this.set('fLabel', w === 'harpoon' ? 'Harpoon' : kill ? 'Kill shot' : 'Fire', (v) => { $('fire-label').textContent = v; });
    this.set('fHint', kill ? (m.phase === 'dorothy' ? 'AWAY' : `${Math.ceil(m.phase === 'stagger' ? m.staggerT : m.killT)} s`) : rk ? `ROCKET ${g.rockets}/${g.rocketMax}` : m.gun.name.toUpperCase(), (v) => { $('fire-hint').textContent = v; });
    this.set('fState', kill ? (g.locked ? 3 : 2) : rk ? (g.locked ? 3 : g.rockets > 0 && g.reload <= 0 ? 1 : 0) : 1, (v) => { const b = $('btn-fire'); b.classList.toggle('ready', v === 1 || v === 2); b.classList.toggle('danger', v === 3); if (v === 3 && kill) this.onReady && this.onReady(); });
    this.set('sLabel', rk ? 'Gun' : 'Rockets', (v) => { $('swap-label').textContent = v; });
    this.set('sHint', kill ? '' : rk ? '' : `${g.rockets} LEFT`, (v) => { $('swap-hint').textContent = v; });
    this.set('sOff', !kill && !rk && g.rockets <= 0, (v) => { $('btn-swap').classList.toggle('off', v); });
    this.set('solo', kill, (v) => { $('btn-swap').classList.toggle('gone', v); $('btn-drive').classList.toggle('gone', v); }); // the kill shot is one button
    // what is coming at the truck: a bracket on each piece in the air, an arrow at the edge when it is out of frame
    let n = 0;
    for (const z of m.hz) {
      if (n >= this.marks.length) break; if (!z || z.state !== 'fly') continue; const h = z.h, k = this.marks[n++], left = h.dur - h.t;
      _v.set(h.x, h.y, h.z).project(camera); let x = _v.x, y = _v.y; const behind = _v.z > 1, off = behind || Math.abs(x) > 0.94 || y > 0.56 || y < -0.8; // off the picture, or under the plates along the top
      if (!off && Math.abs(x) * W < 84 && Math.abs(y) * H < 84) { n--; continue; } // the reticle is already on it
      if (off) { if (behind) { x = -x; y = -y; } const s = 1 / Math.max(Math.abs(x) / 0.9, y > 0 ? y / 0.56 : -y / 0.72, 0.001); x *= s; y *= s; }
      const cls = (z.big ? 'big ' : '') + (left < 0.8 ? 'urgent ' : '') + (off ? 'off' : '');
      if (!k.on) { k.on = true; k.e.hidden = false; } if (k.cls !== cls) { k.cls = cls; k.e.className = cls; }
      k.e.style.transform = `translate(${Math.round((x * 0.5 + 0.5) * W)}px, ${Math.round((-y * 0.5 + 0.5) * H)}px)` + (off ? ` rotate(${Math.atan2(x, y).toFixed(2)}rad)` : '');
    }
    for (; n < this.marks.length; n++) { const k = this.marks[n]; if (k.on) { k.on = false; k.e.hidden = true; } }
  }
}
