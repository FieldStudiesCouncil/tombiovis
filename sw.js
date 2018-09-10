//See comments at the end of description of caching strategy

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
    tombiopath + 'resources/chevron-down.png',
    tombiopath + 'resources/chevron-up.png',
    tombiopath + 'resources/data-driven-documents.png',
    tombiopath + 'resources/enlarge.png',
    tombiopath + 'resources/forward.png',
    tombiopath + 'resources/fsc-logo.jpg',
    tombiopath + 'resources/github-logo.png',
    tombiopath + 'resources/icon-128x128.png',
    tombiopath + 'resources/icon-144x144.png',
    tombiopath + 'resources/icon-152x152.png',
    tombiopath + 'resources/icon-192x192.png',
    tombiopath + 'resources/icon-256x256.png',
    tombiopath + 'resources/info20.png',
    tombiopath + 'resources/kb.png',
    tombiopath + 'resources/lightbulb.png',
    tombiopath + 'resources/minus.png',
    tombiopath + 'resources/nbn-logo-centred.png',
    tombiopath + 'resources/nbn-logo-colour-centred.png',
    tombiopath + 'resources/no-wifi.png',
    tombiopath + 'resources/options.png',
    tombiopath + 'resources/plus.png',
    tombiopath + 'resources/remove.png',
    tombiopath + 'resources/reset.png',
    tombiopath + 'resources/tombio.png',
    tombiopath + 'resources/wrench.png',
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
    console.log('[ServiceWorker] Installing');
    e.waitUntil(
        Promise.all([
            //caches.open(kbCacheName).then(function (cache) {
            //    console.log('[ServiceWorker] Caching knowledge-base');
            //    return cache.addAll(kbCacheFiles);
            //}),
            caches.open(shellCacheName).then(function (cache) {
                console.log('[ServiceWorker] Caching shell files');
                return cache.addAll([...shellCacheFiles, ...galleriaCacheFiles]);
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

    console.log("Request", e.request.url)

    //Identify the main page of the app since we will use a different caching strategy
    //for it (server first). Identifying it isn't straightforward since there's no requirement to
    //give it a certain name or for it to be in root folder of domain. So instead
    //we look for any html file that is not in either the tombiopath or tombiokbpath.
    var mainPage = false;
    if (e.request.url.endsWith('html')) {
        //console.log(e.request)
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
                //if (e.request.url.endsWith('csv')) console.log('[Service Worker] Fetched from cache', e.request.url);
                console.log("In cache", e.request.url)
                return response;
            } else {
                //console.log("SW fetching", e.request.url)
                console.log("Not in cache", e.request.url)

                var url = new URL(e.request.url);
                var t = url.searchParams.get('t');
                if (t == "kbcsv" || mainPage) { //Main page is cached in KB cache so when KB developer refreshes KB, it is updated too.
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
                        console.log("FAILED TO FIND RESOURCE", e.request.url)
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
                            console.log("context", e.request.context)
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