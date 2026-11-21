// Solmar Heat — bootstrap, game loop, third-person camera, save wiring,
// mission event wiring, busted handling, and ?shot= staging for screenshots.
import * as THREE from 'three';
import { CFG } from './config.js';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { SaveSystem } from './save.js';
import { World } from './world.js';
import { Traffic } from './traffic.js';
import { Pedestrians } from './pedestrians.js';
import { Player } from './player.js';
import { Police } from './police.js';
import { Missions } from './missions.js';
import { Combat } from './combat.js';
import { HUD } from './hud.js';

window.__solmar = { ready: false, error: null, shot: null };
const params = new URLSearchParams(location.search);
const shotParam = params.get('shot');
if (shotParam) window.__solmar.shot = Number(shotParam);

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1400);

const input = new Input();
const audio = new AudioEngine();
const save = new SaveSystem();
const hud = new HUD();
const world = new World(scene);
const traffic = new Traffic(scene, world);
const pedestrians = new Pedestrians(scene, world);
const player = new Player(scene, world, input);
const police = new Police(scene, world);
const combat = new Combat(scene, world);

const state = {
  cash: 0,
  started: false,
  busted: false,
  time: 0,
};

const missions = new Missions(scene, world, combat);
missions.onEvent = (type, payload) => {
  if (type === 'banner') hud.banner(payload.big, payload.small);
  else if (type === 'objective') {
    hud.setObjective(payload.name ?? `MISSION ${payload.id ?? ''}`, payload.objective, payload.sub);
  } else if (type === 'reward') {
    state.cash += payload.amount;
    hud.setCash(state.cash);
    hud.toast(`+$${payload.amount.toLocaleString('en-US')} — ${payload.name} complete!`);
    audio.chime();
  } else if (type === 'autosave') {
    saveGame(true);
  } else if (type === 'forceWanted') {
    police.setWanted(payload, onWantedChange);
  } else if (type === 'spawnRivals') {
    combat.spawnRivals(payload, 4);
    hud.toast('Vulture crew ahead — take them down!');
  } else if (type === 'toast') hud.toast(payload);
  else if (type === 'chime') audio.chime();
  else if (type === 'progress') hud.setProgress(payload.label, payload.ratio);
};
// The constructor already ran startMission(0) before onEvent existed; re-run
// it so the banner and objective actually reach the HUD.
missions.startMission(missions.index);

function onWantedChange(n) {
  hud.setStars(n);
  audio.setSiren(n > 0);
  if (n === 1) hud.toast('The Solmar Bay Police are onto you!');
  if (n >= 3) hud.toast('HEAT LEVEL ' + n + ' — every unit in the city is coming!');
}

function saveGame(quiet) {
  const ok = save.save({
    missionIndex: missions.index,
    cash: state.cash,
    health: player.health,
    wanted: police.wanted,
    player,
    completedMissions: missions.index,
  });
  if (ok && !quiet) hud.toast('Game saved.');
  return ok;
}

function loadGame() {
  const d = save.load();
  if (!d) return false;
  state.cash = d.cash;
  player.health = d.health;
  if (d.pos) player.pos.set(d.pos.x, 0, d.pos.z);
  missions.index = Math.min(d.mission, 4);
  missions.startMission(missions.index);
  police.setWanted(d.wanted ?? 0, onWantedChange);
  hud.setCash(state.cash);
  return true;
}

function startGame() {
  if (state.started) return;
  state.started = true;
  audio.init();
  document.getElementById('start').style.display = 'none';
  hud.show();
  hud.setCash(state.cash);
  hud.setStars(police.wanted);
  hud.setHealth(player.health);
  const loaded = loadGame();
  if (loaded) hud.toast('Save loaded — welcome back to Solmar Bay.');
  else hud.toast('Welcome to Solmar Bay, Rico. Steal a car — press E near one.');
  canvas.addEventListener('click', () => input.lockPointer(canvas));
}

document.getElementById('startBtn').addEventListener('click', startGame);

