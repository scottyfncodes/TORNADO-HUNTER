// Title, headquarters, results and pause. Plain DOM, built from the tables in config.js.
import { STORMS, RIGS, CREW, GADGETS, UPGRADES, PALETTE, rankFor } from './config.js';
import { TOWNS } from './world.js';
import { save } from './save.js';
import { dayKey, dailyFor, liveStreak, shareText, clock } from './daily.js';

const $ = (id) => document.getElementById(id);
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }

export function stormOpen(def) { const i = STORMS.indexOf(def); return i === 0 || !!save.s.kills[STORMS[i - 1].id]; }
export function nextStorm() { return STORMS.find((s) => stormOpen(s) && !save.s.kills[s.id]) || STORMS[STORMS.length - 1]; }

export class UI {
  constructor(G) {
    this.G = G; this.tab = 'storms';
    this.screens = { title: $('title'), hq: $('hq'), results: $('results'), pause: $('pause') };
    const click = (id, fn) => $(id).addEventListener('click', () => { G.audio.unlock(); G.audio.ui(); fn(); });
    click('btn-start', () => (save.firstRun() ? G.startMission(STORMS[0], { coach: true }) : this.show('hq')));
    click('btn-hq', () => this.show('hq'));
    click('btn-daily', () => G.startDaily('scored')); // spends today's scored attempt, or practice once it is spent
    $('res-share').addEventListener('click', () => { G.audio.unlock(); G.audio.ui(); this.share(); });
    click('btn-roll', () => { const def = STORMS.find((s) => s.id === save.s.loadout.storm) || STORMS[0]; G.startMission(def, { rematch: save.s.loadout.rematch && save.s.kills[def.id] ? 1 : 0, coach: !save.s.kills.pete }); });
    click('btn-pause', () => G.setPaused(true));
    click('p-resume', () => G.setPaused(false));
    click('p-restart', () => G.restart());
    click('p-quit', () => G.toHQ());
    click('p-sound', () => { save.s.settings.mute = !save.s.settings.mute; save.write(); G.audio.setMuted(save.s.settings.mute); this.syncSettings(); });
    click('p-calm', () => { save.s.settings.calm = !save.s.settings.calm; save.write(); G.fx.calm = save.s.settings.calm; this.syncSettings(); });
    for (const t of document.querySelectorAll('.tab')) t.addEventListener('click', () => { G.audio.ui(); this.tab = t.dataset.tab; this.renderHQ(); });
    this.syncSettings();
  }
  syncSettings() {
    const st = save.s.settings; $('p-sound').textContent = st.mute ? 'Sound off' : 'Sound on'; $('p-sound').setAttribute('aria-pressed', String(!st.mute));
    $('p-calm').textContent = st.calm ? 'Screen shake off' : 'Screen shake on'; $('p-calm').setAttribute('aria-pressed', String(!st.calm));
  }
  show(name) {
    for (const k in this.screens) this.screens[k].hidden = k !== name;
    if (name === 'title') { const first = save.firstRun(); $('btn-start').textContent = first ? 'Start the chase' : 'Play'; $('btn-hq').hidden = true; $('title-hint').textContent = first ? 'Hold to drive. Slide to steer. In range you take the turret: drag to aim, hold to fire.' : `${rankFor(save.s.bands)} · ${Math.round(save.s.data)} Data banked`; }
    if (name === 'title') this.renderDaily();
    if (name === 'hq') { if (!stormOpen(STORMS.find((s) => s.id === save.s.loadout.storm) || STORMS[0])) save.s.loadout.storm = 'pete'; this.renderHQ(); }
    this.G.onScreen(name);
    const focus = { title: 'btn-start', hq: 'btn-roll', results: 'res-primary', pause: 'p-resume' }[name]; if (focus && !this.G.input.usingTouch) $(focus).focus({ preventScroll: true });
  }
  hide() { for (const k in this.screens) this.screens[k].hidden = true; }

