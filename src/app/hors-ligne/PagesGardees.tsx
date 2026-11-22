"use client";

import { useEffect, useState } from "react";

const NOMS: [RegExp, string][] = [
  [/^\/espace\/?$/, "Mon espace"],
  [/^\/espace\/carnet\/?$/, "Mon carnet"],
  [/^\/espace\/pratiques\//, "Mes pratiques"],
];

// Les pages gardées sur ce téléphone, lisibles sans réseau.
export function PagesGardees() {
  const [pages, setPages] = useState<{ href: string; nom: string; titre: string }[]>([]);
  useEffect(() => {
    (async () => {
      if (!("caches" in window)) return;
      const liste: { href: string; nom: string; titre: string }[] = [];
      for (const cle of await caches.keys()) {
        if (!cle.startsWith("pages-")) continue;
        const cache = await caches.open(cle);
        for (const r of await cache.keys()) {
          const chemin = new URL(r.url).pathname;
          const nom = NOMS.find(([re]) => re.test(chemin))?.[1];
          if (!nom) continue;
          const html = await (await cache.match(r))?.text();
          const titre = html?.match(/<title>([^<]*)<\/title>/)?.[1]?.split(" · ")[0] ?? nom;
          liste.push({ href: chemin, nom, titre });
        }
      }
      setPages(liste);
    })().catch(() => {});
  }, []);
  if (!pages.length) return null;
  return (
    <nav aria-label="Pages gardées sur ce téléphone" className="flex flex-col border-t border-[var(--filet-violet)]">
      {pages.map((p) => (
        <a key={p.href} href={p.href} className="flex min-h-[52px] items-center justify-between gap-3 border-b border-[var(--filet-violet)] font-titre text-[18px] font-semibold">
          <span>{p.nom === "Mes pratiques" ? p.titre : p.nom}</span>
          <span aria-hidden>→</span>
        </a>
      ))}
    </nav>
  );
}
