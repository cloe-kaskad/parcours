"use client";

import { useState, useTransition } from "react";
import { enregistrerRetour, envoyerRetour, importerDocument, importerGoogleDoc } from "@/lib/actions/retours";
import { createClient } from "@/lib/supabase/client";
import { TexteLecture } from "@/components/coach/TexteLecture";

const TYPE_WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
type Conversion = Awaited<ReturnType<typeof importerDocument>>;

function bilan(r: Extract<Conversion, { ok: true }>) {
  const images = r.images ? (r.images > 1 ? `, avec ses ${r.images} images` : ", avec son image") : "";
  const oubli = r.oubliees ? ` ${r.oubliees > 1 ? `${r.oubliees} images n’ont` : "Une image n’a"} pas pu être reprise${r.oubliees > 1 ? "s" : ""} (format inhabituel) : ajoute-la en PNG ou JPEG dans ton document et réimporte.` : "";
  return `Document importé${images}. Relis ci-dessous, puis envoie à Cloé.${oubli}`;
}

// Retour écrit dans Word ou Google Docs : le fichier, ou le lien du Google Doc.
function Importer({ seanceId, remplace, recu }: { seanceId: string; remplace: boolean; recu: (texte: string, message: string) => void }) {
  const [lien, setLien] = useState("");
  const [etat, setEtat] = useState("");
  const [enCours, demarrer] = useTransition();
  const accord = () => !remplace || window.confirm("Le texte du document remplacera ce qui est écrit dans le champ. On continue ?");
  const fin = (r: Conversion) => (r.ok ? (setEtat(""), setLien(""), recu(r.texte, bilan(r))) : setEtat(r.message));

  const fichier = (f: File | undefined) => {
    if (!f) return;
    if (!/\.docx$/i.test(f.name)) return setEtat("Il faut un document Word en .docx. Depuis Google Docs : Fichier, Télécharger, Microsoft Word.");
    if (!accord()) return;
    setEtat("Lecture du document…");
    demarrer(async () => {
      const chemin = `imports/${seanceId}/${Date.now()}.docx`;
      const { error } = await createClient().storage.from("retours").upload(chemin, f, { contentType: TYPE_WORD });
      if (error) return setEtat(navigator.onLine ? "Le document n’a pas pu être déposé. Réessaie dans un instant." : "Pas de réseau pour l’instant : réessaie une fois connecté.");
      fin(await importerDocument(seanceId, chemin));
    });
  };

  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] border border-[var(--filet-papier-fort)] bg-white px-4 py-3.5">
      <p className="text-[14px] text-violet">Tu as écrit ton retour dans Word ou Google Docs ? Importe-le, images comprises.</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className={`bouton-fantome inline-flex min-h-[44px] cursor-pointer items-center ${enCours ? "pointer-events-none opacity-50" : ""}`}>
          Déposer un document Word
          <input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" disabled={enCours} onChange={(e) => (fichier(e.target.files?.[0]), (e.target.value = ""))} />
        </label>
      </div>
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!lien.trim() || !accord()) return;
          setEtat("Lecture du Google Doc…");
          demarrer(async () => fin(await importerGoogleDoc(seanceId, lien)));
        }}
      >
        <input type="url" aria-label="Le lien du Google Doc" placeholder="ou le lien du Google Doc" value={lien} onChange={(e) => setLien(e.target.value)} className="champ min-w-0 flex-1 text-[15px]!" />
        <button type="submit" disabled={enCours || !lien.trim()} className="t-action min-h-[44px] text-[15px] text-violet disabled:opacity-50">
          Importer
        </button>
      </form>
      {etat ? (
        <p role="status" className="text-[14px] text-violet">
          {etat}
        </p>
      ) : null}
    </div>
  );
}

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
        <span className="font-italique text-[14px] italic text-violet/80">invisible pour {prenom}</span>
      </div>
      <textarea aria-label="Mon retour" value={contenu} readOnly={!edition} onChange={(e) => setContenu(e.target.value)} className="champ-zone min-h-[200px] resize-y" />
      <p className="text-[14px] text-violet/70">Markdown accepté. Modifiable après envoi.</p>
      {contenu.includes("](/api/fichier") ? (
        <details open className="rounded-[14px] bg-white px-4 py-3.5">
          <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-titre text-[14px] font-semibold text-violet underline underline-offset-[3px]">Aperçu, avec les images</summary>
          <TexteLecture className="pt-2">{contenu}</TexteLecture>
        </details>
      ) : null}
      {edition ? (
        <Importer
          seanceId={seanceId}
          remplace={Boolean(contenu.trim())}
          recu={(texte, m) => {
            setContenu(texte);
            setMessage(m);
          }}
        />
      ) : null}
      {edition ? (
        <div className="flex flex-col gap-2 pt-1.5">
          <p className="text-[14px] text-violet">Proposer une ressource à Cloé (facultatif)</p>
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
          <span role="status" className="text-[14px] text-violet">
            {message}
          </span>
        ) : null}
      </div>
    </section>
  );
}
