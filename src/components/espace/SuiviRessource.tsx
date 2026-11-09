"use client";

import { useOptimistic, useTransition } from "react";
import { changerSuiviRessource } from "@/lib/actions/cliente";

const ETATS = [
  ["a_voir", "à découvrir"],
  ["commence", "commencé"],
  ["termine", "terminé"],
] as const;

type Statut = (typeof ETATS)[number][0];

export function SuiviRessource({ affectationId, statut }: { affectationId: string; statut: Statut }) {
  const [valeur, changer] = useOptimistic<Statut>(statut);
  const [, demarrer] = useTransition();
  return (
    <div className="suivi mt-2 self-start">
      {ETATS.map(([code, libelle]) => (
        <button
          key={code}
          type="button"
          aria-pressed={valeur === code}
          onClick={() =>
            demarrer(async () => {
              changer(code);
              await changerSuiviRessource(affectationId, code);
            })
          }
        >
          {libelle}
        </button>
      ))}
    </div>
  );
}
