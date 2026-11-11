# TORNADO HUNTER: Game Design

*Design of record for the playable MVP. Written before the code; the code follows it. Tuning numbers live in `src/config.js` and are the ones that survived play.*

---

## 0. The one-paragraph game

You drive a storm-chasing rig across the plains to a tornado that is walking toward a town. You get dangerously close and feed it a sensor probe, which exposes one of the **bands** of rotation holding it together. You harpoon that band, and then you fight it the only way a truck can: you **swing around the tornado on the cable, against its spin, and wind the band off**. Do that to every band and the funnel thins to a rope, and you finish it by driving straight through its eye. Three to five minutes, one storm, one upgrade bought with what you took from it.

The storm is the boss. Your steering wheel is the weapon.

---

## 1. Creative vision and identity

**Fantasy.** "You're a tornado hunter. Literally." Not a meteorologist, not a soldier: a rodeo rider whose bull is a mile tall. The tone is a garage full of lovable cranks who are extremely serious about something ridiculous, facing weather that is never a joke.

**Identity: Doppler rodeo.** The whole look comes from one image: the hook echo on a weather-radar scope, printed like a county-fair rodeo poster. The radar reflectivity scale (green, amber, magenta) is the only colour that technology is allowed to use. That one rule does a lot of work:

- A band's colour *is* its state. Green: exposed. Amber: under strain. Magenta: about to go, or about to hurt you.
- The tether, the ring on the ground, the HUD and the menus all speak the same three colours, so nothing on screen needs a legend.
- Everything else is the world: a bruise-green supercell sky, wheat-gold land, a rig painted to be seen.

**What it is not.** Not a neon cyber HUD. Not a cowboy theme park (no rope borders, no sheriff stars). Not a free-to-play shop. Not photoreal grey mush.

**Three directions were weighed.** *Garage blueprint* (cyanotype drawings and masking tape) is charming in a menu and invisible against a storm sky. *Storm-spotter field guide* (cream paper, halftone diagrams) fights a dark world and glares on a phone at night. *Doppler rodeo* won because it gives the combat its colour code for free and reads at phone size.

**Names are our own.** The crew, the rigs, the storms and the gadgets are original. Twister and Ghostbusters are a mood, not a source: there is no "Dorothy", no proton anything, no borrowed characters.

---

## 2. Minute-to-minute

| Time | What the player is doing | What they feel |
|---|---|---|
| 0:00 | Title. One button. First-timers go straight to the first storm; everyone else to HQ. | No homework |
| 0:05–0:50 | **HQ.** The radar board shows the storms on offer: name, EF rating, temperament, the town in its path, the payout. Pick one. Pick a rig, two crew, one gadget. Roll out. | A plan |
| 0:50–1:20 | **Chase.** The funnel is already on the horizon. Road is fast and bends; fields are direct, slower, and full of fences to smash. Debris starts landing. The sky gets darker the closer you get. | Dread, speed |
| 1:20–1:35 | **Probe.** Inside the inflow, the grass streams toward the funnel and so do you. Drop the pod, watch it get eaten, get out. | Danger close |
| 1:35–1:45 | **Harpoon.** The exposed band is lit. Line it up, fire, the cable snaps taut. | Got it |
| 1:45–2:15 | **Wind.** Swing around the funnel on the cable against its spin. Hold the ring. Dodge what it throws. Ease off when the cable screams. | A fight |
| 2:15 | **Snap.** Freeze, flash, thunder. The band bursts into Data. The storm bolts. | Payoff |
| 2:20–4:00 | Do it again to a thinner, faster, angrier storm that has learned a new trick. | Escalation |
| 4:00 | **Finisher.** The rope-thin funnel is thrashing. Drive through it. Slow motion; the sky tears open to blue. | Triumph |
| 4:10–4:40 | **Results.** Data banked, the unlock you earned, one upgrade to buy. Next storm is one tap away. | One more |

One turn of the core loop (probe, harpoon, wind, snap) is about 45 seconds.

---

## 3. The combat mechanic: the tether fight

### The problem with the obvious design

"Shoot the tornado until its bar is empty" is a shooter with a tornado-shaped health bar. It also wastes the one thing the player is already doing with both thumbs, which is driving. So the rule for this game is: **every attack on the storm is made with the steering wheel and the throttle.**

### How it works

A tornado is held together by **bands**: rings of rotation stacked up the funnel. Skinny Pete has two; the big ones have three. The storm has no health bar. It has bands, and you can see them.

