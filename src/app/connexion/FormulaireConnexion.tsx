"use client";

import { useActionState, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { connexionMotDePasse, envoyerLien, lienMotDePasse, type EtatConnexion } from "./actions";

// La page de connexion (docs/09, section 5), dans cet ordre : Google, email et mot de passe,
// puis le lien par email en second choix, puis « Créer ou retrouver mon mot de passe ».
// Aucune inscription : une adresse inconnue reçoit un message neutre et n'entre pas.

const TITRE = "font-titre text-[48px] font-semibold leading-[0.92] tracking-[-0.03em] text-creme";
const CHAMP = "min-h-[44px] w-full border-b border-creme/50 bg-transparent pb-3 pt-2.5 text-[18px] text-creme outline-none placeholder:text-creme/45";
const ETIQUETTE = "flex flex-col gap-1.5 text-[14px] text-rose";
const BOUTON = "t-action min-h-[52px] self-start rounded-full bg-rouge px-6 pb-3.5 pt-4 text-[18px] text-creme disabled:opacity-60";
const LIEN = "self-start min-h-[44px] text-left text-[15px] text-creme underline underline-offset-4";

type Vue = "principale" | "lien" | "mot-de-passe";

function Erreur({ etat }: { etat: EtatConnexion }) {
  return etat.statut === "erreur" ? (
    <p role="alert" className="text-[15px] leading-[1.5] text-rose">
      {etat.message}
    </p>
  ) : null;
}

function Envoye({ titre, texte, retour }: { titre: string; texte: string; retour: () => void }) {
  return (
    <div className="flex flex-col gap-[22px]">
      <h1 className={TITRE}>{titre}</h1>
      <p className="t-lecture">{texte}</p>
      <p className="font-italique text-[15px] italic text-rose">
        Rien reçu dans deux minutes ? Regarde les indésirables, ou{" "}
        <button type="button" onClick={retour} className="italic underline">
          recommence
        </button>
        .
      </p>
    </div>
  );
}

function BoutonGoogle({ suite }: { suite?: string }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={enCours}
        onClick={async () => {
          setEnCours(true);
          setErreur("");
          const retour = new URL("/auth/callback", window.location.origin);
          if (suite?.startsWith("/")) retour.searchParams.set("suite", suite);
          const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: retour.toString() } });
          if (error) {
            setEnCours(false);
            setErreur("La connexion avec Google n’est pas disponible pour l’instant. Utilise ton adresse email.");
          }
        }}
        className="flex min-h-[52px] items-center justify-center gap-3 rounded-full bg-creme px-6 font-titre text-[17px] font-semibold text-violet disabled:opacity-60"
      >
        <svg aria-hidden width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.4-4.6 7l7.4 5.7c4.3-4 6.9-9.9 6.9-17.2z" />
          <path fill="#FBBC05" d="M10.6 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l8-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-8 6.1C6.6 42.6 14.6 48 24 48z" />
        </svg>
        {enCours ? "Un instant…" : "Continuer avec Google"}
      </button>
      {erreur ? (
        <p role="alert" className="text-[15px] text-rose">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}

function Principale({ suite, message, vers }: { suite?: string; message?: string; vers: (v: Vue) => void }) {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(connexionMotDePasse, { statut: "idle" });
  return (
    <div className="flex flex-col gap-7">
      <h1 className={TITRE}>Ton espace t’attend.</h1>
      {message ? (
        <p role="alert" className="t-lecture text-rose">
          {message}
        </p>
      ) : null}
      <BoutonGoogle suite={suite} />
      <div className="flex items-center gap-3 text-[14px] text-creme/60" aria-hidden>
        <span className="h-px flex-1 bg-creme/25" />
        ou
        <span className="h-px flex-1 bg-creme/25" />
      </div>
      <form action={action} className="flex flex-col gap-5">
        {suite ? <input type="hidden" name="suite" value={suite} /> : null}
        <label className={ETIQUETTE}>
          ton email
          <input type="email" name="email" required autoComplete="email" inputMode="email" placeholder="prenom@..." className={CHAMP} />
        </label>
        <label className={ETIQUETTE}>
          ton mot de passe
          <input type="password" name="mot_de_passe" required autoComplete="current-password" className={CHAMP} />
        </label>
        <Erreur etat={etat} />
        <button type="submit" disabled={enCours} className={BOUTON}>
          {enCours ? "Un instant…" : "Entrer"}
        </button>
      </form>
      <div className="flex flex-col gap-1 border-t border-creme/20 pt-4">
        <button type="button" onClick={() => vers("lien")} className={LIEN}>
          Recevoir un lien par email, sans mot de passe
        </button>
        <button type="button" onClick={() => vers("mot-de-passe")} className={LIEN}>
          Créer ou retrouver mon mot de passe
        </button>
      </div>
    </div>
  );
}

// Un seul champ email, pour le lien de connexion ou le lien du mot de passe.
function FormulaireEmail({ suite, mode, retour }: { suite?: string; mode: "lien" | "mot-de-passe"; retour: () => void }) {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(mode === "lien" ? envoyerLien : lienMotDePasse, { statut: "idle" });
  const [essai, setEssai] = useState(0);
  if (etat.statut === "envoye") {
    return mode === "lien" ? (
      <Envoye key={essai} titre="C’est parti." texte="Le lien est dans ta boîte mail. Il t’ouvre ton espace en un geste." retour={() => setEssai(essai + 1)} />
    ) : (
      <Envoye titre="Regarde ta boîte mail." texte="Si cette adresse a un espace, un lien t’attend pour choisir ton mot de passe (douze caractères au moins)." retour={retour} />
    );
  }
  return (
    <form action={action} className="flex flex-col gap-7">
      <h1 className={TITRE}>{mode === "lien" ? "Un lien, sans mot de passe." : "Ton mot de passe."}</h1>
      <p className="t-lecture">{mode === "lien" ? "On t’envoie un lien qui ouvre ton espace." : "On t’envoie un lien pour le créer ou en choisir un nouveau."}</p>
      {suite ? <input type="hidden" name="suite" value={suite} /> : null}
      <label className={ETIQUETTE}>
        ton email
        <input type="email" name="email" required autoComplete="email" inputMode="email" placeholder="prenom@..." className={CHAMP} />
      </label>
      <Erreur etat={etat} />
      <button type="submit" disabled={enCours} className={BOUTON}>
        {enCours ? "Un instant…" : mode === "lien" ? "Recevoir mon lien" : "Recevoir le lien"}
      </button>
      <button type="button" onClick={retour} className={LIEN}>
        ← Les autres façons d’entrer
      </button>
    </form>
  );
}

export function FormulaireConnexion({ suite, message }: { suite?: string; message?: string }) {
  const [vue, setVue] = useState<Vue>("principale");
  const [essai, setEssai] = useState(0);
  const retour = () => {
    setVue("principale");
    setEssai((n) => n + 1);
  };
  return vue === "principale" ? <Principale key={essai} suite={suite} message={message} vers={setVue} /> : <FormulaireEmail key={`${vue}-${essai}`} suite={suite} mode={vue} retour={retour} />;
}
