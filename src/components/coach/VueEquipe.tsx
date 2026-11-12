"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { proposerMots } from "@/lib/actions/seances";
import { enregistrerNoteEquipe } from "@/lib/actions/equipe";
import { texteStructure } from "@/lib/retour";
import { FormAction } from "./interactifs";
import { TexteLecture } from "./TexteLecture";

// La note de parcours : lue d'abord, modifiée sur place.
export function NoteParcours({ parcoursId, texte, signature }: { parcoursId: string; texte: string; signature: string | null }) {
  const [edition, setEdition] = useState(false);
  if (edition || !texte.trim()) {
    return (
      <div className="rounded-[6px] bg-beige px-4 py-3.5">
        <FormAction action={enregistrerNoteEquipe} bouton="Enregistrer">
          <input type="hidden" name="parcours_id" value={parcoursId} />
          <textarea name="note" aria-label="Note de parcours" defaultValue={texte} placeholder="Où elle en est, en quelques lignes, pour Cloé et Émilien." className="champ-zone min-h-[120px] bg-papier" />
          <span className="font-italique text-[12px] italic text-violet">jamais visible par elle</span>
        </FormAction>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-[6px] bg-beige px-4 py-3.5">
      <TexteLecture>{texteStructure(texte)}</TexteLecture>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-italique text-[12px] italic text-violet">{signature ? `${signature} · ` : ""}jamais visible par elle</span>
        <button type="button" onClick={() => setEdition(true)} className="outil min-h-[44px] shrink-0">
          Modifier
        </button>
      </div>
    </div>
  );
}

// Relit le transcript et propose trois mots et une station (une minute environ).
export function ProposerMots({ seanceId, dejaPropose }: { seanceId: string; dejaPropose: boolean }) {
  const [enCours, demarrer] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={enCours}
        className="outil text-[12px] disabled:opacity-60"
        onClick={() =>
          demarrer(async () => {
            setMessage("");
            const r = await proposerMots(seanceId);
            setMessage(r.message ?? "");
            if (r.ok) router.refresh();
          })
        }
      >
        {enCours ? "lecture du transcript, une minute environ…" : dejaPropose ? "proposer à nouveau" : "proposer depuis le transcript"}
      </button>
      {message ? (
        <span role="status" className="text-right text-[12px] text-violet">
          {message}
        </span>
      ) : null}
    </span>
  );
}