function showBusted(title, text) {
  state.busted = true;
  document.getElementById('over').style.display = 'flex';
  document.querySelector('#over h1').textContent = title;
  document.getElementById('overText').textContent = text;
  police.setWanted(0, onWantedChange);
}
document.getElementById('retryBtn').addEventListener('click', () => {
  document.getElementById('over').style.display = 'none';
  state.busted = false;
  player.health = 100;
  if (player.inCar) player.exitCar();
  player.pos.set(60, 0, 120);
  player.heading = Math.PI;
  player.camYaw = Math.PI;
  hud.setHealth(100);
  hud.toast('Back on the streets. Lay low for a while.');
});

function onBusted() {
  if (!state.busted) showBusted('BUSTED', 'The Solmar Bay Police caught up with you.');
}

// ---- screenshot staging (?shot=1..4): real gameplay states, no start screen.
function stageShot(n) {
  state.started = true;
  document.getElementById('start').style.display = 'none';
  hud.show();
  if (n === 1) {
    // Cover: Rico on foot on the central avenue, Solmar Tower dead ahead,
    // traffic and the gold beacon's minimap dot in view.
    player.pos.set(0, 0, 180);
    player.heading = Math.PI;
    player.camYaw = Math.PI;
    traffic.spawn({ x: 0, z: 140 });
    traffic.spawn({ x: 0, z: 100 });
    hud.toast('Welcome to Solmar Bay, Rico. Steal a car — press E near one.');
  } else if (n === 2) {
    // Driving through traffic on the central avenue.
    const car = traffic.cars[0];
    car.pos.set(0, 0, 60);
    car.heading = 0;
    car.speed = 0;
    player.enterCar(car);
    player.autoThrottle = 0.7;
    car.speed = 24;
    traffic.spawn({ x: 0, z: 100 });
    traffic.spawn({ x: -3, z: 30 });
    traffic.spawn({ x: 3, z: 130 });
    hud.toast('Cruising the avenue — watch the traffic.');
  } else if (n === 3) {
    // Police chase: three stars, units closing in on both flanks, in view.
    const car = traffic.cars[0];
    car.pos.set(0, 0, 60);
    car.heading = 0;
    car.speed = 0;
    player.enterCar(car);
    player.autoThrottle = 0.7;
    car.speed = 30;
    police.setWanted(3, onWantedChange);
    police.placeNear(player.pos);
    police.units[0].pos.set(-6, 0, 46);
    police.units[0].heading = 0;
    police.units[0].speed = 34;
    police.units[1].pos.set(6, 0, 52);
    police.units[1].heading = 0;
    police.units[1].speed = 32;
    hud.toast('HEAT LEVEL 3 — lose the cops!');
  } else if (n === 4) {
    // Mission in progress: Crew Trouble, rivals around the gold beacon.
    missions.startMission(2);
    player.pos.set(-60, 0, -36);
    player.heading = Math.PI;
    player.camYaw = Math.PI;
    traffic.spawn({ x: -60, z: -90 });
    hud.toast('Vulture crew ahead — take them down!');
  }
  hud.setCash(state.cash);
  hud.setStars(police.wanted);
  hud.setHealth(player.health);
}

// ---- camera
const camTarget = new THREE.Vector3();
const camPos = new THREE.Vector3(40, 8, 170);
function updateCamera(dt) {
  const anchor = player.inCar ? player.inCar.pos : player.pos;
  const yaw = player.camYaw; // facing direction; camera sits behind it
  const dist = player.inCar ? 11 : 7.5;
  const height = player.inCar ? 4.4 : 3.4;
  const want = new THREE.Vector3(
    anchor.x - Math.sin(yaw) * dist,
    (player.inCar ? 0 : player.pos.y) + height,
    anchor.z - Math.cos(yaw) * dist,
  );
  camPos.lerp(want, Math.min(1, dt * 5));
  camera.position.copy(camPos);
  camTarget.lerp(new THREE.Vector3(anchor.x, (player.inCar ? 1 : player.pos.y + 1.6), anchor.z), Math.min(1, dt * 8));
  camera.lookAt(camTarget);
}

