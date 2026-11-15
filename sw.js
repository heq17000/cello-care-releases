const scope = self.registration.scope;
const cachePrefix = `cello-care:${scope}:`;
const cacheName = `${cachePrefix}1.5.2`;
const shell = new URL('index.html', scope).href;
const assets = [
  'index.html', 'styles.css', 'program.js', 'guide.js', 'records.js', 'app.js', 'install.js', 'manifest.webmanifest',
  'guides/upper.png', 'guides/floor.png', 'guides/recovery.png',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'
].map(path => new URL(path, scope).href);
const staticUrls = new Set(assets);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(assets.map(url => new Request(url, { cache: 'reload' })));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(cachePrefix) && name !== cacheName).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Only serve the app shell and its own assets from cache. YouTube remains online-only.
  const isLaunchPage = request.mode === 'navigate' && (url.href.split(/[?#]/)[0] === scope || url.href.split(/[?#]/)[0] === shell);
  const key = isLaunchPage ? shell : url.href;
  if (!staticUrls.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    return (await cache.match(key)) ?? fetch(request);
  })());
});
