// Solmar Heat — localStorage save: autosave on every mission, manual save on H.
import { CFG } from './config.js';

export class SaveSystem {
  constructor() { this.key = CFG.saveKey; }
  save(state) {
    try {
      const data = {
        mission: state.missionIndex,
        cash: state.cash,
        health: state.health,
        wanted: state.wanted,
        pos: { x: state.player.pos.x, z: state.player.pos.z },
        completed: state.completedMissions,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(this.key, JSON.stringify(data));
      return true;
    } catch { return false; }
  }
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (typeof d.mission !== 'number' || typeof d.cash !== 'number') return null;
      return d;
    } catch { return null; }
  }
  hasSave() { return this.load() !== null; }
  clear() { try { localStorage.removeItem(this.key); } catch { /* storage unavailable */ } }
}
