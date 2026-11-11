# TORNADO HUNTER: Game Design

*Design of record. Version 2.2: the chase-combat overhaul in five phases. Tuning numbers live in `src/config.js`.*

---

## 0. The one-paragraph game

You drive an overpowered storm truck at 140 mph after a super tornado doing a hundred and jinking like it knows you are there. A fight has five phases:

1. **Chase.** Close on the storm. It throws cars, tractors and barn doors at where you are going; you dodge, and the guns shoot wreckage out of the air.
2. **Guns.** Get inside the storm's danger zone and stay there. In the zone the guns work on the storm itself until it weakens.
3. **Harpoon.** Hook the weakened storm. It is dragged from a hundred miles an hour to a crawl.
4. **DOROTHY.** Send the sensors. The camera leaves the truck and rides with them as they are sucked round and up the funnel; the truck drives itself. The storm weakens further and its core goes critical.
5. **Kill shot.** One rocket. The camera rides with it.

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
| **1 Chase** | Close the gap. Roads are faster; fields are the shortcut. The storm jukes every few seconds and throws wreckage; the guns shoot it down, you steer off the magenta circles. A ring on the ground marks the danger zone. | 5 to 15 s each time |
| **2 Guns** | Inside the zone (185 to 240 m, by storm) the ring turns green and the guns go to work on the storm. The strength bar drains. BURST pours it on for 2.6 s. Wreckage still comes first, so the more it throws the slower it weakens. | 12 to 30 s per band |
| **Outer bands** | A band shot off bursts, a wall of debris rolls out for you to outrun, the storm bolts. Back to phase 1. | 8 to 12 s |
| **3 Harpoon** | The last band gone to gunfire, the storm is WEAKENED for 7 s. The button reads HARPOON. Hooked, it crawls, and holds for 8 s. | 1 to 7 s |
| **4 DOROTHY** | The button reads DOROTHY. The camera cuts outside the funnel and follows the sensors up it for 3.4 s; the truck circles on its own and cannot be hurt. The funnel thins and the core glows. | 3.4 s |
| **5 Kill shot** | The button reads KILL SHOT; you have 8 s. One rocket, followed by the camera, and the storm comes apart: slow motion, explosions up the column, the sky tears open to blue. | 1 to 3 s |

Simulated fight lengths for a tidy player: Skinny Pete about 55 seconds, The Sisters about 80, Big Agnes about 95. A person will take longer.

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
| **The rig's gun** | the crew, automatically; you call BURST | shoots incoming wreckage out of the air; inside the danger zone, weakens the storm | wreckage always comes first; nothing reaches the storm from outside the zone |
| **Shotgun** | the crew, automatically | the last-second save: blasts whatever is about to hit you, and clears wrecks off the road | 22 m range, 4 s between shots |
| **Harpoon** | you (phase 3) | hooks the weakened storm and drags it to a crawl | only on a weakened storm; 7 s window |
| **DOROTHY** | you (phase 4) | sensors sucked up the funnel weaken it further and turn the core critical | only on a hooked storm |
| **Rocket launcher** | you (phase 5) | the kill shot | one job, one shot |

**Each rig mounts a different gun.** The Mule's machine gun is the all-rounder. The Bulldog's minigun does 35% more damage but reaches 15% less far, so it has to sit deeper in the zone. The Whippet's autocannon fires slow, heavy shots from 30% further out. They sound and look different.

**Not built yet:** COLD FRONT (briefly stops the storm juking) and CORKSCREW (an alternative to rockets for a rotating core). Both are designed as swaps for the DOROTHY slot and wait until the core loop has been played by people.

| | |
|---|---|
| **Fun** | The guns hammering away while you thread wreckage inside the zone; the storm slamming to a crawl on the hook; watching DOROTHY go up it; the rocket. |
| **Could frustrate** | A game that plays itself; losing control during a cinematic; guns that seem to do nothing because you are outside the zone. |
| **Simplified** | Two buttons. The zone is a ring on the ground that changes colour, and the coach line counts the metres. The cinematic is short and you cannot be hurt during it. The guns fire themselves; where the truck is decides what they can hit. Getting into the zone, staying in it, calling the burst, the harpoon, DOROTHY and the kill shot are yours. |

---

## 5. Controls and HUD

**Landscape iPhone, two thumbs, two buttons.**

