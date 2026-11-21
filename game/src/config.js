// Solmar Heat — shared constants, city layout and the five-mission story.
export const CFG = {
  cityHalf: 270,          // playable city extends -270..270 on x and z
  roadGap: 60,            // distance between road centerlines
  roadWidth: 14,
  blockSize: 46,
  beachX: 300,            // sand starts here, ocean beyond x = 330
  oceanX: 330,
  gravity: 30,
  playerWalk: 9,
  playerRun: 14,
  carTopSpeed: 46,
  carAccel: 26,
  wantedMax: 5,
  saveKey: 'solmar-heat-save-v1',
};

// Road centerline coordinates (avenues run along z, streets along x).
export const ROADS = [];
for (let c = -240; c <= 240; c += 60) ROADS.push(c);

export const MISSIONS = [
  {
    id: 1, name: 'HOT WHEELS', title: 'Mission 1 — Hot Wheels',
    objective: 'Steal a car (walk up and press E)',
    sub: 'Any car on the street will do. The crew is waiting.',
    reward: 500, beacon: { x: 120, z: -210 },
    brief: 'Marlow needs wheels. Jack any car and bring it to the gold beacon at the docks.',
  },
  {
    id: 2, name: 'COURIER RUN', title: 'Mission 2 — Courier Run',
    objective: 'Pick up the package, then deliver it fast',
    sub: 'Follow the gold beacon. Do not keep the client waiting.',
    reward: 800, beacon: { x: -210, z: 150 }, deliver: { x: 210, z: 210 },
    brief: 'A package is waiting at the west docks. Grab it, then run it to the Marina hotel.',
  },
  {
    id: 3, name: 'CREW TROUBLE', title: 'Mission 3 — Crew Trouble',
    objective: 'Deal with the Vulture crew at the beacon',
    sub: 'They brought guns. So did you. Click to shoot.',
    reward: 1200, beacon: { x: -60, z: -60 },
    brief: 'The Vultures are muscling in on Marlow turf near the plaza. Clear them out.',
  },
  {
    id: 4, name: 'HEAT WAVE', title: 'Mission 4 — Heat Wave',
    objective: 'Lose the heat — get your wanted level to zero',
    sub: 'The whole Solmar Bay Police is on you. Break line of sight and lay low.',
    reward: 1500, beacon: { x: 0, z: 0 },
    brief: 'A job went loud. Three stars and climbing. Shake the cops and vanish.',
  },
  {
    id: 5, name: 'THE BIG SCORE', title: 'Mission 5 — The Big Score',
    objective: 'Hit the Solmar Bank, then reach the hideout',
    sub: 'Hold at the bank beacon to crack the vault, then run.',
    reward: 3000, beacon: { x: 180, z: -60 }, hideout: { x: -240, z: -240 },
    brief: 'One last job. The Solmar Bank vault, then the hideout. Rico, make it count.',
  },
];

export const CAR_COLORS = [0xd23b2e, 0x2e6fd2, 0xf2c230, 0x27a35c, 0x8a5fd0, 0xe8e8e8, 0x222831, 0xff7f2a];
export const CAR_NAMES = ['Vento GT', 'Marlin Coupe', 'Solstice', 'Brava Sedan', 'Comet LX', 'Duna Pickup', 'Aurora S', 'Tide Runner'];
