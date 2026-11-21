// Solmar Heat — HUD: wanted stars, cash, health, objectives, speed, toast,
// mission banners, and the live minimap canvas.
import { CFG } from './config.js';

export class HUD {
  constructor() {
    this.el = {
      hud: document.getElementById('hud'),
      stars: document.getElementById('stars'),
      cash: document.getElementById('cash'),
      healthfill: document.getElementById('healthfill'),
      objLabel: document.getElementById('objLabel'),
      objText: document.getElementById('objText'),
      objSub: document.getElementById('objSub'),
      speed: document.getElementById('speed'),
      vehName: document.getElementById('vehName'),
      toast: document.getElementById('toast'),
      hint: document.getElementById('hint'),
      crosshair: document.getElementById('crosshair'),
      banner: document.getElementById('missionBanner'),
      bannerBig: document.getElementById('bannerBig'),
      bannerSmall: document.getElementById('bannerSmall'),
      minimap: document.getElementById('minimap'),
    };
    this.mapCtx = this.el.minimap.getContext('2d');
    this.toastTimer = null;
    this.bannerTimer = null;
    this.progressLabel = '';
    this.progressRatio = -1;
  }
  show() { this.el.hud.style.display = 'block'; }
  hide() { this.el.hud.style.display = 'none'; }
  setStars(n) {
    let s = '';
    for (let i = 0; i < CFG.wantedMax; i++) {
      s += i < n ? '★' : '<span class="off">★</span>';
    }
    this.el.stars.innerHTML = s;
  }
  setCash(v) { this.el.cash.textContent = '$' + Math.floor(v).toLocaleString('en-US'); }
  setHealth(v) { this.el.healthfill.style.width = Math.max(0, Math.min(100, v)) + '%'; }
  setObjective(label, text, sub) {
    this.el.objLabel.textContent = label;
    this.el.objText.textContent = text;
    this.el.objSub.textContent = sub;
  }
  setSpeed(mph, name) {
    this.el.speed.textContent = String(Math.round(Math.abs(mph)));
    this.el.vehName.textContent = name;
  }
  setCrosshair(on) { this.el.crosshair.style.display = on ? 'block' : 'none'; }
  setProgress(label, ratio) { this.progressLabel = label; this.progressRatio = ratio; }
  toast(msg, ms = 3200) {
    this.el.toast.textContent = msg;
    this.el.toast.style.opacity = '1';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.el.toast.style.opacity = '0'; }, ms);
  }
  banner(big, small, ms = 3600) {
    this.el.bannerBig.textContent = big;
    this.el.bannerSmall.textContent = small;
    this.el.banner.style.display = 'block';
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => { this.el.banner.style.display = 'none'; }, ms);
  }
  // Live top-down map: roads, beach, player arrow, cars, police, rivals, beacon.
  drawMinimap(state) {
    const ctx = this.mapCtx;
    const S = 180, R = 300; // world -300..300 maps to the disc
    const toMap = (x, z) => [S / 2 + (x / R) * (S / 2 - 6), S / 2 + (z / R) * (S / 2 - 6)];
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#0d2036';
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); ctx.clip();
    // Ocean + sand on the east edge.
    const [bx] = toMap(300, 0);
    ctx.fillStyle = '#1f7fc8'; ctx.fillRect(bx, 0, S - bx, S);
    ctx.fillStyle = '#e8d29a'; ctx.fillRect(bx - 8, 0, 8, S);
    // Roads.
    ctx.strokeStyle = '#5a6a7a'; ctx.lineWidth = 5;
    for (const c of [-240, -180, -120, -60, 0, 60, 120, 180, 240]) {
      const [x1] = toMap(c, 0);
      ctx.beginPath(); ctx.moveTo(x1, 4); ctx.lineTo(x1, S - 4); ctx.stroke();
      const [, z1] = toMap(0, c);
      ctx.beginPath(); ctx.moveTo(4, z1); ctx.lineTo(S - 4, z1); ctx.stroke();
    }
    // Mission beacon.
    if (state.beacon) {
      const [x, y] = toMap(state.beacon.x, state.beacon.z);
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 9 + Math.sin(state.time * 4) * 2, 0, Math.PI * 2); ctx.stroke();
    }
    // Traffic dots.
    ctx.fillStyle = '#ffffff';
    for (const c of state.traffic) {
      const [x, y] = toMap(c.x, c.z);
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    // Rival dots.
    ctx.fillStyle = '#ff4030';
    for (const r of state.rivals) {
      const [x, y] = toMap(r.x, r.z);
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }
    // Police dots (flashing).
    ctx.fillStyle = Math.floor(state.time * 4) % 2 === 0 ? '#4080ff' : '#ff3030';
    for (const p of state.police) {
      const [x, y] = toMap(p.x, p.z);
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    // Player arrow.
    const [px, py] = toMap(state.player.x, state.player.z);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.atan2(Math.sin(state.heading), Math.cos(state.heading)) + Math.PI);
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();
    // Progress bar (vault cracking) under the objective.
    if (this.progressRatio >= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(20, S - 16, S - 40, 8);
      ctx.fillStyle = '#ffd23e';
      ctx.fillRect(20, S - 16, (S - 40) * this.progressRatio, 8);
    }
  }
}
