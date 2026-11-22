import Link from "next/link";
import { RelierGoogle } from "@/app/compte/RelierGoogle";
import { Deconnexion } from "@/components/Deconnexion";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "./Logo";

const LIEN = "inline-flex min-h-[44px] items-center self-start text-[15px] text-creme";

// Le pied de l'espace cliente, avec « Mon compte » (maquette F-v2, état 6) :
// l'adresse, le mot de passe, Google, la déconnexion, puis l'accompagnement et Cloé.
export async function Pied() {
  const { data } = await (await createClient()).auth.getUser();
  const email = data.user?.email ?? "";
  const google = data.user?.identities?.some((i) => i.provider === "google");
  return (
    <footer className="mt-auto bg-violet-nuit px-[22px] pb-12 pt-10 md:px-10">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <Logo couleur="clair" hauteur={39} />
        <section aria-labelledby="mon-compte" className="flex flex-col md:min-w-[320px]">
          <h2 id="mon-compte" className="font-titre text-[22px] font-semibold leading-none text-creme">
            Mon compte
          </h2>
          {email ? <p className="pb-2 pt-1.5 text-[14px] text-rose">{email}</p> : null}
          <div className="flex flex-col border-t border-[var(--filet-violet)] pt-1">
            <Link href="/mot-de-passe?depuis=compte" className={LIEN}>
              Changer mon mot de passe
            </Link>
            {google ? <p className={`${LIEN} text-creme/70`}>Compte Google relié</p> : <RelierGoogle suite="/espace" className={`${LIEN} underline-offset-4`} />}
            <Link href="/espace/installer" className={LIEN}>
              Installer l’application
            </Link>
            <Deconnexion className="text-[15px] text-creme" />
          </div>
          <div className="mt-4 flex flex-col border-t border-[var(--filet-violet)] pt-1">
            <Link href="/espace/a-propos" className={`${LIEN} text-creme/70`}>
              À propos de l’accompagnement
            </Link>
            <a href="mailto:cloe@amarecherche.fr" className={`${LIEN} text-creme/70`}>
              Écrire à Cloé
            </a>
          </div>
        </section>
      </div>
    </footer>
  );
}
