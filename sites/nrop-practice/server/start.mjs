import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { loadEnvFile } from 'node:process';
import { nropMiddleware } from './api.mjs';
try { loadEnvFile('.env.local'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const root = resolve('dist'), port = Number(process.env.PORT || 4178);
const api = nropMiddleware(process.env);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
createServer((req, res) => api(req, res, async () => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname === '/' ? '/index.html' : new URL(req.url, 'http://local').pathname));
    if (!path.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
    const content = await readFile(path);
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' }); res.end(content);
  } catch { res.writeHead(404); res.end('找不到檔案，請先執行 npm run build'); }
})).listen(port, '127.0.0.1', () => console.log('Local: http://127.0.0.1:' + port));
