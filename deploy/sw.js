// 오프라인 캐시: 한 번 열어두면 이후엔 인터넷 없이 열립니다.
// 온라인일 땐 항상 최신본을 먼저 받아오고(3초 안에 응답 없으면 저장본 사용),
// 오프라인이면 저장본을 보여줍니다. 그래서 GitHub에서 고치면 별도 작업 없이 반영됩니다.
const VERSION = 'taipei-v3';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function respond(req) {
  const cache = await caches.open(VERSION);
  const fromCache = async () =>
    (await cache.match(req, { ignoreSearch: true })) ||
    (req.mode === 'navigate' ? await cache.match('./index.html') : undefined);
  const net = fetch(req, { cache: 'no-cache' }).then(r => {
    if (r && r.ok) cache.put(req, r.clone());
    return r;
  });
  net.catch(() => {});
  const timeout = new Promise(res => setTimeout(() => res(fromCache()), 3000));
  try {
    const r = await Promise.race([net, timeout]);
    return r || net;
  } catch (err) {
    return (await fromCache()) || Response.error();
  }
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(respond(e.request));
});