1. **Probe (analyze, reveal).** Bands are shrouded until the storm swallows a sensor pod. To feed it one you must be inside the inflow, within about 90 m, where suction is dragging the rig in and debris is landing. The pod spirals up the funnel and the next band lights up green.
2. **Harpoon (deploy).** From anywhere within about 165 m with the band in view, fire. The harpoon is auto-aimed: the skill is being in the right place, not pixel-hunting on a phone. The cable goes taut at about 100 m and a ring appears on the ground at exactly that radius.
3. **Wind (position, destabilize).** The band only strains while two things are true: the cable is **taut**, and you are orbiting **against the storm's spin** (chevrons on the ring show which way). So you swing around the tornado like a hammer thrower, held on the ring by the cable. Strain per second scales with how fast you are orbiting.
4. **Hold the tension (survive).** This is the fishing fight.
   - Suction pulls you inward: the cable goes **slack**, the strain stops. Steer out.
   - Pull too hard, or let the storm lunge away: the cable goes **magenta** and shrieks. Ease in, or it snaps in under a second. A snapped line costs a 2 s reload and jerks the rig; strain is kept down to the last quarter mark, so a mistake costs seconds, not the fight.
   - Meanwhile the storm throws debris, lightning and its own body across the ring you are trying to hold. Every attack lands on a magenta ground telegraph that closes for at least 0.8 s first.
5. **Snap.** At 100% the band rips off. The funnel visibly narrows, sheds Data, and bolts on a new heading. The line is gone. Chase it down and do it again.
6. **Finisher.** With every band gone the funnel is a thin, thrashing rope with its core exposed. The thing you have been avoiding all fight becomes the target: **drive through the eye.**

A tethered storm also moves at roughly half speed. You are not only hurting it, you are holding it back from the town. That is the heroic read, and it makes "keep the line on" matter even while you are dodging.

### Equipment synergy and positioning

- **Ground Anchor.** Stakes your line to the earth for a few seconds. It keeps winding on its own at a reduced rate while you are free to dodge, collect, or land a **second** harpoon from the far side. Two lines more than 70 degrees apart is **Crossfire**: double strain. This is the "position your teammates" beat without asking a phone player to command AI.
- **Thumper** (pressure cannon). A shockwave that swats debris out of the air around you and interrupts the storm's current attack. A panic button with a long cooldown.
- **Where you fight matters.** The ring sweeps over whatever the storm walks across. Open field is clean but soft and slow. A farmstead on the ring is cover the storm will turn into ammunition. Roads crossing the ring are a free burst of speed. Dragging the storm off its line toward open ground is a real choice.

### Why it is fun, what could go wrong, how it is simplified

| | |
|---|---|
| **Fun** | Swinging around a tornado on a cable at 70 mph is a feeling no other game has. Tension is a proven core loop (every good fishing game); here your whole vehicle is the rod. The storm visibly comes apart, so progress is read off the monster, not a bar. |
| **Could frustrate** | Not knowing which way to orbit. Line snapping "for no reason". Losing the storm off-screen while turning. Too many steps before anything happens. |
| **Simplified** | Chevrons on the ground ring show the direction; the first storm coaches it. Tension is one colour on one cable, mirrored on one gauge, with a generous sweet zone. The camera always keeps the funnel in frame. One context button does probe, harpoon and cut, and it only lights when the action will work. Aim is automatic. |

**Cut from the brief, on purpose:** energy nets, weather-modification projectiles and drone swarms as separate weapons. They would be more buttons that do "damage" in slightly different colours. The tether is the weapon; gadgets change *how you hold it*. More gadgets come later only if they change the driving.

---

## 4. Rigs and crew

### Rigs (pick one)

| Rig | Idea | Strength | Price |
|---|---|---|---|
| **The Mule** | A farm pickup with a harpoon turret bolted on | Balanced. The one you learn on. | Start |
| **Bulldog** | An armoured brick on big tyres | Most hull, shrugs off suction, slow to turn | Data |
| **Whippet** | A stripped desert buggy | Fastest, tightest, longest boost, made of paper | Data |

The three differ in how they hold the ring: Bulldog can sit deep in the inflow and ignore slack; Whippet winds fastest but dies to two mistakes.

### Crew (pick two of four)

| Crew | Role | In play |
|---|---|---|
| **Doc Vane** | Analyst. Has been wrong about exactly one storm and will tell you about it. | Probes work from further out; telegraphs appear earlier. |
| **Winch Okafor** | Rigger. Trusts steel cable and nothing else. | Wider sweet zone; the line survives over-tension longer. |
| **Sparks Marín** | Engineer. Everything on the rig is "technically finished". | Hull slowly repairs; boost recharges faster. |
| **June Bug** | Spotter. Seventeen, flies the drone, is not supposed to be here. | Data flies to the rig from much further away; +20% Data. |

