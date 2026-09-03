import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyB7F-1n4Gdiu6vgFM9Qmt6gtENSXWLRlzE",
  authDomain: "bumdesmart-nukita.firebaseapp.com",
  projectId: "bumdesmart-nukita",
  storageBucket: "bumdesmart-nukita.firebasestorage.app",
  messagingSenderId: "36256820864",
  appId: "1:36256820864:web:ba903ed26d39c1d5fec065",
};

const VAPID_KEY = "BMlMkCLf2GRn88h9KWYyhCnnfm1EZn-4DnjLQKqvqnk92CZGIXGbLj8_fqrRqgwVb-8J4n3F84BsES4-YB7sjLc";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export async function requestNotificationPermission(
  onTokenReceived: (token: string) => void
): Promise<void> {
  try {
    const supported = await isSupported();
    if (!supported) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register("/firebase-messaging-sw.js"),
    });

    if (token) onTokenReceived(token);
  } catch (e) {
    console.warn("FCM init error:", e);
  }
}

export async function onForegroundMessage(
  handler: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void
): Promise<(() => void) | undefined> {
  try {
    const supported = await isSupported();
    if (!supported) return;
    const messaging = getMessaging(app);
    return onMessage(messaging, handler);
  } catch {
    return undefined;
  }
}
