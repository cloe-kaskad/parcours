"use client";

import { useEffect, useState } from "react";
import { GuideIphone } from "@/components/espace/GuideIphone";
import { EVENEMENT, estInstallee, installer, plateforme, type Plateforme } from "@/lib/installation";

export function Installation() {
  const [etat, setEtat] = useState<{ pret: boolean; installee: boolean; ou: Plateforme; bouton: boolean }>({ pret: false, installee: false, ou: "ordinateur", bouton: false });
  useEffect(() => {
    const calculer = () => setEtat({ pret: true, installee: estInstallee(), ou: plateforme(), bouton: Boolean(window.invitationInstallation) });
    const t = setTimeout(calculer, 0);
    window.addEventListener(EVENEMENT, calculer);
    return () => {
      clearTimeout(t);
      window.removeEventListener(EVENEMENT, calculer);
    };
  }, []);
  if (!etat.pret) return null;
  if (etat.installee) return <p className="t-lecture text-rose">C’est fait : tu es dans l’application.</p>;

  return (
    <div className="flex flex-col gap-8">
      {etat.ou !== "android" ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-titre text-[24px] font-semibold leading-none text-creme">Sur iPhone</h2>
          {etat.ou === "iphone-autre" ? <p className="text-[15px] leading-[1.5] text-rose">Tu es dans un autre navigateur que Safari : copie l’adresse de cette page et ouvre-la dans Safari.</p> : null}
          <GuideIphone />
        </section>
      ) : null}
      {etat.ou !== "iphone-safari" && etat.ou !== "iphone-autre" ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-titre text-[24px] font-semibold leading-none text-creme">Sur Android</h2>
          {etat.bouton ? (
            <button type="button" onClick={() => installer().then(() => setEtat((e) => ({ ...e, bouton: false })))} className="bouton-rouge self-start">
              Installer l’application
            </button>
          ) : (
            <p className="text-[15px] leading-[1.5] text-creme/90">Dans Chrome, touche le menu « ⋮ » en haut à droite, puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».</p>
          )}
        </section>
      ) : null}
      <p className="text-[14px] leading-[1.5] text-creme/70">Une fois installée, connecte-toi une première fois dans l’application : elle garde ensuite ta session, sans te redemander de te connecter.</p>
    </div>
  );
}
