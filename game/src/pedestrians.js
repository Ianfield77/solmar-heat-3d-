// Solmar Heat — pedestrians strolling the sidewalks, fleeing from gunfire.
import * as THREE from 'three';
import { CFG } from './config.js';

const SHIRTS = [0xe85a5a, 0x5aa8e8, 0x7ed07e, 0xe8c85a, 0xb07ee8, 0xe8e8e8, 0x3a3a3a, 0xff9a5a];

export class Pedestrians {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.walkers = [];
    for (let i = 0; i < 26; i++) this.spawn();
  }
  makeFigure(shirt) {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: shirt });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.85, 3, 8), mat);
    body.position.y = 1.15;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xe8b88a }));
    head.position.y = 2.05;
    g.add(head);
    const legMat = new THREE.MeshLambertMaterial({ color: 0x2c3440 });
    for (const x of [-0.18, 0.18]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), legMat);
      leg.position.set(x, 0.35, 0);
      g.add(leg);
      g.userData['leg' + (x < 0 ? 'L' : 'R')] = leg;
    }
    return g;
  }
  spawn() {
    const mesh = this.makeFigure(SHIRTS[Math.floor(Math.random() * SHIRTS.length)]);
    const x = -240 + Math.random() * 480;
    const z = -240 + Math.random() * 480;
    mesh.position.set(x, 0, z);
    this.scene.add(mesh);
    this.walkers.push({
      mesh, pos: mesh.position,
      heading: Math.random() * Math.PI * 2,
      speed: 1.2 + Math.random() * 1.4,
      panic: 0, phase: Math.random() * 6,
    });
  }
  scare(x, z, radius = 40) {
    for (const w of this.walkers) {
      const dx = w.pos.x - x, dz = w.pos.z - z;
      if (dx * dx + dz * dz < radius * radius) {
        w.panic = 3 + Math.random() * 2;
        w.heading = Math.atan2(dx, dz);
      }
    }
  }
  update(dt, time) {
    for (const w of this.walkers) {
      if (w.panic > 0) {
        w.panic -= dt;
        w.speed = 5.5;
      } else {
        w.speed = 1.4;
        if (Math.random() < dt * 0.08) w.heading += (Math.random() - 0.5) * 1.6;
      }
      w.pos.x += Math.sin(w.heading) * w.speed * dt;
      w.pos.z += Math.cos(w.heading) * w.speed * dt;
      this.world.resolveCollision(w.pos, 0.6);
      w.mesh.rotation.y = w.heading;
      // Simple leg swing.
      const swing = Math.sin(time * 7 + w.phase) * 0.45 * Math.min(1, w.speed / 3);
      w.mesh.userData.legL.position.z = swing;
      w.mesh.userData.legR.position.z = -swing;
      // Keep walkers inside the city.
      if (Math.abs(w.pos.x) > CFG.cityHalf || Math.abs(w.pos.z) > CFG.cityHalf) {
        w.heading += Math.PI;
      }
    }
  }
}
