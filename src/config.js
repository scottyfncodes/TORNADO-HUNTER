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
  driftTurn: 2.3,             // yaw multiplier in a slide: how fast it opens (1.75 until 2.7: 0.18 s to open, now 0.08 s)
  driftSwing: 2.2,            // rad/s the direction of travel swings round toward the nose in a slide (1.5 until 2.7: a drift was barely tighter than steering)
  driftCatch: 3.2,            // rad/s it catches up once the slide is let go
  driftBleed: 6,              // m/s^2 of speed a slide costs (7 until 2.7): a 90-degree drift keeps 93%
  driftMaxSlip: 0.85,         // rad the nose may lead the direction of travel: a slide, not a spin
  driftMinSpeed: 20,          // m/s
  smashTree: 0.78,            // share of speed kept through a tree at speed (0.86 until 2.7: you never felt one). A tree below 13 m/s is solid
  smashSoft: 0.9,             // the least speed kept through anything soft (0.93 until 2.7): bales, cows and parked cars thud, fences (0.94) stay cheap
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
  hookSeconds: 15,            // s the line holds a hooked storm: time to drive Doc's bus to its foot and set DOROTHY down
  hookedSpeed: 0.04,          // share of its speed a hooked storm keeps: the anchor creeps at this, the lunges are on top (TETHER)
  dropMargin: 17,             // m outside the funnel's wall where DOROTHY is set down
  dmgTooClose: 12,            // driving the bus into the wall
  hookRecover: 0.5,           // share of shield it rebuilds if the line lets go before the kill shot
  dorothyBoost: 2,            // shield damage multiplier while DOROTHY is in the funnel
  staggerRecover: 0.4,        // share of shield it rebuilds if you miss the harpoon window
  harpoonRange: 230,          // m
  harpoonCloseMax: 6,         // s at most the harpoon window waits for Winch's truck to close to range before it starts to run down
  ripSeconds: 1.5,            // s of full-throttle pull to tear a band off
  ripIdle: 0.25,              // rip rate with no pull at all (never a softlock)
  surgeSpeed: 52,             // m/s the debris wall expands
  surgeRadius: 235,           // m it reaches
  dmgSurge: 18,
  inputBuffer: 0.15,          // s an early press is remembered
  startLead: 330,             // m the storm is ahead at the rolling start (STORMS[].lead overrides): about 5 s to the danger zone
  calloutRead: 0.6,           // s a callout is up before anything but a more urgent one may replace it
  seatNoteSeconds: 1.8,       // s the coach line gives the reason for a seat change the game made, then as long again for how to take the wheel back
  seatWait: 2.5,              // s at most the automatic GUNS swing waits for something you are dodging to land
  calloutStale: 2.4,          // s a beat may wait behind threats before it is old news and dropped
  seatQuiet: 0.8,             // s after any seat change before the storm throws again: the swing and the guard are not a window to hit you in
  rangingWide: 12,            // m: the storm's first throw holds this far to the side of the truck all the way down: outside the 7.5 m it hits, inside the 18 m that counts as a near miss
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
  gunWreckRange: 250,         // m: wreckage can be engaged as soon as it leaves the funnel. Times the rig's gun range (RIGS[].gun.range): the Bulldog 212, the Whippet 325 (all 250 until 2.13, when only the crew's cover used the range)
  gunSatMul: 0.1,             // bullets barely mark a satellite twister: that is a rocket's job
  wreckHp: 45, wreckHpBig: 80, // what it takes to shoot a bale, or a tractor, out of the air (a tractor was 170 until 2.11: 2.8 s of perfect fire against 1.9 s in the air, so with the rack empty armour was a hit you could do nothing about)
  crewGunShare: 0.75,         // the crew covering you at the wheel shoot at three quarters of the rate you do
  gunnerAir: 0.3,             // s longer a thrown piece is in the air while you are on the gun: shooting it down is the only answer there
  gunnerMercy: 4,             // s after a hit on the gun before the storm throws again: no chains of hits you could not dodge (Agnes throws every 3 s there)
  threatMargin: 1.3,          // a piece that will land within this many of its own radii of where the truck will be is marked as a hit coming
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

