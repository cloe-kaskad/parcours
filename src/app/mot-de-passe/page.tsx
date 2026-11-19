import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { ChoixMotDePasse } from "@/app/connexion/ChoixMotDePasse";
import { Logo } from "@/components/espace/Logo";
import { getProfil } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mon mot de passe" };
export const viewport: Viewport = { themeColor: "#59114D" };

// Ouverte par le lien « Créer ou retrouver mon mot de passe » : la personne est déjà reconnue par le lien.
export default async function MotDePasse() {
  const profil = await getProfil();
  if (!profil) redirect("/connexion?erreur=lien");
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col gap-10 bg-violet px-7 pb-10 pt-7 text-creme">
      <Logo couleur="blanc" hauteur={42} />
      <div className="flex flex-col gap-6">
        <h1 className="font-titre text-[44px] font-semibold leading-[0.92] tracking-[-0.03em] text-creme">Ton mot de passe.</h1>
        <p className="t-lecture">Choisis-le maintenant. Ensuite, tu entres avec ton adresse et ce mot de passe, sans passer par ta boîte mail.</p>
        <ChoixMotDePasse />
      </div>
    </main>
  );
}
