# Tornado Hunter

Chase super tornadoes at 140 mph in an overpowered storm truck. Drive in, take the turret, harpoon, Dorothy, kill shot.

An arcade chase-combat game in two seats (third person at the wheel, first person on the gun) for the phone in your pocket: one storm per sitting, a minute or two, no installs. Built with Three.js, runs in iPhone Safari and adds to the Home Screen.

## How it plays

1. **Chase (you drive).** The storm is already running. Dodge what it throws while the crew shoot wreckage out of the air. Get inside the danger zone.
2. **Guns (you shoot).** Crossing into the zone puts you on the turret, first person, and the truck drives itself. Machine gun on the bright seam of the band for critical hits; shoot down what the storm throws before it lands on you; rockets for cars, tractors and satellite twisters. DRIVE takes the wheel back whenever you want it. Bigger storms shed outer bands first, surge and bolt, and you are back at the wheel to outrun the debris wall.
3. **Harpoon (Winch's truck).** The finale is a seat each: the camera swings across to Winch's harpoon truck. Hold the launcher on the glow until it locks, and hook the storm. It is restrained, not tamed: it goes nowhere, but it fights the line, twisting and lunging, and every lunge that can reach you is telegraphed (it leans, the line goes taut, the ground is marked) before it comes.
4. **DOROTHY (Doc's bus).** You have the wheel of the science bus. Drive it right to the foot of the harpooned funnel, past its lunges, into the green ring, and DOROTHY is set down. Hit DEPLOY: a swarm of sensors is sucked in and swirls inside the funnel; the camera rides with them while the truck drives itself. The core goes critical.
5. **Kill shot (Sparks' rocket truck).** Hold the launcher on the glowing core until it locks, then one rocket.

Whenever the game changes your seat for you, the line under the storm says why, and how to take the wheel back. The DOROTHY ride and the kill-shot camera play in full the first time; after that a tap skips them.

In about a third of chases a grain elevator stands beside the road ahead. The storm passes it, it creaks, and as you arrive it comes down across the road in three pieces, the ground under each marked in magenta: keep to the lane it does not reach, or take the field.

Hail cores and lightning come and go over a fight: stones on the lens, a slick road, the distance closing in, and thunder that arrives when the distance says it should.

**Touch, at the wheel:** hold the left half of the screen to drive, slide to steer, pull back to brake, pull back while steering to drift. Right thumb: BOOST, and one big button that is always the next step (GUNS, HARPOON, DOROTHY).

**Touch, on the gun:** drag anywhere to aim, hold FIRE (the thumb on FIRE can slide to aim too). ROCKETS / GUN swaps weapon, DRIVE takes the wheel.

**Keyboard and mouse:** WASD or arrows drive, Space takes the turret, Shift boost. On the gun: mouse or arrows aim, click or Space fires, Q swaps weapon, F takes the wheel. Esc or P pause.

## Run it

It is a static site with no build step.

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Any static host works.

Tests (Node 22, no dependencies; the browser test uses Playwright with Chromium):

```
node --test tests/*.test.mjs   # the tether, the handling, saves (a real v1 save), grades and the Daily Storm
node tests/e2e.mjs             # the finale on every storm; seat reasons; skipping cinematics; the Daily Storm; a v1 save loaded cold
node tests/firstminute.mjs     # the first 60 s of every storm, every beat timed, every callout checked (AUDIT=1 for the timeline)
node tests/layout.mjs          # 44 px targets, 12 px text, no overlaps at 667x375, 844x390, 390x844 (SHOTS=dir to save them)
node tests/driving.probe.mjs   # what the handling numbers mean: corners, drifts, the cost of a tree
node tests/fullfight.mjs       # whole fights by the test aimer: what the grade sees (GRADE is calibrated from it)
```

## Where things are

| Path | What |
|---|---|
| `docs/GAME_DESIGN.md` | The design of record: the chase-combat loop, driving, arsenal, storms, what was cut |
| `src/config.js` | Every tuning number, colour and data table |
| `src/combat.js` | The mission: storm AI, wreckage, the two seats, DOROTHY, harpoon, surge |
| `src/grade.js` | The grade for a fight, and the one line on what would have raised it |
| `src/daily.js` | The Daily Storm: the day in Denver, its seed and streams, the streak, the share text |
| `src/save.js` | The save (`tornado-hunter/v1`), and `migrate()` for every older one |
| `src/setpiece.js` | The grain elevator: placed on the road ahead, the storm's pass, the telegraph, the fall, the escape line |
| `src/tether.js` | The harpooned storm fighting the line: lunges, telegraphs, escalation, fairness |
| `tests/` | The tether and the handling under Node; the finale, the first minute and the layout in a browser |
| `src/gunner.js` | The turret: first-person aim, hits and criticals, rockets and lock-on, autodrive, the weapon you see |
| `src/weather.js` | Hail cores and ambient lightning |
| `src/tornado.js` | The funnel, its bands and debris (shaders) |
| `src/world.js` | Terrain, the baked ground texture, towns, farms and props |
| `src/rig.js` | The vehicle and its arcade handling |
| `src/convoy.js` | The crew's vehicles: Winch's harpoon truck, Doc's science bus, Sparks' rocket truck, and the seats on them |
| `src/main.js` | Boot, camera, state machine, frame loop |
| `ui/styles.css` | The interface |
| `assets/` | Terrain, sky, effects, brand and icons |
| `vendor/` | Three.js r170 (MIT) |
| `fonts/` | Alfa Slab One and Barlow Semi Condensed (SIL OFL 1.1) |

**After every fight:** a grade (S to D) from time, hull, accuracy, crits and near misses, the best one per storm kept, and one line on what would have raised it.

**The Daily Storm:** one storm a day for everyone (the date in Denver picks it and seeds it), one scored run plus unlimited practice, a streak on the title, and a spoiler-free result to share.

Progress is saved in the browser. Nothing is sent anywhere: Share hands the text to your phone's share sheet or clipboard.
