const CACHE = 'gestorpro-v4';
const BASE = '/Integra/';
const ASSETS = [BASE, BASE+'index.html', BASE+'manifest.json', BASE+'icons/icon-192.png', BASE+'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('firebase') || url.includes('google') || url.includes('gstatic') ||
      url.includes('googleapis') || url.includes('firestore') || url.includes('cdn') ||
      url.includes('jsdelivr') || url.includes('fonts')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match(BASE+'index.html')))
  );
});

self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(self.registration.showNotification(data.title || 'GestorPro', {
    body: data.body || '',
    icon: BASE+'icons/icon-192.png',
    badge: BASE+'icons/icon-192.png',
    data: { url: data.url || BASE }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || BASE));
});