  // ---- headquarters ----
  renderHQ() {
    const s = save.s, body = $('hq-body'); body.textContent = ''; body.scrollTop = 0;
    for (const t of document.querySelectorAll('.tab')) t.setAttribute('aria-selected', String(t.dataset.tab === this.tab));
    $('hq-data').textContent = Math.round(s.data); $('hq-rank').textContent = rankFor(s.bands);
    this['tab_' + this.tab](body, s);
    const L = s.loadout, storm = STORMS.find((x) => x.id === L.storm), rig = RIGS.find((x) => x.id === L.rig), lo = $('hq-loadout'); lo.textContent = '';
    const add = (label, val) => { lo.append(label + ' '); lo.appendChild(el('b', '', val)); lo.append('  ·  '); };
    add('Storm', storm.name + (L.rematch && s.kills[storm.id] ? ' +1' : '')); add('Rig', rig.name); add('Crew', L.crew.map((c) => CREW.find((x) => x.id === c).name.split(' ')[0]).join(' + '));
    lo.lastChild && lo.removeChild(lo.lastChild);
  }
  card(title, text, opts = {}) {
    const c = el(opts.static ? 'div' : 'button', 'card' + (opts.sel ? ' sel' : '') + (opts.locked ? ' locked' : '')); if (!opts.static) { c.type = 'button'; c.setAttribute('aria-pressed', String(!!opts.sel)); if (opts.locked) c.setAttribute('aria-disabled', 'true'); }
    const meta = el('div', 'meta'); (opts.tags || []).forEach(([cls, t]) => meta.appendChild(el('span', 'tag ' + cls, t))); if (meta.children.length) c.appendChild(meta);
    c.appendChild(el('h3', '', title)); if (text) c.appendChild(el('p', '', text));
    if (opts.sel) c.appendChild(el('span', 'pick', opts.pickLabel || 'Selected'));
    if (opts.onClick && !opts.locked) c.addEventListener('click', () => { this.G.audio.ui(); opts.onClick(); save.write(); this.renderHQ(); });
    if (opts.locked && !opts.static) c.addEventListener('click', () => this.G.audio.deny());
    return c;
  }
  tab_storms(body, s) {
    const wrap = el('div', 'storm-wrap'), list = el('div', 'storm-list');
    for (const def of STORMS) {
      const open = stormOpen(def), beaten = !!s.kills[def.id], sel = s.loadout.storm === def.id;
      const tags = [['tag-ef', 'EF' + def.ef], ['', def.type], ['', Math.round(def.run * 2.237 / 5) * 5 + ' mph'], ['tag-pay', '+' + def.pay + ' data']]; if (beaten) tags.push(['tag-ok', 'Beaten ×' + s.kills[def.id]]); if (!open) tags.push(['tag-lock', 'Beat ' + STORMS[STORMS.indexOf(def) - 1].name]);
      const c = this.card(def.name, open ? `${def.blurb} ${def.habit}` : 'Not on the radar yet.', { sel, locked: !open, tags, onClick: () => { s.loadout.storm = def.id; } });
      list.appendChild(c);
      if (sel && beaten) { const r = el('button', 'rematch', s.loadout.rematch ? 'Rematch at EF' + (def.ef + 1) + ': on' : 'Rematch at EF' + (def.ef + 1) + ': off'); r.type = 'button'; r.setAttribute('aria-pressed', String(!!s.loadout.rematch)); r.addEventListener('click', () => { this.G.audio.ui(); s.loadout.rematch = !s.loadout.rematch; save.write(); this.renderHQ(); }); list.appendChild(r); }
    }
    const radar = el('div', 'radar'), cv = el('canvas'); cv.width = cv.height = 384; radar.appendChild(cv); radar.appendChild(el('span', 'lbl', 'Radar')); this.drawRadar(cv, s.loadout.storm);
    wrap.appendChild(list); wrap.appendChild(radar); body.appendChild(wrap);
  }
  drawRadar(cv, stormId) {
    const c = cv.getContext('2d'), map = this.G.world.mapCanvas, S = 384, X = (w) => (w + 1536) / 3072 * S;
    c.drawImage(map, 0, 0, S, S); c.fillStyle = 'rgba(14,27,29,0.62)'; c.fillRect(0, 0, S, S);
    c.strokeStyle = 'rgba(98,245,140,0.22)'; c.lineWidth = 1; for (let r = 48; r < 300; r += 48) { c.beginPath(); c.arc(S / 2, S / 2, r, 0, 6.283); c.stroke(); }
    const def = STORMS.find((s) => s.id === stormId), start = { pete: [808, -770], agnes: [-720, 728], sisters: [216, 720] }[stormId], sx = start[0], sz = start[1];
    for (const k in TOWNS) { const tn = TOWNS[k]; c.fillStyle = 'rgba(243,236,216,0.55)'; c.fillRect(X(tn.x) - 4, X(tn.z) - 4, 8, 8); }
    const col = [PALETTE.signal, PALETTE.primary, PALETTE.accent]; [18, 12, 6].forEach((r, i) => { c.fillStyle = col[i]; c.beginPath(); c.arc(X(sx), X(sz), r, 0, 6.283); c.fill(); });
    c.font = '700 15px "Barlow Semi Condensed", sans-serif'; c.fillStyle = PALETTE.text; c.textAlign = 'center'; c.fillText(def.name.toUpperCase(), X(sx), X(sz) - 26);
  }
  tab_rig(body, s) {
    const stat = (c, label, v) => { c.appendChild(el('span', '', label)); const b = el('div', 'bar'), i = el('i'); i.style.width = Math.round(Math.min(1, v) * 100) + '%'; b.appendChild(i); c.appendChild(b); };
    body.appendChild(el('h3', 'section-h', 'Rig'));
    const g = el('div', 'grid-3');
    for (const r of RIGS) {
      const owned = !!s.owned[r.id], blueprint = !r.needs || !!s.kills[r.needs], sel = s.loadout.rig === r.id;
      const tags = owned ? [] : blueprint ? [['tag-pay', r.price + ' data']] : [['tag-lock', 'Blueprint: beat ' + STORMS.find((x) => x.id === r.needs).name]];
      if (owned) tags.push(['', r.gun.name]);
      const c = this.card(r.name, r.blurb, { sel, static: !owned, locked: !owned && !blueprint, tags, onClick: owned ? () => { s.loadout.rig = r.id; } : null });
      const bars = el('div', 'bars'); stat(bars, 'Speed', r.speed / 1.15); stat(bars, 'Hull', r.hull / 1.6); stat(bars, 'Grip', r.turn / 1.2); stat(bars, 'Weight', 0.55 / r.resist); c.appendChild(bars);
      g.appendChild(c); if (!owned && blueprint) c.appendChild(this.buyBtn(r.price, () => { s.owned[r.id] = true; s.loadout.rig = r.id; }));
    }
    body.appendChild(g);
    body.appendChild(el('h3', 'section-h', 'Fitted to every rig'));
    const kit = el('div', 'grid-4');
    for (const [n, t] of [['Turret gun', 'Each rig mounts its own. Inside the danger zone you take it yourself while the truck drives: hit the bright seam on the band for critical damage, and shoot down what the storm throws.'], ['Rockets', 'A few in the rack, two more after every band. Hold the reticle on a target to lock. One rocket ends a car, a tractor or a satellite twister, and bites a chunk off a band.'], ['Shotgun', 'The crew fire it for you: the last-second save on whatever is about to hit, and it clears wrecks off the road.'], ['The finale, a seat each', 'When the last band is gone you swap vehicles: Winch\'s truck to harpoon the storm, Doc\'s bus to release Dorothy, Sparks\' rocket truck to lock the kill shot on the critical core.']]) kit.appendChild(this.card(n, t, { static: true }));
    body.appendChild(kit);
  }
  buyBtn(price, onBuy) {
    const s = save.s, b = el('button', 'buy', s.data >= price ? 'Build for ' + price : 'Need ' + price + ' data'); b.type = 'button'; if (s.data < price) b.setAttribute('aria-disabled', 'true');
    b.addEventListener('click', (e) => { e.stopPropagation(); if (s.data < price) { this.G.audio.deny(); return; } s.data -= price; onBuy(); save.write(); this.G.audio.ready_(); this.renderHQ(); });
    return b;
  }
  tab_crew(body, s) {
    body.appendChild(el('h3', 'section-h', 'Everyone rolls out, a vehicle each. Pick two to lead: their perks apply'));
    const g = el('div', 'grid-2');
    for (const c of CREW) {
      const sel = s.loadout.crew.includes(c.id);
      g.appendChild(this.card(c.name, c.perk, { sel, pickLabel: 'Leading', tags: [['', c.role], ['tag-pay', c.ride]], onClick: () => { if (sel) return; s.loadout.crew = [s.loadout.crew[1], c.id]; } }));
    }
    body.appendChild(g);
  }
  tab_shop(body, s) {
    body.appendChild(el('h3', 'section-h', 'Spend storm data on the rig'));
    const g = el('div', 'grid-4');
    for (const u of UPGRADES) {
      const lv = s.upgrades[u.id], max = lv >= u.prices.length, c = el('div', 'card'); c.appendChild(el('h3', '', u.name)); c.appendChild(el('p', '', u.blurb));
      const lv_ = el('div', 'levels'); for (let i = 0; i < u.prices.length; i++) lv_.appendChild(el('i', i < lv ? 'on' : '')); c.appendChild(lv_);
      if (max) c.appendChild(el('span', 'tag tag-ok', 'Maxed')); else c.appendChild(this.buyBtn(u.prices[lv], () => { s.upgrades[u.id]++; }));
      g.appendChild(c);
    }
    body.appendChild(g);
  }

