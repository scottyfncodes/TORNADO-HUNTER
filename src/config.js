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
  mgStormDps: 13,             // storm strength per second while the guns are on it (inside the danger zone)
  burstMultiplier: 2.3,       // gun damage while the trigger is held down hard (BURST)
  burstSeconds: 2.6,
  burstCooldown: 6,
  dorothySeconds: 3.4,        // s the camera rides with the sensors while the truck drives itself
  killSeconds: 8,             // s to fire the kill shot once DOROTHY has done her work
  shotgunRange: 22,           // m
  shotgunReload: 4,         // s
  staggerSeconds: 7,          // s the core stays exposed after the shield breaks: land the harpoon
  hookSeconds: 8,             // s the line holds a hooked storm
  hookRecover: 0.5,           // share of shield it rebuilds if the line lets go before the kill shot
  dorothyBoost: 2,            // shield damage multiplier while DOROTHY is in the funnel
  staggerRecover: 0.4,        // share of shield it rebuilds if you miss the harpoon window
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

  // ---- the gunner's seat: first person on the turret while the truck drives itself ----
  gunFovTighten: 8,           // degrees narrower than the driving lens: sights, not a windscreen
  gunEyeHeight: 1.5,          // m above the turret mount
  gunBlend: 0.3,              // s to swing between the driving camera and the gun (0.1 in calm mode)
  seatBlend: 0.45,            // s to swing across to another crew vehicle
  gunPitchMin: -0.3, gunPitchMax: 1.2, // rad
  gunGuard: 0.3,              // s after a seat change before any press counts: no accidental shot, boost or seat change
  gunStormDps: 17,            // storm strength per second of hits on the band
  gunCrit: 2.2,               // a hit on the seam (storm) or dead centre (wreckage)
  gunWreckRange: 250,         // m: wreckage can be engaged as soon as it leaves the funnel
  gunSatMul: 0.1,             // bullets barely mark a satellite twister: that is a rocket's job
  wreckHp: 45, wreckHpBig: 170, // what it takes to shoot a bale, or a tractor, out of the air
  crewGunShare: 0.75,         // the crew covering you at the wheel shoot at three quarters of the rate you do
  gunnerBreather: 1.4,        // the storm throws this much less often at a truck that cannot weave
  gunnerShotgun: 1.6,         // and the crew's last-second shotgun is this much slower: on the gun, the sky is your job
  aimAssist: 1.5,             // touch only: how much wider a target is than it looks
  rocketAmmo: 3, rocketMax: 4, rocketResupply: 2, // carried, most carried, handed up after each band
  rocketStorm: 0.18,          // share of a band one rocket takes off
  rocketSplash: 17,           // m
  rocketLockSeconds: 0.4,     // s holding the reticle on a target to lock
  autoStandoff: 0.7,          // share of the danger zone the autodrive holds
  autoSpeed: 0.92,            // share of top speed it will use: it never boosts, it never takes the racing line

  // ---- weather ----
  hailFirst: [20, 30], hailSeconds: [10, 13], hailGap: [28, 42], // s
  hailGrip: 0.3,              // share of sideways grip lost on ice
  hailVisibility: 0.42,       // fog distance multiplier at full hail
  boltEvery: [6, 13], boltEveryHail: [3.5, 8], // s between ambient lightning strikes
  soundSpeed: 343,            // m/s: thunder arrives when it should
};

export const WORLD = { scale: 3, size: 3072, yScale: 1.6, roadSpacing: 512, roadOffset: 256, roadHalf: 6.5, highwayHalf: 9 };

// Super tornadoes: a temperament each, not a bigger number. `run` is ground speed in m/s.
export const STORMS = [
  {
    id: 'pete', name: 'Skinny Pete', ef: 1, type: 'Rope', bands: 2, stageHp: 230, zone: 185,
    blurb: 'A hundred miles an hour and never in a straight line.',
    habit: 'Jukes hard. Throws whatever it just ate. Crosswinds.',
    pay: 60, run: 45, juke: [4.5, 7.5], jukeAngle: [0.55, 1.5],
    r0: 11, r1: 74, height: 310, suckR: 115, suck: 12, killR: 15, dorothyRange: 135,
    attackEvery: [2.8, 2.2], attacks: [['debris', 'debris', 'crosswind', 'big'], ['debris', 'big', 'lightning', 'crosswind', 'debris']],
    volley: [1, 2], unlocks: null,
  },
  {
    id: 'agnes', name: 'Big Agnes', ef: 3, type: 'Wedge', bands: 3, stageHp: 300, zone: 240,
    blurb: 'Half a mile wide. Turns like a continent. Everything ends up inside her.',
    habit: 'Whole debris fields at once. Suction that grabs from a block away.',
    pay: 110, run: 40, juke: [8, 12], jukeAngle: [0.3, 0.8],
    r0: 30, r1: 150, height: 340, suckR: 200, suck: 17, killR: 36, dorothyRange: 175,
    attackEvery: [2.7, 2.3, 1.9], attacks: [['field', 'big', 'debris'], ['field', 'big', 'lightning', 'field'], ['field', 'field', 'big', 'lightning']],
    volley: [2, 2, 3], unlocks: 'bulldog',
  },
  {
    id: 'sisters', name: 'The Sisters', ef: 4, type: 'Multi-vortex', bands: 3, stageHp: 240, zone: 215,
    blurb: 'Never travels alone. They split, they close, they cut you off.',
    habit: 'Satellite twisters sweep the ground around her. Fast.',
    pay: 180, run: 54, juke: [3.5, 6], jukeAngle: [0.6, 1.6],
    r0: 16, r1: 96, height: 320, suckR: 130, suck: 13, killR: 20, dorothyRange: 145,
    attackEvery: [2.9, 2.5, 2.1], attacks: [['debris', 'lightning', 'crosswind'], ['debris', 'big', 'lightning', 'crosswind'], ['field', 'big', 'lightning', 'debris']],
    volley: [2, 2, 3], satellites: [3, 4, 5], unlocks: 'whippet',
  },
];