// ---- the results screen: a letter per fight (src/grade.js). Destroying the storm earns one; each part is 0..1, weighted ----
// Calibrated by tests/fullfight.mjs (2.11, on the corrected test clock) and by fights played through real input on the live
// build. A clean fight by a gunner who never misses is par and grades S (Pete 46 s, Agnes 76, the Sisters 79); with a hit
// or two it is an A. A thumb fitted to the real-input fights (70% accuracy) grades A or B; a rougher one that never touches
// the rockets, B or C. Three real first wins of Skinny Pete (68 to 112 s, 12 to 52 hull left) graded C, D, D on the 2.10 scale.
export const GRADE = {
  weights: { time: 0.35, hull: 0.25, acc: 0.15, crits: 0.15, close: 0.1 },
  par: { pete: 45, agnes: 78, sisters: 80 }, // s: full marks for time at par (a clean fight by a gunner who never misses), none at timeZero times par. (40, 72, 75 until 2.11: measured on a test clock that ran wreckage ahead of the truck; no played fight reached them)
  timeZero: 3,                              // (2.2 until 2.11: a 90-second first win of Skinny Pete scored nothing for time)
  accZero: 0.2, accFull: 0.85,              // share of turret rounds that hit something you can hurt (nothing below 0.3 until 2.11)
  // the share of turret rounds that were critical (the seam on a band, dead centre on wreckage), for full marks. A share, not a
  // count (Pete 170, Agnes 360, the Sisters 275 until 2.13): a count graded the Bulldog's minigun about 1.4 times the Mule's for
  // the same aim, and the Whippet's cannon half of it. Set from fights on the 2.13 build so the thumb gunner on the Mule keeps
  // the share of these marks it had (Pete 25% of rounds critical, Agnes 66%, the Sisters 33%); a sharp one is over all three.
  // Agnes's seam is the biggest target of the three
  crit: { pete: 0.55, agnes: 0.85, sisters: 0.6 },
  close: 5,                                 // near misses for full marks (8 until 2.11: a near miss is a dodge at the wheel, and most of a fight is on the gun)
  letters: [['S', 90], ['A', 75], ['B', 55], ['C', 25], ['D', 0]], // (B from 60 and C from 45 until 2.11)
  share: { accGood: 0.75, accOk: 0.45, hullOk: 25 }, // the share text's squares: the turret's accuracy on a band, hull lost at the wheel
};

// ---- the grain elevator, a set piece on the road (src/setpiece.js) ----
export const SETPIECE = {
  chance: 0.34,        // share of fights that get one (the Daily Storm's seed decides on its days); never the first, coached storm
  after: 12,           // s into a fight before it can come: the first minute belongs to the ranging shot and the zone
  minSpeed: 30,        // m/s: you are driving, not parked
  align: 0.85,         // you are running along the road (cos of the angle), not crossing it
  hailClear: 12,       // s: never with a hail core, nor one this close to arriving
  forceAfter: 10,      // s at the wheel with no road to stand it on: the line you are driving will do
  ahead: 300,          // m down the road it stands when it is placed
  armLimit: 14,        // s it waits for you; then it stands where it is, inert
  pass: 60,            // m off the road, on its own side, that the storm is turned to pass the elevator
  creakRange: 90,      // m: the storm this close and it starts to go (or you four seconds out)
  creakMax: 6,         // s of creaking at most before it goes
  tele: [1.25, 1.7, 2.15], // s of warning for each piece, in sequence: never under 1.2
  fallSeconds: 0.45,   // s from leaning to lying, the last part of each piece's warning
  spacing: 20,         // m between the three pieces along the road
  width: 11,           // m: each piece's strip along the road
  lane: 6,             // m of road left clear on the storm's side: the escape line
  setback: 20,         // m from the road's edge to the elevator's foot, on the far side (27 m tall beside a gravel road, 32 beside the highway)
  dmg: 22, fling: 26,  // a piece landing on you
  rubble: 8,           // s the pieces lie across the road
  rubbleDrag: 0.55,    // share of speed kept driving over one
  give: 0.6,           // boost back for a clean escape, as the debris wall
};

// ---- the power lines, the second set piece (src/setpiece.js). What is not here is SETPIECE's: when it may come, where it
// stands, the storm's pass, the creak, the fall, the rubble's 8 s and the 60% back. Never in the same fight as the elevator ----
export const POWERLINES = {
  chance: 0.2,         // share of fights that get the power lines instead (one draw decides: elevator under 0.34, lines under 0.54)
  count: 6,            // poles, falling in sequence down the road ahead of you
  spacing: 26,         // m between them
  width: 5,            // m: each pole's strip along the road (its crossarm)
  lane: 6,             // m of road left clear on the storm's side: the escape line, the same as the elevator's
  setback: 5,          // m from the road's edge to the poles, on the far side
  tele0: 1.25,         // s of warning for the first pole; each one after lands as you would reach it at the speed you came in at
  paceMin: 40, paceMax: 90, // m/s: that speed, kept within this (a pole every 0.29 to 0.65 s; never less warning than the first)
  dmg: 16, fling: 20,  // a pole landing on you: a piece of debris, not a building
  rubbleDrag: 0.8,     // share of speed kept driving over a downed pole
};

