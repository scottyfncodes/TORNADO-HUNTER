# TORNADO HUNTER: Game Design

*Design of record. Version 2.17: weapons built to be looked at. The guns, the rocket pod and the harpoon launcher you look down are rebuilt with bevelled parts whose edges catch the light worn, steel that reflects the storm sky as it is (the dome captured into a small cube twice a second), and occlusion baked under and between the parts; the belt of brass rounds feeds from the can, the jacket is perforated, the minigun has its clamps, motor and chute, the cannon its chromed sleeve and slotted brake, the tubes their dark mouths. (2.16: the storm comes apart, not a sticker on it. The looping magenta ring flipbook that played when it cracked, lost a phase, was hooked, went critical and died is replaced by a blowout made of the storm itself: a white-hot core flash in a wider flare of the heart's magenta (the cable's amber when hooked), a ring of its own cloud blown out of the wound, dark storm matter flung with sparks, gone in about a second. (2.15: the light under the shelf. The storm is lit from behind as you see it: a strip of dusty gold sky under the shelf, strongest behind the funnel, which stands against it in silhouette with faintly gold edges; its shadow reaches across the ground toward you, cool and deep, and your truck and the convoy darken with the ground under them; the haze toward the gold warms. No new pass, mesh or texture: the sky, ground and funnel shaders and the two lights. (2.14: the storm is the monster. No ring around it: the funnel is what you shoot, and what you see hurt. A molten heart glows on its wall where it can really be hurt, cracks spread from it as a phase's strength goes, lightning crawls inside it, it tears open and roars when it loses a phase and comes back angrier; a round anywhere else on it glances. (2.13: progression, made honest. Every band's data banked, the last one's included; critical hits graded as a share of rounds, so no gun's rate of fire grades it up or down; each rig's gun reach real on the turret; the crew picked and stood down by a tap, two at most, never swapped behind your back. (2.12: a score. One theme, played by each storm in its own key and tempo, that follows the fight phase by phase and ends on a fanfare as the results come up; a ping for wreckage coming down on you, a run of critical hits that climbs, a heartbeat for a hull that is nearly gone; all of it synthesised, with a switch of its own. 2.11: the turret made fair, after the live build was played start to finish by a scripted player: the harpoon only says LOCKED when it can fire; on the gun the storm aims one piece at you at a time and never twice running, the piece that will hit is ringed in the sky where the gunner is looking, and armour can be shot down; a first win grades B or C; and the tests' fast-forward clock, which had hidden all of this, is fixed. 2.10: the power lines, the second set piece. 2.9: the grain elevator, the first. 2.8: a grade for every fight and the Daily Storm, one storm a day for everyone. 2.7: the first minute measured and re-paced, a drift worth taking, a reason for every seat change, and cinematics you can skip once seen. 2.6: five phases, a crew member and a vehicle for each, DOROTHY driven to the foot of a harpooned storm that fights the line, and weather.) Tuning numbers live in `src/config.js`.*

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

Kept from version 1: the three storms and their names, the the storm's phases (its bands, which since 2.14 are its health and no longer a ring you can see), the rigs, the crew, the convoy, the art direction, the audio approach, save data.

---

## 2. The loop

**HUNT → CHASE → SURVIVE → ATTACK → ESCAPE → REENGAGE → DESTROY**

| Beat | What happens | Typical length |
|---|---|---|
| **Hunt** | A rolling start: you are already doing 90 mph on a road, the funnel 330 m ahead and running (Big Agnes 430 m: her zone is 240 m, and the chase still has to last). | 5 s |
| **1 Chase** | At the wheel, third person. Close the gap. Roads are faster; fields are the shortcut. The storm jukes every few seconds and throws wreckage; the crew shoot it down, you steer off the magenta circles. A ring on the ground marks the danger zone. | 5 to 15 s each time |
| **2 Guns** | Crossing into the zone (185 to 240 m, by storm) swings the camera onto the turret in a third of a second and the autodrive takes the truck. You shoot the storm: its heart, glowing on the funnel's wall, and the height of it around the heart is where it hurts; the strength bar drains, it cracks at two thirds, comes apart at one third, tears open. The storm keeps throwing, and on the gun the sky is your job. DRIVE takes the wheel back at any time. | 10 to 25 s per band |
| **Phases** | A phase lost (TORN OPEN): the funnel tears where its heart was, it roars, and you are back at the wheel: a wall of debris rolls out for you to outrun, the storm bolts, two rockets are handed up. Back to phase 1. | 8 to 12 s |
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
| **Why** | Every seat change the game makes for you says why on the coach line, in green, for 1.8 s: IN RANGE: YOU SHOOT, IT DRIVES, then TAP DRIVE TO STEER IT YOURSELF (F on a keyboard). TORN OPEN: YOUR WHEEL, OUTRUN IT. WEAKENED: WINCH'S HARPOON IS UP. HOOKED: DOC'S BUS, YOU DRIVE. CORE CRITICAL: SPARKS' ROCKET. MISSED IT: YOUR WHEEL, CLOSE IN. THE LINE WENT: YOUR WHEEL AGAIN. Being put on the gun is an offer with the way back printed on it, not the wheel taken away (question 4). |
| **Never on top of a threat** | The automatic swing to the gun waits while you are steering out from under something (a piece coming down where you will be, or a crosswind that has been called), at most 2.5 s. After any seat change the storm holds its next throw for 0.8 s: the swing and the input guard are never a window to hit you in. |
| **The swing** | 0.3 s to your own gun, 0.45 s across to another vehicle, measured from the truck so the world never stops moving. The plate that shows your speed shows whose seat it is instead (WINCH · HARPOON TRUCK), and its owner says a line. No cut, no fade, no loading. Cuts are kept for the two cinematics. Calm mode shortens it to 0.1 s. |
| **The cinematics** | The DOROTHY ride and the kill-shot camera play in full the first time. Once each has been watched to the end (remembered in the save), a tap or Space skips it to the outcome: the core goes critical and Sparks' launcher comes up, or the rocket lands. A skip runs the same ending as the full shot, so the cut and the swing after it are the same, calm mode included. The tap that starts a cinematic (DEPLOY, FIRE) never skips it: only a tap once it is a third of a second old counts. The coach line says TAP TO SKIP only when it can. |
| **Nothing carries over** | Every finger and key held through a change is dropped, and the new seat ignores input for a third of a second: the thumb that pressed GUNS does not fire, the thumb that was aiming does not steer. |

### Autodrive

It holds the truck at 70% of the danger zone's radius: straight at the storm when it is far, alongside it at range, wide and off the throttle when it is close. It merges onto a road that runs its way, steers round buildings, trees, wrecks and satellite twisters, backs out if it is wedged, and never uses more than 92% of top speed or the boost. It does not dodge what the storm throws. That is the gunner's job, or a reason to take the wheel.

The storm is a little kinder to a truck that cannot weave: it throws about 30% less often, a debris field is the two pieces that would have hit rather than four with a gap, and its lightning trails a truck at speed. In exchange the crew's shotgun reloads 60% slower.

On the gun there is no dodging at all, and the truck holds a steady line at 92% of its top speed, so a throw aimed at it always arrives: measured on the live 2.10 build, every attack on the turret was on target, one every three seconds from Big Agnes, against a shell that comes round every 6.4. So the rules there are different (2.11):

- **One piece at you, never twice running.** On the gun an attack throws at most one piece that will hit, and the attack after one that was aimed is thrown beside the truck: 12 to 16 m wide for a bale, 16 to 21 for a tractor. A debris field is the armour coming down beside you and one small piece: at you, or beside you on the other side. So armour is aimed at a truck on the gun only as the single INCOMING tractor or car, the throw a rocket is for. The sky stays as busy as it was; half of it is yours to ignore, and the ring (section 4) says which half. A piece thrown beside you is not a near miss: there was nothing to dodge.
- **The crew's shell is kept for a piece that will hit.** At the wheel they blast whatever comes close. On the gun, where the shell is slow, they let a wide one land.
- **Longer in the air.** 0.3 s more (`FEEL.gunnerAir`): 1.85 s for a bale, 2.2 s for a tractor (less on a rematch, never under the 0.9 s floor).
- **A breather after a hit.** The storm holds its next throw for at least 4 s (`FEEL.gunnerMercy`): one hit is a lesson, three before the sights have come round is a wreck you watched.
- **The autodrive's own mistakes are free.** If it clips a barn you lose speed, not hull.

What that leaves is the job the seat is for: shoot down the ringed piece, or let the crew's shell take it and work the seam. As the storm loses bands it throws faster than the shell reloads, and a gunner who never defends is in trouble by the third.

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

(The 2.6 and 2.7 columns were measured before the test clock was corrected in 2.11 (section 10): the beat times stand, since they are the mission's own clock; what those runs under-counted was wreckage landing on the truck.)

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
| Time | 35% | at par: Pete 45 s, Agnes 78 s, the Sisters 80 s, a clean fight by a gunner who never misses (40, 72 and 75 until 2.11) | 3 times par (2.2 until 2.11) |
| Hull left | 25% | all of it | none |
| Accuracy | 15% | 85% of turret rounds on something you can hurt | 20% (30% until 2.11) |
| Critical hits | 15% | a share of turret rounds: Pete 55%, Agnes 85%, the Sisters 60% critical (a count until 2.13, Pete 170, Agnes 360, the Sisters 275, which a faster gun ran up for the same aim) | none |
| Near misses | 10% | 5 (8 until 2.11) | none |

S from 90, A from 75, B from 55, C from 25, D below (B from 60 and C from 45 until 2.11). The best letter per storm is kept, and the screen says NEW BEST when you beat it. Under the letter, one line says what would have raised it, in your own units, choosing the change that is the smallest share of what that part still had to give: *6% more crits for A*, *9 s faster for A*, *14 more hull for A*. When no one thing can do it, the two biggest levers together: *30 more hull and 7 s faster for S*. Doing exactly what the line says does reach the letter: `tests/progress.test.mjs` checks it across 216 fights.

**Recalibrated in 2.11, from fights that were played.** Three first wins of Skinny Pete were played on the live 2.10 build through real input (touch on a phone-sized screen in both orientations, arrow keys on a desktop): 68 to 112 s, 12 to 52 hull left, 35 to 71% accuracy. They graded C, D and D. A first win is the moment the game most needs to say *again*, and D says *you were bad at this*. Two things were wrong. The bottom of the scale was a cliff: time scored nothing from 2.2 times par, accuracy nothing under 30%, C needed 45. And the top was out of reach: par and the near-miss target had been measured on a test clock that ran thrown wreckage ahead of the truck (section 10), so no played fight came near them. Time now runs out at three times par and accuracy at 20%, B and C start lower, par is what a clean never-miss fight takes on the corrected clock, and five near misses are full marks (a near miss is a dodge at the wheel, and most of a fight is on the gun). The same three first wins grade B, B and C.

Calibrated by `node tests/fullfight.mjs`: whole fights played by the test aimer with a driver who never dodges, at three skills. *Sharp* never leaves the seam. *Thumb* is fitted to the real-input phone fights: sights 3.5 degrees off what they track, 0.4 s to swing onto a new target, off the trigger some of the time, rockets for armour; it holds about 70% accuracy, as the phone fights did. *Novice* is rougher (5 degrees, 0.5 s) and never touches the rockets. All three leave the seam only for a piece that is ringed. Four fights each, on the corrected clock:

| | Skinny Pete | Big Agnes | The Sisters |
|---|---|---|---|
| **2.10, thumb** | won 4 of 4, 52 hull left, grades D C D D | lost all 4, in 59 to 90 s | lost all 4 |
| **2.10, novice** | won 3 of 4, 28 hull left | lost all 4, in 26 to 53 s | lost all 4 |
| **2.11, sharp** | 4 of 4, 46 s, hull 100: S or A | 4 of 4, 76 s, hull 100: S or A | 4 of 4, 79 s, hull 100: S or A |
| **2.11, thumb** | 4 of 4, 78 s, hull 100: A or B | 4 of 4, 113 s, hull 76: A or B | 3 of 4, 110 s, hull 100: A |
| **2.11, novice** | 4 of 4, 104 s, hull 72: B or C | 4 of 4, 113 s, hull 60: B | 3 of 4, 144 s, hull 48: B or C |

(Medians of the fights won. Hull is what was left.) The second storm was a wall on 2.10 for anyone but a gunner who never missed, which is what the played fights had said and the suites had not. It is now a fight that costs hull, and the third can still be lost. What a person's thumb does with the ring is question 3.

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
| **The rig's gun** | you, on the turret (hold FIRE). At the wheel the crew fire it at wreckage only, at three quarters of your rate | weakens the band; shoots wreckage out of the air: about three quarters of a second on a bale or a door, a second and a third on a car or a tractor (2.8 s until 2.11, longer than it was in the air) | nothing reaches the storm from outside the zone; bullets barely mark a satellite twister |
| **Rockets** | you, on the turret (swap, hold the reticle on a target 0.4 s to lock, FIRE) | one rocket ends a car, a tractor or a satellite twister and anything within 17 m of it, at once: the quick answer to armour, where the gun is the slow one; takes 18% off a band | 3 in the rack (4 at most), 2 more after every band |
| **Shotgun** | the crew, automatically | the last-second save: blasts whatever is about to hit you, and clears wrecks off the road | 22 m range, 4 s between shots (6.4 s while you are on the gun) |
| **Harpoon** | you, from Winch's harpoon truck (phase 3) | hooks the weakened storm and anchors it, so the bus can reach its foot (it lunges, the line hauls it back); the line runs from his truck, and your rig is free | only on a weakened storm; 7 s window, which does not start running until Winch is in range (below); needs a lock |
| **DOROTHY** | you, driving Doc's science bus to the funnel's foot, then DEPLOY (phase 4) | a swarm of sensors, sucked up to swirl inside the funnel, weakens it further and turns the core critical | only on a hooked storm |
| **The kill shot** | you, from Sparks' rocket truck (phase 5) | the launcher, locked on the critical core | one job, one shot; it does not come out of the rack |

### The harpoon says only what is true (2.11)

Winch's truck starts the harpoon phase wherever the convoy happens to be: measured on the live 2.10 build across nine fights, 260 to 496 m from the storm, against a harpoon range of 230 m. The reticle locked anyway, 0.4 s into the window, and the trigger then refused with CLOSING IN for 0.8 to 5.2 s while the countdown ran: the worst hook landed 6.2 s into the window, on a player who had done everything right.

- **No lock out of range.** The reticle stays grey, the fire button is dark and reads CLOSING IN, the plate under the reticle says CLOSING IN, and the coach line counts the distance down: WINCH IS CLOSING IN: 140 M.
- **The window waits for him.** While you are on the harpoon and he is out of range the countdown holds, for up to 6 s (`FEEL.harpoonCloseMax`); past that it runs, so a truck that is stuck cannot hold the storm weakened for ever. The window you get is the 7 s the table promises, from the moment you could have used it.
- **The same rule for the kill shot.** The launcher locks only once Sparks is in rocket range. No number changed there; it already refused the shot.
- **Nothing you did not do costs hull.** A truck on autodrive that clips a building loses speed, not hull: crash damage is for the hands on the wheel.

### Seeing it coming from the gun (2.11)

Wreckage is marked on the ground where it will land. At the wheel that is in front of you. On the gun the camera is pitched up at the storm and the ground under the truck is off the bottom of the screen: across nine scripted fights on the live 2.10 build, nearly every point of hull was lost on the turret, to pieces whose only warning was out of frame.

- **A piece that will hit you is ringed, in the sky.** Each frame the game asks of every piece in the air: where will the truck be when it lands, and is that inside its circle (with 30% to spare, `FEEL.threatMargin`)? If so its bracket becomes a round mark with an amber ring that closes on it as it comes down, shut when it lands, and cream in the last 0.8 s. Pieces that will miss (on the gun, at least half of them: the autodrive section has the rule) keep the plain bracket, dimmer than before, so the one that matters is the one you see.
- **Off the screen, it is an arrow with the same ring**, on the edge it is coming from, kept clear of the coach line and the storm plate. Two from the same direction share one arrow. The arrow that points at the storm steps aside while it is up.
- **The coach line says so**, in magenta, ahead of anything else it had to say: INCOMING: SHOOT IT DOWN, or ARMOUR INCOMING: SWAP TO ROCKETS when it is a car or a tractor and there is a rocket in the rack.
- **The ranging shot is never ringed**: it is aimed to miss.

### Knowing a shot landed

The old guns fired themselves and it was hard to tell they were doing anything. Now every round answers back, in this order of loudness:

| | You see | You hear |
|---|---|---|
| **A hit** | a cream tick on the reticle, sparks at the impact, the target flashes white | a dry tick (a deeper thump on the storm) |
| **A critical** | a wider amber tick, a white-hot flash and a spray of sparks | a bright two-note ring |
| **A kill** | a green burst on the reticle; the thing comes apart in its own colours, tumbling, with a halo and smoke | a crunch, and an explosion for anything armoured |
| **No effect** | a small grey tick and a word: OUT OF RANGE, or ARMOURED: USE A ROCKET | a dull plink |

Critical hits are something you aim for, not a dice roll: on the storm it is its **heart**, a molten magenta glow on the funnel's wall that drifts back and forth across the side turned toward you (2.2 times the damage; the code still calls it the seam); on wreckage it is dead centre. The height of the funnel around the heart takes full damage; a round anywhere else on the funnel glances (a quarter of it, sparks, AIM FOR THE HEART) and does not count toward accuracy.

Damage shows on the target as well as in a bar. Wreckage chars as it is hit, trails smoke from 30% damage and burns from 65%. The band's lit segments go out as it weakens, it turns from wheat to amber under two thirds and flickers magenta under one third, the funnel thins with it, and each threshold is a crack you hear. Under the reticle a small plate names whatever you are hitting and shows what is left of it, cream then amber then magenta; it goes away a second after you stop.

The reticle is the weapon: an open cross for the gun, corner brackets with a ring that closes into a lock for the launcher. It is cream at rest, amber on something you can hurt, magenta on the seam or a lock, grey out of range. Each piece of wreckage in the air carries a magenta bracket (double for armour, flashing in its last 0.8 s), and an arrow on the edge of the screen when it is out of frame; the ones that will hit you are ringed (above).

**Each rig mounts a different gun.** The Mule's machine gun is the all-rounder: it reaches wreckage 250 m out. The Bulldog's minigun does 35% more damage but sprays, and reaches 212 m. The Whippet's autocannon fires slow, heavy, dead-straight shots for 10% less damage, and reaches 325 m. The reach is the gun's on the turret and in the crew's hands at the wheel alike (until 2.13 the turret ignored it, so the Whippet's long range and the Bulldog's short one were only true of the crew's cover); against an exposed band, inside the danger zone, every gun reaches. Damage per second is the gun's, not its rate of fire: a cannon shell does what a second of machine-gun fire does in a second. They sound different and you see a different weapon in front of you: a jacketed barrel, six barrels in a turning cage, one long barrel with a slotted brake.

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

**Callouts, one at a time, every one read.** The big word in the middle of the screen has a rank: a turn in the fight (TORN OPEN, WEAKENED), a threat (INCOMING, DEBRIS FIELD, CROSSWIND, GET CLEAR, HAIL CORE), a beat (GUNS UP, HOOKED, CORE CRITICAL), or chatter (CLOSE CALL, BOOM, COW, IT IS TURNING, the band cracking, which the sound, the ring and the bar already carry). Nothing is replaced until it has been up 0.6 s, except by something that outranks it; a beat cut short comes back afterwards; a beat that has waited 2.4 s is old news and dropped; chatter that would have to wait is dropped at once. When a band is shot off or the storm is weakened the sky is cleared, and so is anything still queued about it, including a crosswind that was coming. GET CLEAR follows BAND SHOT OFF rather than replacing it in the same frame. Where a callout would overlap the crew's speech plate (it depends on the screen and the words) the plate steps aside until it is gone.

Checked at 667×375, 844×390 and 390×844 by `node tests/layout.mjs`: nothing overlaps, every target is at least 44 px, no text under 12 px.

---

### Sound and the score (2.12)

The live 2.10 build was measured through a tap on its speakers: no music, the same level and colour of noise from the first second of a fight to the last, and a win that was silent three seconds after the kill. The game now has a score. Like every other sound in it, it is synthesised in the browser: nothing to download, it works offline, and it starts on the first tap (a browser rule: no sound before one).

**One tune.** Eight bars over four chords (i, VII, VI, VII, two bars each), a gallop of three, three and two, every held note on the chord under it. `src/score.js` decides what is played and is pure; `src/music.js` is the band, scheduled a fifth of a second ahead on the audio clock from the frame loop, so a dropped frame is never a dropped beat.

| | Key | Tempo | How it plays the tune |
|---|---|---|---|
| **Camp** (title, headquarters) | A minor | 84 | Alone, plucked, every other time round, over a pad. No drums |
| **Skinny Pete** | A minor | 126 | Light: a plucked lead, a backbeat |
| **Big Agnes** | D minor, a fifth lower | 108 | Heavy: brass, half-time drums with the snare once a bar, a bass in three, three, two |
| **The Sisters** | E minor | 138 | The fastest, and the arpeggio is answered a chord tone up, two steps late |

Each band the storm loses makes it 6% faster; the music goes with it, 4% a band.

**It follows the fight.** A change of section lands on the next sixteenth; the tune's bar count never resets, so it carries across a seat change.

| The fight | The band |
|---|---|
| Chasing, out of range | Bass in eighths, hats, a kick: the tune is held back |
| In range, on the gun | The backbeat comes in, the bass gallops, an arpeggio; the tune arrives the second time round |
| Something about to land on you, a later band, a hull under 40% | Pushes harder: sixteenth hats, an extra kick, the bass and pad open up |
| Band shot off, GET CLEAR | A snare roll climbing through each bar over one bass note |
| WEAKENED, the harpoon window | Drops to a suspended chord and a ticking hat that doubles in the last second and a half |
| Hooked, driving the bus in | Everything, four on the floor, the tune from the first bar and doubled an octave up: its moment |
| DOROTHY's ride | No drums or bass: the arpeggio climbing, the pad wide open |
| The kill window | The bass sits on the fifth and wants to come home; snares on the off-beats in the last second and a half |
| The rocket in flight | A roll |
| The kill | The loop stops. A fanfare: the tune's first two bars turned major (keeping its flat seventh), a run up the scale, and the last chord 5.8 s after the kill, which is when the results come up. Then a meadowlark |
| The results | The letter is sounded in the storm's key: one note for a C, a chord for an A, the octave on top for an S, a ring above for a new best. Then the tune again, slow and major, for as long as you stay |
| A wreck | Four notes down, and a low chord left hanging; then the camp's pad |

**Reactive sound.**

- **Wreckage that will hit you pings** (on the gun): the fifth of the key, quicker and louder as the ring closes, lower and doubled for armour. The ring of 2.11 for the ears, for a gunner whose eyes are on the seam.
- **A run of critical hits climbs** the key's pentatonic, a note every half second on the seam; coming off it starts again at the bottom.
- **A hull under 30% has a heartbeat**, quicker the less there is; under 25% the band goes muffled behind it.
- **The band steps back** for a band coming off, a hit, thunder and the harpoon landing, and the wind and the roar give it room: a quarter less wind (which sits where the tune does) and 15% less roar while it plays.

**The Sound button** in the pause menu has three settings: *Sound on*, *Sound on, music off*, *Sound off*. Kept in the save (`settings.music`). With the music off a win still plays its old four notes, and nothing is scheduled.

**Measured, not heard.** `node tests/audio.mjs` renders the score for a whole scripted fight on an offline audio context (the same code and graph the game plays) and measures it, then plays a real fight in the page. Per storm: no clipping (true peak −4 dB or lower on its own bus, −24.5 LUFS, loudness range 7.7), every section audible and each at least 0.02 RMS above 300 Hz, which is all a phone's speaker keeps; on the gun louder than the chase, the line loudest, the harpoon window and the camp quieter; no silent second from the kill through the results; the band follows every phase of a played fight in order; paused it stops; off it schedules nothing; it costs 0.04 ms a frame. In a played fight on the gun, turning the music on leaves the level above 300 Hz where it was (0.09 either way): it takes the room the wind gave up. None of that says whether it is a good tune. That is question 7.

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

## The weapon in your hands (2.17)

You look down each weapon from behind and above, so that is where its detail is: the back plate and its buffer, spade grips with knurled rings and the butterfly trigger, the top cover with its hinge and latch, the rear sight leaf, the ammunition can with its latch, handle and stencil band, and a belt of brass rounds in steel links from the can into the feed. Down the barrel: the Mule's perforated jacket and slotted flash hider; the Bulldog's six barrels with three clamps, the motor behind them and a feed chute from the can; the Whippet's long barrel, chromed recoil sleeve, slotted brake and box magazine. The rocket pod's four tubes have yellow-ringed mouths and chevron-striped straps; Winch's launcher has its cable wound on the drum.

How (`src/geo.js`, `src/gunner.js`): `bev()` is a box with every edge chamfered, the bevels in a lighter worn colour, so the light catches the edges as it would on painted steel; `ao()` darkens the colours low down and between parts. Each weapon is two meshes, painted (satin) and steel (metallic, reflecting the sky), the low tier one Lambert material for both. The reflection is the storm as it is now: `Sky.capture()` renders the dome alone (layer 1) into a 64-pixel cube twice a second where the camera is, so steel shows the shelf and the gold strip under it, not the clear morning the stock cube map was baked from. Every muzzle, spinner and rocket tip is where it was, so recoil, flashes, the minigun's spin and the rack's loaded tips are unchanged.

## Coming apart (2.16)

`fx.blowout(x, y, z, size, color, k)` in `src/fx.js`: the one effect for the storm being hurt, from pooled parts the game already has (flash sprites, dust puffs, debris chunks, sparks), lit and fogged like the storm, and smaller on the low tier. It replaced the energy flipbook, a looping six-petal magenta outline that stayed the same size for its whole life: on the 2.15 lighting it read as a flat flower stamped on a storm that is otherwise volumetric and backlit. Where it plays, and how big:

| Moment | size, colour, k |
|---|---|
| It cracks (two thirds, one third) | 22, amber then magenta, 0.35 |
| The harpoon bites | 18, amber, 0.5 |
| DOROTHY: the core goes critical | four up the funnel, 16, magenta, 0.4 |
| Torn open (a phase lost) | 40, magenta, 1, with the explosion and the gash in the funnel |
| It dies | 60, magenta, 1 |

The energy flipbook's files stay in `assets/fx` (catalogued in `gitcraft.assets.json`) but are no longer loaded: 0.6 MB less to download before the first storm.

## The light (2.15)

The world around the monster is lit to make it look enormous. One idea, everywhere: the light comes from behind the storm as you see it, low, under the shelf.

| | What it does | Where |
|---|---|---|
| **The gold horizon** | The strip of clear sky under the shelf goes a dusty gold (`#c9a466`, not orange), strongest in the storm's direction from the camera and a quarter as strong behind you; the shelf's underside catches it | `src/sky.js` dome |
| **The silhouette** | The funnel's edges take a faint gold rim (the cube of the rim term) against it; its body keeps its cool, dark tones, and its heart, cracks and lightning are untouched | `src/tornado.js` |
| **The shadow** | The storm's shadow on the ground is reached toward the camera (stretched along the line to the storm, offset 1.4 shadow radii toward you), down to 46% of the light at its core, falling off over 4.5 radii, with a broad 80% shelf shadow out to 9; cool in the shadow, faintly warm where the light still reaches | `src/world.js` ground and roads |
| **The vehicles** | The same shadow, worked out for whatever the camera follows, dims the sun (to 30%) and the sky light (to 72%, cooled): your truck and the convoy darken with the ground under them. The sun swings round to behind the storm and drops low, so it rakes | `src/sky.js` |
| **The haze** | Distant ground toward the gold horizon fogs warm (`#9c9072`), the rest stays the storm's cool fog | `src/world.js` |

All of it fades in with the storm (`uGoldK`: the sky's storminess times the storm's fade) and out when it dies. No new pass, render target, mesh or texture; a few lines of arithmetic in shaders that already run, the same on the low tier. Measured with `tests/perf.mjs` on the low tier: medians 29 to 32 fps after, 28 to 31 before (two runs each).

## The monster (2.14)

The ring is gone. The storm used to wear its health as a glowing band around the funnel, a target hung on it; now the funnel is the target and shows everything itself, in the shader (`src/tornado.js`), at no extra cost in meshes:

| | What you see |
|---|---|
| **Its heart** | A molten magenta glow, white at the centre, on the funnel's wall at the phase's height, on the side toward you (on the gun, where the sights' critical point is). It pulses, faster the angrier it is. Dim from outside the danger zone, bright inside it, bright and wide in the finale where it is the harpoon's and the kill shot's mark. |
| **Its wound** | Cracks of the same light spread from the heart as the phase's strength goes, and flare when it is hit: by one third left they reach a long way round the funnel. |
| **Lightning inside it** | Every few seconds pale veins crawl through the whole funnel, more often the angrier it is. |
| **Torn open** | Losing a phase opens a gash where the heart was, white-hot at the edges with the sky showing through, which heals over in about two seconds and moves with the storm; it roars (a low growl sliding down, with a rasp), and it does at WEAKENED too. |
| **Rage** | Each phase lost makes it darker, writhe harder and throw its lightning more often. |

Nothing about the fight changed with it: the phases, their strength, the part of the funnel that takes full damage and the critical point are those of the band and its seam. What is new is that a round on the rest of the funnel glances. The lines widen and fade with distance so they never sparkle on a phone.

## 8. Crew and rigs

Pick up to two to lead. A tap on a crew card stands a leader down, or steps someone up while there is room; with two leading, anyone else is refused (a deny sound, and the header says to stand one down) until you make room: a choice is never swapped out behind your back (until 2.13 picking a third silently dropped whoever had led longest). Any save's crew list loads: unknown names and repeats are dropped, and a damaged one falls back to Doc and Winch.

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
| A harpoon lock on a storm Winch cannot reach | removed (2.11) | measured on the live build: LOCKED at 0.4 s, the trigger refused for up to 5.2 s of a 7 s window. The reticle now says only what is true, and the window waits (at most 6 s) for his truck |
| Hull lost while the autodrive was driving into something | removed (2.11) | a crash you did not steer is not your mistake. It still costs the speed |
| Ground markers as the only warning on the gun | replaced (2.11) | the gun camera looks up; the marker is under the truck. The piece that will hit is ringed in the sky, with a closing ring, and the coach line says so |
| A tractor only a rocket could stop | changed (2.11) | 170 hit points against 1.9 s in the air: with the rack empty it was a hit nothing could prevent. 80, and 0.3 s longer in the air on the gun |
| D for a first win | changed (2.11) | three real-input first wins graded C, D, D. The bottom of the scale was moved (section 2); par, S and A were not |
| Every throw at a truck on the gun aimed at it | changed (2.11) | it cannot dodge and holds a steady line, so every one arrived: Agnes, one every 3 s. Now at most one piece per attack, never two attacks running; the rest land beside the truck |
| A near miss for a piece thrown beside the truck on the gun | not counted (2.11) | nothing was dodged. A near miss is still something you drove |
| The crew's shell spent on a piece that was going to miss | changed, on the gun (2.11) | 6.4 s to come round again there; it is kept for one that will hit |
| Taking less damage on the gun (a flat discount) | not done (2.11) | it hides the problem. The pieces are fewer, slower, rarer after a hit, marked and shootable instead; a hit still costs what it says |
| Crosswind arrows repeated in the gun's sky | not done (2.11) | a crosswind shoves the truck, which the autodrive is driving; on the gun there is nothing to do about it. It is still called |
| A dodge button on the gun | never (2.11) | one seat at a time. DRIVE is the dodge, and it sits beside the trigger |
| Adaptive music, a longer win sting | built (2.12) | the live build's audio was measured flat (no music; the win silent after 3 s). Postponed in 2.11 for fairness on the turret |
| Recorded or generated music files | not used (2.12) | everything else is synthesised and works offline with nothing to download; a file cannot change a note when the fight changes, and stems would be megabytes on a phone. The band is 26 kB of code |
| A different tune per storm | not built (2.12) | one theme you can learn, three ways of playing it. Three tunes would be three you cannot hum |
| A volume slider | not built (2.12) | one button, three settings, no new row in the pause menu at 667×375 |
| The band stepping back under every callout | not done (2.12) | a callout is read, not heard. It steps back for the sounds that carry information |
| Music before the first tap | impossible | browsers do not allow sound until the player has touched the page |
| Stereo, haptics | not started | one speaker on most phones held sideways; haptics need a native wrapper on iOS |

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
src/audio.js     synthesised engine, wind, guns, explosions, and the pings, rings and stings tuned to the storm's key
src/score.js     the score: the theme, each storm's key and tempo, which part of it the fight is in, the fanfare (pure)
src/music.js     the band: plays the score on the audio clock, live or offline
src/hud.js       in-mission HUD     src/ui.js   title, headquarters, results, the Daily Storm, Share
src/grade.js     the letter for a fight and the line that would have raised it (pure)
src/daily.js     the Daily Storm: the Denver day, its seed and streams, the streak, the share text (pure)
src/save.js      the save, and migrate() for every older one
src/main.js      boot, the three cameras (chase, gun, cinematic) and the swing between them, frame loop, resolution governor
```

**Tests.** `node --test tests/*.test.mjs`: the tether's movement, the truck's handling, saves (a real version 1 save), grades, the Daily Storm and the score (every note in the key, the same bar always the same notes), under Node. `node tests/e2e.mjs`: the finale on every storm, the seat-change reasons, the cinematics, the turret's fairness rules (the harpoon out of range, the ring on a piece that will hit, the breather after a hit), the Daily Storm (one scored attempt, the same fight at two frame rates, Share) and a version 1 save loaded cold, in a browser. `node tests/fullfight.mjs`: whole fights by the test aimer at three skills (sharp, thumb, novice: `SKILLS=`, `AIM=deg,delay,rest`), read the way the results screen reads them. `node tests/firstminute.mjs`: the first minute of every storm, played by a scripted player at two gunning skills, every beat timed and every callout checked for being read (`AUDIT=1` prints the timeline). `node tests/audio.mjs`: the music, rendered offline for a whole fight and measured, then followed through a played one (`OUT=<folder>` saves the render as WAV). `node tests/layout.mjs`: the interface bar at the three sizes (`SHOTS=<folder>` saves screenshots). `node tests/driving.probe.mjs` prints the handling numbers.

**The test clock (2.11).** `G.fast`, the tests' fast-forward, stepped the mission at a fixed 1/60 s but left the effects (which carry thrown wreckage) on the real frame time. In a headless browser at 25 frames a second the wreckage ran 20 to 40% ahead of the truck and landed in front of it: about half of every throw "missed" in tests, and none did in play. Every full-fight number from 2.7 to 2.10 was measured in that kinder game, which is why the suites never saw what a played fight showed. Both clocks now take the same step, and the numbers in this document dated 2.11 are measured after the fix.

**Data.** Every band breaks into twelve shards of the storm's pay that fly to the truck, and each is counted as it lands. A fight that ends while shards are still flying (the last band always does: it ends the fight) is paid what is in the air at that moment, once, so the HUD, the results and the save agree. Until 2.13 the last band's shards landed after the fight had been banked and were lost: 60, 110 or 180 data from every win. After the result nothing pays: not a shard, not a second completion. `tests/e2e.mjs` checks it on every storm.

**Saves.** Same key and shape as version 1 (`tornado-hunter/v1`). Data, kills, owned rigs, upgrades and crew carry over. The `winch` and `cable` upgrade levels keep their value and now mean "the line holds longer" and "ordnance" (guns hit harder, one more rocket in the rack per level). Fields are only ever added: `seen` (2.7, the cinematics watched), `grades`, `daily` and `streak` (2.8), `settings.music` (2.12). `migrate()` in `src/save.js` fills in whatever an older save lacks and turns anything unreadable into a fresh start; `tests/fixtures/save-v1.json` is a real version 1 save, loaded by the unit tests and cold in the browser.

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
3. Could you tell what was about to hit you in time to do something about it? On the gun, did you see the ring, and did you shoot the ringed piece or keep working the seam?
4. On the gun, could you hold the seam with a thumb? Did you ever take the wheel back on purpose, and did being put on the gun ever feel like having it taken away? (A scripted gunner on the seam sheds the first band in 15 to 20 s, a sloppy one in 27 to 32: which one is a person?)
5. Harpoon, DOROTHY, lock, kill shot: did that finale feel like the best moment of the fight? Was losing control during the DOROTHY shot welcome or annoying?
6. Did you start the next storm without being asked? Did the line under the grade make you try again? Did you come back for tomorrow's storm?
7. The music: is it a tune, and would you leave it on? On a phone's speaker, is it too quiet under the storm or too loud over the guns? Did the ping make you look up before a piece hit you?
