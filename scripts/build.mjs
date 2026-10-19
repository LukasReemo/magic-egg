import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { animals } from '../src/animals.js';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'style.css', 'manifest.webmanifest', 'src', 'assets', 'SOUND_SOURCES.md']) {
  await cp(path.join(root, name), path.join(output, name), { recursive: true });
}
await writeFile(path.join(output, '.nojekyll'), '');
// License attribution ships inside the page and remains available offline.
const { recordings } = JSON.parse(await readFile(path.join(root, 'assets/sounds/animals/sources.json'), 'utf8'));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const credits = recordings.map(recording => `<li><strong>${escape(animals.find(a => a.id === recording.id).name)}</strong>: <a href="${escape(recording.url)}" target="_blank" rel="noopener">${escape(recording.title)}</a> — ${escape(recording.author)}; <a href="${escape(recording.licenseUrl)}" target="_blank" rel="noopener">${escape(recording.license)}</a>. Upraveno: výřez, mono, normalizace, převod MP3${recording.id === 'pig' ? ', opakování' : recording.id === 'penguin' ? ', spojení dvou volání' : ''}.</li>`).join('');
const html = await readFile(path.join(output, 'index.html'), 'utf8');
await writeFile(path.join(output, 'index.html'), html.replace('<!-- SOUND_CREDITS -->', credits));

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
}
const files = (await walk(output)).sort();
const hash = createHash('sha256');
for (const file of files) { hash.update(path.relative(output, file)); hash.update(await readFile(file)); }
const version = hash.digest('hex').slice(0, 16);
const urls = files.map(file => './' + path.relative(output, file).split(path.sep).join('/'));
const worker = `// Generated from the complete output: a content change creates a new atomic cache.
const CACHE = 'magic-egg-${version}';
const PREFIX = 'magic-egg-';
const ASSETS = ${JSON.stringify(urls)};
const absolute = file => new URL(file, self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(absolute))));
  // Keep the current version alive until all its tabs close. Never replace a running timer.
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // CacheStorage is origin-wide: leave other GitHub Pages apps and their caches alone.
    const ownScope = self.registration.scope;
    const keys = await caches.keys();
    for (const key of keys.filter(key => key.startsWith(PREFIX) && key !== CACHE)) {
      const cache = await caches.open(key);
      if (await cache.match(ownScope + 'index.html')) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Serve one coherent, precached release. Updates install atomically in a waiting worker.
    if (event.request.mode === 'navigate') return await cache.match(absolute('./index.html')) || fetch(event.request);
    return await cache.match(event.request, { ignoreSearch: true }) || fetch(event.request);
  })());
});
`;
await writeFile(path.join(output, 'sw.js'), worker);
console.log(`Built ${files.length + 1} local files. Offline release ${version}.`);
