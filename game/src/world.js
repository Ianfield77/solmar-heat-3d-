// Solmar Heat — procedural Solmar Bay: grid streets, towers, beach, ocean, pier.
import * as THREE from 'three';
import { CFG, ROADS } from './config.js';

function windowTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#c9ced6'; g.fillRect(0, 0, 128, 256);
  for (let y = 10; y < 246; y += 22) {
    for (let x = 10; x < 118; x += 20) {
      const lit = Math.random() < 0.55;
      g.fillStyle = lit ? (Math.random() < 0.5 ? '#ffd98a' : '#9fd8ff') : '#4a515c';
      g.fillRect(x, y, 12, 14);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];   // {minX,maxX,minZ,maxZ} building footprints
    this.beacons = [];
    this.buildLights();
    this.buildGround();
    this.buildCity();
    this.buildBeach();
    this.buildTower();
    this.buildPier();
    this.buildPark();
  }
  buildLights() {
    const sun = new THREE.DirectionalLight(0xfff1cf, 2.6);
    sun.position.set(180, 260, 120);
    this.scene.add(sun);
    this.scene.add(new THREE.HemisphereLight(0xbfe3ff, 0x8a6f4d, 1.35));
    this.scene.fog = new THREE.Fog(0xbfd9ee, 380, 900);
    this.scene.background = new THREE.Color(0x8fc3e8);
  }
  buildGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1100, 1100),
      new THREE.MeshLambertMaterial({ color: 0x9aa98b }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.05, 0);
    this.scene.add(ground);
    // Road ribbons.
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x2e3238 });
    const walkMat = new THREE.MeshLambertMaterial({ color: 0xb8b0a0 });
    for (const c of ROADS) {
      const v = new THREE.Mesh(new THREE.PlaneGeometry(CFG.roadWidth, 560), roadMat);
      v.rotation.x = -Math.PI / 2; v.position.set(c, 0, 0);
      this.scene.add(v);
      const h = new THREE.Mesh(new THREE.PlaneGeometry(560, CFG.roadWidth), roadMat);
      h.rotation.x = -Math.PI / 2; h.position.set(0, 0, c);
      this.scene.add(h);
      const wv = new THREE.Mesh(new THREE.PlaneGeometry(CFG.roadWidth + 8, 560), walkMat);
      wv.rotation.x = -Math.PI / 2; wv.position.set(c, -0.02, 0);
      this.scene.add(wv);
      const wh = new THREE.Mesh(new THREE.PlaneGeometry(560, CFG.roadWidth + 8), walkMat);
      wh.rotation.x = -Math.PI / 2; wh.position.set(0, -0.02, c);
      this.scene.add(wh);
    }
    // Center dashes.
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xf5d76e });
    for (const c of ROADS) {
      for (let d = -255; d <= 255; d += 24) {
        const dv = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 5), dashMat);
        dv.rotation.x = -Math.PI / 2; dv.position.set(c, 0.02, d);
        this.scene.add(dv);
        const dh = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.7), dashMat);
        dh.rotation.x = -Math.PI / 2; dh.position.set(d, 0.02, c);
        this.scene.add(dh);
      }
    }
  }
  buildCity() {
    const winTex = windowTexture();
    const palette = [0xe8dcc8, 0xd8c2a8, 0xc8d8e8, 0xe8b8a0, 0xb8c8b0, 0xd8d8d8, 0xf0e0b8];
    const geo = new THREE.BoxGeometry(1, 1, 1);
    for (let bx = -240; bx <= 180; bx += 60) {
      for (let bz = -240; bz <= 240; bz += 60) {
        const cx = bx + 30, cz = bz + 30;
        const isCenter = Math.abs(cx) < 70 && Math.abs(cz) < 70;
        const n = isCenter ? 1 : (Math.random() < 0.6 ? 2 : 1);
        for (let k = 0; k < n; k++) {
          const w = 16 + Math.random() * 18;
          const d = 16 + Math.random() * 18;
          const h = isCenter ? 34 + Math.random() * 42 : 10 + Math.random() * 26;
          const ox = n === 2 ? (k === 0 ? -11 : 11) : 0;
          const oz = n === 2 ? (k === 0 ? -11 : 11) : 0;
          const color = palette[Math.floor(Math.random() * palette.length)];
          const mat = new THREE.MeshLambertMaterial({ color, map: winTex });
          const b = new THREE.Mesh(geo, mat);
          b.scale.set(w, h, d);
          b.position.set(cx + ox, h / 2, cz + oz);
          this.scene.add(b);
          // Rooftop rim so towers read at distance.
          const roof = new THREE.Mesh(
            new THREE.BoxGeometry(w + 1, 1.2, d + 1),
            new THREE.MeshLambertMaterial({ color: 0x5a5148 }),
          );
          roof.position.set(cx + ox, h + 0.6, cz + oz);
          this.scene.add(roof);
          this.colliders.push({
            minX: cx + ox - w / 2 - 0.6, maxX: cx + ox + w / 2 + 0.6,
            minZ: cz + oz - d / 2 - 0.6, maxZ: cz + oz + d / 2 + 0.6,
          });
        }
      }
    }
    // Streetlights along the avenues.
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x30343a });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
    for (const c of ROADS) {
      for (let d = -240; d <= 240; d += 120) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 7, 6), poleMat);
        pole.position.set(c + 9, 3.5, d);
        this.scene.add(pole);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), lampMat);
        lamp.position.set(c + 9, 7.1, d);
        this.scene.add(lamp);
      }
    }
  }
  buildBeach() {
    const sand = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 620),
      new THREE.MeshLambertMaterial({ color: 0xe8d29a }),
    );
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(300, 0.02, 0);
    this.scene.add(sand);
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 900),
      new THREE.MeshLambertMaterial({ color: 0x1f7fc8, transparent: true, opacity: 0.92 }),
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(480, 0.0, 0);
    this.scene.add(ocean);
    // Palm row along the sand.
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x7a5a38 });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x2fae5f });
    for (let z = -270; z <= 270; z += 30) {
      const x = 288 + (Math.random() * 10 - 5);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 9, 6), trunkMat);
      trunk.position.set(x, 4.5, z);
      trunk.rotation.z = 0.12;
      this.scene.add(trunk);
      for (let f = 0; f < 5; f++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.1, 5.5, 4), leafMat);
        leaf.position.set(x + Math.cos(f * 1.26) * 1.6, 9.6, z + Math.sin(f * 1.26) * 1.6);
        leaf.rotation.set(Math.sin(f * 1.26) * 1.1, 0, -Math.cos(f * 1.26) * 1.1);
        this.scene.add(leaf);
      }
    }
  }
  buildTower() {
    const mat = new THREE.MeshLambertMaterial({ color: 0x9fc8e8 });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(9, 12, 120, 12), mat);
    tower.position.set(0, 60, 0);
    this.scene.add(tower);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(9, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd23e }));
    crown.position.set(0, 124, 0);
    this.scene.add(crown);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(26, 5, 2),
      new THREE.MeshBasicMaterial({ color: 0xffbe3c }));
    sign.position.set(0, 96, 10);
    this.scene.add(sign);
    this.colliders.push({ minX: -13, maxX: 13, minZ: -13, maxZ: 13 });
  }
  buildPier() {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(90, 1.5, 10),
      new THREE.MeshLambertMaterial({ color: 0x8a6a44 }));
    deck.position.set(360, 1.2, 120);
    this.scene.add(deck);
    for (let x = 320; x <= 400; x += 10) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 6),
        new THREE.MeshLambertMaterial({ color: 0x5a4630 }));
      post.position.set(x, -0.5, 116);
      this.scene.add(post);
      const post2 = post.clone(); post2.position.z = 124;
      this.scene.add(post2);
    }
  }
  buildPark() {
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(46, 46),
      new THREE.MeshLambertMaterial({ color: 0x4fae5a }));
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(-150, 0.03, -150);
    this.scene.add(lawn);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e8f4e });
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6a4a28 });
    for (let i = 0; i < 9; i++) {
      const x = -168 + Math.random() * 36;
      const z = -168 + Math.random() * 36;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 4, 6), trunkMat);
      trunk.position.set(x, 2, z);
      this.scene.add(trunk);
      const top = new THREE.Mesh(new THREE.SphereGeometry(3.4, 8, 6), leafMat);
      top.position.set(x, 6.4, z);
      this.scene.add(top);
    }
  }
  // A tall gold light pillar + floating diamond marking a mission target.
  makeBeacon() {
    const group = new THREE.Group();
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 90, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd23e, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }),
    );
    pillar.position.y = 45;
    group.add(pillar);
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(2.4),
      new THREE.MeshBasicMaterial({ color: 0xffd23e }),
    );
    gem.position.y = 6;
    group.add(gem);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(5, 0.35, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xffbe3c }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.4;
    group.add(ring);
    group.userData.gem = gem;
    group.userData.ring = ring;
    group.visible = false;
    this.scene.add(group);
    this.beacons.push(group);
    return group;
  }
  // Push a circle (x,z,r) out of every building footprint it overlaps.
  resolveCollision(pos, radius) {
    for (const c of this.colliders) {
      const cx = Math.max(c.minX, Math.min(pos.x, c.maxX));
      const cz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
      const dx = pos.x - cx, dz = pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < radius * radius) {
        if (d2 > 0.0001) {
          const d = Math.sqrt(d2);
          pos.x = cx + (dx / d) * radius;
          pos.z = cz + (dz / d) * radius;
        } else {
          pos.x = c.maxX + radius;
        }
      }
    }
    pos.x = Math.max(-CFG.cityHalf - 20, Math.min(CFG.beachX + 40, pos.x));
    pos.z = Math.max(-CFG.cityHalf - 20, Math.min(CFG.cityHalf + 20, pos.z));
  }
}
