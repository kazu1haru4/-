// Friend Chat PWA Service Worker
// 更新を反映しやすくするため、バージョンを上げる
const CACHE_NAME = "friend-chat-pwa-v2";

const APP_SHELL = [
  "./",
  "./home.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// インストール時：新しいSWを待機させず、すぐに有効化
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(APP_SHELL);
      })
  );

  self.skipWaiting();
});

// 有効化時：古いキャッシュを削除
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) {
            return key !== CACHE_NAME;
          })
          .map(function(key) {
            return caches.delete(key);
          })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 通信時：まずネットから最新版を取得。
// ネットが使えない場合だけキャッシュを使用。
self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, copy);
          });
        }

        return response;
      })
      .catch(function() {
        return caches.match(event.request);
      })
  );
});
