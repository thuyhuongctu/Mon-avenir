// Service worker tối thiểu: Chrome Android chỉ hiện thông báo qua
// ServiceWorkerRegistration.showNotification(). Không cache gì.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const client = list.find((c) => "focus" in c);
      if (client) return client.focus();
      return self.clients.openWindow(self.registration.scope);
    }),
  );
});
