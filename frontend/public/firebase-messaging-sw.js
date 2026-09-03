importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB7F-1n4Gdiu6vgFM9Qmt6gtENSXWLRlzE",
  authDomain: "bumdesmart-nukita.firebaseapp.com",
  projectId: "bumdesmart-nukita",
  storageBucket: "bumdesmart-nukita.firebasestorage.app",
  messagingSenderId: "36256820864",
  appId: "1:36256820864:web:ba903ed26d39c1d5fec065",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  self.registration.showNotification(title ?? 'BumDesMartNukita', {
    body: body ?? '',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: payload.data ?? {},
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(clients.openWindow(url));
});
