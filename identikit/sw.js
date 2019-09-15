//See comments at the end of description of caching strategy

var cacheno = 9;
var kbCacheName = "tombio-kb-cache-" + cacheno;
var kbImgStdCacheName = "tombio-kb-img-std-cache-" + cacheno;
var kbImgSmlCacheName = "tombio-kb-img-sml-cache-" + cacheno;
var kbImgLrgCacheName = "tombio-kb-img-lrg-cache-" + cacheno;
var kbTxtCacheName = "tombio-kb-txt-cache-" + cacheno;
var genCacheName = "tombio-gen-cache-" + cacheno;
var allCacheNames = [genCacheName, kbCacheName, kbImgStdCacheName, kbImgSmlCacheName, kbImgLrgCacheName, kbTxtCacheName]
var url = new URL(location);
var tombiokbpath = url.searchParams.get('tombiokbpath');
var tombiopath = url.searchParams.get('tombiopath');

var shellCacheFiles = [
    tombiopath + 'resources/camera.png',
    tombiopath + 'resources/chevron-down.png',
    tombiopath + 'resources/chevron-up.png',
    tombiopath + 'resources/data-driven-documents.png',
    tombiopath + 'resources/enlarge.png',
    tombiopath + 'resources/fsc-logo.jpg',
    tombiopath + 'resources/github-logo.png',
    tombiopath + 'resources/icon-128x128.png',
    tombiopath + 'resources/icon-144x144.png',
    tombiopath + 'resources/icon-152x152.png',
    tombiopath + 'resources/icon-192x192.png',
    tombiopath + 'resources/icon-256x256.png',
    tombiopath + 'resources/kb.png',
    tombiopath + 'resources/minus.png',
    tombiopath + 'resources/nbn-logo-centred.png',
    tombiopath + 'resources/nbn-logo-colour-centred.png',
    tombiopath + 'resources/no-wifi.png',
    tombiopath + 'resources/remove.png',
    tombiopath + 'resources/tombio.png',
    tombiopath + 'resources/kbTextUnavailable.html'
];

var galleriaPath = tombiopath + 'dependencies/galleria-1.5.7/galleria/themes/';
var galleriaCacheFiles = [
    galleriaPath + 'classic/classic-loader.gif',
    galleriaPath + 'classic/classic-map.png',
    galleriaPath + 'fullscreen/b.png',
    galleriaPath + 'fullscreen/down-neg.gif',
    galleriaPath + 'fullscreen/down.gif',
    galleriaPath + 'fullscreen/fix.gif',
    galleriaPath + 'fullscreen/i.png',
    galleriaPath + 'fullscreen/l-neg.png',
    galleriaPath + 'fullscreen/l.gif',
    galleriaPath + 'fullscreen/loader.gif',
    galleriaPath + 'fullscreen/n-neg.png',
    galleriaPath + 'fullscreen/n.gif',
    galleriaPath + 'fullscreen/p-neg.png',
    galleriaPath + 'fullscreen/p.gif',
    galleriaPath + 'fullscreen/r-neg.png',
    galleriaPath + 'fullscreen/r.gif',
    galleriaPath + 'fullscreen/up-neg.gif',
    galleriaPath + 'fullscreen/up.gif'
];

self.addEventListener('install', function (e) {
    log('[ServiceWorker] Installing');
    e.waitUntil(
        Promise.all([
            caches.open(genCacheName).then(function (cache) {
                log('[ServiceWorker] Caching shell files');
                return cache.addAll([...shellCacheFiles, ...galleriaCacheFiles]);
            })
        ])
    );
    log('[ServiceWorker] Installed');
});

