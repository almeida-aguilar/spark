// SPARK: service worker para PWA instalable y sin conexión (fases 8 y 9).
// Workbox inyecta aquí la lista de precache del app shell (__WB_MANIFEST).
import {precacheAndRoute, cleanupOutdatedCaches} from 'workbox-precaching';
import {clientsClaim} from 'workbox-core';
import {registerRoute} from 'workbox-routing';
import {CacheFirst} from 'workbox-strategies';
import {CacheableResponsePlugin} from 'workbox-cacheable-response';
import {ExpirationPlugin} from 'workbox-expiration';

self.skipWaiting = false;

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);
clientsClaim();

// La biblioteca multimedia no se precachea: se guarda la primera vez que se usa.
registerRoute(
    ({url}) => /\/static\/library-assets\//.test(url.pathname),
    new CacheFirst({
        cacheName: 'spark-library-assets-v1',
        plugins: [
            new CacheableResponsePlugin({statuses: [0, 200]}),
            new ExpirationPlugin({maxEntries: 1352, maxAgeSeconds: 365 * 24 * 60 * 60})
        ]
    })
);

// Recursos estáticos versionados (hash en el nombre): cache-first.
registerRoute(
    ({url, request}) =>
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'image' ||
        request.destination === 'font' ||
        /\/static\/|\/chunks\//.test(url.pathname),
    new CacheFirst({
        cacheName: 'spark-static-v1',
        plugins: [
            new CacheableResponsePlugin({statuses: [0, 200]}),
            new ExpirationPlugin({maxEntries: 2000, maxAgeSeconds: 365 * 24 * 60 * 60})
        ]
    })
);
