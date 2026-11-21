// Solmar Heat — tiny static file server for local testing and screenshots.
// Serves this repository's game/ at http://localhost:PORT/ (default 8931).
// Usage: node serve.ts [port]   (Node 22 runs TypeScript as-is.)

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), 'game');
const port = Number(process.argv[2] ?? 8931);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const rel = normalize(urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, ''));
  const file = join(root, rel);
  if (!file.startsWith(root + sep) && file !== root) {
    res.writeHead(403); res.end('forbidden'); return;
  }
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});

server.listen(port, () => console.log(`Solmar Heat serving game/ at http://localhost:${port}/`));
