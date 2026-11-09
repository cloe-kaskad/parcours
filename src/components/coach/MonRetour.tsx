"use client";

import { useState, useTransition } from "react";
import { enregistrerRetour, envoyerRetour } from "@/lib/actions/retours";

export function MonRetour({ seanceId, prenom, initial, urlInitiale, motInitial, dejaEnvoye }: { seanceId: string; prenom: string; initial: string; urlInitiale: string; motInitial: string; dejaEnvoye: boolean }) {
  const [contenu, setContenu] = useState(initial);
  const [url, setUrl] = useState(urlInitiale);
  const [mot, setMot] = useState(motInitial);
  const [envoye, setEnvoye] = useState(dejaEnvoye);
  const [edition, setEdition] = useState(!dejaEnvoye);
  const [message, setMessage] = useState("");
  const [enCours, demarrer] = useTransition();
  const saisie = { seanceId, contenu, url, mot };

  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-titre text-[26px] font-semibold tracking-[-0.02em] text-violet">Mon retour</h2>
        <span className="font-italique text-[12px] italic text-violet/80">invisible pour {prenom}</span>
      </div>
      <textarea aria-label="Mon retour" value={contenu} readOnly={!edition} onChange={(e) => setContenu(e.target.value)} className="champ-zone min-h-[200px] resize-y" />
      <p className="text-[12px] text-violet/70">Markdown accepté. Modifiable après envoi.</p>
      {edition ? (
        <div className="flex flex-col gap-2 pt-1.5">
          <p className="text-[12px] text-violet">Proposer une ressource à Cloé (facultatif)</p>
          <input type="url" aria-label="Un lien" placeholder="un lien" value={url} onChange={(e) => setUrl(e.target.value)} className="champ text-[15px]!" />
          <input type="text" aria-label="Un mot, pour dire pourquoi" placeholder="un mot, pour dire pourquoi" value={mot} onChange={(e) => setMot(e.target.value)} className="champ text-[15px]!" />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-[18px] pt-2.5">
        {edition ? (
          <>
            <button
              type="button"
              disabled={enCours}
              className="bouton-rouge disabled:opacity-50"
              onClick={() =>
                demarrer(async () => {
                  const r = await envoyerRetour(saisie);
                  if (!r.ok) return setMessage(r.message);
                  setMessage("");
                  setEnvoye(true);
                  setEdition(false);
                })
              }
            >
              {envoye ? "Enregistrer mes corrections" : "Envoyer à Cloé"}
            </button>
            {!envoye ? (
              <button
                type="button"
                disabled={enCours}
                className="t-action min-h-[44px] text-[15px] text-violet disabled:opacity-50"
                onClick={() =>
                  demarrer(async () => {
                    const r = await enregistrerRetour(saisie);
                    setMessage(r.message ?? "");
                  })
                }
              >
                Enregistrer
              </button>
            ) : null}
          </>
        ) : (
          <>
            <span className="font-titre text-[16px] font-semibold text-violet">Envoyé. Cloé est prévenue.</span>
            <button type="button" className="t-action min-h-[44px] text-[15px] text-violet" onClick={() => setEdition(true)}>
              modifier
            </button>
          </>
        )}
        {message ? (
          <span role="status" className="text-[13px] text-violet">
            {message}
          </span>
        ) : null}
      </div>
    </section>
  );
}
