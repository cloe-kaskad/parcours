"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ecrireCarnet } from "@/lib/actions/cliente";
import { avantOuverture, jourEtMois } from "@/lib/dates";
import { Papier } from "./Papier";

type Note = { id: string; date: string; contenu: string };

// Écrire est un geste : fermé, ouvert, ou la note déjà écrite. Tout va au même carnet.
export function GesteEcrire({
  pastille = false,
  entete,
  pratiqueId,
  serieId,
  note,
}: {
  pastille?: boolean;
  entete?: React.ReactNode;
  pratiqueId?: string;
  serieId?: string;
  note?: Note;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState(note?.contenu ?? "");
  const [erreur, setErreur] = useState("");
  const [enCours, demarrer] = useTransition();
  const [date, setDate] = useState("");
  const router = useRouter();

  function ouvrir() {
    setDate(jourEtMois(new Date().toISOString()));
    setErreur("");
    setTexte(note?.contenu ?? "");
    setOuvert(true);
  }

  function garder() {
    const fd = new FormData();
    fd.set("contenu", texte);
    if (note) fd.set("id", note.id);
    if (pratiqueId) fd.set("pratique_id", pratiqueId);
    if (serieId) fd.set("serie_id", serieId);
    demarrer(async () => {
      const r = await ecrireCarnet(fd);
      if (!r.ok) return setErreur(r.message);
      setOuvert(false);
      if (!note) setTexte("");
      router.refresh();
    });
  }

  const feuille = ouvert ? (
    <Papier className="flex flex-col gap-2 p-[18px]">
      <p className="font-italique text-[13px] italic text-violet">{date}</p>
      <textarea
        autoFocus
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Écris ici, ça reste dans ton carnet."
        aria-label="Écrire dans ton carnet"
        rows={4}
        className="min-h-[90px] w-full resize-y rounded-[var(--rayon-papier)] bg-papier-creux p-3.5 text-[16px] leading-[1.55] text-encre outline-none placeholder:text-encre/45"
      />
      {erreur ? (
        <p role="alert" className="text-[13px] text-rouge">
          {erreur}
        </p>
      ) : null}
      <div className="flex min-h-[44px] items-center gap-[18px]">
        <button type="button" onClick={garder} disabled={enCours} className="t-action text-[17px] text-rouge disabled:opacity-50">
          {enCours ? "Un instant…" : "Garder"}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="text-[13px] text-violet">
          annuler
        </button>
      </div>
    </Papier>
  ) : null;

  if (note && !ouvert) {
    return (
      <div className="flex flex-col gap-1.5 rounded-[var(--rayon-papier)] bg-papier-creux p-3.5 text-encre">
        <div className="flex items-baseline justify-between gap-3">
          {avantOuverture(note.date) ? <span /> : <span className="font-italique text-[13px] italic text-violet">{jourEtMois(note.date)}</span>}
          <button type="button" onClick={ouvrir} className="geste-etendu relative text-[12px] text-violet underline">
            modifier
          </button>
        </div>
        <p className="whitespace-pre-line text-[15px] leading-[1.55]">{note.contenu}</p>
      </div>
    );
  }

  if (pastille) {
    return (
      <div className="flex flex-col gap-[18px]">
        <div className="flex items-end justify-between gap-3">
          {entete}
          {ouvert ? null : (
            <button type="button" onClick={ouvrir} className="bouton-rouge">
              Écrire
            </button>
          )}
        </div>
        {feuille}
      </div>
    );
  }

  return (
    feuille ?? (
      <button type="button" onClick={ouvrir} className="t-action min-h-[44px] self-start text-[17px] text-rouge">
        Écrire
      </button>
    )
  );
}