Each talks on the radio during the fight (short barks on a plate, never blocking the view).

| | |
|---|---|
| **Fun** | A loadout you can say out loud: "Whippet, Winch and June, with an anchor." |
| **Could frustrate** | Choices that are secretly mandatory, or that you cannot feel. |
| **Simplified** | Every perk changes a number the player touches every second (range, sweet zone, boost, pickup). No crew levelling in the MVP. |

**The convoy.** The rest of the crew rides in a camper truck and a converted bus that flank your rig on the chase, plough through the same fences you do, stop short of the funnel and run if it comes at them. They are company and atmosphere, not units to command.

**Challenged:** the brief asks for a *convoy* of vehicles and AI teammates taking contextual commands. On a phone, with two thumbs already driving, a command wheel is a pause menu in disguise. The MVP puts the crew **in your rig** and gives the "second unit" job to the Ground Anchor. A real AI wingman (a second truck that holds a line for you) is the first thing on the roadmap, because the anchor already proves the mechanic it would use.

---

## 5. Weapons and gadgets

**Always fitted:** probe launcher, harpoon winch, boost.

**Gadget slot (one, a second later):** Ground Anchor, Thumper.

**Upgrades (three levels each, bought with Data):**

| Track | Effect |
|---|---|
| Winch | Bands wind faster |
| Cable | Longer harpoon range, wider sweet zone |
| Plating | More hull |
| Turbo | Stronger, faster-recharging boost |

**Challenged:** five loadout categories (crew, vehicles, weapons, defensive, consumables) cannot be chosen meaningfully in 30 to 90 seconds on a phone. Defensive gear became rig stats and the Plating track. Consumables are cut: inventory bookkeeping is not fun and "save it for later" items never get used. Three choices remain: rig, crew, gadget.

---

## 6. The storms

Each storm is a temperament, not a bigger number.

| Storm | Type | Bands | Temperament | How it changes your driving |
|---|---|---|---|---|
| **Skinny Pete** | EF1 rope | 2 | Twitchy, zigzags, throws light debris; lightning after the first band | Short, forgiving fight. Teaches probe, harpoon, orbit. |
| **Big Agnes** | EF3 wedge | 3 | Slow, enormous, with suction that eats your slack; debris lands in pairs | You fight the pull the whole time. Bulldog country. |
| **The Sisters** | EF4 multi-vortex | 3 | Satellite twisters ride the ring toward you; the main funnel reverses spin mid-band | You must slip the satellites and turn the whole orbit around on demand. |

Shared attack vocabulary (each one telegraphed on the ground):

- **Debris volley.** Whatever it has eaten comes back: hay bales, fence, a barn door, a cow. Circles close on the ring ahead of you.
- **Lightning.** A circle that tracks you, locks, then strikes.
- **Lunge.** The funnel leans and charges. Slack and danger at once.
- **Suction surge.** The inflow doubles for a few seconds; grass and dust show it.
- **Satellites** (Sisters only). Small funnels orbiting on your ring, the wrong way.
- **Spin reversal** (Sisters only). The chevrons flip. Turn around.

After each band the storm gets narrower, faster and adds an attack. Beating a storm unlocks the next one and a **rematch** at +1 EF with quicker telegraphs and a bigger payout.

| | |
|---|---|
| **Fun** | Learning a storm's habits and beating it with a loadout chosen for it. |
| **Could frustrate** | Unreadable attacks through rain and debris; a storm that simply outruns you. |
| **Simplified** | One telegraph language (a closing magenta circle). Storms slow when tethered and never outrun the Mule on a road. |

---

## 7. Missions and progression

**A mission** is one storm, one town in its path, one sitting. You fail if the rig is wrecked or the storm reaches the town. Either way you keep the Data you picked up and retry in one tap.

**One currency: Storm Data.** It drops from probes, from every snapped band and from the finisher, and it buys rigs, gadgets and upgrades.

**Unlocks** come from first kills, not from a shop: Skinny Pete unlocks Big Agnes and the Thumper; Big Agnes unlocks The Sisters and the Bulldog's blueprint; and so on. **Rank** is a title earned from total bands snapped (Rookie, Wrangler, Storm Boss). It is a brag, not a gate.

**Challenged:** the brief lists eight reward types (credits, salvage, data, reputation, blueprints, vehicle upgrades, crew progression, regions). Eight currencies is an economy; this is a five-minute game for friends. One spendable currency, unlocks from kills, a cosmetic rank. No timers, no energy, no purchases, no waiting, ever.

