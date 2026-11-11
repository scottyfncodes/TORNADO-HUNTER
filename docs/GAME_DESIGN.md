# TORNADO HUNTER: Game Design

*Design of record. Version 2.1: the chase-combat overhaul, with the shield, harpoon and kill-shot sequence. Tuning numbers live in `src/config.js`.*

---

## 0. The one-paragraph game

You drive an overpowered storm truck at 140 mph after a super tornado doing a hundred and jinking like it knows you are there. It throws cars, tractors and barn doors at where you are going; your gunner shoots them out of the air and you steer off the rest. The storm is wrapped in a shield of debris. Guns and rockets wear it down until it shatters and the core is bare. You put a harpoon in the bare core, which drags the storm to a crawl. Then one rocket is the kill shot: a band of rotation blows clean off. It answers with a wall of debris you have to outrun, bolts, and you chase it down again. Three bands and it comes apart in the sky.

**Chase. Dodge and shoot. Break the shield. Harpoon it. Kill shot.**

The storm is not a target dummy. It is a 150-mph natural disaster with an attitude.

---

## 1. Why version 1 was replaced

Version 1 was built around a tether fight: probe, harpoon, then orbit the funnel on a cable against its spin until a band wound off. It was inventive and it worked. Real player feedback said it was not fun: **it felt like hitting a moving target, a targeting puzzle rather than a chase.** That is a fair reading. The player spent most of a fight holding a precise ring at a precise tension, and the storm walked at 15 mph.

What changed in principle:

| | Version 1 | Version 2 |
|---|---|---|
| The storm | walks toward a town | runs at 100 to 150 mph and jukes |
| The player's main verb | hold a ring at the right tension | drive flat out and keep up |
| Damage | orbit against the spin for 12 to 20 seconds | rockets into an opened core |
| The harpoon | the whole fight | a two-second finisher you earn |
| Guns | none | a gunner on automatic, a shotgun for last-second saves, rockets on your thumb |
| Failure pressure | a town timer | wreckage, lightning, crosswinds, the funnel itself |

Kept from version 1: the three storms and their names, the bands as the storm's visible structure, the rigs, the crew, the convoy, the art direction, the audio approach, save data.

---

## 2. The loop

**HUNT → CHASE → SURVIVE → ATTACK → ESCAPE → REENGAGE → DESTROY**

| Beat | What happens | Typical length |
|---|---|---|
| **Hunt** | A rolling start: you are already doing 90 mph on a road, the funnel 330 m ahead and running. | 5 s |
| **Chase** | Close the gap. Roads are faster; fields are the shortcut. The storm jukes every few seconds. | most of the fight |
| **Survive** | It throws what it has eaten at where you will be. Magenta circles mark the landing. The gunner shoots it down if there is time; you steer off the circle if there is not. Crosswinds shove you. Lightning tracks you. | continuous |
| **Break the shield** | Stay inside gun range (about 230 m). The gunner chews at the debris shield on his own; your rockets take big bites out of it. The band's ring loses segments as it goes. | 12 to 20 s |
| **Harpoon** | The shield shatters and the core is exposed for seven seconds. Fire the harpoon: the storm is dragged from a hundred miles an hour to a crawl and held for eight. | 1 to 7 s |
| **Kill shot** | The rocket button turns magenta and reads KILL SHOT. One rocket into the hooked storm blows the band off. | 1 to 3 s |
| **Escape** | A wall of debris rolls out from where it stood. Outrun it. | 4 s |
| **Reengage** | It bolts on a new heading with a new attack in its set. Catch it. | 5 to 10 s |
| **Destroy** | The last band takes the funnel with it: slow motion, explosions up the column, the sky tears open to blue. | the payoff |

A whole Skinny Pete fight is about 70 seconds for a tidy player in simulation, Big Agnes about 95, The Sisters about 87. A person will take longer.

If you miss the harpoon window the shield rebuilds to 40%. If the line lets go before the kill shot it rebuilds to 50%. A mistake costs seconds, never the fight.

### The first 60 seconds

| Brief asked for | Where it happens (simulated, seconds into the mission) |
|---|---|
| Immediate high-speed pursuit | 0: rolling start at 90 mph |
| A clearly visible super tornado | 0: 330 m ahead, 310 m tall |
| A satisfying boost | 0 to 3: boost is charged at the start and the coach line asks for it |
| A dramatic environmental hazard | 3 to 7: first wreckage thrown |
| Automated gunfire | 4 to 8: gunner opens up on it |
| A near miss or recoverable mistake | 4 to 20: first close call or first hit |
| A successful heavy attack | 0 to 1: first rocket into the shield; 13 to 16: shield down |
| A storm reaction that changes the chase | 14 to 17: harpoon, kill shot, debris wall and bolt |

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
| **Mounted machine gun** | the gunner, automatically | shoots incoming wreckage out of the air first; otherwise chews at the storm's shield | one target at a time; big wreckage outlasts it; 230 m reach on the storm |
| **Shotgun** | the crew, automatically | the last-second save: blasts whatever is about to hit you, and clears wrecks off the road | 22 m range, 4 s between shots |
| **Rocket launcher** | you (ROCKET) | breaks the shield in big bites; on a hooked storm it is the KILL SHOT | 2.8 s reload, 320 m range |
| **Harpoon** | you (HARPOON, when it appears) | hooks the exposed core and drags the storm to a crawl for 8 s | only once the shield is down, and that window is 7 s |

