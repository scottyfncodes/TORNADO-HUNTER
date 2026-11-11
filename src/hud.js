// In-mission HUD: hull and speed on the left, the storm in the middle, three buttons under the right thumb.
// Writes to the DOM only when a value actually changes.
import * as THREE from '../vendor/three.module.min.js';

const $ = (id) => document.getElementById(id);
const _v = new THREE.Vector3();

export class Hud {
  constructor() {
    this.el = $('hud'); this.last = {}; this.hullSegs = [];
    const segs = $('hull-segs'); for (let i = 0; i < 12; i++) { const s = document.createElement('i'); segs.appendChild(s); this.hullSegs.push(s); }
    this.flashEl = $('flash'); this.flashV = 0;
  }
  set(key, val, fn) { if (this.last[key] !== val) { this.last[key] = val; fn(val); } }
  deny(id) { const b = $(id); b.classList.remove('deny'); void b.offsetWidth; b.classList.add('deny'); }
  show(on) { this.el.hidden = !on; if (!on) this.last = {}; }
  flash(strength, color) { this.flashV = Math.max(this.flashV, strength * 0.7); this.flashEl.style.background = color || '#ffffff'; }

  begin(m) {
    this.last = {};
    $('storm-name').textContent = m.def.name; $('storm-ef').textContent = 'EF' + m.ef;
    const pips = $('band-pips'); pips.textContent = ''; this.pips = m.storm.bands.map(() => { const i = document.createElement('i'); pips.appendChild(i); return i; });
  }

  update(dt, m, camera, touch) {
    const r = m.rig, s = m.storm;
    this.flashV = Math.max(0, this.flashV - dt * 3.5); this.set('flash', Math.round(this.flashV * 20), (v) => { this.flashEl.style.opacity = v / 20; });
    this.set('touch', touch, (v) => document.body.classList.toggle('touch', v));
    const hull = Math.ceil(r.hull / r.hullMax * 12);
    this.set('hull', hull, (v) => { this.hullSegs.forEach((e, i) => e.classList.toggle('off', i >= v)); $('hud-hull').classList.toggle('low', v <= 3); });
    this.set('hit', r.immune > 0.2, (v) => $('hud-hull').classList.toggle('hit', v));
    this.set('data', Math.round(m.dataShown), (v) => { $('hud-data').textContent = v; });
    this.set('mph', Math.round(r.mph / 2) * 2, (v) => { $('rig-mph').textContent = v; });
    this.set('boosting', r.boostT > 0, (v) => $('hud-speed').classList.toggle('boost', v));
    this.set('smph', Math.round(m.stormMph / 5) * 5, (v) => { $('storm-mph').textContent = v; });
    this.set('pips', s.bands.map((b) => (b.gone ? 'gone' : '')).join(','), (v) => v.split(',').forEach((c, i) => { this.pips[i].className = c; }));
    // one bar: the storm's strength while the guns work on it, then the window for whichever step comes next
    const ph = m.phase, mode = ph === 'kill' || ph === 'dorothy' ? 'stagger' : ph === 'stagger' || ph === 'rip' ? 'open' : '';
    this.set('mode', mode, (v) => { const e = $('hud-storm'); e.classList.toggle('open', v === 'open'); e.classList.toggle('stagger', v === 'stagger'); });
    this.set('stabLabel', ph === 'kill' ? 'Critical' : ph === 'dorothy' ? 'Dorothy' : ph === 'rip' ? 'Hooked' : ph === 'stagger' ? 'Weakened' : 'Strength', (v) => { $('stab-label').textContent = v; });
    const fill = ph === 'kill' ? m.killT / m.p.kill : ph === 'dorothy' ? 1 - m.phaseT / 3.4 : ph === 'rip' ? m.hookT / m.p.hook : ph === 'stagger' ? m.staggerT / m.p.stagger : m.shield;
    this.set('stab', Math.round(Math.max(0, Math.min(1, fill)) * 100), (v) => { $('stab-fill').style.transform = `scaleX(${v / 100})`; });
    this.set('zone', ph === 'chase' && m.inZone, (v) => $('hud-storm').classList.toggle('inzone', v));
    // two buttons: BOOST, and one that is always the next thing to do
    const a = m.actionState();
    this.set('alabel', a.label, (v) => { $('action-label').textContent = v; });
    this.set('ahint', a.hint || '', (v) => { $('action-hint').textContent = v; });
    this.set('aready', (a.ready ? 1 : 0) + (a.ready && a.danger ? 2 : 0) + (a.hot ? 4 : 0), (v) => { const b = $('btn-action'); b.classList.toggle('ready', (v & 3) === 1); b.classList.toggle('danger', (v & 3) === 3); b.classList.toggle('hot', v >= 4); if ((v & 3) === 3) this.onReady && this.onReady(); });
    this.set('afill', Math.round(a.fill * 20), (v) => { $('action-fill').style.transform = `scaleY(${v / 20})`; });
    this.set('boost', Math.round(r.boostCharge * 20), (v) => { $('boost-fill').style.transform = `scaleY(${1 - v / 20})`; $('btn-boost').classList.toggle('ready', v >= 20); });
    this.set('cine', !!m.cine, (v) => this.el.classList.toggle('cine', v));
    const line = m.coachLine(), tone = /CATCH|CLOSER|OUTRUN|GET INSIDE/.test(line) ? 'bad' : /FIRE|HARPOON IT|KILL|BOOST|BURST|SEND/.test(line) ? 'good' : '';
    this.set('coach', line, (v) => { $('hud-coach').textContent = v; }); this.set('coachTone', tone, (v) => { $('hud-coach').className = 'coach ' + v; });
    const call = m.calloutT > 0 && m.callout ? m.callout : null;
    this.set('callout', call ? call.text + call.tone : '', () => { const e = $('hud-callout'); e.hidden = !call; if (call) { e.textContent = call.text; e.className = 'callout ' + call.tone; } });
    const bark = m.barkT > 0 && m.bark ? m.bark : null;
    this.set('bark', bark ? bark.text : '', () => { $('hud-bark').hidden = !bark; if (bark) { $('bark-name').textContent = bark.name; $('bark-text').textContent = bark.text; } });
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
}
