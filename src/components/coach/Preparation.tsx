"use client";

import { useRef, useState, useTransition } from "react";
import { enregistrerPreparation } from "@/lib/actions/seances";
import { Lisible } from "./Lisible";
import { TexteLecture } from "./TexteLecture";

// « Ma préparation » : se lit avec le composant de lecture ; « Modifier » ouvre l'édition,
// enregistrée toute seule. Vide, elle invite à coller la préparation faite avec Claude.
export function Preparation({ seanceId, initial }: { seanceId: string; initial: string }) {
  const [texte, setTexte] = useState(initial);
  const [edition, setEdition] = useState(!initial.trim());
  const [etat, setEtat] = useState("Enregistré automatiquement.");
  const [, demarrer] = useTransition();
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!edition) {
    return (
      <div className="flex flex-col gap-2">
        <Lisible titre="Ma préparation">
          <TexteLecture>{texte}</TexteLecture>
        </Lisible>
        <button type="button" onClick={() => setEdition(true)} className="outil min-h-[44px] self-start">
          Modifier
        </button>
      </div>
    );
  }

  return (
    <>
      <textarea
        aria-label="Ma préparation"
        value={texte}
        placeholder="Colle ici la préparation faite avec Claude (le Markdown est gardé : titres, gras, listes)."
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
        className="champ-zone min-h-[220px] text-[15px] leading-[1.6]"
      />
      <div className="flex items-center justify-between gap-3">
        <p role="status" className="m-0 text-[12px] text-violet/70">
          {etat}
        </p>
        {texte.trim() ? (
          <button type="button" onClick={() => setEdition(false)} className="outil min-h-[44px] shrink-0">
            Lire
          </button>
        ) : null}
      </div>
    </>
  );
}

// « Copier le dossier pour Claude » : tout le dossier de la séance dans le presse-papiers, en Markdown.
export function CopierDossier({ dossier }: { dossier: string }) {
  const [etat, setEtat] = useState<"" | "copie" | "echec">("");
  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        className="pilule pilule-rouge min-h-[44px]"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(dossier);
            setEtat("copie");
          } catch {
            setEtat("echec");
          }
        }}
      >
        Copier le dossier pour Claude
      </button>
      <p role="status" className="m-0 text-[12px] leading-[1.45] text-violet/80">
        {etat === "copie"
          ? "Copié. Colle-le dans ton projet B&I et demande ta préparation."
          : etat === "echec"
            ? "La copie n’a pas marché : réessaie, la page doit être au premier plan."
            : "Lettre et notes, carnet, météos, ressources, retour d’Émilien, transcript, chemin, préparation précédente."}
      </p>
    </div>
  );
}
