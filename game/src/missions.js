// Solmar Heat — five chained story missions with gold beacons and HUD objectives.
import { MISSIONS } from './config.js';

export class Missions {
  constructor(scene, world, combat) {
    this.world = world;
    this.combat = combat;
    this.index = 0;             // current mission (0-based)
    this.stage = 'go';          // go | deliver | fight | escape | grab | hideout | done
    this.holdTimer = 0;
    this.escapeTimer = 0;
    this.beacon = world.makeBeacon();
    this.beacon2 = world.makeBeacon();
    this.finished = false;
    this.onEvent = null;        // (type, payload) -> toast/banner/sound/save
    this.startMission(0);
  }
  get current() { return MISSIONS[this.index]; }
  emit(type, payload) { if (this.onEvent) this.onEvent(type, payload); }
  target() {
    const m = this.current;
    if (!m) return null;
    if (this.stage === 'deliver') return m.deliver;
    if (this.stage === 'hideout') return m.hideout;
    return m.beacon;
  }
  startMission(i) {
    this.index = i;
    this.stage = 'go';
    this.holdTimer = 0;
    const m = this.current;
    if (!m) { this.finished = true; return; }
    this.beacon.position.set(m.beacon.x, 0, m.beacon.z);
    this.beacon.visible = true;
    this.beacon2.visible = false;
    this.emit('banner', { big: m.name, small: m.brief });
    this.emit('objective', m);
    if (i === 3) this.emit('forceWanted', 3);
    if (i === 2) this.emit('spawnRivals', m.beacon);
  }
  near(player, point, r = 7) {
    const dx = player.pos.x - point.x, dz = player.pos.z - point.z;
    return dx * dx + dz * dz < r * r;
  }
  complete(player) {
    const m = this.current;
    this.emit('reward', { amount: m.reward, name: m.name });
    this.emit('autosave', null);
    this.beacon.visible = false;
    this.beacon2.visible = false;
    if (this.index + 1 >= MISSIONS.length) {
      this.finished = true;
      this.emit('banner', { big: 'SOLMAR HEAT', small: 'All five jobs done. Rico owns the Bay now.' });
      this.emit('objective', { name: 'FREE ROAM', objective: 'All missions complete — enjoy Solmar Bay', sub: 'Steal cars, dodge the cops, live the heat.' });
      return;
    }
    this.startMission(this.index + 1);
  }
  update(dt, ctx) {
    const { player, police } = ctx;
    if (this.finished || !this.current) return;
    const m = this.current;
    // Beacon pulse.
    const t = ctx.time;
    this.beacon.userData.gem.position.y = 6 + Math.sin(t * 2.4) * 0.8;
    this.beacon.userData.gem.rotation.y = t * 1.5;
    if (this.stage === 'go') {
      if (m.id === 1) {
        // Mission 1 completes once Rico is in a car and reaches the docks beacon.
        if (player.inCar && this.near(player, m.beacon, 9)) this.complete(player);
      } else if (m.id === 2) {
        if (this.near(player, m.beacon, 7)) {
          this.stage = 'deliver';
          this.beacon2.position.set(m.deliver.x, 0, m.deliver.z);
          this.beacon2.visible = true;
          this.beacon.visible = false;
          this.emit('toast', 'Package secured. Deliver it to the Marina hotel!');
          this.emit('objective', { ...m, objective: 'Deliver the package to the Marina hotel', sub: 'Gold beacon marks the drop-off.' });
          this.emit('chime', null);
        }
      } else if (m.id === 3) {
        if (this.combat.rivalsAlive() === 0 && this.combat.rivalsSpawned > 0) {
          this.complete(player);
        }
      } else if (m.id === 4) {
        if (police.wanted === 0) this.complete(player);
      } else if (m.id === 5) {
        if (this.near(player, m.beacon, 8)) {
          this.stage = 'grab';
          this.holdTimer = 0;
          this.emit('toast', 'Cracking the vault — stay at the beacon!');
        }
      }
    } else if (this.stage === 'deliver') {
      this.beacon2.userData.gem.position.y = 6 + Math.sin(t * 2.4) * 0.8;
      if (this.near(player, m.deliver, 8)) this.complete(player);
    } else if (this.stage === 'grab') {
      if (this.near(player, m.beacon, 8)) {
        this.holdTimer += dt;
        this.emit('progress', { label: 'CRACKING VAULT', ratio: this.holdTimer / 5 });
        if (this.holdTimer >= 5) {
          this.stage = 'hideout';
          this.beacon.visible = false;
          this.beacon2.position.set(m.hideout.x, 0, m.hideout.z);
          this.beacon2.visible = true;
          this.emit('toast', 'Vault cracked! $3,000 in the bag — run to the hideout!');
          this.emit('objective', { ...m, objective: 'Escape to the hideout with the cash', sub: 'Four stars. Do not get caught.' });
          this.emit('forceWanted', 4);
        }
      } else {
        this.holdTimer = Math.max(0, this.holdTimer - dt * 2);
        this.emit('progress', { label: 'CRACKING VAULT', ratio: this.holdTimer / 5 });
      }
    } else if (this.stage === 'hideout') {
      this.beacon2.userData.gem.position.y = 6 + Math.sin(t * 2.4) * 0.8;
      if (this.near(player, m.hideout, 8)) this.complete(player);
    }
  }
}
