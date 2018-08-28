var kbCacheName = "tombio-kb-cache-1";
var kbImgStdCacheName = "tombio-kb-img-std-cache-1";
var kbImgSmlCacheName = "tombio-kb-img-sml-cache-1";
var kbImgLrgCacheName = "tombio-kb-img-lrg-cache-1";
var kbTxtCacheName = "tombio-kb-txt-cache-1";
var genCacheName = "tombio-gen-cache-1";
var shellCacheName = "tombio-shell-cache-1";
var allCacheNames = [shellCacheName, genCacheName, kbCacheName, kbImgStdCacheName, kbImgSmlCacheName, kbImgLrgCacheName, kbTxtCacheName]
var url = new URL(location);
var tombiokbpath = url.searchParams.get('tombiokbpath');
var tombiopath = url.searchParams.get('tombiopath');

var shellCacheFiles = [
    tombiopath + 'resources/no-wifi.png'
];

self.addEventListener('install', function (e) {
    console.log('[ServiceWorker] Installing');
    e.waitUntil(
        Promise.all([
            //caches.open(kbCacheName).then(function (cache) {
            //    console.log('[ServiceWorker] Caching knowledge-base');
            //    return cache.addAll(kbCacheFiles);
            //}),
            caches.open(shellCacheName).then(function (cache) {
                console.log('[ServiceWorker] Caching shell files');
                return cache.addAll(shellCacheFiles);
            })
        ])
    );
    console.log('[ServiceWorker] Installed');
});

self.addEventListener('activate', function (e) {
    console.log('[ServiceWorker] Activate');
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (allCacheNames.indexOf(key) == -1) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    //Uncommenting the line below doesn't cause all resources to be cached on first
    //load, e.g. the top level page, so the value of doing it is questionable for this app.
    //return self.clients.claim();
});

self.addEventListener('fetch', function (e) {

    e.respondWith(
        caches.match(e.request).then(function (response) {
            if (response) {
                //if (e.request.url.endsWith('csv')) console.log('[Service Worker] Fetched from cache', e.request.url);
                return response;
            } else {
                //console.log("SW fetching", e.request.url)

                var url = new URL(e.request.url);
                var t = url.searchParams.get('t');
                if (t == "kbcsv") {
                    var cache = kbCacheName;
                } else if (t == "kbimgstd") {
                    var cache = kbImgStdCacheName;
                } else if (t == "kbimgsml") {
                    var cache = kbImgSmlCacheName;
                } else if (t == "kbimglrg") {
                    var cache = kbImgLrgCacheName;
                } else if (t == "kbtxt") {
                    var cache = kbTxtCacheName;
                } else {
                    var cache = genCacheName;
                }

                return caches.open(cache).then(function (cache) {
                    return fetch(e.request).then(function (response) {
                        console.log("SW caching", e.request.url)
                        cache.put(e.request, response.clone());
                        return response;
                    }).catch(function (response) {
                        console.log("FAILED TO FIND IMG", e.request.url)
                        if (t == "kbimgstd" || t == "kbimgsml" || t == "kbimglrg") { 
                            //https://hackernoon.com/service-worker-one-fallback-offline-image-for-any-aspect-ratio-b427c0f897fb
                            return new Response('<svg role="img" aria-labelledby="offline-title" viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><title id="offline-title">Offline</title><path fill="rgba(145,145,145,0.5)" d="M0 0h400v225H0z" /><text fill="rgba(0,0,0,0.33)" font-family="Helvetica Neue,Arial,sans-serif" font-size="27" text-anchor="middle" x="200" y="113" dominant-baseline="central">offline</text></svg>', { headers: { 'Content-Type': 'image/svg+xml' } });
                        } else {
                            return response;
                        }
                    })
                })
            }
        })
    );
});