| | |
|---|---|
| **Fun** | Every run buys something you feel on the next one. |
| **Could frustrate** | Grinding the same storm to afford the next thing. |
| **Simplified** | Prices are set so a clean first kill affords one upgrade, and each new storm pays more than the last. |

---

## 8. Controls and HUD

**Landscape, two thumbs.** It works in portrait; it is built for landscape.

- **Left thumb, anywhere on the left half:** a floating stick. Left and right steer. Up is throttle, down is brake then reverse.
- **Right thumb:** one large **context button** (PROBE, then HARPOON, then CUT LINE). It is dim when the action will not work and amber when it will. **BOOST** and **GADGET** sit on an arc beside it.
- **Pause:** a small plate top-right, out of thumb travel.
- **Keyboard** (desktop): WASD or arrows, Space for the action, Shift to boost, E for the gadget, Esc or P to pause.

**HUD: five things, bolted down.**

1. **Hull** (top-left): a segmented plate.
2. **Storm plate** (top-centre): name, EF, a pip per band, and the town ETA.
3. **Strain gauge** (appears when tethered): the current band's percentage and the tension needle, coloured like the cable.
4. **Data** (top-right, beside pause).
5. **Coach line** (lower centre, first storm and on new mechanics only): one short instruction at a time.

Everything else is in the world: the ring on the ground, the chevrons, the cable's colour, the telegraph circles, an edge arrow when the storm is off screen.

| | |
|---|---|
| **Fun** | Thumbs never leave their zones; eyes never leave the storm. |
| **Could frustrate** | Fat-thumbing the wrong button; a HUD that covers the funnel; iOS swallowing swipes near the edges. |
| **Simplified** | One context button instead of three. Targets of at least 72 px. Safe-area insets respected. Gestures, selection, zoom and scroll are disabled on the play surface. |

---

## 9. Art direction

- **World.** Chunky low-poly with flat colour and one oversized feature per object, so each reads at 40 px: the rig's harpoon turret, the barn's roof, the silo's dome. A patchwork of wheat, plough and pasture cut by gravel roads. No textures to paint; colour and silhouette do the work.
- **The tornado** is the only soft, curved thing on screen. A dark, twisting funnel under a rotating wall cloud, wrapped in orbiting debris, with its bands glowing in radar colours. It leans into its travel and narrows as it loses bands.
- **Sky.** A green-black storm shelf overhead with a strip of clear morning at the horizon, so silhouettes always have something bright behind them. When the storm dies the shelf tears open and the whole sky goes to that morning blue. The clearing is the reward.
- **Light.** Low warm sun under the cloud base, cold fill from above, lightning as the only flash.
- **Vehicles.** Storm-chaser trucks built in a garage: lifted and boxy, a roof light bar that wig-wags when the storm is close, a bull bar, a whip antenna, and in the bed a hazard-striped cradle of probe canisters under a red beacon. Headlights stay on in the gloom. The look borrows the vocabulary of 1990s chase vehicles; the liveries and names are our own.
- **The funnel's base** boils with a low, dark skirt of dirt, so the storm always looks like it is chewing the ground.
- **Interface.** Riveted instrument plates with one clipped corner, 2 px keylines, slab buttons with a hard drop edge. One strip of yellow-and-black hazard tape per panel, the same as the cradle on the rig. Alfa Slab One for names and verdicts (wood type from a rodeo handbill). Barlow Semi Condensed for everything you read at speed (the lettering of American highway signs). No glow, no glass, no gradients.
- **Motion.** The storm never stops; the interface never drifts. Only the action button may flash. Shake is reserved for hits and snaps. Reduced-motion turns shake and flashes off.

---

## 10. Technical architecture

**Decision: Three.js on WebGL2, plain ES modules, no build step, installable as a web app.**

| Option | Verdict |
|---|---|
| **Three.js (WebGL2)** | Chosen. Small, runs in iPhone Safari today, total control over draw calls and shaders. |
| Babylon.js | Heavier engine than this game needs; its tooling is aimed at bigger scenes. |
| PlayCanvas | Good on mobile but editor-centred, which fights a GitHub-and-Claude-Code workflow. |
| Unity or Godot web export | Tens of megabytes before the game starts, slow cold load, memory pressure on iOS. |
| WebGPU | Not yet dependable across the iPhones friends actually own. A later option for effects. |

**Structure.** A static site: `index.html`, `src/*.js` modules, `vendor/three`, `assets/`. No bundler, so what is in the repository is what ships. A service worker makes the Home Screen app work offline.

