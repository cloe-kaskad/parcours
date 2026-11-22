import { EnteteSousPage } from "@/components/espace/EnteteSousPage";
import { Installation } from "./Installation";

export const metadata = { title: "Installer l’application" };

// L'accès permanent à l'installation, depuis « Mon compte ».
export default function PageInstaller() {
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-7 px-[22px] pb-16">
      <EnteteSousPage />
      <h1 className="font-titre text-[44px] font-semibold leading-[0.92] tracking-[-0.03em] text-creme">Ton espace, comme une application</h1>
      <p className="t-lecture">Une icône sur ton écran d’accueil : ton espace s’ouvre en plein écran, et tu restes connectée.</p>
      <Installation />
    </div>
  );
}
