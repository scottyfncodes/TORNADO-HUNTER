// The band: turns the score (score.js) into sound on a Web Audio context. It is scheduled against the audio clock, a fifth
// of a second ahead, from the frame loop, so a dropped frame is never a dropped beat. Synthesised like everything else in
// audio.js: nothing to download. tests/audio.mjs renders it on an OfflineAudioContext and measures what comes out.
import { mtof, sectionOf, themeOf, intensityOf, tempoOf, mixOf, stepEvents, fanfare, dirge, STING } from './score.js';

const LOOK = 0.2;   // s scheduled ahead of the clock
const LEVEL = 0.7;  // the whole band: under the guns, level with the wind
const K = { kick: 0.5, snare: 0.3, hat: 0.1, bass: 0.24, arp: 0.075, lead: 0.13, pad: 0.036 }; // each player's own loudness

export function noiseBuffer(ctx) { const len = ctx.sampleRate, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); let x = 22222; for (let i = 0; i < len; i++) { x = (x * 16807) % 2147483647; d[i] = x / 1073741823.5 - 1; } return buf; }

export class Music {
  constructor(ctx, out, noise = noiseBuffer(ctx)) {
    this.ctx = ctx; this.noise = noise; this.on = true; this.sec = ''; this.theme = null; this.run = null; this.bar = 0; this.step = 0; this.next = 0; this.hold = 0; this.bpm = 0; this.x = 0; this.notes = 0; this.mix = {}; this.padV = null;
    const g = (v, to) => { const n = ctx.createGain(); n.gain.value = v; if (to) n.connect(to); return n; };
    const f = (type, hz, to, q = 0.7) => { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = hz; n.Q.value = q; n.connect(to); return n; };
    this.tone = f('lowpass', 18000, out);                 // closes over the band when the hull is nearly gone
    this.duckG = g(1, this.tone);                         // the band steps back for an explosion
    this.level = g(LEVEL, this.duckG);                    // the Music switch
    this.loop = g(1, this.level);                         // everything the sequencer plays; a sting fades it out
    // an echo, three sixteenths long, for the plucked parts: it is most of what makes six oscillators sound like a place
    // (its time is set when a theme starts and never glides: a delay whose time moves bends the pitch of whatever is in it.
    // The stings have their own, fixed, so a win's last chord is never in a line that is about to change.)
    const echo = (time) => { const d = ctx.createDelay(1), fb = g(0.3), wet = g(0.32, this.level); d.delayTime.value = time; d.connect(fb); fb.connect(d); d.connect(wet); return { d, wet }; };
    this.echo = echo(0.36); this.echo2 = echo(0.375);
    const B = this.bus = { drums: g(0, this.loop), bass: g(0), arp: g(0, this.loop), lead: g(0), pad: g(0), sting: g(1, this.level) };
    this.bassF = f('lowpass', 700, this.loop, 1.2); B.bass.connect(this.bassF);
    this.leadF = f('lowpass', 2600, this.loop); B.lead.connect(this.leadF); this.leadF.connect(this.echo.d); B.arp.connect(this.echo.d);
    this.padF = f('lowpass', 900, this.loop); B.pad.connect(this.padF);
    this.snareF = f('bandpass', 1900, B.drums, 0.7); this.hatF = f('highpass', 7600, B.drums);
    this.stingF = f('lowpass', 2400, B.sting); this.stingF.connect(this.echo2.d); this.crashF = f('highpass', 5200, B.sting);
  }

