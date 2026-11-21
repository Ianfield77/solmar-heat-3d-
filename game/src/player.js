// Solmar Heat — Rico Vega on foot, and stealing / driving cars.
import * as THREE from 'three';
import { CFG } from './config.js';

export class Player {
  constructor(scene, world, input) {
    this.scene = scene;
    this.world = world;
    this.input = input;
    this.mesh = this.makeFigure();
    this.pos = this.mesh.position;
    this.pos.set(60, 0, 120);
    this.heading = Math.PI;
    this.camYaw = Math.PI;
    this.vy = 0;
    this.grounded = true;
    this.health = 100;
    this.inCar = null;
    this.speed = 0;
    this.autoThrottle = null; // set by ?shot= staging so staged cars keep cruising
    scene.add(this.mesh);
  }
  makeFigure() {
    const g = new THREE.Group();
    const jacket = new THREE.MeshLambertMaterial({ color: 0xffbe3c });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.9, 3, 8), jacket);
    body.position.y = 1.2;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xd8a070 }));
    head.position.y = 2.1;
    g.add(head);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.14, 10),
      new THREE.MeshLambertMaterial({ color: 0x222831 }));
    cap.position.y = 2.34;
    g.add(cap);
    const legMat = new THREE.MeshLambertMaterial({ color: 0x24344a });
    for (const x of [-0.2, 0.2]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.24), legMat);
      leg.position.set(x, 0.38, 0);
      g.add(leg);
      g.userData['leg' + (x < 0 ? 'L' : 'R')] = leg;
    }
    // Simple gun in the right hand, visible when shooting.
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x181818 }));
    gun.position.set(0.55, 1.25, 0.35);
    g.add(gun);
    return g;
  }
  // Nearest car the player could steal, within 5 m.
  nearestCar(cars) {
    let best = null, bestD = 5;
    for (const c of cars) {
      if (c.occupied || c.dead) continue;
      const dx = c.pos.x - this.pos.x, dz = c.pos.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  }
  enterCar(car) {
    car.occupied = true;
    this.inCar = car;
    this.mesh.visible = false;
    this.pos.set(car.pos.x, 0, car.pos.z);
    return car;
  }
  exitCar() {
    if (!this.inCar) return null;
    const car = this.inCar;
    car.occupied = false;
    car.stop();
    this.inCar = null;
    const side = { x: Math.cos(car.heading), z: -Math.sin(car.heading) };
    this.pos.set(car.pos.x + side.x * 2.6, 0, car.pos.z + side.z * 2.6);
    this.heading = car.heading;
    this.mesh.visible = true;
    this.mesh.position.copy(this.pos);
    return car;
  }
  update(dt, time, cars) {
    if (this.inCar) {
      const car = this.inCar;
      const throttle = this.autoThrottle !== null ? this.autoThrottle : this.input.axis('KeyS', 'KeyW');
      const steer = this.input.axis('KeyA', 'KeyD');
      const braking = this.input.down('Space');
      car.drive(braking ? 0 : throttle, steer, dt, this.world);
      if (braking) car.speed *= Math.max(0, 1 - 3.2 * dt);
      this.pos.copy(car.pos);
      this.speed = car.speed;
      this.camYaw = car.heading; // camera sits behind the car (see main.js)
      if (this.input.hit('KeyF')) return { exited: this.exitCar() };
      return {};
    }
    // On foot.
    const sprint = this.input.down('ShiftLeft') || this.input.down('ShiftRight');
    const speed = sprint ? CFG.playerRun : CFG.playerWalk;
    const fwd = this.input.axis('KeyS', 'KeyW');
    const strafe = this.input.axis('KeyA', 'KeyD');
    const sin = Math.sin(this.camYaw), cos = Math.cos(this.camYaw);
    // Camera yaw: 0 faces -z? We define forward = (sin(yaw), cos(yaw)) on xz.
    let mx = (sin * fwd + cos * strafe);
    let mz = (cos * fwd - sin * strafe);
    const len = Math.hypot(mx, mz);
    if (len > 0.01) {
      mx /= len; mz /= len;
      this.pos.x += mx * speed * dt;
      this.pos.z += mz * speed * dt;
      this.heading = Math.atan2(mx, mz);
      this.speed = speed;
    } else {
      this.speed = 0;
    }
    // Jump.
    if (this.input.hit('Space') && this.grounded) {
      this.vy = 9; this.grounded = false;
    }
    if (!this.grounded) {
      this.vy -= CFG.gravity * dt;
      this.pos.y += this.vy * dt;
      if (this.pos.y <= 0) { this.pos.y = 0; this.vy = 0; this.grounded = true; }
    }
    this.world.resolveCollision(this.pos, 0.7);
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.heading;
    const swing = Math.sin(time * 10) * 0.5 * Math.min(1, this.speed / 8);
    this.mesh.userData.legL.position.z = swing;
    this.mesh.userData.legR.position.z = -swing;
    if (this.input.hit('KeyE')) {
      const car = this.nearestCar(cars);
      if (car) return { stole: this.enterCar(car) };
    }
    return {};
  }
}
