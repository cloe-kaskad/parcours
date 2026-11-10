import Link from "next/link";
import { Deconnexion } from "@/components/Deconnexion";
import { Logo } from "./Logo";

export function Pied() {
  return (
    <footer className="mt-auto flex flex-col items-start gap-1 bg-violet-nuit px-[22px] pb-12 pt-10 md:px-10">
      <Logo couleur="blanc" hauteur={39} />
      <Link href="/espace/a-propos" className="py-2 text-[13px] text-creme/70">
        À propos de l’accompagnement
      </Link>
      <a href="mailto:cloe@amarecherche.fr" className="py-2 text-[13px] text-creme/70">
        Écrire à Cloé
      </a>
      <Deconnexion className="text-creme/70" />
    </footer>
  );
}
