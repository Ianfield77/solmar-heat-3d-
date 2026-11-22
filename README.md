# Solmar Heat

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/Ianfield77/solmar-heat-3d-/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard)
[![reward](https://make.fun/badge/gta6-01/Ianfield77/solmar-heat-3d-/reward.svg)](https://make.fun/bounty/gta6-01)

An original open-world crime game in the spirit of GTA 6, built for the
[make.fun **gta6-01 "Make GTA 6"** bounty](https://make.fun/bounty/gta6-01). It runs offline in a desktop
browser from static files — no network requests, no build step. Three.js is
vendored under `game/vendor/`.

You are **Rico Vega**, fresh out of the Solmar docks with a debt to the
Marlow crew. Explore the sun-soaked coastal city of **Solmar Bay** on foot
and by car, steal rides, outrun the Solmar Bay Police, and run five chained
story missions to buy your freedom.

## Systems

- **Open city** — procedural grid streets, towers, a beach, ocean and pier,
  with a landmark tower, park and docks.
- **On foot and by car** — third-person walking with sprint and jump, plus
  arcade car handling.
- **Traffic and pedestrians** — NPC cars cruise the avenues, walkers stroll
  the sidewalks and flee from gunfire.
- **Car theft** — walk up to any parked or cruising car and press **E**.
- **Wanted system** — 5 stars. Stealing cars and firing guns draw heat;
  police units chase, ram, and bust you if they pin you down. Lay low to
  cool off.
- **Five missions** — gold beacons mark each objective: steal a getaway car,
  run a courier package, clear out the rival Vulture crew, lose a 3-star
  heat wave, and crack the Solmar Bank vault.
- **Combat** — hitscan pistol with tracers; rival crew members return fire.
- **HUD + live minimap** — wanted stars, cash, health, mission objective,
  speedometer, and a real-time top-down map with traffic, police, rivals
  and the mission beacon.
- **Start screen and saves** — autosave after every mission, manual save
  with **H** (localStorage).
- **Synthesized sound** — engine hum, police sirens, gunshots and a sunny
  bassline, all generated live with WebAudio. No audio files.

## Controls

| Key | Action |
| --- | --- |
| W A S D | Move / drive |
| Mouse / ← → | Look around (click to lock the pointer) |
| E | Steal / enter a car |
| F | Leave the car |
| Click | Shoot |
| Shift | Sprint |
| Space | Brake (car) / jump (on foot) |
| H | Save game |
| M | Mute sound |
| R | Reset to the city center |

## Run it

```sh
node serve.ts        # serves game/ at http://localhost:8931/
```

Open the URL in desktop Chrome and click **START ENGINE**.

## Hand in

```sh
node main.ts         # writes the entry to /output (or $MAKEFUN_OUTPUT_DIR)
```

## License

MIT — see `LICENSE`. Every name, character, place and sound in this game is
original; nothing is taken from Rockstar Games or any other commercial game.
