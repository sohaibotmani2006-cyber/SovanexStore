import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 8000;
const INDEX_PATH = path.join(__dirname, 'index.html');
const ALLOWED_ROUTE_PREFIXES = ['/', '/shop', '/contact', '/policies', '/orders', '/wishlist', '/cart', '/checkout', '/payment', '/bank-transfer', '/order-confirmation', '/admin'];

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function safeFilePath(requestPath) {
  const decoded = decodeURIComponent(requestPath);
  if (decoded.includes('..')) return null;
  return path.join(__dirname, decoded.replace(/^\//, ''));
}

async function serveIndex(res, extraHeaders = {}) {
  const html = await fs.readFile(INDEX_PATH);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...extraHeaders });
  res.end(html);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  if (pathname.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const isKnownRoute = ALLOWED_ROUTE_PREFIXES.includes(normalizedPath) || normalizedPath.startsWith('/product/');

  if (normalizedPath.includes('.') && !isKnownRoute) {
    const filePath = safeFilePath(pathname);
    if (!filePath) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad Request');
      return;
    }

    try {
      const file = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(file);
      return;
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
  }

  if (!isKnownRoute && !normalizedPath.startsWith('/product/')) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  const isPrivateRoute = /^\/(admin|cart|checkout|payment|bank-transfer|order-confirmation|orders|wishlist)(\/|$)/.test(normalizedPath);
  await serveIndex(res, isPrivateRoute ? { 'X-Robots-Tag': 'noindex, nofollow, noarchive' } : {});
});

server.listen(PORT, () => {
  console.log(`Local SPA server running at http://localhost:${PORT}`);
});
