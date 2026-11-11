// TORNADO HUNTER: every tuning number, colour and data table lives here.
// The design of record is docs/GAME_DESIGN.md; these are the values that survived play.

export const PALETTE = {
  background: '#0e1b1d', // storm-shelf green-black
  surface: '#1c2f31',    // instrument-panel teal
  primary: '#ffc531',    // radar amber: the thing to press, a taut cable
  accent: '#ff3f8e',     // hook-echo magenta: danger, the exposed core
  text: '#f3ecd8',       // poster cream
  signal: '#62f58c',     // radar green: data, an exposed band
  wheat: '#d9b45a',
};

// play.feel: the numbers that make it feel right (SI units unless named).
export const FEEL = {
  rigTopSpeedRoad: 34,        // m/s
  rigTopSpeedField: 27,       // m/s
  rigAccel: 16,               // m/s^2
  rigBrake: 30,               // m/s^2
  rigReverseSpeed: 11,        // m/s
  rigTurnRate: 2.3,           // rad/s at low speed
  rigGripRecover: 5.5,        // 1/s, how fast sideways slip bleeds off
  boostMultiplier: 1.45,
  boostSeconds: 1.6,
  boostRecharge: 5,           // s
  probeRange: 90,             // m
  harpoonRange: 165,          // m
  tetherLength: 100,          // m
  tetherSweetBand: 14,        // m of give inside the ring before the line goes slack
  tetherOverStretch: 7,       // m past the ring before the line is over-tensioned
  tetherSpring: 3.0,          // 1/s^2, how hard a stretched line hauls the rig back
  tetherSnapAfter: 0.9,       // s of over-tension before it parts
  tetherGrace: 1.5,           // s after a hit before over-tension counts
  harpoonReload: 2.0,         // s after a snap
  bandWindSeconds: 12,        // s of perfect orbit to wind one band off (EF1)
  windRefAngular: 0.3,        // rad/s: orbit rate that counts as 1.0
  tetheredStormSlowdown: 0.55,
  inputBuffer: 0.15,          // s an early action press is remembered
  hitStopBandSnap: 0.12,      // s
  hitStopHarpoon: 0.06,       // s
  hitStopHull: 0.06,          // s
  shakeBandSnap: 14,          // px-equivalent
  shakeHull: 9,
  telegraphMin: 0.8,          // s: nothing lands without at least this much warning
  retryDelay: 0.6,            // s before the results plate accepts input
  hullBase: 100,
  dmgDebris: 18,
  dmgLightning: 22,
  dmgSatellite: 12,
  dmgCore: 34,
  dataMagnet: 30,             // m
  anchorSeconds: 9,
  anchorRate: 0.6,            // share of full wind rate while staked
  crossfireAngle: 70,         // degrees between two lines for double strain
  thumperRadius: 60,          // m
  thumperCooldown: 14,        // s
  anchorCooldown: 16,         // s
  camDistance: 15, camHeight: 6.5, camFov: 62,
};

export const WORLD = { scale: 3, size: 3072, yScale: 1.6, roadSpacing: 512, roadOffset: 256, roadHalf: 6.5, highwayHalf: 9 };

// Storms: a temperament each, not a bigger number.
export const STORMS = [
  {
    id: 'pete', name: 'Skinny Pete', ef: 1, type: 'Rope', bands: 2,
    blurb: 'Twitchy and thin. Zigzags like it owes somebody money.',
    habit: 'Light debris. Lightning once it is angry.',
    town: 'Hadley', pay: 60, speed: 6.5, wander: 0.9,
    r0: 9, r1: 62, height: 250, suckR: 105, suck: 9, killR: 13,
    windMul: 1.0, attackEvery: [4.2, 3.2], attacks: [['debris'], ['debris', 'lightning']],
    volley: 1, start: 1050, unlocks: 'thumper',
  },
  {
    id: 'agnes', name: 'Big Agnes', ef: 3, type: 'Wedge', bands: 3,
    blurb: 'A mile wide and in no hurry. Everything ends up inside her.',
    habit: 'Suction that eats your slack. Debris lands in pairs.',
    town: 'Coldwater', pay: 110, speed: 5.2, wander: 0.35,
    r0: 26, r1: 120, height: 270, suckR: 150, suck: 13, killR: 32,
    windMul: 1.25, attackEvery: [3.6, 3.0, 2.5], attacks: [['debris', 'surge'], ['debris', 'surge', 'lightning'], ['debris', 'lunge', 'lightning']],
    volley: 2, start: 1150, unlocks: 'bulldog',
  },
  {
    id: 'sisters', name: 'The Sisters', ef: 4, type: 'Multi-vortex', bands: 3,
    blurb: 'Never travels alone, and never spins the same way twice.',
    habit: 'Satellite twisters ride your ring. The spin reverses.',
    town: 'Marrow Creek', pay: 180, speed: 7.2, wander: 0.6,
    r0: 15, r1: 90, height: 260, suckR: 125, suck: 11, killR: 19,
    windMul: 1.4, attackEvery: [3.8, 3.2, 2.7], attacks: [['debris', 'lightning'], ['debris', 'lightning', 'lunge'], ['debris', 'lightning', 'lunge']],
    volley: 2, satellites: [2, 2, 3], reverses: true, start: 1200, unlocks: 'whippet',
  },
];

