/*
 * Llewellyn Fleet service worker.
 * Best-effort offline support so a driver can pull up their insurance card and
 * registration at a traffic stop even with a weak signal. Deliberately simple:
 * - App shell: network-first, fall back to cache.
 * - Viewed documents (/api/files/...): cache-first after first successful view.
 * We never cache admin/receipt endpoints.
 */
const SHELL_CACHE = "fleet-shell-v1";
const DOC_CACHE = "fleet-docs-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== DOC_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Documents: cache-first so they load offline once viewed.
  if (url.pathname.startsWith("/api/files/")) {
    event.respondWith(
      caches.open(DOC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // Never cache sensitive endpoints.
  if (
    url.pathname.startsWith("/api/receipts/") ||
    url.pathname.startsWith("/api/export/") ||
    url.pathname.startsWith("/api/auth/")
  ) {
    return;
  }

  // App shell: network-first with cache fallback for navigations.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request)),
    );
  }
});
