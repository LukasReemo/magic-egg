import './build.mjs';
import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const port = Number(process.env.PORT || 4173);
http.createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!pathname.startsWith('/magic-egg/')) { response.writeHead(302, { Location: '/magic-egg/' }); response.end(); return; }
    pathname = pathname.slice('/magic-egg/'.length) || 'index.html';
    const file = path.resolve(root, pathname);
    if (!file.startsWith(root)) { response.writeHead(403); response.end(); return; }
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(body);
  } catch { response.writeHead(404); response.end('Nenalezeno'); }
}).listen(port, '0.0.0.0', () => console.log(`Magic Egg: http://localhost:${port}/magic-egg/`));
