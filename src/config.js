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

// play.feel: the numbers that make it feel right (SI units unless named). 1 m/s is 2.237 mph.
export const FEEL = {
  mph: 2.237,
  rigTopSpeedRoad: 64,        // m/s (143 mph)
  rigTopSpeedField: 53,       // m/s (119 mph): shortcuts cost speed, not the chase
  rigAccel: 34,               // m/s^2 off the line, tapering toward top speed
  rigBrake: 36,               // m/s^2
  rigReverseSpeed: 14,        // m/s
  rigTurnRate: 2.5,           // rad/s at low speed
  rigGripRecover: 6.5,        // 1/s, how fast sideways slip bleeds off
  driftGrip: 1.0,             // 1/s while the handbrake slide is held
  driftTurn: 1.75,            // yaw multiplier in a slide
  driftMinSpeed: 20,          // m/s
  boostMultiplier: 1.38,      // 197 mph on a road
  boostSeconds: 2.2,
  boostRecharge: 5,           // s from empty
  boostFromNearMiss: 0.3,     // share of a full charge
  boostFromKill: 0.12,        // per piece of debris shot down
  boostFromDrift: 0.22,       // per second sliding
  dorothyRange: 135,          // m: you have to be in the inflow to feed it
  dorothyCooldown: 9,         // s after the window closes
  exposeSeconds: 9,           // s the core stays open
  rocketRange: 320,           // m
  rocketReload: 2.8,          // s
  rocketDamage: 34,           // on an exposed core
  rocketGlance: 0.2,          // share of damage when the core is shut
  rocketSpeed: 230,           // m/s
  mgRange: 160,               // m against incoming debris
  mgStormRange: 230,          // m against an exposed core
  mgDebrisDps: 60,            // debris hit points per second
  mgStormDps: 5,              // stability per second on an exposed core
  shotgunRange: 22,           // m
  shotgunReload: 4,         // s
  staggerSeconds: 6.5,        // s to land the harpoon
  staggerRecover: 0.4,        // share of stability it gets back if you miss the window
  harpoonRange: 230,          // m
  ripSeconds: 1.5,            // s of full-throttle pull to tear a band off
  ripIdle: 0.25,              // rip rate with no pull at all (never a softlock)
  surgeSpeed: 52,             // m/s the debris wall expands
  surgeRadius: 235,           // m it reaches
  dmgSurge: 18,
  inputBuffer: 0.15,          // s an early press is remembered
  hitStopBandSnap: 0.12, hitStopHarpoon: 0.06, hitStopHull: 0.06, hitStopRocket: 0.035,
  shakeBandSnap: 14, shakeHull: 9, shakeRocket: 6,
  telegraphMin: 0.9,          // s: nothing lands without at least this much warning
  retryDelay: 0.6,
  hullBase: 100,
  dmgDebris: 16, dmgBigDebris: 24, dmgWreck: 10, dmgLightning: 20, dmgSatellite: 12, dmgCore: 30,
  crosswind: 15,              // m/s^2 sideways
  camDistance: 13.5, camHeight: 5.4, camFov: 60, camFovSpeed: 16,
};

export const WORLD = { scale: 3, size: 3072, yScale: 1.6, roadSpacing: 512, roadOffset: 256, roadHalf: 6.5, highwayHalf: 9 };

// Super tornadoes: a temperament each, not a bigger number. `run` is ground speed in m/s.
export const STORMS = [
  {
    id: 'pete', name: 'Skinny Pete', ef: 1, type: 'Rope', bands: 3, stageHp: 100,
    blurb: 'A hundred miles an hour and never in a straight line.',
    habit: 'Jukes hard. Throws whatever it just ate. Crosswinds.',
    pay: 60, run: 45, juke: [4.5, 7.5], jukeAngle: [0.55, 1.5],
    r0: 11, r1: 74, height: 310, suckR: 115, suck: 12, killR: 15, dorothyRange: 135,
    attackEvery: [2.9, 2.4, 2.0], attacks: [['debris', 'debris', 'crosswind', 'big'], ['debris', 'big', 'lightning', 'crosswind', 'debris'], ['debris', 'big', 'lightning', 'crosswind', 'big']],
    volley: [1, 2, 3], unlocks: null,
  },
  {
    id: 'agnes', name: 'Big Agnes', ef: 3, type: 'Wedge', bands: 3, stageHp: 160,
    blurb: 'Half a mile wide. Turns like a continent. Everything ends up inside her.',
    habit: 'Whole debris fields at once. Suction that grabs from a block away.',
    pay: 110, run: 40, juke: [8, 12], jukeAngle: [0.3, 0.8],
    r0: 30, r1: 150, height: 340, suckR: 200, suck: 17, killR: 36, dorothyRange: 175,
    attackEvery: [2.7, 2.3, 1.9], attacks: [['field', 'big', 'debris'], ['field', 'big', 'lightning', 'field'], ['field', 'field', 'big', 'lightning']],
    volley: [2, 2, 3], unlocks: 'bulldog',
  },
  {
    id: 'sisters', name: 'The Sisters', ef: 4, type: 'Multi-vortex', bands: 3, stageHp: 150,
    blurb: 'Never travels alone. They split, they close, they cut you off.',
    habit: 'Satellite twisters sweep the ground around her. Fast.',
    pay: 180, run: 54, juke: [3.5, 6], jukeAngle: [0.6, 1.6],
    r0: 16, r1: 96, height: 320, suckR: 130, suck: 13, killR: 20, dorothyRange: 145,
    attackEvery: [2.5, 2.1, 1.7], attacks: [['debris', 'lightning', 'crosswind'], ['debris', 'big', 'lightning', 'crosswind'], ['field', 'big', 'lightning', 'debris']],
    volley: [2, 3, 3], satellites: [3, 4, 5], unlocks: 'whippet',
  },
];

