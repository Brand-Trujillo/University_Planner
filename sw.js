const CACHE = 'university-planner-v26';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './tailwind.js',
  './vendor/firebase-app-compat.js', './vendor/firebase-auth-compat.js', './vendor/firebase-firestore-compat.js', './vendor/firebase-messaging-compat.js'];
// Avisos push (FCM) con la app cerrada: el servidor envía solo datos y aquí se muestran
self.addEventListener('push', e => {
  let p = {}; try { p = e.data.json(); } catch { return; }
  const d = p.data || p.notification || {};
  if (!d.title) return;
  e.waitUntil(clients.matchAll({ type: 'window' }).then(l => {
    // Con la app a la vista, los recordatorios de pendientes ya los muestra la propia app
    if (d.kind === 'task' && l.some(c => c.visibilityState === 'visible')) return;
    return self.registration.showNotification(d.title, { body: d.body || '', tag: d.tag || undefined, icon: './icon-192.png', badge: './icon-192.png' });
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => l.length ? l[0].focus() : clients.openWindow('./')));
});
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Solo archivos propios: no tocar las conexiones de Firebase/Google
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request)));
});