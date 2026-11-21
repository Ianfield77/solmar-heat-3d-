// Solmar Heat — street traffic: NPC cars cruising the avenues and streets.
import { Car } from './vehicles.js';
import { ROADS, CFG } from './config.js';

function randomRoadPoint() {
  const road = ROADS[Math.floor(Math.random() * ROADS.length)];
  const along = -240 + Math.random() * 480;
  const lane = (Math.random() < 0.5 ? -3.5 : 3.5);
  const vertical = Math.random() < 0.5;
  if (vertical) return { x: road + lane, z: along, heading: lane < 0 ? 0 : Math.PI };
  return { x: along, z: road + lane, heading: lane < 0 ? Math.PI / 2 : -Math.PI / 2 };
}

export class Traffic {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.cars = [];
    for (let i = 0; i < 16; i++) this.spawn();
  }
  spawn(near = null) {
    let p = randomRoadPoint();
    if (near) {
      // Spawn a car on a road near a point (used by screenshot staging).
      const road = ROADS.reduce((a, b) => Math.abs(b - near.z) < Math.abs(a - near.z) ? b : a);
      p = { x: near.x + 14, z: road + 3.5, heading: -Math.PI / 2 };
    }
    const car = new Car(this.scene, { x: p.x, z: p.z, heading: p.heading, npc: true });
    car.speed = 9 + Math.random() * 7;
    car.cruise = car.speed;
    car.occupied = true;
    this.cars.push(car);
    return car;
  }
  update(dt, playerPos) {
    for (const car of this.cars) {
      // Keep a bubble of traffic around the player; recycle far cars.
      const dx = car.pos.x - playerPos.x, dz = car.pos.z - playerPos.z;
      if (dx * dx + dz * dz > 340 * 340) {
        const p = randomRoadPoint();
        // Re-place on a road near the player instead of far away.
        const nearRoad = ROADS.reduce((a, b) => Math.abs(b - playerPos.z) < Math.abs(a - playerPos.z) ? b : a);
        car.pos.set(playerPos.x + (Math.random() < 0.5 ? -90 : 90), 0, nearRoad + 3.5);
        car.heading = -Math.PI / 2;
        car.speed = car.cruise;
        continue;
      }
      // Slow down if a car is right ahead on the same road.
      let blocked = false;
      const f = car.forward();
      for (const other of this.cars) {
        if (other === car) continue;
        const ox = other.pos.x - car.pos.x, oz = other.pos.z - car.pos.z;
        const ahead = ox * f.x + oz * f.z;
        const side = Math.abs(ox * f.z - oz * f.x);
        if (ahead > 0 && ahead < 12 && side < 3) { blocked = true; break; }
      }
      const target = blocked ? 0 : car.cruise;
      car.speed += Math.max(-14 * dt, Math.min(14 * dt, target - car.speed));
      const nx = car.pos.x + Math.sin(car.heading) * car.speed * dt;
      const nz = car.pos.z + Math.cos(car.heading) * car.speed * dt;
      // At an intersection, sometimes turn.
      const onRoadX = ROADS.some((r) => Math.abs(nx - r) < 2);
      const onRoadZ = ROADS.some((r) => Math.abs(nz - r) < 2);
      if (onRoadX && onRoadZ && Math.random() < dt * 0.35) {
        car.heading += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
      }
      car.pos.x = Math.max(-CFG.cityHalf, Math.min(CFG.beachX, nx));
      car.pos.z = Math.max(-CFG.cityHalf, Math.min(CFG.cityHalf, nz));
      car.mesh.rotation.y = car.heading;
      for (const w of car.mesh.userData.wheels) w.rotation.x += car.speed * dt * 2.4;
    }
  }
}