export const RIGS = [
  { id: 'mule', name: 'The Mule', blurb: 'A lifted farm pickup with a gun mount and a harpoon. Balanced.', price: 0,
    speed: 1.0, accel: 1.0, turn: 1.0, hull: 1.0, resist: 1.0, boost: 1.0, body: '#e0662b', trim: '#f3ecd8', len: 4.8, wid: 2.2, hgt: 1.1 },
  { id: 'bulldog', name: 'Bulldog', blurb: 'An armoured wedge. Most hull, shrugs off suction, turns like a barn.', price: 260, needs: 'agnes',
    speed: 0.9, accel: 0.85, turn: 0.82, hull: 1.6, resist: 0.55, boost: 0.9, body: '#4f6b54', trim: '#ffc531', len: 5.4, wid: 2.6, hgt: 1.5 },
  { id: 'whippet', name: 'Whippet', blurb: 'A stripped prerunner. Fastest, drifts on a dime, made of paper.', price: 320, needs: 'sisters',
    speed: 1.13, accel: 1.25, turn: 1.2, hull: 0.7, resist: 1.25, boost: 1.35, body: '#2f8f9a', trim: '#f3ecd8', len: 4.2, wid: 2.0, hgt: 0.8 },
];

export const CREW = [
  { id: 'doc', name: 'Doc Vane', role: 'Scientist', perk: 'DOROTHY keeps the core open 3 seconds longer and works from further out.',
    barks: { start: 'It is doing a hundred and climbing. I was right. Note that I was right.', probe: 'Dorothy is flying! Reading it now!', snap: 'Structure is gone! It is coming apart!', hurt: 'That was not in the model!', win: 'Textbook. My textbook.' } },
  { id: 'winch', name: 'Winch Okafor', role: 'Harpooner', perk: 'Longer stagger window. Bands rip off 30% faster.',
    barks: { start: 'Cable is greased. Do not embarrass it.', probe: 'Pods away.', snap: 'She let go! Floor it!', hurt: 'Easy on my rig!', win: 'Steel beats weather. Every time.' } },
  { id: 'sparks', name: 'Sparks Marín', role: 'Engineer', perk: 'The hull slowly repairs. Boost recharges 35% faster.',
    barks: { start: 'Everything is technically finished.', probe: 'Launcher worked! Write that down!', snap: 'Ha! Did you hear that?', hurt: 'I can fix that. Probably.', win: 'Nothing fell off. Nothing important.' } },
  { id: 'june', name: 'June Bug', role: 'Gunner', perk: 'The machine gun reaches 30% further and hits harder. 20% more Data.',
    barks: { start: 'Guns are hot. Nobody tell my mom.', probe: 'It ate it! It totally ate it!', snap: 'Data everywhere! Grabbing it!', hurt: 'Incoming! I said incoming!', win: 'Best. Tuesday. Ever.' } },
];

// kept so old saves load; the gadget slot was retired with the tether fight
export const GADGETS = [{ id: 'anchor', name: 'Ground Anchor' }, { id: 'thumper', name: 'Thumper' }];

export const UPGRADES = [
  { id: 'winch', name: 'Winch', blurb: 'Harpoon rips bands off faster', prices: [80, 160, 280], step: 0.15 },
  { id: 'cable', name: 'Ordnance', blurb: 'Rockets hit harder and reload faster', prices: [70, 140, 240], step: 0.1 },
  { id: 'plating', name: 'Plating', blurb: 'More hull', prices: [70, 150, 260], step: 0.2 },
  { id: 'turbo', name: 'Turbo', blurb: 'Boost lasts longer and recharges faster', prices: [60, 130, 220], step: 0.15 },
];

export const RANKS = [[0, 'Rookie'], [4, 'Chaser'], [10, 'Wrangler'], [20, 'Roper'], [40, 'Storm Boss']];

export function rankFor(bands) { let r = RANKS[0][1]; for (const [n, t] of RANKS) if (bands >= n) r = t; return r; }
