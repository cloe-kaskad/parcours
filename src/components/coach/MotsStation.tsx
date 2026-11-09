"use client";

import { useState } from "react";
import { validerMots } from "@/lib/actions/seances";
import { FormAction } from "./interactifs";

// Les trois mots et la station : proposés, modifiés, puis validés sur le chemin.
export function MotsStation({ id, valides, station, proposes, stationProposee, prenom }: { id: string; valides: string[]; station: string | null; proposes: string[]; stationProposee: string | null; prenom: string }) {
  const estValide = valides.length > 0 || Boolean(station);
  const [modif, setModif] = useState(false);
  const mots = estValide ? valides : proposes;
  const nom = estValide ? station : stationProposee;
  const aPropos = mots.length > 0 || Boolean(nom);

  return (
    <div className={`mt-2.5 flex flex-col gap-2.5 border-l-[3px] bg-beige px-4 py-3.5 ${estValide ? "border-violet" : "border-rouge"}`}>
      <p className={`font-titre text-[13px] font-semibold ${estValide ? "text-violet" : "text-rouge"}`}>{estValide ? `Validé · sur le chemin de ${prenom}` : aPropos ? "Proposé après lecture du transcript" : "Les mots et la station"}</p>
      {modif || !aPropos ? (
        <FormAction action={validerMots} bouton="Valider" rouge>
          <input type="hidden" name="id" value={id} />
          <div className="grid grid-cols-1 gap-2">
            {[0, 1, 2].map((i) => (
              <label key={i} className="etiquette">
                mot {i + 1}
                <input name={`mot${i + 1}`} defaultValue={mots[i] ?? ""} className="champ" />
              </label>
            ))}
            <label className="etiquette">
              station sur le chemin
              <input name="station" defaultValue={nom ?? ""} className="champ" />
            </label>
          </div>
        </FormAction>
      ) : (
        <>
          <p className="text-[12px] text-violet">Trois mots</p>
          <div className="flex flex-wrap gap-1.5">
            {mots.map((m) => (
              <span key={m} className={estValide ? "mot mot-valide" : "mot"}>
                {m}
              </span>
            ))}
          </div>
          {nom ? (
            <>
              <p className="pt-1 text-[12px] text-violet">Station sur le chemin</p>
              <p className="font-titre text-[18px] font-semibold">{nom}</p>
            </>
          ) : null}
          <div className="flex flex-wrap items-start gap-2.5 pt-1">
            {!estValide ? (
              <FormAction action={validerMots} bouton="Valider" rouge>
                <input type="hidden" name="id" value={id} />
                {[0, 1, 2].map((i) => (
                  <input key={i} type="hidden" name={`mot${i + 1}`} value={mots[i] ?? ""} />
                ))}
                <input type="hidden" name="station" value={nom ?? ""} />
              </FormAction>
            ) : null}
            <button type="button" className="bouton-fantome" onClick={() => setModif(true)}>
              Modifier
            </button>
          </div>
        </>
      )}
    </div>
  );
}
