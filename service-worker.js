// Friend Chat PWA Service Worker
// プッシュ通知対応版
const CACHE_NAME = "friend-chat-pwa-v3";

const APP_SHELL = [
  "./",
  "./home.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];


// =========================
// インストール
// =========================

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(APP_SHELL);
      })
  );

  self.skipWaiting();
});


// =========================
// 有効化
// =========================

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


// =========================
// プッシュ通知を受信
// =========================

self.addEventListener("push", function(event) {

  let data = {};

  try {

    if (event.data) {
      data = event.data.json();
    }

  } catch (error) {

    data = {
      title: "Friend Chat",
      body: event.data
        ? event.data.text()
        : "新しい通知があります。"
    };

  }


  const title =
    data.title || "Friend Chat";


  const options = {

    body:
      data.body ||
      "新しい通知があります。",

    icon:
      data.icon ||
      "./icon-192.png",

    badge:
      data.badge ||
      "./icon-192.png",

    data: {
      url:
        data.url ||
        "./notifications.html"
    },

    tag:
      data.tag ||
      "friend-chat-notification",

    renotify: true

  };


  event.waitUntil(

    self.registration.showNotification(
      title,
      options
    )

  );

});


// =========================
// 通知をタップ
// =========================

self.addEventListener(
  "notificationclick",
  function(event) {

    event.notification.close();


    const targetUrl =
      event.notification.data &&
      event.notification.data.url
        ? event.notification.data.url
        : "./notifications.html";


    event.waitUntil(

      self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      })

      .then(function(clientList) {

        for (const client of clientList) {

          if ("focus" in client) {

            try {

              const url =
                new URL(
                  targetUrl,
                  self.location.href
                ).href;

              if ("navigate" in client) {
                client.navigate(url);
              }

            } catch (error) {}

            return client.focus();

          }

        }


        if (self.clients.openWindow) {
          return self.clients.openWindow(
            targetUrl
          );
        }

      })

    );

  }
);


// =========================
// 通信
// =========================
// オンラインなら最新版を取得。
// オフラインならキャッシュを使用。

self.addEventListener(
  "fetch",
  function(event) {

    if (
      event.request.method !== "GET"
    ) {
      return;
    }


    event.respondWith(

      fetch(event.request)

        .then(function(response) {

          if (
            response &&
            response.ok
          ) {

            const copy =
              response.clone();

            caches.open(
              CACHE_NAME
            ).then(function(cache) {

              cache.put(
                event.request,
                copy
              );

            });

          }

          return response;

        })

        .catch(function() {

          return caches.match(
            event.request
          );

        })

    );

  }
);