// ---- the harpooned storm: restrained, not tamed (src/tether.js). Each storm's own reach is STORMS[].tether ----
export const TETHER = {
  // one lunge of each kind. Seconds; coil is how far the base digs in the other way first (share of the reach), lean how far
  // the top leans into it (the funnel's lean units), writhe how much harder the funnel twists, tension how hard the line pulls (>1 straining)
  tiers: {
    restless:   { windup: 0.22, lunge: 0.3, hold: 0, recoil: 0.55, coil: 0.15, lean: 0.06, writhe: 0.15, tension: 0.55 },
    aggressive: { windup: 0.95, lunge: 0.34, hold: 0.12, recoil: 1.05, coil: 0.14, lean: 0.26, writhe: 0.7, tension: 1.25 },
    violent:    { windup: 1.45, lunge: 0.42, hold: 0.28, recoil: 1.4, coil: 0.2, lean: 0.45, writhe: 1.25, tension: 1.5 },
  },
  // the line's 15 seconds in three acts, by seconds of line left. weights: restless, aggressive, violent (a draw each time it
  // rests); rest: the pause after a lunge (s); gap: the least time between two dangerous lunges (s)
  acts: [
    { from: 10, weights: [0.8, 0.2, 0], rest: [0.45, 1.0], gap: 2.0 },          // learn it: mostly restless, the odd lunge
    { from: 5, weights: [0.5, 0.36, 0.14], rest: [0.25, 0.6], gap: 1.5 },       // it means it now
    { from: -1, weights: [0.15, 0.5, 0.35], rest: [0.15, 0.4], gap: 0.6 },       // the line is going: never impossible
  ],
  opening: 1.4,        // s of shivering only once the hook lands, then the first lunge, wide of the bus
  agitRate: 0.8,       // 1/s: how fast the shiver and the strain build between acts
  jitterMax: 1.6,      // the restless shiver grows to this many times its size by the last act
  shiverLean: 0.03, writheAgit: 0.3,
  tensionRest: 0.35, tensionAgit: 0.35, tensionFray: 0.9, slack: 0.55,
  reach: 12,           // m outside the wall: a lunge that lands this close to the bus is a threat (marked on the ground, called out)
  safety: 6,           // m: how far outside the wall a lunge is pulled short of a bus that cannot get out of the way
  pullRate: 45,        // m/s: how fast a lunge already coming is pulled short (eased: the funnel never jumps)
  hitPad: 3,           // m outside the funnel's wall the bus is hit
  nearRange: 60,       // m outside the ring: closer than this and it gets angrier (shorter breathers, more dangerous lunges)
  nearGap: 0.6, nearFury: 3, // at the ring: the breather is this share shorter, dangerous lunges this much likelier
  mercy: 2.6,          // s after the bus is hit, or DOROTHY is set down, that nothing is aimed its way
  satGuard: 34,        // m: a satellite twister this close to the bus and the main funnel lunges away from it
  shake: [0, 3.5, 6],  // camera shake as a lunge goes, close up (none in calm mode)
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
    // harpooned: the teacher. Small lunges, long warnings, long breathers. Metres of reach, and multipliers on TETHER
    tether: { jitter: 1.5, restless: 3, aggressive: 9, violent: 17, windup: 1.2, rest: 1.35, fury: 0.7 },
  },
  {
    id: 'agnes', name: 'Big Agnes', ef: 3, type: 'Wedge', bands: 3, stageHp: 300, zone: 240,
    blurb: 'Half a mile wide. Turns like a continent. Everything ends up inside her.',
    habit: 'Whole debris fields at once. Suction that grabs from a block away.',
    pay: 110, run: 40, juke: [8, 12], jukeAngle: [0.3, 0.8], lead: 430, // her zone is 240 m: start her further out so the chase still lasts five seconds
    r0: 30, r1: 150, height: 340, suckR: 200, suck: 17, killR: 36, dorothyRange: 175,
    attackEvery: [2.7, 2.3, 1.9], attacks: [['field', 'big', 'debris'], ['field', 'big', 'lightning', 'field'], ['field', 'field', 'big', 'lightning']],
    volley: [2, 2, 3], unlocks: 'bulldog',
    tether: { jitter: 2.5, restless: 5, aggressive: 14, violent: 30, windup: 1.05, rest: 1.1, fury: 0.95 }, // a lot of storm moving a long way
  },
  {
    id: 'sisters', name: 'The Sisters', ef: 4, type: 'Multi-vortex', bands: 3, stageHp: 240, zone: 215,
    blurb: 'Never travels alone. They split, they close, they cut you off.',
    habit: 'Satellite twisters sweep the ground around her. Fast.',
    pay: 180, run: 54, juke: [3.5, 6], jukeAngle: [0.6, 1.6],
    r0: 16, r1: 96, height: 320, suckR: 130, suck: 13, killR: 20, dorothyRange: 145,
    attackEvery: [2.9, 2.5, 2.1], attacks: [['debris', 'lightning', 'crosswind'], ['debris', 'big', 'lightning', 'crosswind'], ['field', 'big', 'lightning', 'debris']],
    volley: [2, 2, 3], satellites: [3, 4, 5], unlocks: 'whippet',
    tether: { jitter: 2, restless: 4, aggressive: 12, violent: 24, windup: 1, rest: 0.95, fury: 1.1 }, // the angriest; her satellites keep circling the anchor
  },
];

