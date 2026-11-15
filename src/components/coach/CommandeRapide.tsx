"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChoixCliente } from "@/lib/db/coach";

const plier = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Sur ordinateur, ⌘K (ou Ctrl K) : taper « deb » ou « prépa », Entrée.
export function CommandeRapide({ choix, estCoach }: { choix: ChoixCliente[]; estCoach: boolean }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [q, setQ] = useState("");
  const [actif, setActif] = useState(0);
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOuvert((o) => !o);
      }
      if (e.key === "Escape") setOuvert(false);
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, []);

  useEffect(() => {
    if (ouvert) requestAnimationFrame(() => champ.current?.focus());
  }, [ouvert]);

  const options = useMemo(() => {
    const toutes: { libelle: string; href: string; cle: string }[] = [];
    for (const c of choix) {
      toutes.push({ libelle: `${c.prenom} · fiche`, href: `/coach/clientes/${c.id}`, cle: `${c.prenom} fiche` });
      if (estCoach && c.prochaine) toutes.push({ libelle: `${c.prenom} · préparer la séance ${c.prochaine.numero}`, href: `/coach/clientes/${c.id}/seances/${c.prochaine.id}/avant`, cle: `${c.prenom} preparer prepa seance` });
      if (estCoach) toutes.push({ libelle: `${c.prenom} · dater et nommer`, href: `/coach/clientes/${c.id}/dater`, cle: `${c.prenom} dater nommer` });
      toutes.push({ libelle: `${c.prenom} · chercher chez elle`, href: `/coach/chercher?cliente=${c.id}`, cle: `${c.prenom} chercher` });
    }
    toutes.push({ libelle: estCoach ? "Agenda" : "À lire", href: estCoach ? "/coach" : "/emilien", cle: "agenda accueil a lire" });
    toutes.push({ libelle: "Bibliothèque", href: "/coach/ressources", cle: "bibliotheque ressources" });
    const mots = plier(q).split(/\s+/).filter(Boolean);
    const trouvees = mots.length ? toutes.filter((o) => mots.every((m) => plier(o.cle + " " + o.libelle).includes(m))) : toutes.slice(0, 8);
    if (q.trim().length >= 2) trouvees.push({ libelle: `Chercher « ${q.trim()} » partout`, href: `/coach/chercher?q=${encodeURIComponent(q.trim())}`, cle: "" });
    return trouvees.slice(0, 9);
  }, [choix, estCoach, q]);

  const aller = (href: string) => {
    setOuvert(false);
    setQ("");
    router.push(href);
  };

  return (
    <>
      <button type="button" onClick={() => setOuvert(true)} className="inline-flex min-h-[44px] items-center text-[14px] text-creme/75">
        ⌘K pour chercher
      </button>
      {ouvert ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-violet-nuit/60 px-4 pt-[12vh]" onMouseDown={() => setOuvert(false)}>
          <div role="dialog" aria-label="Commande rapide" className="carte-blanche w-full max-w-[560px] overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
            <input
              ref={champ}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActif(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActif((a) => Math.min(a + 1, options.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActif((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter" && options[actif]) aller(options[actif].href);
              }}
              placeholder="deb, prépa, chercher…"
              aria-label="Commande"
              className="w-full border-b border-carte-filet px-5 py-4 text-[17px] text-encre outline-none"
            />
            <ul className="m-0 list-none p-1.5">
              {options.map((o, i) => (
                <li key={o.href + o.libelle}>
                  <button type="button" onMouseEnter={() => setActif(i)} onClick={() => aller(o.href)} className={`flex min-h-[44px] w-full items-center rounded-[6px] px-3.5 text-left text-[15px] ${i === actif ? "bg-beige text-encre" : "text-encre"}`}>
                    {o.libelle}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
