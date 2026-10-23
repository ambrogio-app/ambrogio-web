// Verifies a built image of the web client: build context exclusions, labels, user, port, served files,
// headers and cache.
// Usage: node scripts/verify-docker-image.mjs <image> [amd64|arm64]
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [image, arch] = process.argv.slice(2);
if (!image) throw new Error('Usage: node scripts/verify-docker-image.mjs <image> [amd64|arm64]');
const platform = arch ? ['--platform', `linux/${arch}`] : [];
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8' }).trim();

const excluded = ['.git', '.github', '.githooks', 'node_modules', '**/node_modules', 'dist', 'config.json',
  'public/config.json', 'system-model', 'test', 'integration', 'scripts', '*.env', '*.env.*'];
const csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; "
  + "connect-src 'self' http: https: ws: wss:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; "
  + "object-src 'none'";
const containers = [];
const directory = mkdtempSync(join(tmpdir(), 'ambrogio-web-image-'));

async function start(extra = []) {
  const id = docker('run', '-d', ...platform, '-p', '127.0.0.1::8080', ...extra, image);
  containers.push(id);
  const port = docker('port', id, '8080/tcp').split('\n')[0].split(':').at(-1);
  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 30_000;
  for (;;) {
    try { await fetch(base); return base; } catch {
      if (Date.now() > deadline) throw new Error(`The container did not answer:\n${docker('logs', id)}`);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}

function assertSecurityHeaders(response, path) {
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff', path);
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer', path);
  assert.equal(response.headers.get('content-security-policy'), csp, path);
  assert.equal(response.headers.get('server'), 'nginx', `${path}: the nginx version must not be exposed`);
}

try {
  const ignored = readFileSync(new URL('../.dockerignore', import.meta.url), 'utf8').split('\n').map(line => line.trim());
  for (const pattern of excluded) assert.ok(ignored.includes(pattern), `.dockerignore must exclude ${pattern}`);
  assert.equal(docker('image', 'inspect', '-f', '{{json .Config.ExposedPorts}}', image), '{"8080/tcp":{}}');
  const labels = JSON.parse(docker('image', 'inspect', '-f', '{{json .Config.Labels}}', image)) ?? {};
  assert.equal(labels['org.opencontainers.image.source'], 'https://github.com/ambrogio-app/ambrogio-web');
  assert.equal(labels['org.opencontainers.image.licenses'], 'MIT');
  assert.notEqual(docker('run', '--rm', ...platform, '--entrypoint', 'id', image, '-u'), '0', 'nginx must not run as root');
  docker('run', '--rm', ...platform, '--entrypoint', 'sh', image, '-c', 'test ! -e /usr/share/nginx/html/config.json');

  const bare = await start();
  const index = await fetch(`${bare}/`);
  assert.equal(index.status, 200);
  assertSecurityHeaders(index, '/');
  assert.equal(index.headers.get('cache-control'), 'no-store');
  const html = await index.text();
  const asset = /src="\.\/(assets\/[^"]+\.js)"/.exec(html)?.[1];
  assert.ok(asset, 'index.html must reference a hashed script under assets/');
  const script = await fetch(`${bare}/${asset}`);
  assert.equal(script.status, 200);
  assertSecurityHeaders(script, asset);
  assert.equal(script.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  const missingConfig = await fetch(`${bare}/config.json`);
  assert.equal(missingConfig.status, 404, 'without a mounted file config.json is missing');
  assertSecurityHeaders(missingConfig, '/config.json');
  assert.equal((await fetch(`${bare}/missing`)).status, 404);

  const config = join(directory, 'config.json');
  writeFileSync(config, JSON.stringify({ backendUrl: 'https://ambrogio.example.com', language: 'it' }));
  chmodSync(directory, 0o755);
  chmodSync(config, 0o644);
  const mounted = await start(['-v', `${config}:/usr/share/nginx/html/config.json:ro`]);
  const served = await fetch(`${mounted}/config.json`);
  assert.equal(served.status, 200);
  assertSecurityHeaders(served, '/config.json');
  assert.equal(served.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await served.json(), { backendUrl: 'https://ambrogio.example.com', language: 'it' });
  console.log(`Image ${image}${arch ? ` (${arch})` : ''} verified.`);
} finally {
  for (const id of containers) execFileSync('docker', ['rm', '-f', id], { stdio: 'ignore' });
  rmSync(directory, { recursive: true, force: true });
}
