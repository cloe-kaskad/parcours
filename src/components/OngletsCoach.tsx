"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { IconeExercices, IconeJournal, IconeRessources, IconeSeances } from "./Icones";

const LIENS: { href: string; label: string; icone: (p: { className?: string }) => ReactNode }[] = [
  { href: "/coach", label: "À faire", icone: IconeExercices },
  { href: "/coach/clientes", label: "Clientes", icone: IconeSeances },
  { href: "/coach/ressources", label: "Bibliothèque", icone: IconeRessources },
];

function actif(pathname: string, href: string) {
  return href === "/coach" ? pathname === "/coach" : pathname.startsWith(href);
}

// Navigation de l'espace Cloé : même logique que l'espace cliente, onglets en bas sur téléphone.
export function OngletsCoach({ prenom }: { prenom: string }) {
  const pathname = usePathname();
  return (
    <>
      <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation">
        {LIENS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              actif(pathname, l.href) ? "bg-creme text-violet" : "text-creme/85 hover:bg-white/10 hover:text-creme"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <form action="/auth/deconnexion" method="post" className="ml-3 flex items-center gap-3 border-l border-white/15 pl-4">
          <span className="text-sm text-creme/70">{prenom}</span>
          <button type="submit" className="text-sm text-creme/60 hover:text-rose">
            Quitter
          </button>
        </form>
      </nav>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-violet-profond/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Navigation"
      >
        <ul className="grid grid-cols-4">
          {LIENS.map((l) => {
            const on = actif(pathname, l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium transition ${on ? "text-creme" : "text-creme/55"}`}
                  aria-current={on ? "page" : undefined}
                >
                  <l.icone className={`h-6 w-6 ${on ? "text-rose" : ""}`} />
                  {l.label}
                </Link>
              </li>
            );
          })}
          <li>
            <form action="/auth/deconnexion" method="post">
              <button type="submit" className="flex w-full flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium text-creme/55">
                <IconeJournal className="h-6 w-6" />
                Quitter
              </button>
            </form>
          </li>
        </ul>
      </nav>
    </>
  );
}