export const RIGS = [
  { id: 'mule', name: 'The Mule', blurb: 'A farm pickup with a harpoon turret bolted on. Balanced.', price: 0,
    speed: 1.0, accel: 1.0, turn: 1.0, hull: 1.0, resist: 1.0, boost: 1.0, body: '#e0662b', trim: '#f3ecd8', len: 4.8, wid: 2.2, hgt: 1.1 },
  { id: 'bulldog', name: 'Bulldog', blurb: 'An armoured brick. Most hull, shrugs off suction, turns like a barn.', price: 260, needs: 'agnes',
    speed: 0.9, accel: 0.85, turn: 0.82, hull: 1.6, resist: 0.55, boost: 0.9, body: '#4f6b54', trim: '#ffc531', len: 5.4, wid: 2.6, hgt: 1.5 },
  { id: 'whippet', name: 'Whippet', blurb: 'A stripped buggy. Fastest, tightest, made of paper.', price: 320, needs: 'sisters',
    speed: 1.13, accel: 1.25, turn: 1.2, hull: 0.7, resist: 1.25, boost: 1.35, body: '#2f8f9a', trim: '#f3ecd8', len: 4.2, wid: 2.0, hgt: 0.8 },
];

export const CREW = [
  { id: 'doc', name: 'Doc Vane', role: 'Analyst', perk: 'Probes reach 40% further. Attack warnings last longer.',
    barks: { start: 'Rotation is tightening. I was right. Note that I was right.', probe: 'Reading it now. Oh, that is ugly.', snap: 'Band is gone! Core pressure is climbing!', hurt: 'That was not in the model!', win: 'Textbook. My textbook.' } },
  { id: 'winch', name: 'Winch Okafor', role: 'Rigger', perk: 'Wider sweet zone. The line survives over-tension 60% longer.',
    barks: { start: 'Cable is greased. Do not embarrass it.', probe: 'Pod away.', snap: 'She let go! Reel in!', hurt: 'Easy on my rig!', win: 'Steel beats weather. Every time.' } },
  { id: 'sparks', name: 'Sparks Marín', role: 'Engineer', perk: 'The hull slowly repairs. Boost recharges 35% faster.',
    barks: { start: 'Everything is technically finished.', probe: 'Launcher worked! Write that down!', snap: 'Ha! Did you hear that?', hurt: 'I can fix that. Probably.', win: 'Nothing fell off. Nothing important.' } },
  { id: 'june', name: 'June Bug', role: 'Spotter', perk: 'Data flies in from much further. 20% more Data.',
    barks: { start: 'Drone is up. Nobody tell my mom.', probe: 'It ate it! It totally ate it!', snap: 'Data everywhere! Grabbing it!', hurt: 'Incoming! I said incoming!', win: 'Best. Tuesday. Ever.' } },
];

export const GADGETS = [
  { id: 'anchor', name: 'Ground Anchor', blurb: 'Stakes your line to the earth. It keeps winding while you dodge, or land a second harpoon for crossfire.', price: 0 },
  { id: 'thumper', name: 'Thumper', blurb: 'A pressure-cannon shockwave. Swats debris out of the air and interrupts the storm.', price: 120, needs: 'pete' },
];

export const UPGRADES = [
  { id: 'winch', name: 'Winch', blurb: 'Bands wind faster', prices: [80, 160, 280], step: 0.12 },
  { id: 'cable', name: 'Cable', blurb: 'Longer range, wider sweet zone', prices: [70, 140, 240], step: 0.1 },
  { id: 'plating', name: 'Plating', blurb: 'More hull', prices: [70, 150, 260], step: 0.2 },
  { id: 'turbo', name: 'Turbo', blurb: 'Boost lasts longer and recharges faster', prices: [60, 130, 220], step: 0.15 },
];

export const RANKS = [[0, 'Rookie'], [4, 'Chaser'], [10, 'Wrangler'], [20, 'Roper'], [40, 'Storm Boss']];

export function rankFor(bands) { let r = RANKS[0][1]; for (const [n, t] of RANKS) if (bands >= n) r = t; return r; }
