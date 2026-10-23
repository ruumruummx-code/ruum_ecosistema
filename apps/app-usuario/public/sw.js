/**
 * Service Worker PWA — Ruum Ruum Usuario
 * Estrategia:
 * - Exclusión estricta de seguridad: jamás cachear /api/*, /auth/*, Supabase, Stripe ni Didit.
 * - Navegación HTML: Network-First con fallback offline amigable.
 * - Assets estáticos de interfaz (/theme-init.js, iconos, fuentes): Stale-While-Revalidate.
 */
const CACHE_NAME = "ruum-usuario-pwa-v1";
const STATIC_PRECACHE = ["/theme-init.js"];

const DOMINIOS_NO_CACHEABLES = [
  "supabase.co",
  "supabase.in",
  "stripe.com",
  "stripe.network",
  "didit.me",
  "mapbox.com",
  "sentry.io",
];

function esPeticionNoCacheable(url, method) {
  if (method !== "GET") return true;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return true;
  }
  return DOMINIOS_NO_CACHEABLES.some((d) => url.hostname.endsWith(d));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (esPeticionNoCacheable(url, req.method)) {
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(
        () =>
          new Response(
            '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/><title>Ruum Ruum — Sin conexión</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#070b14;color:#f6f8fb;font-family:system-ui,sans-serif;text-align:center;padding:24px"><div><h1 style="font-size:18px;margin-bottom:8px">Sin conexión a internet</h1><p style="color:#94a3b8;font-size:14px;max-width:280px">Verifica tu conexión e inténtalo nuevamente.</p></div></body></html>',
            {
              status: 503,
              headers: { "Content-Type": "text/html; charset=utf-8" },
            }
          )
      )
    );
    return;
  }

  if (url.origin === self.location.origin && STATIC_PRECACHE.includes(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        const networkPromise = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              cache.put(req, res.clone());
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkPromise;
      })
    );
  }
});
