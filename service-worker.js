self.addEventListener("push", function(event) {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = {
      title: "フレンドチャット",
      body: event.data ? event.data.text() : "新しいメッセージが届きました"
    };
  }

  const title = data.title || "フレンドチャット";

  const options = {
    body: data.body || "新しいメッセージが届きました",
    icon: data.icon || "./icon.png",
    badge: data.badge || "./icon.png",
    data: {
      url: data.url || "./home.html"
    },
    tag: data.tag || "friend-chat"
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});


self.addEventListener("notificationclick", function(event) {

  event.notification.close();

  const url =
    event.notification.data?.url ||
    "./home.html";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(function(clientList) {

      for (const client of clientList) {

        if ("focus" in client) {

          client.navigate(url);

          return client.focus();

        }

      }

      if (clients.openWindow) {

        return clients.openWindow(url);

      }

    })
  );

});
