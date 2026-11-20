import Link from "next/link";
import { Deconnexion } from "@/components/Deconnexion";
import { Logo } from "./Logo";

// Le bandeau de l'ordinateur. Sur téléphone, le logo est dans la page et « Se déconnecter » dans le pied.
export function Bandeau({ prenom }: { prenom: string }) {
  return (
    <div className="hidden h-14 items-center justify-between bg-violet-nuit px-10 text-creme md:flex">
      <Logo couleur="clair" hauteur={42} />
      <div className="flex items-center gap-7">
        <Link href="/compte" className="font-italique text-[15px] italic text-rose underline-offset-4 hover:underline" title="Mon compte">
          {prenom}
        </Link>
        <Deconnexion className="text-creme/70" />
      </div>
    </div>
  );
}