Each has its own sound (a rattle, a boom with a pump after it, a whoosh and a distant thud, a twang) and its own look (tracers, a spread of tracers and a flash, a smoke trail and a fireball, a cable).

**DOROTHY** is the optional accelerator: a spray of sensor pods fired into the funnel from inside its inflow. While they fly, everything does double damage to the shield. It is the reason to go in close instead of sitting at gun range, and you can win without it.

**Not built yet:** COLD FRONT (briefly stops the storm juking) and CORKSCREW (an alternative to rockets for a rotating core). Both are designed as swaps for the DOROTHY slot and wait until the core loop has been played by people.

| | |
|---|---|
| **Fun** | The gunner hammering away on his own while you thread wreckage; the first rocket into an open core; "HOOKED: FLOOR IT". |
| **Could frustrate** | A game that plays itself; rockets that do nothing with no explanation. |
| **Simplified** | Three buttons. The automatic weapons only *defend*. The gunner helps with the shield, but the rockets that break it, the harpoon and the kill shot are yours. |

---

## 5. Controls and HUD

**Landscape iPhone, two thumbs, three buttons.**

- **Left thumb, anywhere on the left half:** hold to drive, slide to steer, pull back to brake. Pull back *while* steering to drift.
- **Right thumb:** ROCKET (large; it becomes KILL SHOT on a hooked storm), BOOST, and one context button that reads DOROTHY while the shield is up and HARPOON once it is down.
- **Keyboard:** WASD or arrows, Space rocket, E Dorothy or harpoon, Shift boost, Esc or P pause.

**HUD.** Left: hull, and your speed in mph. Centre: the storm's name, its speed, a pip per band, and one bar with three meanings: the shield you are breaking (wheat), the exposed core's window (green, counting down), the hook's hold (magenta, counting down). Under it, one line of coaching for this moment. Right: data and pause. The bottom centre of the screen is kept empty because that is where your truck is.

Checked at 667×375, 844×390 and 932×430: nothing overlaps, every target is at least 44 px, no text under 12 px.

---

## 6. The storms

| Storm | Speed | Stages | Temperament |
|---|---|---|---|
| **Skinny Pete** | 100 mph | 3 × 220 shield | Jukes hard and often. Throws singles, then pairs, then threes. Crosswinds. Lightning from the second band. The storm that teaches the chase. |
| **Big Agnes** | 90 mph | 3 × 330 shield | Enormous and slow to turn. Suction reaches 200 m, right where gun range is, so you fight the pull the whole time. Throws whole debris fields across your path with one gap in them. |
| **The Sisters** | 120 mph | 3 × 300 shield | Three to five satellite twisters sweep the ground around her, closing and splitting, inside the range your guns need. Fastest, jukes most. |

Each band you rip makes the storm 6% faster and moves it to a harder attack set. A storm at +1 EF (rematch) has 30% more stability, faster telegraphs and a bigger payout.

Bigger storms have thicker shields, but the difficulty is what they do to you while you break it.

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
| Doc Vane | Scientist | DOROTHY doubles shield damage 3 s longer and works from further out |
| Winch Okafor | Harpooner | more time to land the harpoon; the line holds 2 s longer |
| Sparks Marín | Engineer | hull slowly repairs; boost recharges 35% faster |
| June Bug | Gunner | machine gun reaches 30% further and hits harder; 20% more Data |

Rigs: **The Mule** (balanced), **Bulldog** (most hull, shrugs off suction and crosswind, slow to turn), **Whippet** (fastest, drifts tightest, fragile).

The rest of the crew follow in a camper truck and a converted bus. They are company, not units to command.

Upgrades (Data): Winch (the line holds longer), Ordnance (rockets hit harder, reload faster), Plating (hull), Turbo (boost).

---

## 9. What was cut or postponed, and why

| | Decision | Reason |
|---|---|---|
| The orbit-against-the-spin tether fight | removed | it was the targeting puzzle |
| The town timer | removed | a second clock on top of a chase is noise; the danger is now physical |
| Ground Anchor and Thumper gadgets | retired | they served the tether fight. Old saves that own them still load; the slot is simply unused |
| Drive-through-the-eye finisher | replaced by the final kill shot | one spectacular ending, earned by the same move as the other bands |
| Floor-it-to-rip harpoon (version 2.0) | replaced | the harpoon now slows the storm and sets up the rocket kill shot, as the player asked |
| DOROTHY as a required step (version 2.0) | made optional | the shield breaks to gunfire alone; DOROTHY doubles the rate |
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
4. Could you see the shield coming apart as you shot it?
5. Shield down, harpoon, kill shot: did that three-beat finish feel like the best moment of the fight?
6. Did you start the next storm without being asked?
