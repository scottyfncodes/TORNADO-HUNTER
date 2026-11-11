// All sound is synthesised with Web Audio: nothing to download, works offline, unlocks on the first tap.
let ctx = null, master = null, muted = false;
let wind, roar, rain, engine, cable, skid, rush;
let noiseBuf = null;

function makeNoise() {
  const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.04 * w) / 1.04; d[i] = w * 0.35 + last * 4.5; }
  return buf;
}
function noiseLoop(type, freq, q) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.value = 0;
  src.connect(f).connect(g).connect(master); src.start();
  return { f, g };
}
function env(g, t, a, peak, d) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function tone(type, f0, f1, dur, vol, when = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  env(g, t, 0.005, vol, dur); o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function burst(type, freq, q, dur, vol, sweepTo, when = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + when, src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  const g = ctx.createGain(); env(g, t, 0.004, vol, dur);
  src.connect(f).connect(g).connect(master); src.start(t, Math.random()); src.stop(t + dur + 0.1);
}

export const audio = {
  get ready() { return !!ctx; },
  get muted() { return muted; },
  // must be called from a user gesture (iOS)
  unlock() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ctx = new AC(); } catch { ctx = null; return; }
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp).connect(ctx.destination);
    noiseBuf = makeNoise();
    wind = noiseLoop('bandpass', 500, 0.7); roar = noiseLoop('lowpass', 120, 0.3); rain = noiseLoop('highpass', 3500, 0.2); skid = noiseLoop('bandpass', 1700, 5); rush = noiseLoop('bandpass', 900, 0.5);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), ef = ctx.createBiquadFilter(), eg = ctx.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; o1.frequency.value = 55; o2.frequency.value = 27.5; ef.type = 'lowpass'; ef.frequency.value = 400; eg.gain.value = 0;
    o1.connect(ef); o2.connect(ef); ef.connect(eg).connect(master); o1.start(); o2.start(); engine = { o1, o2, ef, g: eg };
    const co = ctx.createOscillator(), cg = ctx.createGain(); co.type = 'triangle'; co.frequency.value = 110; cg.gain.value = 0; co.connect(cg).connect(master); co.start(); cable = { o: co, g: cg };
  },
  setMuted(m) { muted = m; if (master) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.05); },
  suspend(on) { if (ctx) { if (on) ctx.suspend(); else ctx.resume(); } },
  // continuous beds, set every frame. prox 0..1 (near the funnel), storm 0..1, speed 0..1, throttle 0..1, tension <0 slack .. >1 over
  beds({ prox = 0, storm = 0, speed = 0, throttle = 0, tension = null, playing = false, drift = 0, boost = false }) {
    if (!ctx) return;
    const t = ctx.currentTime, k = 0.12;
    wind.g.gain.setTargetAtTime(0.04 * storm + 0.2 * prox, t, k); wind.f.frequency.setTargetAtTime(380 + 900 * prox, t, k);
    roar.g.gain.setTargetAtTime(0.85 * prox * prox, t, k); roar.f.frequency.setTargetAtTime(90 + 160 * prox, t, k);
    rain.g.gain.setTargetAtTime(0.03 * storm, t, 0.4);
    // the engine: pitch tracks speed, opens up on boost; air rushing past is half the feeling of going fast
    engine.g.gain.setTargetAtTime(playing ? 0.03 + 0.045 * throttle + (boost ? 0.03 : 0) : 0, t, 0.08);
    engine.o1.frequency.setTargetAtTime(46 + 120 * speed + (boost ? 26 : 0), t, 0.06); engine.o2.frequency.setTargetAtTime(23 + 60 * speed + (boost ? 13 : 0), t, 0.06);
    engine.ef.frequency.setTargetAtTime(300 + 1500 * speed + (boost ? 900 : 0), t, 0.1);
    rush.g.gain.setTargetAtTime(playing ? 0.1 * speed * speed : 0, t, 0.15); rush.f.frequency.setTargetAtTime(500 + 1300 * speed, t, 0.15);
    skid.g.gain.setTargetAtTime(playing ? 0.07 * drift : 0, t, 0.05);
    if (tension === null || tension < 0) cable.g.gain.setTargetAtTime(0, t, 0.05);
    else { cable.g.gain.setTargetAtTime(0.06, t, 0.05); cable.o.frequency.setTargetAtTime(160 + 520 * Math.min(1, tension), t, 0.05); }
  },
  tick() { tone('square', 880, 880, 0.04, 0.05); },
  ui() { tone('triangle', 520, 780, 0.07, 0.08); },
  deny() { tone('square', 160, 120, 0.1, 0.06); },
  ready_() { tone('triangle', 660, 990, 0.09, 0.09); },
  probeLaunch() { burst('bandpass', 900, 2, 0.25, 0.3, 2400); },
  ping() { tone('sine', 1320, 1320, 0.5, 0.16); tone('sine', 1980, 1980, 0.35, 0.07, 0.08); },
  harpoon() { burst('highpass', 1200, 1, 0.12, 0.4); tone('sawtooth', 220, 60, 0.25, 0.15); },
  twang() { tone('triangle', 98, 196, 0.5, 0.3); tone('triangle', 147, 294, 0.4, 0.15, 0.02); },
  lineSnap() { burst('highpass', 3000, 1, 0.08, 0.6); tone('sawtooth', 900, 80, 0.3, 0.2); },
  boost() { burst('bandpass', 400, 1.5, 0.7, 0.35, 2600); },
  thunder(vol = 0.9) { burst('lowpass', 2400, 0.4, 0.08, vol); burst('lowpass', 500, 0.3, 2.2, vol * 0.9, 50, 0.04); },
  whistle(dur = 0.9) { tone('sine', 1500, 500, dur, 0.06); },
  impact() { burst('lowpass', 300, 0.6, 0.35, 0.9, 60); },
  hurt() { burst('lowpass', 900, 0.8, 0.3, 0.9, 100); tone('square', 110, 55, 0.25, 0.2); },
  smash() { burst('bandpass', 1400, 0.8, 0.14, 0.3, 500); },
  bandSnap() { this.thunder(1); tone('sawtooth', 110, 440, 0.6, 0.18, 0.1); tone('triangle', 220, 880, 0.7, 0.14, 0.12); },
  pickup(i = 0) { tone('sine', 660 * Math.pow(1.122, i % 8), 660 * Math.pow(1.122, i % 8), 0.12, 0.09); },
  thump() { tone('sine', 140, 30, 0.6, 0.9); burst('lowpass', 800, 0.5, 0.4, 0.5, 80); },
  stake() { burst('bandpass', 500, 3, 0.1, 0.5); tone('square', 80, 60, 0.15, 0.2); },
  warn() { tone('square', 740, 740, 0.09, 0.07); tone('square', 740, 740, 0.09, 0.07, 0.16); },
  // the arsenal: each one has to be told apart with your eyes shut
  mg() { burst('highpass', 1800, 0.7, 0.045, 0.22); tone('square', 150, 70, 0.05, 0.12); },
  shotgun() { burst('lowpass', 2600, 0.5, 0.2, 1.0, 180); tone('sine', 120, 40, 0.22, 0.5); tone('square', 900, 300, 0.05, 0.1, 0.24); },
  rocket() { burst('bandpass', 500, 1.2, 0.55, 0.5, 3200); tone('sawtooth', 90, 320, 0.4, 0.16); },
  boom(vol = 1) { burst('lowpass', 1400, 0.4, 0.5, vol, 60); tone('sine', 110, 28, 0.6, vol * 0.8); burst('highpass', 2500, 0.5, 0.12, vol * 0.3); },
  crack() { burst('highpass', 2200, 0.8, 0.09, 0.35); tone('square', 420, 120, 0.09, 0.12); },
  gust() { burst('bandpass', 300, 0.8, 1.2, 0.5, 1400); },
  dorothy() { tone('sine', 880, 1760, 0.18, 0.12); tone('sine', 1320, 2640, 0.22, 0.1, 0.1); tone('sine', 1760, 3520, 0.3, 0.08, 0.2); },
  stagger() { tone('sawtooth', 520, 90, 0.9, 0.2); burst('lowpass', 900, 0.6, 0.8, 0.6, 80); },
  win() {
    [262, 330, 392, 523].forEach((f, i) => tone('triangle', f, f, 1.4, 0.14, 0.35 + i * 0.12));
    for (let i = 0; i < 5; i++) tone('sine', 2600 + (i % 2) * 500, 3400 + (i % 3) * 300, 0.09, 0.05, 2.2 + i * 0.16); // the meadowlark
  },
  fail() { tone('sawtooth', 196, 98, 0.9, 0.16); tone('sawtooth', 147, 73, 1.1, 0.12, 0.15); },
};
