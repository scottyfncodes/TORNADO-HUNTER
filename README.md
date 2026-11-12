# Tornado Hunter

Chase super tornadoes at 140 mph in an overpowered storm truck. Drive in, take the turret, harpoon, Dorothy, kill shot.

An arcade chase-combat game in two seats (third person at the wheel, first person on the gun) for the phone in your pocket: one storm per sitting, a minute or two, no installs. Built with Three.js, runs in iPhone Safari and adds to the Home Screen.

## How it plays

1. **Chase (you drive).** The storm is already running. Dodge what it throws while the crew shoot wreckage out of the air. Get inside the danger zone.
2. **Guns (you shoot).** Crossing into the zone puts you on the turret, first person, and the truck drives itself. Machine gun on the bright seam of the band for critical hits; shoot down what the storm throws before it lands on you; rockets for cars, tractors and satellite twisters. DRIVE takes the wheel back whenever you want it. Bigger storms shed outer bands first, surge and bolt, and you are back at the wheel to outrun the debris wall.
3. **Harpoon (Winch's truck).** The finale is a seat each: the camera swings across to Winch's harpoon truck. Hold the launcher on the glow until it locks, and hook the storm. It is restrained, not tamed: it goes nowhere, but it fights the line, twisting and lunging, and every lunge that can reach you is telegraphed (it leans, the line goes taut, the ground is marked) before it comes.
4. **DOROTHY (Doc's bus).** You have the wheel of the science bus. Drive it right to the foot of the harpooned funnel, past its lunges, into the green ring, and DOROTHY is set down. Hit DEPLOY: a swarm of sensors is sucked in and swirls inside the funnel; the camera rides with them while the truck drives itself. The core goes critical.
5. **Kill shot (Sparks' rocket truck).** Hold the launcher on the glowing core until it locks, then one rocket.

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
node --test tests/*.test.mjs   # the harpooned storm's movement: bounds, continuity, telegraphs, escalation, fairness
node tests/e2e.mjs             # the finale in a browser, every storm: harpoon, bus, DOROTHY, kill shot, the line running out
```

## Where things are

| Path | What |
|---|---|
| `docs/GAME_DESIGN.md` | The design of record: the chase-combat loop, driving, arsenal, storms, what was cut |
| `src/config.js` | Every tuning number, colour and data table |
| `src/combat.js` | The mission: storm AI, wreckage, the two seats, DOROTHY, harpoon, surge |
| `src/tether.js` | The harpooned storm fighting the line: lunges, telegraphs, escalation, fairness |
| `tests/` | The tether's rules under Node, and the finale played in a browser |
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

Progress is saved in the browser. Nothing is sent anywhere.
