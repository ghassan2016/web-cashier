"use client";

import { useEffect } from "react";

/** Registers the storefront service worker so /order works as an installable PWA. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration is best-effort */
      });
    }
  }, []);
  return null;
}
