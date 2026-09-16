/**
 * Static preview server for the built site.
 *
 * Why not `astro preview`: it daemonizes itself under some environments and
 * coordinates through a lock file, which makes it awkward to manage as a test
 * fixture. This server is deliberately dumb and deterministic — it behaves the
 * same locally and in CI — and it mirrors how GitHub Pages actually serves a
 * project page: everything under `base`, directories resolving to index.html,
 * and a 404.html fallback.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../astro.config.mjs';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const BASE = `/${(config.base ?? '').replace(/^\/|\/$/g, '')}`.replace(
  /^\/$/,
  '',
);

const portFlagIndex = process.argv.indexOf('--port');
const PORT = Number(
  (portFlagIndex !== -1 && process.argv[portFlagIndex + 1]) ||
    process.env.PORT ||
    4321,
);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf',
};

/** Resolve a URL pathname to a file inside dist, or null. */
function resolveFile(pathname) {
  // Strip the base prefix; anything outside it does not exist in production.
  if (BASE && !(pathname === BASE || pathname.startsWith(`${BASE}/`))) {
    return null;
  }
  const relative = pathname.slice(BASE.length) || '/';

  // normalize() collapses `..` so a crafted path cannot escape dist.
  const candidatePath = resolve(join(DIST, normalize(relative)));
  if (candidatePath !== DIST && !candidatePath.startsWith(DIST + '/')) {
    return null;
  }

  const candidates = [candidatePath];
  if (relative.endsWith('/')) {
    candidates.push(join(candidatePath, 'index.html'));
  } else {
    candidates.push(`${candidatePath}.html`, join(candidatePath, 'index.html'));
  }

  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function send(res, status, file) {
  res.writeHead(status, {
    'content-type': MIME[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(res);
}

const server = createServer((req, res) => {
  // A request line like `//` parses as protocol-relative rather than as a
  // path. Reject it instead of letting it throw and take the server down.
  let pathname;
  try {
    ({ pathname } = new URL(req.url, `http://localhost:${PORT}`));
  } catch {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request\n');
    return;
  }

  // Requests to the origin root are not something Pages serves for a project
  // page; send them to the base so a bare localhost visit still works.
  if (BASE && (pathname === '/' || pathname === '')) {
    res.writeHead(302, { location: `${BASE}/` });
    res.end();
    return;
  }

  const file = resolveFile(decodeURIComponent(pathname));
  if (file) {
    send(res, 200, file);
    return;
  }

  const notFound = join(DIST, '404.html');
  if (existsSync(notFound)) {
    send(res, 404, notFound);
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found\n');
});

if (!existsSync(DIST)) {
  console.error(`No build found at ${DIST}. Run \`npm run build\` first.`);
  process.exit(1);
}

server.listen(PORT, () => {
  console.warn(`Preview server running at http://localhost:${PORT}${BASE}/`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
