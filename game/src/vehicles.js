// Solmar Heat — car factory and arcade driving model (player + police + traffic).
import * as THREE from 'three';
import { CFG, CAR_COLORS, CAR_NAMES } from './config.js';

export function makeCarMesh(color, isPolice = false) {
  const group = new THREE.Group();
  const paint = new THREE.MeshLambertMaterial({ color: isPolice ? 0x1c2f4a : color });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.62, 4.4), paint);
  body.position.y = 0.62;
  group.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.58, 2.2),
    new THREE.MeshLambertMaterial({ color: 0x1a2530 }));
  cabin.position.set(0, 1.18, -0.25);
  group.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 10);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const wheels = [];
  for (const [x, z] of [[-1.0, 1.45], [1.0, 1.45], [-1.0, -1.45], [1.0, -1.45]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.38, z);
    group.add(w);
    wheels.push(w);
  }
  if (isPolice) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    bar.position.set(0, 1.56, -0.25);
    group.add(bar);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.26, 0.45),
      new THREE.MeshBasicMaterial({ color: 0xff2020 }));
    red.position.set(-0.4, 1.58, -0.25);
    group.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.26, 0.45),
      new THREE.MeshBasicMaterial({ color: 0x2040ff }));
    blue.position.set(0.4, 1.58, -0.25);
    group.add(blue);
    group.userData.lightRed = red;
    group.userData.lightBlue = blue;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.2, 4.42),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    stripe.position.y = 0.86;
    group.add(stripe);
  } else {
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff6c8 });
    for (const x of [-0.7, 0.7]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.1), lightMat);
      l.position.set(x, 0.66, 2.22);
      group.add(l);
    }
  }
  group.userData.wheels = wheels;
  return group;
}

let carCounter = 0;
export class Car {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.isPolice = !!opts.police;
    this.color = this.isPolice ? 0x1c2f4a : CAR_COLORS[carCounter % CAR_COLORS.length];
    this.name = this.isPolice ? 'SBPD Interceptor' : CAR_NAMES[carCounter % CAR_NAMES.length];
    carCounter++;
    this.mesh = makeCarMesh(this.color, this.isPolice);
    this.pos = this.mesh.position;
    this.pos.set(opts.x ?? 0, 0, opts.z ?? 0);
    this.heading = opts.heading ?? 0;
    this.speed = 0;
    this.steer = 0;
    this.mesh.rotation.y = this.heading;
    this.occupied = false;   // a driver sits inside
    this.npc = !!opts.npc;
    this.dead = false;
    scene.add(this.mesh);
  }
  forward() { return { x: Math.sin(this.heading), z: Math.cos(this.heading) }; }
  // Arcade drive: throttle -1..1, steer -1..1, dt seconds.
  drive(throttle, steer, dt, world) {
    const f = this.forward();
    const target = throttle * CFG.carTopSpeed;
    const accel = throttle !== 0 ? CFG.carAccel : CFG.carAccel * 1.6;
    this.speed += Math.max(-accel * dt, Math.min(accel * dt, target - this.speed));
    if (Math.abs(this.speed) > 0.5) {
      this.heading += steer * 1.9 * dt * Math.sign(this.speed) * Math.min(1, Math.abs(this.speed) / 12);
    }
    const nx = this.pos.x + Math.sin(this.heading) * this.speed * dt;
    const nz = this.pos.z + Math.cos(this.heading) * this.speed * dt;
    const trial = { x: nx, z: nz };
    if (world) world.resolveCollision(trial, 2.2);
    this.pos.x = trial.x;
    this.pos.z = trial.z;
    this.mesh.rotation.y = this.heading;
    // Wheel spin + body lean.
    const spin = this.speed * dt * 2.4;
    for (const w of this.mesh.userData.wheels) w.rotation.x += spin;
    this.mesh.rotation.z = -steer * Math.min(1, Math.abs(this.speed) / 20) * 0.06;
    return f;
  }
  stop() { this.speed = 0; }
  remove() { this.scene.remove(this.mesh); this.dead = true; }
}
