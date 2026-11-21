// Solmar Heat — hitscan combat: Rico's pistol vs the rival Vulture crew.
import * as THREE from 'three';

const RIVAL_SHIRTS = [0x8a1f2a, 0x5a1f5a, 0x1f3a5a];

export class Combat {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.rivals = [];
    this.rivalsSpawned = 0;
    this.shotCooldown = 0;
    this.tracer = null;
    this.tracerLife = 0;
  }
  makeRival(x, z) {
    const g = new THREE.Group();
    const shirt = new THREE.MeshLambertMaterial({ color: RIVAL_SHIRTS[this.rivals.length % 3] });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.9, 3, 8), shirt);
    body.position.y = 1.2;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xc89878 }));
    head.position.y = 2.1;
    g.add(head);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 10),
      new THREE.MeshLambertMaterial({ color: 0x111111 }));
    band.position.y = 2.32;
    g.add(band);
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.55),
      new THREE.MeshLambertMaterial({ color: 0x181818 }));
    gun.position.set(0.55, 1.25, 0.4);
    g.add(gun);
    // Health bar sprite above the head.
    const barBg = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.16),
      new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.85 }));
    barBg.position.y = 2.75;
    g.add(barBg);
    const barFg = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xff4030 }));
    barFg.position.set(0, 2.75, 0.01);
    g.add(barFg);
    g.position.set(x, 0, z);
    this.scene.add(g);
    const rival = { mesh: g, pos: g.position, hp: 100, bar: barFg, shootTimer: 1 + Math.random(), dead: false };
    this.rivals.push(rival);
    this.rivalsSpawned++;
    return rival;
  }
  spawnRivals(center, count = 4) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      this.makeRival(center.x + Math.sin(a) * 12, center.z + Math.cos(a) * 12);
    }
  }
  rivalsAlive() { return this.rivals.filter((r) => !r.dead).length; }
  // Player fires a hitscan shot along the camera's forward ray.
  playerShoot(camera, player, audio, pedestrians) {
    if (this.shotCooldown > 0 || player.inCar) return false;
    this.shotCooldown = 0.28;
    const origin = camera.position.clone();
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    let best = null, bestT = 70;
    for (const r of this.rivals) {
      if (r.dead) continue;
      const to = new THREE.Vector3(r.pos.x, r.pos.y + 1.4, r.pos.z).sub(origin);
      const t = to.dot(dir);
      if (t < 1 || t > bestT) continue;
      const perp = to.clone().addScaledVector(dir, -t).length();
      if (perp < 1.6) { best = r; bestT = t; }
    }
    const end = origin.clone().addScaledVector(dir, best ? bestT : 60);
    this.showTracer(origin, end);
    if (audio) audio.gunshot();
    if (pedestrians) pedestrians.scare(player.pos.x, player.pos.z, 45);
    if (best) {
      best.hp -= 34;
      best.bar.scale.x = Math.max(0, best.hp / 100);
      best.bar.position.x = -0.65 * (1 - Math.max(0, best.hp / 100));
      if (best.hp <= 0) {
        best.dead = true;
        best.mesh.visible = false;
      }
      return true;
    }
    return false;
  }
  showTracer(from, to) {
    if (!this.tracer) {
      const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
      this.tracer = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe9a8 }));
      this.scene.add(this.tracer);
    } else {
      this.tracer.geometry.setFromPoints([from, to]);
    }
    this.tracer.visible = true;
    this.tracerLife = 0.08;
  }
  update(dt, player, audio, onPlayerHit) {
    this.shotCooldown = Math.max(0, this.shotCooldown - dt);
    if (this.tracer) {
      this.tracerLife -= dt;
      if (this.tracerLife <= 0) this.tracer.visible = false;
    }
    for (const r of this.rivals) {
      if (r.dead) continue;
      // Face the player and strafe toward cover distance ~14 m.
      const dx = player.pos.x - r.pos.x, dz = player.pos.z - r.pos.z;
      const dist = Math.hypot(dx, dz) || 1;
      r.mesh.rotation.y = Math.atan2(dx, dz); // health bar faces the player with the body
      if (dist > 18) {
        r.pos.x += (dx / dist) * 5 * dt;
        r.pos.z += (dz / dist) * 5 * dt;
      } else if (dist < 8) {
        r.pos.x -= (dx / dist) * 3 * dt;
        r.pos.z -= (dz / dist) * 3 * dt;
      }
      this.world.resolveCollision(r.pos, 0.7);
      // Return fire.
      r.shootTimer -= dt;
      if (r.shootTimer <= 0 && dist < 55 && !player.inCar) {
        r.shootTimer = 1.1 + Math.random() * 0.9;
        if (Math.random() < 0.55 && onPlayerHit) onPlayerHit(6 + Math.random() * 6);
        if (audio) audio.blip(190, 0.08, 'square', 0.06);
      }
    }
  }
}