- **Left thumb, anywhere on the left half:** hold to drive, slide to steer, pull back to brake. Pull back *while* steering to drift.
- **Right thumb:** BOOST, and one large button that is always the next thing to do: BURST, then HARPOON, then DOROTHY, then KILL SHOT.
- **Keyboard:** WASD or arrows, Space for the action button, Shift boost, Esc or P pause.

**HUD.** Left: hull, and your speed in mph. Centre: the storm's name, its speed, a pip per band, and one bar: the storm's strength while the guns work on it, then the countdown for whichever step comes next (weakened, hooked, critical). The plate's border turns green while you are inside the danger zone. During the DOROTHY and kill-shot shots the controls fade out. Under it, one line of coaching for this moment. Right: data and pause. The bottom centre of the screen is kept empty because that is where your truck is.

Checked at 667×375, 844×390 and 932×430: nothing overlaps, every target is at least 44 px, no text under 12 px.

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
- **Satellite twisters** (The Sisters), each marked on the ground.

Every one of these is announced before it lands. Nothing does damage without a telegraph of at least 0.9 seconds.

Everything is pooled: 16 thrown objects, 28 tracers, 4 rockets, 72 dust sprites, 10 flashes. Weak GPUs get a lower-detail tier automatically.

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

The rest of the crew follow in a camper truck and a converted bus. They are company, not units to command.

Upgrades (Data): Winch (the line holds longer), Ordnance (guns hit harder, BURST recharges faster), Plating (hull), Turbo (boost).

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
| A third button | removed | one action button that is always the next step, plus boost |
| Manual aiming | never added | two thumbs are driving; positioning and timing are the aim |
| Pistol, rifle, sniper, grenade launcher, minigun | postponed | four weapons that each do a different job beat eight that differ by a number |
| COLD FRONT, CORKSCREW | postponed | designed, not built: wait for people to play the core loop |
| New regions, cosmetics, achievements | not started | the brief ruled them out until the core is fun |

---

## 10. Technical notes

Three.js on WebGL2, plain ES modules, no build step, offline from the Home Screen. The overhaul reused the terrain, sky, props, rigs, convoy, funnel shader, audio synthesiser, input layer, save format and menus. The mission rules (`src/combat.js`) were rewritten; the driving model, HUD and effects were extended.

```
src/config.js    every tuning number, storms, rigs, crew
src/combat.js    the mission: storm AI, wreckage, guns, DOROTHY, rockets, harpoon, surge
src/rig.js       the truck: model, handling, drift, boost
src/tornado.js   funnel, bands, debris, skirt (shaders)
src/fx.js        pooled wreckage, tracers, rockets, explosions, telegraphs, cable
src/convoy.js    the camper truck and the bus
src/world.js     terrain, ground texture, roads, towns, props
src/sky.js       sky dome, wall cloud, rain, light
src/audio.js     synthesised engine, wind, guns, explosions
src/hud.js       in-mission HUD     src/ui.js   title, headquarters, results
src/main.js      boot, camera, frame loop, resolution governor
```

**Saves.** Same key and shape as version 1 (`tornado-hunter/v1`). Data, kills, owned rigs, upgrades and crew carry over. The `winch` and `cable` upgrade levels keep their value and now mean "the line holds longer" and "ordnance".

---

## 11. Roadmap

| Phase | Goal |
|---|---|
| **Now** | People play it on real iPhones and answer the questions below |
| **Feel pass** | Tune speeds, drift, wreckage rate and rocket reload from that play; haptics; recorded audio where synthesis falls short |
| **Second technology** | COLD FRONT and CORKSCREW as swaps for the DOROTHY slot |
| **Set pieces** | Scripted chaos tied to the map: a grain elevator coming down across the highway, power lines falling in sequence |
| **The wingman** | The convoy joins the fight: a second gunner, a second harpoon |
| **New country** | A river valley with bridges; a town-edge region |

---

## Questions only a person can answer

1. With the storm out of frame, is the truck fun to drive on its own?
2. Does catching the tornado feel like something you did, or something the game allowed?
3. Could you tell what was about to hit you in time to do something about it?
4. Was holding the danger zone while the guns worked tense, or just waiting?
5. Harpoon, DOROTHY, kill shot: did that finale feel like the best moment of the fight? Was losing control during the DOROTHY shot welcome or annoying?
6. Did you start the next storm without being asked?
