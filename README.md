# Tornado Hunter

Chase super tornadoes at 140 mph in an overpowered storm truck. Shoot down what they throw, rocket the core, rip them apart.

A third-person arcade chase-combat game for the phone in your pocket: one storm per sitting, a minute or two, no installs. Built with Three.js, runs in iPhone Safari and adds to the Home Screen.

## How it plays

1. **Chase.** The storm is already running. Roads are fast; fields are the shortcut. Boost to close in.
2. **Survive.** It throws cars, tractors and barn doors at where you are going. Your gunner shoots them down; you steer off the magenta circles.
3. **Open it.** Get inside its inflow and drop DOROTHY. The core is exposed for nine seconds.
4. **Hit it.** Rockets into the open core until it staggers.
5. **Rip it.** Harpoon the staggered storm and floor it. A band tears off.
6. **Escape.** Outrun the wall of debris, then chase it down again. Three bands and it is gone.

**Touch:** hold the left half of the screen to drive, slide to steer, pull back to brake, pull back while steering to drift. Right thumb: ROCKET, BOOST, and DOROTHY (which becomes HARPOON when the storm staggers).

**Keyboard:** WASD or arrows, Space rocket, E Dorothy or harpoon, Shift boost, Esc or P pause.

## Run it

It is a static site with no build step.

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Any static host works.

## Where things are

| Path | What |
|---|---|
| `docs/GAME_DESIGN.md` | The design of record: the chase-combat loop, driving, arsenal, storms, what was cut |
| `src/config.js` | Every tuning number, colour and data table |
| `src/combat.js` | The mission: storm AI, wreckage, guns, DOROTHY, rockets, harpoon, surge |
| `src/tornado.js` | The funnel, its bands and debris (shaders) |
| `src/world.js` | Terrain, the baked ground texture, towns, farms and props |
| `src/rig.js` | The vehicle and its arcade handling |
| `src/convoy.js` | The crew's camper truck and bus that flank you |
| `src/main.js` | Boot, camera, state machine, frame loop |
| `ui/styles.css` | The interface |
| `assets/` | Terrain, sky, effects, brand and icons |
| `vendor/` | Three.js r170 (MIT) |
| `fonts/` | Alfa Slab One and Barlow Semi Condensed (SIL OFL 1.1) |

Progress is saved in the browser. Nothing is sent anywhere.
