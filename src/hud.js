// In-mission HUD. Five things, bolted down. Writes to the DOM only when a value actually changes.
import * as THREE from '../vendor/three.module.min.js';
import { GADGETS } from './config.js';

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
    $('storm-name').textContent = m.def.name; $('storm-ef').textContent = 'EF' + m.ef; $('town-name').textContent = m.town.name;
    const pips = $('band-pips'); pips.textContent = ''; this.pips = m.storm.bands.map(() => { const i = document.createElement('i'); pips.appendChild(i); return i; });
    $('gadget-label').textContent = GADGETS.find((g) => g.id === m.gadget).name.replace('Ground ', '');
  }

  update(dt, m, camera, touch) {
    const r = m.rig, s = m.storm;
    this.flashV = Math.max(0, this.flashV - dt * 3.5); this.set('flash', Math.round(this.flashV * 20), (v) => { this.flashEl.style.opacity = v / 20; });
    this.set('touch', touch, (v) => document.body.classList.toggle('touch', v));
    const hull = Math.ceil(r.hull / r.hullMax * 12);
    this.set('hull', hull, (v) => { this.hullSegs.forEach((e, i) => e.classList.toggle('off', i >= v)); $('hud-hull').classList.toggle('low', v <= 3); });
    this.set('hit', r.immune > 0.2, (v) => $('hud-hull').classList.toggle('hit', v));
    this.set('data', Math.round(m.dataShown), (v) => { $('hud-data').textContent = v; });
    const pipState = s.bands.map((b) => (b.gone ? 'gone' : !b.exposed ? '' : b.strain > 0.01 ? 'strain' : 'exposed')).join(',');
    this.set('pips', pipState, (v) => v.split(',').forEach((c, i) => { this.pips[i].className = c; }));
    const eta = Math.max(0, Math.min(1, (m.townDist - 75) / (m.startDist - 75)));
    this.set('eta', Math.round(eta * 100), (v) => { $('eta-fill').style.transform = `scaleX(${v / 100})`; $('eta-fill').parentElement.parentElement.classList.toggle('late', v < 25); });
    // action button
    const a = m.actionState();
    this.set('alabel', a.label, (v) => { $('action-label').textContent = v; });
    this.set('ahint', a.hint || '', (v) => { $('action-hint').textContent = v; });
    this.set('aready', (a.ready ? 1 : 0) + (a.danger ? 2 : 0), (v) => { const b = $('btn-action'); b.classList.toggle('ready', v === 1); b.classList.toggle('danger', v >= 2); if (v) this.onReady && this.onReady(); });
    this.set('boost', Math.round(r.boostCharge * 20), (v) => { $('boost-fill').style.transform = `scaleY(${1 - v / 20})`; $('btn-boost').classList.toggle('charged', v >= 20); });
    const gcd = m.gadget === 'thumper' ? 14 : 16, gk = Math.round(Math.min(1, m.gadgetCd / gcd) * 20), usable = m.gadgetCd <= 0 && (m.gadget !== 'anchor' || (m.phase === 'tethered' && m.line && !m.anchor));
    this.set('gadget', gk, (v) => { $('gadget-fill').style.transform = `scaleY(${v / 20})`; });
    this.set('gready', usable, (v) => $('btn-gadget').classList.toggle('charged', v));
    // strain gauge
    const teth = m.phase === 'tethered' && s.band;
    this.set('gauge', !!teth, (v) => { $('hud-gauge').hidden = !v; $('hud-eta').hidden = v; });
    if (teth) {
      this.set('strain', Math.round(s.band.strain * 100), (v) => { $('strain-pct').textContent = v + '%'; $('strain-fill').style.transform = `scaleX(${v / 100})`; });
      const tau = m.tension === null ? 0.55 : m.tension, pos = tau < 0 ? 30 + Math.max(-1, tau) * 30 : tau <= 1 ? 30 + tau * 50 : 80 + Math.min(1, (tau - 1) * 2) * 20;
      this.set('needle', Math.round(pos), (v) => { $('tension-needle').style.left = v + '%'; });
      this.set('xfire', m.crossfire, (v) => { $('xfire').hidden = !v; });
    }
    const line = m.coachLine(), tone = /SLACK|TIGHT|WRONG|RUNNING/.test(line) ? 'bad' : /WINDING|PROBE IT|HARPOON|DRIVE|CROSSFIRE/.test(line) ? 'good' : '';
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
      const W = window.innerWidth, H = window.innerHeight; $('storm-arrow').style.transform = `translate(${(x * 0.5 + 0.5) * W - 15}px, ${(-y * 0.5 + 0.5) * H - 15}px) rotate(${Math.atan2(x, y)}rad)`;
    }
  }
}