  // ---- the Daily Storm on the title: today's storm, whether the scored run is spent, and the streak ----
  renderDaily() {
    const s = save.s, open = !save.firstRun() && Object.keys(s.kills).length > 0; $('title-daily').hidden = !open; $('btn-daily').hidden = !open; if (!open) return;
    const key = dayKey(), D = dailyFor(key), d = s.daily.day === key ? s.daily : { used: false, result: null }, n = liveStreak(s.streak, key);
    $('daily-storm').textContent = D.storm.name;
    $('daily-streak').textContent = n ? `${n}-day streak` : 'No streak yet';
    const r = d.result; $('daily-note').textContent = !d.used ? 'One scored run today' : !r ? 'Practice is free' : r.abandoned ? 'Scored run left early. Practice is free' : r.won ? `Today ${r.letter} in ${clock(r.time)}. Practice is free` : 'Wrecked today. Practice is free';
    $('btn-daily').setAttribute('aria-label', `Daily Storm: ${D.storm.name}. ${$('daily-note').textContent}`);
  }
  // what the pause menu's buttons mean depends on the run: a scored Daily Storm restarts as practice, and quitting spends it
  syncPause(m) { const scored = m && m.daily === 'scored' && !m.result; $('p-restart').textContent = scored ? 'Restart as practice' : 'Restart storm'; $('p-quit').textContent = scored ? 'Quit: run is spent' : 'Headquarters'; }
  // the share text goes to the system share sheet, or the clipboard: it never leaves the device any other way
  async share() {
    const r = this.lastRes, s = save.s, b = $('res-share'); if (!r || !r.daily) return;
    const text = shareText({ day: s.daily.day, storm: r.storm.name, letter: r.grade && r.grade.letter, time: r.time, won: r.won, rows: r.rows });
    const say = (t) => { b.textContent = t; clearTimeout(this.shareT); this.shareT = setTimeout(() => { b.textContent = 'Share'; }, 1800); };
    try { if (navigator.share && (!navigator.canShare || navigator.canShare({ text }))) { await navigator.share({ text }); return; } }
    catch (e) { if (e && e.name === 'AbortError') return; } // the player closed the sheet: nothing to say
    try { await navigator.clipboard.writeText(text); say('Copied'); return; } catch { /* no async clipboard here */ }
    try { const t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); const done = document.execCommand('copy'); t.remove(); say(done ? 'Copied' : 'Copy failed'); } catch { say('Copy failed'); }
  }

  // ---- results ----
  results(res, unlockText) {
    const sc = this.screens.results; sc.classList.toggle('won', res.won); sc.classList.toggle('lost', !res.won);
    this.lastRes = res; const st = res.stats, g = res.grade || { letter: null, hint: '' }, daily = res.daily, D = daily ? save.s.daily.day : '';
    const date = D ? new Date(D + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '';
    $('res-eyebrow').textContent = (daily ? `Daily Storm · ${date} · ` : '') + `${res.storm.name} · EF${res.storm.ef + res.rematch}` + (daily === 'practice' ? ' · Practice' : '');
    $('res-title').textContent = res.won ? 'Storm destroyed' : 'Rig wrecked';
    $('res-sub').textContent = res.won ? '' : st.snaps ? 'So close. On the gun, shoot down what it throws before it lands; rockets for cars and tractors. Or hit DRIVE and steer off the magenta circles.' : 'Get inside the danger zone and the turret is yours: shoot the bright seam on the band. Then the crew take over, a seat each: harpoon, Dorothy, kill shot.';
    $('res-sub').hidden = res.won;
    // the letter, and the best for this storm: NEW BEST when this one beat it
    const gb = $('res-grade'), best = save.s.grades[res.storm.id], fresh = !!g.letter && (!res.bestBefore || g.letter !== res.bestBefore) && best === g.letter;
    gb.hidden = !g.letter; if (g.letter) { $('res-letter').textContent = g.letter; gb.dataset.l = g.letter; gb.classList.toggle('new', fresh && !!res.bestBefore); $('res-best').textContent = fresh && res.bestBefore ? 'New best' : `Best ${best}`; gb.setAttribute('aria-label', `Grade ${g.letter}, best ${best}`); }
    $('res-hint').textContent = g.letter ? g.hint : '';
    // the numbers the grade read, then the data
    const t = $('res-tally'); t.textContent = '';
    const row = (k, v, small) => { t.appendChild(el('dt', '', k)); const d = el('dd', '', v); if (small) d.appendChild(el('small', '', small)); t.appendChild(d); };
    row('Time', clock(res.time)); if (res.won) row('Hull left', Math.round(100 * res.hull / res.hullMax) + '%');
    row('Accuracy', st.rounds ? Math.round(100 * st.fired / st.rounds) + '%' : '-', st.rounds ? `${st.fired}/${st.rounds}` : ''); row('Critical hits', String(st.crits)); row('Near misses', String(st.close));
    t.appendChild(el('dt', 'total', res.won ? 'Data banked' : 'Data salvaged')); t.appendChild(el('dd', 'total', '+' + res.data));
    const u = $('res-unlock'); u.hidden = !unlockText; u.textContent = unlockText || '';
    const p = $('res-primary'), q = $('res-secondary'), sh = $('res-share');
    const again = () => { this.G.audio.unlock(); this.G.audio.ui(); this.G.restart(); }, hq = () => { this.G.audio.ui(); this.G.toHQ(); };
    sh.hidden = daily !== 'scored'; sh.textContent = 'Share';
    if (daily) { p.textContent = daily === 'scored' ? 'Practise' : 'Practise again'; q.textContent = 'Headquarters'; p.onclick = again; q.onclick = hq; p.className = 'slab ' + (daily === 'scored' ? 'slab-quiet' : 'slab-primary'); }
    else { p.textContent = res.won ? 'Continue' : 'Retry'; q.textContent = res.won ? 'Fight it again' : 'Headquarters'; p.onclick = res.won ? hq : again; q.onclick = res.won ? again : hq; p.className = 'slab slab-primary'; }
    this.show('results');
    if (daily === 'scored' && !this.G.input.usingTouch) sh.focus({ preventScroll: true });
  }
}
