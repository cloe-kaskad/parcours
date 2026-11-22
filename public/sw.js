// Service worker de Blocages & Intuition (brief du 22 novembre, hors connexion version simple).
// Gardé pour relire sans réseau : l'accueil, le carnet, et les cinq dernières pratiques ouvertes.
// Jamais gardé : transcripts, audios, pages de séance, espace de Cloé et d'Émilien, API, connexion.
// Tout est vidé à la déconnexion (en-tête Clear-Site-Data et message « vider »).
const VERSION = "2";
const STATIQUE = `statique-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const HORS_LIGNE = "/hors-ligne";
const MAX_PRATIQUES = 5;

const GARDABLE = /^\/espace(\/carnet|\/pratiques\/[0-9a-f-]{36})?\/?$/;
const STATIQUE_RE = /^\/(_next\/static\/|pwa\/|marque\/|couvertures\/)/;

// À l'installation : la page « Pas de réseau » et tous ses fichiers, pour qu'elle s'affiche sans réseau.
self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(STATIQUE);
      const rep = await fetch(HORS_LIGNE, { cache: "reload" });
      const html = await rep.clone().text();
      await c.put(HORS_LIGNE, rep);
      const fichiers = [...new Set(html.match(/\/_next\/static\/[^"'\\ )]+/g) ?? [])];
      await Promise.all(fichiers.map((f) => c.add(f).catch(() => {})));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== STATIQUE && c !== PAGES).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "vider") e.waitUntil(caches.keys().then((cles) => Promise.all(cles.map((c) => caches.delete(c)))));
});

async function garderPage(requete, reponse) {
  const cache = await caches.open(PAGES);
  await cache.put(requete.url.split("?")[0], reponse);
  // Seulement les dernières pratiques ouvertes.
  const pratiques = (await cache.keys()).filter((r) => new URL(r.url).pathname.startsWith("/espace/pratiques/"));
  for (const r of pratiques.slice(0, Math.max(0, pratiques.length - MAX_PRATIQUES))) await cache.delete(r);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (STATIQUE_RE.test(url.pathname)) {
    e.respondWith(
      caches.open(STATIQUE).then(async (c) => {
        const trouve = await c.match(req);
        if (trouve) return trouve;
        const rep = await fetch(req);
        if (rep.ok) c.put(req, rep.clone());
        return rep;
      }),
    );
    return;
  }

  if (req.mode !== "navigate") return;
  const gardable = GARDABLE.test(url.pathname);
  e.respondWith(
    fetch(req)
      .then((rep) => {
        if (gardable && rep.ok && !rep.redirected && rep.type === "basic") e.waitUntil(garderPage(req, rep.clone()));
        return rep;
      })
      .catch(async () => {
        const page = gardable ? await caches.match(req.url.split("?")[0], { cacheName: PAGES }) : null;
        if (page) return page;
        // Une page non gardée : on part sur « Pas de réseau », à sa propre adresse.
        if (url.pathname !== HORS_LIGNE) return Response.redirect(HORS_LIGNE, 302);
        return (await caches.match(HORS_LIGNE)) || new Response("Pas de réseau pour l’instant.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }),
  );
});
