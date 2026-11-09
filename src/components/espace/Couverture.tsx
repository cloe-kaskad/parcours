import Image from "next/image";
import { Logo } from "./Logo";

export function Couverture({ url, prenom }: { url: string; prenom: string }) {
  return (
    <div className="entree-couverture relative h-[540px] overflow-hidden bg-violet-nuit md:h-[600px]">
      <Image src={url} alt="Couverture choisie par Cloé" fill unoptimized priority className="object-cover md:object-[50%_40%]" />
      <div className="absolute inset-x-0 bottom-0 h-[180px] bg-gradient-to-b from-violet-nuit/0 to-violet-nuit md:h-[220px]" />
      <div className="absolute left-[22px] top-[22px] md:hidden">
        <Logo couleur="violet" hauteur={36} />
      </div>
      <h1 className="t-couverture absolute bottom-7 left-[22px] text-creme md:bottom-11 md:left-10">{prenom}</h1>
    </div>
  );
}
