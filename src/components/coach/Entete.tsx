import Link from "next/link";
import { Deconnexion } from "@/components/Deconnexion";
import { Logo } from "@/components/espace/Logo";
import { chargerSelecteur } from "@/lib/db/coach";
import { getProfil } from "@/lib/supabase/server";
import { CommandeRapide } from "./CommandeRapide";
import { SelecteurClientes } from "./SelecteurClientes";

// L'en-tête de tout l'espace équipe (planches H v2, I v3, L v3).
// Téléphone : un retour clair à gauche (ou le logo sur l'accueil), le sélecteur de cliente à droite.
// Ordinateur : logo, Agenda (ou À lire), Bibliothèque, le sélecteur ; le prénom et « Se déconnecter » à droite.
// `cliente` : le prénom affiché sur le sélecteur quand la page concerne une cliente.
export async function Barre({ retour, droite, cliente }: { retour?: { href: string; libelle: string }; droite?: React.ReactNode; cliente?: string }) {
  const profil = await getProfil();
  const estCoach = profil?.role === "coach";
  const choix = await chargerSelecteur(estCoach);
  const accueil = estCoach ? { href: "/coach", libelle: "Agenda" } : { href: "/emilien", libelle: "À lire" };
  const selecteur = <SelecteurClientes libelle={cliente ?? "Clientes"} choix={choix} estCoach={estCoach} />;
  return (
    <header className="bg-violet text-creme">
      <div className="flex min-h-[56px] items-center justify-between gap-3 px-[22px] py-1.5 md:hidden">
        {retour ? (
          <Link href={retour.href} className="t-action inline-flex min-h-[44px] min-w-0 items-center truncate text-[14px] text-creme">
            ← {retour.libelle}
          </Link>
        ) : (
          <Link href={accueil.href} aria-label={accueil.libelle}>
            <Logo couleur="blanc" hauteur={30} />
          </Link>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {droite}
          <Link href="/coach/chercher" className="inline-flex min-h-[44px] items-center rounded-full border border-creme/40 px-3.5 pb-1.5 pt-2 font-titre text-[14px] font-semibold text-creme">
            Chercher
          </Link>
          {selecteur}
        </div>
      </div>
      <div className="hidden min-h-[56px] items-center justify-between gap-6 px-10 md:flex">
        <div className="flex items-center gap-7">
          <Link href={accueil.href} aria-label={accueil.libelle}>
            <Logo couleur="blanc" hauteur={36} />
          </Link>
          {/* Le retour, aussi sur ordinateur, quand il mène ailleurs qu'à l'accueil. */}
          {retour && retour.href !== accueil.href ? (
            <Link href={retour.href} className="t-action inline-flex min-h-[44px] items-center text-[14px] text-creme">
              ← {retour.libelle}
            </Link>
          ) : null}
          <Link href={accueil.href} className="t-action inline-flex min-h-[44px] items-center text-[14px] text-creme">
            {accueil.libelle}
          </Link>
          <Link href="/coach/ressources" className="t-action inline-flex min-h-[44px] items-center text-[14px] text-creme">
            Bibliothèque
          </Link>
          {selecteur}
          <CommandeRapide choix={choix} estCoach={estCoach} />
        </div>
        <div className="flex items-center gap-6">
          {droite}
          {profil ? <span className="font-italique text-[14px] italic text-rose">{profil.prenom}</span> : null}
          <Deconnexion className="text-[14px] text-creme/75" />
        </div>
      </div>
    </header>
  );
}

