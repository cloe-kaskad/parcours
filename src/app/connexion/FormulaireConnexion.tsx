"use client";

import { useActionState, useState } from "react";
import { envoyerLien, type EtatConnexion } from "./actions";

const TITRE = "font-titre text-[54px] font-semibold leading-[0.92] tracking-[-0.03em] text-creme";

export function LienEnvoye({ renvoyer }: { renvoyer: () => void }) {
  return (
    <div className="flex flex-col gap-[22px]">
      <h1 className={TITRE}>C’est parti.</h1>
      <p className="t-lecture">Le lien est dans ta boîte mail. Il t’ouvre ton espace en un geste, pas de mot de passe à retenir.</p>
      <p className="font-italique text-[15px] italic text-rose">
        Rien reçu dans deux minutes ? Regarde les indésirables, ou{" "}
        <button type="button" onClick={renvoyer} className="italic underline">
          renvoie-le
        </button>
        .
      </p>
    </div>
  );
}

function Formulaire({ suite, lienExpire, renvoyer }: { suite?: string; lienExpire: boolean; renvoyer: () => void }) {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(envoyerLien, { statut: "idle" });

  if (etat.statut === "envoye") return <LienEnvoye renvoyer={renvoyer} />;

  return (
    <form action={action} className="flex flex-col gap-7">
      <h1 className={TITRE}>Ton espace t’attend.</h1>
      {suite ? <input type="hidden" name="suite" value={suite} /> : null}
      {lienExpire ? (
        <p role="alert" className="t-lecture text-rose">
          Ce lien n’est plus valable. Demande-en un nouveau.
        </p>
      ) : null}
      <label className="flex flex-col gap-1.5 text-[13px] text-rose">
        ton email
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="prenom@..."
          className="min-h-[44px] w-full border-b border-creme/50 bg-transparent pb-3 pt-2.5 text-[18px] text-creme outline-none placeholder:text-creme/45"
        />
      </label>
      {etat.statut === "erreur" ? (
        <p role="alert" className="text-[15px] text-rose">
          {etat.message}
        </p>
      ) : null}
      <button type="submit" disabled={enCours} className="t-action min-h-[52px] self-start rounded-full bg-rouge px-6 pb-3.5 pt-4 text-[18px] text-creme disabled:opacity-60">
        {enCours ? "Un instant…" : "Recevoir mon lien"}
      </button>
    </form>
  );
}

export function FormulaireConnexion({ suite, lienExpire = false }: { suite?: string; lienExpire?: boolean }) {
  // Changer la clé remet le formulaire à zéro pour renvoyer un lien.
  const [essai, setEssai] = useState(0);
  return <Formulaire key={essai} suite={suite} lienExpire={lienExpire} renvoyer={() => setEssai((n) => n + 1)} />;
}
