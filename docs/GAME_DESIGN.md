# TORNADO HUNTER: Game Design

*Design of record. Version 2.10: the power lines, the second set piece. (2.9: the grain elevator, the first. 2.8: a grade for every fight and the Daily Storm, one storm a day for everyone. 2.7: the first minute measured and re-paced, a drift worth taking, a reason for every seat change, and cinematics you can skip once seen. 2.6: five phases, a crew member and a vehicle for each, DOROTHY driven to the foot of a harpooned storm that fights the line, and weather.) Tuning numbers live in `src/config.js`.*

---

## 0. The one-paragraph game

You drive an overpowered storm truck at 140 mph after a super tornado doing a hundred and jinking like it knows you are there. A fight has five phases:

1. **Chase (the wheel).** Close on the storm. It throws cars, tractors and barn doors at where you are going; you dodge, and the crew shoot wreckage out of the air.
2. **Guns (the turret).** Cross into the storm's danger zone and you are on the gun, first person, while the truck drives itself. You aim and you fire: the machine gun on the band, rockets for anything armoured. Whatever you do not shoot down lands on the truck.
3. **Harpoon (Winch's truck).** The camera swings across to the harpoon truck. Lock the launcher on the glow and hook the weakened storm. It is restrained, not tamed: it can no longer go anywhere, which is what makes the next part possible, but it fights the line, and it lunges.
4. **DOROTHY (Doc's bus).** You take the wheel of the science bus and drive it right up to the foot of the harpooned funnel, past its lunges. DOROTHY is set down there, and you deploy her: eighty green sensors. The camera leaves the truck and rides with them as they are dragged in, sucked round and up, and keep swirling inside the funnel until it dies; the truck drives itself. The storm weakens further and its core goes critical.
5. **Kill shot (Sparks' rocket truck).** Across again. Hold the launcher on the glowing core until it locks. One rocket. The camera rides with it.

Every phase belongs to someone. The chase and the turret are your rig, with June Bug. The finale is three hand-offs in a row, a vehicle each, and you take each seat in turn: two guns, and one steering wheel.

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
| **Hunt** | A rolling start: you are already doing 90 mph on a road, the funnel 330 m ahead and running (Big Agnes 430 m: her zone is 240 m, and the chase still has to last). | 5 s |
| **1 Chase** | At the wheel, third person. Close the gap. Roads are faster; fields are the shortcut. The storm jukes every few seconds and throws wreckage; the crew shoot it down, you steer off the magenta circles. A ring on the ground marks the danger zone. | 5 to 15 s each time |
| **2 Guns** | Crossing into the zone (185 to 240 m, by storm) swings the camera onto the turret in a third of a second and the autodrive takes the truck. You shoot the band: the strength bar drains, the band cracks at two thirds, fails at one third, breaks. The storm keeps throwing, and on the gun the sky is your job. DRIVE takes the wheel back at any time. | 10 to 25 s per band |
| **Outer bands** | A band shot off bursts and you are back at the wheel: a wall of debris rolls out for you to outrun, the storm bolts, two rockets are handed up. Back to phase 1. | 8 to 12 s |
| **3 Harpoon** | The last band gone to gunfire, the storm is WEAKENED for 7 s and the camera swings to Winch's harpoon truck, which closes to range and holds. Keep the launcher on the glow for 0.4 s, LOCKED, fire. Hooked, the storm goes nowhere (its anchor creeps at 4% of its speed, about 4 mph, and that is what the HUD reads) but it fights the line for the 15 s it holds: see *The harpooned storm*, below. | 1 to 7 s |
| **4 DOROTHY** | Third person again, at the wheel of Doc's bus (heavier than your rig, hard to push around); your own rig drives itself. A green ring marks the foot of the funnel, 17 m outside its wall, round the line's anchor: it stays put while the funnel lunges about it, and the coach line counts the metres. The inflow pulls and shakes harder the closer you get. Cross the ring and DOROTHY goes over the tailgate, the brakes come on, and the button reads DEPLOY. Drive on into the wall and it throws you back out and costs a little hull. Press DEPLOY: Doc takes the bus and runs, and the camera cuts outside the funnel and follows the sensors up it for 3.4 s; the truck circles on its own and cannot be hurt. The funnel thins and the core glows. | 3.4 s |
| **5 Kill shot** | Sparks' rocket truck, launcher up, you have 8 s. Hold the reticle on the glow for 0.4 s: LOCKED. One rocket, followed by the camera, and the storm comes apart: slow motion, explosions up the column, the sky tears open to blue. | 1 to 3 s |

Simulated fight lengths: a gunner who never misses the seam takes Skinny Pete in about 45 seconds, The Sisters and Big Agnes in about 90. A gunner who never misses takes no damage on the gun at all. One who lags the target and never touches the rockets takes Pete in about 65 seconds with a third of the hull left, and is a coin toss on the last band of the two big storms: they want the rockets and the wheel. A person will take longer.

### The harpooned storm: restrained, not tamed

*We've got it. Now we have to survive getting close to it.* The hook stops the storm going anywhere; it does not stop it fighting. `src/tether.js`, tuned by `TETHER` and each storm's `tether` in `src/config.js`.

**Two speeds.** The line holds the storm to an anchor that creeps at 4% of its run (about 4 mph: the HUD's number, its ground speed). The funnel moves about the anchor, never further than the line allows (its biggest lunge plus its shiver: 20 m for Pete, 36 for Agnes, 29 for the Sisters). A lunge is a curve in time: no jumps, ever.

| Lunge | How often | What it does | Warning |
|---|---|---|---|
| **Restless** | all the time | a shiver that never stops, and small shoves of 3 to 5 m: it is alive, and it is angry. Harmless | none needed |
| **Aggressive** | now and then | 9 to 14 m sideways across the bus's line. It cannot reach a bus on the ring; it bites one that has driven past the ring toward the wall | 0.95 to 1.15 s |
| **Violent** | rarely, later | 17 to 30 m, toward the bus's side of the funnel. It can reach the ring: the near miss you remember | 1.45 to 1.75 s, louder and longer |

**Every dangerous lunge is telegraphed, in this order.** The funnel leans toward where it is going and writhes harder, and its base digs in the other way. The line goes taut and turns magenta, its band flickers magenta, and the line groans, rising. If the lunge can reach you (and always for a violent one) the ground where its wall will be is marked in the storm's magenta, filling as it comes, and the coach says IT IS LUNGING. Then it goes: a whoosh, a shake if you are close, dust torn up along its leading edge. Then the line hauls it back past the anchor (a twang, the line goes slack and sags) and it settles. The storm plate turns magenta while a dangerous lunge is on; the number stays its ground speed.

**The line's 15 seconds escalate.** It lands with 1.4 s of shivering (relief), then the first aggressive lunge, wide of the bus: the lesson. With 15 to 10 s left it is mostly restless, never violent. 10 to 5: aggressive more often, the odd violent one. 5 to 0: dangerous lunges come as often as the breathers allow, more of them violent, the shiver is at its biggest and the line frays (flickers magenta). **It lashes out at whatever gets close.** Within 60 m of the ring its breathers shorten (by up to 60%) and its dangerous lunges come up to three times as readily: a quick bus meets a second lunge as it arrives (about 6 s after the hook, against 7 to 8 s for one hanging back). Never a violent one in the first act. Simulated, per player: about one dangerous lunge in the 10-to-5 act and one and a half in the last five seconds, which is near the ceiling the warnings and breathers allow, so the last act escalates mostly by making more of them violent.

**Fair, by rule.** At least 0.9 s of warning, always. A breather between dangerous lunges (0.6 to 2 s by act, longer for Pete, shorter close to the ring). Nothing is aimed at a bus that has just been hit, is in the air, has a satellite twister within 34 m, or has just set DOROTHY down: it lunges away, and one already coming is pulled short (eased, never cut) of the bus. Once DOROTHY is away and on the kill shot it only shivers. The steering camera aims at the anchor, not the funnel. The bus is hit by the funnel's wall (plus 3 m) as before, once per contact (1.1 s of immunity and a throw), never in the 1.2 s after DOROTHY goes down.

| Storm | On the line |
|---|---|
| **Skinny Pete** | The teacher: the smallest lunges (9 m, 17 m), the longest warnings, the longest breathers, the fewest dangerous lunges. |
| **Big Agnes** | The most storm moving the furthest (14 m, 30 m), and the biggest shiver. Park carefully. |
| **The Sisters** | The angriest: most often, shortest breathers. Her satellites circle the anchor, not the lunging funnel, and the funnel will not lunge at a bus a satellite is already on. |

The line's seed is chosen per fight (`G.tetherSeed` replays one). The tests are `node --test tests/*.test.mjs` (the movement on its own) and `node tests/e2e.mjs` (the finale in a browser, every storm). They prove the rules hold; they do not prove the Sisters feel fair. That needs a person with a phone.

### Seats and how you change them

| | |
|---|---|
| **Scripted** | Crossing into the danger zone puts you on your own gun. A band shot off puts you back at the wheel. The storm weakened puts you on Winch's harpoon truck, the hook puts you at the wheel of Doc's bus, a critical core puts you on Sparks' rocket truck. Miss a window and you are back at your own wheel. |
| **Manual** | GUNS (the action button during a chase) takes the turret anywhere, and the autodrive closes the range for you, slower than you would. DRIVE gives the wheel back; it stays yours for at least four seconds, and until you leave the zone and come back in. |
| **Why** | Every seat change the game makes for you says why on the coach line, in green, for 1.8 s: IN RANGE: YOU SHOOT, IT DRIVES, then TAP DRIVE TO STEER IT YOURSELF (F on a keyboard). BAND OFF: YOUR WHEEL, OUTRUN IT. WEAKENED: WINCH'S HARPOON IS UP. HOOKED: DOC'S BUS, YOU DRIVE. CORE CRITICAL: SPARKS' ROCKET. MISSED IT: YOUR WHEEL, CLOSE IN. THE LINE WENT: YOUR WHEEL AGAIN. Being put on the gun is an offer with the way back printed on it, not the wheel taken away (question 4). |
| **Never on top of a threat** | The automatic swing to the gun waits while you are steering out from under something (a piece coming down where you will be, or a crosswind that has been called), at most 2.5 s. After any seat change the storm holds its next throw for 0.8 s: the swing and the input guard are never a window to hit you in. |
| **The swing** | 0.3 s to your own gun, 0.45 s across to another vehicle, measured from the truck so the world never stops moving. The plate that shows your speed shows whose seat it is instead (WINCH · HARPOON TRUCK), and its owner says a line. No cut, no fade, no loading. Cuts are kept for the two cinematics. Calm mode shortens it to 0.1 s. |
| **The cinematics** | The DOROTHY ride and the kill-shot camera play in full the first time. Once each has been watched to the end (remembered in the save), a tap or Space skips it to the outcome: the core goes critical and Sparks' launcher comes up, or the rocket lands. A skip runs the same ending as the full shot, so the cut and the swing after it are the same, calm mode included. The tap that starts a cinematic (DEPLOY, FIRE) never skips it: only a tap once it is a third of a second old counts. The coach line says TAP TO SKIP only when it can. |
| **Nothing carries over** | Every finger and key held through a change is dropped, and the new seat ignores input for a third of a second: the thumb that pressed GUNS does not fire, the thumb that was aiming does not steer. |

### Autodrive

It holds the truck at 70% of the danger zone's radius: straight at the storm when it is far, alongside it at range, wide and off the throttle when it is close. It merges onto a road that runs its way, steers round buildings, trees, wrecks and satellite twisters, backs out if it is wedged, and never uses more than 92% of top speed or the boost. It does not dodge what the storm throws. That is the gunner's job, or a reason to take the wheel.

The storm is a little kinder to a truck that cannot weave: it throws about 30% less often, a debris field is the two pieces that would have hit rather than four with a gap, and its lightning trails a truck at speed. In exchange the crew's shotgun reloads 60% slower.

Miss the harpoon window and the storm recovers 40% of its strength; let the line go before the kill shot and it recovers 50%. A mistake costs seconds, never the fight.

### The first 60 seconds

Measured, not simulated on paper: `node tests/firstminute.mjs` plays the opening of every storm in a browser. The driver follows the coach line (steers at the storm, boosts when told, never dodges); the gunner is the test aimer at two skills, *sharp* (on the seam) and *sloppy* (the sights wander, the trigger is let go a third of the time); three seeds each. Medians, Skinny Pete / Big Agnes / The Sisters, seconds into the mission:

| Brief asked for | Where it should land | 2.6, measured | 2.7, measured |
|---|---|---|---|
| Immediate high-speed pursuit | 0 | 0: rolling start at 90 mph | the same |
| A clearly visible super tornado | 0 | 330 m ahead, 310 m tall | the same (Agnes 430 m) |
| A satisfying boost | 0 to 3 | 0.07 / 0.07 / 0.07 | 0.07 / 0.4 / 0.2 |
| A dramatic environmental hazard: first wreckage | 3 to 7 | 3.2 / 3.1 / 6.0, worst 20.8 (41 in another run) | 3.2 / 4.7 / 3.2, worst 4.75 |
| A near miss or recoverable mistake | 4 to 20 | 26 / 8.2 / 9.3, and none at all in a minute in some runs | 4.4 / 6.0 / 4.3, worst 6.0: the ranging shot |
| A meaningful combat action: into the zone, on the gun | 5 to 7 | 5.7 / **2.2** / 5.9 | 5.9 / 5.3 / 5.9 |
| A storm reaction that changes the chase: first band shot off | 19 to 23 | sharp 17.2 / 15.5 / 16.1, sloppy 29.1 / 20.3 / 25.2 | sharp 15.5 / 19.8 / 16.3, sloppy 32.4 / 26.9 / 28.3 |
| Callouts that were never readable (up less than 0.6 s) | none | 2 to 11 a minute | none |

What was late or stacked, and what changed (2.7):

- **Agnes put you on the gun at 2.2 s.** Every storm started 330 m ahead, and her zone is 240 m: two seconds of chase. She starts 430 m out (`STORMS[].lead`).
- **The first wreckage could take 20 to 40 seconds**, when the first attacks rolled lightning and crosswind. The first throw is now the ranging shot (section 7), and the storm never makes two attacks in a row that throw nothing.
- **The near miss was luck**, and against a sharp gunner it barely happened, because everything was shot down. The ranging shot makes it the first lesson, at about 4.4 s.
- **Callouts overwrote each other**: BAND SHOT OFF was replaced by GET CLEAR in the same frame, every band of every fight; a CROSSWIND warning was cut 0.01 s later by GUNS UP, and the crosswind then hit a truck the player had just been taken off. Callouts are ranked and queued (section 5); the automatic swing to the gun waits out a called crosswind or a piece about to land on you; the storm holds its throw for 0.8 s after any seat change.
- **Not fixed, on purpose: the first band for a sloppy gunner** (27 to 32 s, against 19 to 23). It is aim: the same storm falls in 15 to 20 s to a gunner on the seam. Shortening the band would make it fall in 13 to a good one, and the fight lengths in this section were left as they were. Whether a real thumb lands nearer the sharp or the sloppy line is question 4.

### After the fight: the grade

The results screen reads the fight back in five numbers, the ones a grade is made of, and gives it a letter. Destroying the storm earns one; a wreck does not.

| Part | Weight | Full marks | Nothing |
|---|---|---|---|
| Time | 35% | at par: Pete 40 s, Agnes 72 s, the Sisters 75 s (about 10% over a gunner who never misses) | 2.2 times par |
| Hull left | 25% | all of it | none |
| Accuracy | 15% | 85% of turret rounds on something you can hurt | 30% |
| Critical hits | 15% | Pete 170, Agnes 360, the Sisters 275 | none |
| Near misses | 10% | 8 | none |

S from 90, A from 75, B from 60, C from 45, D below. The best letter per storm is kept, and the screen says NEW BEST when you beat it. Under the letter, one line says what would have raised it, in your own units, choosing the change that is the smallest share of what that part still had to give: *2 crits short of A*, *9 s faster for A*, *14 more hull for A*. When no one thing can do it, the two biggest levers together: *30 more hull and 7 s faster for S*. Doing exactly what the line says does reach the letter: `tests/progress.test.mjs` checks it across 216 fights.

Calibrated by `node tests/fullfight.mjs`, whole fights played by the test aimer with a driver who never dodges: one that never misses the seam grades A on every storm (75 to 89 in the last run of 18 fights; S needs a few near misses and little damage taken); one that lags the target and lets go of the trigger grades B to D when it survives, and is wrecked in most fights against the two big storms.

### The Daily Storm

One storm a day, the same for everyone. The day is the date in America/Denver; its seed picks the storm and seeds a stream for each kind of decision the fight makes: the jukes, the attacks (what is thrown, how wide, how often), the hail, the lightning, the line (the tether's seed). Each stream is drawn only at its own events, so the sequence is the same whatever your frame rate, rig or calm setting; the hail and the lightning have separate streams because calm mode spaces the lightning out. Your rig, crew and upgrades are your own.

- **One scored attempt a day.** Starting it spends it. Restarting it from the pause menu (it reads *Restart as practice*) or quitting (*Quit: run is spent*) ends it; only one played to the end, won or wrecked, counts toward the streak.
- **Unlimited practice** of the same storm after that, marked PRACTICE on the storm plate (DAILY for the scored run).
- **Share** puts a spoiler-free result on the system share sheet, or the clipboard where there is none: the storm, the grade and the time, and a row of squares per phase. 🚚 a square per band at the wheel (green no hull lost, amber some, magenta 25 or more), 🎯 a square per band on the gun (accuracy 75% and over, 45%, under), 🪝 a square per harpoon window (magenta a miss), 📡 per DOROTHY run (amber if the bus was hit, magenta if the line ran out), 🚀 per kill-shot window (green in the first half). No route, no seed, no link.
- **The streak** on the title counts consecutive Denver days with a scored run played to the end. It holds through the next day until that day is played, and breaks after a day missed.
- **Nothing leaves the device.** The result, the best grades and the streak live in the save; Share hands text to the player and nothing else.

The Daily Storm opens on the title once the first storm has been beaten, so nobody's first fight is The Sisters.

---

## 3. Driving

Driving is the game. If it is not fun with no storm on screen, nothing else matters.

| | Value | Why |
|---|---|---|
| Top speed, road | 64 m/s (143 mph) | faster than every storm |
| Top speed, field | 53 m/s (119 mph) | shortcuts cost speed, never the chase |
| Boost | ×1.38 for 2.2 s (197 mph) | recharges in 5 s, or sooner if you earn it |
| Acceleration | 34 m/s² off the line, tapering | you feel fast long before top speed |
| Drift | brake while steering above 45 mph | the nose swings in, the truck keeps its speed, the line bends to follow. At top speed a drift takes a 90-degree corner in 0.72 s and 28 m of width, against 1.33 s and 49 m steering: it is the tight way round, and it keeps 93% of the speed |
| Collisions | fences, bales, signs, trees: you go through them and lose speed. Buildings stop you and cost a little hull. | a tree knocks about 30 mph off and you are back to top speed in under a second: felt, worth steering round, never a stop. A fence barely registers, because fences line the roads and a thumb will brush them |

**Measured, not guessed.** `node tests/driving.probe.mjs` drives the truck on its own (no storm, a flat world, 60 Hz) and prints what the numbers mean in the hand; `tests/driving.test.mjs` holds every rig to the targets. Version 2.7 changed, in `src/config.js` only:

| Number | Was | Now | Why |
|---|---|---|---|
| `driftTurn` | 1.75 | 2.3 | how fast the nose swings in once you pull back: the slide took 0.18 s to open, now 0.08 s. On a thumb the slide answers at once |
| `driftSwing` | 1.5 (in rig.js) | 2.2 | how fast the direction of travel follows the nose in a slide. At 1.5 a drift took a corner only 15% tighter than steering and cost 14% of the speed |
| `driftBleed` | 7 (in rig.js) | 6 | m/s² a slide costs: a 90-degree drift now keeps 93% (it kept 89%) |
| `smashTree` | 0.86 (in world.js) | 0.78 | a tree at top speed cost 0.04 s, which is nothing: you could not feel one, so missing one was no skill. Now 0.1 s and a 30 mph drop, back to top speed in 0.9 s |
| `smashSoft` | 0.93 (in world.js) | 0.9 | the floor on anything soft. At 0.93 a bale, a cow and a parked car all cost the same as a fence; now their own weight shows. Fences keep 0.94 |
| `driftCatch`, `driftMaxSlip` | 3.2, 0.85 (in rig.js) | unchanged | moved into config with the rest. The slide still caps at 50 degrees, so a coarse thumb cannot spin it, and lets go in 0.25 s |
| `driftGrip` | 1.0 | removed | nothing read it |

Left alone, on purpose: the speed feel. The lens widens 16 degrees at road top speed (13 on a field), 7 more on boost and a 10-degree kick when the boost fires; the camera drops 1.3 m and tucks in 2.2 m. At the rolling start (90 mph) that is already +10 degrees, so the speed is felt from the first frame, which is the point. Touch is unchanged too: the thumb pulled back past 45% of the stick's travel brakes, and with any steer that is a drift, so a 30 px slide down from full lock starts one.

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
| **Harpoon** | you, from Winch's harpoon truck (phase 3) | hooks the weakened storm and anchors it, so the bus can reach its foot (it lunges, the line hauls it back); the line runs from his truck, and your rig is free | only on a weakened storm; 7 s window; needs a lock |
| **DOROTHY** | you, driving Doc's science bus to the funnel's foot, then DEPLOY (phase 4) | a swarm of sensors, sucked up to swirl inside the funnel, weakens it further and turns the core critical | only on a hooked storm |
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

**Callouts, one at a time, every one read.** The big word in the middle of the screen has a rank: a turn in the fight (BAND SHOT OFF, WEAKENED), a threat (INCOMING, DEBRIS FIELD, CROSSWIND, GET CLEAR, HAIL CORE), a beat (GUNS UP, HOOKED, CORE CRITICAL), or chatter (CLOSE CALL, BOOM, COW, IT IS TURNING, the band cracking, which the sound, the ring and the bar already carry). Nothing is replaced until it has been up 0.6 s, except by something that outranks it; a beat cut short comes back afterwards; a beat that has waited 2.4 s is old news and dropped; chatter that would have to wait is dropped at once. When a band is shot off or the storm is weakened the sky is cleared, and so is anything still queued about it, including a crosswind that was coming. GET CLEAR follows BAND SHOT OFF rather than replacing it in the same frame. Where a callout would overlap the crew's speech plate (it depends on the screen and the words) the plate steps aside until it is gone.

Checked at 667×375, 844×390 and 390×844 by `node tests/layout.mjs`: nothing overlaps, every target is at least 44 px, no text under 12 px.

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
- **The ranging shot.** The storm's first throw of every fight is one small piece that holds 12 m to the side of the truck all the way down: outside the 7.5 m it hits, inside the 18 m that counts as a near miss. The crew do not shoot at it. So the first thing anyone learns is what a magenta circle means, and that a near miss pays boost, at about 4.4 s, every fight. After it the storm never makes two attacks in a row that throw nothing (lightning, crosswind), so wreckage keeps coming.
- **The storm eats the map.** Barns, silos, trees, fences and cattle in its path are lifted, orbited and flung.
- **Crosswinds** are called a second ahead with an arrow, then shove the truck sideways for a second and a half.
- **Lightning** tracks you, locks, strikes.
- **The debris wall** after every rip.
- **Satellite twisters** (The Sisters), each marked on the ground. A rocket takes one down.
- **The grain elevator** (below), in about a third of chases, or **the power lines**, in about a fifth. Never both.

### The grain elevator

The first set piece: scripted chaos tied to the road. `src/setpiece.js`, tuned by `SETPIECE` in `src/config.js`.

| | |
|---|---|
| **When** | About a third of fights (34%); on the Daily Storm the day's seed decides, so on its days it is in everyone's fight. Never in the first, coached storm. Never before 12 s (the first minute belongs to the ranging shot and the zone). Only in a chase, at the wheel, at speed: never in the finale, never on the gun, never with a debris wall, never with a hail core (nor one due within 12 s), never with a crosswind called. |
| **Where** | 300 m down the road you are driving (the highway or a gravel road, running along it, not crossing it), on the far side from the storm. With no road after 10 s at the wheel, the line you are driving will do. The storm is turned onto it and passes it 60 m off the road, on its own side. |
| **The warning** | As the storm passes (within 90 m), or when you are four seconds out, it starts to go: THE ELEVATOR IS GOING, a creak, dust at its foot, a tremble. Then, as you arrive, ELEVATOR COMING DOWN: three pieces (two pairs of concrete bins and the tin headhouse between them, 20 m apart) come down across the road in sequence, 1.25, 1.7 and 2.15 s after it starts. Each one leans further and groans as it comes, and the strip it will land on is marked on the ground in the storm's magenta, filling from its foot toward its tip, the edge at the tip drawn heavy, flashing in the last 0.4 s. It is timed so that holding your line puts the first piece on you. The camera looks down the road at it, not off at the storm. |
| **The way out** | It falls toward the storm and stops 6 m short of the road's edge: that lane, on the storm's side, is the escape line, and keeps your road speed. The field beyond it is the shortcut: wide open, and off-road (field top speed). The coach line says which: KEEP LEFT, OR TAKE THE FIELD. |
| **The cost** | A piece landing on you: 22 hull and a throw. Pieces lie across the road for 8 s: driving over one costs 45% of your speed, never hull. Then they settle into the field. |
| **The payoff** | Through clean, nothing landed on you: 60% of a boost charge back (as the debris wall) and a little data. |
| **While it is going** | The game does not take the wheel (the automatic swing to the gun waits), GUNS reads NOT NOW, the storm holds its throws, and the hail waits for it. Taking the gun yourself while it is still standing waiting lets it be: it stays where it is, inert. |

### The power lines

The second set piece, on the elevator's code and under the elevator's rules: when it may come, where it stands (300 m down your road, on the far side from the storm), the storm's pass, the escape lane on the storm's side with the field beyond it, the coach line, the held wheel, throws and hail, and 60% of a boost for a clean escape. `POWERLINES` in `src/config.js` holds what differs.

| | |
|---|---|
| **When** | About a fifth of fights (20%). One draw decides the set piece: under 0.34 the elevator, under 0.54 the lines, otherwise none. So a fight never has both, and the elevator's Daily Storm days are the days they always were. |
| **What** | Six poles, 26 m apart, strung with two wires a span, a transformer drum on every other one. Chunky, like the rigs: they have to read at phone size from 150 m. |
| **The warning** | THE LINES ARE GOING: the poles sway on their wires and the wires arc, blue-white. Then POWER LINES COMING DOWN: every strip is marked in magenta at once, down the whole run, and they fill in sequence as the poles go like dominoes. The first has 1.25 s of warning; each one after lands as you would reach it at the speed you came in at (kept within 40 to 90 m/s: a pole every 0.29 to 0.65 s), so every pole has more warning than the one before, never less than 1.2 s. A wire snaps, with a crack and sparks, when either of its poles is down. |
| **Why it is not the elevator again** | The elevator is one decision made in a second. The lines are a lane held for three seconds over 130 m, with the storm's suction pulling you toward it: hold the covered lanes and every pole in the run is aimed at you. |
| **The cost** | A pole landing on you: 16 hull and a throw (a piece of debris, not a building). A downed pole costs 20% of your speed to drive over, never hull. They lie there 8 s. |

`node tests/e2e.mjs` plays both set pieces. The elevator: it creaks and then falls, every piece is marked for at least 1.2 s before it lands, the game never takes the wheel or throws while it falls, a truck on the escape line takes no damage and is paid 60%, and a truck that holds the near lane is hit. It also checks that it cannot come in the finale, a hail core, the debris wall or on the gun, and that the hail waits for it. The power lines get the same checks with six poles, plus: every pole's warning is longer than the last, and over 400 fights' worth of draws the shares come out near a third and a fifth with none in the coached storm. `tests/progress.test.mjs` checks the Daily Storm's days: the elevator on about a third, the lines on about a fifth, never the same day. `node tests/perf.mjs` holds the low tier's frame rate through both.

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
| One callout slot, last call wins (to 2.6) | replaced (2.7) | measured: up to eleven callouts a minute were overwritten before they could be read, BAND SHOT OFF by GET CLEAR in the same frame every time. Now ranked and queued (section 5) |
| BAND CRACKING and BAND FAILING as headline callouts | demoted to chatter (2.7) | they lost the channel to every threat; the crack you hear, the ring and the bar carry them |
| A random first attack | replaced by the ranging shot (2.7) | measured: the first wreckage could take 23 or 41 seconds when the dice rolled lightning and crosswind |
| `driftGrip` | removed (2.7) | a tuning number nothing read |
| The results screen's data breakdown (storm data, storm destroyed, hull intact) | folded into one line (2.8) | the screen now reads the fight back; the data is one total under it |
| A grade for a wreck | not given (2.8) | a letter has to be earned; the wreck keeps its advice line |
| Leaderboards, accounts, sending a daily result anywhere | not built (2.8) | nothing leaves the device. The share text is the leaderboard |
| The Daily Storm for a brand-new player | held back until the first storm is beaten (2.8) | the day's storm can be The Sisters |
| The grain elevator on the gun, or the autodrive dodging it | never (2.9) | the autodrive does not dodge; a set piece is something you drive through, so it only comes at the wheel and the game will not take the wheel while it falls |
| Rubble that hurts | not built (2.9) | the pieces lying across the road cost speed, never hull: the damage is for being under one as it lands, which you were warned about |
| Power lines falling in sequence | built (2.10) | postponed in 2.9 for one set piece at a time; the person asked for it next |
| Poles on alternating sides, a slalom between them | not built (2.10) | at 140 mph a gate every 26 m is 0.4 s: nobody weaves that on glass. One lane, held, is the test |
| Live wires on the ground that hurt | not built (2.10) | damage with no clear edge. The wires snap and arc for show; only a pole landing on you costs hull |
| Two set pieces in one fight | never (2.10) | one draw decides which. A fight has room for one piece of scripted chaos |

---

## 10. Technical notes

Three.js on WebGL2, plain ES modules, no build step, offline from the Home Screen. The overhaul reused the terrain, sky, props, rigs, convoy, funnel shader, audio synthesiser, input layer, save format and menus. The mission rules (`src/combat.js`) were rewritten; the driving model, HUD and effects were extended.

```
src/config.js    every tuning number, storms, rigs, crew
src/combat.js    the mission: storm AI, wreckage, the two seats, DOROTHY, harpoon, surge
src/tether.js    the harpooned storm fighting the line: lunges, telegraphs, escalation, fairness (pure maths, tested under node)
src/gunner.js    the turret: aim, hits and criticals, rockets and lock-on, autodrive, the weapon you see
src/weather.js   hail cores and ambient lightning
src/setpiece.js  the set pieces (grain elevator, power lines): placed on the road ahead, the storm's pass, the telegraph, the fall, the escape line
src/rig.js       the truck: model, handling, drift, boost
src/tornado.js   funnel, bands, debris, skirt (shaders)
src/fx.js        pooled wreckage, tracers, sparks, debris, rockets, explosions, telegraphs, cable
src/convoy.js    the camper truck and the bus
src/world.js     terrain, ground texture, roads, towns, props
src/sky.js       sky dome, wall cloud, rain, light
src/audio.js     synthesised engine, wind, guns, explosions
src/hud.js       in-mission HUD     src/ui.js   title, headquarters, results, the Daily Storm, Share
src/grade.js     the letter for a fight and the line that would have raised it (pure)
src/daily.js     the Daily Storm: the Denver day, its seed and streams, the streak, the share text (pure)
src/save.js      the save, and migrate() for every older one
src/main.js      boot, the three cameras (chase, gun, cinematic) and the swing between them, frame loop, resolution governor
```

**Tests.** `node --test tests/*.test.mjs`: the tether's movement, the truck's handling, saves (a real version 1 save), grades and the Daily Storm, under Node. `node tests/e2e.mjs`: the finale on every storm, the seat-change reasons, the cinematics, the Daily Storm (one scored attempt, the same fight at two frame rates, Share) and a version 1 save loaded cold, in a browser. `node tests/fullfight.mjs`: whole fights by the test aimer at two skills, read the way the results screen reads them. `node tests/firstminute.mjs`: the first minute of every storm, played by a scripted player at two gunning skills, every beat timed and every callout checked for being read (`AUDIT=1` prints the timeline). `node tests/layout.mjs`: the interface bar at the three sizes (`SHOTS=<folder>` saves screenshots). `node tests/driving.probe.mjs` prints the handling numbers.

**Saves.** Same key and shape as version 1 (`tornado-hunter/v1`). Data, kills, owned rigs, upgrades and crew carry over. The `winch` and `cable` upgrade levels keep their value and now mean "the line holds longer" and "ordnance" (guns hit harder, one more rocket in the rack per level). Fields are only ever added: `seen` (2.7, the cinematics watched), `grades`, `daily` and `streak` (2.8). `migrate()` in `src/save.js` fills in whatever an older save lacks and turns anything unreadable into a fresh start; `tests/fixtures/save-v1.json` is a real version 1 save, loaded by the unit tests and cold in the browser.

---

## 11. Roadmap

| Phase | Goal |
|---|---|
| **Now** | People play it on real iPhones and answer the questions below |
| **Feel pass** | Tune aim sensitivity and assist, wreckage rate, rocket count and the hail from that play; haptics; recorded audio where synthesis falls short |
| **Second technology** | COLD FRONT and CORKSCREW as swaps for the DOROTHY slot |
| **Set pieces** | Built: the grain elevator (2.9), the power lines (2.10). Next: a bridge, with the river valley |
| **The wingman** | The crew vehicles fight on their own between their phases: a second gunner, covering fire |
| **New country** | A river valley with bridges; a town-edge region |

---

## Questions only a person can answer

1. With the storm out of frame, is the truck fun to drive on its own?
2. Does catching the tornado feel like something you did, or something the game allowed?
3. Could you tell what was about to hit you in time to do something about it?
4. On the gun, could you hold the seam with a thumb? Did you ever take the wheel back on purpose, and did being put on the gun ever feel like having it taken away? (A scripted gunner on the seam sheds the first band in 15 to 20 s, a sloppy one in 27 to 32: which one is a person?)
5. Harpoon, DOROTHY, lock, kill shot: did that finale feel like the best moment of the fight? Was losing control during the DOROTHY shot welcome or annoying?
6. Did you start the next storm without being asked? Did the line under the grade make you try again? Did you come back for tomorrow's storm?