```
src/config.js    every tuning number, the palette, storms, rigs, crew, gadgets, prices
src/main.js      boot, state machine (title, HQ, mission, results), the frame loop
src/world.js     terrain, baked ground texture, roads, props, height sampling
src/sky.js       sky dome, cloud deck, rain, light
src/rig.js       the vehicle: model and arcade handling
src/tornado.js   the funnel, the bands, storm AI and attacks
src/combat.js    probe, harpoon, tether tension, strain, anchors, data
src/fx.js        flipbooks, debris, shake, hit-stop
src/audio.js     synthesised wind, engine, thunder, stingers (no audio files)
src/input.js     touch stick and buttons, keyboard
src/hud.js       the in-mission HUD
src/ui.js        title, HQ, results
src/save.js      progression in localStorage
```

**Limits identified early, and the answer to each:**

| Risk | Answer |
|---|---|
| **Mobile GPU fill rate.** A tornado is a screen-filling transparent object. | The funnel is one opaque-cored mesh with a cheap shader (one noise lookup), not layered particles. No post-processing. No shadow maps: blob shadows. Resolution scales itself down when frames run long. |
| **Draw calls.** | Props are instanced by type. The ground is one mesh with one texture baked at load from the terrain masks, with roads and field patchwork painted in. |
| **Physics.** | No physics engine. The rig is kinematic arcade handling on a sampled heightfield; the cable is a distance constraint; debris is animated in the vertex shader. Deterministic and nearly free. |
| **Tornado rendering.** | A lathe mesh bent along a wobbling spine in the vertex shader, with scrolling noise for rotation. Bands are rings on that same spine. Debris is one instanced mesh orbiting on the GPU. |
| **Touch.** iOS Safari scrolls, zooms, selects and swipes back. | `touch-action: none`, no selection or callouts, pointer events with capture, safe-area insets, controls kept clear of the screen edges. |
| **Audio on iOS.** | Web Audio unlocked on the first tap; all sound is synthesised, so there is nothing to download or decode. The game is fully readable muted. |
| **Orientation.** iOS cannot lock it. | The game plays in portrait and says, once, that landscape is better. |
| **Memory and load.** | A few megabytes total, self-hosted fonts, no external requests. |

---

## 11. The MVP

**In:**

- Title, HQ (storm board, rig, crew, gadget, upgrades), mission, results. One-tap retry.
- The whole tether fight: probe, harpoon, tension, strain, snap, bolt, finisher.
- Three storms with distinct behaviour: Skinny Pete, Big Agnes, The Sisters. Rematches.
- Three rigs, four crew, two gadgets, four upgrade tracks.
- One currency, kill-based unlocks, saved progress.
- One plains region with roads, fields, farmsteads and a town to protect.
- Coached first storm. Touch and keyboard. Synthesised audio. Offline Home Screen app.

**Out (and why):**

- AI convoy and commands: the anchor proves the idea first.
- Multiple regions and biomes: one good arena beats three thin ones.
- Crew levelling, consumables, extra currencies: bookkeeping.
- Nets, drones, weather projectiles: more buttons, same verb.
- Story campaign, cutscenes, voice: tone comes from barks and names for now.

---

## 12. Roadmap

| Phase | Goal | Contents |
|---|---|---|
| **1. MVP** (this build) | Prove that roping a tornado is fun | Everything in section 11 |
| **2. Feel pass** | Make the first minute undeniable | Tuning from real phone play; haptics; richer debris and destruction; recorded sound where synthesis falls short |
| **3. The wingman** | Team combat | A second rig driven by AI that holds a line on command (one button: "hold" or "follow"); crossfire as a duo move; rescue when wrecked |
| **4. New country** | Variety in the driving | A river-valley region (bridges as choke points) and a town-edge region (streets as cover and as ammunition); night storms |
| **5. Stranger storms** | New temperaments | A fire whirl that leaves burning ground on the ring; a waterspout fought from a levee road; a rain-wrapped storm you track by probe pings alone |
| **6. The garage** | Expression | Rig paint and decals earned from kills; a third gadget family that changes the cable itself (elastic, electrified, split) |

Each phase ships as something playable from the same link. Nothing in it needs a server.

---

## Open questions only play can answer

These are handed to a person; no test can pass them.

1. On your first storm, did you understand you had to orbit against the spin without reading the prompt twice?
2. When the line snapped or the rig was wrecked, did you know why, and did you hit retry?
3. Did swinging around the tornado on the cable feel like fighting it, or like holding a stick while a bar filled?
4. Was the drive to the storm something you would have missed if it were cut?
5. After beating Skinny Pete, did you start the next storm without being asked?
6. Holding the phone in landscape, did either thumb ever cover something you needed to see?
