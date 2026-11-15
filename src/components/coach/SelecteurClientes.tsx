"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ChoixCliente } from "@/lib/db/coach";

const jour = (d: string) => new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: "Europe/Paris" }).format(new Date(d));

function Etat({ c }: { c: ChoixCliente }) {
  if (c.pause) return <span className="text-[14px] text-violet">en pause</span>;
  if (c.retards) return <span className="text-[14px] font-medium text-rouge">{c.retards > 1 ? `${c.retards} retards` : "1 retard"}</span>;
  if (c.prochaine) return <span className="text-[14px] text-violet">séance {c.prochaine.numero} {jour(c.prochaine.date)}</span>;
  return <span className="text-[14px] text-violet/75">pas de séance prévue</span>;
}

// « Clientes ▾ » ou « Déborah ▾ » : passer d'une cliente à l'autre depuis n'importe quelle page.
export function SelecteurClientes({ libelle, choix, estCoach }: { libelle: string; choix: ChoixCliente[]; estCoach: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: MouseEvent) => {
      if (!zone.current?.contains(e.target as Node)) setOuvert(false);
    };
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    document.addEventListener("mousedown", dehors);
    window.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("mousedown", dehors);
      window.removeEventListener("keydown", touche);
    };
  }, [ouvert]);

  return (
    <div ref={zone} className="relative">
      <button
        type="button"
        aria-expanded={ouvert}
        aria-haspopup="true"
        onClick={() => setOuvert(!ouvert)}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-creme/40 px-3.5 pb-1.5 pt-2 font-titre text-[14px] font-semibold text-creme"
      >
        {libelle} <span aria-hidden>▾</span>
      </button>
      {ouvert ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(340px,calc(100vw-44px))] rounded-[10px] border border-violet/20 bg-papier px-4 py-2 text-encre shadow-[0_10px_30px_rgba(61,10,52,.18)] md:left-0 md:right-auto">
          <nav aria-label="Clientes">
            {choix.map((c, i) => (
              <Link
                key={c.id}
                href={`/coach/clientes/${c.id}`}
                onClick={() => setOuvert(false)}
                className={`flex min-h-[56px] items-center gap-3 py-3 ${i ? "border-t border-[var(--filet-papier)]" : ""} ${c.pause ? "opacity-60" : ""}`}
              >
                <span className="font-titre text-[18px] font-semibold leading-[1.1]">{c.prenom}</span>
                <Etat c={c} />
                {c.aEcrit ? (
                  <span className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-rose px-2.5 pb-1 pt-[5px] font-titre text-[12px] font-semibold leading-none text-violet-nuit">
                    <span aria-hidden className="size-1.5 rounded-full bg-rouge" />a écrit
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
          <div className="mt-1 flex flex-wrap items-center gap-x-5 border-t border-[var(--filet-papier-fort)] pt-1">
            <Link href="/coach/clientes" onClick={() => setOuvert(false)} className="t-action inline-flex min-h-[44px] items-center text-[14px] text-violet">
              Toutes les clientes
            </Link>
            <Link href="/coach/ressources" onClick={() => setOuvert(false)} className="t-action inline-flex min-h-[44px] items-center text-[14px] text-violet md:hidden">
              Bibliothèque
            </Link>
            {estCoach ? null : (
              <Link href="/emilien" onClick={() => setOuvert(false)} className="t-action inline-flex min-h-[44px] items-center text-[14px] text-violet md:hidden">
                À lire
              </Link>
            )}
            <form action="/auth/deconnexion" method="post" className="contents md:hidden">
              <button type="submit" className="inline-flex min-h-[44px] items-center text-[14px] text-violet/80">
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
