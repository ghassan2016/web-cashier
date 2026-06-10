"use client";

import { useSyncExternalStore } from "react";

/**
 * Web-wide currency symbol.
 *
 * Source of truth is the "currency" setting from `/settings`. The dashboard
 * layout loads it once and calls `setCurrency`. The value is also cached in
 * localStorage so it is available synchronously on the next page load (before
 * the settings request resolves). Falls back to "ر.س" when unset.
 */

const KEY = "cahier_currency";
const DEFAULT = "ر.س";

let symbol: string = DEFAULT;

// Seed synchronously from the previous session so the correct symbol is shown
// on first render without waiting for the /settings request.
if (typeof window !== "undefined") {
  const saved = window.localStorage.getItem(KEY);
  if (saved) symbol = saved;
}

const listeners = new Set<() => void>();

/** Current currency symbol (non-reactive read). */
export function getCurrency(): string {
  return symbol;
}

/** Update the web-wide currency symbol. Empty/blank resets to the default. */
export function setCurrency(next: string | null | undefined): void {
  const v = (next ?? "").trim() || DEFAULT;
  if (v === symbol) return;
  symbol = v;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, v);
  listeners.forEach((l) => l());
}

/** Format an amount with the current currency symbol, e.g. `22.00 ر.س`. */
export function money(n: number | null | undefined, digits = 2): string {
  return `${Number(n ?? 0).toFixed(digits)} ${symbol}`;
}

/** Reactive hook: re-renders the component when the currency changes. */
export function useCurrency(): string {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => symbol,
    () => DEFAULT,
  );
}
