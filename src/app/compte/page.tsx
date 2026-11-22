import Link from "next/link";
import { redirect } from "next/navigation";
import { Deconnexion } from "@/components/Deconnexion";
import { accueilPourRole, createClient, getProfil } from "@/lib/supabase/server";
import { RelierGoogle } from "./RelierGoogle";

export const metadata = { title: "Mon compte" };

// « Mon compte », pour les trois rôles : comment j'entre (Google, mot de passe), et le choix du mot de passe.
export default async function MonCompte({ searchParams }: PageProps<"/compte">) {
  const profil = await getProfil();
  if (!profil) redirect("/connexion?suite=/compte");
  const q = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const google = data.user?.identities?.find((i) => i.provider === "google");
  const adresseGoogle = (google?.identity_data?.email as string | undefined) ?? null;

  return (
    <div className="papier papier-page flex min-h-dvh flex-1 flex-col">
      <div className="sticky top-[env(safe-area-inset-top)] z-30 border-b border-[var(--filet-papier)] bg-papier/95">
        <div className="mx-auto flex h-[52px] w-full max-w-[640px] items-center justify-between px-6">
          <Link href={accueilPourRole(profil.role)} className="inline-flex min-h-[44px] items-center font-titre text-[16px] font-semibold text-violet">
            ← {profil.role === "cliente" ? "Mon espace" : "Retour"}
          </Link>
          <Deconnexion className="text-violet" />
        </div>
      </div>
      <main className="mx-auto flex w-full max-w-[640px] flex-col gap-10 px-6 pb-16 pt-8">
        <header className="flex flex-col gap-2">
          <h1 className="t-page text-violet">Mon compte</h1>
          <p className="text-[15px] text-violet">{profil.email}</p>
        </header>

        {q.mot_de_passe === "ok" ? (
          <p role="status" className="carte-blanche rounded-l-none border-l-[3px] border-l-rose px-4 py-3 text-[15px]">
            Ton mot de passe est enregistré. La prochaine fois, entre avec ton adresse et ce mot de passe.
          </p>
        ) : null}
        {q.google === "relie" ? (
          <p role="status" className="carte-blanche rounded-l-none border-l-[3px] border-l-rose px-4 py-3 text-[15px]">
            {adresseGoogle ? `Ton compte Google (${adresseGoogle}) est relié.` : "Le lien avec Google n’a pas abouti. Réessaie dans un instant."}
          </p>
        ) : null}

        <section className="flex flex-col gap-3">
          <h2 className="font-titre text-[24px] font-semibold leading-none text-violet">Google</h2>
          {adresseGoogle ? (
            <p className="text-[16px] leading-[1.6]">Tu peux entrer avec « Continuer avec Google » : ton compte Google <strong className="font-semibold">{adresseGoogle}</strong> est relié.</p>
          ) : (
            <>
              <p className="text-[16px] leading-[1.6]">Pour entrer d’un geste avec « Continuer avec Google », relie ton compte Google, même si son adresse n’est pas celle-ci.</p>
              <RelierGoogle />
            </>
          )}
        </section>

        <section className="flex flex-col gap-4 border-t border-[var(--filet-papier)] pt-8">
          <h2 className="font-titre text-[24px] font-semibold leading-none text-violet">Créer ou changer mon mot de passe</h2>
          <p className="text-[16px] leading-[1.6]">Pour entrer avec ton adresse et un mot de passe, sans passer par ta boîte mail. Personne d’autre que toi ne le voit.</p>
          <Link href="/mot-de-passe?depuis=compte" className="bouton-fantome inline-flex items-center self-start">
            Changer mon mot de passe
          </Link>
        </section>
      </main>
    </div>
  );
}
