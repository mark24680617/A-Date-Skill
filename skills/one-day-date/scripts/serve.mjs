#!/usr/bin/env node
// Tiny static file server (no dependencies) for previewing the site locally.
// The sprite processing reads image pixels, which browsers only allow over http://, not file://.
// Usage: node scripts/serve.mjs <site-folder> [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
let port = Number(process.argv[3] || process.env.PORT || 8080);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (req, res) => {
  if (req.method === 'POST') {           // pretend to be Netlify Forms so the ending works locally
    req.resume();
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok (local preview: nothing was sent)');
  }
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(root, path));
    if (!file.startsWith(root)) throw new Error('outside root');
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  }
});
let tries = 0;
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE' && tries++ < 20) { port++; server.listen(port); }   // busy → try the next port
  else { console.error(`✗ Could not start the server: ${e.message}`); process.exit(1); }
});
server.on('listening', () => {
  console.log(`Serving ${root}\n→ http://localhost:${port}/   (Ctrl+C to stop)\n  Jump to a stop: http://localhost:${port}/?scene=2`);
});
server.listen(port);
