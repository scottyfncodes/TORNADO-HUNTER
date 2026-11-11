# Tornado Hunter

Chase super tornadoes at 140 mph in an overpowered storm truck. Guns, harpoon, Dorothy, kill shot.

A third-person arcade chase-combat game for the phone in your pocket: one storm per sitting, a minute or two, no installs. Built with Three.js, runs in iPhone Safari and adds to the Home Screen.

## How it plays

1. **Chase.** The storm is already running. Dodge what it throws; the guns shoot wreckage out of the air. Get inside the danger zone.
2. **Guns.** In the zone the guns weaken the storm. Hit BURST to pour it on. Bigger storms shed outer bands first, surge and bolt.
3. **Harpoon.** Hook the weakened storm. It is dragged to a crawl.
4. **DOROTHY.** The camera rides with the sensors up the funnel while the truck drives itself. The core goes critical.
5. **Kill shot.** One rocket.

**Touch:** hold the left half of the screen to drive, slide to steer, pull back to brake, pull back while steering to drift. Right thumb: BOOST, and one big button that is always the next step (BURST, HARPOON, DOROTHY, KILL SHOT).

**Keyboard:** WASD or arrows, Space for the action button, Shift boost, Esc or P pause.

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
