"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Chercher sans empiler l'historique : chaque recherche remplace la précédente,
// pour qu'un seul « retour » ramène à la page d'où l'on vient.
export function FormulaireRecherche({ q, cliente, libelle }: { q: string; cliente: string; libelle: string }) {
  const router = useRouter();
  const [valeur, setValeur] = useState(q);
  return (
    <form
      action="/coach/chercher"
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (cliente) params.set("cliente", cliente);
        if (valeur.trim()) params.set("q", valeur.trim());
        router.replace(`/coach/chercher?${params.toString()}`);
      }}
    >
      <label className="flex flex-col gap-1.5 text-[14px] text-violet">
        {libelle}
        <input name="q" type="search" value={valeur} onChange={(e) => setValeur(e.target.value)} autoFocus placeholder="sa mère, dommage, Attali…" className="champ-zone min-h-[48px]" />
      </label>
      <button type="submit" className="bouton-rouge self-start">
        Chercher
      </button>
    </form>
  );
}
