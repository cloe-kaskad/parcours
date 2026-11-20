import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChoixMotDePasse } from "@/app/connexion/ChoixMotDePasse";
import { Logo } from "@/components/espace/Logo";
import { accueilPourRole, getProfil } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choisis ton mot de passe" };
export const viewport: Viewport = { themeColor: "#59114D" };

// Ouverte par le lien « Créer ou retrouver mon mot de passe » (la personne est reconnue par le lien),
// ou par « Changer mon mot de passe » dans « Mon compte » (?depuis=compte).
export default async function MotDePasse({ searchParams }: PageProps<"/mot-de-passe">) {
  const profil = await getProfil();
  if (!profil) redirect("/connexion?erreur=lien");
  const depuisCompte = (await searchParams).depuis === "compte";
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col gap-10 bg-violet px-7 pb-10 pt-7 text-creme">
      <Logo couleur="clair" hauteur={42} />
      <div className="flex flex-col gap-6">
        <h1 className="font-titre text-[44px] font-semibold leading-[0.92] tracking-[-0.03em] text-creme">Choisis ton mot de passe</h1>
        <p className="t-lecture">
          Pour {profil.email}. Huit caractères au moins.
        </p>
        <ChoixMotDePasse />
        <Link href={depuisCompte ? accueilPourRole(profil.role) : "/connexion"} className="inline-flex min-h-[44px] items-center self-start text-[15px] text-creme underline underline-offset-4">
          {depuisCompte ? "Revenir à mon espace" : "Revenir à la connexion"}
        </Link>
      </div>
    </main>
  );
}
