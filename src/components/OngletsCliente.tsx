"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { IconeAccueil, IconeChemin, IconeExercices, IconeJournal, IconePlus, IconeRessources, IconeSeances } from "./Icones";

const ONGLETS: { href: string; label: string; icone: (p: { className?: string }) => ReactNode }[] = [
  { href: "/espace", label: "Aujourd’hui", icone: IconeAccueil },
  { href: "/espace/chemin", label: "Chemin", icone: IconeChemin },
  { href: "/espace/exercices", label: "Exercices", icone: IconeExercices },
  { href: "/espace/journal", label: "Journal", icone: IconeJournal },
];

const PLUS = [
  { href: "/espace/seances", label: "Mes séances", icone: IconeSeances },
  { href: "/espace/ressources", label: "Ressources", icone: IconeRessources },
  { href: "/espace/a-propos", label: "À propos de l’accompagnement", icone: null },
];

function actif(pathname: string, href: string) {
  return href === "/espace" ? pathname === "/espace" : pathname.startsWith(href);
}

// Navigation de l'espace cliente : barre d'onglets en bas sur mobile, ligne de liens en haut sur grand écran.
export function OngletsCliente({ prenom }: { prenom: string }) {
  const pathname = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const plusActif = PLUS.some((p) => actif(pathname, p.href));

  return (
    <>
      {/* Grand écran */}
      <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation">
        {[...ONGLETS, ...PLUS.slice(0, 2)].map((o) => {
          const on = actif(pathname, o.href);
          return (
            <Link
              key={o.href}
              href={o.href}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                on ? "bg-creme text-violet" : "text-creme/80 hover:bg-white/10 hover:text-creme"
              }`}
            >
              {o.label}
            </Link>
          );
        })}
        <Link href="/espace/a-propos" className="rounded-full px-3.5 py-1.5 text-sm text-creme/60 hover:text-creme">
          À propos
        </Link>
        <form action="/auth/deconnexion" method="post" className="ml-3 flex items-center gap-3 border-l border-white/15 pl-4">
          <span className="text-sm text-creme/70">{prenom}</span>
          <button type="submit" className="text-sm text-creme/60 hover:text-rose">
            Quitter
          </button>
        </form>
      </nav>

      {/* Mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-violet-profond/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Navigation"
      >
        <ul className="grid grid-cols-5">
          {ONGLETS.map((o) => {
            const on = actif(pathname, o.href);
            return (
              <li key={o.href}>
                <Link
                  href={o.href}
                  onClick={() => setOuvert(false)}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium transition ${on ? "text-creme" : "text-creme/55"}`}
                  aria-current={on ? "page" : undefined}
                >
                  <o.icone className={`h-6 w-6 ${on ? "text-rose" : ""}`} />
                  {o.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setOuvert((v) => !v)}
              className={`flex w-full flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium ${plusActif || ouvert ? "text-creme" : "text-creme/55"}`}
              aria-expanded={ouvert}
            >
              <IconePlus className={`h-6 w-6 ${plusActif || ouvert ? "text-rose" : ""}`} />
              Plus
            </button>
          </li>
        </ul>
        {ouvert ? (
          <div className="border-t border-white/10 px-4 py-3">
            <ul className="flex flex-col">
              {PLUS.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} onClick={() => setOuvert(false)} className="flex items-center gap-3 py-3 text-base text-creme">
                    {p.icone ? <p.icone className="h-5 w-5 text-rose" /> : <span className="h-5 w-5" />}
                    {p.label}
                  </Link>
                </li>
              ))}
              <li>
                <form action="/auth/deconnexion" method="post">
                  <button type="submit" className="flex w-full items-center gap-3 py-3 text-base text-creme/60">
                    <span className="h-5 w-5" />
                    Quitter mon espace
                  </button>
                </form>
              </li>
            </ul>
          </div>
        ) : null}
      </nav>
    </>
  );
}
