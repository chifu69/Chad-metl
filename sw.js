const CACHE='rp-ia-v9.2.0-operational-navigation-fix';
const ASSETS=['./','./index.html','./styles.css','./icon.svg','./manifest.webmanifest','./config.js','./local-adapter.js','./server-adapter.js','./data-service.js','./server-setup.js','./engine-core.js','./app.js','./enterprise-engines.js','./platform-v9.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});
