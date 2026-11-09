"use client";

import { useRef, useState, useTransition } from "react";
import { enregistrerPreparation } from "@/lib/actions/seances";

// « Ma préparation » : enregistré tout seul.
export function Preparation({ seanceId, initial }: { seanceId: string; initial: string }) {
  const [texte, setTexte] = useState(initial);
  const [etat, setEtat] = useState("Enregistré automatiquement.");
  const [, demarrer] = useTransition();
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <>
      <textarea
        aria-label="Ma préparation"
        value={texte}
        onChange={(e) => {
          const v = e.target.value;
          setTexte(v);
          setEtat("modifications en cours…");
          if (minuterie.current) clearTimeout(minuterie.current);
          minuterie.current = setTimeout(() => {
            demarrer(async () => {
              const r = await enregistrerPreparation(seanceId, v);
              setEtat(r.ok ? "Enregistré automatiquement." : r.message);
            });
          }, 1200);
        }}
        className="champ-zone min-h-[150px]"
      />
      <p role="status" className="text-[12px] text-violet/70">
        {etat}
      </p>
    </>
  );
}
