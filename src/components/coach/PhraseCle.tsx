"use client";

import { useActionState, useState, useTransition } from "react";
import { proposerPhraseCle, validerPhraseCle } from "@/lib/actions/retours";

type Props = {
  retourId: string;
  // false tant que la migration 0006 n'est pas appliquée : on montre seulement le début du retour.
  disponible: boolean;
  phrase: string | null;
  points: string[];
  phraseProposee: string | null;
  pointsProposes: string[];
  apercu: string;
};

// La phrase clé et les trois points du retour d'Émilien, sur la carte violet nuit.
// Validés : ils s'affichent. Proposés : à valider ou corriger. Rien : le début du retour.
export function PhraseCle({ retourId, disponible, phrase, points, phraseProposee, pointsProposes, apercu }: Props) {
  const valide = Boolean(phrase?.trim()) || points.length > 0;
  const propose = !valide && (Boolean(phraseProposee?.trim()) || pointsProposes.length > 0);
  const [edition, setEdition] = useState(false);
  const [message, setMessage] = useState("");
  const [enCours, demarrer] = useTransition();
  const [etat, envoyer, envoi] = useActionState(validerPhraseCle, null);

  const montree = valide ? { phrase, points } : propose ? { phrase: phraseProposee, points: pointsProposes } : null;

  if (edition) {
    return (
      <form
        action={async (fd) => {
          await envoyer(fd);
          setEdition(false);
        }}
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="id" value={retourId} />
        <label className="flex flex-col gap-1 text-[13px] text-rose">
          phrase clé
          <input name="phrase" defaultValue={montree?.phrase ?? ""} className="min-h-[44px] border-b border-creme/40 bg-transparent py-2 font-titre text-[19px] font-semibold text-creme outline-none" />
        </label>
        {[0, 1, 2].map((i) => (
          <label key={i} className="flex flex-col gap-1 text-[13px] text-rose">
            point {i + 1}
            <input name={`point${i + 1}`} defaultValue={montree?.points[i] ?? ""} className="min-h-[44px] border-b border-creme/40 bg-transparent py-2 text-[15px] text-creme outline-none" />
          </label>
        ))}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" disabled={envoi} className="bouton-rouge disabled:opacity-50">
            {envoi ? "Un instant…" : "Valider"}
          </button>
          <button type="button" onClick={() => setEdition(false)} className="aller text-[15px] text-rose">
            Annuler
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {montree ? (
        <>
          {propose ? <p className="m-0 font-titre text-[13px] font-semibold text-rose">Proposé depuis le retour, à valider</p> : null}
          {montree.phrase?.trim() ? <p className="m-0 font-titre text-[25px] font-semibold leading-[1.08] tracking-[-0.02em] text-creme">{montree.phrase}</p> : null}
          {montree.points.length ? (
            <ul className="m-0 flex flex-col gap-0.5 pl-[18px] text-[15px] leading-[1.6] text-creme/90">
              {montree.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <p className="m-0 line-clamp-5 text-[15px] leading-[1.6] text-creme/90">{apercu}</p>
      )}
      {disponible ? (
        <div className="flex flex-wrap items-center gap-x-4">
          {propose ? (
            <form action={envoyer}>
              <input type="hidden" name="id" value={retourId} />
              <input type="hidden" name="phrase" value={phraseProposee ?? ""} />
              {[0, 1, 2].map((i) => (
                <input key={i} type="hidden" name={`point${i + 1}`} value={pointsProposes[i] ?? ""} />
              ))}
              <button type="submit" disabled={envoi} className="aller text-[15px] text-rose underline underline-offset-[3px] disabled:opacity-50">
                Valider
              </button>
            </form>
          ) : null}
          {montree ? (
            <button type="button" onClick={() => setEdition(true)} className="aller text-[15px] text-rose underline underline-offset-[3px]">
              {valide ? "Modifier la phrase clé" : "Corriger"}
            </button>
          ) : (
            <button
              type="button"
              disabled={enCours}
              onClick={() =>
                demarrer(async () => {
                  const r = await proposerPhraseCle(retourId);
                  setMessage(r.message ?? "");
                })
              }
              className="aller text-[15px] text-rose underline underline-offset-[3px] disabled:opacity-50"
            >
              {enCours ? "Lecture du retour…" : "Proposer la phrase clé"}
            </button>
          )}
        </div>
      ) : null}
      {message || etat?.message ? (
        <p role="status" className="m-0 text-[14px] text-rose">
          {message || etat?.message}
        </p>
      ) : null}
    </div>
  );
}