// ---- main loop
const clock = new THREE.Clock();
let frames = 0;

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  state.time += dt;
  if (!state.started || state.busted) {
    // Idle orbit behind the start screen so the backdrop is alive.
    if (!state.started) {
      const a = state.time * 0.05;
      camera.position.set(Math.sin(a) * 160, 55, Math.cos(a) * 160);
      camera.lookAt(0, 20, 0);
      traffic.update(dt, player.pos);
      pedestrians.update(dt, state.time);
    }
    renderer.render(scene, camera);
    input.endFrame();
    return;
  }
  // Camera yaw from mouse / arrow keys (on foot).
  const { dx } = input.consumeMouse();
  if (!player.inCar) {
    player.camYaw -= dx * 0.0028;
    player.camYaw -= input.axis('ArrowLeft', 'ArrowRight') * 2.4 * dt;
  }
  // Player + car events.
  const evt = player.update(dt, state.time, traffic.cars);
  if (evt.stole) {
    hud.toast(`${evt.stole.name} stolen! The owner called it in.`);
    police.addWanted(1, onWantedChange);
    audio.blip(520, 0.1, 'square', 0.1);
  }
  if (evt.exited) hud.toast('On foot again.');
  // Shooting (on foot). Firing a gun in public draws heat.
  if (input.clicked && !player.inCar) {
    combat.playerShoot(camera, player, audio, pedestrians);
    if (police.wanted === 0) police.addWanted(1, onWantedChange);
  }
  traffic.update(dt, player.pos);
  pedestrians.update(dt, state.time);
  police.placeNear(player.pos);
  police.update(dt, state.time, player, onBusted);
  combat.update(dt, player, audio, (dmg) => {
    player.health = Math.max(0, player.health - dmg);
    hud.setHealth(player.health);
    if (player.health <= 0 && !state.busted) showBusted('WASTED', 'The Vulture crew got the better of you.');
  });
  missions.update(dt, { player, police, time: state.time });
  // Health regen while clean.
  if (police.wanted === 0 && player.health < 100 && player.health > 0) {
    player.health = Math.min(100, player.health + 3 * dt);
    hud.setHealth(player.health);
  }
  // HUD.
  hud.setHealth(player.health);
  hud.setSpeed(player.inCar ? player.inCar.speed * 2.237 : player.speed * 2.237,
    player.inCar ? player.inCar.name : 'ON FOOT');
  hud.setCrosshair(!player.inCar);
  hud.setStars(police.wanted);
  const beacon = missions.target();
  hud.drawMinimap({
    time: state.time,
    player: { x: player.pos.x, z: player.pos.z },
    heading: player.inCar ? player.inCar.heading : player.heading,
    traffic: traffic.cars.map((c) => ({ x: c.pos.x, z: c.pos.z })),
    police: police.units.map((u) => ({ x: u.pos.x, z: u.pos.z })),
    rivals: combat.rivals.filter((r) => !r.dead).map((r) => ({ x: r.pos.x, z: r.pos.z })),
    beacon,
  });
  audio.setEngine(Math.abs(player.inCar ? player.inCar.speed : 0) / CFG.carTopSpeed, !!player.inCar);
  // Manual save / mute / reset.
  if (input.hit('KeyH')) saveGame(false);
  if (input.hit('KeyM')) {
    audio.setMuted(!audio.muted);
    hud.toast(audio.muted ? 'Sound muted.' : 'Sound on.');
  }
  if (input.hit('KeyR')) {
    if (player.inCar) player.exitCar();
    player.pos.set(0, 0, 0);
    player.heading = Math.PI;
    player.camYaw = Math.PI;
    hud.toast('Reset to the city center.');
  }
  updateCamera(dt);
  renderer.render(scene, camera);
  input.endFrame();
  frames++;
  if (frames === 5) {
    window.__solmar.ready = true;
    window.__solmar.state = {
      cash: state.cash, wanted: police.wanted,
      mission: missions.index + 1, missionName: missions.current?.name ?? 'DONE',
      health: Math.round(player.health),
    };
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('error', (e) => { window.__solmar.error = String(e.message || e.error); });

if (shotParam) stageShot(Number(shotParam));
frame();
