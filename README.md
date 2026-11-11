# Tornado Hunter

You rope a tornado from a moving truck and tear it apart by driving.

A third-person arcade storm-combat game for the phone in your pocket: one storm per sitting, three to five minutes, no installs. Built with Three.js, runs in iPhone Safari and adds to the Home Screen.

## How it plays

1. **Chase.** Drive to the funnel. Roads are fast; fields are direct.
2. **Probe.** Get dangerously close and feed it a sensor pod. A band of rotation lights up.
3. **Harpoon.** Fire a cable into the exposed band.
4. **Wind.** Swing around the tornado on the cable, against its spin. Keep the line taut, not tight.
5. **Snap.** Rip the band off. The storm bolts. Do it again.
6. **Finish.** With every band gone, drive straight through the eye.

**Touch:** hold the left half of the screen to drive, slide to steer, pull back to brake. One big button on the right does whatever is possible right now (probe, harpoon, cut). Boost and gadget sit beside it.

**Keyboard:** WASD or arrows, Space to act, Shift to boost, E for the gadget, Esc or P to pause.

## Run it

It is a static site with no build step.

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Any static host works.

## Where things are

| Path | What |
|---|---|
| `docs/GAME_DESIGN.md` | The design of record: vision, the tether fight, storms, crew, roadmap |
| `src/config.js` | Every tuning number, colour and data table |
| `src/combat.js` | The mission rules: probe, harpoon, tension, strain, attacks, finisher |
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
