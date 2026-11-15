"use client";

import { useState, useTransition } from "react";
import { ecrireEchange } from "@/lib/actions/echanges";
import { jourEtMoisCourt } from "@/lib/dates";

export type Message = { id: string; prenom: string; texte: string; created_at: string };

// La voix de l'équipe (planche trois-voix) : pas de fond, une note en marge, l'initiale en pastille violet nuit.
export function VoixEquipe({ m, etiquette }: { m: Message; etiquette?: string }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-nuit font-titre text-[14px] font-semibold text-rose">
        {m.prenom.charAt(0)}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-titre text-[14px] font-semibold text-violet-nuit">
          {m.prenom} <span className="font-sans font-normal opacity-75">· {etiquette ? `${etiquette} · ` : ""}{jourEtMoisCourt(m.created_at)}</span>
        </span>
        <p className="m-0 whitespace-pre-line text-[15px] leading-[1.6] text-violet-nuit">{m.texte}</p>
      </div>
    </div>
  );
}

// Un fil court entre Cloé et Émilien (ou une remarque sous un exercice).
export function FilEchanges({ seanceId, pratiqueId = null, messages, invite = "Répondre…", etiquette }: { seanceId: string; pratiqueId?: string | null; messages: Message[]; invite?: string; etiquette?: string }) {
  const [texte, setTexte] = useState("");
  const [message, setMessage] = useState("");
  const [enCours, demarrer] = useTransition();
  return (
    <div className="flex flex-col gap-1">
      {messages.map((m) => (
        <VoixEquipe key={m.id} m={m} etiquette={etiquette} />
      ))}
      <form
        className="flex items-end gap-2 pt-1"
        onSubmit={(e) => {
          e.preventDefault();
          demarrer(async () => {
            const r = await ecrireEchange(seanceId, pratiqueId, texte);
            if (r.ok) setTexte("");
            setMessage(r.ok ? "" : (r.message ?? ""));
          });
        }}
      >
        <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={1} aria-label={invite} placeholder={invite} className="champ-zone min-h-[44px] flex-1 resize-y py-2.5 text-[15px]" />
        <button type="submit" disabled={enCours || !texte.trim()} className="bouton-fantome shrink-0 disabled:opacity-50">
          Envoyer
        </button>
      </form>
      {message ? (
        <p role="status" className="m-0 text-[14px] text-rouge">
          {message}
        </p>
      ) : null}
    </div>
  );
}
