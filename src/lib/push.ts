/**
 * Web push (FCM) for the back office. Requests permission, registers the
 * service worker, fetches a token and registers it with the API. A no-op when
 * the browser is unsupported or the VAPID key isn't configured.
 *
 * Firebase config below is client-public (auto-provisioned for cashier-e8d18).
 * The VAPID public key comes from NEXT_PUBLIC_FCM_VAPID_KEY.
 */
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { api } from "./api";

const firebaseConfig = {
  apiKey: "AIzaSyDHGeWbQdfKcRzOB8pp7U0B6TQUBE3tuGc",
  authDomain: "cashier-e8d18.firebaseapp.com",
  projectId: "cashier-e8d18",
  storageBucket: "cashier-e8d18.firebasestorage.app",
  messagingSenderId: "989015043873",
  appId: "1:989015043873:web:4c1c46963077a638081860",
};

let started = false;

export async function initWebPush(): Promise<void> {
  if (typeof window === "undefined" || started) return;
  started = true;

  const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
  if (!vapidKey) {
    console.info("[push] NEXT_PUBLIC_FCM_VAPID_KEY not set — web push disabled");
    return;
  }
  if (!(await isSupported().catch(() => false))) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swReg,
    });
    if (token) {
      await api("/device-tokens", { method: "POST", body: { token, platform: "web" } });
    }

    // Foreground messages don't auto-display — show them ourselves.
    onMessage(messaging, (payload) => {
      const n = payload.notification;
      if (n && Notification.permission === "granted") {
        new Notification(n.title || "إشعار جديد", {
          body: n.body || "",
          icon: "/icon.svg",
          dir: "rtl",
        });
      }
    });
  } catch (e) {
    console.warn("[push] init failed", e);
  }
}