export const RIGS = [
  { id: 'mule', name: 'The Mule', blurb: 'A lifted farm pickup with a machine gun and a harpoon. Balanced.', price: 0,
    gun: { name: 'Machine gun', dps: 1, range: 1, every: 0.085, sound: 'mg' },
    speed: 1.0, accel: 1.0, turn: 1.0, hull: 1.0, resist: 1.0, boost: 1.0, body: '#e0662b', trim: '#f3ecd8', len: 4.8, wid: 2.2, hgt: 1.1 },
  { id: 'bulldog', name: 'Bulldog', blurb: 'An armoured wedge with a minigun: brutal up close, short reach. Most hull, turns like a barn.', price: 260, needs: 'agnes',
    gun: { name: 'Minigun', dps: 1.35, range: 0.85, every: 0.045, sound: 'minigun' },
    speed: 0.9, accel: 0.85, turn: 0.82, hull: 1.6, resist: 0.55, boost: 0.9, body: '#4f6b54', trim: '#ffc531', len: 5.4, wid: 2.6, hgt: 1.5 },
  { id: 'whippet', name: 'Whippet', blurb: 'A stripped prerunner with an autocannon: slow, heavy shots from long range. Fastest, made of paper.', price: 320, needs: 'sisters',
    gun: { name: 'Autocannon', dps: 0.9, range: 1.3, every: 0.2, sound: 'cannon' },
    speed: 1.13, accel: 1.25, turn: 1.2, hull: 0.7, resist: 1.25, boost: 1.35, body: '#2f8f9a', trim: '#f3ecd8', len: 4.2, wid: 2.0, hgt: 0.8 },
];

export const CREW = [
  { id: 'doc', name: 'Doc Vane', role: 'Scientist', ride: 'Science bus · Dorothy', perk: 'DOROTHY weakens the storm further, and you get 3 more seconds for the kill shot.',
    barks: { start: 'It is doing a hundred and climbing. I was right. Note that I was right.', seat: 'My bus, my dials. Pull the lever and nothing else.', probe: 'The swarm is away! Reading it now!', snap: 'Structure is gone! It is coming apart!', hurt: 'That was not in the model!', win: 'Textbook. My textbook.' } },
  { id: 'winch', name: 'Winch Okafor', role: 'Harpooner', ride: 'Harpoon truck', perk: 'More time to land the harpoon, and the line holds 2 seconds longer.',
    barks: { start: 'Cable is greased. Do not embarrass it.', seat: 'My truck, my cable. Put it in the bright part.', probe: 'Sensors away.', snap: 'She let go! Floor it!', hurt: 'Easy on my rig!', win: 'Steel beats weather. Every time.' } },
  { id: 'sparks', name: 'Sparks Marín', role: 'Engineer', ride: 'Rocket truck · kill shot', perk: 'The hull slowly repairs. Boost recharges 35% faster.',
    barks: { start: 'Everything is technically finished.', seat: 'One rocket. I only had parts for one. Make it count.', probe: 'Launcher worked! Write that down!', snap: 'Ha! Did you hear that?', hurt: 'I can fix that. Probably.', win: 'Nothing fell off. Nothing important.' } },
  { id: 'june', name: 'June Bug', role: 'Gunner', ride: 'Your rig · turret', perk: 'Guns reach 30% further and hit harder. 20% more Data.',
    barks: { start: 'Guns are hot. Nobody tell my mom.', probe: 'It ate it! It totally ate it!', snap: 'Data everywhere! Grabbing it!', hurt: 'Incoming! I said incoming!', win: 'Best. Tuesday. Ever.' } },
];

// kept so old saves load; the gadget slot was retired with the tether fight
export const GADGETS = [{ id: 'anchor', name: 'Ground Anchor' }, { id: 'thumper', name: 'Thumper' }];

export const UPGRADES = [
  { id: 'winch', name: 'Winch', blurb: 'The harpoon line holds longer', prices: [80, 160, 280], step: 0.15 },
  { id: 'cable', name: 'Ordnance', blurb: 'Guns hit harder; one more rocket in the rack', prices: [70, 140, 240], step: 0.1 },
  { id: 'plating', name: 'Plating', blurb: 'More hull', prices: [70, 150, 260], step: 0.2 },
  { id: 'turbo', name: 'Turbo', blurb: 'Boost lasts longer and recharges faster', prices: [60, 130, 220], step: 0.15 },
];

export const RANKS = [[0, 'Rookie'], [4, 'Chaser'], [10, 'Wrangler'], [20, 'Roper'], [40, 'Storm Boss']];

export function rankFor(bands) { let r = RANKS[0][1]; for (const [n, t] of RANKS) if (bands >= n) r = t; return r; }
