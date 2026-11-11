# TORNADO HUNTER: Game Design

*Design of record. Version 2.4: five phases, a crew member and a vehicle for each, and weather. Tuning numbers live in `src/config.js`.*

---

## 0. The one-paragraph game

You drive an overpowered storm truck at 140 mph after a super tornado doing a hundred and jinking like it knows you are there. A fight has five phases:

1. **Chase (the wheel).** Close on the storm. It throws cars, tractors and barn doors at where you are going; you dodge, and the crew shoot wreckage out of the air.
2. **Guns (the turret).** Cross into the storm's danger zone and you are on the gun, first person, while the truck drives itself. You aim and you fire: the machine gun on the band, rockets for anything armoured. Whatever you do not shoot down lands on the truck.
3. **Harpoon (Winch's truck).** The camera swings across to the harpoon truck. Lock the launcher on the glow and hook the weakened storm. It is dragged from a hundred miles an hour to a crawl.
4. **DOROTHY (Doc's bus).** Across to the science bus. Pull the lever and release the swarm: eighty green sensors. The camera leaves the truck and rides with them as they are dragged in, sucked round and up, and keep swirling inside the funnel until it dies; the truck drives itself. The storm weakens further and its core goes critical.
5. **Kill shot (Sparks' rocket truck).** Across again. Hold the launcher on the glowing core until it locks. One rocket. The camera rides with it.

Every phase belongs to someone. The chase and the turret are your rig, with June Bug. The finale is three hand-offs in a row, a vehicle each, and you sit in each seat in turn.

**Driving feels like driving and shooting feels like shooting** because they are never the same moment: one seat at a time, one swing of the camera between them.

Bigger storms shed their outer bands to gunfire first: each one answers with a wall of debris and a bolt, and you chase again. Phases 3 to 5 happen once, on the last band, as the finale.

The storm is not a target dummy. It is a 150-mph natural disaster with an attitude.

---

## 1. Why version 1 was replaced

Version 1 was built around a tether fight: probe, harpoon, then orbit the funnel on a cable against its spin until a band wound off. It was inventive and it worked. Real player feedback said it was not fun: **it felt like hitting a moving target, a targeting puzzle rather than a chase.** That is a fair reading. The player spent most of a fight holding a precise ring at a precise tension, and the storm walked at 15 mph.

What changed in principle:

| | Version 1 | Version 2 |
|---|---|---|
| The storm | walks toward a town | runs at 100 to 150 mph and jukes |
| The player's main verb | hold a ring at the right tension | drive flat out and keep up |
| Damage | orbit against the spin for 12 to 20 seconds | guns, from inside the danger zone |
| The harpoon | the whole fight | phase 3: it stops the storm for DOROTHY and the kill shot |
| Guns | none | each rig's own gun on automatic with a BURST you call, a shotgun for last-second saves, one rocket for the kill |
| Failure pressure | a town timer | wreckage, lightning, crosswinds, the funnel itself |

Kept from version 1: the three storms and their names, the bands as the storm's visible structure, the rigs, the crew, the convoy, the art direction, the audio approach, save data.

---

## 2. The loop

**HUNT → CHASE → SURVIVE → ATTACK → ESCAPE → REENGAGE → DESTROY**

| Beat | What happens | Typical length |
|---|---|---|
| **Hunt** | A rolling start: you are already doing 90 mph on a road, the funnel 330 m ahead and running. | 5 s |
| **1 Chase** | At the wheel, third person. Close the gap. Roads are faster; fields are the shortcut. The storm jukes every few seconds and throws wreckage; the crew shoot it down, you steer off the magenta circles. A ring on the ground marks the danger zone. | 5 to 15 s each time |
| **2 Guns** | Crossing into the zone (185 to 240 m, by storm) swings the camera onto the turret in a third of a second and the autodrive takes the truck. You shoot the band: the strength bar drains, the band cracks at two thirds, fails at one third, breaks. The storm keeps throwing, and on the gun the sky is your job. DRIVE takes the wheel back at any time. | 10 to 25 s per band |
| **Outer bands** | A band shot off bursts and you are back at the wheel: a wall of debris rolls out for you to outrun, the storm bolts, two rockets are handed up. Back to phase 1. | 8 to 12 s |
| **3 Harpoon** | The last band gone to gunfire, the storm is WEAKENED for 7 s and the camera swings to Winch's harpoon truck, which closes to range and holds. Keep the launcher on the glow for 0.4 s, LOCKED, fire. Hooked, the storm crawls, and the line holds for 8 s. | 1 to 7 s |
| **4 DOROTHY** | Across to Doc's bus, the canisters racked in front of you. One button, no aiming: DOROTHY. The camera cuts outside the funnel and follows the sensors up it for 3.4 s; the truck circles on its own and cannot be hurt. The funnel thins and the core glows. | 3.4 s |
| **5 Kill shot** | Sparks' rocket truck, launcher up, you have 8 s. Hold the reticle on the glow for 0.4 s: LOCKED. One rocket, followed by the camera, and the storm comes apart: slow motion, explosions up the column, the sky tears open to blue. | 1 to 3 s |

Simulated fight lengths: a gunner who never misses the seam takes Skinny Pete in about 45 seconds, The Sisters and Big Agnes in about 90. A gunner who never misses takes no damage on the gun at all. One who lags the target and never touches the rockets takes Pete in about 65 seconds with a third of the hull left, and is a coin toss on the last band of the two big storms: they want the rockets and the wheel. A person will take longer.

### Seats and how you change them

| | |
|---|---|
| **Scripted** | Crossing into the danger zone puts you on your own gun. A band shot off puts you back at the wheel. The storm weakened puts you on Winch's harpoon truck, the hook puts you on Doc's bus, a critical core puts you on Sparks' rocket truck. Miss a window and you are back at your own wheel. |
| **Manual** | GUNS (the action button during a chase) takes the turret anywhere, and the autodrive closes the range for you, slower than you would. DRIVE gives the wheel back; it stays yours for at least four seconds, and until you leave the zone and come back in. |
| **The swing** | 0.3 s to your own gun, 0.45 s across to another vehicle, measured from the truck so the world never stops moving. The plate that shows your speed shows whose seat it is instead (WINCH · HARPOON TRUCK), and its owner says a line. No cut, no fade, no loading. Cuts are kept for the two cinematics. Calm mode shortens it to 0.1 s. |
| **Nothing carries over** | Every finger and key held through a change is dropped, and the new seat ignores input for a third of a second: the thumb that pressed GUNS does not fire, the thumb that was aiming does not steer. |

### Autodrive

It holds the truck at 70% of the danger zone's radius: straight at the storm when it is far, alongside it at range, wide and off the throttle when it is close. It merges onto a road that runs its way, steers round buildings, trees, wrecks and satellite twisters, backs out if it is wedged, and never uses more than 92% of top speed or the boost. It does not dodge what the storm throws. That is the gunner's job, or a reason to take the wheel.

The storm is a little kinder to a truck that cannot weave: it throws about 30% less often, a debris field is the two pieces that would have hit rather than four with a gap, and its lightning trails a truck at speed. In exchange the crew's shotgun reloads 60% slower.

Miss the harpoon window and the storm recovers 40% of its strength; let the line go before the kill shot and it recovers 50%. A mistake costs seconds, never the fight.

### The first 60 seconds

| Brief asked for | Where it happens (simulated, seconds into the mission) |
|---|---|
| Immediate high-speed pursuit | 0: rolling start at 90 mph |
| A clearly visible super tornado | 0: 330 m ahead, 310 m tall |
| A satisfying boost | 0 to 3: boost is charged at the start and the coach line asks for it |
| A dramatic environmental hazard | 3 to 7: first wreckage thrown |
| Automated gunfire | 3 to 5: guns open up on it |
| A near miss or recoverable mistake | 4 to 20: first close call or first hit |
| A meaningful combat action | 5 to 7: inside the danger zone, first BURST |
| A storm reaction that changes the chase | 19 to 23: first band shot off, debris wall, bolt |

---

## 3. Driving

Driving is the game. If it is not fun with no storm on screen, nothing else matters.

| | Value | Why |
|---|---|---|
| Top speed, road | 64 m/s (143 mph) | faster than every storm |
| Top speed, field | 53 m/s (119 mph) | shortcuts cost speed, never the chase |
| Boost | ×1.38 for 2.2 s (197 mph) | recharges in 5 s, or sooner if you earn it |
| Acceleration | 34 m/s² off the line, tapering | you feel fast long before top speed |
| Drift | brake while steering above 45 mph | the nose swings in, the truck keeps its speed, the line bends to follow |
| Collisions | fences, bales, signs, trees: you go through them and lose a little speed. Buildings stop you and cost a little hull. | predictable and recoverable |

**Boost is earned.** A near miss returns 30% of a charge, a piece of wreckage shot down 12%, a held drift 22% a second, a clean escape from the debris wall 60%. Driving well and close to danger keeps you fast.

**Speed you can feel.** The camera drops and tucks in as you accelerate and the lens widens by up to 16 degrees (more on boost). Rain streaks stretch back along your own velocity. Dust pours off the wheels, more in a slide. The engine note and a rush of air track speed. There is a speedometer and it reads in miles an hour.

**Keeping the chase alive.** The storm's speed bends with distance. Beyond about 430 m it idles at half speed so you always catch up; inside 100 m it finds another 10% so you never simply sit on it. Beyond 170 m it is capped just under your rig's off-road top speed, so no storm can leave you across open country.

| | |
|---|---|
| **Fun** | Flat out across a wheat field with a tornado filling the windscreen and a tractor landing where you were a second ago. |
| **Could frustrate** | Losing the storm; clipping a tree and stopping dead; a drift that spins you. |
| **Simplified** | Rubber-banded storm speed. Everything short of a building is smashable. The drift caps its own slip angle. Touch is still hold-to-drive, slide-to-steer. |

---

## 4. The arsenal

Protecting the truck and hurting the storm are different jobs done by different weapons. Bullets do not kill tornadoes.

| Weapon | Who fires | Job | Limits |
|---|---|---|---|
| **The rig's gun** | you, on the turret (hold FIRE). At the wheel the crew fire it at wreckage only, at three quarters of your rate | weakens the band; shoots wreckage out of the air | nothing reaches the storm from outside the zone; bullets barely mark a satellite twister |
| **Rockets** | you, on the turret (swap, hold the reticle on a target 0.4 s to lock, FIRE) | one rocket ends a car, a tractor or a satellite twister and anything within 17 m of it; takes 18% off a band | 3 in the rack (4 at most), 2 more after every band |
| **Shotgun** | the crew, automatically | the last-second save: blasts whatever is about to hit you, and clears wrecks off the road | 22 m range, 4 s between shots (6.4 s while you are on the gun) |
| **Harpoon** | you, from Winch's harpoon truck (phase 3) | hooks the weakened storm and drags it to a crawl; the line runs from his truck, and your rig is free | only on a weakened storm; 7 s window; needs a lock |
| **DOROTHY** | you, from Doc's science bus (phase 4) | a swarm of sensors, sucked up to swirl inside the funnel, weakens it further and turns the core critical | only on a hooked storm |
| **The kill shot** | you, from Sparks' rocket truck (phase 5) | the launcher, locked on the critical core | one job, one shot; it does not come out of the rack |

### Knowing a shot landed

The old guns fired themselves and it was hard to tell they were doing anything. Now every round answers back, in this order of loudness:

| | You see | You hear |
|---|---|---|
| **A hit** | a cream tick on the reticle, sparks at the impact, the target flashes white | a dry tick (a deeper thump on the storm) |
| **A critical** | a wider amber tick, a white-hot flash and a spray of sparks | a bright two-note ring |
| **A kill** | a green burst on the reticle; the thing comes apart in its own colours, tumbling, with a halo and smoke | a crunch, and an explosion for anything armoured |
| **No effect** | a small grey tick and a word: OUT OF RANGE, or ARMOURED: USE A ROCKET | a dull plink |

Critical hits are something you aim for, not a dice roll: on the storm it is the **seam**, a bright magenta point that drifts back and forth across the face of the band turned toward you (2.2 times the damage); on wreckage it is dead centre.

Damage shows on the target as well as in a bar. Wreckage chars as it is hit, trails smoke from 30% damage and burns from 65%. The band's lit segments go out as it weakens, it turns from wheat to amber under two thirds and flickers magenta under one third, the funnel thins with it, and each threshold is a crack you hear. Under the reticle a small plate names whatever you are hitting and shows what is left of it, cream then amber then magenta; it goes away a second after you stop.

The reticle is the weapon: an open cross for the gun, corner brackets with a ring that closes into a lock for the launcher. It is cream at rest, amber on something you can hurt, magenta on the seam or a lock, grey out of range. Each piece of wreckage in the air carries a magenta bracket (double for armour, flashing in its last 0.8 s), and an arrow on the edge of the screen when it is out of frame.

**Each rig mounts a different gun.** The Mule's machine gun is the all-rounder. The Bulldog's minigun does 35% more damage but sprays. The Whippet's autocannon fires slow, heavy, dead-straight shots. They sound different and you see a different weapon in front of you: a jacketed barrel, six barrels in a turning cage, one long barrel with a slotted brake.

**Cows.** Herds graze the open plains and every farm. The funnel lifts them, every super tornado keeps a few in orbit, and it throws them at you along with the bales and doors. They moo. Shoot them down like any other wreckage.

**Not built yet:** COLD FRONT (briefly stops the storm juking) and CORKSCREW (an alternative to rockets for a rotating core). Both are designed as swaps for the DOROTHY slot and wait until the core loop has been played by people.

| | |
|---|---|
| **Fun** | Riding the seam with the gun while a tractor climbs out of the funnel at you; one rocket taking two pieces of a debris field; the storm slamming to a crawl on the hook; watching DOROTHY go up it; the lock tone and the kill shot. |
| **Could frustrate** | Being taken off the wheel when you wanted it; a thumb that cannot hold a small target; taking hits you could not see coming. |
| **Simplified** | The seat change is scripted at the moments it is obvious and one button otherwise. Touch aiming is helped three ways: targets are half as wide again as they look, the sights slow down on a target, and they ride along with it at half its speed. On the critical core they hold for everyone. The autodrive does the driving, never the dodging. |

---

## 5. Controls and HUD

**Landscape iPhone, two thumbs.** Portrait works too.

At the wheel:

- **Left thumb, anywhere on the left half:** hold to drive, slide to steer, pull back to brake. Pull back *while* steering to drift.
- **Right thumb:** BOOST, and one large button that is always the next thing to do: GUNS, then HARPOON, then DOROTHY.

On the gun:

- **Either thumb, anywhere:** drag to aim. A drag the height of the screen turns the gun about 80 degrees.
- **Right thumb:** hold FIRE (124 px, where the action button was). The thumb on FIRE can slide to aim, so one hand can track and shoot. Beside it ROCKETS / GUN (88 px) swaps weapon and DRIVE (64 px) takes the wheel.

**Keyboard and mouse:** WASD or arrows drive, Space takes the turret, Shift boost. On the gun the mouse aims (click once to capture it) or the arrows do, click or Space fires, Q swaps weapon, F takes the wheel. Esc or P pause.

**HUD.** Left: hull, and your speed in mph (the plate turns green and reads AUTO while the truck drives itself). Centre: the storm's name, its speed, a pip per band, and one bar: the storm's strength while the guns work on it, then the countdown for whichever step comes next (weakened, hooked, critical). The plate's border turns green while you are inside the danger zone. During the DOROTHY and kill-shot shots the controls fade out. Under it, one line of coaching for this moment. Right: data and pause. The bottom centre of the screen is kept empty because that is where your truck is, or your gun. On the gun the centre carries the reticle, the hit marker and the target plate, and nothing else; hail never lands a star in the middle of the lens.

Checked at 667×375, 844×390 and 390×844: nothing overlaps, every target is at least 44 px, no text under 12 px.

---

## 6. The storms

| Storm | Speed | Stages | Temperament |
|---|---|---|---|
| **Skinny Pete** | 100 mph | 2 bands × 230, zone 185 m | Jukes hard and often. Throws singles, then pairs. Crosswinds. Lightning from the second band. The storm that teaches the five phases. |
| **Big Agnes** | 90 mph | 3 bands × 300, zone 240 m | Enormous and slow to turn. Suction reaches 200 m, right where gun range is, so you fight the pull the whole time. Throws whole debris fields across your path with one gap in them. |
| **The Sisters** | 120 mph | 3 bands × 240, zone 215 m | Three to five satellite twisters sweep the ground around her, closing and splitting, inside the range your guns need. Fastest, jukes most. |

Each band you rip makes the storm 6% faster and moves it to a harder attack set. A storm at +1 EF (rematch) has 30% more stability, faster telegraphs and a bigger payout.

The difficulty is what the storm does to you while you hold the zone: the more it throws, the busier the guns are and the longer you have to stay.

---

## 7. Environmental chaos

- **Wreckage** is real objects: hay bales, barn doors, road signs, cars, tractors. It is thrown at where you are heading, corrects in flight, then locks for at least three quarters of a second: that last stretch is yours to dodge. Cars and tractors that land stay on the ground as smoking wrecks for a few seconds.
- **The storm eats the map.** Barns, silos, trees, fences and cattle in its path are lifted, orbited and flung.
- **Crosswinds** are called a second ahead with an arrow, then shove the truck sideways for a second and a half.
- **Lightning** tracks you, locks, strikes.
- **The debris wall** after every rip.
- **Satellite twisters** (The Sisters), each marked on the ground. A rocket takes one down.

Every one of these is announced before it lands. Nothing does damage without a telegraph of at least 0.9 seconds.

### Weather

Two things come and go over a fight. Neither does damage; both change what the next thirty seconds are like.

| | What it does | What it never does |
|---|---|---|
| **Hail** | A core passes over for 10 to 13 s, 20 to 30 s into a fight and every half minute or so after, called out as it arrives (HAIL CORE: LOW GRIP). Stones in the air and bursting on the ground, stars cracking on the lens and fading, a hiss and ticks in the sound. The distance closes in to 42%. Sideways grip drops 30%, so the tail steps out further. | Fog the funnel, the ground markers, the wreckage brackets or the HUD. Put a star in the middle of the picture. Start during the finale. |
| **Lightning** | Strikes out in the country every 6 to 13 s (3.5 to 8 s in hail), round the funnel or somewhere you are looking. One wash of light and a fainter return stroke, a third of a second in all; for that moment the murk is thrown open and whatever was out there shows: the funnel, the wreckage in the air, the next town. Thunder arrives at the speed of sound (a strike 300 m off is heard 0.9 s later) and rolls longer the further off it was. | Land within 150 m of you: that is the storm's own aimed bolt, and it has a marker. Strobe. Flash the whole screen white. |

Calm mode (the pause menu, or the system's reduced-motion setting) cuts the flash to 40% with no return stroke, spaces the strikes out, and thins the stars on the lens.

Everything is pooled, a draw call each: 16 thrown objects, 28 tracers, 44 sparks, 44 pieces of debris, 4 rockets, 4 blast rings, 96 dust sprites, 22 flashes, 520 hailstones, 8 stars on the lens. Weak GPUs get a lower-detail tier automatically, with fewer of most of them.

---

## 8. Crew and rigs

Crew ride in your rig; pick two.

| Crew | Role | Effect |
|---|---|---|
| Doc Vane | Scientist | DOROTHY weakens the storm further; 3 s longer for the kill shot |
| Winch Okafor | Harpooner | more time to land the harpoon; the line holds 2 s longer |
| Sparks Marín | Engineer | hull slowly repairs; boost recharges 35% faster |
| June Bug | Gunner | guns reach 30% further and hit harder; 20% more Data |

Rigs: **The Mule** (balanced), **Bulldog** (most hull, shrugs off suction and crosswind, slow to turn), **Whippet** (fastest, drifts tightest, fragile).

Everyone rolls out, a vehicle each: June Bug on your rig's turret, Winch in the harpoon truck, Doc in the science bus with DOROTHY racked on the roof, Sparks in a camper with a rocket pod bolted to it. They flank you on the chase and hang back from the funnel. You never command them; when a phase is theirs you take their seat, and that vehicle closes to range and holds still while you work. The two you pick lead: their perks apply.

Upgrades (Data): Winch (the line holds longer), Ordnance (guns hit harder, one more rocket in the rack), Plating (hull), Turbo (boost).

---

## 9. What was cut or postponed, and why

| | Decision | Reason |
|---|---|---|
| The orbit-against-the-spin tether fight | removed | it was the targeting puzzle |
| The town timer | removed | a second clock on top of a chase is noise; the danger is now physical |
| Ground Anchor and Thumper gadgets | retired | they served the tether fight. Old saves that own them still load; the slot is simply unused |
| Drive-through-the-eye finisher | replaced by the final kill shot | one spectacular ending, earned by the same move as the other bands |
| Floor-it-to-rip harpoon (version 2.0) | replaced | the harpoon now slows the storm and sets up the rocket kill shot, as the player asked |
| Rockets as the main damage (versions 2.0, 2.1) | removed | the player asked for guns to do the weakening and the rocket to be the kill shot only |
| DOROTHY as an opener or optional booster (2.0, 2.1) | moved | it is now phase 4: after the harpoon, as a cinematic, before the kill shot |
| Guns that fire themselves (2.0 to 2.2) | replaced | it was hard to tell they were doing anything, and the fight was mostly waiting inside a ring. The crew still cover you at the wheel; the storm only falls to you on the turret |
| BURST | removed | with the trigger in your hand there is nothing for it to do |
| Driving and aiming at once | never added | two thumbs cannot do both well on glass. One seat at a time, and an autodrive for the other |
| Pistol, rifle, sniper, grenade launcher, minigun | postponed | four weapons that each do a different job beat eight that differ by a number |
| COLD FRONT, CORKSCREW | postponed | designed, not built: wait for people to play the core loop |
| New regions, cosmetics, achievements | not started | the brief ruled them out until the core is fun |

---

## 10. Technical notes

Three.js on WebGL2, plain ES modules, no build step, offline from the Home Screen. The overhaul reused the terrain, sky, props, rigs, convoy, funnel shader, audio synthesiser, input layer, save format and menus. The mission rules (`src/combat.js`) were rewritten; the driving model, HUD and effects were extended.

```
src/config.js    every tuning number, storms, rigs, crew
src/combat.js    the mission: storm AI, wreckage, the two seats, DOROTHY, harpoon, surge
src/gunner.js    the turret: aim, hits and criticals, rockets and lock-on, autodrive, the weapon you see
src/weather.js   hail cores and ambient lightning
src/rig.js       the truck: model, handling, drift, boost
src/tornado.js   funnel, bands, debris, skirt (shaders)
src/fx.js        pooled wreckage, tracers, sparks, debris, rockets, explosions, telegraphs, cable
src/convoy.js    the camper truck and the bus
src/world.js     terrain, ground texture, roads, towns, props
src/sky.js       sky dome, wall cloud, rain, light
src/audio.js     synthesised engine, wind, guns, explosions
src/hud.js       in-mission HUD     src/ui.js   title, headquarters, results
src/main.js      boot, the three cameras (chase, gun, cinematic) and the swing between them, frame loop, resolution governor
```

**Saves.** Same key and shape as version 1 (`tornado-hunter/v1`). Data, kills, owned rigs, upgrades and crew carry over. The `winch` and `cable` upgrade levels keep their value and now mean "the line holds longer" and "ordnance" (guns hit harder, one more rocket in the rack per level).

---

## 11. Roadmap

| Phase | Goal |
|---|---|
| **Now** | People play it on real iPhones and answer the questions below |
| **Feel pass** | Tune aim sensitivity and assist, wreckage rate, rocket count and the hail from that play; haptics; recorded audio where synthesis falls short |
| **Second technology** | COLD FRONT and CORKSCREW as swaps for the DOROTHY slot |
| **Set pieces** | Scripted chaos tied to the map: a grain elevator coming down across the highway, power lines falling in sequence |
| **The wingman** | The crew vehicles fight on their own between their phases: a second gunner, covering fire |
| **New country** | A river valley with bridges; a town-edge region |

---

## Questions only a person can answer

1. With the storm out of frame, is the truck fun to drive on its own?
2. Does catching the tornado feel like something you did, or something the game allowed?
3. Could you tell what was about to hit you in time to do something about it?
4. On the gun, could you hold the seam with a thumb? Did you ever take the wheel back on purpose, and did being put on the gun ever feel like having it taken away?
5. Harpoon, DOROTHY, lock, kill shot: did that finale feel like the best moment of the fight? Was losing control during the DOROTHY shot welcome or annoying?
6. Did you start the next storm without being asked?
