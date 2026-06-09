/* Firebase Cloud Messaging service worker — handles background web push.
 * Config is client-public (auto-provisioned for project cashier-e8d18). */
importScripts("https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDHGeWbQdfKcRzOB8pp7U0B6TQUBE3tuGc",
  authDomain: "cashier-e8d18.firebaseapp.com",
  projectId: "cashier-e8d18",
  storageBucket: "cashier-e8d18.firebasestorage.app",
  messagingSenderId: "989015043873",
  appId: "1:989015043873:web:4c1c46963077a638081860",
});

const messaging = firebase.messaging();

// Show a notification for data-only/background messages.
messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  self.registration.showNotification(n.title || "إشعار جديد", {
    body: n.body || "",
    icon: "/icon.svg",
    dir: "rtl",
    lang: "ar",
    data: payload.data || {},
  });
});

// Focus/open the app when a notification is clicked.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/dashboard");
    })
  );
});
