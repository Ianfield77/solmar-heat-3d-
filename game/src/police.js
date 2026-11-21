// Solmar Heat — the 5-star wanted system and the Solmar Bay Police Department.
import { Car } from './vehicles.js';
import { CFG } from './config.js';

export class Police {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.units = [];
    this.wanted = 0;
    this.hiddenTimer = 0;   // time with no unit near the player
    this.bustedTimer = 0;   // time pinned down at low speed
    this.flash = 0;
  }
  setWanted(n, onChange) {
    const next = Math.max(0, Math.min(CFG.wantedMax, n));
    if (next !== this.wanted) {
      this.wanted = next;
      this.syncUnits();
      if (onChange) onChange(next);
    }
  }
  addWanted(n, onChange) { this.setWanted(this.wanted + n, onChange); }
  syncUnits() {
    while (this.units.length < this.wanted) this.spawnUnit();
    while (this.units.length > this.wanted) {
      const u = this.units.pop();
      u.remove();
    }
  }
  spawnUnit() {
    const a = Math.random() * Math.PI * 2;
    const car = new Car(this.scene, {
      x: 0, z: 0, heading: 0, police: true, npc: true,
    });
    car.occupied = true;
    this.units.push(car);
    return car;
  }
  // Place fresh units on roads around the player.
  placeNear(playerPos) {
    for (const u of this.units) {
      if (u.placed) continue;
      const a = Math.random() * Math.PI * 2;
      const r = 55 + Math.random() * 30;
      u.pos.set(playerPos.x + Math.sin(a) * r, 0, playerPos.z + Math.cos(a) * r);
      u.placed = true;
    }
  }
  update(dt, time, player, onBusted) {
    this.flash += dt;
    for (const u of this.units) {
      // Flash the light bar.
      const on = Math.floor(this.flash * 4) % 2 === 0;
      if (u.mesh.userData.lightRed) u.mesh.userData.lightRed.visible = on;
      if (u.mesh.userData.lightBlue) u.mesh.userData.lightBlue.visible = !on;
      // Chase: steer toward the player, ram to slow them down.
      const dx = player.pos.x - u.pos.x;
      const dz = player.pos.z - u.pos.z;
      const dist = Math.hypot(dx, dz);
      const wantHeading = Math.atan2(dx, dz);
      let dh = wantHeading - u.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      const steer = Math.max(-1, Math.min(1, dh * 1.4));
      const speed = Math.min(44, 16 + this.wanted * 4 + dist * 0.12);
      u.speed += Math.max(-30 * dt, Math.min(30 * dt, speed - u.speed));
      u.heading += steer * 2.2 * dt * Math.min(1, Math.abs(u.speed) / 10);
      const nx = u.pos.x + Math.sin(u.heading) * u.speed * dt;
      const nz = u.pos.z + Math.cos(u.heading) * u.speed * dt;
      const trial = { x: nx, z: nz };
      this.world.resolveCollision(trial, 2.2);
      u.pos.x = trial.x; u.pos.z = trial.z;
      u.mesh.rotation.y = u.heading;
      for (const w of u.mesh.userData.wheels) w.rotation.x += u.speed * dt * 2.4;
      // Ram: if touching the player's car, shove it and slow it.
      if (player.inCar && dist < 4.6) {
        player.inCar.speed *= Math.max(0, 1 - 1.6 * dt);
        player.health = Math.max(0, player.health - 2 * dt);
      }
      // On foot next to a unit at low speed: busted clock runs.
      if (!player.inCar && dist < 5 && Math.abs(player.speed) < 2) {
        this.bustedTimer += dt;
        if (this.bustedTimer > 3) {
          this.bustedTimer = 0;
          if (onBusted) onBusted();
        }
      }
    }
    // Wanted decay: stay out of sight and the heat cools off.
    let nearest = Infinity;
    for (const u of this.units) {
      const d = Math.hypot(u.pos.x - player.pos.x, u.pos.z - player.pos.z);
      if (d < nearest) nearest = d;
    }
    if (this.wanted > 0 && nearest > 70) {
      this.hiddenTimer += dt;
      if (this.hiddenTimer > 9) {
        this.hiddenTimer = 0;
        this.setWanted(this.wanted - 1);
      }
    } else {
      this.hiddenTimer = 0;
    }
    if (this.wanted === 0) this.bustedTimer = 0;
  }
}
