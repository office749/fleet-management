"use client";
import { useEffect } from "react";

/** Registers the service worker that caches viewed documents for offline use. */
export function ServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline caching is best-effort */
    });
  }, []);
  return null;
}
