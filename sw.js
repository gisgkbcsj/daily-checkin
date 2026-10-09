/* 每日打卡 · 离线缓存（Service Worker）
   作用：装成 App 之后，断网也能打开。
   注意：Service Worker 只在 https 或 localhost 下生效；
   用 file:// 直接打开页面时浏览器会自动忽略注册，属于正常现象。 */

var CACHE = 'checkin-v3';
var ASSETS = [
  './',
  './index.html',
  './app.html',
  './下一步.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
  './icon-maskable.svg'
];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      /* 逐个添加，避免某个文件缺失导致整体失败 */
      return Promise.all(ASSETS.map(function(u){
        return c.add(u).catch(function(){ return null; });
      }));
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit) return hit;
      return fetch(e.request).then(function(res){
        /* 同源资源顺手放进缓存 */
        try{
          if(res && res.status === 200 && res.type === 'basic'){
            var copy = res.clone();
            caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
          }
        }catch(err){}
        return res;
      }).catch(function(){
        /* 离线且未缓存：导航请求回退到入口页 */
        if(e.request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