  // ---- the players. Every one is scheduled at an absolute time on the audio clock ----
  osc(type, hz, t, stop, to, detune = 0) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(hz, t); if (detune) o.detune.value = detune; o.connect(to); o.start(t); o.stop(stop); this.notes++; return o; }
  amp(to) { const a = this.ctx.createGain(); a.gain.value = 0; a.connect(to); return a; }
  hiss(t, dur, peak, to, attack = 0.002) { // a burst of noise with its own envelope, into a shared filter
    const s = this.ctx.createBufferSource(), a = this.amp(to); s.buffer = this.noise; s.loop = true;
    a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack); a.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
    s.connect(a); s.start(t, (t * 7.31) % 0.9); s.stop(t + attack + dur + 0.02); this.notes++;
  }
  kick(t, g, to = this.bus.drums) { const a = this.amp(to), o = this.osc('sine', 150, t, t + 0.27, a); o.frequency.exponentialRampToValueAtTime(44, t + 0.12); a.gain.setValueAtTime(K.kick * g, t); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); }
  snare(t, g, to = this.snareF) { this.hiss(t, 0.13, K.snare * g, to); const a = this.amp(to === this.snareF ? this.bus.drums : this.bus.sting), o = this.osc('triangle', 210, t, t + 0.1, a); o.frequency.exponentialRampToValueAtTime(150, t + 0.07); a.gain.setValueAtTime(K.snare * 0.5 * g, t); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); }
  hat(t, g, open) { this.hiss(t, open ? 0.17 : 0.035, K.hat * g, this.hatF); }
  bass(t, m, dur, g) { const a = this.amp(this.bus.bass), p = K.bass * g; this.osc('sawtooth', mtof(m), t, t + dur + 0.05, a); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(p, t + 0.005); a.gain.setValueAtTime(p, t + Math.max(0.01, dur - 0.025)); a.gain.linearRampToValueAtTime(0, t + dur + 0.02); }
  pluck(t, m, dur, g, to, k) { const a = this.amp(to), d = Math.max(0.16, dur); this.osc('triangle', mtof(m), t, t + d + 0.05, a); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(k * g, t + 0.003); a.gain.exponentialRampToValueAtTime(0.0001, t + d); }
  // the tune's voice. 'pluck' is a string, scooped up into the note; 'brass' is two saws a little apart, slower to speak
  voice(t, m, dur, g, kind, to = this.bus.lead) {
    const a = this.amp(to), hz = mtof(m), p = K.lead * g;
    if (kind === 'brass') { this.osc('sawtooth', hz, t, t + dur + 0.2, a, -7); this.osc('sawtooth', hz, t, t + dur + 0.2, a, 7); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(p * 0.75, t + 0.035); a.gain.setValueAtTime(p * 0.75, t + Math.max(0.04, dur - 0.03)); a.gain.linearRampToValueAtTime(0, t + dur + 0.12); }
    else { const o = this.osc('sawtooth', hz * 0.972, t, t + dur + 0.15, a); o.frequency.exponentialRampToValueAtTime(hz, t + 0.03); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(p, t + 0.006); a.gain.exponentialRampToValueAtTime(p * 0.45, t + 0.1); a.gain.setValueAtTime(p * 0.45, t + Math.max(0.11, dur - 0.03)); a.gain.linearRampToValueAtTime(0, t + dur + 0.08); }
  }
  // the pad is three voices that never stop: a chord change is a glide, not a new note
  pad(t, ms) {
    if (!this.padV) this.padV = ms.map((m) => { const a = this.amp(this.bus.pad); a.gain.value = K.pad; return [-6, 6].map((c) => { const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = c; o.connect(a); o.start(t); return o; }); });
    ms.forEach((m, i) => { for (const o of this.padV[i]) o.frequency.setTargetAtTime(mtof(m), t, 0.05); });
  }
  held(t, m, dur, g) { const a = this.amp(this.stingF), p = K.pad * 1.6 * g; this.osc('sawtooth', mtof(m), t, t + dur + 0.7, a, -6); this.osc('sawtooth', mtof(m), t, t + dur + 0.7, a, 6); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(p, t + 0.12); a.gain.setValueAtTime(p, t + dur); a.gain.linearRampToValueAtTime(0, t + dur + 0.6); }

  play(ev, t, sixteenth, theme) {
    const d = ev.len * sixteenth;
    switch (ev.v) {
      case 'pad': this.pad(t, ev.ms); break;
      case 'kick': this.kick(t, ev.g); break;
      case 'snare': this.snare(t, ev.g); break;
      case 'hat': this.hat(t, ev.g, false); break;
      case 'ohat': this.hat(t, ev.g, true); break;
      case 'bass': this.bass(t, ev.m, d, ev.g); break;
      case 'arp': this.pluck(t, ev.m, d, ev.g, this.bus.arp, K.arp); break;
      case 'lead': this.voice(t, ev.m, d, ev.g, theme.lead); break;
    }
  }
  // a fixed phrase (score.js fanfare, dirge), in seconds from t0
  sting(list, t0) {
    for (const [dt, v, m, dur, g] of list) {
      const t = t0 + dt;
      if (v === 'brass') this.voice(t, m, dur, g, 'brass', this.stingF); else if (v === 'pad') this.held(t, m, dur, g);
      else if (v === 'kick') this.kick(t, g, this.bus.sting); else if (v === 'snare') this.hiss(t, dur, K.snare * g, this.crashF);
      else if (v === 'crash') this.hiss(t, dur, 0.16 * g, this.crashF, 0.004); else if (v === 'swell') this.hiss(t, 0.12, 0.13 * g, this.crashF, dur);
    }
  }

  setOn(on) { this.on = on; const t = this.ctx.currentTime; this.level.gain.cancelScheduledValues(t); this.level.gain.setTargetAtTime(on ? LEVEL : 0, t, 0.08); }
  duck(k = 0.45, hold = 0.3) { const t = this.ctx.currentTime, p = this.duckG.gain; p.cancelScheduledValues(t); p.setTargetAtTime(k, t, 0.012); p.setTargetAtTime(1, t + hold, 0.22); }

  // every frame, live: schedule up to a fifth of a second ahead of the clock
  update(st) { this.advance(this.ctx.currentTime + LOOK, st, this.ctx.currentTime); }
  // schedule everything due before `until`. (tests/audio.mjs calls this directly to render a whole fight offline.)
  advance(until, st, now = this.next) {
    if (!this.on) { this.sec = ''; this.theme = null; return; } // off: nothing is scheduled, and it starts clean when it comes back
    const sec = sectionOf(st), th = themeOf(st, sec), x = intensityOf(st, sec), B = this.bus;
    if (sec !== this.sec || st.run !== this.run) {
      const fresh = st.run !== this.run || th !== this.theme; this.run = st.run;
      if (sec === 'won' || sec === 'lost') { this.sting(sec === 'won' ? fanfare(th) : dirge(th), now + 0.03); this.hold = now + STING[sec]; this.loop.gain.setTargetAtTime(0, now, 0.05); }
      else if (fresh) {
        this.theme = th; this.bar = 0; this.step = 0; this.next = Math.max(now + 0.06, this.hold); this.loop.gain.setTargetAtTime(1, this.next, 0.02);
        const e = this.echo, t = this.next - 0.05; e.wet.gain.setValueAtTime(0, t); e.d.delayTime.setValueAtTime(60 / th.bpm / 4 * 3, t + 0.01); e.wet.gain.setValueAtTime(0, t + 0.03); e.wet.gain.linearRampToValueAtTime(0.32, t + 0.06); // three sixteenths of the new tempo, changed while the echo is shut
      }
      this.sec = sec;
    }
    if (now > this.next + 0.25) this.next = now + 0.03; // the frame loop stalled (a hidden tab): pick the beat up from here, do not play the backlog
    this.x += (x - this.x) * 0.2; this.bpm = tempoOf(th, st);
    // the balance for this section, each player eased toward it; the bass and the pad open up as the fight does
    const M = mixOf(sec, this.x), set = (k, v, tc) => { if (this.mix[k] === undefined || Math.abs(this.mix[k] - v) > 0.01) { this.mix[k] = v; B[k].gain.setTargetAtTime(v, now, tc); } };
    set('drums', M.drums, 0.06); set('bass', M.bass, 0.1); set('arp', M.arp, 0.2); set('lead', M.lead, 0.12); set('pad', M.pad, 0.3);
    const open = Math.round(this.x * 10); if (open !== this.open) { this.open = open; this.bassF.frequency.setTargetAtTime(420 + 1100 * this.x, now, 0.2); this.padF.frequency.setTargetAtTime(600 + 1500 * this.x, now, 0.3); }
    const dire = st.hull !== undefined && st.hull < 0.25 && st.scene === 'mission' && sec !== 'won' && sec !== 'lost'; if (dire !== this.dire) { this.dire = dire; this.tone.frequency.setTargetAtTime(dire ? 1500 : 18000, now, 0.25); }
    const six = 60 / this.bpm / 4;
    while (this.next < until) {
      if (this.next >= this.hold) for (const ev of stepEvents({ theme: th, section: sec, bar: this.bar, step: this.step, x: this.x, urgency: st.urgency || 0 })) this.play(ev, this.next, six, th);
      this.next += six; if (++this.step === 16) { this.step = 0; this.bar++; }
    }
  }
  state() { return { on: this.on, section: this.sec, theme: this.theme && this.theme.id, bar: this.bar, step: this.step, bpm: +this.bpm.toFixed(1), x: +this.x.toFixed(2), notes: this.notes, mix: { ...this.mix } }; }
}
