/**
 * Service Worker para Ruum Conductor - PWA
 * Estrategias de caché y soporte offline robusto para el conductor.
 *
 * - Caching de recursos estáticos (Cache-first, añade individualmente para no fallar todo si uno falla)
 * - Estrategia de API (Stale-while-revalidate con fallback a caché en offline)
 * - Fallback offline para navegación (devuelve la shell de la app)
 * - No depende de patrones con comodines (*) que no son URLs válidas
 */

const CACHE_NAME = "ruum-conductor-v2";
const ASSETS_CACHE_NAME = "ruum-conductor-assets-v2";
const OFFLINE_URL = "/";

// Recursos estáticos críticos (URLs reales, sin comodines)
const STATIC_RESOURCES = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/sw.js",
  "/theme-init.js",
  "/auth-callback-fallback.js",
  "/imagenes/ruum-logo-avatar.png",
  "/imagenes/ruum-logo.svg",
  "/imagenes/ruum-logo-dark.svg",
  "/imagenes/ruum-logo-simbolo.png",
  "/imagenes/onboarding-paso1.webp",
  "/imagenes/onboarding-paso2.webp",
  "/imagenes/onboarding-paso3.webp",
  "/imagenes/registro-conductor.png"
];

// Rutas de API que se pueden servir desde caché en offline
const API_ROUTES = ["/api/health", "/api/csp-report"];

function esRutaAPI(url) {
  return API_ROUTES.some((route) => url.pathname.startsWith(route));
}

function esRecursoEstatico(url) {
  if (STATIC_RESOURCES.includes(url.pathname)) return true;
  // Recursos de Next.js (_next) y assets estáticos
  return (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/imagenes/") ||
    url.pathname.startsWith("/data/")
  );
}

function esNavegacionHTML(url) {
  return (
    url.pathname === "/" ||
    url.pathname.startsWith("/viajes") ||
    url.pathname.startsWith("/panel") ||
    url.pathname.startsWith("/cuenta") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/registro") ||
    url.pathname.startsWith("/onboarding") ||
    url.pathname.startsWith("/documentos") ||
    url.pathname.startsWith("/ganancias") ||
    url.pathname.startsWith("/legal") ||
    url.pathname.startsWith("/notificaciones") ||
    url.pathname.startsWith("/actualizacion-requerida") ||
    url.pathname.startsWith("/recuperar-password") ||
    url.pathname.startsWith("/nueva-password") ||
    url.pathname.startsWith("/auth")
  );
}

// Instalación: Cachear recursos estáticos uno por uno (no falla todo si uno falla)
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  self.skipWaiting();

  event.waitUntil(
    caches.open(ASSETS_CACHE_NAME).then((cache) => {
      const promesas = STATIC_RESOURCES.map((ruta) =>
        cache.add(ruta).catch((err) => {
          console.warn(`[SW] No se pudo cachear ${ruta}:`, err);
        })
      );
      return Promise.all(promesas);
    })
  );
});

// Activación: Limpiar caches viejos y tomar control
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== ASSETS_CACHE_NAME) {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Estrategias de caching
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignorar solicitudes a otros dominios (no cachear recursos externos)
  if (
    !url.origin.includes("ruum") &&
    !url.origin.includes("localhost") &&
    !url.origin.includes("127.0.0.1")
  ) {
    return;
  }

  // Ignorar peticiones no-GET
  if (request.method !== "GET") {
    return;
  }

  // --- API routes: Stale-while-revalidate con fallback offline ---
  if (esRutaAPI(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Sin red: devolver caché si existe, si no, respuesta vacía
            return cachedResponse;
          });

        if (cachedResponse) {
          // Devolver caché inmediato y actualizar en segundo plano
          event.waitUntil(fetchPromise);
          return cachedResponse;
        }

        // Sin caché: intentar red, si falla devolver respuesta vacía
        return fetchPromise.then((response) => response || new Response(JSON.stringify({ ok: false, offline: true }), { status: 503, headers: { "Content-Type": "application/json" } }));
      })
    );
    return;
  }

  // --- Recursos estáticos: Cache-first ---
  if (esRecursoEstatico(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(ASSETS_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }, () => cachedResponse);
      })
    );
    return;
  }

  // --- Navegación HTML: Network-first con fallback a shell offline ---
  if (esNavegacionHTML(url) && request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(OFFLINE_URL).then((cachedShell) => {
            if (cachedShell) return cachedShell;
            return new Response(
              '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Ruum Conductor</title></head><body>Sin conexión. Abre la app con señal para cargar tu viaje.</body></html>',
              { headers: { "Content-Type": "text/html" } }
            );
          });
        })
    );
    return;
  }
});

// Mensajes del cliente (para actualizaciones y control)
self.addEventListener("message", (event) => {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
  if (event.data.action === "updateCache") {
    event.waitUntil(
      caches.open(ASSETS_CACHE_NAME).then((cache) => {
        const promesas = STATIC_RESOURCES.map((ruta) =>
          cache.add(ruta).catch((err) => {
            console.warn(`[SW] No se pudo actualizar ${ruta}:`, err);
          })
        );
        return Promise.all(promesas);
      })
    );
  }
});

// Eventos de conexión
self.addEventListener("online", () => {
  console.log("[SW] Online");
});

console.log("[SW] Ruum Conductor Service Worker loaded");
