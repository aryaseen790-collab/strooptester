// Tiny static server for previewing dist/ locally: npm run serve
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };
const port = +process.env.PORT || 4321;

http
  .createServer((req, res) => {
    let p = path.join(OUT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(OUT)) return res.writeHead(403).end();
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) {
      res.writeHead(404, { 'content-type': TYPES['.html'] });
      return fs.createReadStream(path.join(OUT, '404.html')).pipe(res);
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  })
  .listen(port, () => console.log(`Serving dist/ at http://localhost:${port}`));
