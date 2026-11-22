import type { Metadata, Viewport } from "next";
import { Logo } from "@/components/espace/Logo";
import { PagesGardees } from "./PagesGardees";

export const metadata: Metadata = { title: "Pas de réseau" };
export const viewport: Viewport = { themeColor: "#59114D" };

// Montrée par le service worker quand il n'y a pas de réseau et que la page demandée n'a pas été gardée.
export default function HorsLigne() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col gap-10 bg-violet px-7 pb-[max(40px,env(safe-area-inset-bottom))] pt-[max(28px,env(safe-area-inset-top))] text-creme">
      <Logo couleur="clair" hauteur={42} />
      <div className="flex flex-col gap-5">
        <h1 className="font-titre text-[44px] font-semibold leading-[0.92] tracking-[-0.03em]">Pas de réseau pour l’instant.</h1>
        <p className="t-lecture">Tu peux relire ce que tu as ouvert récemment. Pour écrire, attends le retour du réseau.</p>
        <PagesGardees />
      </div>
    </main>
  );
}