self.addEventListener('activate', function (e) {
    log('[ServiceWorker] Activate');
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (allCacheNames.indexOf(key) == -1) {
                    log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    //self.clients.claim() causes the service worker to start servicing all resource
    //requests within it's scope even though, at this stage, the main page will no
    //have been serviced. (The default behaviour is only to service requests from pages
    //that have themselves been service through the service worker.) We implement this
    //behaviour because it makes it possible for the user to cache resources for tools
    //for use in the field without having to *first* refresh to get the main page
    //served through the service worker.
    return self.clients.claim();
});

self.addEventListener('fetch', function (e) {

    log("Request", e.request.url)

    //Identify the main page of the app since we will use a different caching strategy
    //for it (server first). Identifying it isn't straightforward since there's no requirement to
    //give it a certain name or for it to be in root folder of domain. So instead
    //we look for any html file that is not in either the tombiopath or tombiokbpath.
    var mainPage = false;
    if (e.request.url.endsWith('html')) {
        //log(e.request)
        var htmlPage = e.request.url.replace(/https?:\/\/[^\/]+\//i, "");
        if (!htmlPage.startsWith(tombiopath) && !htmlPage.startsWith(tombiokbpath)) {
            mainPage = true;
        }  
    }

    //On network response caching pattern
    //https://jakearchibald.com/2014/offline-cookbook
    e.respondWith(
        caches.match(e.request).then(function (response) {

            if (response) {
                //if (e.request.url.endsWith('csv')) log('[Service Worker] Fetched from cache', e.request.url);
                log("In cache", e.request.url)
                return response;
            } else {
                //log("SW fetching", e.request.url)
                log("Not in cache", e.request.url)

                var url = new URL(e.request.url);
                var t = url.searchParams.get('t');
                if (t == "kbcsv" || mainPage) { //Main page is cached in KB cache so when KB developer refreshes KB, it is updated too.
                    var cacheName = kbCacheName;
                } else if (t == "kbimgstd") {
                    var cacheName = kbImgStdCacheName;
                } else if (t == "kbimgsml") {
                    var cacheName = kbImgSmlCacheName;
                } else if (t == "kbimglrg") {
                    var cacheName = kbImgLrgCacheName;
                } else if (t == "kbtxt") {
                    var cacheName = kbTxtCacheName;
                } else {
                    var cacheName = genCacheName;
                }

                return caches.open(cacheName).then(function (cache) {
                    return fetch(e.request).then(function (response) {
                        log("SW caching", e.request.url, "in", cacheName)
                        //An error is generated from catch.put if request method is HEAD as used for KB resource checking
                        var p = cache.put(e.request, response.clone())
                            .then(log("SW cached", e.request.url, "in", cacheName))
                            .catch(log("SW error caught", e.request.url));  
                        return response;
                    }).catch(function (response) {
                        log("FAILED TO FIND RESOURCE", e.request.url)
                        if (t == "kbimgstd" || t == "kbimgsml" || t == "kbimglrg") {
                            //https://hackernoon.com/service-worker-one-fallback-offline-image-for-any-aspect-ratio-b427c0f897fb
                            return new Response('<svg role="img" aria-labelledby="offline-title" viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><title id="offline-title">Offline</title><path fill="rgba(200,200,200,0.8)" d="M0 0h400v225H0z" /><text fill="rgba(0,0,0,0.33)" font-family="Helvetica Neue,Arial,sans-serif" font-size="27" text-anchor="middle" x="200" y="113" dominant-baseline="central">working offline</text></svg>', { headers: { 'Content-Type': 'image/svg+xml' } });
                        } else if (t == "kbtxt") {
                            return caches.match(tombiopath + 'resources/kbTextUnavailable.html');
                            //Method below doesn't work very well because some things expect a very small image and don't resize the one we return.
                            //} else if (e.request.url.endsWith(".png") || e.request.url.endsWith(".gif") || e.request.url.endsWith(".jpg") || e.request.url.endsWith(".jpeg")) {
                            //    return caches.match(tombiopath + 'resources/no-wifi.png');
                        //} else if () {
                        //    //And
                        //}
                        } else {
                            log("context", e.request.context)
                            //Returning an empty response prevents Identikit from falling over when resouces such
                            //as javascript files for tools cannot be loaded. Tombiovis can then catch and return
                            //an appropriate message.
                            return new Response();
                        }
                    })
                })
            }
        })
    );
});


function log() {
    //console.log(...arguments);
}