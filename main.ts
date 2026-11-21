// Solmar Heat — entry program for make.fun gta6-01 ("Make GTA 6").
// Copies game/ and screenshots/ from this repository to /output (or
// MAKEFUN_OUTPUT_DIR outside the grader) and writes /output/dossier.json
// with buildDossier from vendor/makefun-game.ts. Node 22, no dependencies.
// Run: node main.ts  (or MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts)

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const gameSrc = join(repoRoot, 'game');
const shotsSrc = join(repoRoot, 'screenshots');

if (!existsSync(join(gameSrc, 'index.html'))) {
  throw new Error(`game/index.html not found in ${repoRoot}`);
}
if (!existsSync(shotsSrc)) throw new Error(`screenshots/ not found in ${repoRoot}`);
const shots = readdirSync(shotsSrc).filter((f) => !f.startsWith('.'));
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(gameSrc, join(outDir, 'game'), { recursive: true });
cpSync(shotsSrc, join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});

const dossierPath = join(outDir, 'dossier.json');
writeFileSync(dossierPath, dossier);
if (!existsSync(dossierPath) || statSync(dossierPath).size !== dossier.length) {
  throw new Error('dossier.json was not written correctly');
}

console.log(`Solmar Heat entry written to ${outDir}`);
console.log(`  game files: ${readdirSync(join(outDir, 'game')).length} top-level entries`);
console.log(`  screenshots: ${shots.join(', ')}`);
console.log(`  dossier.json: ${dossier.length} bytes`);
