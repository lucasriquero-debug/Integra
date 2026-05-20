// GestorPro SW v5 — fuerza limpieza de caché viejo
const CACHE = 'gestorpro-v5';
const BASE = '/Integra/';

// Al instalar, limpiar TODOS los cachés anteriores primero
self.addEventListener('install', e => {
  self.skipWaiting(); // Activar inmediatamente sin esperar
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k))) // Borrar todo lo viejo
    ).then(() =>
      caches.open(CACHE).then(c =>
        c.addAll([BASE+'index.html', BASE+'manifest.json']).catch(()=>{})
      )
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()) // Tomar control de todas las pestañas
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Dejar pasar sin cachear: Firebase, Google, CDNs, fuentes
  if (url.includes('firebase') || url.includes('gstatic') ||
      url.includes('googleapis') || url.includes('cdn') ||
      url.includes('fonts.google') || url.includes('jsdelivr')) {
    return; // fetch normal sin interceptar
  }
  // Para HTML siempre buscar la versión más nueva (network first)
  if (url.includes('index.html') || url.endsWith('/Integra/') || url.endsWith('/Integra')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(BASE+'index.html'))
    );
    return;
  }
  // Para otros assets: cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Push notifications
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(self.registration.showNotification(data.title || 'GestorPro', {
    body: data.body || '',
    icon: BASE+'icons/icon-192.png',
    badge: BASE+'icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || BASE }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || BASE));
});
