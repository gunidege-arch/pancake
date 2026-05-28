// Minimal service worker — caches the app shell for fast reloads
const CACHE = "pancake-v1";
const SHELL = ["/", "/index.html", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request)),
  );
});