export const RIGS = [
  { id: 'mule', name: 'The Mule', blurb: 'A lifted farm pickup with a machine gun. Balanced: the reach and the punch the other guns are measured against.', price: 0,
    gun: { name: 'Machine gun', dps: 1, range: 1, every: 0.085, sound: 'mg' },
    speed: 1.0, accel: 1.0, turn: 1.0, hull: 1.0, resist: 1.0, boost: 1.0, body: '#e0662b', trim: '#f3ecd8', len: 4.8, wid: 2.2, hgt: 1.1 },
  { id: 'bulldog', name: 'Bulldog', blurb: 'An armoured wedge with a minigun: 35% more damage, but it reaches wreckage 15% less far. Most hull, shrugs off the wind, turns like a barn.', price: 260, needs: 'agnes',
    gun: { name: 'Minigun', dps: 1.35, range: 0.85, every: 0.045, sound: 'minigun' },
    speed: 0.9, accel: 0.85, turn: 0.82, hull: 1.6, resist: 0.55, boost: 0.9, body: '#4f6b54', trim: '#ffc531', len: 5.4, wid: 2.6, hgt: 1.5 },
  { id: 'whippet', name: 'Whippet', blurb: 'A stripped prerunner with an autocannon: slow, heavy shots that reach wreckage 30% further, for 10% less damage. Fastest, made of paper.', price: 320, needs: 'sisters',
    gun: { name: 'Autocannon', dps: 0.9, range: 1.3, every: 0.2, sound: 'cannon' },
    speed: 1.13, accel: 1.25, turn: 1.2, hull: 0.7, resist: 1.25, boost: 1.35, body: '#2f8f9a', trim: '#f3ecd8', len: 4.2, wid: 2.0, hgt: 0.8 },
];

export const CREW = [
  { id: 'doc', name: 'Doc Vane', role: 'Scientist', ride: 'Science bus · Dorothy', perk: 'DOROTHY weakens the storm further, and you get 3 more seconds for the kill shot.',
    barks: { start: 'It is doing a hundred and climbing. I was right. Note that I was right.', seat: 'You drive. Right to its foot. Closer than you think is sensible.', probe: 'The swarm is away! Reading it now!', snap: 'Structure is gone! It is coming apart!', hurt: 'That was not in the model!', win: 'Textbook. My textbook.' } },
  { id: 'winch', name: 'Winch Okafor', role: 'Harpooner', ride: 'Harpoon truck', perk: 'More time to land the harpoon, and the line holds 2 seconds longer.',
    barks: { start: 'Cable is greased. Do not embarrass it.', seat: 'My truck, my cable. Put it in the bright part.', probe: 'Sensors away.', snap: 'She let go! Floor it!', hurt: 'Easy on my rig!', win: 'Steel beats weather. Every time.' } },
  { id: 'sparks', name: 'Sparks Marín', role: 'Engineer', ride: 'Rocket truck · kill shot', perk: 'The hull slowly repairs. Boost recharges 35% faster.',
    barks: { start: 'Everything is technically finished.', seat: 'One rocket. I only had parts for one. Make it count.', probe: 'Launcher worked! Write that down!', snap: 'Ha! Did you hear that?', hurt: 'I can fix that. Probably.', win: 'Nothing fell off. Nothing important.' } },
  { id: 'june', name: 'June Bug', role: 'Gunner', ride: 'Your rig · turret', perk: 'Guns reach 30% further and hit harder. 20% more Data.',
    barks: { start: 'Guns are hot. Nobody tell my mom.', probe: 'It ate it! It totally ate it!', snap: 'Data everywhere! Grabbing it!', hurt: 'Incoming! I said incoming!', win: 'Best. Tuesday. Ever.' } },
];

// Doc's science bus, when you are the one driving it: heavy, steady, hard to push around
export const BUS = { id: 'bus', name: 'Science bus', gun: { name: '', dps: 0, range: 1, every: 1, sound: 'mg' }, speed: 0.92, accel: 1.05, turn: 0.88, hull: 1, resist: 0.45, boost: 1, body: '#d9cfae', trim: '#3d7f86', len: 6.8, wid: 2.4, hgt: 1.5 };

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
