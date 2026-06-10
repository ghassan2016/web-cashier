"use client";

import { useSyncExternalStore } from "react";

/**
 * Web-wide company (establishment) name.
 *
 * Source of truth is the "company_name" setting, exposed via `/company-profile`.
 * The dashboard layout loads it once and calls `setCompanyName`. The value is
 * cached in localStorage so it is available synchronously on the next page load.
 * Falls back to "كاهييه" when unset.
 */

const KEY = "cahier_company_name";
const DEFAULT = "كاهييه";

let companyName: string = DEFAULT;

if (typeof window !== "undefined") {
  const saved = window.localStorage.getItem(KEY);
  if (saved) companyName = saved;
}

const listeners = new Set<() => void>();

/** Current company name (non-reactive read). */
export function getCompanyName(): string {
  return companyName;
}

/** Update the web-wide company name. Empty/blank resets to the default. */
export function setCompanyName(next: string | null | undefined): void {
  const v = (next ?? "").trim() || DEFAULT;
  if (v === companyName) return;
  companyName = v;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, v);
  listeners.forEach((l) => l());
}

/** Reactive hook: re-renders the component when the company name changes. */
export function useCompanyName(): string {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => companyName,
    () => DEFAULT,
  );
}
