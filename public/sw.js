self.addEventListener("push", function (event) {
  var payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (_) {
      payload = {
        title: "Nova notificação",
        message: event.data.text()
      };
    }
  }

  var title = payload.title || "Nova notificação";
  var options = {
    body: payload.message || "Você recebeu uma atualização no sistema.",
    data: {
      link: payload.link || "/dashboard/notificacoes"
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var link =
    event.notification.data && event.notification.data.link
      ? event.notification.data.link
      : "/dashboard/notificacoes";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      function (clientList) {
        for (var i = 0; i < clientList.length; i += 1) {
          var client = clientList[i];
          if ("focus" in client) {
            client.navigate(link);
            return client.focus();
          }
        }

        return self.clients.openWindow(link);
      }
    )
  );
});
