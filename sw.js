var kbCacheName = "kb-cache-1";

var tombiokbpath = new URL(location).searchParams.get('tombiokbpath');

var kbCacheFiles = [
    tombiokbpath + 'taxa.csv',
    tombiokbpath + 'characters.csv',
    tombiokbpath + 'values.csv',
    tombiokbpath + 'media.csv',
    tombiokbpath + 'config.csv'
];

console.log("cache", kbCacheFiles);

self.addEventListener('install', function (e) {
    console.log('[ServiceWorker] Install');
    e.waitUntil(
        caches.open(kbCacheName).then(function (cache) {
            console.log('[ServiceWorker] Caching knowledge-base');
            return cache.addAll(kbCacheFiles);
        })
    );
});

self.addEventListener('fetch', function (e) {

    e.respondWith(
        caches.match(e.request).then(function (response) {
            if (response) {
                console.log('[Service Worker] Fetched from cache', e.request.url);
                return response;
            } else {
                //console.log('[Service Worker] Fetched via http', e.request.url);
                return fetch(e.request);
            }
        })
    );
});