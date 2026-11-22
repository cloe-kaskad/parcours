"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EVENEMENT, estInstallee, installer, plateforme, refuser, refuseeRecemment, type Plateforme } from "@/lib/installation";

// L'invitation à installer, côté cliente seulement : discrète, refusable, absente si l'application est
// déjà installée, et pas avant un mois après un refus. Android : le bouton du navigateur. iPhone : le guide.
export function InvitationInstallation() {
  const [etat, setEtat] = useState<{ visible: boolean; ou: Plateforme; bouton: boolean }>({ visible: false, ou: "ordinateur", bouton: false });

  useEffect(() => {
    const calculer = () => {
      const ou = plateforme();
      const bouton = Boolean(window.invitationInstallation);
      const visible = !estInstallee() && !refuseeRecemment() && (ou === "iphone-safari" || ou === "iphone-autre" || (ou === "android" && bouton));
      setEtat({ visible, ou, bouton });
    };
    const t = setTimeout(calculer, 0);
    window.addEventListener(EVENEMENT, calculer);
    return () => {
      clearTimeout(t);
      window.removeEventListener(EVENEMENT, calculer);
    };
  }, []);

  if (!etat.visible) return null;
  const pasMaintenant = () => {
    refuser();
    setEtat((e) => ({ ...e, visible: false }));
  };

  return (
    <aside aria-label="Installer l’application" className="mx-3.5 mb-10 mt-12 flex flex-col gap-2.5 rounded-[10px] border border-[var(--filet-violet)] px-[18px] py-4 md:mx-auto md:w-full md:max-w-[1200px]">
      <p className="font-titre text-[18px] font-semibold leading-[1.15] text-creme">Ton espace, comme une application</p>
      <p className="text-[15px] leading-[1.5] text-creme/85">Une icône sur ton écran d’accueil, et ton espace s’ouvre en plein écran, sans repasser par le navigateur.</p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        {etat.ou === "android" ? (
          <button type="button" onClick={async () => {
              setEtat((e) => ({ ...e, visible: false }));
              await installer();
            }} className="bouton-rouge">
            Installer
          </button>
        ) : (
          <Link href="/espace/installer" className="bouton-rouge inline-flex items-center">
            Voir comment
          </Link>
        )}
        <button type="button" onClick={pasMaintenant} className="inline-flex min-h-[44px] items-center text-[15px] text-creme/80 underline underline-offset-4">
          Pas maintenant
        </button>
      </div>
    </aside>
  );
}
