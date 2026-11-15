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
  surPapier = false,
  placeholder = "Écris ici, ça reste dans ton carnet.",
  choixAborder = false,
  aAborder = false,
}: {
  pastille?: boolean;
  entete?: React.ReactNode;
  pratiqueId?: string;
  serieId?: string;
  note?: Note;
  // Sur une page déjà en papier, la feuille ouverte est le creux, sans second papier autour.
  surPapier?: boolean;
  placeholder?: string;
  choixAborder?: boolean;
  aAborder?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState(note?.contenu ?? "");
  const [marque, setMarque] = useState(aAborder);
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
    if (marque) fd.set("a_aborder", "on");
    demarrer(async () => {
      const r = await ecrireCarnet(fd);
      if (!r.ok) return setErreur(r.message);
      setOuvert(false);
      if (!note) {
        setTexte("");
        setMarque(aAborder);
      }
      router.refresh();
    });
  }

  const actions = (
    <div className="flex min-h-[44px] items-center gap-[18px]">
      <button type="button" onClick={garder} disabled={enCours} className="t-action text-[17px] text-rouge disabled:opacity-50">
        {enCours ? "Un instant…" : "Garder"}
      </button>
      <button type="button" onClick={() => setOuvert(false)} className="text-[14px] text-violet">
        annuler
      </button>
    </div>
  );

  const zone = (
    <>
      <p className="font-italique text-[14px] italic text-violet">{date}</p>
      <textarea
        autoFocus
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder={placeholder}
        aria-label="Écrire dans ton carnet"
        rows={4}
        className={`w-full resize-y text-[16px] leading-[1.6] text-encre outline-none placeholder:text-encre/45 ${surPapier ? "min-h-[120px] bg-transparent" : "min-h-[90px] rounded-[var(--rayon-papier)] border border-carte-filet bg-carte p-3.5"}`}
      />
      {erreur ? (
        <p role="alert" className="text-[14px] text-rouge">
          {erreur}
        </p>
      ) : null}
      {choixAborder ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" aria-pressed={marque} onClick={() => setMarque(!marque)} className={`min-h-[44px] font-titre text-[14px] font-semibold ${marque ? "text-rouge" : "text-violet/45"}`}>
            ● à aborder en séance
          </button>
          {actions}
        </div>
      ) : (
        actions
      )}
    </>
  );

  const feuille = ouvert ? (
    surPapier ? (
      <div className="carte-blanche flex flex-col gap-1.5 px-[18px] py-4">{zone}</div>
    ) : (
      <Papier className="flex flex-col gap-2 p-[18px]">{zone}</Papier>
    )
  ) : null;

  if (note && !ouvert) {
    return (
      <div className="carte-blanche flex flex-col gap-1.5 rounded-l-none border-l-[3px] border-l-rose px-[18px] py-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-titre text-[14px] font-semibold text-violet">
            Tu as écrit{avantOuverture(note.date) ? "" : <span className="font-sans font-normal opacity-85"> · {jourEtMois(note.date)}</span>}
          </span>
          <button type="button" onClick={ouvrir} className="geste-etendu relative text-[14px] text-violet underline">
            modifier
          </button>
        </div>
        <p className="whitespace-pre-line text-[16px] leading-[1.6]">{note.contenu}</p>
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

  // Au repos, la zone est déjà là : on voit où écrire, « Écrire » en rouge à droite (planche ecrire-cote-cliente).
  return (
    feuille ?? (
      <button type="button" onClick={ouvrir} className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-[6px] border border-dashed border-violet/35 bg-carte px-4 py-3.5 text-left">
        <span className="text-[16px] text-violet/75">{placeholder}</span>
        <span className="shrink-0 font-titre text-[15px] font-semibold text-rouge">Écrire</span>
      </button>
    )
  );
}
