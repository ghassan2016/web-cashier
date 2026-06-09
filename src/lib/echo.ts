"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

/* eslint-disable @typescript-eslint/no-explicit-any */

let echo: Echo<"reverb"> | null = null;

/** Lazily create a single Echo (Reverb/WebSocket) client on the browser. */
export function getEcho(): Echo<"reverb"> | null {
  if (typeof window === "undefined") return null;
  if (echo) return echo;

  (window as any).Pusher = Pusher;
  echo = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_KEY ?? "6o6uduoolylwdgxtox1o",
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? "api.medcoai.online",
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 443),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 443),
    forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "https") === "https",
    enabledTransports: ["ws", "wss"],
  });
  return echo;
}

/**
 * Subscribe to a public channel event. Returns an unsubscribe function.
 * Safe to call when the socket is unavailable (returns a no-op).
 */
export function subscribe(channel: string, event: string, cb: (data: unknown) => void): () => void {
  const e = getEcho();
  if (!e) return () => {};
  try {
    const ch = e.channel(channel);
    ch.listen(`.${event}`, cb);
    return () => {
      try {
        e.leave(channel);
      } catch {
        /* ignore */
      }
    };
  } catch {
    return () => {};
  }
}
